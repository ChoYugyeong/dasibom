// 진입점 — 이벤트 위임으로 모든 data-action 버튼을 한 곳에서 처리
import { SOURCES } from './constants.js';
import { initStore, reloadFromVault, persist } from './store.js';
import { detectSource, normalizeUrl } from './utils.js';
import { toast } from './toast.js';
import * as actions from './actions.js';
import * as modals from './modals.js';
import { openYoutubeModal } from './youtubeModal.js';
import { render, renderHero, renderColSelect } from './view.js';

const desktop = !!window.dasibom;

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
  'open-youtube-modal': () => openYoutubeModal()
};

async function chooseVault() {
  const p = await window.dasibom.chooseVault();
  if (!p) return;
  await reloadFromVault();
  render(); renderHero();
  toast('📁 저장 위치를 바꿨어요');
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

// ── 저장 입력창: 출처 자동 감지 + 링크 정보 가져오기 ─────────────────
const urlInput = document.getElementById('urlInput');
let metaTimer = null;
let metaSeq = 0;

function resetDraftMeta() {
  document.getElementById('thumbInput').value = '';
  document.getElementById('detMeta').style.display = 'none';
  document.getElementById('detThumb').style.display = 'none';
  document.getElementById('detStatus').textContent = '';
}

async function loadMeta(url, seq) {
  document.getElementById('detMeta').style.display = 'flex';
  const statusEl = document.getElementById('detStatus');
  statusEl.textContent = '🔎 링크 정보를 가져오는 중…';
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
  if (m.title || m.thumb) statusEl.textContent = '✓ 제목·썸네일을 가져왔어요 (수정 가능)';
  else statusEl.textContent = 'ⓘ 공개 정보를 찾지 못했어요 — 제목을 직접 입력하세요';
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
document.getElementById('importFile').addEventListener('change', e => actions.importData(e));
document.getElementById('importExternalFile').addEventListener('change', e => actions.importExternal(e));
document.getElementById('modalBg').addEventListener('click', e => {
  if (e.target === e.currentTarget) modals.closeModal();
});

// ── 시작 ───────────────────────────────
async function boot() {
  // 데스크톱 앱 모드면 저장 위치 버튼을 노출
  if (desktop) document.getElementById('vaultBtns').style.display = 'flex';
  await initStore();
  persist();
  render();
  renderHero();
}
boot();
