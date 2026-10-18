import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Capacitor } from '@capacitor/core';
import { App as CapacitorApp } from '@capacitor/app';
import { X, BookOpen, Upload, Trash2, Download } from 'lucide-react';

// 📖 여행 가이드북 — 직접 만든 HTML 가이드북을 여행에 첨부해 앱 안에서 본다.
//
// - 파일은 사진과 같은 비공개 저장소(trip-photos)의 여행 폴더에 `guide-<시각>-<이름>.html`로 올린다.
//   여행 주인·참여자만 볼 수 있고(011 규칙), 목록은 폴더를 읽어 만든다(여행 데이터 칸을 새로 만들지 않음).
//   사진 정리(photoCleanup)는 '빠진 사진 후보'만 지우므로 가이드북은 지워지지 않는다.
// - 저장소 주소로 바로 띄우지 않고 내려받아 별도 창(iframe, sandbox — allow-same-origin 없음)에 띄운다.
//   가이드북 안의 스크립트(장 넘기기 등)는 돌지만 앱의 로그인 정보·저장소엔 손댈 수 없다.
// - 한 번 연 가이드북은 이 기기(IndexedDB)에 보관해 해외에서 인터넷이 없어도 열린다.

const BUCKET = 'trip-photos';
const MAX_BYTES = 50 * 1024 * 1024; // 무료 Supabase 파일 하나 한도
const LIST_KEY = 'my_travel_guide_list'; // { [tripId]: [{ path, name, size }] } — 오프라인 목록용
const DB_NAME = 'ddubu_guidebooks';
const STORE = 'files';

// ── 이 기기 보관 (IndexedDB: 가이드북은 수 MB라 localStorage엔 안 들어감) ──
function openDb() {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') { reject(new Error('no-idb')); return; }
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => { req.result.createObjectStore(STORE); };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}
async function idb(mode, fn) {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, mode);
    const req = fn(tx.objectStore(STORE));
    tx.oncomplete = () => { db.close(); resolve(req && req.result); };
    tx.onerror = () => { db.close(); reject(tx.error); };
  });
}
const cacheGet = (path) => idb('readonly', s => s.get(path)).catch(() => null);
const cachePut = (path, html) => idb('readwrite', s => s.put(html, path)).catch(() => {});
const cacheDel = (path) => idb('readwrite', s => s.delete(path)).catch(() => {});

function readListCache(tripId) {
  try { const all = JSON.parse(localStorage.getItem(LIST_KEY) || '{}') || {}; return Array.isArray(all[tripId]) ? all[tripId] : []; } catch (e) { return []; }
}
function writeListCache(tripId, list) {
  try { const all = JSON.parse(localStorage.getItem(LIST_KEY) || '{}') || {}; all[tripId] = list; localStorage.setItem(LIST_KEY, JSON.stringify(all)); } catch (e) {}
}

