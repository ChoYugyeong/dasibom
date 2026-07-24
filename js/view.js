// 화면 렌더링 + 화면 상태(필터·선택 모드 등)
import { SOURCES } from './constants.js';
import { state, items, colById } from './store.js';
import { esc, daysAgo, ytThumb } from './utils.js';

export const view = {
  activeFilter: 'all',
  activeCol: null,
  forgotMode: false,
  selMode: false,
  selected: new Set(),
  heroItem: null
};

export function render() {
  renderFilters();
  renderCollections();
  renderForgot();
  renderStreak();
  const q = document.getElementById('searchInput').value.trim().toLowerCase();
  const week = Date.now() - 7 * 86400000;
  const list = items().filter(i => {
    if (view.forgotMode && (i.seen || i.saved >= week)) return false;
    if (view.activeFilter !== 'all' && i.src !== view.activeFilter) return false;
    if (view.activeCol && i.col !== view.activeCol) return false;
    if (q && !(
      i.title.toLowerCase().includes(q) ||
      (i.memo || '').toLowerCase().includes(q) ||
      i.url.toLowerCase().includes(q) ||
      (i.tags || []).some(t => t.toLowerCase().includes(q))
    )) return false;
    return true;
  });
  list.sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0) || b.saved - a.saved);

  const grid = document.getElementById('grid');
  if (!list.length) {
    grid.innerHTML = `<div class="empty-list">아직 여기엔 아무것도 없어요.<br>위에 링크를 붙여넣고 저장해 보세요!</div>`;
    return;
  }
  grid.innerHTML = list.map(i => {
    const s = SOURCES[i.src];
    const c = i.col ? colById(i.col) : null;
    const yt = i.src === 'youtube' ? ytThumb(i.url) : null;
    const thumbStyle = yt ? `background-image:url('${yt}')` : `background: linear-gradient(135deg, ${s.color}22, ${s.color}0d)`;
    const sel = view.selected.has(i.id);
    return `
    <div class="card ${i.seen ? 'seen' : ''} ${view.selMode ? 'selectable' : ''} ${sel ? 'selected' : ''}" ${view.selMode ? `data-action="toggle-sel" data-id="${i.id}"` : ''}>
      ${view.selMode ? `<div class="checkmark">✓</div>` : ''}
      <div class="thumb" style="${thumbStyle}">
        ${yt ? '' : s.icon}
        ${!i.seen ? '<span class="newdot">안 봄</span>' : ''}
        ${i.pinned ? '<span class="pinbadge">📌</span>' : ''}
      </div>
      <div class="cbody">
        <div class="csrc" style="color:${s.color}">${s.icon} ${s.name}
          ${c ? `<span class="colbadge" style="background:${c.color}">${c.icon} ${esc(c.name)}</span>` : ''}
        </div>
        <div class="ctitle">${esc(i.title)}</div>
        ${i.memo ? `<div class="cmemo">📝 ${esc(i.memo)}</div>` : ''}
        ${(i.tags || []).length ? `<div class="ctags">${i.tags.map(t => `<span>#${esc(t)}</span>`).join('')}</div>` : ''}
        <div class="cfoot">
          <span class="cdate">${daysAgo(i.saved)}</span>
          ${view.selMode ? '' : `<div class="cbtns">
            <a class="open" href="${esc(i.url)}" target="_blank" rel="noopener" data-action="open-item" data-id="${i.id}">열기</a>
            <button data-action="toggle-seen" data-id="${i.id}" title="봄/안 봄">${i.seen ? '↩️' : '✓'}</button>
            <button class="${i.pinned ? 'pinned' : ''}" data-action="toggle-pin" data-id="${i.id}" title="핀 고정">📌</button>
            <button data-action="edit-item" data-id="${i.id}" title="편집">✎</button>
            <button class="del" data-action="remove-item" data-id="${i.id}" title="삭제">✕</button>
          </div>`}
        </div>
      </div>
    </div>`;
  }).join('');
}

