import { useEffect, useState } from 'react';

// 비공개 저장소(trip-photos) 사진을 화면에 띄우기 위한 서명 주소 변환.
//
// 데이터에는 예전처럼 공개 주소(…/object/public/trip-photos/<경로>)가 저장돼 있다. 저장소가 비공개라
// 그 주소로는 열리지 않으므로, 경로만 꺼내 유효기간 있는 서명 주소로 바꿔 띄운다.
// - 여러 장을 한 번에 묶어 요청하고, 7일짜리 주소를 이 기기에 보관해 같은 주소를 재사용(브라우저 캐시 유지)
// - 요청이 실패하면 원래 주소를 그대로 쓴다(저장소를 다시 공개로 되돌린 경우에도 그대로 보이게)
// - 게스트 사진(data:), 웹 주소, 기본 이미지는 손대지 않는다

const CACHE_KEY = 'my_travel_signed_urls';
const TTL_SEC = 7 * 24 * 3600;
const REFRESH_BEFORE_MS = 24 * 3600 * 1000; // 만료 하루 전이면 새로 받음
const FAIL_RETRY_MS = 5 * 60 * 1000;
const PUBLIC_RE = /\/storage\/v1\/object\/public\/trip-photos\/([^?#"'\s]+)/;
const BLANK = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';

let client = null;
let cache = null;     // { [path]: { url, exp } }  exp: ms
const pending = new Set();
const listeners = new Set();
let timer = null;

function loadCache() {
  if (cache) return cache;
  try { cache = JSON.parse(localStorage.getItem(CACHE_KEY) || '{}') || {}; } catch (e) { cache = {}; }
  return cache;
}
function saveCache() {
  try {
    const now = Date.now();
    Object.keys(cache).forEach(k => { if (!cache[k] || cache[k].exp < now) delete cache[k]; });
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  } catch (e) {}
}

// 로그인 상태가 바뀌면 호출 (게스트·로그아웃이면 null)
export function setPhotoClient(c) {
  const next = c || null;
  if (next === client) return;
  client = next;
  listeners.forEach(fn => { try { fn(); } catch (e) {} }); // 로그인 직후 화면의 사진들을 다시 그리게
}

// 로그아웃 시 이 기기에 남은 서명 주소 지우기
export function clearSignedPhotoCache() {
  cache = {};
  try { localStorage.removeItem(CACHE_KEY); } catch (e) {}
}

export function photoPathOf(src) {
  const m = typeof src === 'string' ? src.match(PUBLIC_RE) : null;
  if (!m) return null;
  try { return decodeURIComponent(m[1]); } catch (e) { return m[1]; }
}

function schedule() {
  if (timer) return;
  timer = setTimeout(flush, 30);
}

async function flush() {
  timer = null;
  const paths = Array.from(pending);
  pending.clear();
  if (paths.length === 0 || !client) return;
  const c = loadCache();
  try {
    const { data, error } = await client.storage.from('trip-photos').createSignedUrls(paths, TTL_SEC);
    if (error) throw error;
    const now = Date.now();
    const got = new Set();
    (data || []).forEach(d => {
      if (d && d.path && d.signedUrl && !d.error) {
        c[d.path] = { url: d.signedUrl, exp: now + TTL_SEC * 1000 };
        got.add(d.path);
      }
    });
    // 권한이 없거나 파일이 없는 사진: 원래 주소로 두고 잠시 뒤 다시 시도
    paths.forEach(p => { if (!got.has(p)) c[p] = { url: null, exp: now + FAIL_RETRY_MS }; });
  } catch (e) {
    console.warn('[사진 서명 주소 요청 실패 — 원래 주소 사용]', e && e.message);
    const now = Date.now();
    paths.forEach(p => { c[p] = { url: null, exp: now + FAIL_RETRY_MS }; });
  }
  saveCache();
  listeners.forEach(fn => { try { fn(); } catch (e) {} });
}

// 지금 쓸 수 있는 주소. 저장소 사진인데 아직 서명 주소가 없으면 요청을 걸고 null.
export function resolvePhotoUrl(src) {
  const path = photoPathOf(src);
  if (!path) return src;            // 저장소 사진이 아님
  if (!client) return src;          // 게스트·로그아웃
  const c = loadCache();
  const hit = c[path];
  const now = Date.now();
  if (hit && hit.exp > now) {
    if (hit.url && hit.exp - now < REFRESH_BEFORE_MS) { pending.add(path); schedule(); }
    return hit.url || src;
  }
  pending.add(path); schedule();
  return hit && hit.url ? hit.url : null;
}

// 여러 장 미리 요청 (여행을 열 때 그 여행 사진을 한 번에) — 저장소 경로 목록
export function prefetchPhotoPaths(paths) {
  if (!client) return;
  const c = loadCache();
  const now = Date.now();
  (paths || []).forEach(p => {
    const hit = c[p];
    if (!hit || hit.exp - now < (hit.url ? REFRESH_BEFORE_MS : 0)) pending.add(p);
  });
  if (pending.size > 0) schedule();
}

export function subscribePhotoUrls(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function useSignedPhoto(src) {
  const [, setTick] = useState(0);
  useEffect(() => subscribePhotoUrls(() => setTick(t => t + 1)), []);
  return resolvePhotoUrl(src);
}

export const BLANK_IMAGE = BLANK;
