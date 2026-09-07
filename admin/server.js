// Panel de administración. Zero dependencias, escribe directamente en data/*.json.
// Uso:  ADMIN_CLAVE="algo largo" npm run admin
// Por defecto escucha sólo en 127.0.0.1. Ver README antes de exponerlo a internet.

import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PUERTO = Number(process.env.PORT || 4322);
const HOST = process.env.ADMIN_HOST || '127.0.0.1';
const CLAVE = process.env.ADMIN_CLAVE || '';
const TOKEN_WEBHOOK = process.env.ADMIN_TOKEN_WEBHOOK || '';
const CSS = fs.readFileSync(path.join(ROOT, 'lib/estilo.css'), 'utf8');

const rutaData = (n) => path.join(ROOT, 'data', n);
const leer = (n) => JSON.parse(fs.readFileSync(rutaData(n), 'utf8'));
const guardar = (n, d) => fs.writeFileSync(rutaData(n), JSON.stringify(d, null, 2) + '\n');
const leerReportes = () => (fs.existsSync(rutaData('reportes.json')) ? leer('reportes.json') : []);

const e = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;')
  .replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');

const sesiones = new Set();

function slugificar(s) {
  return String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60);
}

function marco(titulo, cuerpo, { sinNav = false } = {}) {
  return `<!doctype html><html lang="es"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${e(titulo)} — Admin</title><style>${CSS}
.admin-cab{background:#16191c;color:#fff;padding:.75rem 0}
.admin-cab a{color:#fff;margin-right:1rem;text-decoration:none}
.fila{display:flex;gap:.75rem;flex-wrap:wrap;align-items:center}
.fila .boton{width:auto;min-height:44px;padding:.5rem .9rem}
</style></head><body>
${sinNav ? '' : `<div class="admin-cab"><div class="contenedor fila">
  <strong>Admin</strong>
  <a href="/">Resumen</a><a href="/proveedores">Proveedores</a>
  <a href="/propiedades">Propiedades</a><a href="/reportes">Reportes</a>
  <form method="post" action="/publicar" style="margin-left:auto">
    <button class="boton" type="submit">Reconstruir sitio</button></form>
</div></div>`}
<main><div class="contenedor">${cuerpo}</div></main></body></html>`;
}

function cuerpoForm(req) {
  return new Promise((res, rej) => {
    let datos = '';
    req.on('data', (c) => { datos += c; if (datos.length > 1e6) req.destroy(); });
    req.on('end', () => {
      const tipo = req.headers['content-type'] || '';
      if (tipo.includes('application/json')) {
        try { return res(JSON.parse(datos || '{}')); } catch { return res({}); }
      }
      const params = new URLSearchParams(datos);
      const obj = {};
      for (const [k, v] of params) {
        if (k in obj) { obj[k] = [].concat(obj[k], v); } else obj[k] = v;
      }
      res(obj);
    });
    req.on('error', rej);
  });
}

function autorizado(req) {
  const cookie = req.headers.cookie || '';
  const m = cookie.match(/admin_sesion=([^;]+)/);
  return m && sesiones.has(m[1]);
}

function redirigir(res, a, cookie) {
  const h = { Location: a };
  if (cookie) h['Set-Cookie'] = cookie;
  res.writeHead(302, h); res.end();
}

// ------------------------------------------------------------------ vistas
function vistaLogin(error) {
  return marco('Entrar', `<div class="texto" style="margin-top:3rem">
    <h1>Panel de administración</h1>
    ${error ? `<p class="aviso-sin-verificar">${e(error)}</p>` : ''}
    <form method="post" action="/entrar">
      <div class="campo"><label for="c">Clave</label>
      <input type="password" id="c" name="clave" autofocus></div>
      <button class="boton" type="submit">Entrar</button>
    </form></div>`, { sinNav: true });
}

