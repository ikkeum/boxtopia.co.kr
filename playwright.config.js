// @ts-check
const { defineConfig, devices } = require('@playwright/test');

// 정적 사이트를 GitHub Pages와 같은 방식(루트 기준 정적 서빙)으로 띄워 검증한다.
module.exports = defineConfig({
    testDir: './tests',
    reporter: 'list',
    use: { baseURL: 'http://127.0.0.1:4173' },
    webServer: {
        command: 'python3 -m http.server 4173 --bind 127.0.0.1',
        url: 'http://127.0.0.1:4173/',
        reuseExistingServer: !process.env.CI,
    },
    projects: [
        { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
        { name: 'mobile', use: { ...devices['Pixel 7'] } },
    ],
});
