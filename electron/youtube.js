// YouTube Data API v3 호출 — 좋아요 표시한 동영상 · 재생목록 가져오기
const BASE = 'https://www.googleapis.com/youtube/v3';
const LIKED_PLAYLIST_ID = 'LL'; // 유튜브가 계정마다 자동으로 갖는 "좋아요 표시한 동영상" 재생목록

async function apiGet(path, params, accessToken) {
  const url = new URL(BASE + path);
  url.search = new URLSearchParams(params).toString();
  const res = await fetch(url, { headers: { Authorization: 'Bearer ' + accessToken } });
  const json = await res.json();
  if (!res.ok) {
    const e = new Error((json.error && json.error.message) || 'YouTube API 오류');
    e.status = res.status;
    throw e;
  }
  return json;
}

async function fetchAllPages(path, params, accessToken, limit = 500) {
  const items = [];
  let pageToken;
  do {
    const json = await apiGet(path, { ...params, ...(pageToken ? { pageToken } : {}) }, accessToken);
    items.push(...(json.items || []));
    pageToken = json.nextPageToken;
  } while (pageToken && items.length < limit);
  return items;
}

async function listPlaylists(accessToken) {
  const items = await fetchAllPages('/playlists', { part: 'snippet,contentDetails', mine: 'true', maxResults: 50 }, accessToken);
  return items
    .filter(p => p.id !== LIKED_PLAYLIST_ID)
    .map(p => ({ id: p.id, title: p.snippet.title, count: p.contentDetails.itemCount }));
}

async function fetchPlaylistVideos(playlistId, accessToken) {
  const items = await fetchAllPages('/playlistItems', { part: 'snippet,contentDetails', playlistId, maxResults: 50 }, accessToken);
  return items.filter(it => it.snippet && it.snippet.resourceId && it.snippet.resourceId.videoId);
}

function transform(playlistItem, tag) {
  const s = playlistItem.snippet;
  const vid = s.resourceId.videoId;
  const thumb = s.thumbnails && (s.thumbnails.medium || s.thumbnails.default);
  const savedAt = playlistItem.contentDetails && playlistItem.contentDetails.videoPublishedAt;
  return {
    url: `https://www.youtube.com/watch?v=${vid}`,
    title: s.title || `YouTube 영상 (${vid})`,
    thumb: thumb ? thumb.url : `https://img.youtube.com/vi/${vid}/hqdefault.jpg`,
    src: 'youtube',
    tags: tag ? [tag] : [],
    saved: savedAt ? Date.parse(savedAt) : Date.now()
  };
}

async function importLiked(accessToken) {
  const items = await fetchPlaylistVideos(LIKED_PLAYLIST_ID, accessToken);
  return items.map(it => transform(it, '좋아요'));
}

async function importPlaylist(playlistId, title, accessToken) {
  const items = await fetchPlaylistVideos(playlistId, accessToken);
  return items.map(it => transform(it, title || '재생목록'));
}

module.exports = { listPlaylists, importLiked, importPlaylist, transform, LIKED_PLAYLIST_ID };
