import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseFrontMatter, renderMarkdown, plainText } from './md.js';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const readJson = (rel) => JSON.parse(fs.readFileSync(path.join(ROOT, rel), 'utf8'));

export const MESES = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
];

export function formatoFecha(iso) {
  if (!iso) return '';
  const [y, m, d] = String(iso).split('-').map(Number);
  if (!y || !m || !d) return String(iso);
  return `${d} de ${MESES[m - 1]} de ${y}`;
}

export function sumarMeses(iso, meses) {
  const [y, m, d] = String(iso).split('-').map(Number);
  const date = new Date(Date.UTC(y, m - 1 + meses, d));
  return date.toISOString().slice(0, 10);
}

export function hoyISO() {
  return (process.env.SITE_FECHA || new Date().toISOString().slice(0, 10)).slice(0, 10);
}

export function formatoPrecio(precio) {
  if (!precio || typeof precio.monto !== 'number') return null;
  const n = precio.monto.toLocaleString('es-HN', { maximumFractionDigits: 0 });
  return precio.moneda === 'HNL' ? `L ${n}` : `US$ ${n}`;
}

export function enlaceWhatsApp(numero, mensaje) {
  if (!numero) return null;
  const limpio = String(numero).replace(/[^0-9]/g, '');
  if (limpio.length < 8) return null;
  return `https://wa.me/${limpio}?text=${encodeURIComponent(mensaje)}`;
}

// Estado real de la verificación, tomando en cuenta el vencimiento.
export function estadoVerificacion(entidad, config, hoy = hoyISO()) {
  const v = entidad.verificacion;
  const confirmadas = v && Array.isArray(v.comprobaciones)
    ? v.comprobaciones.filter((c) => c.estado === 'confirmado')
    : [];
  if (entidad.estado !== 'verificado' || !v || !v.fecha || confirmadas.length === 0) {
    return { clave: 'no_verificado', etiqueta: 'Sin verificar', vence: null };
  }
  const vence = sumarMeses(v.fecha, config.verificacion?.vigenciaMeses ?? 12);
  if (vence < hoy) {
    return { clave: 'vencido', etiqueta: 'Verificación vencida', vence };
  }
  return { clave: 'verificado', etiqueta: 'Verificado', vence };
}

function validarComprobaciones(entidad, comprobaciones, errores, donde) {
  const v = entidad.verificacion;
  if (!v) {
    errores.push(`${donde}: está marcado como "verificado" pero no trae bloque "verificacion". Nadie lleva sello sin revisión.`);
    return;
  }
  const confirmadas = (v.comprobaciones || []).filter((c) => c.estado === 'confirmado');
  if (confirmadas.length === 0) {
    errores.push(`${donde}: está marcado como "verificado" pero no tiene ni una comprobación confirmada.`);
  }
  for (const c of v.comprobaciones || []) {
    if (!comprobaciones[c.tipo]) {
      errores.push(`${donde}: tipo de comprobación desconocido "${c.tipo}" (revisa data/comprobaciones.json)`);
    }
    if (!['confirmado', 'no_confirmado', 'no_aplica', 'pendiente'].includes(c.estado)) {
      errores.push(`${donde}: estado de comprobación inválido "${c.estado}"`);
    }
    if (c.estado === 'confirmado' && !c.detalle) {
      errores.push(`${donde}: la comprobación "${c.tipo}" está confirmada pero no dice qué se comprobó. Sin detalle no se publica.`);
    }
  }
  if (!v.fecha) errores.push(`${donde}: falta la fecha de verificación.`);
  if (!v.revisadoPor) errores.push(`${donde}: falta quién hizo la revisión.`);
  if (!Array.isArray(v.noRevisado) || v.noRevisado.length === 0) {
    errores.push(`${donde}: falta la lista "noRevisado". Todo perfil verificado debe decir qué NO se revisó.`);
  }
}

