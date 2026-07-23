import { Component, computed, effect, inject, OnInit, signal, untracked } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { debounceTime, distinctUntilChanged, Subject } from 'rxjs';
import { MigrationService } from '../services/migration.service';
import { CharacterService } from '../services/character.service';
import { MigrationStatus, ProcessingResult, ProcessingUser } from '../models/Migration';
import { CharacterShort } from '../models/Character';

@Component({
  selector: 'app-user-data-migration',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './user-data-migration.component.html',
  styleUrl: './user-data-migration.component.css'
})
export class UserDataMigrationComponent implements OnInit {
  private migrationService = inject(MigrationService);
  private characterService = inject(CharacterService);
  private route = inject(ActivatedRoute);

  private migrationId!: number;
  migration = this.migrationService.currentMigration;

  jsonBlob = '';
  processing = false;
  processError = '';
  processingResult = signal<ProcessingResult | null>(null);

  charSearchTerms: Record<string, string> = {};
  charSuggestions: Record<string, CharacterShort[]> = {};
  userMap = signal<Record<string, number>>({});
  private searchSubjects: Record<string, Subject<string>> = {};

  mappingSubmitting = false;
  mappingError = '';
  mappingSuccess = false;

  episodeSearchTerm = '';
  episodeSuggestions = signal<{ id: number; name: string }[]>([]);
  selectedEpisode: { id: number; name: string } | null = null;
  skipFirstPost = true;
  publishResult = signal<{ published_posts: number; skipped_posts: number } | null>(null);
  publishing = false;
  publishError = '';
  private episodeSearchSubject = new Subject<string>();

  canPublish = computed(() => {
    const m = this.migration();
    if (!m || m.parsed_post_count == null) return false;
    return m.parsed_post_count >= m.original_post_count;
  });

  readonly MigrationStatus = MigrationStatus;
  readonly statusLabels: Record<number, string> = {
    [MigrationStatus.Pending]: 'Pending',
    [MigrationStatus.Processed]: 'Processed',
    [MigrationStatus.Published]: 'Published'
  };

  displayUsers = computed<ProcessingUser[]>(() => {
    const map = this.migration()?.user_character_map;
    if (map && Object.keys(map).length > 0) return Object.values(map);
    return this.processingResult()?.found_users ?? [];
  });

  allMapped = computed(() => {
    const users = this.displayUsers();
    const map = this.userMap();
    return users.length > 0 && users.every(u =>
      u.character_id !== null || map[u.original_user_id] !== undefined
    );
  });

  constructor() {
    effect(() => {
      const users = this.displayUsers();
      untracked(() => { if (users.length > 0) this.syncUserMap(users); });
    });
  }

  ngOnInit() {
    this.migrationId = Number(this.route.snapshot.paramMap.get('id'));
    const current = this.migration();
    if (!current || current.id !== this.migrationId) {
      this.migrationService.loadById(this.migrationId);
    }

    this.episodeSearchSubject.pipe(debounceTime(300), distinctUntilChanged()).subscribe(term => {
      if (term.length < 2) { this.episodeSuggestions.set([]); return; }
      this.migrationService.episodeAutocomplete(term).subscribe({
        next: (results) => this.episodeSuggestions.set(results),
        error: () => {}
      });
    });
  }

  private syncUserMap(users: ProcessingUser[]) {
    const current = this.userMap();
    const updates: Record<string, number> = { ...current };
    for (const u of users) {
      if (!(u.original_user_id in this.charSearchTerms)) {
        this.charSearchTerms[u.original_user_id] = u.character_name ?? '';
        this.charSuggestions[u.original_user_id] = [];
      }
      if (u.character_id !== null && !(u.original_user_id in current)) {
        updates[u.original_user_id] = u.character_id;
      }
    }
    this.userMap.set(updates);
  }

  private apiError(err: any, fallback: string): string {
    return err?.error?.error || fallback;
  }

  process() {
    if (!this.jsonBlob.trim()) return;
    this.processing = true;
    this.processError = '';
    this.migrationService.process(this.migrationId, this.jsonBlob.trim()).subscribe({
      next: (result) => {
        this.processingResult.set(result);
        this.processing = false;
        this.migrationService.loadById(this.migrationId);
      },
      error: (err) => {
        this.processError = this.apiError(err, 'Processing failed. Please check the pasted content.');
        this.processing = false;
      }
    });
  }

  private getSearchSubject(userId: string): Subject<string> {
    if (!this.searchSubjects[userId]) {
      const subject = new Subject<string>();
      subject.pipe(debounceTime(300), distinctUntilChanged()).subscribe(term => {
        if (term.length < 2) { this.charSuggestions[userId] = []; return; }
        this.characterService.searchCharacters(term).subscribe({
          next: (chars) => { this.charSuggestions[userId] = chars; },
          error: () => {}
        });
      });
      this.searchSubjects[userId] = subject;
    }
    return this.searchSubjects[userId];
  }

  onCharInput(userId: string, term: string) {
    this.getSearchSubject(userId).next(term);
  }

  selectChar(userId: string, char: CharacterShort) {
    this.userMap.update(m => ({ ...m, [userId]: char.id }));
    this.charSearchTerms[userId] = char.name;
    this.charSuggestions[userId] = [];
  }

  clearChar(userId: string) {
    this.userMap.update(m => { const n = { ...m }; delete n[userId]; return n; });
    this.charSearchTerms[userId] = '';
    this.charSuggestions[userId] = [];
  }

  updateMapping() {
    this.mappingSubmitting = true;
    this.mappingError = '';
    this.mappingSuccess = false;
    this.migrationService.updateCharacterMap(this.migrationId, this.userMap()).subscribe({
      next: () => {
        this.mappingSuccess = true;
        this.mappingSubmitting = false;
        this.migrationService.loadById(this.migrationId);
      },
      error: (err) => {
        this.mappingError = this.apiError(err, 'Failed to update mapping.');
        this.mappingSubmitting = false;
      }
    });
  }

  onEpisodeInput(term: string) {
    this.selectedEpisode = null;
    this.episodeSearchSubject.next(term);
  }

  selectEpisode(ep: { id: number; name: string }) {
    this.selectedEpisode = ep;
    this.episodeSearchTerm = ep.name;
    this.episodeSuggestions.set([]);
  }

  publish() {
    if (!this.selectedEpisode) return;
    this.publishing = true;
    this.publishError = '';
    this.migrationService.publish({
      processing_id: this.migrationId,
      topic_id: this.selectedEpisode.id,
      user_map: this.userMap(),
      skip_first_post: this.skipFirstPost
    }).subscribe({
      next: (result) => {
        this.publishResult.set(result);
        this.publishing = false;
        this.migrationService.loadById(this.migrationId);
      },
      error: (err) => {
        this.publishError = this.apiError(err, 'Publishing failed.');
        this.publishing = false;
      }
    });
  }

  redoMapping() {
    this.mappingSuccess = false;
    this.mappingError = '';
    this.userMap.set({});
    for (const userId of Object.keys(this.charSearchTerms)) {
      this.charSearchTerms[userId] = '';
      this.charSuggestions[userId] = [];
    }
  }
}
