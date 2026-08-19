import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
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

interface ImplForm {
  title: string;
  configJson: string;
  is_active: boolean;
  configError: string | null;
}

@Component({
  selector: 'app-admin-ai-agent',
  standalone: true,
  imports: [FormsModule, JsonPipe],
  templateUrl: './admin-ai-agent.component.html',
})
export class AdminAiAgentComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private apiService = inject(ApiService);

  agent = signal<AiAgentDetail | null>(null);
  editingId = signal<number | null>(null);
  editForm: ImplForm = { title: '', configJson: '', is_active: true, configError: null };
  addForm: ImplForm = { title: '', configJson: '{}', is_active: true, configError: null };
  showAddForm = signal(false);

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    this.load(Number(id));
  }

  private load(id: number) {
    this.apiService.get<AiAgentDetail>(`admin/ai-agent/${id}`).subscribe({
      next: data => this.agent.set(data),
      error: err => console.error('Failed to load AI agent', err)
    });
  }

  startEdit(impl: AiAgentImplementation) {
    this.editingId.set(impl.id);
    this.editForm = { title: impl.title, configJson: JSON.stringify(impl.config, null, 2), is_active: impl.is_active, configError: null };
  }

  cancelEdit() {
    this.editingId.set(null);
  }

  saveEdit(impl: AiAgentImplementation) {
    let config: Record<string, any>;
    try {
      config = JSON.parse(this.editForm.configJson);
    } catch {
      this.editForm.configError = 'Invalid JSON';
      return;
    }
    this.apiService.put(`admin/ai-agent/implementation/${impl.id}`, {
      title: this.editForm.title,
      config,
      is_active: this.editForm.is_active
    }).subscribe({
      next: () => { this.editingId.set(null); this.load(this.agent()!.id); },
      error: err => console.error('Failed to save implementation', err)
    });
  }

  delete(impl: AiAgentImplementation) {
    if (!confirm(`Delete "${impl.title}"?`)) return;
    this.apiService.delete(`admin/ai-agent/implementation/${impl.id}`).subscribe({
      next: () => this.load(this.agent()!.id),
      error: err => console.error('Failed to delete implementation', err)
    });
  }

  submitAdd() {
    let config: Record<string, any>;
    try {
      config = JSON.parse(this.addForm.configJson);
    } catch {
      this.addForm.configError = 'Invalid JSON';
      return;
    }
    this.apiService.post(`admin/ai-agent/${this.agent()!.id}/implementation`, {
      title: this.addForm.title,
      config,
      is_active: this.addForm.is_active
    }).subscribe({
      next: () => {
        this.showAddForm.set(false);
        this.addForm = { title: '', configJson: '{}', is_active: true, configError: null };
        this.load(this.agent()!.id);
      },
      error: err => console.error('Failed to create implementation', err)
    });
  }

  toggleAddForm() {
    this.showAddForm.update(v => !v);
    if (!this.showAddForm()) {
      this.addForm = { title: '', configJson: '{}', is_active: true, configError: null };
    }
  }
}
