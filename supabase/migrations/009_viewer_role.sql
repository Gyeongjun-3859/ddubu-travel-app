-- 공유 여행 '보기 전용' 권한 + 공유 관련 보안 구멍 정리.
--
-- 1) 보기 전용: travel_state.viewer_users(보기 전용 참여자 아이디 목록, shared_users의 일부)
--    보기 전용 참여자는 여행을 읽을 수만 있고, 수정·사진 올리기는 서버에서 막힌다.
-- 2) 보안 구멍:
--    - 수정 규칙이 with check (true)라, 참여자가 직접 요청하면 주인·참여자 목록을 바꿀 수 있었다
--      → 주인이 아니면 owner_app_user_id / shared_users / viewer_users / archived / finish_date / trip_name 변경 금지(트리거)
--    - send_invite가 주인 여부를 확인하지 않아 남의 여행으로도 초대장을 보낼 수 있었다 → 주인·편집 참여자만
--    - accept_trip_invite가 초대장 존재를 확인하지 않아 여행 id만 알면 참여할 수 있었다 → 초대장 필수
-- 나가기·수락처럼 본인이 참여자 목록을 바꿔야 하는 일은 서버 함수 안에서만 허용(app.trusted 표시).
-- Supabase 대시보드 SQL Editor에서 전체 실행하세요.

alter table travel_state add column if not exists viewer_users jsonb not null default '[]'::jsonb;
alter table invites add column if not exists role text not null default 'editor';

-- 로그인한 사람의 앱 아이디
create or replace function public.current_app_user_id()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select app_user_id from profiles where auth_user_id = auth.uid();
$$;
grant execute on function public.current_app_user_id() to authenticated;

-- ------------------------------------------------------------
-- 수정 규칙: 주인 또는 '편집' 참여자만
-- ------------------------------------------------------------
drop policy if exists "travel_state_update" on travel_state;
create policy "travel_state_update" on travel_state
  for update to authenticated
  using (
    owner_app_user_id = public.current_app_user_id()
    or (
      public.current_app_user_id() in (select jsonb_array_elements_text(coalesce(shared_users, '[]'::jsonb)))
      and not (coalesce(viewer_users, '[]'::jsonb) ? public.current_app_user_id())
    )
  )
  with check (
    owner_app_user_id = public.current_app_user_id()
    or (
      public.current_app_user_id() in (select jsonb_array_elements_text(coalesce(shared_users, '[]'::jsonb)))
      and not (coalesce(viewer_users, '[]'::jsonb) ? public.current_app_user_id())
    )
  );

-- 주인만 바꿀 수 있는 칸 보호 (서버 함수 안에서 app.trusted를 켠 경우는 통과)
create or replace function public.travel_state_guard()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  me text;
begin
  if auth.uid() is null or current_setting('app.trusted', true) = 'on' then
    return new; -- 대시보드(SQL Editor)·서버 함수
  end if;
  me := public.current_app_user_id();
  if new.owner_app_user_id is distinct from old.owner_app_user_id then
    raise exception 'owner_change_not_allowed';
  end if;
  if me is distinct from old.owner_app_user_id and (
       new.shared_users is distinct from old.shared_users
    or new.viewer_users is distinct from old.viewer_users
    or new.archived is distinct from old.archived
    or new.finish_date is distinct from old.finish_date
    or new.trip_name is distinct from old.trip_name
  ) then
    raise exception 'owner_only_field';
  end if;
  return new;
end;
$$;

drop trigger if exists travel_state_guard on travel_state;
create trigger travel_state_guard
  before update on travel_state
  for each row execute function public.travel_state_guard();

-- ------------------------------------------------------------
-- 사진 올리기: 보기 전용 참여자는 여행 폴더에 올릴 수 없음
-- ------------------------------------------------------------
drop policy if exists "trip_photos_insert" on storage.objects;
create policy "trip_photos_insert" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'trip-photos'
    and (
      (storage.foldername(name))[1] = public.current_app_user_id()
      or exists (
        select 1 from travel_state ts
        where ts.id = (storage.foldername(name))[1]
          and (
            ts.owner_app_user_id = public.current_app_user_id()
            or (
              public.current_app_user_id() in (select jsonb_array_elements_text(coalesce(ts.shared_users, '[]'::jsonb)))
              and not (coalesce(ts.viewer_users, '[]'::jsonb) ? public.current_app_user_id())
            )
          )
      )
    )
  );

