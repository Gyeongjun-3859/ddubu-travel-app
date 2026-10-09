// 개인용(🔒) 준비물·쇼핑 저장소.
//
// 예전엔 개인 항목도 여행 데이터(travel_state)에 같이 저장하고 화면에서만 숨겨서, 내용이 참여자 모두의
// 기기로 전송됐다(I5). 강퇴되거나 나간 사람의 개인 항목도 여행에 그대로 남았다(I6).
// 이제 내 개인 항목은 내 계정 행(profiles.personal_items — 보안 규칙상 본인만 읽고 쓸 수 있음)에만 저장한다.
//   personal_items = { [tripId]: { packing_list: [item], shopping_list: [item] } }
// 같은 계정의 다른 기기와 덮어쓰기를 줄이려고, 저장할 땐 서버 최신 값을 읽어 이번 변경(추가/수정/삭제)만 얹어 쓴다.
// 오프라인이면 변경을 브라우저에 보관했다가 다시 시도한다. 게스트는 혼자 쓰므로 이 저장소를 쓰지 않는다.

const CACHE_KEY = 'my_travel_personal';         // { uid, items }
const PENDING_KEY = 'my_travel_personal_pending'; // { uid, ops: [{ tripId, field, upserts, deleteIds, forget }] }
export const PERSONAL_FIELDS = ['packing_list', 'shopping_list'];

