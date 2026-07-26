import { esc } from './utils.js';
import { icon } from './icons.js';

let toastTimer;

export function toast(msg, withUndo) {
  const t = document.getElementById('toast');
  t.innerHTML = esc(msg) + (withUndo ? ` <button data-action="undo-delete">${icon('undo', { size: 13 })} 되돌리기</button>` : '');
  t.classList.add('on');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('on'), withUndo ? 5000 : 2200);
}
