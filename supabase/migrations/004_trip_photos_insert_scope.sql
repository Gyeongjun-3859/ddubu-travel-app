-- trip-photos 버킷 업로드(INSERT) 권한을 해당 여행의 소유자/공유 멤버로 제한
-- 기존 정책은 bucket_id만 확인해서, 로그인한 사용자라면 누구나 다른 사람의
-- 여행 폴더(tripId/...)에 파일을 업로드할 수 있는 구멍이 있었음.
-- 업로드 경로가 `${tripId}/...` 또는 `${appUserId}/...`(마이그레이션 등 개인 폴더) 형태인 것을
-- 이용해, 경로 첫 세그먼트가 (a) 본인 app_user_id 이거나 (b) 본인이 소유/공유중인 여행 id일 때만 허용.
-- Supabase 대시보드 SQL Editor 에서 전체 실행하세요.

drop policy if exists "trip_photos_insert" on storage.objects;
create policy "trip_photos_insert" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'trip-photos'
    and (
      (storage.foldername(name))[1] = (select app_user_id from profiles where auth_user_id = auth.uid())
      or exists (
        select 1 from travel_state ts
        where ts.id = (storage.foldername(name))[1]
          and (
            ts.owner_app_user_id = (select app_user_id from profiles where auth_user_id = auth.uid())
            or (select app_user_id from profiles where auth_user_id = auth.uid()) in
               (select jsonb_array_elements_text(coalesce(ts.shared_users, '[]'::jsonb)))
          )
      )
    )
  );
