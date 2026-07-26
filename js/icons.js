// 인라인 SVG 아이콘 — 구조적 버튼에서 이모지 대신 사용 (일관된 stroke 기반 벡터, currentColor 상속)
// 소스(플랫폼) 배지·컬렉션 이모지는 콘텐츠 식별자라 예외로 유지한다 (constants.js 참고)
const PATHS = {
  folder: '<path d="M3 6a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6z"/>',
  folderOpen: '<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 15l6-6M9 9h6v6"/>',
  play: '<circle cx="12" cy="12" r="9"/><polygon points="10,8 16,12 10,16"/>',
  checkSquare: '<rect x="3" y="3" width="18" height="18" rx="2"/><polyline points="8,12 11,15 16,9"/>',
  check: '<polyline points="20,6 9,17 4,12"/>',
  download: '<path d="M12 3v10"/><polyline points="7,9 12,14 17,9"/><path d="M5 21h14"/>',
  upload: '<path d="M12 15V3"/><polyline points="7,8 12,3 17,8"/><path d="M5 21h14"/>',
  inbox: '<path d="M4 4h16v10l-3 6H7l-3-6V4z"/><path d="M4 12h5l1.5 3h3L15 12h5"/>',
  shuffle: '<path d="M4 4h3.5L18 18h2.5"/><path d="M4 18h3.5L11 13"/><path d="M13 8l4.5-4H21v3.5"/><polyline points="17,3 21,3 21,7"/><polyline points="17,21 21,21 21,17"/>',
  eye: '<path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z"/><circle cx="12" cy="12" r="3"/>',
  eyeOff: '<path d="M17.94 17.94A10.94 10.94 0 0 1 12 19c-7 0-11-7-11-7a21.9 21.9 0 0 1 5.06-5.94M9.9 4.24A10.94 10.94 0 0 1 12 5c7 0 11 7 11 7a21.9 21.9 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/>',
  pin: '<path d="M12 2a5 5 0 0 0-5 5c0 4 5 11 5 11s5-7 5-11a5 5 0 0 0-5-5z"/><circle cx="12" cy="7" r="2"/>',
  pencil: '<path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>',
  trash: '<polyline points="3,6 5,6 21,6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/>',
  plus: '<line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>',
  externalLink: '<path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15,3 21,3 21,9"/><line x1="10" y1="14" x2="21" y2="3"/>',
  search: '<circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>',
  clock: '<circle cx="12" cy="12" r="10"/><polyline points="12,6 12,12 16,14"/>',
  checkCircle: '<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22,4 12,14.01 9,11.01"/>',
  heart: '<path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8z"/>',
  library: '<rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/>',
  copy: '<rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>',
  undo: '<path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><polyline points="3,3 3,8 8,8"/>',
  moon: '<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>',
  sun: '<circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>',
  info: '<circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>',
  loader: '<line x1="12" y1="2" x2="12" y2="6"/><line x1="12" y1="18" x2="12" y2="22"/><line x1="4.93" y1="4.93" x2="7.76" y2="7.76"/><line x1="16.24" y1="16.24" x2="19.07" y2="19.07"/><line x1="2" y1="12" x2="6" y2="12"/><line x1="18" y1="12" x2="22" y2="12"/><line x1="4.93" y1="19.07" x2="7.76" y2="16.24"/><line x1="16.24" y1="7.76" x2="19.07" y2="4.93"/>',
  x: '<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>',
  arrowUpDown: '<path d="M8 3 5 6M8 3l3 3M8 3v18"/><path d="M16 21l3-3m-3 3-3-3M16 21V3"/>'
};

export function icon(name, { size = 16, className = '' } = {}) {
  const d = PATHS[name];
  if (!d) return '';
  return `<svg class="icon ${className}" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
}

// 정적 마크업의 <span class="icon-slot" data-icon="name"> 자리표시자를 실제 SVG로 치환
export function hydrateIcons(root = document) {
  root.querySelectorAll('.icon-slot[data-icon]').forEach(el => {
    const size = Number(el.dataset.size) || 16;
    el.outerHTML = icon(el.dataset.icon, { size });
  });
}
