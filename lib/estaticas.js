import { escapeHtml as e } from './md.js';
import { estadoVerificacion, formatoFecha } from './data.js';
import * as C from './componentes.js';
import { pagina } from './plantilla.js';
import { formulario, campoTexto, campoTexto2, campoSelect, grupoRadio } from './formularios.js';

// ------------------------------------------------------- CÓMO VERIFICAMOS
function paginaVerificacion(ctx) {
  const { config, comprobaciones, categorias, proveedores } = ctx;
  const meses = config.verificacion?.vigenciaMeses ?? 12;
  const verificados = proveedores.filter((p) => estadoVerificacion(p, config).clave === 'verificado').length;

  const listaChecks = Object.entries(comprobaciones)
    .filter(([k]) => !k.startsWith('_'))
    .map(([, def]) => `<li>
      <p class="comprobacion__nombre">${e(def.nombre)}</p>
      <p>${e(def.significa)}</p>
      <p class="ayuda"><strong>Lo que no significa:</strong> ${e(def.noSignifica)}</p>
      ${def.fuenteTipica ? `<p class="ayuda">Dónde lo comprobamos: ${e(def.fuenteTipica)}</p>` : ''}
    </li>`).join('');

  const porCategoria = categorias.filter((c) => !c.proximamente).map((c) => `<tr>
    <th scope="row">${e(c.nombre)}</th>
    <td>${c.queRevisamos.map((t) => e(comprobaciones[t].nombre)).join('<br>')}</td>
  </tr>`).join('');

  const contenido = `
${C.migas([{ href: '/', texto: 'Inicio' }, { texto: 'Cómo verificamos' }])}
<div class="texto">
<h1>Cómo verificamos, y qué no verificamos</h1>
<p>Esta página es la parte más importante del sitio. Si algo de lo que dice aquí no se
cumple en un perfil, ese perfil está mal y queremos que nos lo digan.</p>

<h2>Sólo hay dos estados</h2>
</div>
<div class="rejilla" style="margin-bottom:1.5rem">
  <div class="tarjeta">
    <p>${C.marca('verificado', 'Verificado')}</p>
    <p>Revisamos ciertas cosas concretas, con una fuente concreta, en una fecha concreta.
    Las tres cosas aparecen escritas en el perfil. Nada más.</p>
  </div>
  <div class="tarjeta">
    <p>${C.marca('no_verificado', 'Sin verificar')}</p>
    <p>No hemos comprobado nada. El perfil se publica porque el directorio necesita
    profundidad, pero va marcado en rojo para que nadie se confunda.</p>
  </div>
</div>
<div class="texto">
<p>Hay un tercer estado que verá de vez en cuando: <strong>verificación vencida</strong>.
Significa que sí lo revisamos, pero hace más de ${e(meses)} meses y todavía no lo hemos
vuelto a revisar. Lo tratamos como sin verificar hasta que lo hagamos de nuevo.</p>

<h2>Qué comprobamos exactamente</h2>
</div>
<ul class="comprobaciones">${listaChecks}</ul>

<h2>Qué se revisa en cada categoría</h2>
<table class="datos"><tbody>${porCategoria}</tbody></table>

<div class="texto">
<h2>Lo que un sello de verificado NO quiere decir</h2>
<ul>
  <li><strong>No quiere decir que le vayan a hacer buen trabajo.</strong> Una empresa
  perfectamente legal puede construirle mal.</li>
  <li><strong>No quiere decir que sea honesta.</strong> Comprobamos papeles, no intenciones.</li>
  <li><strong>No es una recomendación.</strong> No recomendamos a nadie.</li>
  <li><strong>No es una garantía.</strong> No respondemos por su dinero ni somos parte de
  ningún trato.</li>
  <li><strong>No es para siempre.</strong> Es una foto del día que lo revisamos.</li>
</ul>

<h2>Quién paga, y por qué se lo decimos</h2>
<p>Los proveedores <strong>pagan por la verificación y por estar listados</strong>. Así se
paga el trabajo de revisar registros, hacer llamadas y visitar direcciones. Se lo decimos
de frente porque es un conflicto de interés y usted tiene derecho a saberlo.</p>
<p>Lo que ese pago no compra:</p>
<ul>
  <li>No compra el resultado. Si un proveedor no pasa la revisión, no se publica como
  verificado, aunque haya pagado.</li>
  <li>No compra posición. No vendemos primeros lugares en las listas.</li>
  <li>No compra silencio. Los reportes de usuarios se atienden igual para quien paga y
  para quien no.</li>
  <li>No cobramos comisión sobre ninguna venta ni contrato. No somos intermediarios.</li>
</ul>

<h2>Cómo se pierde la verificación</h2>
<p>Un perfil deja de estar verificado si vence el plazo de ${e(meses)} meses y no se ha
vuelto a revisar, si recibimos reportes creíbles y no se resuelven, si descubrimos que se
nos dio información falsa, o si el negocio deja de existir.</p>

<h2>Los reportes</h2>
<p>Cada perfil tiene un botón para reportarlo. Leemos todos los reportes. Cuando un
reporte es serio, lo primero que hacemos es quitar la marca de verificado mientras
revisamos, no después.</p>
<p><a class="boton boton--alerta" href="/reportar/">Reportar un anuncio</a></p>

<h2>Dónde estamos hoy</h2>
<p>Perfiles verificados publicados en este momento: <strong>${e(verificados)}</strong>.
No inflamos este número y no publicamos perfiles inventados para que el directorio se vea
grande.</p>
</div>`;

  return {
    ruta: '/verificacion/',
    html: pagina({
      ctx, ruta: '/verificacion/', titulo: 'Cómo verificamos a los proveedores',
      descripcion: 'Qué comprobamos exactamente antes de marcar un perfil como verificado, con qué fuentes, en qué fecha, y qué cosas no comprobamos nunca.',
      contenido,
    }),
  };
}

