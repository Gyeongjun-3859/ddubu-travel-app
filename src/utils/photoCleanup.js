// 저장소(trip-photos)에 올린 사진 파일 정리.
//
// 일정/핀을 지우거나 사진을 바꿔도 예전엔 파일이 저장소에 계속 남았다. 그렇다고 바로 지우면
// ① 슝(실행취소)으로 일정을 되살렸을 때 사진이 깨지고 ② 같은 사진을 쓰는 핀·복사본 여행의 사진도 깨진다.
// 그래서 빠진 사진은 '삭제 후보'로만 담아 두고, 여행을 다시 열 때(이때 슝 기록이 초기화된다)
// 이 기기·서버 어디에도 안 쓰이는 것만 지운다. 확인이 안 되면(함수 없음·네트워크 오류) 지우지 않는다.
// 저장소 규칙상 내가 올린 사진만 지워진다(남이 올린 건 remove가 조용히 0개 처리).

const QUEUE_KEY = 'my_travel_photo_cleanup';
const PHOTO_URL_RE = /\/trip-photos\/[^"'?\s\\)]+/g;
const MAX_TRIES = 5;      // 확인 실패(오류)나 '아직 쓰는 중'이 이만큼 반복되면 후보에서 뺀다(파일은 남김)
const MAX_QUEUE = 500;

let running = false;

// 데이터(객체/문자열) 안에 든 저장소 사진 경로(trip-photos/ 뒤 부분) 목록
export function extractPhotoPaths(data) {
  let text = '';
  try { text = typeof data === 'string' ? data : JSON.stringify(data || {}); } catch (e) { return []; }
  const found = text.match(PHOTO_URL_RE) || [];
  return Array.from(new Set(found.map(u => {
    const raw = u.replace('/trip-photos/', '');
    try { return decodeURIComponent(raw); } catch (e) { return raw; }
  })));
}

const fileName = (path) => String(path).split('/').pop();

function readQueue() {
  try {
    const q = JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]');
    return Array.isArray(q) ? q : [];
  } catch (e) { return []; }
}

function writeQueue(q) {
  try {
    if (q.length === 0) localStorage.removeItem(QUEUE_KEY);
    else localStorage.setItem(QUEUE_KEY, JSON.stringify(q.slice(-MAX_QUEUE)));
  } catch (e) {}
}

// 빠진 사진 경로를 삭제 후보에 담는다
export function queuePhotoCleanup(appUserId, paths) {
  if (!appUserId || appUserId === 'Guest' || !Array.isArray(paths) || paths.length === 0) return;
  const q = readQueue();
  const now = Date.now();
  paths.forEach(path => {
    const existing = q.find(it => it.uid === appUserId && it.path === path);
    if (existing) existing.at = now;   // 다시 빠졌으면 시각만 새로
    else q.push({ uid: appUserId, path, at: now, tries: 0 });
  });
  writeQueue(q);
}

// before 시각 이전에 담긴 후보만 확인해서 정리한다(그 뒤에 지운 건 아직 슝으로 되살릴 수 있음)
export async function runPhotoCleanup(supabaseClient, appUserId, before = Date.now()) {
  if (running || !supabaseClient || !appUserId || appUserId === 'Guest') return;
  const all = readQueue();
  const mine = all.filter(it => it.uid === appUserId && it.at < before);
  if (mine.length === 0) return;
  running = true;

  const done = new Set();    // 후보에서 뺄 것
  const failed = new Set();  // 이번에 확인 못 함 → tries+1
  try {
    // 1) 이 기기에 저장된 여행 데이터(못 보낸 변경 포함)에 아직 있으면 지우지 않는다
    let localText = '';
    try { localText = (localStorage.getItem('my_travel_states') || '') + (localStorage.getItem('my_travel_pending') || ''); } catch (e) {}
    const candidates = mine.filter(it => {
      if (localText.includes(fileName(it.path))) { failed.add(it); return false; }
      return true;
    });

    if (candidates.length > 0) {
      // 2) 서버 전체(다른 사람 복사본·보관함 포함)에서 쓰이는지 확인
      const { data: used, error } = await supabaseClient.rpc('photos_in_use', { p_names: candidates.map(it => fileName(it.path)) });
      if (error || !Array.isArray(used)) {
        console.warn('사진 사용 여부 확인 실패 — 이번엔 지우지 않음', error);
        candidates.forEach(it => failed.add(it));
      } else {
        const usedSet = new Set(used);
        const toRemove = candidates.filter(it => !usedSet.has(fileName(it.path)));
        candidates.filter(it => usedSet.has(fileName(it.path))).forEach(it => failed.add(it));
        if (toRemove.length > 0) {
          const { error: rmErr } = await supabaseClient.storage.from('trip-photos').remove(toRemove.map(it => it.path));
          if (rmErr) { console.warn('사진 파일 정리 실패', rmErr); toRemove.forEach(it => failed.add(it)); }
          else toRemove.forEach(it => done.add(it));
        }
      }
    }
  } catch (e) {
    console.warn('사진 파일 정리 실패', e);
    mine.forEach(it => { if (!done.has(it)) failed.add(it); });
  } finally {
    // 정리하는 동안 새로 담긴 후보가 있을 수 있으니 저장소를 다시 읽어서 반영
    const latest = readQueue();
    const key = (it) => `${it.uid}|${it.path}|${it.at}`;
    const doneKeys = new Set(Array.from(done).map(key));
    const failedKeys = new Set(Array.from(failed).map(key));
    const next = [];
    latest.forEach(it => {
      const k = key(it);
      if (doneKeys.has(k)) return;
      if (failedKeys.has(k)) {
        const tries = (it.tries || 0) + 1;
        if (tries < MAX_TRIES) next.push({ ...it, tries });
        return;
      }
      next.push(it);
    });
    writeQueue(next);
    running = false;
  }
}
