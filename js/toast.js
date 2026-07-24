import { esc } from './utils.js';

let toastTimer;

export function toast(msg, withUndo) {
  const t = document.getElementById('toast');
  t.innerHTML = esc(msg) + (withUndo ? ` <button data-action="undo-delete">되돌리기</button>` : '');
  t.classList.add('on');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('on'), withUndo ? 5000 : 2200);
}
