// localStorage 기반 저장소 — v1('dasibom') → v2('dasibom2') 마이그레이션 포함
const KEY = 'dasibom2';
const LEGACY_KEY = 'dasibom';

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

function load() {
  try {
    const v2 = JSON.parse(localStorage.getItem(KEY) || 'null');
    if (v2 && v2.items) return v2;
    const v1 = JSON.parse(localStorage.getItem(LEGACY_KEY) || 'null');
    if (v1) return { items: v1.map(i => ({ memo: '', pinned: false, col: null, ...i })), collections: [] };
    return seed();
  } catch (e) {
    return seed();
  }
}

export const state = load();

export function persist() {
  try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) {}
}

export const items = () => state.items;
export const colById = id => state.collections.find(c => c.id === id);
