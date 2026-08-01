-- 뚜부트래블 인증 보안 마이그레이션
-- Supabase 대시보드 > SQL Editor 에서 전체 실행하세요.
-- 실행 전: profiles 테이블 컬럼이 app_user_id, password, trips, "activeTripId" 인지 확인하세요.
--         (activeTripId는 카멜케이스 그대로, 큰따옴표로 감싼 컬럼입니다)

-- 1. 비밀번호 해시용 확장 기능 활성화
create extension if not exists pgcrypto;

-- 2. 기존 평문 비밀번호를 bcrypt 해시로 1회성 변환
--    (이미 해시된 값 $2로 시작하는 값)은 건너뜁니다 - 재실행해도 안전합니다)
update profiles
set password = crypt(password, gen_salt('bf'))
where password is not null and password not like '$2%';

-- 3. 회원가입 RPC: 서버에서만 해시 생성, 클라이언트는 평문을 딱 한 번 https로 전송만 함
create or replace function signup_profile(
  p_app_user_id text,
  p_password text,
  p_trips jsonb,
  p_active_trip_id text
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
  insert into profiles (app_user_id, password, trips, "activeTripId")
  values (p_app_user_id, crypt(p_password, gen_salt('bf')), p_trips, p_active_trip_id)
  returning profiles.app_user_id, profiles.trips, profiles."activeTripId";
end;
$$;

-- 4. 로그인 RPC: 서버에서 해시 비교, 비밀번호 컬럼은 절대 클라이언트로 반환하지 않음
create or replace function verify_login(
  p_app_user_id text,
  p_password text
)
returns table(app_user_id text, trips jsonb, "activeTripId" text)
language plpgsql
security definer
set search_path = public, extensions
as $$
begin
  return query
  select p.app_user_id, p.trips, p."activeTripId"
  from profiles p
  where p.app_user_id = p_app_user_id
    and p.password = crypt(p_password, p.password);
end;
$$;

-- 5. 익명/로그인 클라이언트가 위 RPC 두 개를 호출할 수 있도록 허용
grant execute on function signup_profile(text, text, jsonb, text) to anon, authenticated;
grant execute on function verify_login(text, text) to anon, authenticated;

-- 6. 핵심 조치: 테이블 전체 권한(Supabase 대시보드 "Exposed tables" 상태)은 그대로 두고,
--    password 컬럼 하나만 콕 집어서 anon/authenticated가 직접 못 읽게 차단
grant select, insert, update on profiles to anon, authenticated;
revoke select (password) on profiles from anon, authenticated;
