import { parseBBCode } from './bbcode-parser';

describe('parseBBCode', () => {

  // ── Basic formatting ────────────────────────────────────────────────────────

  it('renders [b] as <b>', () => {
    expect(parseBBCode('[b]bold[/b]')).toBe('<b>bold</b>');
  });

  it('renders [i] as <i>', () => {
    expect(parseBBCode('[i]italic[/i]')).toBe('<i>italic</i>');
  });

  it('renders [u] as <u>', () => {
    expect(parseBBCode('[u]underline[/u]')).toBe('<u>underline</u>');
  });

  it('renders [s] as <s>', () => {
    expect(parseBBCode('[s]strike[/s]')).toBe('<s>strike</s>');
  });

  // ── Alignment ───────────────────────────────────────────────────────────────

  it('renders [center]', () => {
    expect(parseBBCode('[center]text[/center]'))
      .toBe('<div style="text-align: center;">text</div>');
  });

  it('renders [left]', () => {
    expect(parseBBCode('[left]text[/left]'))
      .toBe('<div style="text-align: left;">text</div>');
  });

  it('renders [right]', () => {
    expect(parseBBCode('[right]text[/right]'))
      .toBe('<div style="text-align: right;">text</div>');
  });

  // ── Color ───────────────────────────────────────────────────────────────────

  it('renders [color=red]', () => {
    expect(parseBBCode('[color=red]text[/color]'))
      .toBe('<span style="color: red;">text</span>');
  });

  it('renders [color=#ff0000]', () => {
    expect(parseBBCode('[color=#ff0000]text[/color]'))
      .toBe('<span style="color: #ff0000;">text</span>');
  });

  it('strips [color] with no value', () => {
    expect(parseBBCode('[color]text[/color]')).toBe('text');
  });

  it('rejects [color] with expression() value', () => {
    expect(parseBBCode('[color=expression(alert(1))]x[/color]')).toBe('x');
  });

  // ── Size ────────────────────────────────────────────────────────────────────

  it('renders [size=16]', () => {
    expect(parseBBCode('[size=16]text[/size]'))
      .toBe('<span style="font-size: 16px;">text</span>');
  });

  it('strips [size] with out-of-range value', () => {
    expect(parseBBCode('[size=999]text[/size]')).toBe('text');
  });

  // ── Font ────────────────────────────────────────────────────────────────────

  it('renders [font=cursive]', () => {
    expect(parseBBCode('[font=cursive]text[/font]'))
      .toBe('<span style="font-family: cursive;">text</span>');
  });

  it('renders [font=Arial]', () => {
    expect(parseBBCode('[font=Arial]text[/font]'))
      .toBe('<span style="font-family: Arial;">text</span>');
  });

  it('renders [font="Arial"] with quotes (toolbar output)', () => {
    expect(parseBBCode('[font="Arial"]text[/font]'))
      .toBe('<span style="font-family: Arial;">text</span>');
  });

  it('strips [font] with unknown family', () => {
    expect(parseBBCode('[font=hackerfont]text[/font]')).toBe('text');
  });

  // ── URL ─────────────────────────────────────────────────────────────────────

  it('renders [url=...] with explicit link text', () => {
    expect(parseBBCode('[url=https://example.com]click[/url]'))
      .toBe('<a href="https://example.com">click</a>');
  });

  it('renders [url] using inner content as href', () => {
    expect(parseBBCode('[url]https://example.com[/url]'))
      .toBe('<a href="https://example.com">https://example.com</a>');
  });

  it('rejects javascript: URL', () => {
    expect(parseBBCode('[url=javascript:alert(1)]click[/url]')).toBe('click');
  });

  // ── Image ───────────────────────────────────────────────────────────────────

  it('renders [img] with URL as inner content', () => {
    expect(parseBBCode('[img]https://example.com/img.png[/img]'))
      .toContain('<img src="https://example.com/img.png"');
  });

  it('renders [img=url] shorthand', () => {
    expect(parseBBCode('[img=https://example.com/img.png]'))
      .toContain('<img src="https://example.com/img.png"');
  });

  // ── Code ────────────────────────────────────────────────────────────────────

  it('renders [code] as <pre>', () => {
    expect(parseBBCode('[code]let x = 1;[/code]')).toBe('<pre>let x = 1;</pre>');
  });

  it('preserves newlines inside [code] (does not convert to <br>)', () => {
    expect(parseBBCode('[code]a\nb[/code]')).toBe('<pre>a\nb</pre>');
  });

  // ── Spoiler ─────────────────────────────────────────────────────────────────

  it('renders [spoiler=Title]', () => {
    expect(parseBBCode('[spoiler=Title]hidden[/spoiler]'))
      .toBe('<spoiler-box data-title="Title">hidden</spoiler-box>');
  });

  it('renders [spoiler] without title with default label', () => {
    expect(parseBBCode('[spoiler]hidden[/spoiler]'))
      .toBe('<spoiler-box data-title="Spoiler">hidden</spoiler-box>');
  });

  it('escapes HTML in spoiler title', () => {
    expect(parseBBCode('[spoiler=<script>]x[/spoiler]'))
      .toContain('data-title="&lt;script&gt;"');
  });

  // ── Quote ───────────────────────────────────────────────────────────────────

  it('renders [quote] without author', () => {
    expect(parseBBCode('[quote]text[/quote]'))
      .toBe('<blockquote><cite>Quote</cite>text</blockquote>');
  });

  it('renders [quote=Author]', () => {
    expect(parseBBCode('[quote=Author]text[/quote]'))
      .toBe('<blockquote><cite>Author said:</cite>text</blockquote>');
  });

  it('renders [quote=Author topic-id=1 post-id=2] with link', () => {
    const result = parseBBCode('[quote=Author topic-id=1 post-id=2]text[/quote]');
    expect(result).toContain('<a href="/viewtopic/1?post_id=2">Author</a>');
    expect(result).toContain('said:');
  });

  // ── Lists ───────────────────────────────────────────────────────────────────

  it('renders [ul][li]', () => {
    expect(parseBBCode('[ul][li]item[/li][/ul]')).toBe('<ul><li>item</li></ul>');
  });

  it('renders [ol][li]', () => {
    expect(parseBBCode('[ol][li]item[/li][/ol]')).toBe('<ol><li>item</li></ol>');
  });

  it('renders [list][*] as [ul][li]', () => {
    expect(parseBBCode('[list][*]item[/*][/list]')).toBe('<ul><li>item</li></ul>');
  });

  // ── Table ───────────────────────────────────────────────────────────────────

  it('renders a basic table', () => {
    const result = parseBBCode('[table][tr][td]cell[/td][/tr][/table]');
    expect(result).toContain('<table');
    expect(result).toContain('<tr>');
    expect(result).toContain('<td>cell</td>');
  });

  // ── Nested tags ─────────────────────────────────────────────────────────────

  it('handles nested formatting tags', () => {
    expect(parseBBCode('[b][i]both[/i][/b]')).toBe('<b><i>both</i></b>');
  });

  it('handles bold inside a url', () => {
    expect(parseBBCode('[url=https://example.com][b]link[/b][/url]'))
      .toBe('<a href="https://example.com"><b>link</b></a>');
  });

  // ── Safety ──────────────────────────────────────────────────────────────────

  it('HTML-escapes plain text', () => {
    expect(parseBBCode('<script>alert(1)</script>'))
      .toBe('&lt;script&gt;alert(1)&lt;/script&gt;');
  });

  it('escapes ampersands in plain text', () => {
    expect(parseBBCode('a & b')).toBe('a &amp; b');
  });

  it('renders unknown tags as escaped text', () => {
    expect(parseBBCode('[unknown]text[/unknown]'))
      .toBe('[unknown]text[/unknown]');
  });

  // ── Newline handling ─────────────────────────────────────────────────────────

  it('converts newlines to <br> in plain text', () => {
    expect(parseBBCode('a\nb')).toBe('a<br>b');
  });

  it('converts newlines to <br> around inline tags', () => {
    expect(parseBBCode('before\n[b]bold[/b]\nafter'))
      .toBe('before<br><b>bold</b><br>after');
  });

  // ── Unclosed tag handling ────────────────────────────────────────────────────

  it('treats unclosed tag as escaped text', () => {
    const result = parseBBCode('[b]unclosed');
    expect(result).toContain('[b]');
    expect(result).toContain('unclosed');
  });

  it('treats unmatched closing tag as escaped text', () => {
    expect(parseBBCode('text[/b]')).toBe('text[/b]');
  });
});
