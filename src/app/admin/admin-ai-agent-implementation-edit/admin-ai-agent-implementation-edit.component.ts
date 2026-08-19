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

interface GameDigestConfig {
  period: string;
  language: string;
  subforum_ids: number[];
  faction_ids: number[];
  target_topic_id: number | null;
}

interface GameDigestImplementation extends AiAgentImplementation {
  config: GameDigestConfig;
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
  isActive = true;

  period = '';
  language = 'en';
  subforumIds = '';
  factionIds = '';
  targetTopicId: number | null = null;

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
    this.apiService.get<GameDigestImplementation>(`admin/ai-agent-implementation/${id}`).subscribe({
      next: data => {
        this.agentId.set(data.agent_id);
        this.title = data.title;
        this.isActive = data.is_active;
        const cfg = data.config;
        if (cfg) {
          this.period = cfg.period ?? '';
          this.language = cfg.language ?? 'en';
          this.subforumIds = (cfg.subforum_ids ?? []).join(', ');
          this.factionIds = (cfg.faction_ids ?? []).join(', ');
          this.targetTopicId = cfg.target_topic_id ?? null;
        }
      },
      error: err => console.error('Failed to load implementation', err)
    });
  }

  private parseIds(input: string): number[] {
    return input.split(',').map(s => s.trim()).filter(Boolean).map(Number).filter(n => !isNaN(n));
  }

  private buildConfig(): GameDigestConfig {
    return {
      period: this.period,
      language: this.language,
      subforum_ids: this.parseIds(this.subforumIds),
      faction_ids: this.parseIds(this.factionIds),
      target_topic_id: this.targetTopicId || null,
    };
  }

  submit() {
    this.saving.set(true);
    const config = this.buildConfig();

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
      this.apiService.post(`admin/ai-agent-implementation/update/${this.implId()}`, {
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
