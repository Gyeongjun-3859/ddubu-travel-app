-- 012: 여행마다 국가를 저장하는 칸 (2026-10-10)
-- 예전엔 국가를 저장하지 않고 지역 이름으로 짐작해서, 앱 목록에 없는 지역(알마티 등)은
-- 이전 여행의 국가(일본)가 따라와 일정·핀에 잘못 저장되고 현지어 이름도 일본어로 채워졌다.
-- 칸만 추가한다(기존 데이터는 그대로). 편집자도 바꿀 수 있는 일반 칸 — 주인 전용 칸 보호 목록에 넣지 않는다.
alter table travel_state add column if not exists trip_country text;

-- 되돌리기: alter table travel_state drop column if exists trip_country;