// ------------------------------------------------------- REPORTAR
function paginaReportar(ctx) {
  const { config } = ctx;
  const campos = [
    `<div class="campo" hidden><label for="campo-ref">Anuncio reportado</label>
      <input type="text" id="campo-ref" name="ref" readonly></div>`,
    '<input type="hidden" name="tipo" value="">',
    grupoRadio({
      nombre: 'motivo', leyenda: '¿Qué pasó?', requerido: true,
      opciones: [
        { valor: 'no_existe', texto: 'El negocio o la propiedad no existe' },
        { valor: 'datos_falsos', texto: 'Los datos del anuncio son falsos o están mal' },
        { valor: 'no_es_dueno', texto: 'Quien ofrece la propiedad no es el dueño' },
        { valor: 'tomo_dinero', texto: 'Me pidió dinero y no cumplió' },
        { valor: 'no_contesta', texto: 'Ya no contesta o cerró' },
        { valor: 'suplantacion', texto: 'Se está haciendo pasar por otra persona o empresa' },
        { valor: 'otro', texto: 'Otra cosa' },
      ],
    }),
    campoTexto2({
      nombre: 'detalle', etiqueta: 'Cuéntenos qué pasó', requerido: true,
      ayuda: 'Fechas, montos, nombres, números de teléfono. Entre más concreto, más rápido podemos revisar.',
    }),
    campoTexto({
      nombre: 'contacto', etiqueta: 'Su WhatsApp o correo, por si necesitamos preguntarle algo',
      ayuda: 'No es obligatorio y no lo publicamos nunca. Puede reportar de forma anónima.',
      autocomplete: 'tel',
    }),
    campoTexto({ nombre: 'anuncio_url', etiqueta: 'Enlace del anuncio, si lo tiene a mano', tipo: 'url' }),
  ].join('');

  const contenido = `
${C.migas([{ href: '/', texto: 'Inicio' }, { texto: 'Reportar' }])}
<div class="texto">
<h1>Reportar un anuncio</h1>
<p>Los reportes son lo que mantiene limpio este directorio. Si algo no cuadra, aunque no
esté seguro, díganos. Preferimos revisar diez reportes de más que dejar pasar uno.</p>
<p hidden>Está reportando: <strong data-ref-titulo></strong></p>

<div class="tarjeta">
  <h2 style="margin-top:0">Qué pasa con su reporte</h2>
  <ul>
    <li>Lo lee una persona. Todos se leen.</li>
    <li>Si es serio, <strong>le quitamos la marca de verificado al perfil mientras
    revisamos</strong>, no después de revisar.</li>
    <li>Nunca publicamos su nombre, su número ni su reporte.</li>
    <li>No le decimos al proveedor quién lo reportó.</li>
  </ul>
</div>

<div class="aviso-sin-verificar">
  <p><strong>Esto no es una denuncia legal.</strong> Nosotros podemos quitar un anuncio
  de este sitio; no podemos recuperar su dinero ni iniciar un proceso por usted. Si le
  robaron, además de reportarlo aquí, guarde todas las pruebas y busque asesoría legal.</p>
</div>
</div>

${formulario({
    accion: config.webhooks?.reportes, nombreWebhook: 'webhooks.reportes',
    origen: 'reporte',
    gracias: 'Su reporte llegó. Lo va a leer una persona. Si hace falta preguntarle algo y nos dejó contacto, le escribimos.',
    campos, boton: 'Enviar reporte',
  })}`;

  return {
    ruta: '/reportar/',
    html: pagina({
      ctx, ruta: '/reportar/', titulo: 'Reportar un anuncio',
      descripcion: 'Reporte un proveedor o una propiedad de este directorio. Los reportes son anónimos y los lee una persona.',
      contenido, noindex: false,
    }),
  };
}