function vistaResumen() {
  const proveedores = leer('proveedores.json');
  const propiedades = leer('propiedades.json');
  const reportes = leerReportes();
  const config = JSON.parse(fs.readFileSync(path.join(ROOT, 'site.config.json'), 'utf8'));
  const meses = config.verificacion?.vigenciaMeses ?? 12;
  const hoy = new Date();
  const porVencer = proveedores.filter((p) => {
    if (p.estado !== 'verificado' || !p.verificacion?.fecha) return false;
    const f = new Date(p.verificacion.fecha);
    f.setMonth(f.getMonth() + meses);
    return (f - hoy) / 86400000 < 45;
  });
  const nuevos = reportes.filter((r) => r.estado === 'nuevo');

  return marco('Resumen', `
    <h1>Resumen</h1>
    <div class="rejilla rejilla--3">
      <div class="tarjeta"><h2>${proveedores.length}</h2><p>proveedores
        (${proveedores.filter((p) => p.estado === 'verificado').length} verificados)</p></div>
      <div class="tarjeta"><h2>${propiedades.length}</h2><p>propiedades</p></div>
      <div class="tarjeta"><h2>${nuevos.length}</h2><p>reportes sin atender</p>
        <p><a href="/reportes">Ver reportes →</a></p></div>
    </div>
    ${nuevos.length ? `<div class="aviso-sin-verificar"><p><strong>Hay ${nuevos.length} reporte(s)
      sin atender.</strong> Atiéndalos antes que cualquier otra cosa: es lo único que
      protege a la gente que usa el sitio.</p></div>` : ''}
    ${porVencer.length ? `<div class="tarjeta"><h2>Verificaciones por vencer</h2><ul>
      ${porVencer.map((p) => `<li><a href="/proveedores/editar?slug=${encodeURIComponent(p.slug)}">${e(p.nombre)}</a>
        — revisada el ${e(p.verificacion.fecha)}</li>`).join('')}</ul></div>` : ''}
    <div class="tarjeta"><h2>Publicar</h2>
      <p>Después de cambiar datos hay que reconstruir el sitio y subir la carpeta
      <code>dist/</code> (o hacer commit y dejar que el hosting construya).</p>
      <form method="post" action="/publicar"><button class="boton" type="submit">Reconstruir sitio</button></form>
    </div>`);
}

function filaLista(item, tipo) {
  const et = item.estado === 'verificado' ? '✓ verificado' : '· sin verificar';
  return `<tr><td><a href="/${tipo}/editar?slug=${encodeURIComponent(item.slug)}">${e(item.nombre || item.titulo)}</a></td>
    <td>${e(et)}</td><td>${e(item.ciudad || '')} ${e(item.departamento || '')}</td></tr>`;
}

function vistaLista(tipo) {
  const archivo = tipo === 'proveedores' ? 'proveedores.json' : 'propiedades.json';
  const items = leer(archivo);
  return marco(tipo, `<h1>${tipo === 'proveedores' ? 'Proveedores' : 'Propiedades'}</h1>
    <p><a class="boton" href="/${tipo}/editar">Agregar</a></p>
    <table class="datos"><thead><tr><th>Nombre</th><th>Estado</th><th>Ubicación</th></tr></thead>
    <tbody>${items.map((i) => filaLista(i, tipo)).join('') || '<tr><td colspan="3">Todavía no hay nada.</td></tr>'}</tbody></table>`);
}

function selectEstadoCheck(nombre, valor) {
  const ops = [['no_aplica', 'No aplica'], ['confirmado', 'Comprobado'],
    ['no_confirmado', 'No se pudo comprobar'], ['pendiente', 'Pendiente']];
  return `<select name="${nombre}">${ops.map(([v, t]) =>
    `<option value="${v}"${valor === v ? ' selected' : ''}>${t}</option>`).join('')}</select>`;
}

