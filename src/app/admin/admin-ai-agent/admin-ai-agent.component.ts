import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { JsonPipe } from '@angular/common';
import { ApiService } from '../../services/api.service';

interface AiAgentImplementation {
  id: number;
  agent_id: number;
  title: string;
  config: Record<string, any>;
  is_active: boolean;
}

interface AiAgentDetail {
  id: number;
  title: string;
  short_description: string;
  total_implementations: number;
  active_implementations: number;
  implementations: AiAgentImplementation[];
}

@Component({
  selector: 'app-admin-ai-agent',
  standalone: true,
  imports: [JsonPipe],
  templateUrl: './admin-ai-agent.component.html',
})
export class AdminAiAgentComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private apiService = inject(ApiService);

  agent = signal<AiAgentDetail | null>(null);

  ngOnInit() {
    this.load(Number(this.route.snapshot.paramMap.get('id')));
  }

  private load(id: number) {
    this.apiService.get<AiAgentDetail>(`admin/ai-agent/${id}`).subscribe({
      next: data => this.agent.set(data),
      error: err => console.error('Failed to load AI agent', err)
    });
  }

  edit(impl: AiAgentImplementation) {
    this.router.navigate(['/admin/ai-agent-implementation', impl.id]);
  }

  delete(impl: AiAgentImplementation) {
    if (!confirm(`Delete "${impl.title}"?`)) return;
    this.apiService.delete(`admin/ai-agent/implementation/${impl.id}`).subscribe({
      next: () => this.load(this.agent()!.id),
      error: err => console.error('Failed to delete implementation', err)
    });
  }

  addImplementation() {
    this.router.navigate(['/admin/ai-agent-implementation', 'new'], {
      queryParams: { agent_id: this.agent()!.id }
    });
  }
}
