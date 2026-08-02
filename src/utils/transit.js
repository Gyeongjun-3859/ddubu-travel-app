import { S } from './helpers';
import { ODSAY_API_KEY } from './constants';

// 지하철 노선별 공식 색상(대표 노선 위주, 못 찾으면 기본색)
export const SUBWAY_LINE_COLORS = {
  '1호선': '#0052A4', '2호선': '#00A84D', '3호선': '#EF7C1C', '4호선': '#00A5DE',
  '5호선': '#996CAC', '6호선': '#CD7C2F', '7호선': '#747F00', '8호선': '#E6186C',
  '9호선': '#BDB092', '경의중앙선': '#77C4A3', '분당선': '#F5A200', '신분당선': '#D4003B',
  '경춘선': '#0C8E72', '수인분당선': '#F5A200', '공항철도': '#0090D2', '경강선': '#003DA5',
  '서해선': '#8FC31F', '김포골드라인': '#A17800', '신림선': '#6789CA', '우이신설선': '#B0CE18',
};

export const getLineColor = (name, trafficType) => {
  if (trafficType === 2) return '#3b82f6'; // 버스는 파랑 계열 통일
  const key = Object.keys(SUBWAY_LINE_COLORS).find(k => S(name).includes(k));
  return key ? SUBWAY_LINE_COLORS[key] : '#6366f1';
};

export const toCoordList = (sp) => {
  const stations = sp.passStopList?.stations || sp.passStopList?.station || [];
  let coords = (Array.isArray(stations) ? stations : [])
    .map(st => ({ lat: parseFloat(st.y), lng: parseFloat(st.x) }))
    .filter(c => !isNaN(c.lat) && !isNaN(c.lng));
  if (coords.length === 0) {
    coords = [];
    if (sp.startY && sp.startX) coords.push({ lat: parseFloat(sp.startY), lng: parseFloat(sp.startX) });
    if (sp.endY && sp.endX) coords.push({ lat: parseFloat(sp.endY), lng: parseFloat(sp.endX) });
  }
  return coords;
};

export const summarizePath = (path) => {
  const segments = (path.subPath || []).map(sp => {
    const laneName = sp.trafficType === 1 ? (sp.lane?.[0]?.name || '지하철')
      : sp.trafficType === 2 ? (sp.lane?.[0]?.busNo || '버스') : '도보';
    return {
      trafficType: sp.trafficType,
      laneName,
      way: sp.trafficType === 1 ? S(sp.way) : '',
      startName: S(sp.startName),
      endName: S(sp.endName),
      sectionTime: Number(sp.sectionTime) || 0,
      color: getLineColor(laneName, sp.trafficType),
      coords: toCoordList(sp),
    };
  });
  const transitSegs = segments.filter(s => s.trafficType !== 3);
  const transferCount = Math.max(0, transitSegs.length - 1);
  const totalTime = Number(path.info?.totalTime) || segments.reduce((a, s) => a + s.sectionTime, 0);
  const summaryText = transitSegs.map(s => `${s.laneName}${s.way ? ` ${s.way}방향` : ''} (${s.startName}→${s.endName})`).join(' → ');
  const tagLabel = `${transitSegs.map(s => s.laneName).join('·') || '도보'} · ${totalTime}분`;
  return { segments, transferCount, totalTime, summaryText, tagLabel };
};

export const fetchOdsayRoutes = async (fromCoord, toCoord) => {
  const url = `https://api.odsay.com/v1/api/searchPubTransPathT?SX=${fromCoord.lng}&SY=${fromCoord.lat}&EX=${toCoord.lng}&EY=${toCoord.lat}&apiKey=${encodeURIComponent(ODSAY_API_KEY)}`;
  const res = await fetch(url);
  const data = await res.json();
  const paths = data?.result?.path || [];
  return paths.map(summarizePath).filter(r => r.summaryText);
};
