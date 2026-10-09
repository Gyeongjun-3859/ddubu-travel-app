-- 여행 삭제 시 사진 파일 정리용.
-- Supabase Storage의 remove()는 delete 정책뿐 아니라 select 정책도 있어야 실제로 지워진다
-- (select 정책이 없으면 오류 없이 0개 삭제). 내가 올린 사진만 조회 가능하게 한다.
-- 버킷은 공개(public)라 사진 보기에는 영향 없음.
drop policy if exists "trip_photos_select_own" on storage.objects;
create policy "trip_photos_select_own" on storage.objects
  for select to authenticated
  using (bucket_id = 'trip-photos' and owner = auth.uid());
