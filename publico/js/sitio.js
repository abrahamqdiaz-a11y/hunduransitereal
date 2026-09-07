// Mejora progresiva. El sitio funciona completo sin este archivo.
(function () {
  'use strict';

  // 1. Buscador dentro de una lista ya renderizada.
  var buscador = document.querySelector('[data-buscador]');
  if (buscador) {
    var contenedor = document.getElementById(buscador.getAttribute('data-buscador'));
    var campo = buscador.querySelector('input');
    var conteo = document.querySelector('[data-conteo]');
    buscador.hidden = false;
    buscador.addEventListener('submit', function (ev) { ev.preventDefault(); });
    campo.addEventListener('input', function () {
      var q = campo.value.trim().toLowerCase();
      var visibles = 0;
      var items = contenedor.querySelectorAll('[data-texto]');
      for (var i = 0; i < items.length; i++) {
        var coincide = !q || items[i].getAttribute('data-texto').indexOf(q) !== -1;
        items[i].hidden = !coincide;
        if (coincide) visibles++;
      }
      if (conteo) {
        conteo.textContent = visibles === items.length
          ? conteo.getAttribute('data-original')
          : visibles + ' de ' + items.length + ' resultados';
      }
    });
  }

  // 2. Envío de formularios al webhook sin salir de la página.
  var formularios = document.querySelectorAll('form[data-webhook]');
  Array.prototype.forEach.call(formularios, function (form) {
    form.addEventListener('submit', function (ev) {
      if (!form.getAttribute('action')) return; // sin webhook: no interceptamos
      ev.preventDefault();
      var boton = form.querySelector('button[type=submit]');
      var aviso = form.querySelector('[data-aviso]');
      var textoOriginal = boton ? boton.textContent : '';
      if (boton) { boton.disabled = true; boton.textContent = 'Enviando…'; }
      if (aviso) { aviso.hidden = true; }

      fetch(form.getAttribute('action'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams(new FormData(form)).toString()
      }).then(function (r) {
        if (!r.ok) throw new Error('respuesta ' + r.status);
        form.innerHTML = '<div class="callout callout--nota" role="status" tabindex="-1">' +
          '<p class="callout__title">Recibimos su mensaje.</p>' +
          '<p>' + (form.getAttribute('data-gracias') || 'Gracias. Le vamos a responder.') + '</p></div>';
        form.querySelector('[tabindex]').focus();
      }).catch(function () {
        if (boton) { boton.disabled = false; boton.textContent = textoOriginal; }
        if (aviso) {
          aviso.hidden = false;
          aviso.textContent = 'No se pudo enviar. Revise su conexión e intente otra vez. ' +
            'Si sigue fallando, escríbanos por WhatsApp.';
        }
      });
    });
  });

  // 3. Rellenar el formulario de reporte con el anuncio que viene en la URL.
  var params = new URLSearchParams(window.location.search);
  ['ref', 'tipo'].forEach(function (clave) {
    var campo = document.querySelector('[name="' + clave + '"]');
    if (campo && params.get(clave)) campo.value = params.get(clave);
  });
  var titulo = document.querySelector('[data-ref-titulo]');
  if (titulo && params.get('ref')) {
    titulo.textContent = params.get('ref');
    titulo.parentNode.hidden = false;
  }
})();