// ------------------------------------------------------- REGISTRAR PROVEEDOR
function paginaRegistrar(ctx) {
  const { config, categorias, departamentos } = ctx;
  const precios = config.precios || {};

  const campos = [
    campoTexto({ nombre: 'negocio', etiqueta: 'Nombre del negocio o su nombre completo', requerido: true, autocomplete: 'organization' }),
    campoSelect({
      nombre: 'categoria', etiqueta: '¿A qué se dedica?', requerido: true,
      opciones: categorias.filter((c) => !c.proximamente).map((c) => ({ valor: c.slug, texto: c.nombre })),
    }),
    campoSelect({
      nombre: 'departamento', etiqueta: 'Departamento donde trabaja', requerido: true,
      opciones: departamentos.map((d) => ({ valor: d, texto: d })),
    }),
    campoTexto({ nombre: 'ciudad', etiqueta: 'Ciudad', requerido: true }),
    campoTexto({ nombre: 'whatsapp', etiqueta: 'WhatsApp (con código de país)', tipo: 'tel', requerido: true, ayuda: 'Ejemplo: 504 9999 8888', autocomplete: 'tel' }),
    campoTexto({ nombre: 'rtn', etiqueta: 'RTN del negocio', ayuda: 'Si es sociedad, también el número de inscripción en el Registro Mercantil.' }),
    campoTexto({ nombre: 'colegiacion', etiqueta: 'Número de colegiación', ayuda: 'Sólo si es abogado, arquitecto o ingeniero.' }),
    campoTexto2({ nombre: 'descripcion', etiqueta: 'Qué servicios ofrece', requerido: true }),
    `<div class="opcion">
      <input type="checkbox" id="campo-acepta" name="acepta_verificacion" value="si" required>
      <label for="campo-acepta">Entiendo que para aparecer como verificado tengo que
      entregar documentos y que se comprueben, y que si algo no se comprueba, aparecerá
      así en mi perfil.</label>
    </div>`,
  ].join('');

  const bloquePrecios = precios.publicar
    ? `<table class="datos"><tbody>
        ${precios.verificacionInicial ? `<tr><th scope="row">Verificación inicial</th><td>${e(precios.verificacionInicial)}</td></tr>` : ''}
        ${precios.renovacionAnual ? `<tr><th scope="row">Renovación anual</th><td>${e(precios.renovacionAnual)}</td></tr>` : ''}
        ${precios.listadoBasico ? `<tr><th scope="row">Listado sin verificar</th><td>${e(precios.listadoBasico)}</td></tr>` : ''}
      </tbody></table>`
    : `<p>Todavía no publicamos precios en el sitio. Cuando reciba su solicitud le pasamos
       el costo por WhatsApp antes de que usted se comprometa a nada.</p>`;

  const contenido = `
${C.migas([{ href: '/', texto: 'Inicio' }, { texto: 'Aparecer en el directorio' }])}
<div class="texto">
<h1>Aparecer en el directorio</h1>
<p>Este directorio lo usan hondureños que viven fuera y que han visto a gente perder todo
lo ahorrado. Van a desconfiar de usted, y con razón. La verificación es la manera de
quitarse esa desconfianza de encima.</p>

<h2>Cómo funciona</h2>
<ol>
  <li>Usted manda esta solicitud.</li>
  <li>Le escribimos por WhatsApp y le decimos qué documentos necesitamos y cuánto cuesta.</li>
  <li>Revisamos: registro del negocio, colegiación si aplica, dirección física e identidad.</li>
  <li>Publicamos su perfil <strong>diciendo exactamente qué se comprobó y qué no</strong>.
  Si algo no se pudo comprobar, también aparece.</li>
  <li>A los ${e(config.verificacion?.vigenciaMeses ?? 12)} meses hay que renovar, o el perfil
  pasa a verificación vencida.</li>
</ol>

<h2>Cuánto cuesta</h2>
${bloquePrecios}
<p class="ayuda">El pago cubre el trabajo de revisar. No compra el resultado: si algo no
se comprueba, no lo vamos a publicar como comprobado.</p>

<div class="aviso-sin-verificar">
  <p><strong>Si no quiere verificarse</strong>, igual puede aparecer en el directorio,
  pero su perfil va marcado en rojo como <em>sin verificar</em>, con una advertencia
  visible de que no hemos comprobado nada sobre usted. No hay forma de quitar esa marca
  sin pasar por la revisión.</p>
</div>
</div>

<h2>Solicitud</h2>
${formulario({
    accion: config.webhooks?.registroProveedor, nombreWebhook: 'webhooks.registroProveedor',
    origen: 'registro-proveedor',
    gracias: 'Recibimos su solicitud. Le vamos a escribir por WhatsApp con los siguientes pasos.',
    campos, boton: 'Enviar solicitud',
  })}`;

  return {
    ruta: '/registrar/',
    html: pagina({
      ctx, ruta: '/registrar/', titulo: 'Aparecer en el directorio',
      descripcion: 'Cómo aparecer en el directorio y qué se necesita para pasar la verificación: registro del negocio, colegiación, dirección física e identidad.',
      contenido,
    }),
  };
}

