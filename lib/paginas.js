import { escapeHtml as e, slugifyHeading, plainText } from './md.js';
import { estadoVerificacion, formatoFecha, formatoPrecio, enlaceWhatsApp, hoyISO } from './data.js';
import * as C from './componentes.js';
import { pagina } from './plantilla.js';
import { formulario, campoTexto, campoTexto2, campoSelect, grupoRadio } from './formularios.js';

const slugDep = (d) => slugifyHeading(d);

function textoBusqueda(...partes) {
  return partes.filter(Boolean).join(' ').toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '');
}

function bloqueBuscador(idLista, etiqueta, total) {
  return `<form class="filtros" data-buscador="${idLista}" hidden>
    <div class="campo">
      <label for="q">${e(etiqueta)}</label>
      <input type="search" id="q" name="q" autocomplete="off" enterkeyhint="search">
    </div>
    <p class="ayuda" data-conteo data-original="${total} resultados">${total} resultados</p>
  </form>`;
}

function navCategorias(categorias, proveedores, activa) {
  const items = categorias.filter((c) => !c.proximamente).map((c) => {
    const n = proveedores.filter((p) => p.categoria === c.slug).length;
    const activo = activa === c.slug;
    return `<li><a href="/directorio/${c.slug}/"${activo ? ' aria-current="page"' : ''}>${e(c.nombre)} (${n})</a></li>`;
  }).join('');
  return `<nav class="tarjeta" aria-label="Categorías"><h2>Categorías</h2><ul>${items}</ul></nav>`;
}

