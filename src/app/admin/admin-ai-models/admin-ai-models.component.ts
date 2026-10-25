import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DecimalPipe } from '@angular/common';
import { ApiService } from '../../services/api.service';
import { AiModel } from '../../models/AiModel';
import { SaveButtonComponent, SaveState } from '../save-button/save-button.component';

interface PoolStatus {
  source: string;
  openrouter_api_key: string;
  openrouter_use_free_only: string;
  groq_api_key: string;
}

interface OpenRouterModelInfo {
  id: string;
  context_length: number;
  modality: string;
  price_prompt: string;
}

interface AvailableModelsResponse {
  source: string;
  models: OpenRouterModelInfo[];
}

@Component({
  selector: 'app-admin-ai-models',
  host: { class: 'pun-page' },
  standalone: true,
  imports: [RouterLink, FormsModule, DecimalPipe, SaveButtonComponent],
  templateUrl: './admin-ai-models.component.html',
  styleUrl: './admin-ai-models.component.css',
})
export class AdminAiModelsComponent implements OnInit {
  private apiService = inject(ApiService);

  models = signal<AiModel[]>([]);

  poolStatus = signal<PoolStatus | null>(null);
  formSource = 'db';
  formApiKey = '';
  formFreeOnly = false;
  formGroqApiKey = '';
  poolSwitchState = signal<SaveState>('idle');

  availableModels = signal<OpenRouterModelInfo[]>([]);
  availableModelsLoading = signal(false);
  availableModelsError = signal('');
  availableModelsSource = signal('');

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
    this.loadModels();
    this.loadPoolStatus();
  }

  private loadModels() {
    this.apiService.get<AiModel[]>('admin/ai-models').subscribe({
      next: data => this.models.set(data),
      error: err => console.error('Failed to load AI models', err),
    });
  }

  private loadPoolStatus() {
    this.apiService.get<PoolStatus>('admin/ai-pool/status').subscribe({
      next: status => {
        this.poolStatus.set(status);
        this.formSource = status.source || 'db';
        this.formApiKey = status.openrouter_api_key || '';
        this.formFreeOnly = status.openrouter_use_free_only === 'y';
        this.formGroqApiKey = status.groq_api_key || '';
      },
      error: err => console.error('Failed to load pool status', err),
    });
  }

  onSourceChange() {
    if (this.formSource === 'openrouter' && !this.formApiKey) {
      this.formApiKey = this.poolStatus()?.openrouter_api_key ?? '';
    }
    if (this.formSource === 'groq' && !this.formGroqApiKey) {
      this.formGroqApiKey = this.poolStatus()?.groq_api_key ?? '';
    }
  }

  switchPool() {
    this.poolSwitchState.set('loading');
    const payload: Record<string, unknown> = { source: this.formSource };
    if (this.formSource === 'openrouter') {
      payload['api_key'] = this.formApiKey;
      payload['free_only'] = this.formFreeOnly;
    }
    if (this.formSource === 'groq') {
      payload['api_key'] = this.formGroqApiKey;
    }
    this.apiService.post<{ source: string }>('admin/ai-pool/switch', payload).subscribe({
      next: (res) => {
        this.poolSwitchState.set('success');
        this.poolStatus.update(s => s ? {
          ...s,
          source: res.source,
          openrouter_api_key: this.formSource === 'openrouter' ? this.formApiKey : (s.openrouter_api_key ?? ''),
          openrouter_use_free_only: this.formSource === 'openrouter' ? (this.formFreeOnly ? 'y' : 'n') : (s.openrouter_use_free_only ?? 'n'),
        } : null);
        this.availableModels.set([]);
        this.availableModelsSource.set('');
        setTimeout(() => this.poolSwitchState.set('idle'), 3000);
      },
      error: err => {
        console.error('Failed to switch pool', err);
        this.poolSwitchState.set('error');
        setTimeout(() => this.poolSwitchState.set('idle'), 3000);
      },
    });
  }

  checkAvailableModels() {
    this.availableModelsLoading.set(true);
    this.availableModelsError.set('');
    this.availableModels.set([]);
    this.apiService.get<AvailableModelsResponse>('admin/ai-pool/available-models').subscribe({
      next: res => {
        this.availableModelsSource.set(res.source);
        this.availableModels.set(res.models ?? []);
        this.availableModelsLoading.set(false);
      },
      error: err => {
        this.availableModelsError.set(err?.error?.message ?? 'Failed to fetch available models');
        this.availableModelsLoading.set(false);
      },
    });
  }

  deleteModel(id: number) {
    if (!confirm($localize`:@@adminAiModels.confirmDelete:Delete this AI model?`)) return;
    this.apiService.delete<{ message: string }>(`admin/ai-models/delete/${id}`).subscribe({
      next: () => this.models.update(list => list.filter(m => m.id !== id)),
      error: err => console.error('Failed to delete AI model', err),
    });
  }

  formatPrice(price: string): string {
    const n = parseFloat(price);
    if (isNaN(n) || n === 0) return 'free';
    if (n < 0.000001) return `$${(n * 1_000_000).toFixed(3)}/M`;
    return `$${(n * 1_000_000).toFixed(2)}/M`;
  }
}