// ------------------------------------------------------- ACERCA
function paginaAcerca(ctx) {
  const { config } = ctx;
  const op = config.operador || {};
  const completo = op.razonSocial && op.responsable && op.ubicacion;

  const identidad = completo
    ? `<table class="datos"><tbody>
        <tr><th scope="row">Quién opera el sitio</th><td>${e(op.razonSocial)}</td></tr>
        <tr><th scope="row">Responsable</th><td>${e(op.responsable)}</td></tr>
        <tr><th scope="row">Dónde estamos</th><td>${e(op.ubicacion)}</td></tr>
        ${op.desde ? `<tr><th scope="row">Desde</th><td>${e(op.desde)}</td></tr>` : ''}
      </tbody></table>`
    : `<div class="aviso-sin-verificar">
        <p><strong>Esta sección está incompleta.</strong> Un sitio que le pide a la gente
        que confíe tiene que decir primero quién está detrás. Falta llenar el bloque
        <code>operador</code> en <code>site.config.json</code>.</p>
      </div>`;

  const contenido = `
${C.migas([{ href: '/', texto: 'Inicio' }, { texto: 'Quiénes somos' }])}
<div class="texto">
<h1>Quiénes somos</h1>
${identidad}

<h2>Por qué existe este sitio</h2>
<p>Miles de hondureños en Estados Unidos mandan dinero a Honduras durante años para
construir una casa, comprar un lote o poner un negocio. Muchos regresan y se encuentran
con que no hay nada, o que la propiedad nunca estuvo a su nombre.</p>
<p>El problema casi nunca es que no haya gente honesta trabajando en Honduras. El problema
es que desde afuera <strong>no hay manera de distinguir</strong> a la gente honesta de la
que no lo es. Eso es lo único que este sitio intenta arreglar.</p>

<h2>Cómo ganamos dinero</h2>
<p>Los proveedores pagan por la verificación y por el listado. No cobramos comisión sobre
ventas ni contratos, no somos intermediarios y no recibimos su dinero.
Lo explicamos completo en <a href="/verificacion/">cómo verificamos</a>.</p>

<h2>Lo que no hacemos</h2>
<ul>
  <li>No recomendamos a nadie.</li>
  <li>No garantizamos ningún trato ni respondemos por el dinero de nadie.</li>
  <li>No publicamos reseñas ni estrellas: son fáciles de comprar y no queremos vender eso.</li>
  <li>No inventamos testimonios ni contamos historias de clientes que no existen.</li>
</ul>

<h2>Escríbanos</h2>
${config.contacto?.whatsapp
      ? C.botonWhatsApp(config.contacto.whatsapp, `Hola, les escribo desde ${config.nombre}.`, 'Escribirnos por WhatsApp')
      : '<p class="ayuda">Falta configurar el WhatsApp del sitio en <code>site.config.json</code>.</p>'}
${config.contacto?.correo ? `<p>Correo: <a href="mailto:${e(config.contacto.correo)}">${e(config.contacto.correo)}</a></p>` : ''}
</div>`;

  return {
    ruta: '/acerca/',
    html: pagina({
      ctx, ruta: '/acerca/', titulo: 'Quiénes somos',
      descripcion: 'Quién opera este directorio, por qué existe y cómo se financia.',
      contenido,
    }),
  };
}

