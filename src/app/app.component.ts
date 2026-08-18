import {afterRender, Component, effect, inject, OnInit, signal, HostBinding} from '@angular/core';
import {DOCUMENT} from '@angular/common';
import {ActivatedRoute, NavigationEnd, NavigationStart, Router, RouterOutlet} from '@angular/router';
import {FooterComponent} from './components/footer/footer.component';
import {filter, map, mergeMap} from 'rxjs';
import {ToastComponent} from './components/toast/toast.component';
import {ScrollNavComponent} from './components/scroll-nav/scroll-nav.component';
import {BoardService} from './services/board.service';
import {AuthService} from './services/auth.service';
import {FeatureService} from './services/feature.service';
import {CurrencyService} from './services/currency.service';
import {UserService} from './services/user.service';
import {NotificationService} from './services/notification.service';
import {ApiService} from './services/api.service';
import {DomSanitizer, SafeHtml} from '@angular/platform-browser';
import { RouterLinksDirective } from './directives/router-links.directive';
import { environment } from '../environments/environment';
import { HeaderComponent } from './components/header/header.component';

interface WidgetEntity {
  id: number;
  type: string;
  name: string;
  custom_fields?: { field_name: string; value: string; render_type: string }[];
}

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, FooterComponent, ToastComponent, ScrollNavComponent, RouterLinksDirective, HeaderComponent],
  templateUrl: './app.component.html',
  standalone: true,
})
export class AppComponent implements OnInit {
  private router = inject(Router);
  private activatedRoute = inject(ActivatedRoute);
  private authChannel = new BroadcastChannel('auth_channel');

  boardService = inject(BoardService);
  authService = inject(AuthService);
  private userService = inject(UserService);
  private apiService = inject(ApiService);
  private sanitizer = inject(DomSanitizer);

  footerPanelHtml = signal<SafeHtml>('');
  private needsFooterProcessing = false;

  @HostBinding('class')
  get designClass(): string {
    return this.currentUser()?.interface_design || '';
  }

  pageId = 'pun-main';
  private currentPageType = 'unknown';
  private currentPageNumId = 0;

  private sendGuestActivity(pageType: string, pageId: number): void {
    const body: { page_type: string; page_id?: string } = { page_type: pageType };
    if (pageId) body.page_id = String(pageId);
    this.apiService.post<{ ok: boolean }>('guest/activity', body).subscribe({ error: () => {} });
  }
  currentUser = this.authService.currentUser;
  currentDate = new Date();
  private notificationService = inject(NotificationService);
  private featureService = inject(FeatureService);
  private currencyService = inject(CurrencyService);
  private document = inject<Document>(DOCUMENT);

  constructor() {
    afterRender(() => {
      if (this.needsFooterProcessing) {
        this.needsFooterProcessing = false;
        this.processFooterPanel();
      }
    });
    this.applyDraftStyles();
    this.listenForAuthChanges();
    this.setupRouteListener();

    // Effect to connect/disconnect notification service based on auth state
    effect(() => {
      const user = this.currentUser();
      const token = this.authService.authToken();
      if (user && user.id !== 0 && token) {
        this.notificationService.connect(token);
      } else {
        this.notificationService.disconnect();
      }
    });

    // Effect to apply font size
    effect(() => {
      const user = this.currentUser();
      if (user && user.interface_font_size) {
        const fontSize = user.interface_font_size;
        document.documentElement.style.fontSize = `${fontSize * 100}%`;
      } else {
        document.documentElement.style.fontSize = '100%';
      }
    });
  }

