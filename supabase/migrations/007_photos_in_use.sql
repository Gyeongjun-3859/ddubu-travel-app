-- 사진 파일 정리 전 '아직 쓰이는 사진인지' 확인하는 함수.
-- 앱은 보안 규칙(RLS) 때문에 다른 사람의 여행을 읽을 수 없다. 그런데 '내 일정으로 복사'는 사진 주소를
-- 그대로 가져가므로, 내 여행에서 지운 사진이 다른 사람의 복사본에선 아직 쓰이고 있을 수 있다.
-- 이 함수는 사진 파일 이름 목록을 받아, 어느 여행(travel_state)이나 보관함(profiles)에라도
-- 들어 있는 이름만 돌려준다. 여행 내용 자체는 돌려주지 않는다.
create or replace function public.photos_in_use(p_names text[])
returns text[]
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  result text[];
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;

  select coalesce(array_agg(n), '{}') into result
    from unnest(p_names) as n
   where length(n) < 8  -- 너무 짧은 이름은 아무 데나 걸리므로 '쓰는 중'으로 취급(지우지 않음)
      or exists (select 1 from travel_state t where strpos(t::text, n) > 0)
      or exists (select 1 from profiles p where strpos(p::text, n) > 0);
  return result;
end;
$$;

revoke all on function public.photos_in_use(text[]) from public;
grant execute on function public.photos_in_use(text[]) to authenticated;
