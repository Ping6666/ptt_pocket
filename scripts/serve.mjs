import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { networkInterfaces } from 'node:os';

const host = process.argv.includes('--lan') ? '0.0.0.0' : '127.0.0.1';
const port = Number(process.env.PORT || 8080);
const root = new URL('../', import.meta.url);
const files = new Map([
  ['index.html', 'text/html; charset=utf-8'], ['styles.css', 'text/css; charset=utf-8'],
  ['app.js', 'text/javascript; charset=utf-8'], ['layout.js', 'text/javascript; charset=utf-8'],
]);
const server = http.createServer(async (req, res) => {
  if (!['GET', 'HEAD'].includes(req.method)) { res.writeHead(405); res.end(); return; }
  const path = new URL(req.url, 'http://localhost').pathname;
  // Allow a project prefix too, so GitHub Pages subpath behavior can be tested.
  const name = path.endsWith('/') ? 'index.html' : path.split('/').pop();
  if (!files.has(name)) { res.writeHead(404); res.end('Not found'); return; }
  try {
    const body = await readFile(new URL(name, root));
    res.writeHead(200, { 'Content-Type': files.get(name), 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' });
    res.end(req.method === 'HEAD' ? undefined : body);
  } catch { res.writeHead(500); res.end('Unable to read static file'); }
});
server.on('error', (error) => { console.error(error.message); process.exitCode = 1; });
server.listen(port, host, () => {
  const listeningPort = server.address().port;
  console.log(`PTT Pocket: http://127.0.0.1:${listeningPort}/ (${host === '0.0.0.0' ? 'LAN enabled' : 'local only'})`);
  if (host === '0.0.0.0') {
    for (const [name, addresses] of Object.entries(networkInterfaces())) {
      for (const { address, family, internal } of addresses ?? []) {
        if (family === 'IPv4' && !internal) {
          console.log(`  LAN (${name}): http://${address}:${listeningPort}/`);
        }
      }
    }
  }
});