// ---------------------------------------------------------------- INICIO
function paginaInicio(ctx) {
  const { config } = ctx;
  const numero = String(config.contacto?.whatsapp || '').replace(/[^0-9]/g, '');
  // TODO: sustituir PLACEHOLDER_WHATSAPP en site.config.json antes de publicar.
  const enlaceContacto = numero
    ? `https://wa.me/${numero}?text=${encodeURIComponent('Hola, quisiera solicitar una revisión de propiedad antes de comprar.')}`
    : 'https://wa.me/PLACEHOLDER_WHATSAPP';

  const contenido = `
<section class="hero hero--servicio">
  <div class="hero__contenido">
    <p class="hero__sobrelinea">Para hondureños que compran desde el exterior</p>
    <h1>Antes de mandar el dinero, verifica lo que estás comprando.</h1>
    <p>Si vive en Estados Unidos y está comprando un terreno o propiedad en Honduras, revisamos la información, visitamos la propiedad y le entregamos un reporte claro antes de que tome una decisión.</p>
    <a class="boton boton--whatsapp hero__cta" href="${e(enlaceContacto)}" rel="noopener">Solicitar una revisión por WhatsApp</a>
    <p class="hero__confianza">Tarifa fija · Pago único por adelantado · No recibimos el dinero de la compra</p>
  </div>
  <div class="hero__visual hero__visual--informe" aria-label="Representación de un informe de revisión">
    <div class="informe-ilustrado"><p>INFORME DE REVISIÓN</p><span>Registro y gravámenes</span><span>Visita y fotografías</span><span>Lo que no se confirmó</span><strong>Conclusión profesional firmada</strong></div>
  </div>
</section>

<section class="franja-confianza" aria-label="Cómo funciona">
  <div><strong>1. Usted envía los datos</strong><span>La ubicación y los documentos que le dio el vendedor</span></div>
  <div><strong>2. Coordinamos la revisión</strong><span>Abogado colegiado y, para casas, ingeniero colegiado</span></div>
  <div><strong>3. Usted recibe el informe</strong><span>Hallazgos, fuentes, fechas y asuntos pendientes</span></div>
</section>

<section class="seccion-inicio proceso-inicio">
  <p class="sobrelinea">Una revisión independiente de la venta</p>
  <h2>Usted ya encontró la propiedad. Nosotros revisamos la información antes de que decida.</h2>
  <div class="proceso-inicio__pasos">
    <article><span>01</span><h3>Envíe lo que tiene</h3><p>Comparta la ubicación, el contacto del vendedor y cualquier escritura, plano o recibo que le hayan enviado.</p></article>
    <article><span>02</span><h3>Revisamos en Honduras</h3><p>Un abogado colegiado estudia el registro y coordina la visita. En una casa, un ingeniero colegiado también evalúa la estructura, los permisos y los servicios.</p></article>
    <article><span>03</span><h3>Le entregamos el reporte</h3><p>Recibe por escrito lo encontrado, la fuente, la fecha, las fotografías y todo lo que no se pudo confirmar.</p></article>
  </div>
</section>

<section class="seccion-inicio contenido-informe">
  <div class="seccion-cabecera"><div><p class="sobrelinea">El producto que usted recibe</p><h2>Un informe dividido en tres partes claras</h2></div><a href="/que-incluye/">Ver contenido completo →</a></div>
  <div class="contenido-informe__rejilla">
    <article><span class="contenido-informe__numero">1</span><h3>Lo que dice el registro</h3><p>Propietario inscrito, número de finca, cadena de traspasos, hipotecas, embargos, servidumbres y comparación entre el registro y la propiedad ofrecida. Cada dato lleva fuente y fecha.</p></article>
    <article><span class="contenido-informe__numero">2</span><h3>Lo que vimos</h3><p>Fotografías fechadas, ubicación, linderos, ocupación, acceso, situación municipal e identidad del vendedor. Para casas se añaden estructura, permisos, servicios, recibos y cuotas.</p></article>
    <article class="contenido-informe__pendiente"><span class="contenido-informe__numero">3</span><h3>Lo que NO pudimos confirmar</h3><p>Documentos faltantes, diferencias sin resolver, límites ambiguos o posibles herederos. Esta parte nunca se esconde ni se reduce a letra pequeña.</p></article>
  </div>
  <p class="firma-informe"><strong>Al final:</strong> conclusión firmada por el abogado con su número de colegiación; para casas, evaluación técnica firmada por el ingeniero. Nosotros coordinamos y entregamos: no damos asesoría legal ni de ingeniería.</p>
</section>

<section class="seccion-inicio precios-inicio">
  <div><p class="sobrelinea">Dos revisiones, una tarifa fija</p><h2>Elija según el tipo de propiedad</h2><p>El precio se paga una sola vez y por adelantado. No cambia según el valor de la propiedad ni depende de que usted termine comprando.</p></div>
  <div class="precios-inicio__opciones">
    <article><p>Revisión documental</p><strong>$149</strong><span>Revisión remota inicial, sin visita</span></article>
    <article><p>Verificación de terreno</p><strong>$349</strong><span>Documentos, visita, GPS, fotos, video y reporte</span></article>
  </div>
  <p class="politica-precio"><strong>Usted paga por la revisión, no por una respuesta favorable.</strong> No hay devolución porque el informe traiga buenas noticias o porque usted decida no comprar. Nunca recibimos, guardamos ni enviamos el dinero de la compra.</p>
  <a class="boton boton--whatsapp" href="${e(enlaceContacto)}" rel="noopener">Consultar por WhatsApp</a>
</section>

<section class="seccion-inicio limites-inicio">
  <div><p class="sobrelinea">Lo que este servicio no es</p><h2>No vendemos la propiedad y no decidimos por usted.</h2></div>
  <ul><li>No anunciamos propiedades ni representamos al vendedor.</li><li>No declaramos que una compra sea “segura” o “garantizada”.</li><li>No sustituimos al abogado que usted elija para revisar y firmar la compraventa.</li><li>No tocamos el dinero destinado a comprar la propiedad.</li></ul>
</section>
`;

  const schema = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebSite',
        '@id': `${config.url}/#sitio`,
        name: config.nombre,
        url: config.url,
        inLanguage: 'es-HN',
        description: config.descripcion,
      },
      {
        '@type': 'Organization',
        '@id': `${config.url}/#organizacion`,
        name: config.nombre,
        url: config.url,
        description: config.descripcion,
        areaServed: { '@type': 'Country', name: 'Honduras' },
      },
    ],
  };

  return { ruta: '/', html: pagina({ ctx, ruta: '/', titulo: config.nombre, tituloCompleto: config.nombreLargo, descripcion: config.descripcion, contenido, schema }) };
}

