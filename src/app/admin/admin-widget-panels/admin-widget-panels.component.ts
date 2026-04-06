import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { NotificationService } from '../../services/notification.service';

interface PanelListItem {
  key: string;
  is_hidden: boolean;
}

@Component({
  selector: 'app-admin-widget-panels',
  imports: [RouterLink],
  templateUrl: './admin-widget-panels.component.html',
  standalone: true,
  styleUrl: './admin-widget-panels.component.css'
})
export class AdminWidgetPanelsComponent implements OnInit {
  private apiService = inject(ApiService);
  private notificationService = inject(NotificationService);

  panels = signal<PanelListItem[]>([]);

  ngOnInit() {
    this.apiService.get<PanelListItem[]>('panel/list').subscribe({
      next: panels => this.panels.set(panels),
      error: () => {}
    });
  }

  reloadPanel(panelName: string) {
    this.notificationService.sendMessage({ type: 'panel_reload', panel_name: panelName });
  }
}
