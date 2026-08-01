-- 뚜부트래블 Supabase Auth 전환 + 실제 RLS 적용
-- 실행 전: Supabase 대시보드 Authentication > Providers > Email 에서 "Confirm email" 끄기
-- Supabase 대시보드 SQL Editor 에서 전체 실행하세요.

-- ============================================================
-- 1. profiles: Supabase Auth 계정과 연결할 컬럼 추가
-- ============================================================
alter table profiles add column if not exists auth_user_id uuid references auth.users(id);
create unique index if not exists profiles_auth_user_id_idx on profiles(auth_user_id) where auth_user_id is not null;

-- ============================================================
-- 2. travel_state: 소유자를 배열 파싱 없이 직접 저장 (타이밍 문제 방지)
-- ============================================================
alter table travel_state add column if not exists owner_app_user_id text;

-- 기존 데이터 1회성 백필: 현재 profiles.trips 내용 기준으로 소유자 채워넣기
update travel_state ts
set owner_app_user_id = p.app_user_id
from profiles p, jsonb_array_elements(coalesce(p.trips, '[]'::jsonb)) t
where t->>'id' = ts.id
  and ts.owner_app_user_id is null;

-- ============================================================
-- 3. invites: 초대 수락 시 소유자 프로필을 따로 조회할 필요 없도록 여행 이름 스냅샷 저장
-- ============================================================
alter table invites add column if not exists trip_name text;

-- ============================================================
-- 4. signup_profile 갱신: auth_user_id를 함께 저장
-- ============================================================
create or replace function signup_profile(
  p_app_user_id text,
  p_password text,
  p_trips jsonb,
  p_active_trip_id text,
  p_auth_user_id uuid default null
)
returns table(app_user_id text, trips jsonb, "activeTripId" text)
language plpgsql
security definer
set search_path = public, extensions
as $$
begin
  if exists (select 1 from profiles p where p.app_user_id = p_app_user_id) then
    raise exception 'duplicate_id';
  end if;

  return query
  insert into profiles (app_user_id, password, trips, "activeTripId", auth_user_id)
  values (p_app_user_id, crypt(p_password, gen_salt('bf')), p_trips, p_active_trip_id, p_auth_user_id)
  returning profiles.app_user_id, profiles.trips, profiles."activeTripId";
end;
$$;
grant execute on function signup_profile(text, text, jsonb, text, uuid) to anon, authenticated;

-- ============================================================
-- 5. 레거시 계정을 Supabase Auth로 조용히 전환할 때 쓰는 RPC
--    (기존 verify_login으로 비밀번호 재확인 후, 방금 새로 만든 auth 계정과 연결)
-- ============================================================
create or replace function link_auth_account(
  p_app_user_id text,
  p_password text
)
returns boolean
language plpgsql
security definer
set search_path = public, extensions
as $$
begin
  if auth.uid() is null then
    return false;
  end if;

  if not exists (
    select 1 from profiles p
    where p.app_user_id = p_app_user_id
      and p.password = crypt(p_password, p.password)
  ) then
    return false;
  end if;

  update profiles set auth_user_id = auth.uid() where app_user_id = p_app_user_id;
  return true;
end;
$$;
grant execute on function link_auth_account(text, text) to authenticated;

-- ============================================================
-- 6. 존재하는 아이디인지 확인 (초대 보내기 전 체크용, 남의 프로필 내용은 안 보여줌)
-- ============================================================
create or replace function user_exists(p_app_user_id text)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (select 1 from profiles where app_user_id = p_app_user_id);
$$;
grant execute on function user_exists(text) to anon, authenticated;