// ---------------------------------------------------------------- DIRECTORIO
function listaProveedores(lista, ctx) {
  return lista.map((p) => {
    const cat = ctx.categoriasPorSlug[p.categoria];
    const texto = textoBusqueda(p.nombre, cat && cat.nombre, p.ciudad, p.departamento, p.resumen, (p.servicios || []).join(' '));
    return `<div data-texto="${e(texto)}">${C.tarjetaProveedor(p, ctx)}</div>`;
  }).join('');
}

function paginasDirectorio(ctx) {
  const { config, categorias, proveedores } = ctx;
  const out = [];
  const ordenados = [...proveedores].sort((a, b) => {
    const ea = estadoVerificacion(a, config).clave === 'verificado' ? 0 : 1;
    const eb = estadoVerificacion(b, config).clave === 'verificado' ? 0 : 1;
    return ea - eb || a.nombre.localeCompare(b.nombre, 'es');
  });

  const vacio = C.estadoVacio(
    'Todavía no hay nada publicado aquí',
    'Este directorio se está construyendo. No llenamos las listas con perfiles inventados para que se vea lleno.',
    '<p><a class="boton boton--secundario" href="/registrar/">Aparecer en el directorio</a></p>');

  out.push({
    ruta: '/directorio/',
    html: pagina({
      ctx, ruta: '/directorio/', titulo: 'Directorio de proveedores en Honduras',
      descripcion: 'Constructores, abogados, arquitectos, administradores de propiedades y empresas de envíos en Honduras. Cada perfil dice qué comprobamos y qué no.',
      contenido: `
${C.migas([{ href: '/', texto: 'Inicio' }, { texto: 'Directorio' }])}
<h1>Directorio de proveedores</h1>
<p class="texto">Los perfiles verificados aparecen primero. Los que están sin verificar
van marcados: de esos no hemos comprobado nada.</p>
${navCategorias(categorias, proveedores, null)}
${ordenados.length ? bloqueBuscador('lista', 'Buscar por nombre, ciudad o servicio', ordenados.length) : ''}
<div id="lista">${ordenados.length ? listaProveedores(ordenados, ctx) : vacio}</div>`,
      schema: {
        '@context': 'https://schema.org', '@type': 'CollectionPage',
        name: 'Directorio de proveedores en Honduras', inLanguage: 'es-HN',
        url: `${config.url}/directorio/`,
      },
    }),
  });

  for (const cat of categorias) {
    const lista = ordenados.filter((p) => p.categoria === cat.slug);
    if (cat.proximamente && lista.length === 0) continue;
    const ruta = `/directorio/${cat.slug}/`;
    out.push({
      ruta,
      html: pagina({
        ctx, ruta, titulo: `${cat.nombre} en Honduras`,
        descripcion: `${cat.descripcion} Cada perfil indica qué comprobamos, con qué fuente y en qué fecha.`,
        contenido: `
${C.migas([{ href: '/', texto: 'Inicio' }, { href: '/directorio/', texto: 'Directorio' }, { texto: cat.nombre }])}
<h1>${e(cat.nombre)} en Honduras</h1>
<p class="texto">${e(cat.descripcion)}</p>
${cat.advertencia ? `<aside class="callout callout--aviso"><p>${e(cat.advertencia)}</p></aside>` : ''}
<p class="texto">En esta categoría comprobamos: ${cat.queRevisamos.map((t) => e(ctx.comprobaciones[t].nombre.toLowerCase())).join(', ')}.
<a href="/verificacion/">Qué significa cada una</a>.</p>
${lista.length ? bloqueBuscador('lista', 'Buscar por nombre o ciudad', lista.length) : ''}
<div id="lista">${lista.length ? listaProveedores(lista, ctx) : vacio}</div>
${navCategorias(categorias, proveedores, cat.slug)}`,
        schema: {
          '@context': 'https://schema.org', '@type': 'CollectionPage',
          name: `${cat.nombre} en Honduras`, inLanguage: 'es-HN', url: config.url + ruta,
          breadcrumb: breadcrumb(config, [['Inicio', '/'], ['Directorio', '/directorio/'], [cat.nombre, ruta]]),
        },
      }),
    });

    // Páginas por departamento sólo donde de verdad hay proveedores.
    const departamentos = [...new Set(lista.map((p) => p.departamento))];
    for (const dep of departamentos) {
      const sub = lista.filter((p) => p.departamento === dep);
      const rutaDep = `/directorio/${cat.slug}/${slugDep(dep)}/`;
      out.push({
        ruta: rutaDep,
        html: pagina({
          ctx, ruta: rutaDep, titulo: `${cat.nombre} en ${dep}`,
          descripcion: `${cat.nombre} en el departamento de ${dep}, Honduras. Cada perfil indica qué comprobamos y en qué fecha.`,
          contenido: `
${C.migas([{ href: '/', texto: 'Inicio' }, { href: '/directorio/', texto: 'Directorio' }, { href: `/directorio/${cat.slug}/`, texto: cat.nombre }, { texto: dep }])}
<h1>${e(cat.nombre)} en ${e(dep)}</h1>
<div id="lista">${listaProveedores(sub, ctx)}</div>
<p><a href="/directorio/${cat.slug}/">Ver ${e(cat.nombre.toLowerCase())} en todo el país →</a></p>`,
          schema: {
            '@context': 'https://schema.org', '@type': 'CollectionPage',
            name: `${cat.nombre} en ${dep}`, inLanguage: 'es-HN', url: config.url + rutaDep,
          },
        }),
      });
    }
  }
  return out;
}

