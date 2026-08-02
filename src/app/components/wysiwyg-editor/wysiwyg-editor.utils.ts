// HTML produced by contenteditable → BB code
export function htmlToBbCode(html: string): string {
  const div = document.createElement('div');
  div.innerHTML = html;
  return processContainer(div).trim();
}

// Walk the top-level children, inserting a newline before block elements when needed
function processContainer(el: Element): string {
  let result = '';
  for (const child of Array.from(el.childNodes)) {
    const tag = (child as HTMLElement).tagName?.toLowerCase();
    const isBlock = child.nodeType === Node.ELEMENT_NODE &&
      ['div', 'p', 'blockquote', 'pre'].includes(tag ?? '');
    if (isBlock && result && !result.endsWith('\n')) {
      result += '\n';
    }
    result += nodeToText(child);
  }
  return result;
}

function nodeToText(node: Node): string {
  if (node.nodeType === Node.TEXT_NODE) return node.textContent ?? '';
  if (node.nodeType !== Node.ELEMENT_NODE) return '';

  const el = node as HTMLElement;
  const tag = el.tagName.toLowerCase();
  const inner = (): string => Array.from(el.childNodes).map(nodeToText).join('');

  switch (tag) {
    case 'br': return '\n';
    case 'b': case 'strong': return `[b]${inner()}[/b]`;
    case 'i': case 'em':     return `[i]${inner()}[/i]`;
    case 'u':                return `[u]${inner()}[/u]`;
    case 's': case 'del': case 'strike': return `[s]${inner()}[/s]`;

    case 'img': {
      const src = (el as HTMLImageElement).getAttribute('src') ?? '';
      return src ? `[img]${src}[/img]` : '';
    }
    case 'a': {
      const href = (el as HTMLAnchorElement).getAttribute('href') ?? '';
      return href ? `[url=${href}]${inner()}[/url]` : inner();
    }
    case 'blockquote': {
      const author = el.getAttribute('data-author') ?? '';
      return author
        ? `[quote=${author}]${inner()}[/quote]\n`
        : `[quote]${inner()}[/quote]\n`;
    }
    case 'pre': return `[code]${el.textContent ?? ''}[/code]\n`;

    case 'font': {
      let r = inner();
      const color = el.getAttribute('color');
      const face  = el.getAttribute('face');
      if (color) r = `[color=${color}]${r}[/color]`;
      if (face)  r = `[font=${face}]${r}[/font]`;
      return r;
    }
    case 'span': {
      let r = inner();
      const s = el.style;
      if (s.color)      r = `[color=${s.color}]${r}[/color]`;
      if (s.fontFamily) r = `[font=${s.fontFamily.replace(/['"]/g, '')}]${r}[/font]`;
      if (s.fontSize)   r = `[size=${parseInt(s.fontSize)}]${r}[/size]`;
      return r;
    }

    case 'div':
    case 'p': {
      const children = inner();
      // <div><br></div> is an empty line
      const content = (children === '\n' || children === '') ? '' : children;
      const align = el.style.textAlign;
      let result = content;
      if (align === 'center') result = `[center]${result.trimEnd()}[/center]`;
      else if (align === 'right')  result = `[right]${result.trimEnd()}[/right]`;
      else if (align === 'left')   result = `[left]${result.trimEnd()}[/left]`;
      return result + '\n';
    }

    default: return inner();
  }
}

// Basic BB code → HTML for initialising the editor from existing content
export function bbCodeToHtml(bb: string): string {
  if (!bb) return '';
  return bb
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/\[b\]([\s\S]*?)\[\/b\]/g,   '<b>$1</b>')
    .replace(/\[i\]([\s\S]*?)\[\/i\]/g,   '<i>$1</i>')
    .replace(/\[u\]([\s\S]*?)\[\/u\]/g,   '<u>$1</u>')
    .replace(/\[s\]([\s\S]*?)\[\/s\]/g,   '<s>$1</s>')
    .replace(/\[color=([^\]]+)\]([\s\S]*?)\[\/color\]/g, '<font color="$1">$2</font>')
    .replace(/\[font=([^\]]+)\]([\s\S]*?)\[\/font\]/g,   '<font face="$1">$2</font>')
    .replace(/\[size=(\d+)\]([\s\S]*?)\[\/size\]/g,      '<span style="font-size:$1px">$2</span>')
    .replace(/\[url=([^\]]+)\]([\s\S]*?)\[\/url\]/g,     '<a href="$1">$2</a>')
    .replace(/\[img\]([\s\S]*?)\[\/img\]/g,              '<img src="$1">')
    .replace(/\[center\]([\s\S]*?)\[\/center\]/g, '<div style="text-align:center">$1</div>')
    .replace(/\[right\]([\s\S]*?)\[\/right\]/g,   '<div style="text-align:right">$1</div>')
    .replace(/\[left\]([\s\S]*?)\[\/left\]/g,     '<div style="text-align:left">$1</div>')
    .replace(/\[quote=([^\]]+)\]([\s\S]*?)\[\/quote\]/g, '<blockquote data-author="$1">$2</blockquote>')
    .replace(/\[quote\]([\s\S]*?)\[\/quote\]/g,          '<blockquote>$1</blockquote>')
    .replace(/\[code\]([\s\S]*?)\[\/code\]/g,            '<pre>$1</pre>')
    .replace(/\n/g, '<br>');
}
