// 데이터를 바꾸는 동작들 — 변경 후 persist + 다시 렌더
import { SOURCES } from './constants.js';
import { state, items, colById, persist } from './store.js';
import { detectSource, normalizeUrl } from './utils.js';
import { toast } from './toast.js';
import { view, render, renderHero, updateBulkCount } from './view.js';
import { parseImportFile } from './importers.js';

// ── 저장 ───────────────────────────────
export function saveBookmark() {
  const urlInput = document.getElementById('urlInput');
  let v = urlInput.value.trim();
  if (!v) return toast('링크를 붙여넣어 주세요');
  v = normalizeUrl(v);
  try { new URL(v); } catch (e) { return toast('올바른 링크가 아니에요'); }
  const src = detectSource(v);
  const title = document.getElementById('titleInput').value.trim()
    || decodeURIComponent(new URL(v).hostname.replace('www.', '') + new URL(v).pathname).slice(0, 60);
  const tags = document.getElementById('tagInput').value.split(',').map(t => t.trim()).filter(Boolean);
  state.items.unshift({
    id: Date.now(), url: v, title,
    memo: document.getElementById('memoInput').value.trim(),
    src, tags, col: document.getElementById('colSelect').value || null,
    thumb: document.getElementById('thumbInput').value || null,
    pinned: false, saved: Date.now(), seen: false
  });
  persist();
  ['urlInput', 'titleInput', 'memoInput', 'tagInput', 'thumbInput'].forEach(id => document.getElementById(id).value = '');
  document.getElementById('detected').classList.remove('on');
  document.getElementById('detMeta').style.display = 'none';
  document.getElementById('detThumb').style.display = 'none';
  toast(`${SOURCES[src].icon} ${SOURCES[src].name}에 저장했어요!`);
  view.activeFilter = 'all';
  render(); renderHero();
}

// ── 필터 ───────────────────────────────
export function setFilter(f) {
  view.activeFilter = f;
  view.forgotMode = false;
  render();
}
export function setCol(id) {
  view.activeCol = (view.activeCol === id) ? null : id;
  view.forgotMode = false;
  render();
}
export function showForgotten() {
  view.forgotMode = !view.forgotMode;
  toast(view.forgotMode ? '잊혀진 북마크만 보여드릴게요' : '전체 목록으로 돌아왔어요');
  render();
}

// ── 개별 액션 ───────────────────────────
export function markSeen(id) {
  const it = items().find(i => i.id === id);
  if (it && !it.seen) {
    it.seen = true;
    persist();
    setTimeout(() => { render(); renderHero(); }, 300);
  }
}
export function toggleSeen(id) {
  const it = items().find(i => i.id === id);
  if (it) { it.seen = !it.seen; persist(); render(); renderHero(); }
}
export function togglePin(id) {
  const it = items().find(i => i.id === id);
  if (it) {
    it.pinned = !it.pinned;
    persist(); render();
    toast(it.pinned ? '📌 맨 위에 고정했어요' : '고정을 해제했어요');
  }
}

export async function copyItemUrl(id) {
  const it = items().find(i => i.id === id);
  if (!it) return;
  try {
    await navigator.clipboard.writeText(it.url);
    toast('링크를 복사했어요');
  } catch (e) {
    toast('복사에 실패했어요');
  }
}

// ── 삭제 + 취소 ───────────────────────────
let lastDeleted = [];
export function removeItem(id) {
  const idx = state.items.findIndex(i => i.id === id);
  if (idx < 0) return;
  lastDeleted = [state.items[idx]];
  state.items.splice(idx, 1);
  persist(); render(); renderHero();
  toast('삭제했어요', true);
}
export function undoDelete() {
  if (!lastDeleted.length) return;
  state.items.push(...lastDeleted);
  lastDeleted = [];
  persist(); render(); renderHero();
  toast('복구했어요 ✨');
}

// ── 다중 선택 · 일괄 작업 ───────────────────
export function toggleSelectMode() {
  view.selMode = !view.selMode;
  view.selected.clear();
  document.getElementById('selBtn').classList.toggle('on', view.selMode);
  document.getElementById('bulkbar').classList.toggle('on', view.selMode);
  updateBulkCount(); render();
}
export function toggleSel(id) {
  view.selected.has(id) ? view.selected.delete(id) : view.selected.add(id);
  updateBulkCount(); render();
}
export function bulkSeen() {
  if (!view.selected.size) return toast('먼저 카드를 선택해 주세요');
  items().forEach(i => { if (view.selected.has(i.id)) i.seen = true; });
  persist();
  toast(`${view.selected.size}개를 봄 처리했어요`);
  toggleSelectMode(); renderHero();
}
export function bulkDelete() {
  if (!view.selected.size) return toast('먼저 카드를 선택해 주세요');
  lastDeleted = state.items.filter(i => view.selected.has(i.id));
  state.items = state.items.filter(i => !view.selected.has(i.id));
  persist();
  const n = lastDeleted.length;
  toggleSelectMode(); renderHero();
  toast(`${n}개를 삭제했어요`, true);
}
export function bulkMove(colId) {
  items().forEach(i => { if (view.selected.has(i.id)) i.col = colId; });
  persist();
  const c = colId ? colById(colId) : null;
  toast(c ? `${c.icon} ${c.name}(으)로 옮겼어요` : '컬렉션에서 빼냈어요');
  toggleSelectMode();
}

