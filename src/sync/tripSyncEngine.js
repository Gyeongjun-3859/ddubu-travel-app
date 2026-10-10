// 여행 데이터 저장/동기화 엔진. 리액트에 의존하지 않는 순수 JS.
//
// 이 파일이 강제하는 3가지 규칙이 지금까지 있었던 버그들(삭제 후 재등장, 여행 전환 시
// 데이터 섞임, 동시 편집 시 서로 덮어쓰기)의 공통 원인을 구조적으로 제거한다:
//   1) 저장 대상 여행 id는 항상 호출 시점에 명시적으로 전달받는다(리액트 state 클로저에
//      의존하지 않음) — 지역명 디바운스 저장처럼 "예약해두고 늦게 실행되는" 저장도
//      예약 시점의 tripId를 그대로 들고 있으면 안전하다.
//   2) 같은 여행에 대한 저장 요청은 항상 하나씩 순서대로만 나간다(겹치지 않음) — 동시에
//      두 저장이 "최신 읽기 → 병합 → 쓰기"를 겹쳐서 하다가 서로 덮어쓰는 일이 없다.
//   3) 배열 항목 삭제는 오직 명시적 tombstone으로만 이루어진다 — "배열에서 빠졌다"는
//      사실만으로 삭제를 추론하지 않는다. 그래서 되돌리기(undo)나 부분 스냅샷 재저장이
//      실수로 다른 사람이 추가한 항목을 지우는 일이 구조적으로 불가능해진다.

import { ARRAY_FIELDS, SCALAR_FIELDS, isArrayField, mergeArrayField, splitTombstones, tombstone } from './tripDataModel';
import { extractPhotoPaths } from '../utils/photoCleanup';

const FLUSH_DELAY_MS = 200;
const MAX_WRITE_RETRIES = 3;
const LOCAL_STORAGE_KEY = 'my_travel_states';
// 아직 서버에 못 보낸 변경(오프라인 등) — 앱을 껐다 켜도 이어서 보내기 위해 따로 보관
export const PENDING_STORAGE_KEY = 'my_travel_pending';
const RETRY_MIN_MS = 2000;
const RETRY_MAX_MS = 60000;

function nowIso() { return Date.now(); }

function emptyTripState() {
  return {
    version: 0,
    scalars: {},            // display_city_name, travel_start_date, flights, max_day, shared_users 등 최근 알려진 값
    views: {},               // 필드별 "화면용" 정제 결과 캐시 (plan_timeline, current_restaurants, packing_list, shopping_list)
    rawArrays: {},           // 필드별 DB 원본(tombstone 포함) 최근 알려진 값 — localStorage/재병합용
    base: new Map(),         // field -> Map<id, item>  (tombstone 제외, "직전에 알던 내용" — updatedAt 재계산 기준)
    pendingScalars: {},
    pendingUpserts: new Map(), // field -> Map<id, item>
    pendingDeletes: new Map(), // field -> Set<id>
    flushTimer: null,
    flushPromise: null,
    listeners: new Set(),
    zeroRowStreak: 0,
    retryDelay: 0,           // 저장 실패 후 다음 재시도까지 기다릴 시간(점점 늘어남, 성공하면 0)
    loaded: false,
  };
}

// PostgREST: .single()로 조회했는데 행이 0개 — 행이 없거나, 보안 규칙(RLS)상 더 이상 볼 수 없을 때
const NO_ROW_CODE = 'PGRST116';

