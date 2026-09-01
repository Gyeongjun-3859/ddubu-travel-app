// 여행 데이터(일정/핀/짐/쇼핑) 공용 모델.
// App.jsx 여러 곳에 흩어져 있던 "DB 원본 → 화면용 정제" 로직과 삭제 표식(tombstone) 규칙을
// 한 곳으로 모은다. saveToDb / 실시간 구독 / 최초 로드가 전부 이 파일의 함수만 쓰도록 만드는 것이
// 저장·동기화 재설계의 핵심이다 (자세한 배경은 .claude/plans의 재설계 계획 문서 참고).

import { REGIONS_BY_COUNTRY } from '../utils/constants';
import { S } from '../utils/helpers';

// ---------------------------------------------------------------------------
// 내용 비교: updatedAt을 제외하고 키를 정렬해서 직렬화 — "실제로 내용이 달라졌는지"를
// 안정적으로 비교하기 위한 용도. 두 값 다 이미 정제(clean)된 형태여야 정확하다
// (정제 전/후 형태를 섞어서 비교하면 정규화 차이 때문에 항상 "다름"으로 나온다).
// ---------------------------------------------------------------------------
export function stableStringify(obj) {
  if (obj === null || typeof obj !== 'object') return JSON.stringify(obj);
  if (Array.isArray(obj)) return `[${obj.map(stableStringify).join(',')}]`;
  const keys = Object.keys(obj).filter(k => k !== 'updatedAt').sort();
  return `{${keys.map(k => `${JSON.stringify(k)}:${stableStringify(obj[k])}`).join(',')}}`;
}

// ---------------------------------------------------------------------------
// 삭제 표식(tombstone). 배열에서 항목이 "빠졌다"는 사실만으로는 절대 삭제로 간주하지
// 않는다 — 항상 이 표식을 명시적으로 남겨야만 삭제로 처리한다.
// ---------------------------------------------------------------------------
export function tombstone(id, now = Date.now()) {
  return { id: S(id), deleted: true, updatedAt: now };
}

export function isTombstone(x) {
  return Boolean(x && x.deleted);
}

// rawArray(=DB에서 그대로 읽은 배열, tombstone 포함)를 실제 항목과 tombstone id 집합으로 분리한다.
export function splitTombstones(rawArray) {
  const list = Array.isArray(rawArray) ? rawArray.filter(Boolean) : [];
  const tombstoneIds = new Set(list.filter(isTombstone).map(x => S(x.id)));
  const realItems = list.filter(x => typeof x === 'object' && !isTombstone(x));
  return { tombstoneIds, realItems };
}

// 오래된 tombstone은 병합 시점에 정리한다 (기본 30일 — 배열이 무한정 자라는 것 방지).
export function gcTombstones(rawArray, maxAgeMs = 30 * 24 * 60 * 60 * 1000) {
  const now = Date.now();
  return (Array.isArray(rawArray) ? rawArray : []).filter(x => {
    if (!x) return false;
    if (!isTombstone(x)) return true;
    return now - (x.updatedAt || 0) < maxAgeMs;
  });
}

// ---------------------------------------------------------------------------
// 일정(plan_timeline) 항목 정제
// ---------------------------------------------------------------------------
function resolveCountryRegion(p, fallbackCountry, fallbackRegion) {
  let rc = S(p.country), rr = S(p.region);
  if (rc && !Object.keys(REGIONS_BY_COUNTRY).includes(rc)) {
    for (const [cn, rs] of Object.entries(REGIONS_BY_COUNTRY)) { if (rs.includes(rr)) { rc = cn; break; } }
    if (!Object.keys(REGIONS_BY_COUNTRY).includes(rc)) {
      for (const [cn, rs] of Object.entries(REGIONS_BY_COUNTRY)) { if (rs.includes(p.country)) { rc = cn; rr = S(p.country); break; } }
    }
    if (!Object.keys(REGIONS_BY_COUNTRY).includes(rc) && fallbackCountry) { rc = fallbackCountry; rr = fallbackRegion; }
  }
  return { country: rc, region: rr };
}

export function cleanPlanItem(p, fallbackCountry = "", fallbackRegion = "") {
  return {
    id: S(p.id), day: p.day, time: S(p.time), place: S(p.place), localName: S(p.localName),
    features: S(p.features), photo: S(p.photo),
    photos: Array.isArray(p.photos) ? p.photos : (p.photo ? [S(p.photo)] : []),
    ...(p.rentalMeta ? { rentalMeta: p.rentalMeta } : {}),
    ...resolveCountryRegion(p, fallbackCountry, fallbackRegion),
    isAccommodation: Boolean(p.isAccommodation),
    accommodationDays: Array.isArray(p.accommodationDays) ? p.accommodationDays : [],
    isTransport: Boolean(p.isTransport), theme: S(p.theme) || "기타",
    expenseLocal: p.expenseLocal || "", expenseKrw: p.expenseKrw || "",
    rating: p.rating || 0, review: p.review || "", updatedAt: p.updatedAt || 0,
    transitNote: p.transitNote, transitFromPlace: S(p.transitFromPlace || ''),
    transitFromIsAccommodation: Boolean(p.transitFromIsAccommodation),
    ...(Array.isArray(p.transitRoutes) ? { transitRoutes: p.transitRoutes } : {}),
  };
}

