import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';

interface AiAgentImplementation {
  id: number;
  agent_id: number;
  title: string;
  config: Record<string, any> | null;
  is_active: boolean;
}

@Component({
  selector: 'app-admin-ai-agent-implementation-edit',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './admin-ai-agent-implementation-edit.component.html',
})
export class AdminAiAgentImplementationEditComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private apiService = inject(ApiService);

  isNew = signal(true);
  agentId = signal<number | null>(null);
  implId = signal<number | null>(null);
  saving = signal(false);

  title = '';
  configJson = '';
  isActive = true;
  configError: string | null = null;

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id === 'new') {
      this.isNew.set(true);
      this.agentId.set(Number(this.route.snapshot.queryParamMap.get('agent_id')));
    } else {
      this.isNew.set(false);
      this.implId.set(Number(id));
      this.load(Number(id));
    }
  }

  private load(id: number) {
    this.apiService.get<AiAgentImplementation>(`admin/ai-agent/implementation/${id}`).subscribe({
      next: data => {
        this.agentId.set(data.agent_id);
        this.title = data.title;
        this.configJson = data.config ? JSON.stringify(data.config, null, 2) : '';
        this.isActive = data.is_active;
      },
      error: err => console.error('Failed to load implementation', err)
    });
  }

  submit() {
    let config: Record<string, any> | null = null;
    if (this.configJson.trim()) {
      try {
        config = JSON.parse(this.configJson);
      } catch {
        this.configError = 'Invalid JSON';
        return;
      }
    }
    this.configError = null;
    this.saving.set(true);

    if (this.isNew()) {
      this.apiService.post('admin/ai-agent-implementation/create', {
        agent_id: this.agentId(),
        title: this.title,
        config,
        is_active: this.isActive,
      }).subscribe({
        next: () => this.router.navigate(['/admin/ai-agents', this.agentId()]),
        error: err => { console.error('Failed to create implementation', err); this.saving.set(false); }
      });
    } else {
      this.apiService.put(`admin/ai-agent/implementation/${this.implId()}`, {
        title: this.title,
        config,
        is_active: this.isActive,
      }).subscribe({
        next: () => this.router.navigate(['/admin/ai-agents', this.agentId()]),
        error: err => { console.error('Failed to update implementation', err); this.saving.set(false); }
      });
    }
  }

  cancel() {
    this.router.navigate(this.agentId() ? ['/admin/ai-agents', this.agentId()] : ['/admin/ai-agents']);
  }
}
