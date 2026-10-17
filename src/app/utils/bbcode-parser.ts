
function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function validUrl(s: string): string {
  const t = s.trim();
  if (/^https?:\/\//i.test(t)) return t;
  if (t.startsWith('/')) return t;
  if (/^[a-z][a-z0-9+\-.]*:/i.test(t)) return ''; // reject non-http(s) schemes
  return 'https://' + t;
}

// Named attr: key=value or key="value" or key='value'
function getNamedAttr(rawAttrs: string, key: string): string | undefined {
  const re = new RegExp(
    '(?:^|\\s)' + key + '=(?:"([^"]*)"|\'([^\']*)\'|(\\S+))',
    'i'
  );
  const m = re.exec(rawAttrs);
  if (!m) return undefined;
  return m[1] ?? m[2] ?? m[3] ?? '';
}

interface Token {
  type: 'text' | 'open' | 'close';
  text?: string;
  tag?: string;
  value?: string;    // [tag=VALUE]
  rawAttrs?: string; // everything after tag name inside brackets
}

// Tag regex: [/tagname rest] or [tagname rest]
// rest may be: empty | =value | =value attr=val | attr=val attr2=val2
const TAG_RE = /\[(\/?)([\w*-]+)([^\]]*)\]/g;

function tokenize(input: string): Token[] {
  const tokens: Token[] = [];
  TAG_RE.lastIndex = 0;
  let last = 0;
  let m: RegExpExecArray | null;

  while ((m = TAG_RE.exec(input)) !== null) {
    if (m.index > last) {
      tokens.push({ type: 'text', text: input.slice(last, m.index) });
    }

    const isClose = m[1] === '/';
    const tag = m[2].toLowerCase();
    const rest = (m[3] ?? '').trim();

    if (isClose) {
      tokens.push({ type: 'close', tag });
    } else {
      let value = '';
      let rawAttrs = rest;
      if (rest.startsWith('=')) {
        const inner = rest.slice(1);
        if (inner.startsWith('"')) {
          const end = inner.indexOf('"', 1);
          value = end >= 0 ? inner.slice(1, end) : inner.slice(1);
        } else if (inner.startsWith("'")) {
          const end = inner.indexOf("'", 1);
          value = end >= 0 ? inner.slice(1, end) : inner.slice(1);
        } else {
          // value may be followed by named attrs: =foo bar=baz
          const spaceIdx = inner.search(/\s/);
          if (spaceIdx >= 0) {
            value = inner.slice(0, spaceIdx);
            rawAttrs = inner.slice(spaceIdx + 1);
          } else {
            value = inner;
            rawAttrs = '';
          }
        }
      }
      tokens.push({ type: 'open', tag, value, rawAttrs });
    }

    last = m.index + m[0].length;
  }

  if (last < input.length) {
    tokens.push({ type: 'text', text: input.slice(last) });
  }

  return tokens;
}

interface StackFrame {
  tag: string;
  value: string;
  rawAttrs: string;
  parts: string[]; // collected inner HTML pieces
}

