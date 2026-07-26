// 진입점 — 이벤트 위임으로 모든 data-action 버튼을 한 곳에서 처리
import { SOURCES } from './constants.js';
import { initStore, reloadFromVault, persist } from './store.js';
import { detectSource, normalizeUrl } from './utils.js';
import { toast } from './toast.js';
import { icon, hydrateIcons } from './icons.js';
import * as actions from './actions.js';
import * as modals from './modals.js';
import { openYoutubeModal } from './youtubeModal.js';
import { render, renderHero, renderColSelect, view } from './view.js';

const desktop = !!window.dasibom;

hydrateIcons(document); // 정적 마크업의 아이콘 자리표시자를 SVG로 치환

const clickHandlers = {
  'toggle-select-mode': () => actions.toggleSelectMode(),
  'export-data':        () => actions.exportData(),
  'import-data':        () => document.getElementById('importFile').click(),
  'import-external':    () => document.getElementById('importExternalFile').click(),
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
  'copy-item':          el => actions.copyItemUrl(Number(el.dataset.id)),
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
  'close-modal':        () => modals.closeModal(),
  'choose-vault':       () => chooseVault(),
  'reveal-vault':       () => window.dasibom.reveal(),
  'open-youtube-modal': () => openYoutubeModal(),
  'toggle-theme':       () => toggleTheme()
};

async function chooseVault() {
  const p = await window.dasibom.chooseVault();
  if (!p) return;
  await reloadFromVault();
  render(); renderHero();
  toast('📁 저장 위치를 바꿨어요');
}

// ── 다크모드 ───────────────────────────────
const THEME_KEY = 'dasibom-theme';
function systemPrefersDark() {
  return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
}
function currentTheme() {
  return document.documentElement.getAttribute('data-theme') || (systemPrefersDark() ? 'dark' : 'light');
}
function applyThemeButton() {
  const isDark = currentTheme() === 'dark';
  const btn = document.getElementById('themeBtn');
  btn.innerHTML = icon(isDark ? 'sun' : 'moon', { size: 16 });
  btn.setAttribute('aria-label', isDark ? '라이트 모드로 전환' : '다크 모드로 전환');
  btn.title = isDark ? '라이트 모드로 전환' : '다크 모드로 전환';
}
function toggleTheme() {
  const next = currentTheme() === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', next);
  try { localStorage.setItem(THEME_KEY, next); } catch (e) {}
  applyThemeButton();
}

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

// Esc로 모달 닫기
document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && document.getElementById('modalBg').classList.contains('on')) {
    modals.closeModal();
  }
});

// 키보드로 선택 가능한 카드(role=button) 활성화
document.addEventListener('keydown', e => {
  if (e.key !== 'Enter' && e.key !== ' ') return;
  const el = e.target.closest('[role="button"][data-action]');
  if (!el) return;
  e.preventDefault();
  el.click();
});

// ── 저장 입력창: 출처 자동 감지 + 링크 정보 가져오기 ─────────────────
const urlInput = document.getElementById('urlInput');
let metaTimer = null;
let metaSeq = 0;

function resetDraftMeta() {
  document.getElementById('thumbInput').value = '';
  document.getElementById('detMeta').style.display = 'none';
  document.getElementById('detThumb').style.display = 'none';
  document.getElementById('detStatus').innerHTML = '';
}

async function loadMeta(url, seq) {
  document.getElementById('detMeta').style.display = 'flex';
  const statusEl = document.getElementById('detStatus');
  statusEl.innerHTML = icon('loader', { className: 'spin' }) + ' 링크 정보를 가져오는 중…';
  let m = {};
  try { m = await window.dasibom.fetchMeta(url); } catch (e) { m = {}; }
  if (seq !== metaSeq) return; // 그새 URL이 바뀌면 결과 폐기
  if (m.thumb) {
    const img = document.getElementById('detThumb');
    img.src = m.thumb;
    img.style.display = 'block';
    document.getElementById('thumbInput').value = m.thumb;
  }
  if (m.title) {
    const t = document.getElementById('titleInput');
    if (!t.value.trim()) t.value = m.title;
  }
  if (m.title || m.thumb) statusEl.innerHTML = icon('checkCircle') + ' 제목·썸네일을 가져왔어요 (수정 가능)';
  else statusEl.innerHTML = icon('info') + ' 공개 정보를 찾지 못했어요 — 제목을 직접 입력하세요';
}

urlInput.addEventListener('input', () => {
  const v = urlInput.value.trim();
  const box = document.getElementById('detected');
  if (v.length > 8 && v.includes('.')) {
    const norm = normalizeUrl(v);
    const s = SOURCES[detectSource(norm)];
    const det = document.getElementById('detSrc');
    det.textContent = `${s.icon} ${s.name}(으)로 분류돼요`;
    det.style.color = s.color;
    renderColSelect();
    box.classList.add('on');
    if (desktop) {
      metaSeq++;
      const seq = metaSeq;
      resetDraftMeta();
      clearTimeout(metaTimer);
      metaTimer = setTimeout(() => loadMeta(norm, seq), 500);
    }
  } else {
    box.classList.remove('on');
    metaSeq++;
    resetDraftMeta();
  }
});
urlInput.addEventListener('keydown', e => { if (e.key === 'Enter') actions.saveBookmark(); });

document.getElementById('searchInput').addEventListener('input', () => render());
document.getElementById('sortSelect').addEventListener('change', e => { view.sortBy = e.target.value; render(); });
document.getElementById('importFile').addEventListener('change', e => actions.importData(e));
document.getElementById('importExternalFile').addEventListener('change', e => actions.importExternal(e));
document.getElementById('modalBg').addEventListener('click', e => {
  if (e.target === e.currentTarget) modals.closeModal();
});

// ── 시작 ───────────────────────────────
async function boot() {
  applyThemeButton();
  // 데스크톱 앱 모드면 저장 위치 버튼을 노출
  if (desktop) document.getElementById('vaultBtns').style.display = 'flex';
  await initStore();
  persist();
  render();
  renderHero();
}
boot();
