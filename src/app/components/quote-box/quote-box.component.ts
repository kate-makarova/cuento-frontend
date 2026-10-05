import { Component, AfterViewInit, ElementRef, inject } from '@angular/core';

@Component({
  selector: 'quote-box',
  standalone: true,
  template: '<ng-content></ng-content>',
  host: { class: 'quote-box' },
})
export class QuoteBoxComponent implements AfterViewInit {
  private el = inject(ElementRef);

  ngAfterViewInit() {
    const host: HTMLElement = this.el.nativeElement;
    const author = host.getAttribute('data-author') ?? '';
    const href = host.getAttribute('data-href');
    const innerHtml = host.innerHTML;

    const authorHtml = href
      ? `<a href="${href}">${this.escapeHtml(author)}</a>`
      : this.escapeHtml(author);

    host.innerHTML = `<cite>${authorHtml}</cite>${innerHtml}`;
  }

  private escapeHtml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }
}
