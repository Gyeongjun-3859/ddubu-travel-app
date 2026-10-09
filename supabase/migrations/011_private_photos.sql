-- 사진 완전 비공개: trip-photos 저장소를 비공개로 바꾸고, 볼 수 있는 사람을 정한다.
-- 앱은 저장된 공개 주소에서 경로만 꺼내 유효기간 있는 서명 주소(createSignedUrls)로 바꿔 띄운다.
-- (이 SQL의 칸: storage.objects.name/owner/bucket_id, travel_state.id/owner_app_user_id/shared_users,
--  profiles.app_user_id — 모두 기존 규칙에서 쓰고 있는 칸)
--
-- 볼 수 있는 사람:
--   1) 올린 사람 본인
--   2) 사진 폴더(경로 첫 부분 = 여행 id)의 여행 주인·참여자 / 본인 아이디 폴더면 본인
--   3) 그 사진 파일 이름이 들어 있는 '내가 볼 수 있는 여행'(예: 내 복사본)이나 내 계정 행(보관함·개인 항목)이 있는 사람
--
-- 되돌리기(문제가 생기면): update storage.buckets set public = true where id = 'trip-photos';

create or replace function public.can_view_trip_photo(p_name text)
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  me text;
  v_folder text;
  v_file text;
begin
  me := public.current_app_user_id();
  if me is null or p_name is null then
    return false;
  end if;
  v_folder := split_part(p_name, '/', 1);
  v_file := regexp_replace(p_name, '^.*/', '');
  if v_folder = me then
    return true;
  end if;
  if exists (
    select 1 from travel_state t
    where t.id = v_folder
      and (t.owner_app_user_id = me or me in (select jsonb_array_elements_text(coalesce(t.shared_users, '[]'::jsonb))))
  ) then
    return true;
  end if;
  if length(v_file) >= 8 and (
    exists (
      select 1 from travel_state t
      where (t.owner_app_user_id = me or me in (select jsonb_array_elements_text(coalesce(t.shared_users, '[]'::jsonb))))
        and strpos(t::text, v_file) > 0
    )
    or exists (select 1 from profiles p where p.app_user_id = me and strpos(p::text, v_file) > 0)
  ) then
    return true;
  end if;
  return false;
end;
$$;
grant execute on function public.can_view_trip_photo(text) to authenticated;

drop policy if exists "trip_photos_select_member" on storage.objects;
create policy "trip_photos_select_member" on storage.objects
  for select to authenticated
  using (bucket_id = 'trip-photos' and (owner = auth.uid() or public.can_view_trip_photo(name)));

-- 저장소를 비공개로 (공개 주소로는 더 이상 열리지 않음)
update storage.buckets set public = false where id = 'trip-photos';
