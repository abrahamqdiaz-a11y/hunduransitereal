import { escapeHtml as e } from './md.js';
import { formatoFecha, formatoPrecio, enlaceWhatsApp, estadoVerificacion } from './data.js';

export const ICONO = { verificado: '✓', vencido: '!', no_verificado: '!' };

export function marca(clave, etiqueta) {
  return `<span class="marca marca--${clave}"><span class="marca__icono" aria-hidden="true">${ICONO[clave]}</span>${e(etiqueta)}</span>`;
}

// Encabezado de estado en un perfil. Si no está verificado, el aviso grande ya
// trae la marca, así que aquí no se repite.
export function cabeceraEstado(entidad, estado) {
  if (estado.clave !== 'verificado') return '';
  return `<p>${marca('verificado', 'Verificado')}</p>
  <p class="ayuda estado-fecha">Revisado el <strong>${e(formatoFecha(entidad.verificacion.fecha))}</strong>${
    estado.vence ? ` · vence el ${e(formatoFecha(estado.vence))}` : ''
  } · <a href="#verificacion">vea qué comprobamos y qué no</a></p>`;
}

export function migas(items) {
  const partes = items.map((it, i) =>
    i === items.length - 1
      ? `<span aria-current="page">${e(it.texto)}</span>`
      : `<a href="${it.href}">${e(it.texto)}</a>`
  );
  return `<nav class="migas" aria-label="Ruta">${partes.join('<span aria-hidden="true">›</span>')}</nav>`;
}

export function sinFoto(texto = 'Este anuncio todavía no tiene fotos.') {
  return `<p class="sin-foto">${e(texto)}</p>`;
}

export function galeria(fotos, alt) {
  if (!fotos || fotos.length === 0) return sinFoto();
  return `<div class="galeria">${fotos.map((f, i) => {
    const src = typeof f === 'string' ? f : f.src;
    const texto = (typeof f === 'object' && f.alt) || alt;
    return `<img src="${e(src)}" alt="${e(texto)}" loading="${i === 0 ? 'eager' : 'lazy'}" decoding="async" width="800" height="600">`;
  }).join('')}</div>`;
}

export function botonWhatsApp(numero, mensaje, etiqueta = 'Escribir por WhatsApp') {
  const href = enlaceWhatsApp(numero, mensaje);
  if (!href) return '';
  return `<a class="boton boton--whatsapp" href="${e(href)}" rel="noopener">${e(etiqueta)}</a>`;
}

export function botonReportar(refSlug, tipo) {
  const q = `?tipo=${encodeURIComponent(tipo)}&ref=${encodeURIComponent(refSlug)}`;
  return `<a class="boton boton--alerta" href="/reportar/${q}">Reportar este anuncio</a>`;
}

// Bloque grande e inconfundible para lo que no está verificado.
export function avisoSinVerificar(tipo) {
  const que = tipo === 'propiedad' ? 'Este anuncio' : 'Este proveedor';
  return `<div class="aviso-sin-verificar">
  <p>${marca('no_verificado', 'Sin verificar')}</p>
  <p><strong>${e(que)} no ha sido verificado por nosotros.</strong> No hemos comprobado
  nada: ni que el negocio exista legalmente, ni que la dirección sea real, ni quién está
  detrás del número de teléfono.</p>
  <p>La información de abajo la escribió quien publicó el anuncio, no nosotros.
  Trátela igual que un anuncio de Facebook: puede ser cierta o puede no serlo.</p>
  <p><a href="/verificacion/">Qué significa verificado y qué no</a></p>
</div>`;
}

export function avisoVencido(fechaVence) {
  return `<div class="aviso-sin-verificar">
  <p>${marca('vencido', 'Verificación vencida')}</p>
  <p><strong>La verificación de este perfil venció el ${e(formatoFecha(fechaVence))}.</strong>
  Lo que aparece abajo fue cierto el día que lo revisamos, pero ya pasó demasiado tiempo
  y no lo hemos vuelto a comprobar. Una empresa puede cerrar, cambiar de dueño o perder
  su colegiación en ese tiempo.</p>
</div>`;
}

