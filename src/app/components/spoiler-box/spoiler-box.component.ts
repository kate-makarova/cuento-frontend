import { Component, AfterViewInit, ElementRef, HostListener, inject, Renderer2 } from '@angular/core';

@Component({
  selector: 'spoiler-box',
  standalone: true,
  template: '<ng-content></ng-content>',
  host: { class: 'closed' },
})
export class SpoilerBoxComponent implements AfterViewInit {
  private el = inject(ElementRef);
  private renderer = inject(Renderer2);
  private isOpen = false;

  ngAfterViewInit() {
    const host: HTMLElement = this.el.nativeElement;
    host.innerHTML = `<div class="spoiler-content">${host.innerHTML}</div>`;

    // getAttribute() returns the entity-decoded title, so it must be set as text, never as HTML.
    const header = this.renderer.createElement('div');
    this.renderer.addClass(header, 'spoiler-header');
    this.renderer.setProperty(header, 'textContent', host.getAttribute('data-title') ?? '');
    this.renderer.insertBefore(host, header, host.firstChild);
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
