// 墨江湖 web-desktop 本地预览服务器
const http = require('http');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, 'build', 'web-desktop');
const port = 8123;

const mime = {
    '.html': 'text/html; charset=utf-8',
    '.js': 'text/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.wasm': 'application/wasm',
    '.png': 'image/png',
    '.ico': 'image/x-icon',
    '.bin': 'application/octet-stream',
    '.mem': 'application/octet-stream',
};

http.createServer((req, res) => {
    let p = decodeURIComponent(req.url.split('?')[0]);
    if (p === '/') p = '/index.html';
    const f = path.join(root, p);
    if (!f.startsWith(root)) { res.writeHead(403); res.end('403'); return; }
    fs.readFile(f, (e, d) => {
        if (e) { res.writeHead(404); res.end('404: ' + p); return; }
        res.writeHead(200, {
            'Content-Type': mime[path.extname(f)] || 'application/octet-stream',
            // 禁用缓存，确保开发期每次刷新都拿到最新构建
            'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
            'Pragma': 'no-cache',
            'Expires': '0',
        });
        res.end(d);
    });
}).listen(port, () => {
    console.log(`[MoJiang] server running at http://127.0.0.1:${port}/`);
});