function breadcrumb(config, items) {
  return {
    '@type': 'BreadcrumbList',
    itemListElement: items.map(([name, url], i) => ({
      '@type': 'ListItem', position: i + 1, name, item: config.url + url,
    })),
  };
}

// ---------------------------------------------------------------- PERFIL
function paginaProveedor(p, ctx) {
  const { config, categoriasPorSlug } = ctx;
  const cat = categoriasPorSlug[p.categoria] || { nombre: p.categoria, slug: p.categoria };
  const estado = estadoVerificacion(p, config);
  const ruta = `/proveedor/${p.slug}/`;
  const mensaje = `Hola, encontré su perfil en ${config.nombre} (${config.url}${ruta}) y quisiera consultarle sobre sus servicios.`;

  const datos = [
    ['Categoría', `<a href="/directorio/${e(cat.slug)}/">${e(cat.nombre)}</a>`],
    ['Ubicación', e([p.ciudad, p.departamento].filter(Boolean).join(', '))],
    p.direccion ? ['Dirección', e(p.direccion)] : null,
    p.cobertura?.length ? ['Trabaja en', e(p.cobertura.join(', '))] : null,
    p.sitioWeb ? ['Sitio web', `<a href="${e(p.sitioWeb)}" rel="nofollow noopener" target="_blank">${e(p.sitioWeb.replace(/^https?:\/\//, ''))}</a>`] : null,
    p.telefono ? ['Teléfono', e(p.telefono)] : null,
    p.enListaDesde ? ['En el directorio desde', e(formatoFecha(p.enListaDesde))] : null,
  ].filter(Boolean);

  const contenido = `
${C.migas([{ href: '/', texto: 'Inicio' }, { href: '/directorio/', texto: 'Directorio' }, { href: `/directorio/${cat.slug}/`, texto: cat.nombre }, { texto: p.nombre }])}
<h1>${e(p.nombre)}</h1>
${C.cabeceraEstado(p, estado)}
${estado.clave === 'no_verificado' ? C.avisoSinVerificar('proveedor') : ''}
${estado.clave === 'vencido' ? C.avisoVencido(estado.vence) : ''}
${p.resumen ? `<p class="texto"><strong>${e(p.resumen)}</strong></p>` : ''}
${p.descripcion ? `<div class="texto"><p>${e(p.descripcion)}</p></div>` : ''}
${C.galeria(p.fotos, `Fotografías de ${p.nombre}`)}

<table class="datos"><caption class="oculto-visual">Datos del proveedor</caption><tbody>
${datos.map(([k, v]) => `<tr><th scope="row">${e(k)}</th><td>${v}</td></tr>`).join('')}
</tbody></table>

${p.servicios?.length ? `<h2>Servicios que ofrece</h2>
<p class="ayuda">Esta lista la da el proveedor. No comprobamos que haga bien cada uno de estos trabajos.</p>
<ul>${p.servicios.map((s) => `<li>${e(s)}</li>`).join('')}</ul>` : ''}

${C.fichaVerificacion(p, { ...ctx, tipo: 'proveedor' })}

<h2>Contactar</h2>
${p.whatsapp ? C.botonWhatsApp(p.whatsapp, mensaje) : '<p>Este perfil no tiene un número de contacto publicado.</p>'}
<p class="ayuda" style="margin-top:.75rem">Cuando escriba, diga que lo vio aquí. Y no mande
dinero por adelantado sin contrato, por muy bien que le hablen.</p>

<h2>¿Algo no cuadra?</h2>
<p class="texto">Si este proveedor ya no existe, los datos están mal, o le hicieron algo,
díganos. Leemos todos los reportes y no publicamos su nombre.</p>
${C.botonReportar(p.slug, 'proveedor')}
`;

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: p.nombre,
    description: p.resumen || p.descripcion || '',
    url: config.url + ruta,
    address: {
      '@type': 'PostalAddress',
      addressLocality: p.ciudad || undefined,
      addressRegion: p.departamento || undefined,
      addressCountry: 'HN',
      streetAddress: p.direccion || undefined,
    },
    areaServed: (p.cobertura || [p.departamento]).filter(Boolean).map((d) => ({ '@type': 'AdministrativeArea', name: d })),
    telephone: p.whatsapp ? `+${String(p.whatsapp).replace(/[^0-9]/g, '')}` : undefined,
    knowsLanguage: 'es',
    breadcrumb: breadcrumb(config, [['Inicio', '/'], ['Directorio', '/directorio/'], [cat.nombre, `/directorio/${cat.slug}/`], [p.nombre, ruta]]),
  };

  return {
    ruta,
    html: pagina({
      ctx, ruta, titulo: `${p.nombre} — ${cat.nombre} en ${p.ciudad || p.departamento}`,
      descripcion: estado.clave === 'verificado'
        ? `${p.nombre}, ${cat.nombre.toLowerCase()} en ${p.ciudad || p.departamento}. Verificado el ${formatoFecha(p.verificacion.fecha)}: vea exactamente qué comprobamos y qué no.`
        : `${p.nombre}, ${cat.nombre.toLowerCase()} en ${p.ciudad || p.departamento}. Anuncio sin verificar: no hemos comprobado nada sobre este proveedor.`,
      contenido, schema,
    }),
  };
}

