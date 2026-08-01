export const SUPABASE_URL = "https://xpvzziofihamhavulwbz.supabase.co";
export const SUPABASE_ANON_KEY = "sb_publishable_nWReXsVlfI4QM0bOuw1A2g_uikm8CVl";
export const AUTH_EMAIL_DOMAIN = '@ddubu.internal';

export const CURRENCIES = [
  { code: 'KRW', label: 'KRW', sym: '₩', unit: 1 },
  { code: 'USD', label: 'USD', sym: '$', unit: 1 },
  { code: 'JPY', label: 'JPY(100)', sym: '¥', unit: 100 },
  { code: 'EUR', label: 'EUR', sym: '€', unit: 1 },
  { code: 'CNY', label: 'CNY', sym: '元', unit: 1 }
];

export const REGIONS_BY_COUNTRY = {
  "한국": ["서울", "부산", "제주", "인천", "경주", "순천", "강릉", "전주", "대구", "광주", "대전", "수원", "춘천", "속초", "여수", "통영", "거제", "안동", "포항", "울산", "목포", "강화도", "남해", "보성", "담양", "충주", "청주", "공주", "천안", "영광", "고창", "군산", "익산", "정읍", "나주", "화순", "장흥", "강진", "해남", "완도", "진도", "무안", "함평", "영암", "장성", "곡성", "구례", "고흥", "광양", "사천", "하동", "산청", "함양", "거창", "합천", "창녕", "밀양", "양산", "창원", "김해", "의령", "함안", "진주", "고령", "성주", "칠곡", "영천", "청도", "경산", "의성", "청송", "영양", "영덕", "울진", "봉화", "예천", "문경", "상주", "김천", "구미", "원주", "동해", "태백", "삼척", "정선", "평창", "횡성", "홍천", "양양", "인제", "화천", "양구", "철원", "가평", "양평", "이천", "여주", "용인", "평택", "화성", "안산", "안양", "고양", "파주", "김포", "부천"],
  "일본": ["도쿄", "오사카", "후쿠오카", "교토", "삿포로", "구마모토", "나고야", "히로시마", "나라", "요코하마", "고베", "센다이", "가나자와", "오키나와"],
  "프랑스": ["파리", "니스", "마르세유", "리옹"],
  "미국": ["뉴욕", "로스앤젤레스", "시카고", "하와이", "샌프란시스코"],
  "대만": ["타이베이", "가오슝", "타이중"],
  "이탈리아": ["로마", "밀라노", "베네치아", "피렌체"],
  "태국": ["방콕", "치앙마이", "푸껫", "파타야"],
  "베트남": ["다낭", "하노이", "호찌민", "나트랑"],
  "중국": ["베이징", "상하이", "칭다오", "청두", "대련"],
  "영국": ["런던", "에든버러", "맨체스터", "리버풀"],
  "스페인": ["바르셀로나", "마드리드", "세비야"],
  "독일": ["베를린", "뮌헨", "프랑크푸르트"],
  "호주": ["시드니", "멜버른", "브리즈번"]
};

export const COUNTRY_FLAG = {
  "한국": "🇰🇷", "일본": "🇯🇵", "프랑스": "🇫🇷", "미국": "🇺🇸",
  "대만": "🇹🇼", "이탈리아": "🇮🇹", "태국": "🇹🇭", "베트남": "🇻🇳",
  "중국": "🇨🇳", "영국": "🇬🇧", "스페인": "🇪🇸", "독일": "🇩🇪", "호주": "🇦🇺"
};

// 카카오 카테고리별 색상
export const KAKAO_CAT_COLORS = {
  FD6: '#ef4444', // 식당 — 빨강
  CE7: '#f59e0b', // 카페 — 노랑
  AT4: '#10b981', // 관광지 — 초록
  CS2: '#3b82f6', // 편의점 — 파랑
  AD5: '#8b5cf6', // 숙박 — 보라
  MT1: '#f97316', // 마트 — 주황
};

export const CITY_NAME_TO_EN = {
  "서울": "Seoul", "부산": "Busan", "제주": "Jeju", "인천": "Incheon", "경주": "Gyeongju", "순천": "Suncheon",
  "도쿄": "Tokyo", "오사카": "Osaka", "후쿠오카": "Fukuoka", "교토": "Kyoto", "삿포로": "Sapporo",
  "구마모토": "Kumamoto", "나고야": "Nagoya", "히로시마": "Hiroshima", "나라": "Nara",
  "요코하마": "Yokohama", "고베": "Kobe", "센다이": "Sendai", "가나자와": "Kanazawa", "오키나와": "Okinawa",
  "파리": "Paris", "니스": "Nice", "마르세유": "Marseille", "리옹": "Lyon",
  "뉴욕": "New York", "로스앤젤레스": "Los Angeles", "시카고": "Chicago", "하와이": "Honolulu", "샌프란시스코": "San Francisco",
  "타이베이": "Taipei", "가오슝": "Kaohsiung", "타이중": "Taichung",
  "로마": "Rome", "밀라노": "Milan", "베네치아": "Venice", "피렌체": "Florence",
  "방콕": "Bangkok", "치앙마이": "Chiang Mai", "푸껫": "Phuket", "파타야": "Pattaya",
  "다낭": "Da Nang", "하노이": "Hanoi", "호찌민": "Ho Chi Minh City", "나트랑": "Nha Trang",
  "베이징": "Beijing", "상하이": "Shanghai", "칭다오": "Qingdao", "청두": "Chengdu", "대련": "Dalian",
  "런던": "London", "에든버러": "Edinburgh", "맨체스터": "Manchester", "리버풀": "Liverpool",
  "바르셀로나": "Barcelona", "마드리드": "Madrid", "세비야": "Seville",
  "베를린": "Berlin", "뮌헨": "Munich", "프랑크푸르트": "Frankfurt",
  "시드니": "Sydney", "멜버른": "Melbourne", "브리즈번": "Brisbane"
};
