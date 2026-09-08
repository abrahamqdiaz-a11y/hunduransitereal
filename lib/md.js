// Markdown mínimo, sin dependencias. Cubre lo que usan las guías del sitio:
// encabezados, párrafos, listas, citas, líneas, tablas simples, enlaces,
// negrita, cursiva, código y bloques de aviso (:::aviso ... :::).

export function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// Front matter muy simple: clave: valor, y listas con "- ".
export function parseFrontMatter(raw) {
  const text = raw.replace(/^﻿/, '').replace(/\r\n/g, '\n');
  if (!text.startsWith('---')) return { data: {}, body: text };
  const end = text.indexOf('\n---', 3);
  if (end === -1) return { data: {}, body: text };
  const head = text.slice(3, end).trim();
  const body = text.slice(text.indexOf('\n', end + 1) + 1);
  const data = {};
  let currentListKey = null;
  for (const line of head.split('\n')) {
    if (!line.trim() || line.trim().startsWith('#')) continue;
    const item = line.match(/^\s*-\s+(.*)$/);
    if (item && currentListKey) {
      data[currentListKey].push(stripQuotes(item[1].trim()));
      continue;
    }
    const kv = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
    if (!kv) continue;
    const [, key, rawValue] = kv;
    const value = rawValue.trim();
    if (value === '') {
      data[key] = [];
      currentListKey = key;
    } else {
      data[key] = stripQuotes(value);
      currentListKey = null;
    }
  }
  return { data, body };
}

function stripQuotes(v) {
  if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
    return v.slice(1, -1);
  }
  return v;
}

function inline(text) {
  let out = escapeHtml(text);
  out = out.replace(/`([^`]+)`/g, (_, code) => `<code>${code}</code>`);
  out = out.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_, label, href) => {
    const external = /^https?:\/\//.test(href);
    const attrs = external ? ' rel="noopener nofollow" target="_blank"' : '';
    return `<a href="${href}"${attrs}>${label}</a>`;
  });
  out = out.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  out = out.replace(/(^|[\s(])\*([^*\n]+)\*/g, '$1<em>$2</em>');
  return out;
}

export function slugifyHeading(text) {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');
}

// Devuelve { html, indice } donde indice son los encabezados h2 para el sumario.
export function renderMarkdown(src) {
  const lines = src.replace(/\r\n/g, '\n').split('\n');
  const out = [];
  const indice = [];
  let i = 0;

  const closeParagraph = (buffer) => {
    if (buffer.length) {
      out.push(`<p>${inline(buffer.join(' '))}</p>`);
      buffer.length = 0;
    }
  };
  const paragraph = [];

  while (i < lines.length) {
    const line = lines[i];

    if (!line.trim()) { closeParagraph(paragraph); i++; continue; }

    // Bloque de aviso: :::aviso Título opcional
    const callout = line.match(/^:::(aviso|ojo|nota)\s*(.*)$/);
    if (callout) {
      closeParagraph(paragraph);
      const [, tipo, titulo] = callout;
      const inner = [];
      i++;
      while (i < lines.length && !lines[i].startsWith(':::')) { inner.push(lines[i]); i++; }
      i++;
      const { html } = renderMarkdown(inner.join('\n'));
      out.push(
        `<aside class="callout callout--${tipo}">` +
        (titulo ? `<p class="callout__title">${inline(titulo)}</p>` : '') +
        html + '</aside>'
      );
      continue;
    }

    // Código con vallas
    if (line.startsWith('```')) {
      closeParagraph(paragraph);
      const inner = [];
      i++;
      while (i < lines.length && !lines[i].startsWith('```')) { inner.push(lines[i]); i++; }
      i++;
      out.push(`<pre><code>${escapeHtml(inner.join('\n'))}</code></pre>`);
      continue;
    }

    const heading = line.match(/^(#{1,6})\s+(.*)$/);
    if (heading) {
      closeParagraph(paragraph);
      const level = heading[1].length;
      const text = heading[2].trim();
      const id = slugifyHeading(text);
      if (level === 2) indice.push({ id, texto: text });
      out.push(`<h${level} id="${id}">${inline(text)}</h${level}>`);
      i++;
      continue;
    }

    if (/^(---|\*\*\*)\s*$/.test(line)) {
      closeParagraph(paragraph);
      out.push('<hr>');
      i++;
      continue;
    }

    if (/^>\s?/.test(line)) {
      closeParagraph(paragraph);
      const inner = [];
      while (i < lines.length && /^>\s?/.test(lines[i])) { inner.push(lines[i].replace(/^>\s?/, '')); i++; }
      const { html } = renderMarkdown(inner.join('\n'));
      out.push(`<blockquote>${html}</blockquote>`);
      continue;
    }

    if (/^\s*[-*]\s+/.test(line)) {
      closeParagraph(paragraph);
      const items = [];
      while (i < lines.length && /^\s*[-*]\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^\s*[-*]\s+/, ''));
        i++;
      }
      out.push(`<ul>${items.map((t) => `<li>${inline(t)}</li>`).join('')}</ul>`);
      continue;
    }

    if (/^\s*\d+[.)]\s+/.test(line)) {
      closeParagraph(paragraph);
      const items = [];
      while (i < lines.length && /^\s*\d+[.)]\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^\s*\d+[.)]\s+/, ''));
        i++;
      }
      out.push(`<ol>${items.map((t) => `<li>${inline(t)}</li>`).join('')}</ol>`);
      continue;
    }

    paragraph.push(line.trim());
    i++;
  }
  closeParagraph(paragraph);
  return { html: out.join('\n'), indice };
}

// Texto plano para descripciones meta.
export function plainText(src, max = 160) {
  const text = src
    .replace(/^---[\s\S]*?\n---\n/, '')
    .replace(/:::\w+.*$/gm, '')
    .replace(/^#{1,6}\s+.*$/gm, '')
    .replace(/[*_`>#-]/g, '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/\s+/g, ' ')
    .trim();
  if (text.length <= max) return text;
  return text.slice(0, max - 1).replace(/\s+\S*$/, '') + '…';
}
