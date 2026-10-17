import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BbToolbarComponent } from './bb-toolbar.component';
import { ApiService } from '../../services/api.service';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { AuthService } from '../../services/auth.service';
import { signal } from '@angular/core';

// Minimal stubs so the component can be instantiated without a real backend.
const mockAuthService = {
  authToken: signal<string | null>(null),
  currentUser: signal(null),
};

function makeTextarea(value = '', selStart = 0, selEnd = 0): HTMLTextAreaElement {
  const el = document.createElement('textarea');
  el.value = value;
  // jsdom honours setSelectionRange synchronously on detached elements.
  el.setSelectionRange(selStart, selEnd);
  return el;
}

describe('BbToolbarComponent – textarea mode', () => {
  let component: BbToolbarComponent;
  let fixture: ComponentFixture<BbToolbarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BbToolbarComponent, HttpClientTestingModule],
      providers: [
        { provide: AuthService, useValue: mockAuthService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(BbToolbarComponent);
    component = fixture.componentInstance;
    // Ensure we are always in textarea mode (no WYSIWYG editor).
    component.editor = null;
    fixture.detectChanges();
  });

  // ── insertTag – no selection ────────────────────────────────────────────────

  it('inserts [b][/b] with cursor between tags when nothing is selected', () => {
    const ta = makeTextarea('', 0, 0);
    component.textarea = ta;

    component.insertTag('b');

    expect(ta.value).toBe('[b][/b]');
  });

  it('inserts [i][/i]', () => {
    const ta = makeTextarea('', 0, 0);
    component.textarea = ta;

    component.insertTag('i');

    expect(ta.value).toBe('[i][/i]');
  });

  it('inserts [u][/u]', () => {
    const ta = makeTextarea();
    component.textarea = ta;
    component.insertTag('u');
    expect(ta.value).toBe('[u][/u]');
  });

  it('inserts [s][/s]', () => {
    const ta = makeTextarea();
    component.textarea = ta;
    component.insertTag('s');
    expect(ta.value).toBe('[s][/s]');
  });

  // ── insertTag – with selection ──────────────────────────────────────────────

  it('wraps selected text in [b]...[/b]', () => {
    const ta = makeTextarea('hello world', 6, 11); // selects "world"
    component.textarea = ta;

    component.insertTag('b');

    expect(ta.value).toBe('hello [b]world[/b]');
  });

  it('wraps selected text in [i]...[/i]', () => {
    const ta = makeTextarea('hello world', 0, 5); // selects "hello"
    component.textarea = ta;

    component.insertTag('i');

    expect(ta.value).toBe('[i]hello[/i] world');
  });

  it('wraps selected text in [color=red]...[/color]', () => {
    const ta = makeTextarea('text', 0, 4);
    component.textarea = ta;

    component.insertTag('color=red');

    expect(ta.value).toBe('[color=red]text[/color]');
  });

  it('wraps selected text in [size=16]...[/size]', () => {
    const ta = makeTextarea('text', 0, 4);
    component.textarea = ta;

    component.insertTag('size=16');

    expect(ta.value).toBe('[size=16]text[/size]');
  });

  // ── Font ────────────────────────────────────────────────────────────────────

  it('inserts [font="Arial"]...[/font] for font= tag', () => {
    const ta = makeTextarea('text', 0, 4);
    component.textarea = ta;

    component.insertTag('font=Arial');

    expect(ta.value).toBe('[font="Arial"]text[/font]');
  });

  it('inserts [font="cursive"]...[/font]', () => {
    const ta = makeTextarea('text', 0, 4);
    component.textarea = ta;

    component.insertTag('font=cursive');

    expect(ta.value).toBe('[font="cursive"]text[/font]');
  });

  // ── insertUrl ───────────────────────────────────────────────────────────────

  it('inserts [url=...] with explicit link text', () => {
    const ta = makeTextarea('', 0, 0);
    component.textarea = ta;
    component.toggleArea('url'); // captures selStart/selEnd

    component.insertUrl('https://example.com', 'click here');

    expect(ta.value).toBe('[url=https://example.com]click here[/url]');
    expect(component.activeArea).toBeNull();
  });

  it('uses selected text as link label when no link text provided', () => {
    const ta = makeTextarea('example.com', 0, 11);
    component.textarea = ta;
    component.toggleArea('url');

    component.insertUrl('https://example.com', '');

    // Selected text was 'example.com', used as label.
    expect(ta.value).toBe('[url=https://example.com]example.com[/url]');
  });

  it('falls back to URL as label when nothing is selected and no link text', () => {
    const ta = makeTextarea('', 0, 0);
    component.textarea = ta;
    component.toggleArea('url');

    component.insertUrl('https://example.com', '');

    expect(ta.value).toBe('[url=https://example.com]https://example.com[/url]');
  });

  it('closes area without inserting when url is empty', () => {
    const ta = makeTextarea('', 0, 0);
    component.textarea = ta;
    component.toggleArea('url');

    component.insertUrl('', '');

    expect(ta.value).toBe('');
    expect(component.activeArea).toBeNull();
  });

  // ── insertSpoiler ────────────────────────────────────────────────────────────

  it('inserts [spoiler=Title]...[/spoiler] wrapping selected text', () => {
    const ta = makeTextarea('secret content', 0, 14);
    component.textarea = ta;
    // openSpoilerModal would normally capture the selection; replicate that
    // by calling it directly (in textarea mode it just sets spoilerSel* fields
    // via the private path — we trigger it via the public entry point).
    component.openSpoilerModal();
    component.insertSpoiler('Title');

    expect(ta.value).toBe('[spoiler=Title]secret content[/spoiler]');
  });

  it('inserts [spoiler=] with empty title', () => {
    const ta = makeTextarea('text', 0, 4);
    component.textarea = ta;
    component.openSpoilerModal();
    component.insertSpoiler('');

    expect(ta.value).toBe('[spoiler=]text[/spoiler]');
  });

  // ── insertGrid / insertTable ─────────────────────────────────────────────────

  it('inserts grid bbcode at cursor position', () => {
    const ta = makeTextarea('before ', 7, 7);
    component.textarea = ta;

    component.insertGrid('[grid][grid-item]x[/grid-item][/grid]');

    expect(ta.value).toBe('before [grid][grid-item]x[/grid-item][/grid]');
    expect(component.activeArea).toBeNull();
  });

  it('inserts table bbcode at cursor position', () => {
    const ta = makeTextarea('', 0, 0);
    component.textarea = ta;

    component.insertTable('[table][tr][td]a[/td][/tr][/table]');

    expect(ta.value).toBe('[table][tr][td]a[/td][/tr][/table]');
    expect(component.activeArea).toBeNull();
  });

  // ── No-op when textarea is null ──────────────────────────────────────────────

  it('does nothing when no textarea is set', () => {
    component.textarea = null;
    expect(() => component.insertTag('b')).not.toThrow();
  });
});
