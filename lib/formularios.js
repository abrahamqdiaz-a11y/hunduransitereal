import { escapeHtml as e } from './md.js';

// Aviso honesto cuando el webhook todavía no está configurado.
function sinWebhook(nombre) {
  return `<div class="aviso-sin-verificar" role="alert">
    <p><strong>Este formulario todavía no está conectado.</strong></p>
    <p>Falta configurar el webhook <code>${e(nombre)}</code> en <code>site.config.json</code>.
    Mientras tanto no se envía nada: preferimos decirlo a fingir que su mensaje llegó.</p>
  </div>`;
}

export function campoTexto({ nombre, etiqueta, tipo = 'text', requerido = false, ayuda = '', valor = '', autocomplete }) {
  const id = `campo-${nombre}`;
  return `<div class="campo">
    <label for="${id}">${e(etiqueta)}${requerido ? '' : ' <span class="ayuda">(opcional)</span>'}</label>
    <input type="${tipo}" id="${id}" name="${e(nombre)}" value="${e(valor)}"${requerido ? ' required' : ''}${autocomplete ? ` autocomplete="${e(autocomplete)}"` : ''}>
    ${ayuda ? `<p class="ayuda">${e(ayuda)}</p>` : ''}
  </div>`;
}

export function campoTexto2({ nombre, etiqueta, requerido = false, ayuda = '' }) {
  const id = `campo-${nombre}`;
  return `<div class="campo">
    <label for="${id}">${e(etiqueta)}${requerido ? '' : ' <span class="ayuda">(opcional)</span>'}</label>
    <textarea id="${id}" name="${e(nombre)}"${requerido ? ' required' : ''}></textarea>
    ${ayuda ? `<p class="ayuda">${e(ayuda)}</p>` : ''}
  </div>`;
}

export function campoSelect({ nombre, etiqueta, opciones, requerido = false, ayuda = '' }) {
  const id = `campo-${nombre}`;
  return `<div class="campo">
    <label for="${id}">${e(etiqueta)}${requerido ? '' : ' <span class="ayuda">(opcional)</span>'}</label>
    <select id="${id}" name="${e(nombre)}"${requerido ? ' required' : ''}>
      <option value="">Elija una opción</option>
      ${opciones.map((o) => `<option value="${e(o.valor)}">${e(o.texto)}</option>`).join('')}
    </select>
    ${ayuda ? `<p class="ayuda">${e(ayuda)}</p>` : ''}
  </div>`;
}

export function grupoRadio({ nombre, leyenda, opciones, requerido = false }) {
  return `<fieldset>
    <legend>${e(leyenda)}</legend>
    ${opciones.map((o, i) => {
      const id = `${nombre}-${i}`;
      return `<div class="opcion">
        <input type="radio" id="${id}" name="${e(nombre)}" value="${e(o.valor)}"${requerido && i === 0 ? ' required' : ''}>
        <label for="${id}">${e(o.texto)}</label>
      </div>`;
    }).join('')}
  </fieldset>`;
}

export function formulario({ accion, nombreWebhook, gracias, campos, boton, origen }) {
  if (!accion) return sinWebhook(nombreWebhook);
  return `<form method="post" action="${e(accion)}" data-webhook data-gracias="${e(gracias)}">
    <input type="hidden" name="origen" value="${e(origen)}">
    <input type="hidden" name="enviado_en" value="">
    <div class="oculto-visual" aria-hidden="true">
      <label for="campo-sitio-web">No llene este campo</label>
      <input type="text" id="campo-sitio-web" name="sitio_web_confirmacion" tabindex="-1" autocomplete="off">
    </div>
    ${campos}
    <p class="ayuda" data-aviso hidden role="alert"></p>
    <button type="submit" class="boton">${e(boton)}</button>
    <noscript><p class="ayuda">Al enviar sin JavaScript se abrirá una página de confirmación del servicio que recibe el formulario.</p></noscript>
  </form>`;
}