  ngOnInit() {
    this.boardService.loadBoard();
    this.featureService.loadFeatures().subscribe(() => {
      if (this.featureService.isFeatureActive('currency')) {
        this.currencyService.loadSettings();
      }
    });
    this.loadFooterPanel();

    this.notificationService.aiTaskDone$.subscribe(() => {
      if (!this.router.url.startsWith('/ai-chat')) {
        this.notificationService.showToast('AI Chat', 'Your AI response is ready.');
      }
    });

    this.notificationService.panelReload$.subscribe(event => {
      if (event.panel_name === 'footer') {
        this.loadFooterPanel();
      }
    });

    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        if (this.authService.isAuthenticated()) {
          this.notificationService.loadUnreadNotifications();
          this.notificationService.sendPageChange(this.currentPageType, this.currentPageNumId);
        } else {
          this.sendGuestActivity(this.currentPageType, this.currentPageNumId);
        }
        this.loadFooterPanel();
      }
    });
  }

  private loadFooterPanel() {
    this.apiService.getText('panel/footer/content').subscribe({
      next: html => {
        this.footerPanelHtml.set(this.sanitizer.bypassSecurityTrustHtml(html));
        this.needsFooterProcessing = true;
      },
      error: () => {}
    });
  }

  private setupRouteListener() {
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd),
      map(() => this.activatedRoute),
      map(route => {
        while (route.firstChild) route = route.firstChild;
        return route;
      }),
      mergeMap(route => {
        // We need both data and params
        return route.data.pipe(
          map(data => ({ data, params: route.snapshot.params }))
        );
      })
    ).subscribe(({ data, params }) => {
      this.pageId = data['pageId'] || 'pun-index';

      // Send page change notification
      let pageType = 'unknown';
      let pageId = 0;

      switch (this.pageId) {
        case 'pun-viewtopic':
          pageType = 'topic';
          pageId = +params['id'] || 0;
          break;
        case 'pun-viewforum':
          pageType = 'viewforum';
          pageId = +params['id'] || 0;
          break;
        case 'pun-index':
          pageType = 'index';
          break;
        case 'pun-profile':
          pageType = 'profile';
          pageId = +params['id'] || 0;
          break;
        case 'pun-character':
          pageType = 'character';
          pageId = +params['id'] || 0;
          break;
        default:
          pageType = this.pageId.replace('pun-', '');
      }

      this.currentPageType = pageType;
      this.currentPageNumId = pageId;
      if (this.authService.isAuthenticated()) {
        this.notificationService.sendPageChange(pageType, pageId);
      } else {
        this.sendGuestActivity(pageType, pageId);
      }
    });
  }

  private draftBase: string | null = null;

  private applyDraftStyles(): void {
    const draft = new URLSearchParams(this.document.defaultView?.location.search).get('draft');
    if (!draft) return;
    this.draftBase = `${environment.apiUrl}/draft/${draft}`;
    this.setDraftLinkHrefs();
    this.notificationService.startDraftMode(draft);
    this.notificationService.draftUpdated$.subscribe(() => this.setDraftLinkHrefs());
    this.preserveDraftParam(draft);
  }

  private preserveDraftParam(draft: string): void {
    this.router.events.pipe(
      filter(e => e instanceof NavigationStart)
    ).subscribe((e) => {
      const tree = this.router.parseUrl((e as NavigationStart).url);
      if (tree.queryParams['draft']) return;
      tree.queryParams['draft'] = draft;
      this.router.navigateByUrl(tree, { replaceUrl: true });
    });
  }

  private setDraftLinkHrefs(): void {
    const bust = `?t=${Date.now()}`;
    for (const file of ['main_style.css', 'custom_style.css']) {
      const link = this.document.querySelector<HTMLLinkElement>(`link[href^="${this.draftBase}/${file}"], link[href="/${file}"]`);
      if (link) link.href = `${this.draftBase}/${file}${bust}`;
    }
  }

  private listenForAuthChanges(): void {
    this.authChannel.onmessage = (event) => {
      if (event.data === 'logout') {
        // When another tab logs out, update this tab's state without notifying back
        this.authService.clearLocalAuth(false);
      } else if (event.data === 'login') {
        // When another tab logs in, reload the page to get the new state.
        // Guard: if this tab is already authenticated, the message came from ourselves — skip reload.
        if (!this.authService.isAuthenticated()) {
          window.location.reload();
        }
      }
    };
  }

  private footerWidgetRefreshIntervals: ReturnType<typeof setInterval>[] = [];
  private footerLinkHandler: ((e: MouseEvent) => void) | null = null;

  private processFooterPanel() {
    this.footerWidgetRefreshIntervals.forEach(id => clearInterval(id));
    this.footerWidgetRefreshIntervals = [];

    const panel = document.getElementById('footer-widget-panel');
    if (!panel) return;

    if (this.footerLinkHandler) panel.removeEventListener('click', this.footerLinkHandler);
    this.footerLinkHandler = (e: MouseEvent) => {
      const target = (e.target as HTMLElement).closest?.('a') as HTMLAnchorElement | null;
      if (!target) return;
      const href = target.getAttribute('href');
      if (!href || href.startsWith('#')) return;
      if (target.hostname !== window.location.hostname) return;
      e.preventDefault();
      this.router.navigateByUrl(target.pathname + target.search + target.hash);
    };
    panel.addEventListener('click', this.footerLinkHandler);

    const widgetData = this.parseWidgetComments(panel);

    panel.querySelectorAll<HTMLElement>('[data-widget-id][widget-type="random_entity"]').forEach(widget => {
      const widgetId = widget.getAttribute('data-widget-id')!;
      const data = widgetData[widgetId];
      if (!data || data.sets.length === 0) return;

      widget.style.display = 'flex';
      widget.innerHTML = this.buildEntityHtml(data.sets[0]);

      if (data.sets.length < 2 || !data.interval) return;

      let index = 0;
      const id = setInterval(() => {
        index = (index + 1) % data.sets.length;
        widget.innerHTML = this.buildEntityHtml(data.sets[index]);
      }, data.interval * 1000);
      this.footerWidgetRefreshIntervals.push(id);
    });

    panel.querySelectorAll<HTMLElement>('[data-is-link="true"]').forEach(widget => {
      this.attachWidgetLinks(widget);
    });
  }

  private parseWidgetComments(panel: HTMLElement): Record<string, { interval: number; sets: WidgetEntity[][] }> {
    const result: Record<string, { interval: number; sets: WidgetEntity[][] }> = {};
    const iterator = document.createNodeIterator(panel, NodeFilter.SHOW_COMMENT);
    let node: Node | null;
    while ((node = iterator.nextNode())) {
      const text = node.nodeValue?.trim() ?? '';
      if (!text.startsWith('widget:')) continue;
      const rest = text.slice(7);
      const colonIdx = rest.indexOf(':');
      if (colonIdx === -1) continue;
      const widgetId = rest.slice(0, colonIdx);
      try {
        result[widgetId] = JSON.parse(rest.slice(colonIdx + 1));
      } catch {
        // ignore malformed comment
      }
    }
    return result;
  }

  private buildEntityHtml(entities: WidgetEntity[]): string {
    return entities.map(e => {
      const path = this.entityPath(e.type, e.id);
      const fields = (e.custom_fields ?? []).map(f => {
        if (f.render_type === 'image' || f.render_type === 'cropped_image') {
          return f.value ? `<img src="${this.escapeHtml(f.value)}" alt="" style="max-width:100%" />` : '';
        }
        return `<span>${this.escapeHtml(f.value)}</span>`;
      }).join('');
      if (path) {
        return `<a href="${path}" style="flex:1"><span class="random-entity-name">${this.escapeHtml(e.name)}</span>${fields}</a>`;
      }
      return `<div style="flex:1"><span class="random-entity-name">${this.escapeHtml(e.name)}</span>${fields}</div>`;
    }).join('');
  }

  private entityPath(entityType: string, entityId: number): string | null {
    switch (entityType) {
      case 'character': return `/character/${entityId}`;
      case 'topic':
      case 'episode':
      case 'wanted_character': return `/viewtopic/${entityId}`;
      case 'user': return `/profile/${entityId}`;
      default: return null;
    }
  }

  private escapeHtml(s: string): string {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  private attachWidgetLinks(widget: HTMLElement) {
    widget.querySelectorAll<HTMLElement>('[data-entity-type][data-entity-id]').forEach(child => {
      const entityType = child.getAttribute('data-entity-type');
      const entityId = child.getAttribute('data-entity-id');
      if (!entityType || !entityId) return;

      const route = this.entityRoute(entityType, +entityId);
      if (!route) return;

      child.style.cursor = 'pointer';
      child.addEventListener('click', () => this.router.navigate(route));
    });
  }

  private entityRoute(entityType: string, entityId: number): any[] | null {
    switch (entityType) {
      case 'character': return ['/character', entityId];
      case 'topic':
      case 'episode':
      case 'wanted_character': return ['/viewtopic', entityId];
      case 'user': return ['/profile', entityId];
      default: return null;
    }
  }

  protected readonly Date = Date;
}
