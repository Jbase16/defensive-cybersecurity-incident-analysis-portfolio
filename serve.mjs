import {createServer} from 'node:http';
import {readFile, access, stat} from 'node:fs/promises';
import {constants} from 'node:fs';
import {dirname, extname, join, normalize, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = resolve(__dirname);
const port = Number(process.env.PORT || 4173);

const mimeMap = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.csv': 'text/csv; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2'
};

function safePath(urlPath) {
  const clean = normalize(urlPath.split('?')[0] || '/').replace(/\\/g, '/');
  const resolved = resolve(rootDir, clean.replace(/^\//, ''));
  if (!resolved.startsWith(rootDir)) {
    return null;
  }
  return resolved;
}

const server = createServer(async (req, res) => {
  try {
    const reqPath = req.url || '/';
    const basePath = safePath(reqPath);
    if (!basePath) {
      res.writeHead(403, {'Content-Type': 'text/plain'});
      res.end('Forbidden');
      return;
    }

    let target = basePath;
    try {
      await access(target, constants.F_OK);
      const fileStat = await stat(target);
      if (fileStat.isDirectory()) {
        target = join(target, 'index.html');
      }
    } catch {
      res.writeHead(404, {'Content-Type': 'text/plain'});
      res.end('Not found');
      return;
    }

    const data = await readFile(target);
    const ext = extname(target).toLowerCase();
    const contentType = mimeMap[ext] || 'application/octet-stream';
    res.writeHead(200, {'Content-Type': contentType});
    res.end(data);
  } catch (error) {
    res.writeHead(500, {'Content-Type': 'text/plain'});
    res.end(`Server error: ${error instanceof Error ? error.message : 'unknown error'}`);
  }
});

server.listen(port, '127.0.0.1', () => {
  console.log(`Portfolio server is live at http://127.0.0.1:${port}/`);
});
