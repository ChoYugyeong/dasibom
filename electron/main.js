const { app, protocol, net, BrowserWindow, ipcMain, dialog, shell } = require('electron');
const path = require('path');
const fs = require('fs/promises');
const { fetchMeta } = require('./metadata');

const ROOT = path.join(__dirname, '..');
const CONFIG_FILE = path.join(app.getPath('userData'), 'config.json');

// ── 파일 유틸 ───────────────────────────
async function readJson(file) {
  try { return JSON.parse(await fs.readFile(file, 'utf8')); } catch (e) { return null; }
}
async function writeJson(file, data) {
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, JSON.stringify(data, null, 2), 'utf8');
}

// 현재 vault(저장 폴더) 안의 데이터 파일 경로. 미지정 시 앱 데이터 폴더 사용.
async function vaultFile() {
  const cfg = await readJson(CONFIG_FILE);
  const dir = (cfg && cfg.vault) ? cfg.vault : app.getPath('userData');
  return path.join(dir, 'bookmarks.json');
}

// ── 렌더러 ↔ 메인 IPC ───────────────────
ipcMain.handle('vault:load', async () => readJson(await vaultFile()));
ipcMain.handle('vault:save', async (_e, data) => { await writeJson(await vaultFile(), data); return true; });
ipcMain.handle('vault:path', async () => vaultFile());
ipcMain.handle('vault:reveal', async () => { shell.showItemInFolder(await vaultFile()); return true; });
ipcMain.handle('vault:choose', async () => {
  const r = await dialog.showOpenDialog({
    title: '북마크를 저장할 폴더를 고르세요',
    properties: ['openDirectory', 'createDirectory']
  });
  if (r.canceled || !r.filePaths[0]) return null;
  await writeJson(CONFIG_FILE, { vault: r.filePaths[0] });
  return path.join(r.filePaths[0], 'bookmarks.json');
});

// 링크의 공개 제목·썸네일 가져오기 (로그인 불필요)
ipcMain.handle('meta:fetch', async (_e, url) => {
  try { return await fetchMeta(url); } catch (e) { return {}; }
});

// ── 정적 파일을 app:// 로 서빙 (ES 모듈 로딩을 위해 file:// 대신 사용) ──
const MIME = {
  '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css',
  '.json': 'application/json', '.svg': 'image/svg+xml',
  '.png': 'image/png', '.ico': 'image/x-icon', '.webmanifest': 'application/manifest+json'
};
protocol.registerSchemesAsPrivileged([
  { scheme: 'app', privileges: { standard: true, secure: true, supportFetchAPI: true } }
]);

function createWindow() {
  const win = new BrowserWindow({
    width: 1100, height: 840, minWidth: 380,
    backgroundColor: '#f7f6f3',
    title: '다시봄',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });
  win.loadURL('app://dasibom/index.html');
}

app.whenReady().then(() => {
  protocol.handle('app', async (req) => {
    let rel = decodeURIComponent(new URL(req.url).pathname);
    if (!rel || rel === '/') rel = '/index.html';
    // 경로 이탈 방지
    const filePath = path.normalize(path.join(ROOT, rel));
    if (!filePath.startsWith(ROOT)) return new Response('Forbidden', { status: 403 });
    try {
      const data = await fs.readFile(filePath);
      const ext = path.extname(filePath).toLowerCase();
      return new Response(data, { headers: { 'content-type': MIME[ext] || 'application/octet-stream' } });
    } catch (e) {
      return new Response('Not found', { status: 404 });
    }
  });
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
