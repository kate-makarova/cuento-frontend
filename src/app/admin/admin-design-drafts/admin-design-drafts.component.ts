import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { DesignDraftService } from '../../services/design-draft.service';
import { DesignDraftListItem } from '../../models/DesignDraft';

@Component({
  selector: 'app-admin-design-drafts',
  host: { class: 'pun-page' },
  standalone: true,
  imports: [CommonModule, DatePipe, RouterLink, FormsModule],
  templateUrl: './admin-design-drafts.component.html',
})
export class AdminDesignDraftsComponent implements OnInit {
  private draftService = inject(DesignDraftService);
  private router = inject(Router);

  drafts = signal<DesignDraftListItem[]>([]);
  showCreateModal = signal(false);
  publishingDraft = signal<DesignDraftListItem | null>(null);
  deletingDraft = signal<DesignDraftListItem | null>(null);
  newDraftName = '';

  ngOnInit() {
    this.load();
  }

  load() {
    this.draftService.list().subscribe({
      next: (data) => this.drafts.set(data),
      error: (err) => console.error('Failed to load design drafts', err),
    });
  }

  openPreview(draft: DesignDraftListItem) {
    window.open(`/?draft=${draft.session_key}`, '_blank');
  }

  openCreateModal() {
    this.newDraftName = '';
    this.showCreateModal.set(true);
  }

  closeCreateModal() {
    this.showCreateModal.set(false);
  }

  confirmPublish(draft: DesignDraftListItem) {
    this.publishingDraft.set(draft);
  }

  cancelPublish() {
    this.publishingDraft.set(null);
  }

  publish() {
    const draft = this.publishingDraft();
    if (!draft) return;
    this.draftService.publish(draft.id).subscribe({
      next: () => this.publishingDraft.set(null),
      error: (err) => console.error('Failed to publish design draft', err),
    });
  }

  createDraft() {
    if (!this.newDraftName.trim()) return;
    this.draftService.create({ name: this.newDraftName.trim() }).subscribe({
      next: (draft) => {
        this.showCreateModal.set(false);
        this.drafts.update(list => [draft, ...list]);
        this.router.navigate(['/admin/design-drafts', draft.id]);
      },
      error: (err) => console.error('Failed to create design draft', err),
    });
  }

  confirmDelete(draft: DesignDraftListItem) {
    this.deletingDraft.set(draft);
  }

  cancelDelete() {
    this.deletingDraft.set(null);
  }

  deleteDraft() {
    const draft = this.deletingDraft();
    if (!draft) return;
    this.draftService.delete(draft.id).subscribe({
      next: () => {
        this.drafts.update(list => list.filter(d => d.id !== draft.id));
        this.deletingDraft.set(null);
      },
      error: (err) => console.error('Failed to delete design draft', err),
    });
  }
}
