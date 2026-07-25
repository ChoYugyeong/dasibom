// 유튜브 OAuth (Desktop app, loopback redirect + PKCE). 클라이언트 시크릿 없이도 동작하지만
// Google Cloud가 "데스크톱 앱" 유형에 발급하는 시크릿을 함께 보내는 걸 권장 형식으로 따른다.
const http = require('http');
const crypto = require('crypto');
const { shell } = require('electron');

const AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
const TOKEN_URL = 'https://oauth2.googleapis.com/token';
const SCOPE = 'https://www.googleapis.com/auth/youtube.readonly';

function base64url(buf) {
  return buf.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
function pkcePair() {
  const verifier = base64url(crypto.randomBytes(32));
  const challenge = base64url(crypto.createHash('sha256').update(verifier).digest());
  return { verifier, challenge };
}

// 로컬 루프백 서버를 띄워 authorization code를 받는다.
function waitForCode(server, expectedState, timeoutMs) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => { server.close(); reject(new Error('로그인 대기 시간이 초과됐어요')); }, timeoutMs);
    server.on('request', (req, res) => {
      const url = new URL(req.url, 'http://127.0.0.1');
      if (url.pathname !== '/oauth2callback') { res.writeHead(404).end(); return; }
      const code = url.searchParams.get('code');
      const state = url.searchParams.get('state');
      const err = url.searchParams.get('error');
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      if (err || !code || state !== expectedState) {
        res.end('<html><body style="font-family:sans-serif;padding:40px"><h2>연결에 실패했어요</h2><p>이 창은 닫으셔도 됩니다.</p></body></html>');
        clearTimeout(timer);
        server.close();
        reject(new Error(err || '잘못된 응답이에요'));
        return;
      }
      res.end('<html><body style="font-family:sans-serif;padding:40px"><h2>✅ 연결됐어요!</h2><p>이 창은 닫고 다시봄으로 돌아가세요.</p></body></html>');
      clearTimeout(timer);
      server.close();
      resolve(code);
    });
  });
}

// 로그인 창을 열고 완료될 때까지 기다린 뒤 토큰을 반환한다.
async function authorize({ clientId, clientSecret }) {
  if (!clientId) throw new Error('Client ID가 필요해요');
  const { verifier, challenge } = pkcePair();
  const state = base64url(crypto.randomBytes(16));

  const server = http.createServer();
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const port = server.address().port;
  const redirectUri = `http://127.0.0.1:${port}/oauth2callback`;

  const authUrl = new URL(AUTH_URL);
  authUrl.search = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: SCOPE,
    access_type: 'offline',
    prompt: 'consent',
    code_challenge: challenge,
    code_challenge_method: 'S256',
    state
  }).toString();

  const codePromise = waitForCode(server, state, 5 * 60 * 1000);
  await shell.openExternal(authUrl.toString());
  const code = await codePromise;

  const body = new URLSearchParams({
    client_id: clientId,
    code,
    code_verifier: verifier,
    grant_type: 'authorization_code',
    redirect_uri: redirectUri
  });
  if (clientSecret) body.set('client_secret', clientSecret);

  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString()
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error_description || json.error || '토큰 교환에 실패했어요');
  return {
    access_token: json.access_token,
    refresh_token: json.refresh_token,
    expiry_date: Date.now() + (json.expires_in || 3600) * 1000
  };
}

async function refreshAccessToken({ clientId, clientSecret, refreshToken }) {
  const body = new URLSearchParams({
    client_id: clientId,
    refresh_token: refreshToken,
    grant_type: 'refresh_token'
  });
  if (clientSecret) body.set('client_secret', clientSecret);

  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString()
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error_description || json.error || '토큰 갱신에 실패했어요');
  return {
    access_token: json.access_token,
    refresh_token: json.refresh_token || refreshToken,
    expiry_date: Date.now() + (json.expires_in || 3600) * 1000
  };
}

module.exports = { authorize, refreshAccessToken, pkcePair, base64url };