// ------------------------------------------------------- LEGALES
function paginaTerminos(ctx) {
  const contenido = `
${C.migas([{ href: '/', texto: 'Inicio' }, { texto: 'Términos de uso' }])}
<div class="texto">
<h1>Términos de uso</h1>

<h2>1. Qué es este sitio</h2>
<p>Este sitio es un directorio informativo. Publicamos información sobre proveedores de
servicios y propiedades en Honduras, e indicamos en cada perfil qué información
comprobamos y en qué fecha.</p>

<h2>2. No somos parte de ningún trato</h2>
<p>No somos agentes, corredores, intermediarios ni representantes de ningún proveedor ni
de ningún comprador. No participamos en las negociaciones, no recibimos ni custodiamos
pagos, y no somos parte de los contratos que usted haga.</p>

<h2>3. Qué significa "verificado"</h2>
<p>La marca de verificado significa únicamente que comprobamos los puntos concretos que
aparecen listados en ese perfil, con las fuentes indicadas y en la fecha indicada.
No es una recomendación, no es una garantía de calidad, de honestidad ni de cumplimiento,
y no garantiza el resultado de ninguna operación. La situación de una persona, una empresa
o un inmueble puede cambiar en cualquier momento después de nuestra revisión.</p>

<h2>4. Anuncios sin verificar</h2>
<p>El sitio publica también anuncios sin verificar, señalados como tales. Sobre esos
anuncios no hemos comprobado absolutamente nada. La información es responsabilidad de
quien la publicó.</p>

<h2>5. Responsabilidad</h2>
<p>Usted es responsable de sus propias decisiones. Antes de contratar, firmar o pagar,
verifique de forma independiente, contrate a su propio abogado y pida los documentos
registrales actualizados. En la medida en que lo permita la ley aplicable, no respondemos
por pérdidas derivadas de tratos hechos con personas o empresas que aparezcan en este
sitio.</p>

<h2>6. Contenido publicado por terceros</h2>
<p>Las descripciones, fotografías, precios y listas de servicios los proporcionan los
proveedores. Podemos retirar cualquier contenido, en cualquier momento, sin aviso previo,
especialmente cuando recibimos reportes creíbles.</p>

<h2>7. Obligaciones de los proveedores listados</h2>
<p>Quien solicita aparecer en el directorio declara que la información que entrega es
verdadera y que está facultado para ofrecer los servicios o bienes que anuncia. Entregar
información falsa es causa de retiro inmediato del sitio, sin devolución de lo pagado.</p>

<h2>8. Reportes</h2>
<p>Cualquier persona puede reportar un anuncio. Los reportes se tratan de forma
confidencial. Podemos suspender la marca de verificado mientras revisamos un reporte.</p>

<h2>9. Propiedad intelectual</h2>
<p>Los textos y las guías de este sitio son nuestros. Las fotografías y marcas de los
proveedores pertenecen a sus dueños.</p>

<h2>10. Cambios y ley aplicable</h2>
<p>Podemos actualizar estos términos. La versión vigente es la publicada en esta página.
Estos términos se rigen por las leyes de la República de Honduras.</p>
</div>`;
  return {
    ruta: '/terminos/',
    html: pagina({
      ctx, ruta: '/terminos/', titulo: 'Términos de uso',
      descripcion: 'Condiciones de uso del directorio: qué significa verificado, qué responsabilidad asumimos y cuál no.',
      contenido,
    }),
  };
}

