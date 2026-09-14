import { Component, inject, OnInit, OnDestroy, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../services/api.service';
import { LorePage, LorePageInfo, LoreTopicPostRow } from '../models/LorePage';

interface EditState {
  name: string;
  order: number;
  is_hidden: boolean;
  is_external_link: boolean;
  external_link: string;
}

@Component({
  selector: 'app-lore-navigation-edit',
  host: { class: 'pun-page' },
  standalone: true,
  imports: [ DatePipe, FormsModule],
  templateUrl: './lore-navigation-edit.component.html',
})
export class LoreNavigationEditComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private apiService = inject(ApiService);

  topicId = signal<number>(0);
  rows = signal<LoreTopicPostRow[]>([]);
  externalPages = signal<LorePageInfo[]>([]);

  // postId -> EditState for post-linked rows
  editingMap: Record<number, EditState> = {};
  // lorePageId -> EditState for editing standalone external link pages
  externalEditingMap: Record<number, EditState> = {};
  isCreatingExternal = signal(false);
  createExternalState: EditState = this.emptyExternalState();

  private destroy$ = new Subject<void>();

  ngOnInit(): void {
    this.route.paramMap.pipe(takeUntil(this.destroy$)).subscribe(paramMap => {
      const id = Number(paramMap.get('id'));
      if (id) {
        this.topicId.set(id);
        this.loadRows(id);
        this.loadExternalPages(id);
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadRows(topicId: number) {
    this.apiService.get<LoreTopicPostRow[]>(`lore-topic/${topicId}/posts`).subscribe({
      next: (data) => this.rows.set(data),
      error: (err) => console.error('Failed to load lore topic posts', err)
    });
  }

  private loadExternalPages(topicId: number) {
    this.apiService.get<LorePageInfo[]>(`lore-topic/${topicId}/pages`).subscribe({
      next: (data) => this.externalPages.set(data.filter(p => p.is_external_link)),
      error: (err) => console.error('Failed to load lore pages', err)
    });
  }

  private emptyExternalState(): EditState {
    return { name: '', order: 0, is_hidden: false, is_external_link: true, external_link: '' };
  }

  // --- Post-row lore pages ---

  startEdit(row: LoreTopicPostRow) {
    this.editingMap = {
      ...this.editingMap,
      [row.id]: {
        name: row.lore_page?.name ?? '',
        order: row.lore_page?.order ?? 0,
        is_hidden: row.lore_page?.is_hidden ?? false,
        is_external_link: row.lore_page?.is_external_link ?? false,
        external_link: row.lore_page?.external_link ?? '',
      }
    };
  }

  cancelEdit(row: LoreTopicPostRow) {
    const updated = { ...this.editingMap };
    delete updated[row.id];
    this.editingMap = updated;
  }

  isEditing(row: LoreTopicPostRow): boolean {
    return row.id in this.editingMap;
  }

  save(row: LoreTopicPostRow) {
    const state = this.editingMap[row.id];
    if (!state) return;

    const isCreate = row.lore_page === null;
    const payload: LorePage = {
      topic_id: this.topicId(),
      name: state.name,
      order: state.order,
      is_hidden: state.is_hidden,
      is_external_link: state.is_external_link,
      external_link: state.is_external_link ? (state.external_link || null) : null,
      ...(!state.is_external_link ? { post_id: row.id } : {}),
    };

    const endpoint = isCreate ? 'lore-page/create' : `lore-page/update/${row.lore_page!.id}`;

    this.apiService.post<LorePageInfo>(endpoint, payload).subscribe({
      next: (updated) => {
        if (updated.is_external_link) {
          // Moved to external-only: clear from post row, add to external section
          this.rows.update(list => list.map(r => r.id === row.id ? { ...r, lore_page: null } : r));
          this.externalPages.update(list => [...list.filter(p => p.id !== updated.id), updated]);
        } else {
          // If previously external, remove from external section
          const prevPage = row.lore_page;
          if (prevPage?.is_external_link) {
            this.externalPages.update(list => list.filter(p => p.id !== prevPage.id));
          }
          this.rows.update(list => list.map(r => r.id === row.id ? { ...r, lore_page: updated } : r));
        }
        this.cancelEdit(row);
      },
      error: (err) => console.error('Failed to save lore page', err)
    });
  }

  delete(row: LoreTopicPostRow) {
    const page = row.lore_page!;
    this.apiService.get<void>(`lore-page/delete/${page.id}`).subscribe({
      next: () => {
        this.rows.update(list => list.map(r => r.id === row.id ? { ...r, lore_page: null } : r));
        if (page.is_external_link) {
          this.externalPages.update(list => list.filter(p => p.id !== page.id));
        }
        this.cancelEdit(row);
      },
      error: (err) => console.error('Failed to delete lore page', err)
    });
  }

  // --- Standalone external link pages ---

  startCreateExternal() {
    this.createExternalState = this.emptyExternalState();
    this.isCreatingExternal.set(true);
  }

  cancelCreateExternal() {
    this.isCreatingExternal.set(false);
  }

  saveCreateExternal() {
    const state = this.createExternalState;
    const payload: LorePage = {
      topic_id: this.topicId(),
      name: state.name,
      order: state.order,
      is_hidden: state.is_hidden,
      is_external_link: true,
      external_link: state.external_link || null,
    };
    this.apiService.post<LorePageInfo>('lore-page/create', payload).subscribe({
      next: (created) => {
        this.externalPages.update(list => [...list, created]);
        this.isCreatingExternal.set(false);
      },
      error: (err) => console.error('Failed to create external link page', err)
    });
  }

  startEditExternal(page: LorePageInfo) {
    this.externalEditingMap = {
      ...this.externalEditingMap,
      [page.id]: {
        name: page.name,
        order: page.order,
        is_hidden: page.is_hidden,
        is_external_link: true,
        external_link: page.external_link ?? '',
      }
    };
  }

  cancelEditExternal(page: LorePageInfo) {
    const updated = { ...this.externalEditingMap };
    delete updated[page.id];
    this.externalEditingMap = updated;
  }

  isEditingExternal(page: LorePageInfo): boolean {
    return page.id in this.externalEditingMap;
  }

  saveExternal(page: LorePageInfo) {
    const state = this.externalEditingMap[page.id];
    if (!state) return;
    const payload: LorePage = {
      topic_id: this.topicId(),
      name: state.name,
      order: state.order,
      is_hidden: state.is_hidden,
      is_external_link: true,
      external_link: state.external_link || null,
    };
    this.apiService.post<LorePageInfo>(`lore-page/update/${page.id}`, payload).subscribe({
      next: (updated) => {
        this.externalPages.update(list => list.map(p => p.id === page.id ? updated : p));
        this.cancelEditExternal(page);
      },
      error: (err) => console.error('Failed to update external link page', err)
    });
  }

  deleteExternal(page: LorePageInfo) {
    this.apiService.get<void>(`lore-page/delete/${page.id}`).subscribe({
      next: () => {
        this.externalPages.update(list => list.filter(p => p.id !== page.id));
      },
      error: (err) => console.error('Failed to delete external link page', err)
    });
  }
}
