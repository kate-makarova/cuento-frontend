import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { HtmlEditorComponent } from '../../components/html-editor/html-editor.component';
import { BreadcrumbsComponent } from '../../components/breadcrumbs/breadcrumbs.component';
import { SaveButtonComponent } from '../save-button/save-button.component';

type SaveState = 'idle' | 'loading' | 'success' | 'error';

@Component({
  selector: 'app-admin-component-template',
  host: { class: 'pun-page' },
  standalone: true,
  imports: [HtmlEditorComponent, BreadcrumbsComponent, SaveButtonComponent],
  templateUrl: './admin-component-template.component.html',
  styleUrl: './admin-component-template.component.css',
})
export class AdminComponentTemplateComponent implements OnInit {
  private apiService = inject(ApiService);
  private route = inject(ActivatedRoute);

  name = signal('');
  filePath = signal('');
  content = signal('');
  versionName = signal('');
  versionId = signal<number | null>(null);
  readonly = signal(false);
  isCreate = signal(false);
  isEdit = signal(false);
  saveState = signal<SaveState>('idle');

  ngOnInit() {
    const name = this.route.snapshot.queryParamMap.get('name') ?? '';
    const filePath = this.route.snapshot.queryParamMap.get('path') ?? '';
    const id = this.route.snapshot.queryParamMap.get('id');
    const versionName = this.route.snapshot.queryParamMap.get('versionName') ?? '';
    const isDefault = !!this.route.snapshot.data['readonly'];
    const isCreate = !!this.route.snapshot.data['create'];
    const isEdit = !!this.route.snapshot.data['edit'];

    this.name.set(name);
    this.filePath.set(filePath);
    this.versionName.set(versionName);
    this.readonly.set(isDefault);
    this.isCreate.set(isCreate);
    this.isEdit.set(isEdit);
    if (id) this.versionId.set(Number(id));

    let endpoint: string;
    if (isEdit && id) {
      endpoint = `admin/frontend-templates/component/version/${id}`;
    } else if (isDefault || isCreate) {
      endpoint = `admin/frontend-templates/components-default/${name}`;
    } else {
      endpoint = `admin/frontend-templates/components/${name}`;
    }

    this.apiService.getText(endpoint).subscribe({
      next: (text) => this.content.set(text),
      error: (err) => console.error('Failed to load component template', err),
    });
  }

  updateContent(value: string) {
    this.content.set(value);
  }

  save() {
    this.saveState.set('loading');
    const body: Record<string, unknown> = {
      component_name: this.name(),
      name: this.versionName(),
      content: this.content(),
    };
    if (this.versionId() !== null) {
      body['id'] = this.versionId();
    }
    this.apiService
      .post('admin/frontend-templates/component/save', body)
      .subscribe({
        next: () => this.flash('success'),
        error: (err) => {
          console.error('Failed to save component template', err);
          this.flash('error');
        },
      });
  }

  private flash(state: 'success' | 'error') {
    this.saveState.set(state);
    setTimeout(() => this.saveState.set('idle'), 3000);
  }
}
