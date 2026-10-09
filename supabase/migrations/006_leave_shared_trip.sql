-- 공유 여행 '나가기'용 함수.
-- 참여자가 shared_users에서 자기 자신을 빼면, 바뀐 행이 SELECT 정책(내가 shared_users에 있어야 보임)을
-- 통과하지 못해 RLS가 막는다(42501). 그래서 '나가기'가 서버에 반영되지 않았다.
-- 이 함수는 로그인한 본인만, 본인이 참여 중인 여행에서, 본인 아이디만 뺄 수 있다.
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
         version = coalesce(version, 0) + 1
   where id = p_trip_id
     and me in (select jsonb_array_elements_text(coalesce(shared_users, '[]'::jsonb)));
end;
$$;

revoke all on function public.leave_shared_trip(text) from public;
grant execute on function public.leave_shared_trip(text) to authenticated;
