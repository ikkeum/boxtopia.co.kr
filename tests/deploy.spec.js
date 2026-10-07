// @ts-check
const fs = require('fs');
const path = require('path');
const { test, expect } = require('@playwright/test');

const ROOT = path.join(__dirname, '..');
const SITE = 'https://boxtopia.co.kr';

test.describe('배포 설정 파일', () => {
    test('CNAME이 boxtopia.co.kr을 가리키고 git 추적 대상이다', () => {
        expect(fs.readFileSync(path.join(ROOT, 'CNAME'), 'utf8').trim()).toBe('boxtopia.co.kr');
        expect(fs.readFileSync(path.join(ROOT, '.gitignore'), 'utf8')).not.toMatch(/^CNAME$/m);
    });

    test('sitemap.xml이 정확한 경로로 서빙된다', async ({ request }) => {
        const res = await request.get('/sitemap.xml');
        expect(res.status()).toBe(200);
        expect(await res.text()).toContain(`<loc>${SITE}/</loc>`);
    });

    test('robots.txt가 크롤링을 허용하고 sitemap을 알린다', async ({ request }) => {
        const body = await (await request.get('/robots.txt')).text();
        expect(body).toMatch(/Allow: \//);
        expect(body).toContain(`Sitemap: ${SITE}/sitemap.xml`);
    });

    for (const page of ['index-v2.html', 'index-v3.html', 'index-v4.html', 'proposals.html']) {
        test(`검토용 시안 페이지(${page})는 배포되지 않는다`, async ({ request }) => {
            expect((await request.get('/' + page)).status()).toBe(404);
        });
    }
});

test.describe('메인 페이지', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/?noanim');
    });

    test('확정 시안(블루프린트)이 index로 서빙된다', async ({ page }) => {
        await expect(page).toHaveTitle(/박스토피아/);
        await expect(page.locator('h1')).toContainText('정확한 설계');
        await expect(page.locator('meta[name="theme-color"]')).toHaveAttribute('content', '#10316B');
    });

    test('검색 노출이 허용되고 canonical/OG 메타가 절대 URL이다', async ({ page }) => {
        await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'index, follow');
        await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', `${SITE}/`);
        await expect(page.locator('meta[property="og:url"]')).toHaveAttribute('content', `${SITE}/`);
        await expect(page.locator('meta[property="og:type"]')).toHaveAttribute('content', 'website');
        await expect(page.locator('meta[property="og:image"]')).toHaveAttribute('content', `${SITE}/images/og-image.jpg`);
    });

    test('모든 이미지가 정상 로드된다', async ({ page }) => {
        // lazy 이미지를 eager로 바꿔 로드를 강제하고, 로딩이 끝난 뒤 판정한다
        // (라이트박스처럼 src가 비어 있는 img는 제외)
        const selector = 'img[src]:not([src=""])';
        await page.$$eval(selector, imgs => imgs.forEach(img => { img.loading = 'eager'; }));
        await page.waitForFunction(sel => [...document.querySelectorAll(sel)].every(i => i.complete), selector);
        const broken = await page.$$eval(selector, imgs =>
            imgs.filter(i => i.naturalWidth === 0).map(i => i.getAttribute('src')));
        expect(broken).toEqual([]);
    });

    test('가로 스크롤이 생기지 않는다', async ({ page }) => {
        const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
        expect(overflow).toBeLessThanOrEqual(0);
    });

});
