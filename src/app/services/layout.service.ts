import { Injectable, signal } from '@angular/core';

const MOBILE_BREAKPOINT = 720;

@Injectable({ providedIn: 'root' })
export class LayoutService {
  readonly isMobile = signal(window.innerWidth <= MOBILE_BREAKPOINT);

  constructor() {
    window.addEventListener('resize', () => {
      this.isMobile.set(window.innerWidth <= MOBILE_BREAKPOINT);
    });
  }
}
