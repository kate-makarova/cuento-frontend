import { bbCodeToHtml, htmlToBbCode } from './wysiwyg-editor.utils';

// Parse into an inert <template> so injected handlers or images can never run during the test.
function parse(html: string): DocumentFragment {
  const template = document.createElement('template');
  template.innerHTML = html;
  return template.content;
}

function eventHandlerAttributes(fragment: DocumentFragment): string[] {
  return Array.from(fragment.querySelectorAll('*')).flatMap(el =>
    el.getAttributeNames().filter(name => name.startsWith('on')).map(name => `${el.tagName.toLowerCase()}[${name}]`)
  );
}

describe('bbCodeToHtml – attribute escaping', () => {
  const breakout = 'x" onmouseover="alert(1)';
  const cases: { name: string; bb: string; selector: string; attr: string }[] = [
    { name: 'spoiler title', bb: `[spoiler=${breakout}]body[/spoiler]`, selector: '.wysiwyg-spoiler', attr: 'data-title' },
    { name: 'quote author',  bb: `[quote=${breakout}]body[/quote]`,     selector: 'blockquote',       attr: 'data-author' },
    { name: 'color',         bb: `[color=${breakout}]body[/color]`,     selector: 'font',             attr: 'color' },
    { name: 'url',           bb: `[url=${breakout}]body[/url]`,         selector: 'a',                attr: 'href' },
    { name: 'img',           bb: `[img]${breakout}[/img]`,              selector: 'img',              attr: 'src' },
  ];

  for (const { name, bb, selector, attr } of cases) {
    it(`keeps a quote in the ${name} inside its attribute`, () => {
      const fragment = parse(bbCodeToHtml(bb));

      expect(eventHandlerAttributes(fragment)).toEqual([]);
      expect(fragment.querySelector(selector)?.getAttribute(attr)).toBe(breakout);
    });
  }

  it('shows a quoted spoiler title as text in the header', () => {
    const fragment = parse(bbCodeToHtml(`[spoiler=${breakout}]body[/spoiler]`));

    expect(fragment.querySelector('.wysiwyg-spoiler-header')?.textContent).toBe(breakout);
  });

  it('keeps quotes in plain text', () => {
    expect(parse(bbCodeToHtml('say "hi"')).textContent).toBe('say "hi"');
  });
});

describe('bbCodeToHtml – font', () => {
  const cases: { name: string; bb: string; face: string }[] = [
    { name: 'quoted name',   bb: '[font="Times New Roman"]x[/font]', face: 'Times New Roman' },
    { name: 'unquoted name', bb: '[font=Arial]x[/font]',             face: 'Arial' },
  ];

  for (const { name, bb, face } of cases) {
    it(`reads a ${name}`, () => {
      expect(parse(bbCodeToHtml(bb)).querySelector('font')?.getAttribute('face')).toBe(face);
    });
  }
});

describe('bbCodeToHtml → htmlToBbCode round trip', () => {
  const cases = [
    '[spoiler=a "quoted" title]body[/spoiler]',
    '[quote=Ann "the bard"]hello[/quote]',
    '[font="Times New Roman"]x[/font]',
    'say "hi"',
  ];

  for (const bb of cases) {
    it(`preserves ${bb}`, () => {
      expect(htmlToBbCode(bbCodeToHtml(bb))).toBe(bb);
    });
  }
});
