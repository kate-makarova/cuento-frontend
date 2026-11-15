import { Component, AfterViewInit, ElementRef, inject, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'quote-box',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.Eager,
  template: '<ng-content></ng-content>',
})
export class QuoteBoxComponent implements AfterViewInit {
  private el = inject(ElementRef);

  ngAfterViewInit() {
    const host: HTMLElement = this.el.nativeElement;
    const href = host.getAttribute('data-href');
    if (!href) return;

    const cite = host.querySelector('cite');
    if (!cite) return;

    cite.innerHTML = `<a href="${href}">${cite.innerHTML}</a>`;
  }
}
