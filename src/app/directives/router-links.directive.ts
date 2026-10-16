import { Directive, ElementRef, HostListener, inject } from '@angular/core';
import { Router } from '@angular/router';

/**
 * Apply to any element that renders backend HTML via [innerHTML].
 * Intercepts clicks on internal <a> tags and routes them through
 * the Angular Router to avoid full page reloads.
 *
 * Listens at document level (not just the host element) so that
 * dynamically-injected innerHTML links are always captured regardless
 * of Angular's change-detection timing.
 */
@Directive({
  selector: '[appRouterLinks]',
  standalone: true,
})
export class RouterLinksDirective {
  private router = inject(Router);
  private el = inject(ElementRef);

  @HostListener('document:click', ['$event'])
  onClick(event: MouseEvent) {
    if (!this.el.nativeElement.contains(event.target as Node)) return;

    const target = (event.target as HTMLElement).closest('a');
    if (!target) return;

    const href = target.getAttribute('href');
    if (!href || href.startsWith('#')) return;

    // hostname is empty for mailto:/javascript:; for relative and same-origin
    // absolute URLs it equals window.location.hostname
    if (target.hostname && target.hostname !== window.location.hostname) return;

    // Only handle relative paths and same-origin absolute URLs
    if (!href.startsWith('/') && !href.startsWith('.') && !/^https?:\/\//.test(href)) return;

    event.preventDefault();
    const url = new URL(target.href);
    this.router.navigateByUrl(url.pathname + url.search + url.hash);
  }
}
