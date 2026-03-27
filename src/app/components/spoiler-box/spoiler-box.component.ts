import { Component, AfterViewInit, ElementRef, inject } from '@angular/core';

@Component({
  selector: 'spoiler-box',
  standalone: true,
  template: `<ng-content></ng-content>`,
})
export class SpoilerBoxComponent implements AfterViewInit {
  private el = inject(ElementRef);

  ngAfterViewInit() {
    const host: HTMLElement = this.el.nativeElement;
    const title = host.getAttribute('data-title') ?? '';
    const innerContent = host.innerHTML;

    host.innerHTML = '';

    const header = document.createElement('div');
    header.className = 'spoiler-header';
    header.textContent = title;

    const content = document.createElement('div');
    content.className = 'spoiler-content';
    content.innerHTML = innerContent;

    header.addEventListener('click', () => {
      header.classList.toggle('open');
      content.classList.toggle('open');
    });

    host.appendChild(header);
    host.appendChild(content);
  }
}
