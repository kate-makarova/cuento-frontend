import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { SaveButtonComponent } from '../save-button/save-button.component';

type SaveState = 'idle' | 'loading' | 'success' | 'error';

interface WidgetType {
  id: number;
  name: string;
}

interface WidgetDetail {
  id: number;
  name: string;
  template_id: number;
  config: string | null;
}

interface ConfigFieldDef {
  type: string;
  values?: string[];
  endpoint?: string;
  can_empty?: boolean;
}

interface EndpointOption {
  value: string;
  label: string;
}

interface ConfigField {
  key: string;
  type: string;
  value: any;
  values?: string[];           // static select options
  endpoint?: string;           // endpoint template, e.g. "entity/fields/:entity_type"
  endpointOptions: EndpointOption[]; // dynamically loaded select options
  dependsOn: string[];         // keys of fields referenced in endpoint
  canEmpty: boolean;
  isSpecial: boolean;          // key starts with _, handled separately in template
}

@Component({
  selector: 'app-admin-widget-edit',
  imports: [CommonModule, FormsModule, SaveButtonComponent],
  templateUrl: './admin-widget-edit.component.html',
  standalone: true,
  styleUrl: './admin-widget-edit.component.css'
})
export class AdminWidgetEditComponent implements OnInit {
  private apiService = inject(ApiService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  widgetTypes = signal<WidgetType[]>([]);
  widgetId: number | null = null;
  name = '';
  selectedTypeId: number | null = null;
  configFields = signal<ConfigField[]>([]);
  saveState = signal<SaveState>('idle');
  deleteState = signal<SaveState>('idle');

  filterStatus = signal<string>('');
  filterIsClaimed = signal<string>('');

  entityType = computed(() => this.configFields().find(f => f.key === 'entity_type')?.value as string | undefined);

  ngOnInit() {
    const idParam = this.route.snapshot.paramMap.get('id');
    this.widgetId = idParam && idParam !== 'new' ? +idParam : null;

    this.apiService.get<WidgetType[]>('widget-type/list').subscribe({
      next: types => {
        this.widgetTypes.set(types);
        if (this.widgetId) {
          this.loadWidget();
        }
      },
      error: () => {}
    });
  }

  private loadWidget() {
    this.apiService.get<WidgetDetail>(`widget/${this.widgetId}`).subscribe({
      next: widget => {
        this.name = widget.name;
        this.selectedTypeId = widget.template_id;
        const savedConfig = widget.config ? JSON.parse(widget.config) : {};
        this.loadConfigTemplate(savedConfig);
      },
      error: () => {}
    });
  }

  onTypeChange(typeId: number) {
    this.selectedTypeId = typeId;
    this.filterStatus.set('');
    this.filterIsClaimed.set('');
    this.loadConfigTemplate({});
  }

  private loadConfigTemplate(savedValues: Record<string, any>) {
    const type = this.widgetTypes().find(t => t.id === Number(this.selectedTypeId));
    if (!type) {
      this.configFields.set([]);
      return;
    }

    this.apiService.get<Record<string, ConfigFieldDef>>(`widget-type/${type.name}/config-template`).subscribe({
      next: template => {
        if (!template || typeof template !== 'object' || Array.isArray(template)) {
          this.configFields.set([]);
          return;
        }
        const DEPRECATED_KEYS = ['_is_link', '_refresh_interval'];
        const fields: ConfigField[] = Object.entries(template)
          .filter(([key]) => !DEPRECATED_KEYS.includes(key))
          .map(([key, def]) => {
          const dependsOn = def.endpoint
            ? (def.endpoint.match(/:(\w+)/g) ?? []).map(p => p.slice(1))
            : [];
          const canEmpty = !!def.can_empty;
          const isSpecial = key.startsWith('_');
          const defaultValue = isSpecial
            ? (savedValues[key] ?? false)
            : (savedValues[key] ?? (def.type === 'int' ? 0 : (canEmpty ? '' : (def.values?.[0] ?? ''))));
          return {
            key,
            type: def.type,
            value: defaultValue,
            values: def.values,
            endpoint: def.endpoint,
            endpointOptions: [],
            dependsOn,
            canEmpty,
            isSpecial
          };
        });

        for (const spec of [
          { key: 'number', defaultValue: 1 },
          { key: 'interval', defaultValue: 0 }
        ]) {
          if (!fields.some(f => f.key === spec.key)) {
            fields.push({
              key: spec.key,
              type: 'int',
              value: savedValues[spec.key] ?? spec.defaultValue,
              values: undefined,
              endpoint: undefined,
              endpointOptions: [],
              dependsOn: [],
              canEmpty: false,
              isSpecial: true
            });
          }
        }

        this.configFields.set(fields);

        const savedFilters = savedValues['filters'] ?? {};
        const rawStatus = savedFilters['status_active'];
        this.filterStatus.set(Array.isArray(rawStatus) ? (rawStatus[0] ?? '') : (rawStatus ?? ''));
        const rawClaimed = savedFilters['is_claimed'];
        this.filterIsClaimed.set(Array.isArray(rawClaimed) ? (rawClaimed[0] ?? '') : (rawClaimed ?? ''));

        // Load endpoint options for fields that have endpoints
        for (const field of fields) {
          if (field.endpoint) {
            this.loadEndpointOptions(field);
          }
        }
      },
      error: () => {}
    });
  }

  private loadEndpointOptions(field: ConfigField) {
    if (!field.endpoint) return;

    const fields = this.configFields();
    let endpoint = field.endpoint;

    // Replace :param placeholders with current field values
    for (const dep of field.dependsOn) {
      const depField = fields.find(f => f.key === dep);
      if (!depField?.value) return; // wait until dependency has a value
      endpoint = endpoint.replace(`:${dep}`, encodeURIComponent(depField.value));
    }

    this.apiService.get<any[]>(endpoint).subscribe({
      next: raw => {
        const options: EndpointOption[] = raw.map(item =>
          typeof item === 'string'
            ? { value: item, label: item }
            : { value: item.machine_field_name, label: item.human_field_name }
        );
        this.configFields.update(fs =>
          fs.map(f => f.key === field.key ? { ...f, endpointOptions: options } : f)
        );
      },
      error: () => {}
    });
  }

  onFieldChange(changedField: ConfigField) {
    if (changedField.key === 'entity_type') {
      this.filterStatus.set('');
      this.filterIsClaimed.set('');
    }
    // Reload endpoint options for any field that depends on the changed field
    const fields = this.configFields();
    for (const field of fields) {
      if (field.dependsOn.includes(changedField.key)) {
        this.loadEndpointOptions(field);
      }
    }
  }

  delete() {
    this.deleteState.set('loading');
    this.apiService.get(`widget/${this.widgetId}/delete`).subscribe({
      next: () => this.router.navigate(['/admin/widgets']),
      error: () => {
        this.deleteState.set('error');
        setTimeout(() => this.deleteState.set('idle'), 3000);
      }
    });
  }

  save() {
    this.saveState.set('loading');

    const config: Record<string, any> = {};
    const KNOWN_SPECIAL_KEYS = ['number', 'interval'];
    for (const field of this.configFields()) {
      if (field.isSpecial && !KNOWN_SPECIAL_KEYS.includes(field.key)) continue;
      if (!field.isSpecial && (field.value === '' || field.value === null || field.value === undefined)) continue;
      config[field.key] = field.type === 'int' ? Number(field.value) : field.value;
    }

    const et = this.entityType();
    if (et === 'character' || et === 'wanted_character') {
      const filters: Record<string, string> = {};
      if (this.filterStatus()) filters['status_active'] = this.filterStatus();
      if (et === 'wanted_character' && this.filterIsClaimed()) filters['is_claimed'] = this.filterIsClaimed();
      if (Object.keys(filters).length > 0) config['filters'] = filters;
    }

    const body: Record<string, any> = {
      name: this.name,
      config: JSON.stringify(config)
    };

    if (!this.widgetId) {
      body['template_id'] = Number(this.selectedTypeId);
    }

    const endpoint = this.widgetId ? `widget/${this.widgetId}/update` : 'widget/create';
    this.apiService.post(endpoint, body).subscribe({
      next: () => {
        this.saveState.set('success');
        setTimeout(() => this.saveState.set('idle'), 3000);
      },
      error: () => {
        this.saveState.set('error');
        setTimeout(() => this.saveState.set('idle'), 3000);
      }
    });
  }
}
