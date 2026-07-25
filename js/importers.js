// 외부 내보내기 파일 → 다시봄 항목 변환
// 지원: 인스타그램 "내 정보 다운로드"(JSON), Google Takeout 유튜브(CSV)
import { detectSource } from './utils.js';

let seq = 0;
const uid = () => Date.now() * 1000 + (seq++ % 1000);

export const YT_PLACEHOLDER = 'YouTube 영상';

function base(url) {
  return {
    id: uid(), url, title: '', memo: '', src: detectSource(url),
    tags: [], col: null, thumb: null, pinned: false, saved: Date.now(), seen: false
  };
}

function parseTs(v) {
  if (v == null || v === '') return Date.now();
  if (typeof v === 'number') return v < 1e12 ? v * 1000 : v;      // 초 → 밀리초
  const n = Number(v);
  if (!Number.isNaN(n)) return n < 1e12 ? n * 1000 : n;
  const t = Date.parse(v);
  return Number.isNaN(t) ? Date.now() : t;
}

// ── JSON (인스타그램 등) ───────────────────
function extractHref(e) {
  if (!e || typeof e !== 'object') return null;
  // 저장한 게시물: { string_map_data: { "Saved on": {href, timestamp} } }
  if (e.string_map_data) {
    for (const k of Object.keys(e.string_map_data)) {
      const v = e.string_map_data[k];
      if (v && typeof v.href === 'string' && v.href) return { href: v.href, ts: v.timestamp };
    }
  }
  // 좋아요한 게시물: { string_list_data: [{href, timestamp}] }
  if (Array.isArray(e.string_list_data)) {
    const v = e.string_list_data.find(x => x && typeof x.href === 'string' && x.href);
    if (v) return { href: v.href, ts: v.timestamp };
  }
  if (typeof e.href === 'string') return { href: e.href, ts: e.timestamp };
  return null;
}

function fromJson(data) {
  const out = [];
  const scan = arr => {
    for (const e of arr) {
      const h = extractHref(e);
      if (!h || !/^https?:\/\//.test(h.href)) continue;
      const it = base(h.href);
      it.title = (e && typeof e.title === 'string' && e.title.trim())
        ? e.title.trim()
        : (it.src === 'instagram' ? '인스타그램 게시물' : '');
      it.saved = parseTs(h.ts);
      out.push(it);
    }
  };
  if (Array.isArray(data)) scan(data);
  else if (data && typeof data === 'object') {
    for (const key of Object.keys(data)) {
      if (Array.isArray(data[key])) scan(data[key]);
    }
  }
  return out;
}

// ── CSV (Google Takeout 유튜브) ───────────────────
function splitCsv(line) {
  const cells = [];
  let cur = '', q = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (q) {
      if (c === '"' && line[i + 1] === '"') { cur += '"'; i++; }
      else if (c === '"') q = false;
      else cur += c;
    } else if (c === '"') q = true;
    else if (c === ',') { cells.push(cur); cur = ''; }
    else cur += c;
  }
  cells.push(cur);
  return cells;
}

function fromCsv(text) {
  const rows = text.split(/\r?\n/).filter(r => r.trim());
  if (rows.length < 2) return [];
  const header = splitCsv(rows[0]).map(h => h.trim().toLowerCase());
  const out = [];

  const vidIdx = header.findIndex(h => h === 'video id' || h === 'videoid');
  if (vidIdx >= 0) {
    const tsIdx = header.findIndex(h => h.includes('timestamp'));
    for (let i = 1; i < rows.length; i++) {
      const cols = splitCsv(rows[i]);
      const vid = (cols[vidIdx] || '').trim();
      if (!vid) continue;
      const it = base('https://www.youtube.com/watch?v=' + vid);
      it.src = 'youtube';
      it.title = `${YT_PLACEHOLDER} (${vid})`;
      it.thumb = `https://img.youtube.com/vi/${vid}/hqdefault.jpg`;
      if (tsIdx >= 0) it.saved = parseTs(cols[tsIdx]);
      out.push(it);
    }
    return out;
  }

  const urlIdx = header.findIndex(h => h.includes('channel url'));
  const titleIdx = header.findIndex(h => h.includes('channel title'));
  if (urlIdx >= 0) {
    for (let i = 1; i < rows.length; i++) {
      const cols = splitCsv(rows[i]);
      const url = (cols[urlIdx] || '').trim();
      if (!/^https?:\/\//.test(url)) continue;
      const it = base(url);
      it.src = 'youtube';
      it.title = (titleIdx >= 0 && cols[titleIdx]) ? cols[titleIdx].trim() : 'YouTube 채널';
      it.tags = ['구독'];
      out.push(it);
    }
  }
  return out;
}

// 파일 하나를 파싱해 항목 배열 반환. 다시봄 백업 파일이면 null(별도 처리 신호).
export function parseImportFile(name, text) {
  const trimmed = (text || '').trim();
  if (!trimmed) return [];
  if (trimmed[0] === '{' || trimmed[0] === '[') {
    try {
      const data = JSON.parse(trimmed);
      if (data && Array.isArray(data.items)) return null; // 다시봄 백업
      return fromJson(data);
    } catch (e) { return []; }
  }
  return fromCsv(text);
}
