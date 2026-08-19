import { Component, inject, OnInit, signal } from '@angular/core';
import { ApiService } from '../../services/api.service';

interface AiAgent {
  id: number;
  title: string;
  short_description: string;
  total_implementations: number;
  active_implementations: number;
}

@Component({
  selector: 'app-admin-ai-agents',
  standalone: true,
  templateUrl: './admin-ai-agents.component.html',
})
export class AdminAiAgentsComponent implements OnInit {
  private apiService = inject(ApiService);

  agents = signal<AiAgent[]>([]);

  ngOnInit() {
    this.apiService.get<AiAgent[]>('admin/ai-agent/list').subscribe({
      next: data => this.agents.set(data),
      error: err => console.error('Failed to load AI agents', err)
    });
  }
}
