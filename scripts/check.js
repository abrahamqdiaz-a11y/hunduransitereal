// Comprueba que el sitio construido cumple las reglas que no se pueden romper.
// Se corre con: npm run check
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { cargarDatos, estadoVerificacion } from '../lib/data.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIST = path.join(ROOT, 'dist');
const dataset = process.env.SITE_DATASET === 'ejemplo' ? 'ejemplo' : 'real';

const fallos = [];
const fallo = (m) => fallos.push(m);

const build = spawnSync(process.execPath, ['build.js'], { cwd: ROOT, stdio: 'inherit', env: process.env });
if (build.status !== 0) { console.error('✗ El build falló.'); process.exit(1); }

function archivos(dir, lista = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) archivos(p, lista);
    else if (p.endsWith('.html')) lista.push(p);
  }
  return lista;
}

const paginas = archivos(DIST).map((f) => ({
  archivo: path.relative(DIST, f),
  ruta: '/' + path.relative(DIST, f).replace(/\\/g, '/').replace(/index\.html$/, ''),
  html: fs.readFileSync(f, 'utf8'),
}));

const existe = (ruta) => {
  const limpia = ruta.split('#')[0].split('?')[0];
  if (!limpia.startsWith('/')) return true;
  const candidatos = [
    path.join(DIST, limpia),
    path.join(DIST, limpia, 'index.html'),
  ];
  return candidatos.some((c) => fs.existsSync(c) && fs.statSync(c).isFile());
};

// 1. Metadatos y enlaces internos
for (const p of paginas) {
  if (!/<title>[^<]{5,}<\/title>/.test(p.html)) fallo(`${p.archivo}: falta <title> con contenido.`);
  if (!/<meta name="description" content="[^"]{20,}"/.test(p.html)) fallo(`${p.archivo}: falta meta description útil.`);
  if (!/<link rel="canonical"/.test(p.html)) fallo(`${p.archivo}: falta canonical.`);
  if (!/lang="es-HN"/.test(p.html)) fallo(`${p.archivo}: falta lang="es-HN".`);
  for (const m of p.html.matchAll(/href="(\/[^"#][^"]*)"/g)) {
    if (!existe(m[1])) fallo(`${p.archivo}: enlace roto a ${m[1]}`);
  }
}

// 2. Reglas duras sobre verificación
const ctx = cargarDatos({ dataset });
if (ctx.errores.length) { ctx.errores.forEach(fallo); }

const porRuta = Object.fromEntries(paginas.map((p) => [p.ruta, p]));

function revisarEntidad(ent, ruta, tipo) {
  const p = porRuta[ruta];
  if (!p) return fallo(`Falta la página ${ruta}`);
  const estado = estadoVerificacion(ent, ctx.config);
  const tieneSello = p.html.includes('marca marca--verificado');
  const tieneAviso = p.html.includes('aviso-sin-verificar');

  if (estado.clave === 'verificado') {
    if (!tieneSello) fallo(`${ruta}: debería mostrar la marca de verificado.`);
    if (!p.html.includes('Qué comprobamos y qué no')) fallo(`${ruta}: falta la ficha de comprobaciones.`);
    if (!p.html.includes('Lo que NO revisamos')) fallo(`${ruta}: falta la lista de lo que no se revisó.`);
  } else {
    if (tieneSello) fallo(`${ruta}: muestra marca de VERIFICADO sin estarlo. Regla rota.`);
    if (!tieneAviso) fallo(`${ruta}: falta la advertencia visible de que no está verificado.`);
  }
  if (!p.html.includes('/reportar/?')) fallo(`${ruta}: falta el botón de reportar.`);
}

for (const pr of ctx.proveedores) revisarEntidad(pr, `/proveedor/${pr.slug}/`, 'proveedor');
for (const inm of ctx.propiedades) revisarEntidad(inm, `/propiedad/${inm.slug}/`, 'propiedad');

// 3. Palabras que este sitio no debe usar nunca
const prohibidas = [
  [/garantizamos (?!el resultado|ningún|nada)/i, 'promete garantías'],
  [/100\s*%\s*(seguro|garantizado)/i, 'promete seguridad absoluta'],
  [/oferta por tiempo limitado|últimas? (horas|plazas)|apúrese/i, 'urgencia falsa'],
  [/\b\d+\s*(reseñas|opiniones|estrellas)\b/i, 'reseñas o calificaciones inventadas'],
  [/socio oficial|aliado oficial del gobierno/i, 'alianza no comprobable'],
];
for (const p of paginas) {
  const texto = p.html.replace(/<[^>]+>/g, ' ');
  for (const [re, motivo] of prohibidas) {
    if (re.test(texto)) fallo(`${p.archivo}: ${motivo} — "${texto.match(re)[0].trim()}"`);
  }
}

// 4. Peso de página
for (const p of paginas) {
  const kb = Buffer.byteLength(p.html) / 1024;
  if (kb > 60) fallo(`${p.archivo}: ${kb.toFixed(1)} KB de HTML. Demasiado para 3G.`);
}

if (fallos.length) {
  console.error(`\n✗ ${fallos.length} problema(s):\n`);
  fallos.forEach((f) => console.error('  - ' + f));
  console.error('');
  process.exit(1);
}
console.log(`\n✓ ${paginas.length} páginas revisadas. Metadatos, enlaces, reglas de verificación y peso: todo en orden.\n`);
