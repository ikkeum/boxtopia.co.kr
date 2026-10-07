// @ts-check
const { test, expect } = require('@playwright/test');

const SITE = 'https://boxtopia.co.kr';

// 크롤러(네이버 Yeti, AI 봇 등)는 JS를 거의 실행하지 않으므로 원본 HTML 기준으로 검증한다.
async function rawHtml(request) {
    return (await request.get('/')).text();
}

function jsonLd(html) {
    const blocks = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)];
    return blocks.flatMap(m => {
        const data = JSON.parse(m[1]);
        return data['@graph'] || [data];
    });
}

test.describe('SEO/GEO — 원본 HTML', () => {
    test('통계 숫자가 JS 실행 없이도 실제 값으로 들어 있다', async ({ request }) => {
        const html = await rawHtml(request);
        const counts = [...html.matchAll(/<span class="count" data-to="(\d+)">([^<]*)<\/span>/g)];
        expect(counts.length).toBe(4);
        for (const [, to, text] of counts) expect(text).toBe(to);
    });

    test('LocalBusiness 구조화 데이터가 사업 정보와 일치한다', async ({ request }) => {
        const biz = jsonLd(await rawHtml(request)).find(n => n['@type'] === 'LocalBusiness');
        expect(biz).toBeTruthy();
        expect(biz.name).toBe('박스토피아');
        expect(biz.url).toBe(`${SITE}/`);
        expect(biz.telephone).toBe('+82-31-536-0844');
        expect(biz.email).toBe('goguryeo.box@gmail.com');
        expect(biz.address).toMatchObject({
            addressRegion: '경기도', addressLocality: '포천시', streetAddress: '신북면 신창길 27', addressCountry: 'KR',
        });
        expect(biz.sameAs).toContain('https://www.instagram.com/boxtopia.co.kr');
    });

    test('FAQPage 구조화 데이터가 화면의 FAQ와 같은 질문을 담는다', async ({ request, page }) => {
        const faq = jsonLd(await rawHtml(request)).find(n => n['@type'] === 'FAQPage');
        expect(faq).toBeTruthy();
        await page.goto('/?noanim');
        const visible = await page.locator('.faq-list summary .t').allTextContents();
        expect(faq.mainEntity.map(q => q.name)).toEqual(visible.map(t => t.trim()));
        for (const q of faq.mainEntity) expect(q.acceptedAnswer.text.length).toBeGreaterThan(20);
    });

    test('불필요한 비표준 메타가 없다', async ({ request }) => {
        const html = await rawHtml(request);
        expect(html).not.toContain('<meta name="title"');
        expect(html).not.toContain('<meta name="language"');
    });
});

test.describe('SEO/GEO — 공유 미리보기·보조 파일', () => {
    test('OG 이미지가 1200x630 경량 이미지로 서빙된다', async ({ page, request }) => {
        await page.goto('/?noanim');
        const og = await page.locator('meta[property="og:image"]').getAttribute('content');
        expect(og).toBe(`${SITE}/images/og-image.jpg`);
        await expect(page.locator('meta[property="og:image:width"]')).toHaveAttribute('content', '1200');
        await expect(page.locator('meta[property="og:image:height"]')).toHaveAttribute('content', '630');
        await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute('content', 'summary_large_image');

        const res = await request.get('/images/og-image.jpg');
        expect(res.status()).toBe(200);
        expect((await res.body()).length).toBeLessThan(300 * 1024);
        const size = await page.evaluate(async () => {
            const img = new Image();
            img.src = '/images/og-image.jpg';
            await img.decode();
            return [img.naturalWidth, img.naturalHeight];
        });
        expect(size).toEqual([1200, 630]);
    });

    test('llms.txt가 검증된 사업 정보를 제공한다', async ({ request }) => {
        const res = await request.get('/llms.txt');
        expect(res.status()).toBe(200);
        const body = await res.text();
        expect(body).toMatch(/^# 박스토피아/);
        expect(body).toContain('031-536-0844');
        expect(body).toContain(`${SITE}/`);
    });
});