function readJson(key) {
  try { return JSON.parse(localStorage.getItem(key) || 'null'); } catch (e) { return null; }
}
function writeJson(key, value) {
  try {
    if (value == null) localStorage.removeItem(key);
    else localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {}
}

// 로그아웃 시 이 기기에 남은 개인 항목 캐시를 지운다(다른 사람이 같은 기기를 쓸 때 노출 방지)
export function clearPersonalCache() {
  writeJson(CACHE_KEY, null);
  writeJson(PENDING_KEY, null);
}

// ops를 items 객체에 적용한 새 객체를 돌려준다
function applyOps(items, ops) {
  const next = JSON.parse(JSON.stringify(items && typeof items === 'object' ? items : {}));
  ops.forEach(op => {
    if (op.forget) { delete next[op.tripId]; return; }
    const trip = next[op.tripId] || (next[op.tripId] = {});
    let arr = Array.isArray(trip[op.field]) ? trip[op.field] : [];
    const del = new Set((op.deleteIds || []).map(String));
    if (del.size > 0) arr = arr.filter(it => it && !del.has(String(it.id)));
    (op.upserts || []).forEach(item => {
      const idx = arr.findIndex(it => it && String(it.id) === String(item.id));
      if (idx >= 0) arr[idx] = item; else arr.push(item);
    });
    trip[op.field] = arr;
  });
  return next;
}

export function createPersonalStore({ getClient, getUserId, onChange }) {
  let uid = null;
  let serverItems = {};  // 서버에서 마지막으로 읽은 값
  let ops = [];          // 아직 서버에 못 보낸 변경
  let loaded = false;
  let flushTimer = null;
  let flushing = false;
  let retryDelay = 0;

  const view = () => applyOps(serverItems, ops);

  function persist() {
    writeJson(CACHE_KEY, { uid, items: serverItems });
    writeJson(PENDING_KEY, ops.length > 0 ? { uid, ops } : null);
  }

  function emit() { try { onChange && onChange(); } catch (e) { console.error('[personalItems] onChange error', e); } }

  // 로그인한 계정 기준으로 시작(같은 계정이면 캐시·대기 중 변경을 이어받음)
  function start(userId) {
    if (uid === userId) return;
    uid = userId;
    loaded = false;
    const cache = readJson(CACHE_KEY);
    const pending = readJson(PENDING_KEY);
    serverItems = cache && cache.uid === uid && cache.items ? cache.items : {};
    ops = pending && pending.uid === uid && Array.isArray(pending.ops) ? pending.ops : [];
    if (!(cache && cache.uid === uid)) writeJson(CACHE_KEY, null);
    if (!(pending && pending.uid === uid)) writeJson(PENDING_KEY, null);
    emit();
  }

  function stop() {
    if (flushTimer) clearTimeout(flushTimer);
    flushTimer = null;
    uid = null; serverItems = {}; ops = []; loaded = false;
  }

  async function load() {
    const client = getClient();
    const me = uid;
    if (!client || !me || me === 'Guest') return;
    const { data, error } = await client.from('profiles').select('personal_items').eq('app_user_id', me).maybeSingle();
    if (me !== uid) return;
    if (error) { console.warn('[personalItems] 불러오기 실패', error); return; }
    serverItems = (data && data.personal_items && typeof data.personal_items === 'object') ? data.personal_items : {};
    loaded = true;
    persist();
    emit();
    if (ops.length > 0) scheduleFlush(0);
  }

  function isLoaded() { return loaded; }

  function getTripItems(tripId, field) {
    const trip = view()[tripId];
    return trip && Array.isArray(trip[field]) ? trip[field] : [];
  }

  function hasItem(tripId, field, id) {
    return getTripItems(tripId, field).some(it => it && String(it.id) === String(id));
  }

  function pushOp(op) {
    if (!uid || uid === 'Guest') return;
    ops.push(op);
    persist();
    emit();
    scheduleFlush(400);
  }

  // 바뀐 항목만 추가/수정(같은 내용이면 무시)
  function upsert(tripId, field, items) {
    const current = new Map(getTripItems(tripId, field).map(it => [String(it.id), JSON.stringify(it)]));
    const changed = (items || []).filter(it => it && it.id != null && current.get(String(it.id)) !== JSON.stringify(it));
    if (changed.length > 0) pushOp({ tripId, field, upserts: changed, deleteIds: [] });
  }

  function remove(tripId, field, ids) {
    const existing = (ids || []).filter(id => hasItem(tripId, field, id));
    if (existing.length > 0) pushOp({ tripId, field, upserts: [], deleteIds: existing.map(String) });
  }

  // 여행 하나의 개인 항목 통째로 교체(복사본 만들 때)
  function replaceTrip(tripId, field, items) {
    const ids = getTripItems(tripId, field).map(it => String(it.id));
    pushOp({ tripId, field, upserts: (items || []).filter(Boolean), deleteIds: ids });
  }

  // 여행을 지우거나 나갔을 때 그 여행의 개인 항목 삭제
  function forgetTrip(tripId) {
    if (!view()[tripId]) return;
    pushOp({ tripId, forget: true });
  }

  function scheduleFlush(delay) {
    if (flushTimer) clearTimeout(flushTimer);
    flushTimer = setTimeout(() => { flushTimer = null; flush(); }, delay);
  }

  async function flush() {
    const client = getClient();
    const me = uid;
    if (flushing || !client || !me || me === 'Guest' || ops.length === 0) return;
    flushing = true;
    const sending = ops.slice();
    try {
      // 서버 최신 값 위에 이번 변경만 얹어서 쓴다(다른 기기에서 바꾼 다른 여행/항목은 보존)
      const { data, error } = await client.from('profiles').select('personal_items').eq('app_user_id', me).maybeSingle();
      if (error) throw error;
      const latest = (data && data.personal_items && typeof data.personal_items === 'object') ? data.personal_items : {};
      const merged = applyOps(latest, sending);
      const { error: upErr } = await client.from('profiles').update({ personal_items: merged }).eq('app_user_id', me);
      if (upErr) throw upErr;
      if (me !== uid) return;
      serverItems = merged;
      loaded = true;
      ops = ops.slice(sending.length);
      retryDelay = 0;
      persist();
      emit();
      if (ops.length > 0) scheduleFlush(0);
    } catch (e) {
      console.warn('[personalItems] 저장 실패 — 다시 시도 예정', e);
      retryDelay = Math.min(60000, retryDelay ? retryDelay * 2 : 3000);
      scheduleFlush(retryDelay);
    } finally {
      flushing = false;
    }
  }

  return { start, stop, load, isLoaded, getTripItems, hasItem, upsert, remove, replaceTrip, forgetTrip, flush };
}