function vistaEditarProveedor(slug) {
  const items = leer('proveedores.json');
  const p = items.find((x) => x.slug === slug) || {
    slug: '', nombre: '', categoria: '', resumen: '', descripcion: '', departamento: '',
    ciudad: '', direccion: '', whatsapp: '', sitioWeb: '', servicios: [], fotos: [],
    estado: 'no_verificado', verificacion: null, cobertura: [],
  };
  const categorias = leer('categorias.json');
  const departamentos = leer('departamentos.json');
  const comprobaciones = leer('comprobaciones.json');
  const v = p.verificacion || { fecha: '', revisadoPor: '', comprobaciones: [], noRevisado: [] };
  const valorDe = (t) => v.comprobaciones.find((c) => c.tipo === t) || { estado: 'no_aplica', detalle: '', fuente: '' };

  const bloquesChecks = Object.keys(comprobaciones).filter((k) => !k.startsWith('_') && !k.startsWith('propiedad_') && k !== 'vendedor_es_titular')
    .map((t) => {
      const c = valorDe(t);
      return `<fieldset><legend>${e(comprobaciones[t].nombre)}</legend>
        <p class="ayuda">${e(comprobaciones[t].significa)}</p>
        <div class="campo">${selectEstadoCheck(`check_${t}_estado`, c.estado)}</div>
        <div class="campo"><label>Qué se comprobó exactamente (se publica)</label>
          <input name="check_${t}_detalle" value="${e(c.detalle)}"></div>
        <div class="campo"><label>Fuente (se publica)</label>
          <input name="check_${t}_fuente" value="${e(c.fuente)}" placeholder="${e(comprobaciones[t].fuenteTipica || '')}"></div>
      </fieldset>`;
    }).join('');

  return marco('Editar proveedor', `
    <h1>${p.slug ? 'Editar' : 'Nuevo'} proveedor</h1>
    <form method="post" action="/proveedores/guardar">
      <input type="hidden" name="slug_original" value="${e(p.slug)}">
      <div class="campo"><label>Nombre *</label><input name="nombre" value="${e(p.nombre)}" required></div>
      <div class="campo"><label>Slug (URL). Vacío = se genera del nombre</label><input name="slug" value="${e(p.slug)}"></div>
      <div class="campo"><label>Categoría *</label><select name="categoria" required>
        <option value="">—</option>
        ${categorias.map((c) => `<option value="${c.slug}"${p.categoria === c.slug ? ' selected' : ''}>${e(c.nombre)}</option>`).join('')}
      </select></div>
      <div class="campo"><label>Resumen (una línea, sale en las listas)</label><input name="resumen" value="${e(p.resumen)}"></div>
      <div class="campo"><label>Descripción</label><textarea name="descripcion">${e(p.descripcion)}</textarea></div>
      <div class="campo"><label>Departamento *</label><select name="departamento" required>
        <option value="">—</option>
        ${departamentos.map((d) => `<option${p.departamento === d ? ' selected' : ''}>${e(d)}</option>`).join('')}
      </select></div>
      <div class="campo"><label>Ciudad</label><input name="ciudad" value="${e(p.ciudad)}"></div>
      <div class="campo"><label>Dirección</label><input name="direccion" value="${e(p.direccion)}"></div>
      <div class="campo"><label>Departamentos donde trabaja (separados por coma)</label>
        <input name="cobertura" value="${e((p.cobertura || []).join(', '))}"></div>
      <div class="campo"><label>WhatsApp (sólo números, con código de país)</label><input name="whatsapp" value="${e(p.whatsapp)}"></div>
      <div class="campo"><label>Sitio web</label><input name="sitioWeb" value="${e(p.sitioWeb)}"></div>
      <div class="campo"><label>Servicios (uno por línea)</label><textarea name="servicios">${e((p.servicios || []).join('\n'))}</textarea></div>
      <div class="campo"><label>Fotos: rutas dentro de /img/ (una por línea)</label>
        <textarea name="fotos">${e((p.fotos || []).map((f) => (typeof f === 'string' ? f : f.src)).join('\n'))}</textarea></div>

      <h2>Verificación</h2>
      <div class="aviso-sin-verificar"><p>Sólo marque verificado si de verdad revisó.
      El sitio no publica el sello si no hay al menos una comprobación confirmada con detalle.</p></div>
      <div class="campo"><label>Estado</label><select name="estado">
        <option value="no_verificado"${p.estado !== 'verificado' ? ' selected' : ''}>Sin verificar</option>
        <option value="verificado"${p.estado === 'verificado' ? ' selected' : ''}>Verificado</option>
      </select></div>
      <div class="campo"><label>Fecha de la revisión (AAAA-MM-DD)</label><input name="v_fecha" value="${e(v.fecha)}"></div>
      <div class="campo"><label>Quién revisó</label><input name="v_revisadoPor" value="${e(v.revisadoPor)}"></div>
      ${bloquesChecks}
      <div class="campo"><label>Lo que NO se revisó (uno por línea) *</label>
        <textarea name="v_noRevisado">${e((v.noRevisado || []).join('\n'))}</textarea></div>

      <div class="fila">
        <button class="boton" type="submit">Guardar</button>
        ${p.slug ? `<button class="boton boton--alerta" type="submit" name="accion" value="borrar"
          onclick="return confirm('¿Borrar este proveedor?')">Borrar</button>` : ''}
      </div>
    </form>`);
}

