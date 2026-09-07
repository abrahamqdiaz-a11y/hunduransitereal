# VerificaHN — directorio verificado para la diáspora hondureña

Directorio en español de constructores, abogados, arquitectos, administradores de
propiedades y empresas de envíos en Honduras, más anuncios de propiedades, dirigido a
hondureños que viven en Estados Unidos y no pueden ir a verificar nada en persona.

**La idea entera del sitio cabe en una frase:** de cada perfil verificado decimos
exactamente qué comprobamos, con qué fuente y en qué fecha — y decimos también qué no
comprobamos. Nada más. Nunca "este proveedor es seguro".

Antes de publicar, lee **[CONTENIDO-PENDIENTE.md](CONTENIDO-PENDIENTE.md)**: lista lo que
falta de contenido real y que a propósito no se inventó.

---

## Arrancar

```bash
npm run dev        # sitio con los datos reales (arranca vacío)  → localhost:4321
npm run dev:demo   # sitio con datos de ejemplo, para ver el diseño con contenido
npm run build      # genera dist/
npm run check      # construye y revisa las reglas duras (ver abajo)
npm run admin      # panel de administración (necesita ADMIN_CLAVE)
```

Sin dependencias. Sólo Node 20 o superior. `npm install` no instala nada porque no hay
nada que instalar.

## Cómo está hecho

Generador estático propio, en Node, sin framework. La razón es el público: teléfono de
gama media, datos móviles, señal irregular. Cada página va con el CSS incrustado, sin
fuentes externas, sin bibliotecas y con un único archivo JS opcional de mejora
progresiva. El HTML pesa unos **16 KB** por página y el sitio funciona completo con
JavaScript desactivado.

```
site.config.json      nombre, dominio, webhooks, precios, datos del operador
data/
  categorias.json     categorías del directorio y qué se revisa en cada una
  comprobaciones.json catálogo de comprobaciones: qué significa y qué NO significa cada una
  departamentos.json  los 18 departamentos
  proveedores.json    los proveedores reales (vacío al inicio, a propósito)
  propiedades.json    las propiedades reales (vacío al inicio, a propósito)
  *.ejemplo.json      datos falsos para ver el diseño (npm run dev:demo)
  reportes.json       reportes recibidos (lo crea el admin, no va al repo)
contenido/guias/*.md  las guías, en markdown con front matter
lib/                  generador: markdown, datos, plantilla, componentes, páginas
publico/              se copia tal cual a dist/ (img, js, favicon)
admin/server.js       panel de administración
scripts/              servidor de desarrollo y comprobador de reglas
```

## Las reglas duras (y quién las hace cumplir)

Estas reglas no dependen de que alguien se acuerde. Están puestas en el código:

| Regla | Dónde se impone |
|---|---|
| Nadie lleva sello de verificado sin comprobaciones confirmadas con detalle, fecha y revisor | `lib/data.js` — el build **falla** |
| Todo perfil verificado publica la lista de lo que **no** se revisó | `lib/data.js` — el build **falla** |
| Todo perfil sin verificar muestra la advertencia grande | `scripts/check.js` |
| Todo perfil tiene botón de reportar | `scripts/check.js` |
| Nada de urgencia falsa, garantías, reseñas inventadas ni alianzas no comprobables | `scripts/check.js` — lista de frases prohibidas |
| Las verificaciones vencen a los 12 meses y el perfil se degrada solo | `estadoVerificacion()` en `lib/data.js` |
| Ninguna página pesa más de 60 KB de HTML | `scripts/check.js` |

`npm run check` corre todo eso. Vale la pena tenerlo en el pipeline de despliegue.

## Agregar un proveedor

Con el panel:

```bash
ADMIN_CLAVE="una clave larga" npm run admin   # → http://127.0.0.1:4322
```

El panel escribe directamente en `data/*.json`, y **se niega a guardar como verificado**
cualquier perfil que no tenga al menos una comprobación confirmada con detalle, fecha,
revisor y la lista de lo que no se revisó. Después de guardar, "Reconstruir sitio" y
subir `dist/` (o hacer commit y dejar que el hosting construya).

También se pueden editar los JSON a mano; el build valida igual.

### El panel en un servidor

Por defecto escucha en `127.0.0.1`, así que sólo se llega desde la misma máquina. Es lo
más seguro y probablemente suficiente. Si lo pones en internet:

- ponlo detrás de HTTPS (proxy inverso),
- `ADMIN_CLAVE` larga y única,
- `ADMIN_TOKEN_WEBHOOK` para que Make.com pueda mandar reportes a
  `POST /webhook/reporte?token=...`,
- `ADMIN_HOST=0.0.0.0` sólo si de verdad hace falta.

## Formularios

Los formularios (reporte y registro de proveedor) hacen `POST` a la URL de webhook que
esté en `site.config.json`. Con JavaScript se envía sin salir de la página; sin
JavaScript, el navegador hace el POST normal. **Si el webhook no está configurado, el
formulario no se dibuja**: en su lugar sale un aviso que dice que no está conectado.
Preferimos eso a fingir que un reporte se envió.

Campos y detalles en [CONTENIDO-PENDIENTE.md](CONTENIDO-PENDIENTE.md).

## Publicar

`dist/` es HTML estático: sirve Netlify, Cloudflare Pages, Vercel, GitHub Pages o
cualquier hosting.

- Comando de build: `npm run build`
- Carpeta publicada: `dist`
- Incluye `netlify.toml`, `_headers` (cabeceras de seguridad y caché), `robots.txt`,
  `sitemap.xml` y una página `404.html`.
- Para bloquear el despliegue si falta contenido: `node build.js --estricto`.

## SEO

Todo en español, `lang="es-HN"`. Cada perfil y cada propiedad es una página indexable
con su `canonical`, su `meta description` escrita a partir de datos reales, Open Graph y
JSON-LD (`LocalBusiness`, `RealEstateListing`, `Article`, `BreadcrumbList`,
`CollectionPage`). Se generan páginas por categoría y por categoría + departamento, pero
**sólo cuando hay algo listado**, para no llenar el índice de páginas vacías.

No se emite `aggregateRating` en ningún lado, porque no hay reseñas y no las va a haber.

## Lo que el sitio nunca hace

Sin contadores regresivos, sin "últimas horas", sin testimonios inventados, sin números
de clientes inflados, sin estrellas, sin alianzas que no existen y sin sellos de
verificado en quien no fue verificado. Todo eso es el vocabulario del fraude, que es
justo lo que este público ya aprendió a temer.