function pickHero() {
  const unseen = items().filter(i => !i.seen);
  if (!unseen.length) return null;
  const sorted = [...unseen].sort((a, b) => a.saved - b.saved);
  const pool = sorted.slice(0, Math.max(3, Math.ceil(sorted.length / 2)));
  return pool[Math.floor(Math.random() * pool.length)];
}

export function renderHero() {
  const hero = document.getElementById('hero');
  view.heroItem = pickHero();
  if (!view.heroItem) {
    hero.className = 'hero empty';
    hero.innerHTML = `<div class="htitle">${items().length ? '저장한 걸 전부 다시 봤어요! 🎉' : '첫 링크를 저장해 보세요 ☝️'}</div>`;
    return;
  }
  const it = view.heroItem;
  const s = SOURCES[it.src];
  hero.className = 'hero';
  hero.innerHTML = `
    <div class="badge-src">${s.icon}</div>
    <div class="label">오늘의 다시봄 ✦ ${daysAgo(it.saved)} 저장</div>
    <div class="htitle">${esc(it.title)}</div>
    <div class="hmeta">${s.name} · ${(it.tags || []).map(t => '#' + esc(t)).join(' ')}</div>
    <div class="hbtns">
      <a class="go" href="${esc(it.url)}" target="_blank" rel="noopener" data-action="open-item" data-id="${it.id}">지금 보기 →</a>
      <button class="shuffle" data-action="shuffle-hero">다른 거 🔀</button>
    </div>`;
}

function renderFilters() {
  const counts = {};
  items().forEach(i => counts[i.src] = (counts[i.src] || 0) + 1);
  const el = document.getElementById('filters');
  let html = `<button class="chip ${view.activeFilter === 'all' ? 'active' : ''}" data-action="set-filter" data-filter="all">전체 <span class="cnt">${items().length}</span></button>`;
  for (const [key, s] of Object.entries(SOURCES)) {
    if (!counts[key]) continue;
    html += `<button class="chip ${view.activeFilter === key ? 'active' : ''}" data-action="set-filter" data-filter="${key}">${s.icon} ${s.name} <span class="cnt">${counts[key]}</span></button>`;
  }
  el.innerHTML = html;
}

function renderCollections() {
  const el = document.getElementById('collections');
  const cnt = id => items().filter(i => i.col === id).length;
  el.innerHTML =
    state.collections.map(c =>
      `<button class="chip colchip ${view.activeCol === c.id ? 'active' : ''}" style="border-color:${c.color}; color:${c.color}"
        data-action="set-col" data-col-id="${c.id}"
        title="우클릭(길게 누르기)으로 삭제">${c.icon} ${esc(c.name)} <span class="cnt">${cnt(c.id)}</span></button>`
    ).join('') +
    `<button class="chip addcol" data-action="open-col-modal">＋ 새 컬렉션</button>`;
}

function renderForgot() {
  const week = Date.now() - 7 * 86400000;
  const forgotten = items().filter(i => !i.seen && i.saved < week);
  const el = document.getElementById('forgot');
  if (forgotten.length) {
    el.classList.add('on');
    el.innerHTML = `⏰ 일주일 넘게 잠들어 있는 북마크가 <b>${forgotten.length}개</b> 있어요 — 눌러서 보기`;
  } else el.classList.remove('on');
}

function renderStreak() {
  const seen = items().filter(i => i.seen).length;
  document.getElementById('streak').textContent = `👀 ${seen} / ${items().length}`;
}

export function renderColSelect(sel) {
  const el = document.getElementById('colSelect');
  el.innerHTML = `<option value="">컬렉션 없음</option>` +
    state.collections.map(c => `<option value="${c.id}" ${sel === c.id ? 'selected' : ''}>${c.icon} ${esc(c.name)}</option>`).join('');
}

export function updateBulkCount() {
  document.getElementById('bulkCount').textContent = `${view.selected.size}개 선택`;
}