function recogerChecks(cuerpo, prefijos) {
  const out = [];
  for (const t of prefijos) {
    const estado = cuerpo[`check_${t}_estado`];
    if (!estado || estado === 'no_aplica' && !cuerpo[`check_${t}_detalle`]) {
      if (estado === 'no_aplica') out.push({ tipo: t, estado, detalle: cuerpo[`check_${t}_detalle`] || '', fuente: '' });
      continue;
    }
    out.push({
      tipo: t, estado,
      detalle: (cuerpo[`check_${t}_detalle`] || '').trim(),
      fuente: (cuerpo[`check_${t}_fuente`] || '').trim(),
    });
  }
  return out;
}

const lineas = (s) => String(s || '').split('\n').map((x) => x.trim()).filter(Boolean);

function guardarProveedor(cuerpo) {
  const items = leer('proveedores.json');
  const original = cuerpo.slug_original;
  if (cuerpo.accion === 'borrar') {
    guardar('proveedores.json', items.filter((x) => x.slug !== original));
    return { ok: true };
  }
  const comprobaciones = leer('comprobaciones.json');
  const tipos = Object.keys(comprobaciones).filter((k) => !k.startsWith('_') && !k.startsWith('propiedad_') && k !== 'vendedor_es_titular');
  const slug = slugificar(cuerpo.slug || cuerpo.nombre);
  const checks = recogerChecks(cuerpo, tipos);
  const verificado = cuerpo.estado === 'verificado';
  const confirmadas = checks.filter((c) => c.estado === 'confirmado' && c.detalle);

  if (verificado && (confirmadas.length === 0 || !cuerpo.v_fecha || !cuerpo.v_revisadoPor || !lineas(cuerpo.v_noRevisado).length)) {
    return { ok: false, error: 'Para marcar VERIFICADO hace falta: al menos una comprobación confirmada con detalle, la fecha de revisión, quién revisó, y la lista de lo que NO se revisó.' };
  }

  const registro = {
    slug,
    nombre: cuerpo.nombre,
    categoria: cuerpo.categoria,
    resumen: cuerpo.resumen || '',
    descripcion: cuerpo.descripcion || '',
    departamento: cuerpo.departamento,
    ciudad: cuerpo.ciudad || '',
    direccion: cuerpo.direccion || '',
    cobertura: String(cuerpo.cobertura || '').split(',').map((s) => s.trim()).filter(Boolean),
    whatsapp: String(cuerpo.whatsapp || '').replace(/[^0-9]/g, ''),
    telefono: '',
    sitioWeb: cuerpo.sitioWeb || '',
    servicios: lineas(cuerpo.servicios),
    fotos: lineas(cuerpo.fotos).map((src) => ({ src, alt: cuerpo.nombre })),
    estado: verificado ? 'verificado' : 'no_verificado',
    verificacion: verificado ? {
      fecha: cuerpo.v_fecha,
      revisadoPor: cuerpo.v_revisadoPor,
      comprobaciones: checks,
      noRevisado: lineas(cuerpo.v_noRevisado),
    } : null,
    enListaDesde: (items.find((x) => x.slug === original) || {}).enListaDesde || new Date().toISOString().slice(0, 10),
  };
  const idx = items.findIndex((x) => x.slug === original);
  if (idx >= 0) items[idx] = registro; else items.push(registro);
  guardar('proveedores.json', items);
  return { ok: true, slug };
}