// 저장소 파일 이름엔 한글을 못 쓰니 원래 이름은 base64url로 담는다
function encodeName(name) {
  const bytes = new TextEncoder().encode(name);
  let bin = ''; bytes.forEach(b => { bin += String.fromCharCode(b); });
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
function decodeName(code) {
  try {
    const b64 = code.replace(/-/g, '+').replace(/_/g, '/');
    const bin = atob(b64 + '==='.slice((b64.length + 3) % 4));
    return new TextDecoder().decode(Uint8Array.from(bin, c => c.charCodeAt(0)));
  } catch (e) { return '가이드북'; }
}
function parseGuide(tripId, obj) {
  const m = /^guide-(\d+)-([A-Za-z0-9_-]*)\.html$/.exec(obj.name || '');
  if (!m) return null;
  return { path: `${tripId}/${obj.name}`, name: decodeName(m[2]) || '가이드북', size: (obj.metadata && obj.metadata.size) || 0, at: Number(m[1]) };
}
const fmtSize = (n) => (n >= 1024 * 1024 ? `${(n / 1024 / 1024).toFixed(1)}MB` : `${Math.max(1, Math.round(n / 1024))}KB`);

const GuidebookModal = ({ isOpen, onClose, client, tripId, canEdit, isGuest, isDarkMode, showToast }) => {
  const [list, setList] = useState(() => readListCache(tripId));
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(''); // 'upload' | path(여는 중)
  const [offlinePaths, setOfflinePaths] = useState({});
  const [confirmDel, setConfirmDel] = useState(null);
  const [viewer, setViewer] = useState(null); // { name, url }
  const fileRef = useRef(null);

  const refreshOffline = useCallback(async (items) => {
    const marks = {};
    await Promise.all(items.map(async it => { if (await cacheGet(it.path)) marks[it.path] = true; }));
    setOfflinePaths(marks);
  }, []);

  const loadList = useCallback(async () => {
    const cached = readListCache(tripId);
    setList(cached);
    refreshOffline(cached);
    if (!client || isGuest || !tripId) return;
    setLoading(true);
    try {
      const { data, error } = await client.storage.from(BUCKET).list(tripId, { search: 'guide-', limit: 100, sortBy: { column: 'name', order: 'asc' } });
      if (error) throw error;
      const items = (data || []).map(o => parseGuide(tripId, o)).filter(Boolean).sort((a, b) => a.at - b.at);
      setList(items);
      writeListCache(tripId, items);
      refreshOffline(items);
    } catch (e) {
      console.warn('[가이드북 목록 실패 — 이 기기 목록 사용]', e && e.message);
    } finally { setLoading(false); }
  }, [client, isGuest, tripId, refreshOffline]);

  useEffect(() => { if (isOpen) { setConfirmDel(null); loadList(); } }, [isOpen, loadList]);
  // 보던 창의 임시 주소 정리
  useEffect(() => () => { if (viewer && viewer.url) URL.revokeObjectURL(viewer.url); }, [viewer]);
  // 안드로이드 뒤로가기: 가이드북 화면이면 그 화면을, 목록 창이면 목록 창을 닫는다
  // (앱의 뒤로가기는 대시보드에선 아무것도 안 해서 전체 화면 가이드북을 닫을 방법이 ✕뿐이었다.
  //  가이드북 안의 시트는 가이드북 자체 닫기로 — 기록 개수로는 가이드북 안에서 더 뒤로 갈 곳이 있는지 알 수 없음)
  useEffect(() => {
    if (!isOpen || !Capacitor.isNativePlatform()) return undefined;
    const handler = CapacitorApp.addListener('backButton', () => {
      if (viewer) setViewer(null); else onClose();
    });
    return () => { handler.then(h => h.remove()); };
  }, [isOpen, viewer, onClose]);

  const openGuide = async (it) => {
    if (busy) return;
    setBusy(it.path);
    try {
      let html = await cacheGet(it.path);
      if (!html) {
        if (!client || isGuest) throw new Error('offline');
        const { data, error } = await client.storage.from(BUCKET).download(it.path);
        if (error) throw error;
        html = await data.text();
        await cachePut(it.path, html);
        setOfflinePaths(prev => ({ ...prev, [it.path]: true }));
      }
      const url = URL.createObjectURL(new Blob([html], { type: 'text/html;charset=utf-8' }));
      setViewer({ name: it.name, url });
    } catch (e) {
      console.warn('[가이드북 열기 실패]', e && e.message);
      showToast(navigator.onLine === false ? "인터넷이 없어서 열 수 없어요. 한 번 연 가이드북만 오프라인으로 볼 수 있어요." : "가이드북을 열지 못했어요. 잠시 뒤 다시 시도해 주세요.");
    } finally { setBusy(''); }
  };

  const onPickFile = async (e) => {
    const file = e.target.files && e.target.files[0];
    e.target.value = '';
    if (!file) return;
    if (!/\.html?$/i.test(file.name)) { showToast("HTML 파일(.html)만 올릴 수 있어요."); return; }
    if (file.size > MAX_BYTES) { showToast(`파일이 너무 커요 (${fmtSize(file.size)}). 50MB 이하만 올릴 수 있어요.`); return; }
    setBusy('upload');
    try {
      const html = await file.text();
      const baseName = file.name.replace(/\.html?$/i, '').slice(0, 60) || '가이드북';
      const path = `${tripId}/guide-${Date.now()}-${encodeName(baseName)}.html`;
      // text/plain으로 올려 저장소 주소로 열어도 웹페이지로 실행되지 않게 (앱은 내려받아 따로 띄움)
      const { error } = await client.storage.from(BUCKET).upload(path, new Blob([html], { type: 'text/plain;charset=utf-8' }), { contentType: 'text/plain;charset=utf-8' });
      if (error) throw error;
      await cachePut(path, html);
      showToast(`📖 '${baseName}' 가이드북을 올렸어요.`);
      await loadList();
    } catch (err) {
      console.warn('[가이드북 올리기 실패]', err);
      showToast(`가이드북을 올리지 못했어요: ${(err && err.message) || '알 수 없는 오류'}`);
    } finally { setBusy(''); }
  };

  const removeGuide = async (it) => {
    setConfirmDel(null);
    try {
      const { data, error } = await client.storage.from(BUCKET).remove([it.path]);
      if (error) throw error;
      // 저장소 규칙상 올린 사람만 지울 수 있다 (남이 올린 건 조용히 0개)
      if (!Array.isArray(data) || data.length === 0) { showToast("직접 올린 가이드북만 지울 수 있어요."); return; }
      await cacheDel(it.path);
      showToast("가이드북을 지웠어요.");
      await loadList();
    } catch (err) {
      console.warn('[가이드북 삭제 실패]', err);
      showToast("가이드북을 지우지 못했어요.");
    }
  };

  if (!isOpen) return null;

  const panel = isDarkMode ? 'bg-slate-800 border-slate-700 text-slate-100' : 'bg-white border-slate-200 text-slate-800';
  const muted = isDarkMode ? 'text-slate-400' : 'text-slate-500';

  return createPortal(
    <>
      <div className="fixed inset-0 z-[9000] flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
        <div className={`w-full max-w-sm rounded-2xl border p-4 shadow-2xl ${panel}`} onClick={e => e.stopPropagation()}>
          <div className="mb-3 flex items-center justify-between">
            <h3 className="flex items-center gap-1.5 text-[15px] font-bold"><BookOpen className="w-4 h-4 text-[#007AFF]" /> 여행 가이드북</h3>
            <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600" aria-label="닫기"><X className="w-4 h-4" /></button>
          </div>

          {isGuest ? (
            <p className={`py-6 text-center text-[12px] ${muted}`}>로그인하면 여행에 가이드북을 붙일 수 있어요.</p>
          ) : (
            <>
              <div className="flex max-h-[50vh] flex-col gap-1.5 overflow-y-auto">
                {list.length === 0 && (
                  <p className={`py-6 text-center text-[12px] ${muted}`}>{loading ? '불러오는 중…' : '아직 붙인 가이드북이 없어요.'}</p>
                )}
                {list.map(it => (
                  <div key={it.path} className={`flex items-center gap-2 rounded-xl border px-3 py-2.5 ${isDarkMode ? 'border-slate-700 bg-slate-900/40' : 'border-slate-200 bg-slate-50'}`}>
                    <button onClick={() => openGuide(it)} className="min-w-0 flex-1 text-left">
                      <span className="block truncate text-[13px] font-semibold">📖 {it.name}</span>
                      <span className={`block text-[10px] ${muted}`}>
                        {it.size ? fmtSize(it.size) : ''}{offlinePaths[it.path] ? ' · 📥 오프라인 저장됨' : ''}{busy === it.path ? ' · 여는 중…' : ''}
                      </span>
                    </button>
                    {canEdit && (confirmDel === it.path ? (
                      <button onClick={() => removeGuide(it)} className="shrink-0 rounded-md bg-rose-500 px-2 py-1 text-[10px] font-bold text-white">정말 삭제</button>
                    ) : (
                      <button onClick={() => setConfirmDel(it.path)} className="shrink-0 p-1 text-slate-400 hover:text-rose-500" aria-label="가이드북 삭제"><Trash2 className="w-3.5 h-3.5" /></button>
                    ))}
                  </div>
                ))}
              </div>
              {canEdit ? (
                <>
                  <input ref={fileRef} type="file" accept=".html,.htm,text/html" className="hidden" onChange={onPickFile} />
                  <button
                    onClick={() => fileRef.current && fileRef.current.click()}
                    disabled={busy === 'upload'}
                    className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-xl bg-[#007AFF] py-2.5 text-[13px] font-bold text-white disabled:opacity-60"
                  >
                    <Upload className="w-4 h-4" /> {busy === 'upload' ? '올리는 중…' : 'HTML 가이드북 올리기'}
                  </button>
                </>
              ) : (
                <p className={`mt-3 text-center text-[11px] ${muted}`}>보기 전용 여행이라 가이드북을 보기만 할 수 있어요.</p>
              )}
              <p className={`mt-2 flex items-center justify-center gap-1 text-[10px] ${muted}`}><Download className="w-3 h-3" /> 한 번 연 가이드북은 인터넷 없이도 열려요</p>
            </>
          )}
        </div>
      </div>

      {viewer && (
        <div className="fixed inset-0 z-[9100] flex flex-col bg-white" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
          <div className="flex shrink-0 items-center gap-2 border-b border-slate-200 bg-white px-3 py-2">
            <span className="min-w-0 flex-1 truncate text-[13px] font-bold text-slate-800">📖 {viewer.name}</span>
            <button onClick={() => setViewer(null)} className="flex items-center gap-1 rounded-lg bg-slate-100 px-3 py-1.5 text-[12px] font-bold text-slate-700">
              <X className="w-4 h-4" /> 닫기
            </button>
          </div>
          <iframe
            title={viewer.name}
            src={viewer.url}
            className="w-full flex-1 border-0"
            sandbox="allow-scripts allow-popups allow-popups-to-escape-sandbox allow-downloads allow-modals"
            allow="fullscreen; clipboard-write"
            allowFullScreen
          />
        </div>
      )}
    </>,
    document.body
  );
};

export default GuidebookModal;
