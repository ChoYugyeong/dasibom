// 모달 UI — 컬렉션 만들기 · 북마크 편집 · 컬렉션 이동
import { COL_EMOJIS, COL_COLORS } from './constants.js';
import { state, items, persist } from './store.js';
import { esc } from './utils.js';
import { toast } from './toast.js';
import { view, render } from './view.js';
import { icon } from './icons.js';

function openModal(html) {
  document.getElementById('modalBox').innerHTML = html;
  document.getElementById('modalBg').classList.add('on');
}
export function closeModal() {
  document.getElementById('modalBg').classList.remove('on');
}

// ── 컬렉션 만들기 ───────────────────────
let pickedEmoji = COL_EMOJIS[0];
let pickedColor = COL_COLORS[0];

export function openColModal() {
  pickedEmoji = COL_EMOJIS[0];
  pickedColor = COL_COLORS[0];
  openModal(`
    <h3>새 컬렉션 만들기</h3>
    <label>이름</label>
    <input type="text" id="colName" placeholder="예: 맛집, 여행, 레시피…" maxlength="20">
    <label>아이콘</label>
    <div class="emoji-pick" id="emojiPick">${COL_EMOJIS.map((e, i) => `<button class="${i === 0 ? 'sel' : ''}" data-action="pick-emoji" data-emoji="${e}">${e}</button>`).join('')}</div>
    <label>컬러</label>
    <div class="color-pick" id="colorPick">${COL_COLORS.map((c, i) => `<button class="${i === 0 ? 'sel' : ''}" style="background:${c}" data-action="pick-color" data-color="${c}"></button>`).join('')}</div>
    <div class="mbtns">
      <button class="cancel" data-action="close-modal">취소</button>
      <button class="ok" data-action="create-collection">만들기</button>
    </div>`);
  setTimeout(() => document.getElementById('colName').focus(), 50);
}
export function pickEmoji(btn) {
  pickedEmoji = btn.dataset.emoji;
  document.querySelectorAll('#emojiPick button').forEach(b => b.classList.remove('sel'));
  btn.classList.add('sel');
}
export function pickColor(btn) {
  pickedColor = btn.dataset.color;
  document.querySelectorAll('#colorPick button').forEach(b => b.classList.remove('sel'));
  btn.classList.add('sel');
}
export function createCollection() {
  const name = document.getElementById('colName').value.trim();
  if (!name) return toast('컬렉션 이름을 입력해 주세요');
  state.collections.push({ id: 'c' + Date.now(), name, icon: pickedEmoji, color: pickedColor });
  persist(); closeModal(); render();
  toast(`${pickedEmoji} '${name}' 컬렉션을 만들었어요`);
}

// ── 북마크 편집 ─────────────────────────
export function openEditModal(id) {
  const it = items().find(i => i.id === id);
  if (!it) return;
  openModal(`
    <h3>${icon('pencil', { size: 18 })} 북마크 편집</h3>
    <label>제목</label>
    <input type="text" id="eTitle" value="${esc(it.title)}">
    <label>메모</label>
    <textarea id="eMemo" placeholder="메모를 남겨보세요">${esc(it.memo || '')}</textarea>
    <label>태그 (쉼표 구분)</label>
    <input type="text" id="eTags" value="${esc((it.tags || []).join(', '))}">
    <label>컬렉션</label>
    <select id="eCol">
      <option value="">컬렉션 없음</option>
      ${state.collections.map(c => `<option value="${c.id}" ${it.col === c.id ? 'selected' : ''}>${c.icon} ${esc(c.name)}</option>`).join('')}
    </select>
    <div class="mbtns">
      <button class="cancel" data-action="close-modal">취소</button>
      <button class="ok" data-action="save-edit" data-id="${id}">저장</button>
    </div>`);
}
export function saveEdit(id) {
  const it = items().find(i => i.id === id);
  if (!it) return;
  it.title = document.getElementById('eTitle').value.trim() || it.title;
  it.memo = document.getElementById('eMemo').value.trim();
  it.tags = document.getElementById('eTags').value.split(',').map(t => t.trim()).filter(Boolean);
  it.col = document.getElementById('eCol').value || null;
  persist(); closeModal(); render();
  toast('수정했어요');
}

// ── 컬렉션 이동 ─────────────────────────
export function openMoveModal() {
  if (!view.selected.size) return toast('먼저 카드를 선택해 주세요');
  openModal(`
    <h3>${icon('folder', { size: 18 })} ${view.selected.size}개를 어디로 옮길까요?</h3>
    <div class="collist">
      <button data-action="bulk-move" data-col-id="">${icon('x')} 컬렉션 없음</button>
      ${state.collections.map(c => `<button data-action="bulk-move" data-col-id="${c.id}">${c.icon} ${esc(c.name)}</button>`).join('')}
    </div>
    <div class="mbtns"><button class="cancel" data-action="close-modal">닫기</button></div>`);
}