function renderTokens(tokens: Token[]): string {
  const stack: StackFrame[] = [];
  // Root frame collects the top-level output
  stack.push({ tag: '__root__', value: '', rawAttrs: '', parts: [] });

  const current = () => stack[stack.length - 1];
  const emit = (s: string) => current().parts.push(s);

  const insideCode = () => stack.some(f => f.tag === 'code');
  const insideList = () => {
    for (let i = stack.length - 1; i >= 0; i--) {
      const t = stack[i].tag;
      if (t === 'ul' || t === 'list' || t === 'ol') return true;
    }
    return false;
  };

  for (const tok of tokens) {
    if (tok.type === 'text') {
      const escaped = escapeHtml(tok.text!);
      // Inside [code], preserve newlines as-is (pre element handles them)
      emit(insideCode() ? escaped : escaped.replace(/\n/g, '<br>'));

    } else if (tok.type === 'open') {
      const tag = tok.tag!;
      const value = tok.value!;
      const rawAttrs = tok.rawAttrs!;

      switch (tag) {
        case 'b':
        case 'i':
        case 'u':
        case 's':
        case 'center':
        case 'left':
        case 'right':
        case 'ul':
        case 'list':
        case 'ol':
        case 'li':
        case '*':
        case 'spoiler':
        case 'quote':
        case 'url':
        case 'color':
        case 'size':
        case 'font':
        case 'code':
        case 'align':
        case 'float':
        case 'div':
        case 'span':
        case 'table':
        case 'tr':
        case 'td':
        case 'grid':
        case 'grid-item':
          stack.push({ tag, value, rawAttrs, parts: [] });
          break;
        case 'img': {
          // Self-closing: [img]url[/img] or [img=url]
          // We collect content and close immediately when we see [/img].
          // For [img=url], emit immediately since there's no inner text needed.
          if (value) {
            const src = validUrl(value);
            if (src) {
              emit(`<img src="${escapeHtml(src)}" loading="lazy" referrerpolicy="no-referrer">`);
            }
          } else {
            stack.push({ tag, value, rawAttrs, parts: [] });
          }
          break;
        }
        default:
          // Unknown tag — emit as escaped text
          emit(escapeHtml(`[${tag}${rawAttrs ? (rawAttrs.startsWith('=') ? rawAttrs : ' ' + rawAttrs) : ''}]`));
      }

    } else if (tok.type === 'close') {
      const tag = tok.tag!;

      // Find matching open tag on the stack
      let matchIdx = -1;
      for (let i = stack.length - 1; i >= 1; i--) {
        const ft = stack[i].tag;
        if (ft === tag || (tag === 'li' && ft === '*') || (tag === '*' && ft === 'li') ||
            (tag === 'list' && ft === 'ul') || (tag === 'ul' && ft === 'list')) {
          matchIdx = i;
          break;
        }
      }

      if (matchIdx < 0) {
        // No matching open tag — emit as escaped text
        emit(escapeHtml(`[/${tag}]`));
        continue;
      }

      // Close all frames above the match (unclosed inner tags)
      while (stack.length - 1 > matchIdx) {
        const orphan = stack.pop()!;
        // Re-emit the opening tag as escaped text, then its collected content
        const rootFallback = escapeHtml(`[${orphan.tag}]`) + orphan.parts.join('');
        current().parts.push(rootFallback);
      }

      const frame = stack.pop()!;
      const inner = frame.parts.join('');

      const html = closeTag(frame.tag, frame.value, frame.rawAttrs, inner);
      emit(html);
    }
  }

  // Flush unclosed tags
  while (stack.length > 1) {
    const orphan = stack.pop()!;
    const fallback = escapeHtml(`[${orphan.tag}]`) + orphan.parts.join('');
    current().parts.push(fallback);
  }

  return stack[0].parts.join('');
}

