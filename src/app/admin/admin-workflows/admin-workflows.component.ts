import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { Workflow } from '../../models/Workflow';

type DeleteState = 'idle' | 'loading' | 'error';

@Component({
  selector: 'app-admin-workflows',
  host: { class: 'pun-page' },
  standalone: true,
  imports: [RouterLink],
  templateUrl: './admin-workflows.component.html',
  styleUrl: './admin-workflows.component.css',
})
export class AdminWorkflowsComponent implements OnInit {
  private apiService = inject(ApiService);

  workflows = signal<Workflow[]>([]);

  deleteTarget = signal<Workflow | null>(null);
  deleteState = signal<DeleteState>('idle');

  ngOnInit(): void {
    this.apiService.get<Workflow[]>('admin/workflow/list').subscribe({
      next: (list) => this.workflows.set(list),
      error: (err) => console.error('Failed to load workflows', err),
    });
  }

  configJson(config: Record<string, unknown>): string {
    return JSON.stringify(config);
  }

  confirmDelete(workflow: Workflow): void {
    this.deleteTarget.set(workflow);
    this.deleteState.set('idle');
  }

  cancelDelete(): void {
    this.deleteTarget.set(null);
  }

  doDelete(): void {
    const target = this.deleteTarget();
    if (!target) return;
    this.deleteState.set('loading');
    this.apiService.delete<void>(`admin/workflow/delete/${target.id}`).subscribe({
      next: () => {
        this.workflows.update(list => list.filter(w => w.id !== target.id));
        this.deleteTarget.set(null);
      },
      error: () => this.deleteState.set('error'),
    });
  }
}