// ---------------------------------------------------------------- PROPIEDADES
function listaPropiedades(lista, ctx) {
  return lista.map((inm) => {
    const texto = textoBusqueda(inm.titulo, inm.ciudad, inm.departamento, inm.sector, inm.tipo, inm.descripcion);
    return `<div data-texto="${e(texto)}">${C.tarjetaPropiedad(inm, ctx)}</div>`;
  }).join('');
}

function paginasPropiedades(ctx) {
  const { config, propiedades } = ctx;
  const out = [];
  const ordenadas = [...propiedades].sort((a, b) => {
    const ea = estadoVerificacion(a, config).clave === 'verificado' ? 0 : 1;
    const eb = estadoVerificacion(b, config).clave === 'verificado' ? 0 : 1;
    return ea - eb || String(b.publicado || '').localeCompare(String(a.publicado || ''));
  });

  out.push({
    ruta: '/propiedades/',
    html: pagina({
      ctx, ruta: '/propiedades/', titulo: 'Casas, lotes y proyectos en venta en Honduras',
      descripcion: 'Propiedades en venta en Honduras. En los anuncios verificados decimos qué consultamos en el Instituto de la Propiedad y en qué fecha.',
      contenido: `
${C.migas([{ href: '/', texto: 'Inicio' }, { texto: 'Propiedades' }])}
<h1>Propiedades en venta</h1>
<p class="texto">En los anuncios verificados consultamos la situación registral en el
Instituto de la Propiedad y lo decimos con fecha. Eso <strong>no sustituye</strong> su
propio estudio de dominio antes de comprar.</p>
<p class="texto"><a href="/guias/verificar-escritura-instituto-propiedad/">Cómo comprobar una escritura →</a></p>
${ordenadas.length ? bloqueBuscador('lista', 'Buscar por ciudad, sector o tipo', ordenadas.length) : ''}
<div id="lista">${ordenadas.length ? listaPropiedades(ordenadas, ctx) : C.estadoVacio(
        'Todavía no hay propiedades publicadas',
        'Cuando publiquemos una, va a decir exactamente qué se consultó en el registro y en qué fecha.',
        '<p><a class="boton boton--secundario" href="/registrar/">Publicar una propiedad</a></p>')}</div>`,
      schema: {
        '@context': 'https://schema.org', '@type': 'CollectionPage',
        name: 'Propiedades en venta en Honduras', inLanguage: 'es-HN', url: `${config.url}/propiedades/`,
      },
    }),
  });

  for (const dep of [...new Set(ordenadas.map((p) => p.departamento))]) {
    const sub = ordenadas.filter((p) => p.departamento === dep);
    const ruta = `/propiedades/${slugDep(dep)}/`;
    out.push({
      ruta,
      html: pagina({
        ctx, ruta, titulo: `Propiedades en venta en ${dep}`,
        descripcion: `Casas, lotes y proyectos en venta en ${dep}, Honduras, con el detalle de qué se comprobó en cada anuncio.`,
        contenido: `
${C.migas([{ href: '/', texto: 'Inicio' }, { href: '/propiedades/', texto: 'Propiedades' }, { texto: dep }])}
<h1>Propiedades en venta en ${e(dep)}</h1>
<div id="lista">${listaPropiedades(sub, ctx)}</div>
<p><a href="/propiedades/">Ver propiedades en todo el país →</a></p>`,
      }),
    });
  }
  return out;
}

