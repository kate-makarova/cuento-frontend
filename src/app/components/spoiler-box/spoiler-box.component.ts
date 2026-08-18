import { Component, AfterViewInit, ElementRef, HostListener, inject } from '@angular/core';

@Component({
  selector: 'spoiler-box',
  standalone: true,
  template: '<ng-content></ng-content>',
  host: { class: 'closed' },
})
export class SpoilerBoxComponent implements AfterViewInit {
  private el = inject(ElementRef);
  private isOpen = false;

  ngAfterViewInit() {
    const host: HTMLElement = this.el.nativeElement;
    const title = host.getAttribute('data-title') ?? '';
    const innerHtml = host.innerHTML;
    host.innerHTML = `<div class="spoiler-header">${title}</div><div class="spoiler-content">${innerHtml}</div>`;
  }

  @HostListener('click', ['$event.target'])
  onClick(target: HTMLElement) {
    if (!target.closest('.spoiler-header')) return;

    const host: HTMLElement = this.el.nativeElement;
    const content = host.querySelector<HTMLElement>('.spoiler-content')!;

    this.isOpen = !this.isOpen;
    host.classList.toggle('open', this.isOpen);
    host.classList.toggle('closed', !this.isOpen);

    if (this.isOpen) {
      content.style.height = content.scrollHeight + 'px';
      content.style.padding = '8px 10px';
      content.addEventListener('transitionend', () => {
        content.style.height = 'auto';
      }, { once: true });
    } else {
      content.style.height = content.scrollHeight + 'px';
      requestAnimationFrame(() => {
        content.style.height = '0px';
        content.style.padding = '0 10px';
      });
    }
  }
}
