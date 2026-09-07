// Servidor local para ver el sitio mientras se trabaja. Reconstruye cuando
// cambia algo en data/, contenido/, lib/, publico/ o site.config.json.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIST = path.join(ROOT, 'dist');
const PUERTO = Number(process.env.PORT || 4321);
const VIGILAR = ['data', 'contenido', 'lib', 'publico', 'site.config.json', 'build.js'];

const TIPOS = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8', '.svg': 'image/svg+xml',
  '.json': 'application/json', '.xml': 'application/xml',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
  '.webp': 'image/webp', '.txt': 'text/plain; charset=utf-8',
};

function huella() {
  let sello = '';
  const recorrer = (p) => {
    const st = fs.statSync(p);
    if (st.isDirectory()) for (const f of fs.readdirSync(p).sort()) recorrer(path.join(p, f));
    else sello += `${p}:${st.mtimeMs};`;
  };
  for (const v of VIGILAR) {
    const p = path.join(ROOT, v);
    if (fs.existsSync(p)) recorrer(p);
  }
  return sello;
}

let ultima = '';
function construirSiHaceFalta() {
  const actual = huella();
  if (actual === ultima) return true;
  ultima = actual;
  const r = spawnSync(process.execPath, ['build.js'], { cwd: ROOT, stdio: 'inherit', env: process.env });
  return r.status === 0;
}

construirSiHaceFalta();

http.createServer((req, res) => {
  if (!construirSiHaceFalta()) {
    res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
    return res.end('El build falló. Mire la terminal.');
  }
  let ruta = decodeURIComponent(req.url.split('?')[0]);
  let archivo = path.join(DIST, ruta);
  if (!archivo.startsWith(DIST)) { res.writeHead(403); return res.end(); }
  if (fs.existsSync(archivo) && fs.statSync(archivo).isDirectory()) archivo = path.join(archivo, 'index.html');
  if (!fs.existsSync(archivo)) {
    const e404 = path.join(DIST, '404.html');
    res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
    return res.end(fs.existsSync(e404) ? fs.readFileSync(e404) : 'No encontrado');
  }
  res.writeHead(200, { 'Content-Type': TIPOS[path.extname(archivo)] || 'application/octet-stream' });
  res.end(fs.readFileSync(archivo));
}).listen(PUERTO, () => {
  console.log(`\n→ http://localhost:${PUERTO}  (dataset: ${process.env.SITE_DATASET === 'ejemplo' ? 'ejemplo' : 'real'})\n`);
});