function vistaEditarPropiedad(slug) {
  const items = leer('propiedades.json');
  const proveedores = leer('proveedores.json');
  const departamentos = leer('departamentos.json');
  const comprobaciones = leer('comprobaciones.json');
  const inm = items.find((x) => x.slug === slug) || {
    slug: '', titulo: '', tipo: 'casa', estado: 'no_verificado', precio: null,
    departamento: '', ciudad: '', sector: '', areaTerrenoV2: null, areaConstruccionM2: null,
    habitaciones: null, banos: null, descripcion: '', caracteristicas: [], fotos: [],
    vendedor: { tipo: 'particular', proveedor: null, nombre: '', whatsapp: '' }, verificacion: null,
  };
  const v = inm.verificacion || { fecha: '', revisadoPor: '', comprobaciones: [], noRevisado: [] };
  const valorDe = (t) => v.comprobaciones.find((c) => c.tipo === t) || { estado: 'no_aplica', detalle: '', fuente: '' };
  const tipos = ['propiedad_registral', 'vendedor_es_titular', 'direccion_fisica'];
  const bloques = tipos.map((t) => {
    const c = valorDe(t);
    return `<fieldset><legend>${e(comprobaciones[t].nombre)}</legend>
      <p class="ayuda">${e(comprobaciones[t].significa)}</p>
      <div class="campo">${selectEstadoCheck(`check_${t}_estado`, c.estado)}</div>
      <div class="campo"><label>Que se comprobo exactamente (se publica)</label>
        <input name="check_${t}_detalle" value="${e(c.detalle)}"></div>
      <div class="campo"><label>Fuente (se publica)</label>
        <input name="check_${t}_fuente" value="${e(c.fuente)}" placeholder="${e(comprobaciones[t].fuenteTipica || '')}"></div>
    </fieldset>`;
  }).join('');
  const ven = inm.vendedor || {};

  return marco('Editar propiedad', `
    <h1>${inm.slug ? 'Editar' : 'Nueva'} propiedad</h1>
    <form method="post" action="/propiedades/guardar">
      <input type="hidden" name="slug_original" value="${e(inm.slug)}">
      <div class="campo"><label>Titulo *</label><input name="titulo" value="${e(inm.titulo)}" required></div>
      <div class="campo"><label>Slug (URL). Vacio = se genera del titulo</label><input name="slug" value="${e(inm.slug)}"></div>
      <div class="campo"><label>Tipo *</label><select name="tipo">
        ${[['casa', 'Casa'], ['lote', 'Lote'], ['proyecto', 'Proyecto en construccion']].map(([va, t]) =>
          `<option value="${va}"${inm.tipo === va ? ' selected' : ''}>${t}</option>`).join('')}
      </select></div>
      <div class="campo"><label>Precio (solo el numero; vacio = no publicado)</label>
        <input name="precio_monto" value="${e(inm.precio ? inm.precio.monto : '')}"></div>
      <div class="campo"><label>Moneda</label><select name="precio_moneda">
        <option value="USD"${inm.precio && inm.precio.moneda === 'USD' ? ' selected' : ''}>USD</option>
        <option value="HNL"${inm.precio && inm.precio.moneda === 'HNL' ? ' selected' : ''}>Lempiras</option>
      </select></div>
      <div class="campo"><label>Departamento *</label><select name="departamento" required>
        <option value="">-</option>
        ${departamentos.map((d) => `<option${inm.departamento === d ? ' selected' : ''}>${e(d)}</option>`).join('')}
      </select></div>
      <div class="campo"><label>Ciudad</label><input name="ciudad" value="${e(inm.ciudad)}"></div>
      <div class="campo"><label>Sector o colonia</label><input name="sector" value="${e(inm.sector)}"></div>
      <div class="campo"><label>Terreno (v2)</label><input name="areaTerrenoV2" value="${e(inm.areaTerrenoV2 == null ? '' : inm.areaTerrenoV2)}"></div>
      <div class="campo"><label>Construccion (m2)</label><input name="areaConstruccionM2" value="${e(inm.areaConstruccionM2 == null ? '' : inm.areaConstruccionM2)}"></div>
      <div class="campo"><label>Habitaciones</label><input name="habitaciones" value="${e(inm.habitaciones == null ? '' : inm.habitaciones)}"></div>
      <div class="campo"><label>Banos</label><input name="banos" value="${e(inm.banos == null ? '' : inm.banos)}"></div>
      <div class="campo"><label>Descripcion</label><textarea name="descripcion">${e(inm.descripcion)}</textarea></div>
      <div class="campo"><label>Caracteristicas (una por linea)</label>
        <textarea name="caracteristicas">${e((inm.caracteristicas || []).join('\n'))}</textarea></div>
      <div class="campo"><label>Fotos: rutas dentro de /img/ (una por linea)</label>
        <textarea name="fotos">${e((inm.fotos || []).map((f) => (typeof f === 'string' ? f : f.src)).join('\n'))}</textarea></div>

      <h2>Vendedor</h2>
      <div class="campo"><label>Proveedor del directorio (opcional)</label><select name="vendedor_proveedor">
        <option value="">- vendedor particular -</option>
        ${proveedores.map((p) => `<option value="${e(p.slug)}"${ven.proveedor === p.slug ? ' selected' : ''}>${e(p.nombre)}</option>`).join('')}
      </select></div>
      <div class="campo"><label>Nombre del vendedor</label><input name="vendedor_nombre" value="${e(ven.nombre || '')}"></div>
      <div class="campo"><label>WhatsApp del vendedor</label><input name="vendedor_whatsapp" value="${e(ven.whatsapp || '')}"></div>

      <h2>Verificacion registral</h2>
      <div class="aviso-sin-verificar"><p>Solo marque verificado si de verdad consulto el
      registro. Se publica la fecha de la consulta.</p></div>
      <div class="campo"><label>Estado</label><select name="estado">
        <option value="no_verificado"${inm.estado !== 'verificado' ? ' selected' : ''}>Sin verificar</option>
        <option value="verificado"${inm.estado === 'verificado' ? ' selected' : ''}>Verificado</option>
      </select></div>
      <div class="campo"><label>Fecha de la consulta (AAAA-MM-DD)</label><input name="v_fecha" value="${e(v.fecha)}"></div>
      <div class="campo"><label>Quien reviso</label><input name="v_revisadoPor" value="${e(v.revisadoPor)}"></div>
      ${bloques}
      <div class="campo"><label>Lo que NO se reviso (uno por linea) *</label>
        <textarea name="v_noRevisado">${e((v.noRevisado || []).join('\n'))}</textarea></div>

      <div class="fila">
        <button class="boton" type="submit">Guardar</button>
        ${inm.slug ? `<button class="boton boton--alerta" type="submit" name="accion" value="borrar"
          onclick="return confirm('Borrar esta propiedad?')">Borrar</button>` : ''}
      </div>
    </form>`);
}