function paginaPrivacidad(ctx) {
  const contenido = `
${C.migas([{ href: '/', texto: 'Inicio' }, { texto: 'Privacidad' }])}
<div class="texto">
<h1>Privacidad</h1>

<h2>Lo corto</h2>
<p>No vendemos sus datos. No le pedimos cuenta ni contraseña para usar el sitio. Si nos
escribe o reporta algo, usamos sus datos sólo para responderle y revisar el caso.</p>

<h2>Qué recogemos</h2>
<ul>
  <li><strong>Reportes:</strong> lo que usted escribe en el formulario y, si lo deja, su
  contacto. Puede reportar sin dejar contacto.</li>
  <li><strong>Solicitudes de proveedores:</strong> los datos del negocio y los documentos
  que nos entreguen para la verificación.</li>
  <li><strong>Estadísticas de visitas:</strong> conteos agregados de páginas vistas.
  Ninguna herramienta de este sitio identifica a visitantes individuales.</li>
</ul>

<h2>Quién puede ver sus reportes</h2>
<p>Sólo las personas que operan el sitio. <strong>Nunca le decimos al proveedor quién lo
reportó</strong> ni publicamos el texto de un reporte con datos que puedan identificarle.
Si una autoridad competente nos lo requiere legalmente, tendríamos que entregar lo que
tengamos; por eso puede reportar de forma anónima.</p>

<h2>A quién le pasamos datos</h2>
<p>A los servicios que usamos para recibir los formularios y alojar el sitio, y a nadie
más. No vendemos ni intercambiamos datos con anunciantes.</p>

<h2>Documentos de los proveedores</h2>
<p>Los documentos que un proveedor entrega para verificarse se usan sólo para eso. En el
perfil público publicamos el resultado de la comprobación, no los documentos ni los
números de identidad.</p>

<h2>Cookies</h2>
<p>El sitio no usa cookies de publicidad ni de seguimiento entre sitios.</p>

<h2>Sus derechos</h2>
<p>Puede pedirnos que le digamos qué datos suyos tenemos, que los corrijamos o que los
borremos. Escríbanos por los medios de la página <a href="/acerca/">Quiénes somos</a>.</p>
</div>`;
  return {
    ruta: '/privacidad/',
    html: pagina({
      ctx, ruta: '/privacidad/', titulo: 'Privacidad',
      descripcion: 'Qué datos recogemos, quién los ve y cómo tratamos los reportes.',
      contenido,
    }),
  };
}

function pagina404(ctx) {
  const contenido = `
<div class="texto">
<h1>Esta página no existe</h1>
<p>Puede que el anuncio se haya retirado. A veces quitamos un anuncio porque recibimos un
reporte y no se resolvió; cuando eso pasa, la página deja de existir.</p>
<ul>
  <li><a href="/directorio/">Ir al directorio</a></li>
  <li><a href="/propiedades/">Ver propiedades</a></li>
  <li><a href="/guias/">Leer las guías</a></li>
  <li><a href="/reportar/">Reportar un anuncio</a></li>
</ul>
</div>`;
  return {
    ruta: '/404.html',
    html: pagina({ ctx, ruta: '/404.html', titulo: 'Página no encontrada', descripcion: 'La página que buscaba no existe.', contenido, noindex: true }),
  };
}

export function paginasEstaticas(ctx) {
  return [
    paginaVerificacion(ctx), paginaReportar(ctx), paginaRegistrar(ctx),
    paginaAcerca(ctx), paginaTerminos(ctx), paginaPrivacidad(ctx), pagina404(ctx),
  ];
}
