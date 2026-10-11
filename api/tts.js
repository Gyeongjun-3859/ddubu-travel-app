// Vercel 서버 함수: 현지어 문장 발음(구글 번역 음성)을 대신 받아 준다.
// 구글은 다른 사이트에서 부른 요청(Referer가 우리 사이트)을 거절(404)해서 화면의 <audio>로는 재생이 안 됐다.
// 서버에서 Referer 없이 받아 mp3를 그대로 돌려준다. 회화집 문장은 미리 만든 파일(public/tts)을 쓰고,
// 여기는 회화집이 없는 나라의 기계 번역 문장용.
//   GET /api/tts?tl=vi&q=Xin chào
// <audio>로 부르므로 CORS는 필요 없다. 남이 마구 쓰지 못하게 다른 사이트에서 온 요청은 거절하고 문장 길이를 제한한다.
const ALLOWED_REFERER = /^(https:\/\/ddubu-travel-app\.vercel\.app|https?:\/\/localhost(:\d+)?|capacitor:\/\/localhost|https?:\/\/127\.0\.0\.1(:\d+)?)(\/|$)/;

export default async function handler(req, res) {
  const referer = (req.headers && req.headers.referer) || '';
  if (referer && !ALLOWED_REFERER.test(referer)) { res.status(403).end(); return; }
  const q = String((req.query && req.query.q) || '').trim().slice(0, 200);
  const tl = String((req.query && req.query.tl) || '').trim();
  if (!q || !/^[a-z]{2,3}(-[A-Za-z]{2,4})?$/.test(tl)) { res.status(400).end(); return; }
  try {
    const r = await fetch(`https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(q)}&tl=${encodeURIComponent(tl)}&client=tw-ob`, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
    });
    if (!r.ok || !(r.headers.get('content-type') || '').includes('audio')) { res.status(502).end(); return; }
    const buf = Buffer.from(await r.arrayBuffer());
    res.setHeader('Content-Type', 'audio/mpeg');
    // 같은 문장은 Vercel과 휴대폰이 한 달 동안 기억 (요청 수 절약)
    res.setHeader('Cache-Control', 'public, max-age=2592000, s-maxage=2592000');
    res.status(200).send(buf);
  } catch (e) {
    res.status(500).end();
  }
}