const numero = (x) => (String(x || '').trim() === '' ? null : Number(String(x).replace(/[^0-9.]/g, '')));

function guardarPropiedad(cuerpo) {
  const items = leer('propiedades.json');
  const original = cuerpo.slug_original;
  if (cuerpo.accion === 'borrar') {
    guardar('propiedades.json', items.filter((x) => x.slug !== original));
    return { ok: true };
  }
  const tipos = ['propiedad_registral', 'vendedor_es_titular', 'direccion_fisica'];
  const checks = recogerChecks(cuerpo, tipos);
  const verificado = cuerpo.estado === 'verificado';
  const confirmadas = checks.filter((c) => c.estado === 'confirmado' && c.detalle);
  if (verificado && (confirmadas.length === 0 || !cuerpo.v_fecha || !cuerpo.v_revisadoPor || !lineas(cuerpo.v_noRevisado).length)) {
    return { ok: false, error: 'Para marcar VERIFICADO hace falta: al menos una comprobacion confirmada con detalle, la fecha de la consulta, quien reviso, y la lista de lo que NO se reviso.' };
  }
  const monto = numero(cuerpo.precio_monto);
  const proveedorSlug = cuerpo.vendedor_proveedor || null;
  const registro = {
    slug: slugificar(cuerpo.slug || cuerpo.titulo),
    titulo: cuerpo.titulo,
    tipo: cuerpo.tipo,
    estado: verificado ? 'verificado' : 'no_verificado',
    precio: monto ? { monto, moneda: cuerpo.precio_moneda || 'USD' } : null,
    departamento: cuerpo.departamento,
    ciudad: cuerpo.ciudad || '',
    sector: cuerpo.sector || '',
    areaTerrenoV2: numero(cuerpo.areaTerrenoV2),
    areaConstruccionM2: numero(cuerpo.areaConstruccionM2),
    habitaciones: numero(cuerpo.habitaciones),
    banos: numero(cuerpo.banos),
    descripcion: cuerpo.descripcion || '',
    caracteristicas: lineas(cuerpo.caracteristicas),
    fotos: lineas(cuerpo.fotos).map((src) => ({ src, alt: cuerpo.titulo })),
    vendedor: {
      tipo: proveedorSlug ? 'proveedor' : 'particular',
      proveedor: proveedorSlug,
      nombre: cuerpo.vendedor_nombre || '',
      whatsapp: String(cuerpo.vendedor_whatsapp || '').replace(/[^0-9]/g, ''),
    },
    verificacion: verificado ? {
      fecha: cuerpo.v_fecha,
      revisadoPor: cuerpo.v_revisadoPor,
      comprobaciones: checks,
      noRevisado: lineas(cuerpo.v_noRevisado),
    } : null,
    publicado: (items.find((x) => x.slug === original) || {}).publicado || new Date().toISOString().slice(0, 10),
  };
  const idx = items.findIndex((x) => x.slug === original);
  if (idx >= 0) items[idx] = registro; else items.push(registro);
  guardar('propiedades.json', items);
  return { ok: true };
}