export function cargarDatos({ dataset = 'real' } = {}) {
  const config = readJson('site.config.json');
  const categorias = readJson('data/categorias.json');
  const comprobaciones = readJson('data/comprobaciones.json');
  const departamentos = readJson('data/departamentos.json');

  const sufijo = dataset === 'ejemplo' ? '.ejemplo' : '';
  const proveedores = readJson(`data/proveedores${sufijo}.json`);
  const propiedades = readJson(`data/propiedades${sufijo}.json`);

  const errores = [];
  const slugsProveedor = new Set();
  const categoriasPorSlug = Object.fromEntries(categorias.map((c) => [c.slug, c]));

  for (const p of proveedores) {
    const donde = `Proveedor "${p.slug || p.nombre || '(sin slug)'}"`;
    if (!p.slug) errores.push(`${donde}: falta slug.`);
    if (slugsProveedor.has(p.slug)) errores.push(`${donde}: slug repetido.`);
    slugsProveedor.add(p.slug);
    if (!p.nombre) errores.push(`${donde}: falta nombre.`);
    if (!categoriasPorSlug[p.categoria]) errores.push(`${donde}: categoría desconocida "${p.categoria}".`);
    if (!p.departamento || !departamentos.includes(p.departamento)) {
      errores.push(`${donde}: departamento inválido "${p.departamento}".`);
    }
    if (p.estado !== 'verificado' && p.estado !== 'no_verificado') {
      errores.push(`${donde}: estado debe ser "verificado" o "no_verificado".`);
    }
    if (p.estado === 'verificado') validarComprobaciones(p, comprobaciones, errores, donde);
  }

  const slugsPropiedad = new Set();
  for (const inm of propiedades) {
    const donde = `Propiedad "${inm.slug || inm.titulo || '(sin slug)'}"`;
    if (!inm.slug) errores.push(`${donde}: falta slug.`);
    if (slugsPropiedad.has(inm.slug)) errores.push(`${donde}: slug repetido.`);
    slugsPropiedad.add(inm.slug);
    if (!inm.titulo) errores.push(`${donde}: falta título.`);
    if (!['casa', 'lote', 'proyecto'].includes(inm.tipo)) {
      errores.push(`${donde}: tipo debe ser "casa", "lote" o "proyecto".`);
    }
    if (!inm.departamento || !departamentos.includes(inm.departamento)) {
      errores.push(`${donde}: departamento inválido "${inm.departamento}".`);
    }
    if (inm.estado !== 'verificado' && inm.estado !== 'no_verificado') {
      errores.push(`${donde}: estado debe ser "verificado" o "no_verificado".`);
    }
    if (inm.vendedor?.proveedor && !slugsProveedor.has(inm.vendedor.proveedor)) {
      errores.push(`${donde}: el vendedor apunta a un proveedor que no existe ("${inm.vendedor.proveedor}").`);
    }
    if (inm.estado === 'verificado') validarComprobaciones(inm, comprobaciones, errores, donde);
  }

  const guias = cargarGuias(errores);

  return {
    config, categorias, categoriasPorSlug, comprobaciones, departamentos,
    proveedores, propiedades, guias, errores, dataset,
  };
}

function cargarGuias(errores) {
  const dir = path.join(ROOT, 'contenido/guias');
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir)
    .filter((f) => f.endsWith('.md'))
    .map((f) => {
      const raw = fs.readFileSync(path.join(dir, f), 'utf8');
      const { data, body } = parseFrontMatter(raw);
      const slug = data.slug || f.replace(/\.md$/, '');
      if (!data.titulo) errores.push(`Guía "${f}": falta "titulo" en el front matter.`);
      if (!data.actualizada) errores.push(`Guía "${f}": falta "actualizada" (fecha) en el front matter.`);
      const { html, indice } = renderMarkdown(body);
      return {
        slug,
        titulo: data.titulo || slug,
        resumen: data.resumen || plainText(body),
        descripcion: data.descripcion || data.resumen || plainText(body),
        actualizada: data.actualizada || '',
        orden: Number(data.orden || 99),
        etiquetas: Array.isArray(data.etiquetas) ? data.etiquetas : [],
        pendiente: Array.isArray(data.pendiente) ? data.pendiente : [],
        archivo: f,
        html, indice,
      };
    })
    .sort((a, b) => a.orden - b.orden || a.titulo.localeCompare(b.titulo, 'es'));
}
