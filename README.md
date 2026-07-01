# 성경 읽기 — Bible App

8개 번역을 지원하는 PWA 성경 앱. 오프라인 읽기, 개인 기록, 말씀카드 생성.

## 기능

**📖 읽기** — 구약 39권 + 신약 27권, 8개 번역 지원
- 개역한글 / 개역개정 / 새번역 / 새한글 / The Message / NASB2020 / ESV / NIV2011
- 장 넘김 페이드 애니메이션
- 좌우 스와이프로 장 이동
- 키보드 방향키 탐색
- 읽기 위치 자동 저장

**✝ 말씀** — 오늘의 구절 (home 화면 상단, 날짜별 deterministic), 말씀카드 (Canvas 800×1000 이미지 → 공유/다운로드)

**📚 1년 1독** — 365일 읽기 계획, 진행률 바, 일별 읽음 체크 (localStorage), 장 클릭 시 이동

**🔍 검색** — 본문 전체 검색 (200개 초과 시 구체화 안내)

**🎨 개인화**
- 북마크 / 하이라이트 (4색) / 메모
- 탭 → 액션바 (북마크/하이라이트/메모/말씀카드/복사)
- 롱프레스 → 구절 바로 복사

**⚙️ 설정**
- 5가지 테마 + 사용자 지정 (배경/표면/글자/강조/헤더 색상)
- 글자 크기 (12~32px), 줄 간격 (1.2~2.4), 글자 간격 (0~0.15em)

**🌐 PWA**
- 설치 가능 (manifest.json + icon-192/512)
- 오프라인 캐싱 (SW: static cache-first, bible data network-first)
- SVG 아이콘 (십자가 + 성경)

## 번역

| ID | 이름 | 언어 |
|----|------|------|
| kjv | 개역한글 | 🇰🇷 |
| krv | 개역개정 | 🇰🇷 |
| nks | 새번역 | 🇰🇷 |
| nhk | 새한글 | 🇰🇷 |
| msg | The Message | 🇺🇸 |
| nas | NASB2020 | 🇺🇸 |
| esv | ESV | 🇺🇸 |
| niv | NIV2011 | 🇺🇸 |

## 사용하기

**GitHub Pages:**
```
https://spidychoipro.github.io/bible-app/
```

**로컬 실행:**
```bash
npx http-server . -p 3456
```

Android Chrome → 우측 상단 메뉴 → "홈 화면에 추가"

## 데이터

- Bible JSON: `data/bible-{id}.json` (8개 번역)
- 사용자 데이터: localStorage (북마크, 하이라이트, 메모, 읽기계획, 설정)
- 데이터 용량: 번역당 약 4~8MB (최초 로딩 시 캐싱)

## 라이선스

- Bible text: 대한성서공회 (개역한글/개역개정/새번역/새한글)
- The Message: NavPress
- NASB2020: Lockman Foundation
- ESV: Crossway
- NIV2011: Biblica
