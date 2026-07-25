// 저장소 — 데스크톱 앱(Electron)에서는 로컬 파일, 웹에서는 localStorage.
// window.dasibom 존재 여부로 모드를 판별한다(preload.js가 주입).
const desktop = typeof window !== 'undefined' && window.dasibom;
const KEY = 'dasibom2';
const LEGACY_KEY = 'dasibom';

// state는 재할당하지 않고 속성만 갱신한다(다른 모듈이 참조를 그대로 유지하도록).
export const state = { items: [], collections: [] };

function seed() {
  const now = Date.now(), d = 86400000;
  return {
    collections: [
      { id: 'c1', name: '맛집·카페', icon: '🍽️', color: '#ff6b35' },
      { id: 'c2', name: '운동', icon: '🏋️', color: '#03C75A' }
    ],
    items: [
      { id: 1, url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', title: '나중에 꼭 볼 영상', memo: '', src: 'youtube', tags: ['영상'], col: null, pinned: true, saved: now - 9 * d, seen: false },
      { id: 2, url: 'https://www.instagram.com/p/example/', title: '성수동 카페 저장', memo: '주말에 가볼 것. 웨이팅 있다고 함', src: 'instagram', tags: ['카페', '성수'], col: 'c1', pinned: false, saved: now - 3 * d, seen: false },
      { id: 3, url: 'https://www.tiktok.com/@user/video/123', title: '홈트 루틴 따라하기', memo: '', src: 'tiktok', tags: ['운동'], col: 'c2', pinned: false, saved: now - 1 * d, seen: true },
      { id: 4, url: 'https://blog.naver.com/example/recipe', title: '백종원 김치찌개 레시피', memo: '돼지고기 앞다리살로', src: 'naver', tags: ['레시피'], col: 'c1', pinned: false, saved: now - 12 * d, seen: false }
    ]
  };
}

// localStorage에 남아있는 기존 데이터(v1/v2)를 읽어온다. 없으면 null.
function fromLocalStorage() {
  try {
    const v2 = JSON.parse(localStorage.getItem(KEY) || 'null');
    if (v2 && v2.items) return v2;
    const v1 = JSON.parse(localStorage.getItem(LEGACY_KEY) || 'null');
    if (v1) return { items: v1.map(i => ({ memo: '', pinned: false, col: null, ...i })), collections: [] };
  } catch (e) {}
  return null;
}

function apply(data) {
  state.items = (data && data.items) || [];
  state.collections = (data && data.collections) || [];
}

// 앱 시작 시 한 번 호출. 파일/로컬스토리지에서 데이터를 불러온다.
export async function initStore() {
  if (desktop) {
    let data = await window.dasibom.load();
    if (!data) {
      // 파일이 아직 없으면: 기존 localStorage 데이터를 넘겨받거나 예시 데이터로 시작
      data = fromLocalStorage() || seed();
      await window.dasibom.save(data);
    }
    apply(data);
  } else {
    apply(fromLocalStorage() || seed());
  }
}

// vault(저장 폴더)를 바꾼 뒤 다시 불러온다. 빈 폴더면 현재 데이터를 그 폴더에 옮겨 쓴다.
export async function reloadFromVault() {
  if (!desktop) return;
  const data = await window.dasibom.load();
  if (data) apply(data);
  else persist();
}

export function persist() {
  if (desktop) {
    window.dasibom.save({ items: state.items, collections: state.collections });
  } else {
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) {}
  }
}

export const items = () => state.items;
export const colById = id => state.collections.find(c => c.id === id);
