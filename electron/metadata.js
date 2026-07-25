// 링크의 공개 정보(제목·썸네일·작성자)를 가져온다.
// 로그인/계정 접근 없이, 공개 oEmbed 엔드포인트와 OpenGraph 태그만 사용한다.
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

async function get(url, { json = false, timeout = 8000 } = {}) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeout);
  try {
    const res = await fetch(url, {
      signal: ctrl.signal,
      redirect: 'follow',
      headers: { 'User-Agent': UA, 'Accept': json ? 'application/json' : 'text/html,application/xhtml+xml,*/*' }
    });
    if (!res.ok) return null;
    if (json) return await res.json();
    const ct = res.headers.get('content-type') || '';
    if (!/html|text/i.test(ct)) return null;
    return await res.text();
  } catch (e) {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

function decodeEntities(s) {
  if (!s) return s;
  return s
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#0?39;|&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)));
}

function metaTag(html, key) {
  const patterns = [
    new RegExp('<meta[^>]+(?:property|name)=["\']' + key + '["\'][^>]*content=["\']([^"\']*)["\']', 'i'),
    new RegExp('<meta[^>]+content=["\']([^"\']*)["\'][^>]*(?:property|name)=["\']' + key + '["\']', 'i')
  ];
  for (const re of patterns) {
    const m = html.match(re);
    if (m && m[1]) return decodeEntities(m[1].trim());
  }
  return null;
}

function titleTag(html) {
  const m = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  return m ? decodeEntities(m[1].trim()) : null;
}

function clean(m) {
  const out = {};
  if (m.title) out.title = String(m.title).replace(/\s+/g, ' ').trim().slice(0, 200);
  if (m.thumb && /^https?:\/\//i.test(m.thumb)) out.thumb = m.thumb.trim();
  if (m.description) out.description = String(m.description).replace(/\s+/g, ' ').trim().slice(0, 300);
  if (m.author) out.author = String(m.author).trim().slice(0, 100);
  return out;
}

async function fetchMeta(rawUrl) {
  let url;
  try { url = new URL(rawUrl); } catch (e) { return {}; }
  const host = url.hostname;
  const enc = encodeURIComponent(rawUrl);

  // 1) 공식 oEmbed (키·로그인 불필요)
  try {
    if (/youtube\.com|youtu\.be/.test(host)) {
      const j = await get('https://www.youtube.com/oembed?format=json&url=' + enc, { json: true });
      if (j) return clean({ title: j.title, thumb: j.thumbnail_url, author: j.author_name });
    }
    if (/tiktok\.com/.test(host)) {
      const j = await get('https://www.tiktok.com/oembed?url=' + enc, { json: true });
      if (j) return clean({ title: j.title, thumb: j.thumbnail_url, author: j.author_name });
    }
    if (/twitter\.com|(^|\.)x\.com/.test(host)) {
      const j = await get('https://publish.twitter.com/oembed?omit_script=1&url=' + enc, { json: true });
      if (j) {
        const text = j.html ? j.html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim() : null;
        return clean({ title: text, author: j.author_name });
      }
    }
  } catch (e) {}

  // 2) OpenGraph 폴백 (공개 페이지 — 인스타그램 공개 게시물 등 일부 포함)
  const html = await get(rawUrl);
  if (!html) return {};
  return clean({
    title: metaTag(html, 'og:title') || titleTag(html),
    thumb: metaTag(html, 'og:image') || metaTag(html, 'og:image:url') || metaTag(html, 'twitter:image'),
    description: metaTag(html, 'og:description') || metaTag(html, 'description'),
    author: metaTag(html, 'og:site_name')
  });
}

module.exports = { fetchMeta };
