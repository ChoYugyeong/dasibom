import { SOURCES } from './constants.js';

export function detectSource(url) {
  try {
    const host = new URL(url).hostname;
    for (const [key, s] of Object.entries(SOURCES)) {
      if (key !== 'web' && s.match.test(host)) return key;
    }
  } catch (e) {}
  return 'web';
}

export function ytThumb(url) {
  const m = url.match(/(?:youtube\.com\/(?:watch\?v=|shorts\/)|youtu\.be\/)([\w-]{6,})/);
  return m ? `https://img.youtube.com/vi/${m[1]}/hqdefault.jpg` : null;
}

export function normalizeUrl(v) {
  return /^https?:\/\//.test(v) ? v : 'https://' + v;
}

export function daysAgo(ts) {
  const d = Math.floor((Date.now() - ts) / 86400000);
  return d === 0 ? '오늘' : d === 1 ? '어제' : `${d}일 전`;
}

export function esc(s) {
  return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
