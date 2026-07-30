import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';

const root = process.cwd() + '/.scratch';
const mime = { '.html':'text/html', '.jpg':'image/jpeg', '.jpeg':'image/jpeg', '.png':'image/png', '.json':'application/json', '.css':'text/css' };

createServer(async (req, res) => {
  try {
    const p = normalize(join(root, decodeURIComponent(req.url.split('?')[0])));
    if (!p.startsWith(normalize(root))) { res.writeHead(403); return res.end(); }
    const data = await readFile(p);
    res.writeHead(200, { 'Content-Type': mime[extname(p)] || 'application/octet-stream' });
    res.end(data);
  } catch { res.writeHead(404); res.end('404'); }
}).listen(8977, () => console.log('serving .scratch on http://127.0.0.1:8977'));
