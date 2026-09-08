import fs from 'node:fs';
import path from 'node:path';
import { escapeHtml as e } from './md.js';
import { ROOT } from './data.js';

const CSS = fs.readFileSync(path.join(ROOT, 'lib/estilo.css'), 'utf8')
  .replace(/\/\*[\s\S]*?\*\//g, '')
  .replace(/\n{2,}/g, '\n')
  .trim();

const NAV = [
  { href: '/servicios/', texto: 'Servicios' },
  { href: '/como-funciona/', texto: 'Cómo funciona' },
  { href: '/precios/', texto: 'Precios' },
  { href: '/guias/', texto: 'Guías' },
  { href: '/preguntas-frecuentes/', texto: 'Preguntas' },
];
const NAV_EN = [
  { href: '/en/honduras-property-verification/', texto: 'Services' },
  { href: '/en/buy-land-honduras/', texto: 'Buy land' },
  { href: '/en/construction-verification-honduras/', texto: 'Construction' },
];

export function pagina({
  ctx, ruta, titulo, descripcion, contenido,
  schema = null, noindex = false, tituloCompleto = null, idioma = 'es-HN',
}) {
  const { config, dataset } = ctx;
  const base = String(config.url || '').replace(/\/$/, '');
  const canonical = base + ruta;
  const title = tituloCompleto || `${titulo} | ${config.nombre}`;

  const ingles = idioma.startsWith('en');
  const nav = (ingles ? NAV_EN : NAV).map((item) => {
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
<html lang="${e(idioma)}">
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
<meta property="og:image" content="${e(base)}/img/og-verificacion.svg">
<meta property="og:image:alt" content="${ingles ? 'Honduras property verification report' : 'Reporte de verificación de propiedad en Honduras'}">
<meta name="twitter:card" content="summary_large_image">
<meta name="theme-color" content="#003b70">
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
    <a class="marca-sitio" href="${ingles ? '/en/' : '/'}" aria-label="${e(config.nombre)}, ${ingles ? 'home' : 'inicio'}"><span class="marca-sitio__icono" aria-hidden="true">✓</span><span>${e(config.nombre)}</span><small>${ingles ? 'Property verification in Honduras' : 'Verificación de propiedades en Honduras'}</small></a>
    <div class="cabecera__derecha"><a class="idioma" href="${ingles ? '/' : '/en/'}" lang="${ingles ? 'es' : 'en'}">${ingles ? 'Español' : 'English'}</a><a class="cabecera__accion" href="${ingles ? '/en/honduras-property-verification/#start' : '/contacto/'}">${ingles ? 'Verify a property' : 'Verificar una propiedad'}</a></div>
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
    <p>${ingles ? 'Independent property-information verification and on-site documentation in Honduras for buyers abroad.' : 'Verificación independiente de información y documentación en sitio para compradores que viven fuera de Honduras.'}</p>
    <ul>
      <li><a href="${ingles ? '/en/honduras-property-verification/' : '/servicios/'}">${ingles ? 'Property verification' : 'Servicios'}</a></li>
      <li><a href="${ingles ? '/en/buy-land-honduras/' : '/precios/'}">${ingles ? 'Buying land in Honduras' : 'Precios'}</a></li>
      <li><a href="${ingles ? '/en/construction-verification-honduras/' : '/como-funciona/'}">${ingles ? 'Construction verification' : 'Cómo funciona'}</a></li>
      ${ingles ? '' : '<li><a href="/guias/">Guías</a></li><li><a href="/quienes-somos/">Quiénes somos</a></li><li><a href="/contacto/">Contacto</a></li><li><a href="/terminos/">Términos</a></li><li><a href="/privacidad/">Privacidad</a></li>'}
    </ul>
    <div class="pie__legal">
      <p><strong>${ingles ? 'We do not handle purchase funds.' : 'No manejamos el dinero de la compra.'}</strong> ${ingles ? 'We provide property-information verification, documentation, and coordination services. We are not a law firm, title insurer, escrow provider, bank, or money transmitter.' : 'Prestamos servicios de verificación de información, documentación y coordinación. No somos bufete, aseguradora de título, agente de custodia, banco ni transmisor de dinero.'}</p>
      <p>${ingles ? 'Legal opinions and certified measurements are provided only by separately engaged qualified professionals.' : 'Las opiniones legales y mediciones certificadas corresponden únicamente a profesionales calificados contratados por separado.'}</p>
      <p>© ${new Date().getFullYear()} ${e(config.nombre)}</p>
    </div>
  </div>
</footer>
<script src="/js/sitio.js" defer></script>
</body>
</html>`;
}
