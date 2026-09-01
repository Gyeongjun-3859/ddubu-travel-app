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

const FLUSH_DELAY_MS = 200;
const MAX_WRITE_RETRIES = 3;
const LOCAL_STORAGE_KEY = 'my_travel_states';

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
    loaded: false,
  };
}

export function createTripSyncEngine({ getClient, getUserId, onToast }) {
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
    [...SCALAR_FIELDS, 'shared_users', 'archived', 'finish_date', 'owner_app_user_id'].forEach(field => {
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

    state.loaded = true;
    persistLocal(tripId, state);
    notify(tripId);
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
      if (error || !data) return null; // 여행 row가 아직 없을 수 있음(생성 직후 race) — 기존 로컬 상태 보존, 아무것도 안 바꿈
      applyRow(tripId, data);
      return currentView(getState(tripId));
    } catch (e) {
      console.error('[tripSyncEngine] load 실패', e);
      return null;
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
  function patch(tripId, fields) {
    if (!fields || typeof fields !== 'object') return;
    const state = getState(tripId);
    Object.assign(state.pendingScalars, fields);
    Object.assign(state.scalars, fields); // 화면엔 낙관적으로 즉시 반영
    persistLocal(tripId, state);
    notify(tripId);
    scheduleFlush(tripId);
  }

  function upsertItems(tripId, field, items) {
    if (!isArrayField(field) || !Array.isArray(items) || items.length === 0) return;
    const state = getState(tripId);
    if (!state.pendingUpserts.has(field)) state.pendingUpserts.set(field, new Map());
    const bucket = state.pendingUpserts.get(field);
    items.filter(Boolean).forEach(item => { if (item.id != null) bucket.set(String(item.id), item); });
    applyOptimisticArrayChange(tripId, state, field);
    scheduleFlush(tripId);
  }

  function deleteItems(tripId, field, ids) {
    if (!isArrayField(field) || !Array.isArray(ids) || ids.length === 0) return;
    const state = getState(tripId);
    if (!state.pendingDeletes.has(field)) state.pendingDeletes.set(field, new Set());
    const bucket = state.pendingDeletes.get(field);
    ids.filter(id => id != null).forEach(id => bucket.add(String(id)));
    applyOptimisticArrayChange(tripId, state, field);
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

  function scheduleFlush(tripId) {
    const state = getState(tripId);
    if (state.flushTimer || state.flushPromise) return; // 이미 예약됐거나 진행 중 — 끝나면 알아서 다시 확인함
    state.flushTimer = setTimeout(() => {
      state.flushTimer = null;
      state.flushPromise = doFlush(tripId).finally(() => {
        state.flushPromise = null;
        if (hasPending(state)) scheduleFlush(tripId);
      });
    }, FLUSH_DELAY_MS);
  }

  async function doFlush(tripId) {
    const state = getState(tripId);
    if (!hasPending(state)) return;
    const batch = takePendingSnapshot(state);

    if (isGuest()) {
      applyLocalBatch(tripId, state, batch);
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
        break;
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
        console.error('❌ [동기화] 저장 실패', updErr);
        break;
      }
      if (Array.isArray(updated) && updated.length > 0) {
        state.zeroRowStreak = 0;
        applyRow(tripId, payload);
        return;
      }
      // 0건 반영 = version 충돌(다른 저장이 먼저 끼어듦) → 재시도
    }

    // 재시도 소진 — RLS 등으로 계속 0건이면 한 번만 알림
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

  return {
    setActiveTrip, getActiveTrip,
    load, reload, subscribeTrip,
    patch, upsertItems, deleteItems,
    flushNow,
    tombstone, // 편의상 재노출 (호출부에서 매번 import 안 해도 되도록)
  };
}