function vistaReportes() {
  const reportes = leerReportes().slice().reverse();
  const proveedores = leer('proveedores.json');
  const propiedades = leer('propiedades.json');
  const nombreDe = (ref) => (proveedores.find((p) => p.slug === ref) || propiedades.find((p) => p.slug === ref) || {}).nombre || ref;

  return marco('Reportes', `<h1>Reportes</h1>
    <p class="ayuda">Los reportes llegan aquí si Make.com los reenvía a
    <code>POST /webhook/reporte</code>. También se pueden anotar a mano.</p>
    ${reportes.length === 0 ? '<p>No hay reportes registrados.</p>' : reportes.map((r) => `
      <div class="tarjeta">
        <p><strong>${e(nombreDe(r.ref))}</strong> — ${e(r.motivo || 'sin motivo')} ·
        ${e(r.recibido || '')} · estado: <strong>${e(r.estado)}</strong></p>
        <p>${e(r.detalle || '')}</p>
        ${r.contacto ? `<p class="ayuda">Contacto: ${e(r.contacto)}</p>` : '<p class="ayuda">Reporte anónimo.</p>'}
        ${r.nota ? `<p class="ayuda">Nota interna: ${e(r.nota)}</p>` : ''}
        <form method="post" action="/reportes/estado" class="fila">
          <input type="hidden" name="id" value="${e(r.id)}">
          <select name="estado">
            ${['nuevo', 'revisando', 'resuelto', 'sin_fundamento'].map((s) =>
              `<option value="${s}"${r.estado === s ? ' selected' : ''}>${s}</option>`).join('')}
          </select>
          <input name="nota" placeholder="Nota interna" value="">
          <button class="boton" type="submit">Actualizar</button>
        </form>
      </div>`).join('')}
    <div class="tarjeta"><h2>Anotar un reporte a mano</h2>
      <form method="post" action="/reportes/nuevo">
        <div class="campo"><label>Slug del anuncio</label><input name="ref" required></div>
        <div class="campo"><label>Motivo</label><input name="motivo"></div>
        <div class="campo"><label>Detalle</label><textarea name="detalle"></textarea></div>
        <div class="campo"><label>Contacto (opcional)</label><input name="contacto"></div>
        <button class="boton" type="submit">Guardar reporte</button>
      </form></div>`);
}

function nuevoReporte(datos) {
  const reportes = leerReportes();
  reportes.push({
    id: crypto.randomUUID(),
    recibido: new Date().toISOString(),
    ref: datos.ref || '',
    tipo: datos.tipo || '',
    motivo: datos.motivo || '',
    detalle: datos.detalle || '',
    contacto: datos.contacto || '',
    estado: 'nuevo',
    nota: '',
  });
  guardar('reportes.json', reportes);
}

