import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SpoilerBoxComponent } from './spoiler-box.component';

// Hosts the spoiler the same way rendered post HTML does: title in data-title, body as content.
@Component({
  standalone: true,
  imports: [SpoilerBoxComponent],
  template: `<spoiler-box [attr.data-title]="title()"><b>hidden</b> text</spoiler-box>`,
})
class HostComponent {
  title = signal<string | null>('Title');
}

describe('SpoilerBoxComponent', () => {
  let fixture: ComponentFixture<HostComponent>;

  function render(title: string | null): HTMLElement {
    fixture = TestBed.createComponent(HostComponent);
    fixture.componentInstance.title.set(title);
    fixture.detectChanges();
    return fixture.nativeElement.querySelector('spoiler-box');
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [HostComponent] }).compileComponents();
  });

  it('renders the title in a header followed by the original content', () => {
    const box = render('Title');

    const [header, content] = Array.from(box.children) as HTMLElement[];
    expect(header.className).toBe('spoiler-header');
    expect(header.textContent).toBe('Title');
    expect(content.className).toBe('spoiler-content');
    expect(content.innerHTML).toBe('<b>hidden</b> text');
  });

  it('renders an HTML title as plain text instead of markup', () => {
    const payload = '<img src="x" onerror="window.__spoilerXss = true">';
    const box = render(payload);

    const header = box.querySelector('.spoiler-header')!;
    expect(header.textContent).toBe(payload);
    expect(header.children.length).toBe(0);
    expect(box.querySelector('img')).toBeNull();
    expect((window as any).__spoilerXss).toBeUndefined();
  });

  it('renders an empty header when data-title is missing', () => {
    const box = render(null);

    expect(box.querySelector('.spoiler-header')!.textContent).toBe('');
  });

  it('toggles open and closed when the header is clicked', () => {
    const box = render('Title');
    const header = box.querySelector<HTMLElement>('.spoiler-header')!;

    header.click();
    expect(box.classList).toContain('open');
    expect(box.classList).not.toContain('closed');

    header.click();
    expect(box.classList).toContain('closed');
    expect(box.classList).not.toContain('open');
  });

  it('ignores clicks on the content', () => {
    const box = render('Title');

    box.querySelector<HTMLElement>('.spoiler-content b')!.click();

    expect(box.classList).toContain('closed');
    expect(box.classList).not.toContain('open');
  });
});
