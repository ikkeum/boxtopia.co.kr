// 테스트용 정적 서버 — GitHub Pages처럼 저장소 루트를 그대로 서빙한다.
// (python http.server는 동시 요청이 몰리면 연결을 리셋해 이미지 테스트가 불안정했다)
const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const PORT = Number(process.env.PORT || 4173);
const TYPES = {
    '.html': 'text/html; charset=utf-8', '.txt': 'text/plain; charset=utf-8', '.xml': 'application/xml',
    '.css': 'text/css', '.js': 'text/javascript', '.json': 'application/json', '.svg': 'image/svg+xml',
    '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.ico': 'image/x-icon',
};

http.createServer((req, res) => {
    let rel = decodeURIComponent(new URL(req.url, 'http://x').pathname);
    if (rel.endsWith('/')) rel += 'index.html';
    const file = path.join(ROOT, path.normalize(rel));
    if (!file.startsWith(ROOT + path.sep)) { res.writeHead(403).end(); return; }
    fs.readFile(file, (err, data) => {
        if (err) { res.writeHead(404).end('Not Found'); return; }
        res.writeHead(200, { 'Content-Type': TYPES[path.extname(file).toLowerCase()] || 'application/octet-stream' });
        res.end(data);
    });
}).listen(PORT, '127.0.0.1');
