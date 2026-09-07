import fs from 'node:fs';
import path from 'node:path';
import { cargarDatos, ROOT, hoyISO } from './lib/data.js';
import {
  paginaInicio, paginasDirectorio, paginaProveedor,
  paginasPropiedades, paginaPropiedad, paginasGuias,
} from './lib/paginas.js';
import { paginasEstaticas } from './lib/estaticas.js';

const SALIDA = path.join(ROOT, 'dist');
const dataset = process.env.SITE_DATASET === 'ejemplo' ? 'ejemplo' : 'real';
const estricto = process.argv.includes('--estricto') || process.env.SITE_ESTRICTO === '1';

function limpiar(dir) {
  fs.rmSync(dir, { recursive: true, force: true });
  fs.mkdirSync(dir, { recursive: true });
}

function escribir(ruta, contenido) {
  const rel = ruta.endsWith('.html') ? ruta.slice(1) : path.join(ruta.slice(1), 'index.html');
  const destino = path.join(SALIDA, rel);
  fs.mkdirSync(path.dirname(destino), { recursive: true });
  fs.writeFileSync(destino, contenido);
  return rel;
}

function copiarDir(origen, destino) {
  if (!fs.existsSync(origen)) return;
  fs.mkdirSync(destino, { recursive: true });
  for (const entrada of fs.readdirSync(origen, { withFileTypes: true })) {
    const de = path.join(origen, entrada.name);
    const a = path.join(destino, entrada.name);
    if (entrada.isDirectory()) copiarDir(de, a);
    else fs.copyFileSync(de, a);
  }
}

function sitemap(rutas, config) {
  const base = String(config.url).replace(/\/$/, '');
  const hoy = hoyISO();
  const urls = rutas.map((r) => `  <url><loc>${base}${r}</loc><lastmod>${hoy}</lastmod></url>`).join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>\n`;
}

function main() {
  const ctx = cargarDatos({ dataset });
  const { config, errores, proveedores, propiedades, guias } = ctx;

  if (errores.length) {
    console.error('\n✗ Los datos tienen problemas. No se construyó nada:\n');
    for (const e of errores) console.error('  - ' + e);
    console.error('');
    process.exit(1);
  }

  const paginas = [
    paginaInicio(ctx),
    ...paginasDirectorio(ctx),
    ...proveedores.map((p) => paginaProveedor(p, ctx)),
    ...paginasPropiedades(ctx),
    ...propiedades.map((p) => paginaPropiedad(p, ctx)),
    ...paginasGuias(ctx),
    ...paginasEstaticas(ctx),
  ];

  limpiar(SALIDA);
  for (const p of paginas) escribir(p.ruta, p.html);
  copiarDir(path.join(ROOT, 'publico'), SALIDA);

  const rutasIndexables = paginas.map((p) => p.ruta).filter((r) => !r.endsWith('.html'));
  fs.writeFileSync(path.join(SALIDA, 'sitemap.xml'), sitemap(rutasIndexables, config));
  fs.writeFileSync(path.join(SALIDA, 'robots.txt'),
    `User-agent: *\nAllow: /\n\nSitemap: ${String(config.url).replace(/\/$/, '')}/sitemap.xml\n`);
  fs.writeFileSync(path.join(SALIDA, '_headers'), [
    '/*',
    '  X-Content-Type-Options: nosniff',
    '  Referrer-Policy: strict-origin-when-cross-origin',
    '  X-Frame-Options: DENY',
    '',
    '/js/*',
    '  Cache-Control: public, max-age=604800',
    '',
    '/img/*',
    '  Cache-Control: public, max-age=2592000',
    '',
  ].join('\n'));

  // Avisos: cosas que faltan para poder publicar de verdad.
  const avisos = [];
  if (!config.url || config.url.includes('ejemplo-pendiente')) avisos.push('site.config.json: falta la URL real del sitio (afecta canonical, sitemap y schema).');
  if (!config.operador?.razonSocial) avisos.push('site.config.json: falta el bloque "operador". La página /acerca/ sale incompleta a propósito.');
  if (!config.contacto?.whatsapp) avisos.push('site.config.json: falta el WhatsApp del sitio.');
  if (!config.webhooks?.reportes) avisos.push('site.config.json: falta el webhook de reportes. El formulario de reporte no envía nada.');
  if (!config.webhooks?.registroProveedor) avisos.push('site.config.json: falta el webhook de registro de proveedores.');
  for (const g of guias) {
    for (const p of g.pendiente || []) avisos.push(`Guía ${g.archivo}: ${p}`);
  }
  if (dataset === 'ejemplo') avisos.push('Construido con DATOS DE EJEMPLO (SITE_DATASET=ejemplo). No subir esto a producción.');

  const pesos = paginas.map((p) => Buffer.byteLength(p.html));
  const media = Math.round(pesos.reduce((a, b) => a + b, 0) / pesos.length / 1024 * 10) / 10;

  console.log(`\n✓ ${paginas.length} páginas en dist/ (${proveedores.length} proveedores, ${propiedades.length} propiedades, ${guias.length} guías)`);
  console.log(`  Peso medio del HTML: ${media} KB · Página más pesada: ${Math.round(Math.max(...pesos) / 1024 * 10) / 10} KB`);

  if (avisos.length) {
    console.log('\n⚠ Falta contenido real antes de publicar (ver CONTENIDO-PENDIENTE.md):');
    for (const a of avisos) console.log('  - ' + a);
    console.log('');
    if (estricto) {
      console.error('✗ Modo estricto: no se publica con avisos pendientes.');
      process.exit(1);
    }
  }
}

main();
