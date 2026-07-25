// 유튜브 OAuth 클라이언트 정보 · 토큰을 로컬에 저장.
// 가능하면 OS 자격증명 저장소(safeStorage, Windows DPAPI 등)로 암호화한다.
const { app, safeStorage } = require('electron');
const path = require('path');
const fs = require('fs/promises');

const FILE = path.join(app.getPath('userData'), 'youtube-auth.json');

async function readRaw() {
  try { return await fs.readFile(FILE); } catch (e) { return null; }
}
async function writeRaw(buf) {
  await fs.mkdir(path.dirname(FILE), { recursive: true });
  await fs.writeFile(FILE, buf);
}

function canEncrypt() {
  try { return safeStorage.isEncryptionAvailable(); } catch (e) { return false; }
}

async function readJson() {
  const raw = await readRaw();
  if (!raw) return null;
  try {
    const text = canEncrypt() ? safeStorage.decryptString(raw) : raw.toString('utf8');
    return JSON.parse(text);
  } catch (e) { return null; }
}
async function writeJson(obj) {
  const text = JSON.stringify(obj);
  const buf = canEncrypt() ? safeStorage.encryptString(text) : Buffer.from(text, 'utf8');
  await writeRaw(buf);
}

async function load() {
  return (await readJson()) || {};
}
async function saveCreds(clientId, clientSecret) {
  const data = await load();
  data.clientId = clientId;
  data.clientSecret = clientSecret;
  await writeJson(data);
}
async function saveTokens(tokens) {
  const data = await load();
  data.tokens = { ...(data.tokens || {}), ...tokens };
  await writeJson(data);
}
async function clearTokens() {
  const data = await load();
  delete data.tokens;
  await writeJson(data);
}
async function clearAll() {
  try { await fs.unlink(FILE); } catch (e) {}
}

module.exports = { load, saveCreds, saveTokens, clearTokens, clearAll };
