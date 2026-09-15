import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { Workflow } from '../../models/Workflow';
import { EVENT_OPTIONS, HANDLER_OPTIONS } from '../admin-workflows/workflow-options';

type SaveState = 'idle' | 'loading' | 'success' | 'error';

@Component({
  selector: 'app-admin-workflow-edit',
  host: { class: 'pun-page' },
  standalone: true,
  imports: [FormsModule],
  templateUrl: './admin-workflow-edit.component.html',
  styleUrl: './admin-workflow-edit.component.css',
})
export class AdminWorkflowEditComponent implements OnInit {
  private apiService = inject(ApiService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  readonly eventOptions = EVENT_OPTIONS;
  readonly handlerOptions = HANDLER_OPTIONS;

  workflowId = signal<number | null>(null);

  event_name = signal<string>(EVENT_OPTIONS[0].value);
  subforum_ids = signal('');
  handler_function = signal<string>(HANDLER_OPTIONS[0].value);
  targetSubforumId = signal<number | null>(null);

  saveState = signal<SaveState>('idle');
  saveError = signal('');
  loadError = signal(false);

  get isNew(): boolean {
    return this.workflowId() === null;
  }

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    if (!idParam || idParam === 'new') return;

    const id = Number(idParam);
    this.workflowId.set(id);
    this.apiService.get<Workflow[]>('admin/workflow/list').subscribe({
      next: (list) => {
        const workflow = list.find(w => w.id === id);
        if (!workflow) { this.loadError.set(true); return; }
        this.event_name.set(workflow.event_name);
        this.subforum_ids.set(workflow.subforum_ids);
        this.handler_function.set(workflow.handler_function);
        if (workflow.handler_function === 'MoveTopic') {
          this.targetSubforumId.set((workflow.config['target_subforum_id'] as number) ?? null);
        }
      },
      error: () => this.loadError.set(true),
    });
  }

  private buildConfig(): Record<string, unknown> {
    if (this.handler_function() === 'MoveTopic') {
      return { target_subforum_id: this.targetSubforumId() };
    }
    return {};
  }

  save(): void {
    this.saveState.set('loading');
    this.saveError.set('');
    const body = {
      event_name: this.event_name(),
      subforum_ids: this.subforum_ids(),
      handler_function: this.handler_function(),
      config: this.buildConfig(),
    };
    const request = this.isNew
      ? this.apiService.post<Workflow>('admin/workflow/create', body)
      : this.apiService.post<Workflow>(`admin/workflow/update/${this.workflowId()}`, body);

    request.subscribe({
      next: () => {
        this.saveState.set('success');
        setTimeout(() => this.router.navigate(['/admin/workflows']), 1000);
      },
      error: () => {
        this.saveState.set('error');
        this.saveError.set('Failed to save workflow');
      },
    });
  }

  cancel(): void {
    this.router.navigate(['/admin/workflows']);
  }
}
