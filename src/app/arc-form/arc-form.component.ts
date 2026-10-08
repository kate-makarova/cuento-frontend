import { Component, computed, inject, OnInit, signal, ViewChild } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { debounceTime, distinctUntilChanged, Subject, switchMap } from 'rxjs';
import { ArcService } from '../services/arc.service';
import { FactionService } from '../services/faction.service';
import { AuthService } from '../services/auth.service';
import { UserService } from '../services/user.service';
import { BoardService } from '../services/board.service';
import { ArcSaveRequest, ArcStatus, StoryArc } from '../models/StoryArc';
import { UserShort } from '../models/UserShort';
import { SaveButtonComponent, SaveState } from '../admin/save-button/save-button.component';
import { CroppedImageFieldComponent } from '../components/cropped-image-field/cropped-image-field.component';

@Component({
  selector: 'app-arc-form',
  host: { class: 'pun-page' },
  standalone: true,
  imports: [FormsModule, RouterLink, SaveButtonComponent, CroppedImageFieldComponent],
  templateUrl: './arc-form.component.html',
  styleUrl: './arc-form.component.css',
})
export class ArcFormComponent implements OnInit {
  private arcService = inject(ArcService);
  private factionService = inject(FactionService);
  private authService = inject(AuthService);
  private userService = inject(UserService);
  private boardService = inject(BoardService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  @ViewChild('croppedImageRef') croppedImageRef?: CroppedImageFieldComponent;

  readonly canUpload = computed(() => this.boardService.board().use_image_uploading === 'y');

  readonly factions = this.factionService.factions;

  isEdit = false;
  arcId: number | null = null;
  saveState = signal<SaveState>('idle');
  loading = signal(true);

  // Form fields
  title = '';
  description = '';
  status = ArcStatus.Pending;
  isPublic = false;
  imageUrl = '';
  selectedFactionIds: number[] = [];
  selectedGMs: UserShort[] = [];

  // GM autocomplete
  gmSearchQuery = '';
  gmSuggestions = signal<UserShort[]>([]);
  private gmSearch$ = new Subject<string>();

  readonly ArcStatus = ArcStatus;
  readonly allStatuses = [
    { value: ArcStatus.Pending,  label: $localize`:@@arcform.statusPending:Pending` },
    { value: ArcStatus.Active,   label: $localize`:@@arcform.statusActive:Active` },
    { value: ArcStatus.Archived, label: $localize`:@@arcform.statusArchived:Archived` },
    { value: ArcStatus.Finished, label: $localize`:@@arcform.statusFinished:Finished` },
  ];

  constructor() {
    this.factionService.loadFactions();
    this.gmSearch$.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap(term => term.length >= 2 ? this.userService.searchUsers(term) : [])
    ).subscribe(results => this.gmSuggestions.set(results));
  }

  ngOnInit(): void {
    const idStr = this.route.snapshot.paramMap.get('id');

    if (idStr) {
      this.isEdit = true;
      this.arcId = Number(idStr);
      this.arcService.getArc(this.arcId).subscribe({
        next: (arc) => {
          if (!arc.can_edit) {
            this.router.navigate(['/403']);
            return;
          }
          this.populateForm(arc);
          this.loading.set(false);
        },
        error: () => this.router.navigate(['/403']),
      });
    } else {
      if (!this.authService.hasPermission('can_create_story_arc')) {
        this.router.navigate(['/403']);
        return;
      }
      this.loading.set(false);
    }
  }

  private populateForm(arc: StoryArc): void {
    this.title = arc.title;
    this.description = arc.description ?? '';
    this.status = arc.status;
    this.isPublic = arc.is_public;
    this.imageUrl = arc.image_url ?? '';
    this.selectedFactionIds = arc.factions.map(f => f.id);
    this.selectedGMs = arc.game_masters.map(gm => ({ id: gm.id, username: gm.username, avatar: gm.avatar ?? null }));
  }

  isFactionSelected(id: number): boolean {
    return this.selectedFactionIds.includes(id);
  }

  toggleFaction(id: number): void {
    const idx = this.selectedFactionIds.indexOf(id);
    if (idx > -1) this.selectedFactionIds.splice(idx, 1);
    else this.selectedFactionIds.push(id);
  }

  onGmSearchInput(): void {
    this.gmSearch$.next(this.gmSearchQuery);
    if (this.gmSearchQuery.length < 2) this.gmSuggestions.set([]);
  }

  selectGm(user: UserShort): void {
    if (!this.selectedGMs.some(gm => gm.id === user.id)) {
      this.selectedGMs.push(user);
    }
    this.gmSearchQuery = '';
    this.gmSuggestions.set([]);
  }

  removeGm(id: number): void {
    this.selectedGMs = this.selectedGMs.filter(gm => gm.id !== id);
  }

  submit(): void {
    if (!this.title.trim()) return;

    const resolvedImageUrl = this.canUpload()
      ? (this.croppedImageRef?.value || undefined)
      : (this.imageUrl.trim() || undefined);

    const request: ArcSaveRequest = {
      title: this.title.trim(),
      description: this.description.trim() || undefined,
      status: this.status,
      is_public: this.isPublic,
      image_url: resolvedImageUrl,
      faction_ids: this.selectedFactionIds,
      game_master_ids: this.selectedGMs.map(gm => gm.id),
    };

    this.saveState.set('loading');

    if (this.isEdit) {
      this.arcService.updateArc(this.arcId!, request).subscribe({
        next: (arc) => {
          this.saveState.set('success');
          setTimeout(() => this.router.navigate(['/arc', arc.id]), 1000);
        },
        error: () => {
          this.saveState.set('error');
          setTimeout(() => this.saveState.set('idle'), 3000);
        },
      });
    } else {
      this.arcService.createArc(request).subscribe({
        next: (arc) => {
          this.saveState.set('success');
          setTimeout(() => this.router.navigate(['/arc', arc.id]), 1000);
        },
        error: () => {
          this.saveState.set('error');
          setTimeout(() => this.saveState.set('idle'), 3000);
        },
      });
    }
  }
}
