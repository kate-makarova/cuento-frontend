import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { AiModel } from '../../models/AiModel';

@Component({
  selector: 'app-admin-ai-models',
  host: { class: 'pun-page' },
  standalone: true,
  imports: [RouterLink],
  templateUrl: './admin-ai-models.component.html',
})
export class AdminAiModelsComponent implements OnInit {
  private apiService = inject(ApiService);

  models = signal<AiModel[]>([]);

  readonly sizeNames: Record<number, string> = {
    1: $localize`:@@adminAiModels.size.tiny:Tiny`,
    2: $localize`:@@adminAiModels.size.small:Small`,
    3: $localize`:@@adminAiModels.size.medium:Medium`,
    4: $localize`:@@adminAiModels.size.large:Large`,
  };

  readonly protocolNames: Record<number, string> = {
    1: 'OpenAI-compat',
    2: 'Anthropic',
    3: 'Gemini',
  };

  ngOnInit() {
    this.apiService.get<AiModel[]>('admin/ai-models').subscribe({
      next: data => this.models.set(data),
      error: err => console.error('Failed to load AI models', err),
    });
  }

  deleteModel(id: number) {
    if (!confirm($localize`:@@adminAiModels.confirmDelete:Delete this AI model?`)) return;
    this.apiService.delete<{ message: string }>(`admin/ai-models/delete/${id}`).subscribe({
      next: () => this.models.update(list => list.filter(m => m.id !== id)),
      error: err => console.error('Failed to delete AI model', err),
    });
  }
}