function paginaPropiedad(inm, ctx) {
  const { config } = ctx;
  const estado = estadoVerificacion(inm, config);
  const ruta = `/propiedad/${inm.slug}/`;
  const precio = formatoPrecio(inm.precio);
  const mensaje = `Hola, me interesa el anuncio "${inm.titulo}" que vi en ${config.nombre} (${config.url}${ruta}).`;
  const tipoTexto = { casa: 'Casa', lote: 'Lote', proyecto: 'Proyecto en construcción' }[inm.tipo] || inm.tipo;

  const datos = [
    ['Tipo', e(tipoTexto)],
    ['Precio', precio ? e(precio) : 'No publicado'],
    ['Ubicación', e([inm.sector, inm.ciudad, inm.departamento].filter(Boolean).join(', '))],
    inm.areaTerrenoV2 ? ['Terreno', `${e(inm.areaTerrenoV2)} v²`] : null,
    inm.areaConstruccionM2 ? ['Construcción', `${e(inm.areaConstruccionM2)} m²`] : null,
    inm.habitaciones ? ['Habitaciones', e(inm.habitaciones)] : null,
    inm.banos ? ['Baños', e(inm.banos)] : null,
    inm.publicado ? ['Publicado', e(formatoFecha(inm.publicado))] : null,
  ].filter(Boolean);

  const vendedor = inm.vendedor || {};
  const enlaceVendedor = vendedor.proveedor
    ? `<a href="/proveedor/${e(vendedor.proveedor)}/">${e(vendedor.nombre || vendedor.proveedor)}</a>`
    : `${e(vendedor.nombre || 'No indicado')} <span class="ayuda">(vendedor particular, sin perfil verificado)</span>`;

  const contenido = `
${C.migas([{ href: '/', texto: 'Inicio' }, { href: '/propiedades/', texto: 'Propiedades' }, { texto: inm.titulo }])}
<h1>${e(inm.titulo)}</h1>
${C.cabeceraEstado(inm, estado)}
${estado.clave === 'no_verificado' ? C.avisoSinVerificar('propiedad') : ''}
${estado.clave === 'vencido' ? C.avisoVencido(estado.vence) : ''}
${precio ? `<p class="resultado__precio" style="font-size:1.4rem">${e(precio)}</p>` : ''}
${C.galeria(inm.fotos, inm.titulo)}
<table class="datos"><caption class="oculto-visual">Datos de la propiedad</caption><tbody>
${datos.map(([k, v]) => `<tr><th scope="row">${e(k)}</th><td>${v}</td></tr>`).join('')}
<tr><th scope="row">Vendedor</th><td>${enlaceVendedor}</td></tr>
</tbody></table>
${inm.descripcion ? `<div class="texto"><h2>Descripción</h2><p>${e(inm.descripcion)}</p>
<p class="ayuda">La descripción la escribió el vendedor.</p></div>` : ''}
${inm.caracteristicas?.length ? `<h2>Características</h2><ul>${inm.caracteristicas.map((c) => `<li>${e(c)}</li>`).join('')}</ul>` : ''}

${C.fichaVerificacion(inm, { ...ctx, tipo: 'propiedad' })}

<aside class="callout callout--aviso">
  <p class="callout__title">Antes de mandar dinero</p>
  <p>Contrate a su propio abogado y pida un estudio de dominio y una certificación de
  gravámenes recientes. Nuestra consulta es de una fecha; la situación de un inmueble
  puede cambiar al día siguiente.</p>
  <p><a href="/guias/comprar-propiedad-desde-estados-unidos/">Los pasos para comprar desde Estados Unidos →</a></p>
</aside>

<h2>Contactar al vendedor</h2>
${vendedor.whatsapp ? C.botonWhatsApp(vendedor.whatsapp, mensaje) : '<p>Este anuncio no tiene número de contacto publicado.</p>'}

<h2>¿Algo no cuadra?</h2>
<p class="texto">Si esta propiedad ya se vendió, no existe, o el que la ofrece no es el
dueño, díganos. No publicamos su nombre.</p>
${C.botonReportar(inm.slug, 'propiedad')}
`;

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'RealEstateListing',
    name: inm.titulo,
    url: config.url + ruta,
    datePosted: inm.publicado || undefined,
    inLanguage: 'es-HN',
    description: plainText(inm.descripcion || '', 300),
    about: {
      '@type': inm.tipo === 'casa' ? 'SingleFamilyResidence' : 'Place',
      name: inm.titulo,
      address: {
        '@type': 'PostalAddress',
        addressLocality: inm.ciudad || undefined,
        addressRegion: inm.departamento || undefined,
        addressCountry: 'HN',
      },
      numberOfRooms: inm.habitaciones || undefined,
      floorSize: inm.areaConstruccionM2
        ? { '@type': 'QuantitativeValue', value: inm.areaConstruccionM2, unitCode: 'MTK' } : undefined,
    },
    offers: inm.precio ? {
      '@type': 'Offer',
      price: inm.precio.monto,
      priceCurrency: inm.precio.moneda,
      availability: 'https://schema.org/InStock',
    } : undefined,
    breadcrumb: breadcrumb(config, [['Inicio', '/'], ['Propiedades', '/propiedades/'], [inm.titulo, ruta]]),
  };

  return {
    ruta,
    html: pagina({
      ctx, ruta, titulo: inm.titulo,
      descripcion: estado.clave === 'verificado'
        ? `${tipoTexto} en ${inm.ciudad || inm.departamento}${precio ? ', ' + precio : ''}. Revisión registral del ${formatoFecha(inm.verificacion.fecha)}: vea qué comprobamos y qué no.`
        : `${tipoTexto} en ${inm.ciudad || inm.departamento}${precio ? ', ' + precio : ''}. Anuncio sin verificar: no hemos comprobado nada sobre esta propiedad.`,
      contenido, schema,
    }),
  };
}