// La ficha de verificación: qué se revisó, qué no, cuándo y con qué fuente.
export function fichaVerificacion(entidad, contexto) {
  const { comprobaciones, config, tipo } = contexto;
  const estado = estadoVerificacion(entidad, config);
  const v = entidad.verificacion;

  if (estado.clave === 'no_verificado' || !v) {
    return `<section class="ficha ficha--no_verificado" id="verificacion">
      <h2>Qué hemos comprobado</h2>
      <p><strong>Nada.</strong> Este ${tipo === 'propiedad' ? 'anuncio' : 'proveedor'} está
      publicado sin verificar. No hemos revisado documentos, ni registros, ni la dirección.</p>
      <p><a href="/verificacion/">Cómo funciona la verificación</a></p>
    </section>`;
  }

  const filas = (v.comprobaciones || []).map((c) => {
    const def = comprobaciones[c.tipo] || { nombre: c.tipo, significa: '', noSignifica: '' };
    const simbolo = { confirmado: '✓', no_confirmado: '✗', no_aplica: '—', pendiente: '…' }[c.estado] || '—';
    const leyenda = {
      confirmado: 'Comprobado', no_confirmado: 'No se pudo comprobar',
      no_aplica: 'No aplica', pendiente: 'Pendiente',
    }[c.estado] || c.estado;
    return `<li class="comprobacion comprobacion--${e(c.estado)}">
      <p class="comprobacion__cabeza">
        <span class="comprobacion__estado" aria-hidden="true">${simbolo}</span>
        <span class="comprobacion__nombre">${e(def.nombre)} <span class="oculto-visual">— ${e(leyenda)}</span></span>
      </p>
      ${c.detalle ? `<p class="comprobacion__detalle">${e(c.detalle)}</p>` : ''}
      ${c.fuente ? `<p class="comprobacion__fuente">Fuente: ${e(c.fuente)}</p>` : ''}
      ${def.significa ? `<p class="comprobacion__fuente">${e(def.significa)}</p>` : ''}
    </li>`;
  }).join('');

  const noRevisado = (v.noRevisado || []).map((t) => `<li>${e(t)}</li>`).join('');

  return `<section class="ficha ficha--${estado.clave}" id="verificacion">
    <h2>Qué comprobamos y qué no</h2>
    <p>Revisado el <strong>${e(formatoFecha(v.fecha))}</strong> por ${e(v.revisadoPor)}.
    ${estado.vence ? `Esta verificación vence el ${e(formatoFecha(estado.vence))}.` : ''}</p>
    <ul class="comprobaciones">${filas}</ul>
    ${noRevisado ? `<div class="no-revisado">
      <h3>Lo que NO revisamos</h3>
      <ul>${noRevisado}</ul>
      <p class="ayuda">No garantizamos el resultado de ningún trato. Lo único que decimos es
      que revisamos las cosas de arriba, en la fecha de arriba.</p>
    </div>` : ''}
  </section>`;
}

export function tarjetaProveedor(p, ctx) {
  const estado = estadoVerificacion(p, ctx.config);
  const categoria = ctx.categoriasPorSlug[p.categoria];
  return `<article class="resultado resultado--${estado.clave}">
    <h3><a href="/proveedor/${e(p.slug)}/">${e(p.nombre)}</a></h3>
    <p>${marca(estado.clave, estado.etiqueta)}</p>
    <p class="resultado__meta">${e(categoria ? categoria.nombre : p.categoria)} · ${e(p.ciudad || '')}${p.ciudad ? ', ' : ''}${e(p.departamento || '')}</p>
    ${p.resumen ? `<p>${e(p.resumen)}</p>` : ''}
    <p class="resultado__pie"><a href="/proveedor/${e(p.slug)}/">Ver qué comprobamos →</a></p>
  </article>`;
}

export function tarjetaPropiedad(inm, ctx) {
  const estado = estadoVerificacion(inm, ctx.config);
  const precio = formatoPrecio(inm.precio);
  const detalles = [];
  if (inm.habitaciones) detalles.push(`${inm.habitaciones} hab.`);
  if (inm.banos) detalles.push(`${inm.banos} baños`);
  if (inm.areaConstruccionM2) detalles.push(`${inm.areaConstruccionM2} m² construidos`);
  if (inm.areaTerrenoV2) detalles.push(`${inm.areaTerrenoV2} v² de terreno`);
  const foto = inm.fotos?.[0];
  const src = foto && (typeof foto === 'string' ? foto : foto.src);
  return `<article class="resultado propiedad-card resultado--${estado.clave}">
    <a class="propiedad-card__foto" href="/propiedad/${e(inm.slug)}/" aria-label="Ver ${e(inm.titulo)}">
      ${src ? `<img src="${e(src)}" alt="${e(inm.titulo)}" loading="lazy" width="800" height="520">` : '<span class="propiedad-card__sin-foto"><span aria-hidden="true">⌂</span> Fotos próximamente</span>'}
      <span class="propiedad-card__estado">${marca(estado.clave, estado.etiqueta)}</span>
    </a>
    <div class="propiedad-card__cuerpo">
      ${precio ? `<p class="resultado__precio">${e(precio)}</p>` : '<p class="resultado__meta">Precio a consultar</p>'}
      <h3><a href="/propiedad/${e(inm.slug)}/">${e(inm.titulo)}</a></h3>
      <p class="resultado__meta propiedad-card__ubicacion">${e(inm.sector ? inm.sector + ', ' : '')}${e(inm.ciudad || '')}, ${e(inm.departamento || '')}</p>
      ${detalles.length ? `<p class="propiedad-card__datos">${e(detalles.join(' · '))}</p>` : ''}
    </div>
  </article>`;
}

export function estadoVacio(titulo, cuerpo, accion) {
  return `<div class="estado-vacio">
    <h2>${e(titulo)}</h2>
    <p>${cuerpo}</p>
    ${accion || ''}
  </div>`;
}