-- ------------------------------------------------------------
-- 초대: 주인·편집 참여자만, 권한(editor/viewer) 지정
-- ------------------------------------------------------------
drop function if exists send_invite(text, text, text);
create or replace function send_invite(
  p_target_id text,
  p_trip_id text,
  p_trip_name text,
  p_role text default 'editor'
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_from_id text;
begin
  v_from_id := public.current_app_user_id();
  if v_from_id is null then
    raise exception 'not_authenticated';
  end if;
  if v_from_id = p_target_id then
    raise exception 'cannot_invite_self';
  end if;
  if p_role not in ('editor', 'viewer') then
    raise exception 'invalid_role';
  end if;
  if not exists (select 1 from profiles where app_user_id = p_target_id) then
    raise exception 'target_not_found';
  end if;
  if not exists (
    select 1 from travel_state ts
    where ts.id = p_trip_id
      and (
        ts.owner_app_user_id = v_from_id
        or (
          v_from_id in (select jsonb_array_elements_text(coalesce(ts.shared_users, '[]'::jsonb)))
          and not (coalesce(ts.viewer_users, '[]'::jsonb) ? v_from_id)
        )
      )
  ) then
    raise exception 'not_allowed';
  end if;

  delete from invites where target_id = p_target_id;
  insert into invites (target_id, from_id, trip_id, trip_name, timestamp, role)
  values (p_target_id, v_from_id, p_trip_id, p_trip_name, extract(epoch from now()) * 1000, p_role);
end;
$$;
grant execute on function send_invite(text, text, text, text) to authenticated;

-- ------------------------------------------------------------
-- 수락: 받은 초대장이 있어야 함, 초대장의 권한으로 참여
-- ------------------------------------------------------------
create or replace function accept_trip_invite(p_trip_id text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  me text;
  v_role text;
  v_current_shared jsonb;
begin
  me := public.current_app_user_id();
  if me is null then
    raise exception 'not_authenticated';
  end if;

  select coalesce(shared_users, '[]'::jsonb) into v_current_shared from travel_state where id = p_trip_id;
  if v_current_shared is null then
    raise exception 'trip_not_found';
  end if;

  select role into v_role from invites where target_id = me and trip_id = p_trip_id
   order by timestamp desc limit 1;
  if v_role is null then
    if v_current_shared ? me then
      return; -- 이미 참여 중
    end if;
    raise exception 'invite_not_found';
  end if;

  perform set_config('app.trusted', 'on', true);
  update travel_state
     set shared_users = case when v_current_shared ? me then v_current_shared else v_current_shared || to_jsonb(me) end,
         viewer_users = case
           when v_role = 'viewer' then
             case when coalesce(viewer_users, '[]'::jsonb) ? me then viewer_users else coalesce(viewer_users, '[]'::jsonb) || to_jsonb(me) end
           else coalesce((select jsonb_agg(u) from jsonb_array_elements_text(coalesce(viewer_users, '[]'::jsonb)) as u where u <> me), '[]'::jsonb)
         end,
         version = coalesce(version, 0) + 1
   where id = p_trip_id;
  perform set_config('app.trusted', 'off', true);

  delete from invites where target_id = me and trip_id = p_trip_id;
end;
$$;
grant execute on function accept_trip_invite(text) to authenticated;

-- ------------------------------------------------------------
-- 나가기: 참여자·보기 전용 목록에서 빼고, 옛 개인 항목도 정리 (008 내용 + viewer_users)
-- ------------------------------------------------------------
create or replace function public.leave_shared_trip(p_trip_id text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  me text;
begin
  me := public.current_app_user_id();
  if me is null then
    raise exception 'not authenticated';
  end if;

  perform set_config('app.trusted', 'on', true);
  update travel_state
     set shared_users = coalesce(
           (select jsonb_agg(u) from jsonb_array_elements_text(coalesce(shared_users, '[]'::jsonb)) as u where u <> me),
           '[]'::jsonb),
         viewer_users = coalesce(
           (select jsonb_agg(u) from jsonb_array_elements_text(coalesce(viewer_users, '[]'::jsonb)) as u where u <> me),
           '[]'::jsonb),
         packing_list = coalesce(
           (select jsonb_agg(e) from jsonb_array_elements(coalesce(packing_list::jsonb, '[]'::jsonb)) as e
             where not (coalesce(e->>'isPersonal', 'false') = 'true' and e->>'userId' = me)),
           '[]'::jsonb),
         shopping_list = coalesce(
           (select jsonb_agg(e) from jsonb_array_elements(coalesce(shopping_list::jsonb, '[]'::jsonb)) as e
             where not (coalesce(e->>'isPersonal', 'false') = 'true' and e->>'userId' = me)),
           '[]'::jsonb),
         version = coalesce(version, 0) + 1
   where id = p_trip_id
     and me in (select jsonb_array_elements_text(coalesce(shared_users, '[]'::jsonb)));
  perform set_config('app.trusted', 'off', true);
end;
$$;

revoke all on function public.leave_shared_trip(text) from public;
grant execute on function public.leave_shared_trip(text) to authenticated;
