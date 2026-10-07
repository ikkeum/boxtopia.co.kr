## Boxtopia

박스토피아(https://boxtopia.co.kr) 랜딩페이지. 빌드 과정 없이 `index.html` 하나로 동작하는 정적 사이트이며 GitHub Pages(`main` 브랜치 루트)로 배포된다.

- 커스텀 도메인: `CNAME` (`boxtopia.co.kr`)
- 검색엔진: `robots.txt`, `sitemap.xml`, 구조화 데이터(JSON-LD: LocalBusiness·FAQPage), `llms.txt`, 공유 이미지 `images/og-image.jpg`(1200×630), 네이버 사이트 인증(`naver*.html`, `index.html` 메타)
- 로컬 확인: `python3 -m http.server` 후 http://localhost:8000 (`?noanim`을 붙이면 스크롤 애니메이션 비활성화)

### 테스트

```
npm install
npx playwright install chromium
npm test
```

배포 설정(CNAME·sitemap·robots), SEO 메타·구조화 데이터, 크롤러가 보는 원본 HTML 값, OG 이미지 규격, 이미지 로드, 모바일 가로 스크롤 여부를 데스크톱·모바일에서 검증한다.
