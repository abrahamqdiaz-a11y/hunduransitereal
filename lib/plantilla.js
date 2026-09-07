import fs from 'node:fs';
import path from 'node:path';
import { escapeHtml as e } from './md.js';
import { ROOT } from './data.js';

const CSS = fs.readFileSync(path.join(ROOT, 'lib/estilo.css'), 'utf8')
  .replace(/\/\*[\s\S]*?\*\//g, '')
  .replace(/\n{2,}/g, '\n')
  .trim();

const NAV = [
  { href: '/directorio/', texto: 'Directorio' },
  { href: '/propiedades/', texto: 'Propiedades' },
  { href: '/guias/', texto: 'Guías' },
  { href: '/verificacion/', texto: 'Verificación' },
  { href: '/reportar/', texto: 'Reportar' },
];

export function pagina({
  ctx, ruta, titulo, descripcion, contenido,
  schema = null, noindex = false, tituloCompleto = null,
}) {
  const { config, dataset } = ctx;
  const base = String(config.url || '').replace(/\/$/, '');
  const canonical = base + ruta;
  const title = tituloCompleto || `${titulo} | ${config.nombre}`;

  const nav = NAV.map((item) => {
    const activo = ruta === item.href || (item.href !== '/' && ruta.startsWith(item.href));
    return `<li><a href="${item.href}"${activo ? ' aria-current="page"' : ''}>${e(item.texto)}</a></li>`;
  }).join('');

  const jsonLd = schema
    ? `<script type="application/ld+json">${JSON.stringify(schema).replace(/</g, '\\u003c')}</script>`
    : '';

  const analitica = config.analitica?.plausibleDominio
    ? `<script defer data-domain="${e(config.analitica.plausibleDominio)}" src="https://plausible.io/js/script.js"></script>`
    : '';

  return `<!doctype html>
<html lang="es-HN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${e(title)}</title>
<meta name="description" content="${e(descripcion)}">
${noindex ? '<meta name="robots" content="noindex,follow">' : ''}
<link rel="canonical" href="${e(canonical)}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="${e(config.nombre)}">
<meta property="og:locale" content="es_HN">
<meta property="og:title" content="${e(title)}">
<meta property="og:description" content="${e(descripcion)}">
<meta property="og:url" content="${e(canonical)}">
<meta name="theme-color" content="#f5f4f1">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<style>${CSS}</style>
${jsonLd}
${analitica}
</head>
<body>
<a class="saltar" href="#principal">Ir al contenido</a>
${dataset === 'ejemplo' ? '<p class="franja-demo">DATOS DE EJEMPLO — ningún proveedor ni propiedad de este sitio es real.</p>' : ''}
<header class="cabecera">
  <div class="contenedor cabecera__fila">
    <a class="marca-sitio" href="/">${e(config.nombre)}</a>
  </div>
</header>
<nav class="nav" aria-label="Secciones"><ul>${nav}</ul></nav>
<main id="principal">
  <div class="contenedor">
${contenido}
  </div>
</main>
<footer class="pie">
  <div class="contenedor">
    <h2>${e(config.nombre)}</h2>
    <p>Directorio de proveedores y propiedades en Honduras para hondureños que viven fuera.
    Decimos exactamente qué revisamos de cada perfil y qué no revisamos.</p>
    <ul>
      <li><a href="/directorio/">Directorio de proveedores</a></li>
      <li><a href="/propiedades/">Propiedades en venta</a></li>
      <li><a href="/guias/">Guías</a></li>
      <li><a href="/verificacion/">Cómo verificamos</a></li>
      <li><a href="/reportar/">Reportar un anuncio</a></li>
      <li><a href="/registrar/">Aparecer en el directorio</a></li>
      <li><a href="/acerca/">Quiénes somos</a></li>
      <li><a href="/terminos/">Términos de uso</a></li>
      <li><a href="/privacidad/">Privacidad</a></li>
    </ul>
    <div class="pie__legal">
      <p><strong>No somos parte de ningún trato.</strong> No recibimos ni guardamos su dinero,
      no somos intermediarios y no garantizamos el resultado de ninguna negociación.
      Verificar un dato no es recomendar a una persona.</p>
      <p>Antes de firmar o mandar dinero, contrate a un abogado de su confianza y pida un
      estudio de dominio actualizado en el Instituto de la Propiedad.</p>
      <p>© ${new Date().getFullYear()} ${e(config.nombre)}</p>
    </div>
  </div>
</footer>
<script src="/js/sitio.js" defer></script>
</body>
</html>`;
}
