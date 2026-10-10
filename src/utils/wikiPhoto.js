// 위키백과 대표 사진 — 장소를 고르면 그 장소의 위키백과 문서 대표 사진을 찾아 '대표 사진'으로 자동 저장한다.
// (동방명주탑·가미나리몬·콕토베·광안리 같은 유명한 곳은 대부분 있고, 작은 가게는 없음 → 거리 사진으로 대신)
// 위키백과 사진은 위키미디어 공용의 자유 이용 사진이라 우리 저장소에 복사해도 된다(문서 링크로 출처 표시).
// 키가 필요 없다. 브라우저에서 부르려면 origin=* 를 붙인다.

const norm = (s) => String(s || '').toLowerCase().replace(/[\s·・,.()（）\-–—_'"`’]/g, '');

// 문서 제목이 찾는 이름과 비슷한지 — 근처의 다른 문서(예: 구로몬 시장 → 근처 역)를 거르기 위함.
// 한쪽이 다른 쪽을 포함하거나, 둘 다 4글자 이상이고 앞 4글자가 같으면 같은 장소로 본다.
// ('광안리해수욕장'과 '광안리역'처럼 앞 3글자만 같은 건 다른 곳)
function similar(title, names) {
  const t = norm(title);
  if (t.length < 2) return false;
  return names.filter(Boolean).map(norm).filter(n => n.length >= 2).some(n =>
    t.includes(n) || n.includes(t) || (t.length >= 4 && n.length >= 4 && t.slice(0, 4) === n.slice(0, 4))
  );
}

const distKm = (a, b) => Math.hypot((a.lat - b.lat) * 111, (a.lng - b.lng) * 111 * Math.cos(a.lat * Math.PI / 180));

// lang 위키백과에서 query로 찾아, 좌표가 3km 안이고 제목이 비슷하고 사진이 있는 첫 문서
async function searchWiki(lang, query, pos, names) {
  if (!query) return null;
  const params = new URLSearchParams({
    action: 'query', format: 'json', origin: '*', generator: 'search', gsrsearch: query, gsrlimit: '5',
    prop: 'pageimages|coordinates', piprop: 'thumbnail|name', pithumbsize: '1024',
  });
  const res = await fetch(`https://${lang}.wikipedia.org/w/api.php?${params}`);
  if (!res.ok) throw new Error(`wiki-${res.status}`);
  const data = await res.json();
  const pages = Object.values((data.query && data.query.pages) || {}).sort((a, b) => (a.index || 99) - (b.index || 99));
  for (const p of pages) {
    const c = (p.coordinates || [])[0];
    if (!p.thumbnail || !p.thumbnail.source || !c) continue;
    if (distKm(pos, { lat: c.lat, lng: c.lon }) > 3) continue; // 언덕·공원처럼 넓은 곳은 문서 좌표가 꽤 떨어져 있다(이름 비교와 함께 거름)
    if (!similar(p.title, names)) continue;
    return {
      source: 'wiki',
      full: p.thumbnail.source, thumb: p.thumbnail.source,
      author: p.title, // 출처 표시: "위키백과 · 문서 제목"
      link: `https://${lang}.wikipedia.org/wiki/${encodeURIComponent(p.title.replace(/ /g, '_'))}`,
      wikiImage: p.pageimage || '',
    };
  }
  return null;
}

// 장소 이름(한국어)·현지어 이름·좌표로 대표 사진 찾기. 없으면 null.
// localLang: 그 나라 위키백과 언어(ja·zh·ru·en …) — 한국어 위키에 없을 때 현지어 이름으로 한 번 더 찾는다.
export async function findWikiPhoto({ name, localName, lat, lng, localLang }) {
  if (!isFinite(lat) || !isFinite(lng) || !name) return null;
  const pos = { lat, lng };
  const names = [name, localName];
  localLang = String(localLang || '').split('-')[0]; // zh-CN → zh (위키백과 주소는 언어 앞부분만)
  const tries = [['ko', name]];
  if (localName && localLang && localLang !== 'ko') tries.push([localLang, localName]);
  if (localName && localLang !== 'en') tries.push(['en', localName]);
  for (const [lang, q] of tries) {
    try {
      const hit = await searchWiki(lang, q, pos, names);
      if (hit) return hit;
    } catch (e) {
      console.warn('[위키 대표 사진 찾기 실패]', lang, e && e.message);
    }
  }
  return null;
}
