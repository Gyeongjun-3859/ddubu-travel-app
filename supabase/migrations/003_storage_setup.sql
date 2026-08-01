-- 뚜부트래블 사진 저장을 base64(DB 직접 저장) → Supabase Storage로 전환
-- Supabase 대시보드 SQL Editor 에서 전체 실행하세요.

-- 1. 사진 전용 버킷 생성 (공개 읽기 - URL만 알면 조회 가능, 업로드는 로그인 사용자만)
insert into storage.buckets (id, name, public)
values ('trip-photos', 'trip-photos', true)
on conflict (id) do nothing;

-- 2. 로그인한 사용자만 업로드 가능
drop policy if exists "trip_photos_insert" on storage.objects;
create policy "trip_photos_insert" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'trip-photos');

-- 3. 본인이 올린 파일은 본인이 삭제/교체 가능 (덮어쓰기 대비)
drop policy if exists "trip_photos_update" on storage.objects;
create policy "trip_photos_update" on storage.objects
  for update to authenticated
  using (bucket_id = 'trip-photos' and owner = auth.uid())
  with check (bucket_id = 'trip-photos');

drop policy if exists "trip_photos_delete" on storage.objects;
create policy "trip_photos_delete" on storage.objects
  for delete to authenticated
  using (bucket_id = 'trip-photos' and owner = auth.uid());

-- 4. 공개 버킷이라 읽기는 별도 정책 없이도 URL로 누구나 조회 가능 (RLS로 막힌 travel_state 자체와는 별개)
