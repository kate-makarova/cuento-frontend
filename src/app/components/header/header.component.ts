import { Component, computed, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { Subscription } from 'rxjs';
import { BoardService } from '../../services/board.service';
import { AuthService } from '../../services/auth.service';
import { NotificationService } from '../../services/notification.service';
import { ApiService } from '../../services/api.service';
import { NotificationsComponent } from '../notifications/notifications.component';
import { NavlinksComponent } from '../navlinks/navlinks.component';
import { UlinksComponent } from '../ulinks/ulinks.component';
import { RouterLinksDirective } from '../../directives/router-links.directive';

interface WidgetEntity {
  id: number;
  type: string;
  name: string;
  custom_fields?: { field_name: string; value: string; render_type: string }[];
}

interface WidgetData {
  interval: number;
  sets: WidgetEntity[][];
}

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [NavlinksComponent, UlinksComponent, NotificationsComponent, RouterLinksDirective],
  templateUrl: './header.component.html',
})
export class HeaderComponent implements OnInit, OnDestroy {
  private boardService = inject(BoardService);
  authService = inject(AuthService);
  private notificationService = inject(NotificationService);
  private apiService = inject(ApiService);
  private sanitizer = inject(DomSanitizer);
  private router = inject(Router);
  title = computed(() => this.boardService.board().site_name || 'Cuento');
  navlinksAfterHeader = computed(() => this.boardService.board().visual_navlinks_after_header_panel === 'y');
  currentUser = this.authService.currentUser;
  headerPanelHtml = signal<SafeHtml>('');

  private widgetRefreshIntervals: ReturnType<typeof setInterval>[] = [];
  private panelReloadSub?: Subscription;
  private panelLinkHandler: ((e: MouseEvent) => void) | null = null;

  ngOnInit() {
    this.load();

    this.panelReloadSub = this.notificationService.panelReload$.subscribe(event => {
      if (event.panel_name === 'header') {
        this.load();
      }
    });

    document.addEventListener('visibilitychange', this.onVisibilityChange);
  }

  ngOnDestroy() {
    this.panelReloadSub?.unsubscribe();
    document.removeEventListener('visibilitychange', this.onVisibilityChange);
    this.widgetRefreshIntervals.forEach(id => clearInterval(id));
  }

  load() {
    this.apiService.getText('panel/header/content').subscribe({
      next: html => {
        this.headerPanelHtml.set(this.sanitizer.bypassSecurityTrustHtml(html));
        setTimeout(() => this.processPanel());
      },
      error: () => {}
    });
  }

  private onVisibilityChange = () => {
    if (document.visibilityState === 'visible' && this.authService.isAuthenticated()) {
      this.load();
    }
  };

  private processPanel() {
    this.widgetRefreshIntervals.forEach(id => clearInterval(id));
    this.widgetRefreshIntervals = [];

    const panel = document.getElementById('header-widget-panel');
    if (!panel) return;

    if (this.panelLinkHandler) panel.removeEventListener('click', this.panelLinkHandler);
    this.panelLinkHandler = (e: MouseEvent) => {
      const target = (e.target as HTMLElement).closest?.('a') as HTMLAnchorElement | null;
      if (!target) return;
      const href = target.getAttribute('href');
      if (!href || href.startsWith('#')) return;
      if (target.hostname !== window.location.hostname) return;
      e.preventDefault();
      this.router.navigateByUrl(target.pathname + target.search + target.hash);
    };
    panel.addEventListener('click', this.panelLinkHandler);

    console.log('[header] panel.innerHTML', panel.innerHTML);
    const widgetData = this.parseWidgetComments(panel);
    console.log('[header] widgetData', widgetData);
    console.log('[header] random_entity widgets', panel.querySelectorAll('[data-widget-id][widget-type="random_entity"]').length);

    panel.querySelectorAll<HTMLElement>('[data-widget-id][widget-type="random_entity"]').forEach(widget => {
      const widgetId = widget.getAttribute('data-widget-id')!;
      const data = widgetData[widgetId];
      console.log('[header] widget', widgetId, 'data', data);
      if (!data || data.sets.length === 0) return;

      widget.style.display = 'flex';
      widget.innerHTML = this.buildEntityHtml(data.sets[0]);

      if (data.sets.length < 2 || !data.interval) return;

      let index = 0;
      const id = setInterval(() => {
        index = (index + 1) % data.sets.length;
        widget.innerHTML = this.buildEntityHtml(data.sets[index]);
      }, data.interval * 1000);
      this.widgetRefreshIntervals.push(id);
    });

    panel.querySelectorAll<HTMLElement>('[data-is-link="true"]').forEach(widget => {
      this.attachWidgetLinks(widget);
    });
  }

  private parseWidgetComments(panel: HTMLElement): Record<string, WidgetData> {
    const result: Record<string, WidgetData> = {};
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
        return `<a href="${path}" style="flex:1">${this.escapeHtml(e.name)}${fields}</a>`;
      }
      return `<div style="flex:1">${this.escapeHtml(e.name)}${fields}</div>`;
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
}
