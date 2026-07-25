// 유튜브 연동 모달 — Client ID/Secret 입력 → 로그인 → 좋아요/재생목록 가져오기
import { esc } from './utils.js';
import { toast } from './toast.js';
import { mergeItems } from './actions.js';

function box() { return document.getElementById('modalBox'); }
function openBg() { document.getElementById('modalBg').classList.add('on'); }
function closeBg() { document.getElementById('modalBg').classList.remove('on'); }

export async function openYoutubeModal() {
  box().innerHTML = `<h3>▶️ 유튜브 연동</h3><p style="color:var(--sub); font-size:13px">불러오는 중…</p>`;
  openBg();
  const status = await window.dasibom.youtube.status();
  if (!status.connected) renderCredsForm(status.hasCreds);
  else renderConnected();
}

function renderCredsForm(hasCreds) {
  box().innerHTML = `
    <h3>▶️ 유튜브 연동</h3>
    <p style="font-size:13px; color:var(--sub); line-height:1.6; margin-bottom:10px">
      Google Cloud에서 발급받은 <b>OAuth 클라이언트</b> 정보를 입력하세요.
      README의 "유튜브 연동 설정"에 발급 절차가 있어요.
    </p>
    <label>Client ID</label>
    <input type="text" id="ytClientId" placeholder="xxxxxxxx.apps.googleusercontent.com">
    <label>Client Secret</label>
    <input type="text" id="ytClientSecret" placeholder="GOCSPX-...">
    <div class="mbtns">
      <button class="cancel" data-yt="close">닫기</button>
      <button class="ok" data-yt="save-creds">${hasCreds ? '수정 후 계속' : '저장하고 계속'}</button>
    </div>`;
}

function renderConnected() {
  box().innerHTML = `
    <h3>▶️ 유튜브 연동</h3>
    <p style="font-size:13px; color:#2f9e44; margin-bottom:12px">✅ 연결됐어요</p>
    <div class="collist">
      <button data-yt="import-liked">❤️ 좋아요 표시한 동영상 가져오기</button>
      <button data-yt="show-playlists">🗂️ 재생목록에서 가져오기</button>
    </div>
    <div class="mbtns">
      <button class="cancel" data-yt="disconnect">연결 해제</button>
      <button class="ok" data-yt="close">닫기</button>
    </div>`;
}

function renderProgress(msg) {
  box().innerHTML = `<h3>▶️ 유튜브 연동</h3><p style="color:var(--sub); font-size:13px">${esc(msg)}</p>`;
}

async function renderPlaylists() {
  renderProgress('재생목록을 불러오는 중…');
  let playlists = [];
  try { playlists = await window.dasibom.youtube.listPlaylists(); }
  catch (e) { toast('재생목록을 불러오지 못했어요: ' + e.message); renderConnected(); return; }
  if (!playlists.length) {
    box().innerHTML = `<h3>🗂️ 재생목록</h3><p style="font-size:13px; color:var(--sub)">가져올 재생목록이 없어요.</p>
      <div class="mbtns"><button class="cancel" data-yt="back">뒤로</button></div>`;
    return;
  }
  box().innerHTML = `
    <h3>🗂️ 재생목록 선택</h3>
    <div class="collist">
      ${playlists.map(p => `
        <label style="display:flex; align-items:center; gap:8px; background:#faf9f6; border:1px solid var(--line); border-radius:10px; padding:11px 12px; cursor:pointer;">
          <input type="checkbox" class="pl-check" value="${esc(p.id)}" data-title="${esc(p.title)}">
          <span>${esc(p.title)} <span style="color:var(--sub); font-size:12px">(${p.count}개)</span></span>
        </label>`).join('')}
    </div>
    <div class="mbtns">
      <button class="cancel" data-yt="back">뒤로</button>
      <button class="ok" data-yt="import-playlists">선택한 목록 가져오기</button>
    </div>`;
}

async function handleSaveCreds() {
  const clientId = document.getElementById('ytClientId').value.trim();
  const clientSecret = document.getElementById('ytClientSecret').value.trim();
  if (!clientId) { toast('Client ID를 입력해 주세요'); return; }
  await window.dasibom.youtube.saveCreds({ clientId, clientSecret });
  renderProgress('브라우저에서 Google 로그인 창을 열었어요…\n로그인을 완료하면 자동으로 돌아와요.');
  try {
    await window.dasibom.youtube.connect();
    toast('✅ 유튜브에 연결됐어요');
    renderConnected();
  } catch (e) {
    toast('연결에 실패했어요: ' + e.message);
    renderCredsForm(true);
  }
}

async function handleImportLiked() {
  renderProgress('좋아요 표시한 동영상을 가져오는 중…');
  try {
    const rawItems = await window.dasibom.youtube.importLiked();
    const { added, duplicate } = mergeItems(rawItems);
    toast(added ? `⬆ ${added}개를 가져왔어요${duplicate ? ` · 중복 ${duplicate}개 제외` : ''}` : '새로 가져올 항목이 없어요');
  } catch (e) {
    toast('가져오기에 실패했어요: ' + e.message);
  }
  closeBg();
}

async function handleImportPlaylists() {
  const checked = [...document.querySelectorAll('.pl-check:checked')];
  if (!checked.length) { toast('재생목록을 선택해 주세요'); return; }
  renderProgress(`${checked.length}개 재생목록을 가져오는 중…`);
  let added = 0, duplicate = 0;
  for (const el of checked) {
    try {
      const rawItems = await window.dasibom.youtube.importPlaylist(el.value, el.dataset.title);
      const r = mergeItems(rawItems);
      added += r.added; duplicate += r.duplicate;
    } catch (e) { /* 개별 재생목록 실패는 건너뛰고 계속 */ }
  }
  toast(added ? `⬆ ${added}개를 가져왔어요${duplicate ? ` · 중복 ${duplicate}개 제외` : ''}` : '새로 가져올 항목이 없어요');
  closeBg();
}

document.addEventListener('click', async e => {
  const el = e.target.closest('[data-yt]');
  if (!el) return;
  const action = el.dataset.yt;
  if (action === 'close') closeBg();
  else if (action === 'back') renderConnected();
  else if (action === 'save-creds') handleSaveCreds();
  else if (action === 'import-liked') handleImportLiked();
  else if (action === 'show-playlists') renderPlaylists();
  else if (action === 'import-playlists') handleImportPlaylists();
  else if (action === 'disconnect') {
    await window.dasibom.youtube.disconnect();
    toast('연결을 해제했어요');
    renderCredsForm(true);
  }
});
