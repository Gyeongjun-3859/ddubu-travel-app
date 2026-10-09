-- 개인용(🔒) 준비물·쇼핑을 여행 데이터가 아니라 내 계정 행에 저장 (I5·I6).
-- 예전엔 개인 항목도 travel_state에 같이 저장돼 참여자 모두의 기기로 내용이 전송됐다(화면에서만 숨김).
-- profiles는 보안 규칙상 본인만 읽고 쓸 수 있다(profiles_select_own / profiles_update_own).
--   personal_items = { "<여행id>": { "packing_list": [...], "shopping_list": [...] } }
alter table profiles add column if not exists personal_items jsonb not null default '{}'::jsonb;

-- 공유 여행 '나가기': 참여자 목록에서 빼면서, 예전 방식으로 여행 데이터에 남아 있던 내 개인 항목도 지운다.
create or replace function public.leave_shared_trip(p_trip_id text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  me text;
begin
  select app_user_id into me from profiles where auth_user_id = auth.uid();
  if me is null then
    raise exception 'not authenticated';
  end if;

  update travel_state
     set shared_users = coalesce(
           (select jsonb_agg(u) from jsonb_array_elements_text(coalesce(shared_users, '[]'::jsonb)) as u where u <> me),
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
end;
$$;

revoke all on function public.leave_shared_trip(text) from public;
grant execute on function public.leave_shared_trip(text) to authenticated;
