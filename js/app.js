// 진입점 — 이벤트 위임으로 모든 data-action 버튼을 한 곳에서 처리
import { SOURCES } from './constants.js';
import { persist } from './store.js';
import { detectSource, normalizeUrl } from './utils.js';
import * as actions from './actions.js';
import * as modals from './modals.js';
import { render, renderHero, renderColSelect } from './view.js';

const clickHandlers = {
  'toggle-select-mode': () => actions.toggleSelectMode(),
  'export-data':        () => actions.exportData(),
  'import-data':        () => document.getElementById('importFile').click(),
  'save-bookmark':      () => actions.saveBookmark(),
  'show-forgotten':     () => actions.showForgotten(),
  'shuffle-hero':       () => renderHero(),
  'set-filter':         el => actions.setFilter(el.dataset.filter),
  'set-col':            el => actions.setCol(el.dataset.colId),
  'toggle-sel':         el => actions.toggleSel(Number(el.dataset.id)),
  'open-item':          el => actions.markSeen(Number(el.dataset.id)),
  'toggle-seen':        el => actions.toggleSeen(Number(el.dataset.id)),
  'toggle-pin':         el => actions.togglePin(Number(el.dataset.id)),
  'remove-item':        el => actions.removeItem(Number(el.dataset.id)),
  'undo-delete':        () => actions.undoDelete(),
  'bulk-seen':          () => actions.bulkSeen(),
  'bulk-delete':        () => actions.bulkDelete(),
  'bulk-move':          el => { modals.closeModal(); actions.bulkMove(el.dataset.colId || null); },
  'open-col-modal':     () => modals.openColModal(),
  'open-move-modal':    () => modals.openMoveModal(),
  'edit-item':          el => modals.openEditModal(Number(el.dataset.id)),
  'pick-emoji':         el => modals.pickEmoji(el),
  'pick-color':         el => modals.pickColor(el),
  'create-collection':  () => modals.createCollection(),
  'save-edit':          el => modals.saveEdit(Number(el.dataset.id)),
  'close-modal':        () => modals.closeModal()
};

document.addEventListener('click', e => {
  const el = e.target.closest('[data-action]');
  if (!el) return;
  const handler = clickHandlers[el.dataset.action];
  if (handler) handler(el, e);
});

// 컬렉션 칩 우클릭(모바일 길게 누르기) → 삭제
document.addEventListener('contextmenu', e => {
  const chip = e.target.closest('[data-action="set-col"]');
  if (!chip) return;
  e.preventDefault();
  actions.deleteCollection(chip.dataset.colId);
});

// ── 저장 입력창: 출처 자동 감지 ─────────────────
const urlInput = document.getElementById('urlInput');
urlInput.addEventListener('input', () => {
  const v = urlInput.value.trim();
  const box = document.getElementById('detected');
  if (v.length > 8 && v.includes('.')) {
    const s = SOURCES[detectSource(normalizeUrl(v))];
    const det = document.getElementById('detSrc');
    det.textContent = `${s.icon} ${s.name}(으)로 분류돼요`;
    det.style.color = s.color;
    renderColSelect();
    box.classList.add('on');
  } else box.classList.remove('on');
});
urlInput.addEventListener('keydown', e => { if (e.key === 'Enter') actions.saveBookmark(); });

document.getElementById('searchInput').addEventListener('input', () => render());
document.getElementById('importFile').addEventListener('change', e => actions.importData(e));
document.getElementById('modalBg').addEventListener('click', e => {
  if (e.target === e.currentTarget) modals.closeModal();
});

// ── 시작 ───────────────────────────────
persist();
render();
renderHero();
