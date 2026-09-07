# Lo que hace falta de tu parte

El sitio está completo y funciona, pero hay cosas que **no inventé a propósito** porque
serían afirmaciones falsas en un sitio cuyo único valor es no decir mentiras.
`npm run build` te vuelve a listar esta lista cada vez que construyes.

## 1. Identidad del sitio — bloqueante

En `site.config.json`:

- `nombre` / `nombreLargo`: puse **VerificaHN** como nombre de trabajo. Cámbialo por el
  real. Sale en cabecera, títulos, metadatos y mensajes de WhatsApp.
- `url`: el dominio real. Sin esto, los `canonical`, el sitemap y el schema apuntan a un
  dominio de ejemplo y el SEO no funciona.
- `operador`: razón social, nombre del responsable, ubicación y desde cuándo.
  **Un sitio que le pide confianza a la gente no puede ser anónimo.** Mientras esté vacío,
  la página `/acerca/` muestra un aviso visible de que está incompleta.
- `contacto.whatsapp`: el número del sitio, formato `504XXXXXXXX`.

## 2. Webhooks de Make.com — bloqueante

En `site.config.json → webhooks`:

- `reportes`: a dónde llegan los reportes. **Sin esto el botón de reportar no envía
  nada** y el formulario dice honestamente que no está conectado.
- `registroProveedor`: solicitudes de proveedores nuevos.
- `contactoGeneral`: opcional.

Los formularios envían `POST` con `application/x-www-form-urlencoded`. Campos:

- Reporte: `origen=reporte`, `ref`, `tipo`, `motivo`, `detalle`, `contacto`, `anuncio_url`,
  `sitio_web_confirmacion` (trampa anti-bots: si viene con texto, es spam, descártalo).
- Registro: `origen=registro-proveedor`, `negocio`, `categoria`, `departamento`, `ciudad`,
  `whatsapp`, `rtn`, `colegiacion`, `descripcion`, `acepta_verificacion`.

Si además quieres que los reportes lleguen al panel de admin, en Make agrega un segundo
módulo HTTP que reenvíe a `POST https://tu-admin/webhook/reporte?token=EL_TOKEN`
(ver `ADMIN_TOKEN_WEBHOOK` en el README).

## 3. Precios — decisión tuya

`site.config.json → precios`. No inventé cifras. Mientras `publicar` sea `false`, la
página `/registrar/` dice que el costo se conversa por WhatsApp, que es honesto.
Decide también qué pasa si alguien paga y **no** pasa la verificación (¿se devuelve?
¿se queda como listado sin verificar?) y ponlo en `/registrar/`.

## 4. Datos que las guías necesitan confirmados

Están en el front matter `pendiente:` de cada archivo en `contenido/guias/` y salen en
consola al construir. Los importantes:

- **Instituto de la Propiedad**: si hay consulta en línea al público hoy, el enlace
  oficial, el costo de una certificación y de un estudio de dominio, con fecha.
- **Estafas**: la guía describe *patrones*, no casos. Si consigues casos reales
  documentados (nota de prensa, expediente, testimonio con permiso), esa guía se vuelve
  mucho más fuerte. No inventé ninguno.
- **Comprar desde EE.UU.**: consulados que otorgan poderes, requisitos de apostilla,
  y los impuestos y aranceles de traspaso con porcentajes y fuente.
- **Financiamiento**: qué bancos tienen programas para hondureños en el exterior hoy,
  qué piden y en qué moneda prestan. **No puse ni tasas ni nombres de programas**, y no
  los pongas sin confirmarlos: es exactamente el tipo de dato que si sale mal, destruye
  la credibilidad del sitio.
- **Constructor**: un modelo de contrato revisado por abogado hondureño, si lo quieres
  ofrecer como descarga.

## 5. Legales

`/terminos/` y `/privacidad/` están escritos completos y en serio, pero **hay que
pasarlos por un abogado hondureño** antes de publicar, sobre todo la parte de
limitación de responsabilidad y la de tratamiento de datos.

## 6. Fotos

`publico/img/` está vacío. Ver `publico/img/LEEME.md`. Sin fotos reales, los perfiles
muestran un recuadro que dice que todavía no hay fotos, que es preferible a una foto
de banco de imágenes.

## 7. Los primeros proveedores

`data/proveedores.json` y `data/propiedades.json` están **vacíos a propósito**. No
inventé perfiles: un directorio con proveedores falsos es exactamente lo que hace el
fraude. Para ver el diseño con contenido, corre `npm run dev:demo`, que usa
`data/*.ejemplo.json` y pinta una franja roja avisando que son datos falsos.

## 8. Cosas que decidí sin preguntarte (cámbialas si quieres)

- La verificación **vence a los 12 meses** (`verificacion.vigenciaMeses`). Después el
  perfil se muestra como *verificación vencida*, no como verificado.
- Salud y seguros aparecen como categorías "próximamente", sin listados.
- No hay reseñas, estrellas ni contadores de opiniones, y no los agregué a propósito:
  son fáciles de comprar y contradicen el punto del sitio.
- La página `/verificacion/` declara abiertamente que los proveedores pagan. Es un
  conflicto de interés y esconderlo costaría más de lo que cuesta admitirlo.