// rawArray(DB 원본, tombstone 포함) → 화면에 뿌릴 수 있는 정제된 배열(tombstone 제외).
export function cleanPlanArray(rawArray, displayCityName) {
  const { realItems } = splitTombstones(rawArray);
  const fallbackCityName = displayCityName ? S(displayCityName) : "";
  let fallbackCountry = ""; let fallbackRegion = fallbackCityName;
  if (fallbackCityName) {
    for (const [cn, rs] of Object.entries(REGIONS_BY_COUNTRY)) { if (rs.includes(fallbackCityName)) { fallbackCountry = cn; break; } }
  }
  return realItems.map(p => cleanPlanItem(p, fallbackCountry, fallbackRegion));
}

// ---------------------------------------------------------------------------
// 지도 핀(current_restaurants) 항목 정제
// ---------------------------------------------------------------------------
export function cleanRestaurantItem(r) {
  return {
    id: S(r.id), name: S(r.name), localName: S(r.localName), signature: S(r.signature),
    img: S(r.img), imgs: Array.isArray(r.imgs) ? r.imgs : (r.img && !S(r.img).includes('unsplash') ? [S(r.img)] : []),
    country: S(r.country), city: S(r.city), lat: r.lat, lng: r.lng,
    isAccommodation: Boolean(r.isAccommodation), isLandmark: Boolean(r.isLandmark),
    theme: S(r.theme) || "기타", rating: r.rating || 0, review: r.review || "",
    // [신규] 예전엔 핀에 updatedAt이 아예 없어서 충돌 해결(누구 수정이 최신인지 비교)이 불가능했다.
    updatedAt: r.updatedAt || 0,
  };
}

export function cleanRestaurantArray(rawArray) {
  const { realItems } = splitTombstones(rawArray);
  return realItems.map(cleanRestaurantItem);
}

// ---------------------------------------------------------------------------
// 필드 레지스트리: 이 트립 문서의 각 필드를 어떻게 다룰지 한 곳에 선언.
// (동기화 엔진(Step 2)이 이 표를 기준으로 patch/upsert/delete를 라우팅한다.)
// ---------------------------------------------------------------------------
export const ARRAY_FIELDS = {
  plan_timeline: { clean: cleanPlanArray },       // clean(raw, displayCityName)
  current_restaurants: { clean: cleanRestaurantArray }, // clean(raw)
  packing_list: { clean: null },                  // pass-through, 정제 매퍼 없음
  shopping_list: { clean: null },                 // pass-through, 정제 매퍼 없음
};

export const SCALAR_FIELDS = ['display_city_name', 'travel_start_date', 'flights', 'max_day'];

// 동기화 엔진이 절대 쓰지 않는(보관함/공유 흐름 전용) 컬럼.
export const NON_SYNC_FIELDS = ['shared_users', 'archived', 'finish_date', 'owner_app_user_id'];

export function isArrayField(field) {
  return Object.prototype.hasOwnProperty.call(ARRAY_FIELDS, field);
}

// ---------------------------------------------------------------------------
// 배열 필드 병합의 유일한 구현. DB 최신 배열(tombstone 포함) + 이번에 반영할 upsert/delete를
// 받아서, 병합된 배열(역시 tombstone 포함 — DB 저장용)을 돌려준다.
// base가 주어지면 "직전에 알던 값"과 비교해서 실제로 내용이 바뀐 항목만 updatedAt을 지금
// 시각으로 새로 찍는다 (base 없이 DB 원본과 직접 비교하면 정제 전/후 형태 차이 때문에 항상
// "달라짐"으로 오판하는 문제가 있었음 — 반드시 정제된 값끼리, 같은 기준으로 비교해야 한다).
// ---------------------------------------------------------------------------
export function mergeArrayField({ dbItems, upserts = [], deleteIds = [], base = null }) {
  const now = Date.now();
  const dbMap = new Map((Array.isArray(dbItems) ? dbItems : []).filter(Boolean).map(x => [S(x.id), x]));

  upserts.forEach(item => {
    if (!item || item.id == null) return;
    const id = S(item.id);
    const dbItem = dbMap.get(id);
    let updatedAt = item.updatedAt;
    if (updatedAt == null) {
      const referenceItem = (base && base.get(id)) || dbItem;
      const a = stableStringify({ ...item, updatedAt: undefined });
      const b = referenceItem ? stableStringify({ ...referenceItem, updatedAt: undefined }) : null;
      const changed = !referenceItem || a !== b;
      updatedAt = changed ? now : (referenceItem?.updatedAt || 0);
    }
    if (!dbItem || updatedAt >= (dbItem.updatedAt || 0)) {
      dbMap.set(id, { ...item, updatedAt });
    }
  });

  deleteIds.forEach(id => {
    const sid = S(id);
    dbMap.set(sid, tombstone(sid, now));
  });

  return gcTombstones(Array.from(dbMap.values()));
}