// ---------------------------------------------------------------- GUÍAS
function paginasGuias(ctx) {
  const { config, guias } = ctx;
  const out = [];
  out.push({
    ruta: '/guias/',
    html: pagina({
      ctx, ruta: '/guias/', titulo: 'Guías para comprar, construir y contratar en Honduras',
      descripcion: 'Cómo comprobar una escritura, cómo contratar un constructor a distancia, qué estafas se repiten y cómo comprar propiedad en Honduras desde Estados Unidos.',
      contenido: `
${C.migas([{ href: '/', texto: 'Inicio' }, { texto: 'Guías' }])}
<h1>Guías</h1>
<p class="texto">Lo que conviene saber antes de mandar dinero, firmar o empezar una obra.
Escrito para quien está lejos y no puede ir a ver.</p>
${guias.map((g) => `<article class="resultado">
  <h2><a href="/guias/${e(g.slug)}/">${e(g.titulo)}</a></h2>
  <p>${e(g.resumen)}</p>
  ${g.actualizada ? `<p class="resultado__meta">Actualizada el ${e(formatoFecha(g.actualizada))}</p>` : ''}
</article>`).join('')}`,
    }),
  });

  for (const g of guias) {
    const ruta = `/guias/${g.slug}/`;
    const indice = g.indice.length > 2
      ? `<nav class="indice" aria-label="Contenido de la guía"><h2>En esta guía</h2>
         <ol>${g.indice.map((h) => `<li><a href="#${e(h.id)}">${e(h.texto)}</a></li>`).join('')}</ol></nav>`
      : '';
    out.push({
      ruta,
      html: pagina({
        ctx, ruta, titulo: g.titulo, descripcion: g.descripcion,
        contenido: `
${C.migas([{ href: '/', texto: 'Inicio' }, { href: '/guias/', texto: 'Guías' }, { texto: g.titulo }])}
<article class="texto">
  <h1>${e(g.titulo)}</h1>
  ${g.actualizada ? `<p class="ayuda">Actualizada el ${e(formatoFecha(g.actualizada))}</p>` : ''}
  ${indice}
  ${g.html}
</article>
<hr>
<p class="texto"><a href="/directorio/">Ver el directorio de proveedores →</a></p>`,
        schema: {
          '@context': 'https://schema.org', '@type': 'Article',
          headline: g.titulo, description: g.descripcion, inLanguage: 'es-HN',
          datePublished: g.actualizada || undefined, dateModified: g.actualizada || undefined,
          author: { '@type': 'Organization', name: config.nombre },
          publisher: { '@type': 'Organization', name: config.nombre },
          mainEntityOfPage: config.url + ruta,
          breadcrumb: breadcrumb(config, [['Inicio', '/'], ['Guías', '/guias/'], [g.titulo, ruta]]),
        },
      }),
    });
  }
  return out;
}

export {
  paginaInicio, paginasDirectorio, paginaProveedor, paginasPropiedades,
  paginaPropiedad, paginasGuias, breadcrumb, slugDep,
};