-- ============================================================
-- 7. 초대 보내기 (보내는 사람은 auth.uid()로 서버가 직접 확인 - from_id 위조 불가)
-- ============================================================
create or replace function send_invite(
  p_target_id text,
  p_trip_id text,
  p_trip_name text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_from_id text;
begin
  select app_user_id into v_from_id from profiles where auth_user_id = auth.uid();
  if v_from_id is null then
    raise exception 'not_authenticated';
  end if;
  if v_from_id = p_target_id then
    raise exception 'cannot_invite_self';
  end if;
  if not exists (select 1 from profiles where app_user_id = p_target_id) then
    raise exception 'target_not_found';
  end if;

  delete from invites where target_id = p_target_id;
  insert into invites (target_id, from_id, trip_id, trip_name, timestamp)
  values (p_target_id, v_from_id, p_trip_id, p_trip_name, extract(epoch from now()) * 1000);
end;
$$;
grant execute on function send_invite(text, text, text) to authenticated;

-- ============================================================
-- 8. 초대 수락 (아직 권한이 없는 상태에서 shared_users에 자기 자신을 추가해야 하므로 RPC로 처리)
-- ============================================================
create or replace function accept_trip_invite(p_trip_id text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_my_app_user_id text;
  v_current_shared jsonb;
begin
  select app_user_id into v_my_app_user_id from profiles where auth_user_id = auth.uid();
  if v_my_app_user_id is null then
    raise exception 'not_authenticated';
  end if;

  select coalesce(shared_users, '[]'::jsonb) into v_current_shared from travel_state where id = p_trip_id;
  if v_current_shared is null then
    raise exception 'trip_not_found';
  end if;

  if not (v_current_shared ? v_my_app_user_id) then
    update travel_state
    set shared_users = v_current_shared || to_jsonb(v_my_app_user_id)
    where id = p_trip_id;
  end if;

  delete from invites where target_id = v_my_app_user_id and trip_id = p_trip_id;
end;
$$;
grant execute on function accept_trip_invite(text) to authenticated;

-- ============================================================
-- 9. RLS 활성화 + 정책
-- ============================================================
alter table profiles enable row level security;
alter table travel_state enable row level security;
alter table invites enable row level security;

drop policy if exists "profiles_select_own" on profiles;
create policy "profiles_select_own" on profiles
  for select to authenticated
  using (auth.uid() = auth_user_id);

drop policy if exists "profiles_update_own" on profiles;
create policy "profiles_update_own" on profiles
  for update to authenticated
  using (auth.uid() = auth_user_id)
  with check (auth.uid() = auth_user_id);

drop policy if exists "travel_state_select" on travel_state;
create policy "travel_state_select" on travel_state
  for select to authenticated
  using (
    owner_app_user_id = (select app_user_id from profiles where auth_user_id = auth.uid())
    or (select app_user_id from profiles where auth_user_id = auth.uid()) in
       (select jsonb_array_elements_text(coalesce(shared_users, '[]'::jsonb)))
  );

drop policy if exists "travel_state_insert" on travel_state;
create policy "travel_state_insert" on travel_state
  for insert to authenticated
  with check (
    owner_app_user_id = (select app_user_id from profiles where auth_user_id = auth.uid())
  );

drop policy if exists "travel_state_update" on travel_state;
create policy "travel_state_update" on travel_state
  for update to authenticated
  using (
    owner_app_user_id = (select app_user_id from profiles where auth_user_id = auth.uid())
    or (select app_user_id from profiles where auth_user_id = auth.uid()) in
       (select jsonb_array_elements_text(coalesce(shared_users, '[]'::jsonb)))
  )
  with check (true);

drop policy if exists "travel_state_delete" on travel_state;
create policy "travel_state_delete" on travel_state
  for delete to authenticated
  using (
    owner_app_user_id = (select app_user_id from profiles where auth_user_id = auth.uid())
  );

drop policy if exists "invites_select" on invites;
create policy "invites_select" on invites
  for select to authenticated
  using (
    target_id = (select app_user_id from profiles where auth_user_id = auth.uid())
    or from_id = (select app_user_id from profiles where auth_user_id = auth.uid())
  );

drop policy if exists "invites_delete" on invites;
create policy "invites_delete" on invites
  for delete to authenticated
  using (
    target_id = (select app_user_id from profiles where auth_user_id = auth.uid())
    or from_id = (select app_user_id from profiles where auth_user_id = auth.uid())
  );