export function createTripSyncEngine({ getClient, getUserId, onToast, onAccessLost, onPhotosRemoved }) {
  let activeTripId = null;
  const trips = new Map(); // tripId -> state

  function getState(tripId) {
    let s = trips.get(tripId);
    if (!s) { s = emptyTripState(); trips.set(tripId, s); }
    return s;
  }

  function isGuest() {
    return getUserId() === 'Guest' || !getClient();
  }

  // ---------------------------------------------------------------------
  // 화면용 view 재구성 + 리스너 통지
  // ---------------------------------------------------------------------
  function currentView(state) {
    return { ...state.scalars, ...state.views };
  }

  function notify(tripId) {
    const state = getState(tripId);
    const view = currentView(state);
    state.listeners.forEach(fn => { try { fn(view); } catch (e) { console.error('[tripSyncEngine] listener error', e); } });
  }

  // row(부분 또는 전체 DB row)를 state에 반영한다. load/realtime/자기 저장 결과가 전부
  // 이 함수 하나만 거치므로, 자기 자신이 보낸 실시간 이벤트를 다시 받아도(echo) 문제 없다
  // (멱등적으로 같은 결과가 나옴).
  function applyRow(tripId, row) {
    if (!row || typeof row !== 'object') return;
    const state = getState(tripId);

    if (typeof row.version === 'number') state.version = row.version;

    // 1) 스칼라 필드 먼저 반영 (배열 정제 시 display_city_name을 기준으로 삼기 때문에 순서 중요)
    [...SCALAR_FIELDS, 'shared_users', 'viewer_users', 'archived', 'finish_date', 'owner_app_user_id', 'trip_name'].forEach(field => {
      if (Object.prototype.hasOwnProperty.call(row, field)) state.scalars[field] = row[field];
    });

    // 2) 배열 필드 반영
    Object.keys(ARRAY_FIELDS).forEach(field => {
      if (!Object.prototype.hasOwnProperty.call(row, field)) return;
      const raw = Array.isArray(row[field]) ? row[field] : [];
      state.rawArrays[field] = raw;
      const { realItems } = splitTombstones(raw);
      state.base.set(field, new Map(realItems.map(it => [String(it.id), it])));
      const cleanFn = ARRAY_FIELDS[field].clean;
      state.views[field] = cleanFn ? cleanFn(raw, state.scalars.display_city_name) : realItems;
    });

    // 아직 서버에 못 보낸 내 변경이 있으면 서버 값 위에 다시 얹는다 — 안 그러면 다른 사람 변경이 실시간으로
    // 들어오는 순간(또는 다시 불러올 때) 방금 내가 추가/수정한 항목이 화면에서 사라졌다가 돌아오거나 아예 사라졌다.
    Object.assign(state.scalars, state.pendingScalars);
    Object.keys(ARRAY_FIELDS).forEach(field => {
      if (state.pendingUpserts.has(field) || state.pendingDeletes.has(field)) overlayPending(state, field);
    });

    state.loaded = true;
    persistLocal(tripId, state);
    notify(tripId);
  }

  // 서버(또는 캐시) 원본 위에 대기 중인 변경을 얹어 화면용 값을 다시 만든다
  function overlayPending(state, field) {
    const upserts = Array.from((state.pendingUpserts.get(field) || new Map()).values());
    const deleteIds = Array.from(state.pendingDeletes.get(field) || []);
    if (upserts.length === 0 && deleteIds.length === 0) return;
    const base = state.base.get(field) || new Map();
    const mergedRaw = mergeArrayField({ dbItems: state.rawArrays[field] || [], upserts, deleteIds, base });
    state.rawArrays[field] = mergedRaw;
    const { realItems } = splitTombstones(mergedRaw);
    const cleanFn = ARRAY_FIELDS[field].clean;
    state.views[field] = cleanFn ? cleanFn(mergedRaw, state.scalars.display_city_name) : realItems;
  }

  // 대기 중인 변경을 브라우저에 따로 저장 (없으면 지움)
  function persistPending(tripId, state) {
    try {
      const all = JSON.parse(localStorage.getItem(PENDING_STORAGE_KEY) || '{}');
      if (!hasPending(state)) { delete all[tripId]; }
      else {
        const upserts = {}; state.pendingUpserts.forEach((m, f) => { upserts[f] = Array.from(m.values()); });
        const deletes = {}; state.pendingDeletes.forEach((set, f) => { deletes[f] = Array.from(set); });
        all[tripId] = { scalars: state.pendingScalars, upserts, deletes, savedAt: Date.now() };
      }
      localStorage.setItem(PENDING_STORAGE_KEY, JSON.stringify(all));
    } catch (e) {}
  }

  // 보내다 실패한 변경을 대기열에 다시 넣는다. 그 사이 새로 생긴 변경이 있으면 새 것이 이긴다.
  function requeue(tripId, state, batch) {
    state.pendingScalars = { ...batch.scalars, ...state.pendingScalars };
    batch.upserts.forEach((m, field) => {
      const newer = state.pendingUpserts.get(field) || new Map();
      const newerDeletes = state.pendingDeletes.get(field) || new Set();
      const merged = new Map(m);
      newer.forEach((item, id) => merged.set(id, item));
      newerDeletes.forEach(id => merged.delete(id));
      if (merged.size > 0) state.pendingUpserts.set(field, merged);
    });
    batch.deletes.forEach((set, field) => {
      const newerUpserts = state.pendingUpserts.get(field) || new Map();
      const merged = new Set(state.pendingDeletes.get(field) || []);
      set.forEach(id => { if (!newerUpserts.has(id)) merged.add(id); });
      if (merged.size > 0) state.pendingDeletes.set(field, merged);
    });
    persistPending(tripId, state);
  }

  function persistLocal(tripId, state) {
    try {
      const allStr = localStorage.getItem(LOCAL_STORAGE_KEY) || '{}';
      const all = JSON.parse(allStr);
      all[tripId] = {
        ...(all[tripId] || {}),
        ...state.scalars,
        ...state.rawArrays,
      };
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(all));
    } catch (e) { console.error('[tripSyncEngine] localStorage 저장 실패', e); }
  }

  // ---------------------------------------------------------------------
  // 활성 여행 추적 (React state가 아니라 이 값이 유일한 근거 — 클로저 지연 문제 방지)
  // ---------------------------------------------------------------------
  function setActiveTrip(tripId) { activeTripId = tripId; }
  function getActiveTrip() { return activeTripId; }

  // ---------------------------------------------------------------------
  // 리스너 구독 (App.jsx의 useState setter들을 여기 연결)
  // ---------------------------------------------------------------------
  function addListener(tripId, fn) {
    const state = getState(tripId);
    state.listeners.add(fn);
    if (state.loaded) { try { fn(currentView(state)); } catch (e) { console.error(e); } }
    return () => state.listeners.delete(fn);
  }

  // ---------------------------------------------------------------------
  // 최초 로드 / 재조회(PTR, 재접속)
  // ---------------------------------------------------------------------
  // 인터넷이 끊겨 서버에 못 닿은 경우인지 (권한 없음·여행 없음과 구분 — 그땐 저장된 데이터를 보여 주면 안 됨)
  function isNetworkError(err) {
    if (typeof navigator !== 'undefined' && navigator.onLine === false) return true;
    const msg = String((err && (err.message || err.details)) || err || '');
    return /Failed to fetch|NetworkError|Load failed|network|fetch/i.test(msg);
  }
  // 휴대폰에 저장해 둔 이 여행 데이터로 화면을 채운다 (오프라인 — 산·기내). 이미 불러온 게 있으면 그대로 둔다
  function loadFromDevice(tripId) {
    try {
      const all = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY) || '{}');
      if (!all || !all[tripId]) return null;
      if (!getState(tripId).loaded) { restoreStoredPending(tripId); applyRow(tripId, all[tripId]); }
      return currentView(getState(tripId));
    } catch (e) { console.error(e); return null; }
  }

  async function load(tripId) {
    if (isGuest()) {
      try {
        const allStr = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (allStr) {
          const all = JSON.parse(allStr);
          if (all && all[tripId]) { applyRow(tripId, all[tripId]); return currentView(getState(tripId)); }
        }
      } catch (e) { console.error(e); }
      return null;
    }
    const client = getClient();
    try {
      const { data, error } = await client.from('travel_state').select('*').eq('id', tripId).single();
      if (error && isNetworkError(error)) return loadFromDevice(tripId);
      if (error || !data) return null; // 여행 row가 아직 없을 수 있음(생성 직후 race) — 기존 로컬 상태 보존, 아무것도 안 바꿈
      restoreStoredPending(tripId);
      applyRow(tripId, data);
      if (hasPending(getState(tripId))) scheduleFlush(tripId, 0);
      return currentView(getState(tripId));
    } catch (e) {
      console.error('[tripSyncEngine] load 실패', e);
      return isNetworkError(e) ? loadFromDevice(tripId) : null;
    }
  }

  function reload(tripId) { return load(tripId); }

  // ---------------------------------------------------------------------
  // 실시간 구독
  // ---------------------------------------------------------------------
  function subscribeTrip(tripId, onView) {
    const unsubscribeListener = addListener(tripId, onView);
    if (isGuest()) return unsubscribeListener;

    const client = getClient();
    const channel = client.channel(`trip_${tripId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'travel_state', filter: `id=eq.${tripId}` }, (payload) => {
        if (!payload.new) return; // DELETE 이벤트는 new가 없음 — 지금은 무시(기존 동작과 동일)
        const state = getState(tripId);
        const incomingVersion = typeof payload.new.version === 'number' ? payload.new.version : null;
        // version 비교는 순수 최적화(불필요한 재적용 스킵)일 뿐 — 이 비교가 틀리거나 밀려도
        // applyRow가 멱등적이라 데이터가 틀어지지 않는다.
        if (incomingVersion !== null && incomingVersion <= state.version) return;
        applyRow(tripId, payload.new);
      }).subscribe();

    return () => { unsubscribeListener(); client.removeChannel(channel); };
  }

  // ---------------------------------------------------------------------
  // 쓰기: patch(단순필드) / upsertItems / deleteItems — 전부 pending에 쌓고 flush 예약
  // ---------------------------------------------------------------------
  // 내 변경(patch/upsert/delete)으로 이 여행 데이터에서 빠진 저장소 사진을 알려 준다 → 삭제 후보로 담김.
  // (실제 파일 삭제는 슝으로 되살릴 수 없게 된 뒤 photoCleanup이 사용 여부를 확인하고 한다)
  function withPhotoTracking(tripId, change) {
    if (!onPhotosRemoved || isGuest() || !trips.has(tripId)) { change(); return; }
    const before = extractPhotoPaths(currentView(getState(tripId)));
    change();
    if (before.length === 0) return;
    const after = new Set(extractPhotoPaths(currentView(getState(tripId))));
    const removed = before.filter(path => !after.has(path));
    if (removed.length > 0) { try { onPhotosRemoved(tripId, removed); } catch (e) { console.error('[tripSyncEngine] onPhotosRemoved error', e); } }
  }

  function patch(tripId, fields) {
    if (!fields || typeof fields !== 'object') return;
    withPhotoTracking(tripId, () => patchNow(tripId, fields));
  }

  function patchNow(tripId, fields) {
    const state = getState(tripId);
    Object.assign(state.pendingScalars, fields);
    Object.assign(state.scalars, fields); // 화면엔 낙관적으로 즉시 반영
    persistLocal(tripId, state);
    persistPending(tripId, state);
    notify(tripId);
    scheduleFlush(tripId);
  }

  function upsertItems(tripId, field, items) {
    if (!isArrayField(field) || !Array.isArray(items) || items.length === 0) return;
    withPhotoTracking(tripId, () => upsertItemsNow(tripId, field, items));
  }

  function upsertItemsNow(tripId, field, items) {
    const state = getState(tripId);
    if (!state.pendingUpserts.has(field)) state.pendingUpserts.set(field, new Map());
    const bucket = state.pendingUpserts.get(field);
    items.filter(Boolean).forEach(item => { if (item.id != null) bucket.set(String(item.id), item); });
    // 같은 항목에 대기 중이던 삭제가 있으면 이번 저장이 이긴다
    const del = state.pendingDeletes.get(field);
    if (del) items.forEach(item => { if (item && item.id != null) del.delete(String(item.id)); });
    applyOptimisticArrayChange(tripId, state, field);
    persistPending(tripId, state);
    scheduleFlush(tripId);
  }

  function deleteItems(tripId, field, ids) {
    if (!isArrayField(field) || !Array.isArray(ids) || ids.length === 0) return;
    withPhotoTracking(tripId, () => deleteItemsNow(tripId, field, ids));
  }

  function deleteItemsNow(tripId, field, ids) {
    const state = getState(tripId);
    if (!state.pendingDeletes.has(field)) state.pendingDeletes.set(field, new Set());
    const bucket = state.pendingDeletes.get(field);
    ids.filter(id => id != null).forEach(id => bucket.add(String(id)));
    applyOptimisticArrayChange(tripId, state, field);
    persistPending(tripId, state);
    scheduleFlush(tripId);
  }

  // upsert/delete를 호출한 그 순간 화면에 즉시 반영한다(네트워크 저장이 끝날 때까지 기다리지 않음).
  // 나중에 실제 저장(doFlush)이 끝나면 서버의 진짜 최신 상태로 다시 한번 authoritative하게 덮어써진다
  // (다른 협업자의 동시 편집이 있었다면 그 내용까지 반영된 진짜 병합 결과로 교체됨).
  function applyOptimisticArrayChange(tripId, state, field) {
    const upserts = Array.from((state.pendingUpserts.get(field) || new Map()).values());
    const deleteIds = Array.from(state.pendingDeletes.get(field) || []);
    const base = state.base.get(field) || new Map();
    const mergedRaw = mergeArrayField({ dbItems: state.rawArrays[field] || [], upserts, deleteIds, base });
    state.rawArrays[field] = mergedRaw;
    const { realItems } = splitTombstones(mergedRaw);
    state.base.set(field, new Map(realItems.map(it => [String(it.id), it])));
    const cleanFn = ARRAY_FIELDS[field].clean;
    state.views[field] = cleanFn ? cleanFn(mergedRaw, state.scalars.display_city_name) : realItems;
    persistLocal(tripId, state);
    notify(tripId);
  }

  function hasPending(state) {
    return Object.keys(state.pendingScalars).length > 0 || state.pendingUpserts.size > 0 || state.pendingDeletes.size > 0;
  }

  function takePendingSnapshot(state) {
    const snapshot = { scalars: state.pendingScalars, upserts: state.pendingUpserts, deletes: state.pendingDeletes };
    state.pendingScalars = {};
    state.pendingUpserts = new Map();
    state.pendingDeletes = new Map();
    return snapshot;
  }

  function scheduleFlush(tripId, delayOverride) {
    const state = getState(tripId);
    if (state.flushTimer || state.flushPromise) return; // 이미 예약됐거나 진행 중 — 끝나면 알아서 다시 확인함
    const delay = typeof delayOverride === 'number' ? delayOverride : (state.retryDelay || FLUSH_DELAY_MS);
    state.flushTimer = setTimeout(() => {
      state.flushTimer = null;
      state.flushPromise = doFlush(tripId).finally(() => {
        state.flushPromise = null;
        if (hasPending(state)) scheduleFlush(tripId);
      });
    }, delay);
  }

  // 저장 실패 → 대기열에 되돌리고 재시도 간격을 늘린다 (2초 → 4초 → … 최대 1분)
  function failAndRetryLater(tripId, state, batch) {
    requeue(tripId, state, batch);
    state.retryDelay = state.retryDelay ? Math.min(state.retryDelay * 2, RETRY_MAX_MS) : RETRY_MIN_MS;
  }

  async function doFlush(tripId) {
    const state = getState(tripId);
    if (!hasPending(state)) return;
    const batch = takePendingSnapshot(state);

    if (isGuest()) {
      applyLocalBatch(tripId, state, batch);
      persistPending(tripId, state);
      return;
    }

    const client = getClient();
    const touchedScalarKeys = Object.keys(batch.scalars);
    const touchedArrayFields = Array.from(new Set([...batch.upserts.keys(), ...batch.deletes.keys()]));
    if (touchedScalarKeys.length === 0 && touchedArrayFields.length === 0) return;
    const selectCols = ['version', ...touchedArrayFields].join(',');

    for (let attempt = 0; attempt < MAX_WRITE_RETRIES; attempt++) {
      const { data: latest, error: selErr } = await client.from('travel_state').select(selectCols).eq('id', tripId).single();
      if (selErr || !latest) {
        console.error('❌ [동기화] 최신 데이터 조회 실패', selErr);
        // 행이 안 보이면(강퇴 등으로 접근 권한이 사라짐) 앱에 알려서 화면/목록을 정리하게 한다 — 이 변경은 보낼 곳이 없다.
        if (selErr && selErr.code === NO_ROW_CODE) {
          persistPending(tripId, state);
          if (typeof onAccessLost === 'function') onAccessLost(tripId);
          return;
        }
        // 그 외(오프라인·서버 오류)는 변경을 버리지 않고 대기열에 되돌려 나중에 다시 보낸다
        failAndRetryLater(tripId, state, batch);
        return;
      }
      const payload = { version: (latest.version || 0) + 1 };
      touchedScalarKeys.forEach(k => { payload[k] = batch.scalars[k]; });
      touchedArrayFields.forEach(field => {
        const upserts = Array.from((batch.upserts.get(field) || new Map()).values());
        const deleteIds = Array.from(batch.deletes.get(field) || []);
        const base = state.base.get(field) || new Map();
        payload[field] = mergeArrayField({ dbItems: latest[field], upserts, deleteIds, base });
      });

      const { data: updated, error: updErr } = await client
        .from('travel_state')
        .update(payload)
        .eq('id', tripId)
        .eq('version', latest.version || 0)
        .select('id');

      if (updErr) {
        // 서버에 아직 없는 칸(새 칸을 만드는 SQL을 실행하기 전)을 보내서 실패했으면, 그 칸만 빼고 바로 다시 보낸다.
        // 안 그러면 실패 → 재시도가 끝없이 반복돼 다른 변경까지 전부 저장되지 않는다(009 사고와 같은 유형).
        const missingCol = (updErr.code === '42703' || updErr.code === 'PGRST204')
          ? (String(updErr.message || '').match(/'([a-z_]+)' column|column "?([a-z_]+)"?/) || []).slice(1).find(Boolean)
          : null;
        if (missingCol && Object.prototype.hasOwnProperty.call(batch.scalars, missingCol)) {
          console.warn(`[동기화] 서버에 '${missingCol}' 칸이 없어 이 칸만 빼고 다시 저장합니다`);
          delete batch.scalars[missingCol];
          const idx = touchedScalarKeys.indexOf(missingCol);
          if (idx >= 0) touchedScalarKeys.splice(idx, 1);
          if (touchedScalarKeys.length === 0 && touchedArrayFields.length === 0) return;
          continue;
        }
        console.error('❌ [동기화] 저장 실패', updErr);
        failAndRetryLater(tripId, state, batch);
        return;
      }
      if (Array.isArray(updated) && updated.length > 0) {
        state.zeroRowStreak = 0;
        state.retryDelay = 0;
        persistPending(tripId, state);
        applyRow(tripId, payload);
        return;
      }
      // 0건 반영 = version 충돌(다른 저장이 먼저 끼어듦) → 재시도
    }

    // 재시도 소진 — RLS 등으로 계속 0건이면 한 번만 알림 (변경은 버리지 않고 나중에 다시 시도)
    failAndRetryLater(tripId, state, batch);
    state.zeroRowStreak += 1;
    if (state.zeroRowStreak === 1 && typeof onToast === 'function') {
      onToast('⚠️ 저장 권한 확인이 필요합니다. 로그아웃 후 다시 로그인해 주세요.');
    }
  }

  // 게스트 모드: 네트워크 없이 로컬 state만 갱신
  function applyLocalBatch(tripId, state, batch) {
    const row = { ...batch.scalars };
    const touchedArrayFields = Array.from(new Set([...batch.upserts.keys(), ...batch.deletes.keys()]));
    touchedArrayFields.forEach(field => {
      const upserts = Array.from((batch.upserts.get(field) || new Map()).values());
      const deleteIds = Array.from(batch.deletes.get(field) || []);
      const base = state.base.get(field) || new Map();
      row[field] = mergeArrayField({ dbItems: state.rawArrays[field] || [], upserts, deleteIds, base });
    });
    applyRow(tripId, row);
  }

  // ---------------------------------------------------------------------
  // 강제 flush — 탭 닫힘/전환 시 대기 중인 저장을 최대한 내보낼 때 사용
  // ---------------------------------------------------------------------
  async function flushNow(tripId) {
    const targetIds = tripId ? [tripId] : Array.from(trips.keys());
    await Promise.all(targetIds.map(async id => {
      const state = getState(id);
      if (state.flushTimer) { clearTimeout(state.flushTimer); state.flushTimer = null; }
      if (state.flushPromise) await state.flushPromise;
      if (hasPending(state)) await doFlush(id);
    }));
  }

  // 앱을 껐다 켜기 전에 못 보낸 변경이 브라우저에 남아 있으면 대기열로 되살린다 (지금 대기열이 비어 있을 때만)
  function restoreStoredPending(tripId) {
    const state = getState(tripId);
    if (hasPending(state)) return;
    try {
      const all = JSON.parse(localStorage.getItem(PENDING_STORAGE_KEY) || '{}');
      const saved = all[tripId];
      if (!saved) return;
      state.pendingScalars = saved.scalars || {};
      Object.entries(saved.upserts || {}).forEach(([f, items]) => {
        if (isArrayField(f) && Array.isArray(items) && items.length) state.pendingUpserts.set(f, new Map(items.filter(Boolean).map(it => [String(it.id), it])));
      });
      Object.entries(saved.deletes || {}).forEach(([f, ids]) => {
        if (isArrayField(f) && Array.isArray(ids) && ids.length) state.pendingDeletes.set(f, new Set(ids.map(String)));
      });
      if (typeof onToast === 'function' && hasPending(state)) onToast('📤 저장하지 못했던 변경을 다시 보내는 중이에요.');
    } catch (e) {}
  }

  // 인터넷이 다시 연결되면 기다리던 저장을 바로 보낸다
  if (typeof window !== 'undefined') {
    window.addEventListener('online', () => {
      trips.forEach((state, id) => {
        if (!hasPending(state)) return;
        state.retryDelay = 0;
        if (state.flushTimer) { clearTimeout(state.flushTimer); state.flushTimer = null; }
        scheduleFlush(id, 0);
      });
    });
  }

  // 이 여행을 지금도 볼 수 있는지 확인: 'ok' | 'denied'(행이 안 보임) | 'unknown'(네트워크 오류 등 — 판단 보류)
  async function checkAccess(tripId) {
    if (isGuest()) return 'ok';
    try {
      const { data, error } = await getClient().from('travel_state').select('id').eq('id', tripId).single();
      if (data) return 'ok';
      if (error && error.code === NO_ROW_CODE) return 'denied';
      return 'unknown';
    } catch (e) { return 'unknown'; }
  }

  // 더 이상 접근할 수 없는 여행의 대기 중 저장과 이 기기 캐시를 버린다 (강퇴 후 남아 있던 내 화면 변경 정리)
  function forgetTrip(tripId) {
    const state = trips.get(tripId);
    if (state && state.flushTimer) clearTimeout(state.flushTimer);
    trips.delete(tripId);
    try {
      const all = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY) || '{}');
      delete all[tripId];
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(all));
      const pend = JSON.parse(localStorage.getItem(PENDING_STORAGE_KEY) || '{}');
      delete pend[tripId];
      localStorage.setItem(PENDING_STORAGE_KEY, JSON.stringify(pend));
    } catch (e) {}
  }

  return {
    checkAccess, forgetTrip,
    setActiveTrip, getActiveTrip,
    load, reload, subscribeTrip,
    patch, upsertItems, deleteItems,
    flushNow,
    tombstone, // 편의상 재노출 (호출부에서 매번 import 안 해도 되도록)
  };
}
