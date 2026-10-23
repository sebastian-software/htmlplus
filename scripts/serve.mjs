import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const siteMode = process.argv.includes('--site');
const root = fileURLToPath(new URL(siteMode ? '../site/' : '../', import.meta.url));
const portArgument = process.argv.indexOf('--port');
const port = Number(portArgument >= 0 ? process.argv[portArgument + 1] : process.env.PORT || 4173);
const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.svg': 'image/svg+xml', '.map': 'application/json' };

export const server = createServer(async (request, response) => {
  try {
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      response.writeHead(405, { Allow: 'GET, HEAD' }); response.end(); return;
    }
    const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
    const base = siteMode ? '/html6/' : '/';
    if (!pathname.startsWith(base)) { response.writeHead(404); response.end('Not found'); return; }
    let relative = pathname === base ? siteMode ? 'index.html' : 'demo/index.html' : pathname.slice(base.length);
    if (!siteMode && relative === 'styling.html') relative = 'demo/styling.html';
    const path = resolve(root, relative);
    if (!path.startsWith(root.endsWith(sep) ? root : root + sep) || !(siteMode && ['index.html', 'styling.html'].includes(relative) || /^(demo|dist)\//.test(relative)) || !types[extname(path)]) {
      response.writeHead(404); response.end('Not found'); return;
    }
    const content = await readFile(path);
    response.writeHead(200, { 'Content-Type': types[extname(path)], 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' });
    response.end(request.method === 'HEAD' ? undefined : content);
  } catch (error) {
    response.writeHead(error instanceof URIError ? 400 : 404); response.end('Not found');
  }
});
server.listen(port, '127.0.0.1', () => console.log(`html6 playground: http://127.0.0.1:${port}`));
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => server.close(() => process.exit(0)));
