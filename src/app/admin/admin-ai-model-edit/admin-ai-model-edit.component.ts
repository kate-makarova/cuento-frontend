import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { AiModel } from '../../models/AiModel';
import { SaveButtonComponent, SaveState } from '../save-button/save-button.component';

@Component({
  selector: 'app-admin-ai-model-edit',
  host: { class: 'pun-page' },
  standalone: true,
  imports: [FormsModule, RouterLink, SaveButtonComponent],
  templateUrl: './admin-ai-model-edit.component.html',
  styleUrl: './admin-ai-model-edit.component.css',
})
export class AdminAiModelEditComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private apiService = inject(ApiService);

  isNew = false;
  model: AiModel | null = null;

  name = '';
  machineName = '';
  apiAddress = '';
  apiKey = '';
  protocolType = 1;
  size = 2;
  modelType = 1;
  isActive = false;

  saveState: SaveState = 'idle';

  readonly sizes = [
    { value: 1, label: $localize`:@@adminAiModels.size.tiny:Tiny` },
    { value: 2, label: $localize`:@@adminAiModels.size.small:Small` },
    { value: 3, label: $localize`:@@adminAiModels.size.medium:Medium` },
    { value: 4, label: $localize`:@@adminAiModels.size.large:Large` },
  ];

  readonly protocolTypes = [
    { value: 1, label: 'OpenAI-compat' },
    { value: 2, label: 'Anthropic' },
    { value: 3, label: 'Gemini' },
  ];

  readonly modelTypes = [
    { value: 1, label: $localize`:@@adminAiModels.modelType.text:Text` },
    { value: 2, label: $localize`:@@adminAiModels.modelType.image:Image` },
  ];

  ngOnInit() {
    const raw = this.route.snapshot.paramMap.get('id');
    if (raw === 'new') {
      this.isNew = true;
      return;
    }
    const id = Number(raw);
    this.apiService.get<AiModel>(`admin/ai-models/${id}`).subscribe({
      next: (m) => {
        this.model = m;
        this.name = m.name;
        this.machineName = m.machine_name;
        this.apiAddress = m.api_address;
        this.apiKey = m.api_key;
        this.protocolType = m.protocol_type;
        this.size = m.size;
        this.modelType = m.model_type;
        this.isActive = m.is_active;
      },
      error: (err) => console.error('Failed to load AI model', err),
    });
  }

  submit() {
    this.saveState = 'loading';
    const payload = {
      name: this.name,
      machine_name: this.machineName,
      api_address: this.apiAddress,
      api_key: this.apiKey,
      protocol_type: this.protocolType,
      size: this.size,
      model_type: this.modelType,
      is_active: this.isActive,
    };

    if (this.isNew) {
      this.apiService.post<AiModel>('admin/ai-models/create', payload).subscribe({
        next: (created) => {
          this.saveState = 'success';
          setTimeout(() => this.router.navigate(['/admin/ai-model', created.id]), 1500);
        },
        error: (err) => {
          console.error('Failed to create AI model', err);
          this.saveState = 'error';
          setTimeout(() => (this.saveState = 'idle'), 3000);
        },
      });
    } else {
      this.apiService.post<AiModel>(`admin/ai-models/update/${this.model!.id}`, payload).subscribe({
        next: (updated) => {
          this.model = updated;
          this.saveState = 'success';
          setTimeout(() => (this.saveState = 'idle'), 3000);
        },
        error: (err) => {
          console.error('Failed to update AI model', err);
          this.saveState = 'error';
          setTimeout(() => (this.saveState = 'idle'), 3000);
        },
      });
    }
  }
}
