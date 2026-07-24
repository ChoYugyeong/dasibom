// 출처 정의 — 링크 도메인으로 자동 분류할 때 사용
export const SOURCES = {
  instagram: { name: '인스타그램', icon: '📸', color: '#E1306C', match: /instagram\.com/ },
  youtube:   { name: '유튜브',     icon: '▶️', color: '#FF0000', match: /youtube\.com|youtu\.be/ },
  tiktok:    { name: '틱톡',       icon: '🎵', color: '#010101', match: /tiktok\.com/ },
  x:         { name: 'X (트위터)', icon: '🐦', color: '#1DA1F2', match: /twitter\.com|(^|\.)x\.com/ },
  threads:   { name: '스레드',     icon: '🧵', color: '#000000', match: /threads\.(net|com)/ },
  facebook:  { name: '페이스북',   icon: '👥', color: '#1877F2', match: /facebook\.com|fb\.com/ },
  naver:     { name: '네이버',     icon: '🟢', color: '#03C75A', match: /naver\.com|naver\.me/ },
  blog:      { name: '블로그',     icon: '✍️', color: '#6C5CE7', match: /brunch\.co\.kr|tistory\.com|velog\.io|medium\.com/ },
  pinterest: { name: '핀터레스트', icon: '📌', color: '#E60023', match: /pinterest\./ },
  shopping:  { name: '쇼핑',       icon: '🛍️', color: '#F39C12', match: /coupang\.com|musinsa\.com|29cm\.co\.kr|oliveyoung\.co\.kr|kream\.co\.kr|smartstore\.naver/ },
  linkedin:  { name: '링크드인',   icon: '💼', color: '#0A66C2', match: /linkedin\.com/ },
  reddit:    { name: '레딧',       icon: '👽', color: '#FF4500', match: /reddit\.com/ },
  web:       { name: '웹',         icon: '🌐', color: '#8a8578', match: /./ }
};

export const COL_EMOJIS = ['📁','⭐','🍽️','☕','🏋️','✈️','🎬','🎨','📚','💡','🛒','🎁'];
export const COL_COLORS = ['#ff6b35','#E1306C','#1DA1F2','#03C75A','#6C5CE7','#F39C12','#2d3436','#00b894'];
