-- [긴급 수정] 009의 보호 트리거가 travel_state에 없는 칸(archived 등)을 직접 읽어서
-- 모든 수정이 "record new has no field archived" 오류로 실패했다.
-- 칸 이름을 jsonb로 꺼내 비교하도록 바꾼다 — 없는 칸은 양쪽 다 null이라 통과한다.
create or replace function public.travel_state_guard()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  me text;
  f text;
  n jsonb := to_jsonb(new);
  o jsonb := to_jsonb(old);
begin
  if auth.uid() is null or current_setting('app.trusted', true) = 'on' then
    return new; -- 대시보드(SQL Editor)·서버 함수
  end if;
  me := public.current_app_user_id();
  if (n -> 'owner_app_user_id') is distinct from (o -> 'owner_app_user_id') then
    raise exception 'owner_change_not_allowed';
  end if;
  if me is distinct from (o ->> 'owner_app_user_id') then
    foreach f in array array['shared_users', 'viewer_users', 'archived', 'finish_date', 'trip_name'] loop
      if (n -> f) is distinct from (o -> f) then
        raise exception 'owner_only_field';
      end if;
    end loop;
  end if;
  return new;
end;
$$;