function closeTag(tag: string, value: string, rawAttrs: string, inner: string): string {
  switch (tag) {
    case 'b': return `<strong>${inner}</strong>`;
    case 'i': return `<em>${inner}</em>`;
    case 'u': return `<u>${inner}</u>`;
    case 's': return `<s>${inner}</s>`;

    case 'center': return `<div style="text-align: center;">${inner}</div>`;
    case 'left':   return `<div style="text-align: left;">${inner}</div>`;
    case 'right':  return `<div style="text-align: right;">${inner}</div>`;
    case 'align': {
      const dir = value === 'left' || value === 'center' || value === 'right' ? value : null;
      if (!dir) return inner;
      return `<div style="text-align: ${dir};">${inner}</div>`;
    }
    case 'float': {
      const dir = value === 'left' || value === 'right' ? value : null;
      if (!dir) return inner;
      return `<div style="float: ${dir};">${inner}</div>`;
    }

    case 'ul':
    case 'list': return `<ul>${inner}</ul>`;
    case 'ol':   return `<ol>${inner}</ol>`;
    case 'li':
    case '*':    return `<li>${inner}</li>`;

    case 'code': return `<pre>${inner}</pre>`;

    case 'url': {
      let href = value || inner.replace(/<[^>]*>/g, '').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"');
      const safe = validUrl(href);
      if (!safe) return inner;
      const target = getNamedAttr(rawAttrs, 'target') === '_blank' ? ' target="_blank"' : '';
      const display = value ? inner : escapeHtml(href);
      return `<a href="${escapeHtml(safe)}"${target}>${display}</a>`;
    }

    case 'img': {
      const rawSrc = inner.replace(/<[^>]*>/g, '').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"');
      const src = validUrl(rawSrc.trim());
      if (!src) return '';
      const widthAttr = getNamedAttr(rawAttrs, 'width');
      const heightAttr = getNamedAttr(rawAttrs, 'height');
      const w = widthAttr && /^\d+$/.test(widthAttr) ? ` width="${widthAttr}"` : '';
      const h = heightAttr && /^\d+$/.test(heightAttr) ? ` height="${heightAttr}"` : '';
      return `<img src="${escapeHtml(src)}"${w}${h} loading="lazy" referrerpolicy="no-referrer">`;
    }

    case 'color': {
      if (!value) return inner;
      // Allow only safe color values: named colors, #hex, rgb(), hsl()
      const safe = /^(#[0-9a-fA-F]{3,8}|[a-zA-Z]{2,30}|rgb\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*\)|rgba\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*,\s*[\d.]+\s*\)|hsl\(\s*\d+\s*,\s*[\d.]+%\s*,\s*[\d.]+%\s*\))$/.test(value);
      if (!safe) return inner;
      return `<span style="color: ${value};">${inner}</span>`;
    }

    case 'size': {
      const n = parseInt(value, 10);
      if (isNaN(n) || n < 0 || n > 32) return inner;
      return `<span style="font-size: ${n}px;">${inner}</span>`;
    }

    case 'font': {
      const allowed: Record<string, boolean> = {
        'serif': true, 'sans-serif': true, 'monospace': true, 'cursive': true,
        'fantasy': true, 'system-ui': true, 'arial': true, 'helvetica': true,
        'verdana': true, 'tahoma': true, 'trebuchet ms': true, 'gill sans': true,
        'times new roman': true, 'georgia': true, 'garamond': true, 'palatino': true,
        'courier new': true, 'lucida console': true, 'monaco': true,
        'comic sans ms': true, 'impact': true, 'arial black': true,
      };
      if (!allowed[value.toLowerCase()]) return inner;
      return `<span style="font-family: ${value};">${inner}</span>`;
    }

    case 'spoiler': {
      const title = escapeHtml(value || 'Spoiler');
      return `<spoiler-box data-title="${title}">${inner}</spoiler-box>`;
    }

    case 'quote': {
      const author = value ? escapeHtml(value) : '';
      const topicId = getNamedAttr(rawAttrs, 'topic-id');
      const postId = getNamedAttr(rawAttrs, 'post-id');
      let cite: string;
      if (author && topicId && postId && /^\d+$/.test(topicId) && /^\d+$/.test(postId)) {
        cite = `<cite><a href="/viewtopic/${topicId}?post_id=${postId}">${author}</a> said:</cite>`;
      } else if (author) {
        cite = `<cite>${author} said:</cite>`;
      } else {
        cite = `<cite>Quote</cite>`;
      }
      return `<blockquote>${cite}${inner}</blockquote>`;
    }

    case 'div': {
      const id = getNamedAttr(rawAttrs, 'id');
      const cls = getNamedAttr(rawAttrs, 'class');
      const style = buildSafeStyle(rawAttrs);
      const idAttr = id ? ` id="${escapeHtml(id)}"` : '';
      const clsAttr = cls ? ` class="${escapeHtml(cls)}"` : '';
      const styleAttr = style ? ` style="${style}"` : '';
      return `<div${idAttr}${clsAttr}${styleAttr}>${inner}</div>`;
    }

    case 'span': {
      const style = buildSafeStyle(rawAttrs);
      return style ? `<span style="${style}">${inner}</span>` : `<span>${inner}</span>`;
    }

    case 'table': return `<table style="border-collapse: collapse;">${inner}</table>`;
    case 'tr':    return `<tr>${inner}</tr>`;
    case 'td': {
      const widthAttr = getNamedAttr(rawAttrs, 'width');
      const colspan = getNamedAttr(rawAttrs, 'colspan');
      const rowspan = getNamedAttr(rawAttrs, 'rowspan');
      const style = widthAttr && /^[a-zA-Z0-9.%\-]+$/.test(widthAttr) ? ` style="width: ${widthAttr};"` : '';
      const cs = colspan && /^\d+$/.test(colspan) ? ` colspan="${colspan}"` : '';
      const rs = rowspan && /^\d+$/.test(rowspan) ? ` rowspan="${rowspan}"` : '';
      return `<td${style}${cs}${rs}>${inner}</td>`;
    }

    case 'grid': {
      let style = 'display: grid; max-width: 100%;';
      const cols = getNamedAttr(rawAttrs, 'columns');
      const rows = getNamedAttr(rawAttrs, 'rows');
      const gap = getNamedAttr(rawAttrs, 'gap');
      const width = getNamedAttr(rawAttrs, 'width');
      if (cols && /^\d+$/.test(cols) && +cols >= 1 && +cols <= 12)
        style += ` grid-template-columns: repeat(${cols}, 1fr);`;
      if (rows && /^\d+$/.test(rows) && +rows >= 1 && +rows <= 12)
        style += ` grid-template-rows: repeat(${rows}, 1fr);`;
      if (gap && /^[a-zA-Z0-9.%\-]+$/.test(gap)) style += ` gap: ${gap};`;
      if (width && /^[a-zA-Z0-9.%\-]+$/.test(width)) style += ` width: ${width};`;
      return `<div class="grid" style="${style}">${inner}</div>`;
    }

    case 'grid-item': {
      let style = 'min-width: 0;';
      const col = getNamedAttr(rawAttrs, 'col');
      const row = getNamedAttr(rawAttrs, 'row');
      const colSpan = getNamedAttr(rawAttrs, 'col-span');
      const rowSpan = getNamedAttr(rawAttrs, 'row-span');
      if (col && /^\d+$/.test(col) && +col >= 1 && +col <= 12)
        style += ` grid-column-start: ${col};`;
      if (row && /^\d+$/.test(row) && +row >= 1 && +row <= 12)
        style += ` grid-row-start: ${row};`;
      if (colSpan && /^\d+$/.test(colSpan) && +colSpan >= 1 && +colSpan <= 12)
        style += ` grid-column-end: span ${colSpan};`;
      if (rowSpan && /^\d+$/.test(rowSpan) && +rowSpan >= 1 && +rowSpan <= 12)
        style += ` grid-row-end: span ${rowSpan};`;
      return `<div style="${style}">${inner}</div>`;
    }

    default:
      return escapeHtml(`[${tag}]`) + inner + escapeHtml(`[/${tag}]`);
  }
}

const ALLOWED_STYLE_PROPS: Record<string, ((v: string) => boolean) | true> = {
  'border':          true,
  'background':      true,
  'width':           v => /^[a-zA-Z0-9.%\-]+$/.test(v),
  'height':          v => /^[a-zA-Z0-9.%\-]+$/.test(v),
  'max-height':      v => /^[a-zA-Z0-9.%\-]+$/.test(v),
  'min-height':      v => /^[a-zA-Z0-9.%\-]+$/.test(v),
  'max-width':       v => /^[a-zA-Z0-9.%\-]+$/.test(v),
  'min-width':       v => /^[a-zA-Z0-9.%\-]+$/.test(v),
  'display':         v => ['inline','block','inline-block','flex'].includes(v),
  'color':           true,
  'font-family':     true,
  'font-style':      true,
  'text-decoration': true,
  'text-shadow':     true,
  'text-align':      v => ['left','right','center','justify'].includes(v),
  'text-transform':  v => ['none','uppercase','lowercase','capitalize'].includes(v),
  'padding':         true,
  'margin':          true,
  'flex-direction':  v => ['row','row-reverse','column','column-reverse'].includes(v),
  'gap':             true,
  'line-height':     true,
  'float':           v => ['left','right','none'].includes(v),
};

const UNSAFE_CSS_RE = /javascript\s*:|expression\s*\(|behavior\s*:|vbscript\s*:|-moz-binding/i;

function buildSafeStyle(rawAttrs: string): string {
  // Extract style="..." from rawAttrs
  const m = /style=(?:"([^"]*)"|'([^']*)'|([\S]+))/i.exec(rawAttrs);
  if (!m) return '';
  const raw = (m[1] ?? m[2] ?? m[3] ?? '').trim();
  if (!raw || UNSAFE_CSS_RE.test(raw)) return '';

  const parts: string[] = [];
  for (const decl of raw.split(';')) {
    const colon = decl.indexOf(':');
    if (colon < 0) continue;
    const prop = decl.slice(0, colon).trim().toLowerCase();
    const val = decl.slice(colon + 1).trim();
    if (!val) continue;
    const rule = ALLOWED_STYLE_PROPS[prop];
    if (!rule) continue;
    if (rule === true || rule(val)) {
      parts.push(`${prop}: ${val}`);
    }
  }
  return parts.join('; ');
}

// Strip newlines between adjacent structural tags (matches backend preprocessing)
const STRUCTURAL_NEWLINE_RE = /(\[\/?(table|tr|td|grid(?:-item)?)(?:[^\]]*)\])[ \t]*\n[ \t]*(?=\[\/?(table|tr|td|grid(?:-item)?))/gi;

export function parseBBCode(input: string): string {
  // Collapse newlines between structural tags (same as backend)
  let text = input;
  let prev: string;
  do {
    prev = text;
    text = text.replace(STRUCTURAL_NEWLINE_RE, '$1');
  } while (text !== prev);

  return renderTokens(tokenize(text));
}