// ------------------------------------------------------------------ servidor
const servidor = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const ruta = url.pathname;

  // Webhook público (para que Make.com reenvíe los reportes). Requiere token.
  if (ruta === '/webhook/reporte' && req.method === 'POST') {
    const datos = await cuerpoForm(req);
    const token = url.searchParams.get('token') || datos.token;
    if (!TOKEN_WEBHOOK || token !== TOKEN_WEBHOOK) {
      res.writeHead(403); return res.end('token inválido');
    }
    nuevoReporte(datos);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end('{"ok":true}');
  }

  if (ruta === '/entrar' && req.method === 'POST') {
    const cuerpo = await cuerpoForm(req);
    if (CLAVE && cuerpo.clave === CLAVE) {
      const sid = crypto.randomBytes(24).toString('hex');
      sesiones.add(sid);
      return redirigir(res, '/', `admin_sesion=${sid}; HttpOnly; SameSite=Strict; Path=/`);
    }
    res.writeHead(401, { 'Content-Type': 'text/html; charset=utf-8' });
    return res.end(vistaLogin('Clave incorrecta.'));
  }

  if (!autorizado(req)) {
    res.writeHead(ruta === '/' ? 200 : 401, { 'Content-Type': 'text/html; charset=utf-8' });
    return res.end(vistaLogin(CLAVE ? '' : 'No hay clave configurada. Arranque con ADMIN_CLAVE="algo largo".'));
  }

  try {
    if (ruta === '/') { res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' }); return res.end(vistaResumen()); }
    if (ruta === '/proveedores') { res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' }); return res.end(vistaLista('proveedores')); }
    if (ruta === '/propiedades') { res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' }); return res.end(vistaLista('propiedades')); }
    if (ruta === '/proveedores/editar') {
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      return res.end(vistaEditarProveedor(url.searchParams.get('slug') || ''));
    }
    if (ruta === '/proveedores/guardar' && req.method === 'POST') {
      const r = guardarProveedor(await cuerpoForm(req));
      if (!r.ok) {
        res.writeHead(400, { 'Content-Type': 'text/html; charset=utf-8' });
        return res.end(marco('Error', `<div class="aviso-sin-verificar"><p>${e(r.error)}</p></div>
          <p><a href="javascript:history.back()">Volver</a></p>`));
      }
      return redirigir(res, '/proveedores');
    }
    if (ruta === '/propiedades/editar') {
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      return res.end(vistaEditarPropiedad(url.searchParams.get('slug') || ''));
    }
    if (ruta === '/propiedades/guardar' && req.method === 'POST') {
      const r = guardarPropiedad(await cuerpoForm(req));
      if (!r.ok) {
        res.writeHead(400, { 'Content-Type': 'text/html; charset=utf-8' });
        return res.end(marco('Error', `<div class="aviso-sin-verificar"><p>${e(r.error)}</p></div>
          <p><a href="javascript:history.back()">Volver</a></p>`));
      }
      return redirigir(res, '/propiedades');
    }
    if (ruta === '/reportes') { res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' }); return res.end(vistaReportes()); }
    if (ruta === '/reportes/nuevo' && req.method === 'POST') { nuevoReporte(await cuerpoForm(req)); return redirigir(res, '/reportes'); }
    if (ruta === '/reportes/estado' && req.method === 'POST') {
      const cuerpo = await cuerpoForm(req);
      const reportes = leerReportes();
      const r = reportes.find((x) => x.id === cuerpo.id);
      if (r) { r.estado = cuerpo.estado; if (cuerpo.nota) r.nota = ((r.nota ? r.nota + ' | ' : '') + cuerpo.nota); }
      guardar('reportes.json', reportes);
      return redirigir(res, '/reportes');
    }
    if (ruta === '/publicar' && req.method === 'POST') {
      const salida = spawnSync(process.execPath, ['build.js'], { cwd: ROOT, encoding: 'utf8' });
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      return res.end(marco('Publicar', `<h1>Resultado</h1>
        <pre>${e((salida.stdout || '') + (salida.stderr || ''))}</pre><p><a href="/">Volver</a></p>`));
    }
    res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(marco('No encontrado', '<h1>No encontrado</h1>'));
  } catch (err) {
    res.writeHead(500, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(marco('Error', `<h1>Error</h1><pre>${e(err.stack)}</pre>`));
  }
});

servidor.listen(PUERTO, HOST, () => {
  if (!CLAVE) console.log('⚠ Sin ADMIN_CLAVE: nadie puede entrar. Arranque con ADMIN_CLAVE="algo largo".');
  console.log(`→ Admin en http://${HOST}:${PUERTO}`);
});