// ── 컬렉션 ───────────────────────────────
export function deleteCollection(id) {
  const c = colById(id);
  if (!c) return;
  if (!confirm(`'${c.name}' 컬렉션을 삭제할까요? (북마크는 남아요)`)) return;
  state.collections = state.collections.filter(x => x.id !== id);
  state.items.forEach(i => { if (i.col === id) i.col = null; });
  if (view.activeCol === id) view.activeCol = null;
  persist(); render();
}

// ── 데이터 내보내기 / 가져오기 ─────────────────
export function exportData() {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  const d = new Date();
  a.download = `dasibom-백업-${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}.json`;
  a.click();
  URL.revokeObjectURL(a.href);
  toast('⬇ 백업 파일을 내려받았어요');
}
export function importData(ev) {
  const file = ev.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const data = JSON.parse(reader.result);
      if (!data.items || !Array.isArray(data.items)) throw new Error();
      const existing = new Set(state.items.map(i => i.id));
      let added = 0;
      data.items.forEach(i => { if (!existing.has(i.id)) { state.items.push(i); added++; } });
      (data.collections || []).forEach(c => {
        if (!state.collections.some(x => x.id === c.id)) state.collections.push(c);
      });
      persist(); render(); renderHero();
      toast(`⬆ ${added}개를 가져왔어요`);
    } catch (e) { toast('올바른 백업 파일이 아니에요'); }
  };
  reader.readAsText(file);
  ev.target.value = '';
}

// ── 외부 내보내기 가져오기 (Google Takeout / 인스타그램 "내 정보 다운로드") ──
function readAsText(file) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result);
    r.onerror = () => reject(r.error);
    r.readAsText(file);
  });
}

// URL 기준 중복 제거하며 항목들을 병합. { added, duplicate } 반환.
export function mergeItems(newItems, { tag } = {}) {
  const existingUrls = new Set(state.items.map(i => i.url));
  let added = 0, duplicate = 0;
  for (const raw of newItems) {
    if (existingUrls.has(raw.url)) { duplicate++; continue; }
    const it = {
      id: Date.now() * 1000 + added, memo: '', col: null, pinned: false, seen: false,
      tags: [], thumb: null, ...raw
    };
    if (tag && !it.tags.includes(tag)) it.tags = [...it.tags, tag];
    existingUrls.add(it.url);
    state.items.push(it);
    added++;
  }
  if (added) { persist(); render(); renderHero(); }
  return { added, duplicate };
}

export async function importExternal(ev) {
  const files = Array.from(ev.target.files || []);
  ev.target.value = '';
  if (!files.length) return;

  const existingUrls = new Set(state.items.map(i => i.url));
  let added = 0, duplicate = 0, backupSkipped = 0, unrecognized = 0;

  for (const file of files) {
    let text;
    try { text = await readAsText(file); } catch (e) { unrecognized++; continue; }
    const parsed = parseImportFile(file.name, text);
    if (parsed === null) { backupSkipped++; continue; } // 다시봄 백업 파일 → 이 가져오기에서는 건너뜀
    if (!parsed.length) { unrecognized++; continue; }
    for (const it of parsed) {
      if (existingUrls.has(it.url)) { duplicate++; continue; }
      existingUrls.add(it.url);
      state.items.push(it);
      added++;
    }
  }

  persist(); render(); renderHero();

  if (!added) {
    if (backupSkipped) toast(`백업 파일은 '⬆ 가져오기' 버튼을 이용하세요`);
    else if (duplicate) toast('이미 저장된 항목들이에요');
    else toast('가져올 수 있는 항목을 찾지 못했어요');
    return;
  }
  const parts = [`⬆ ${added}개를 가져왔어요`];
  if (duplicate) parts.push(`중복 ${duplicate}개 제외`);
  if (backupSkipped) parts.push(`백업 파일 ${backupSkipped}개는 '가져오기'를 이용하세요`);
  toast(parts.join(' · '));
}
