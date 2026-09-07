import { Component, effect, inject, OnInit, OnDestroy, Input, Output, EventEmitter, signal, ViewChild, ElementRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, Subscription } from 'rxjs';
import { debounceTime } from 'rxjs/operators';
import { WantedCharacterService } from '../services/wanted-character.service';
import { CharacterService } from '../services/character.service';
import { FieldInputComponent } from '../components/field-input/field-input.component';
import { FactionPathsComponent } from '../components/faction-paths/faction-paths.component';
import { BreadcrumbItem, BreadcrumbsComponent } from '../components/breadcrumbs/breadcrumbs.component';
import { ForumService } from '../services/forum.service';
import { Faction } from '../models/Faction';
import { CharacterShort } from '../models/Character';
import { WantedCharacter } from '../models/WantedCharacter';
import { TopicService } from '../services/topic.service';
import { EntityDraftService } from '../services/entity-draft.service';

@Component({
  selector: 'app-wanted-character-create',
  host: { class: 'pun-page' },
  standalone: true,
  imports: [ FieldInputComponent, FactionPathsComponent, BreadcrumbsComponent],
  templateUrl: './wanted-character-create.component.html',
})
export class WantedCharacterCreateComponent implements OnInit, OnDestroy {
  private wantedCharacterService = inject(WantedCharacterService);
  private characterService = inject(CharacterService);
  private topicService = inject(TopicService);
  private forumService = inject(ForumService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private entityDraftService = inject(EntityDraftService);

  @ViewChild('formEl') formEl?: ElementRef<HTMLFormElement>;

  template = this.wantedCharacterService.template;
  characterSuggestions = this.characterService.shortCharacterList;
  subforumId: number = 0;
  breadcrumbs: BreadcrumbItem[] = [];

  constructor() {
    effect(() => {
      const s = this.forumService.subforum();
      if (s?.id) {
        this.breadcrumbs = [
          { label: 'Home', link: '/' },
          { label: s.name, link: `/viewforum/${s.id}` },
          { label: $localize`:@@topiccreate.wantedCharacter:Wanted character` }
        ];
      }
    });
  }
  characterName: string = '';
  factionPaths: Faction[][] = [[]];

  relationInputValues: string[] = [''];
  selectedRelationIds: (number | null)[] = [null];
  activeRelationIndex: number | null = null;
  private relationSearchTimer: any = null;

  @Input() initialData: WantedCharacter | null = null;
  @Output() formSubmit = new EventEmitter<any>();
  @Output() cancel = new EventEmitter<void>();

  statusActive = signal(false);
  showConfirmModal = signal(false);

  draftId = signal<number | null>(null);
  hasDraft = signal(false);
  autosaveStatus = signal<'idle' | 'saving' | 'saved'>('idle');
  private autosaveSubject = new Subject<void>();
  private autosaveSub?: Subscription;

  activate() {
    if (!this.initialData) return;
    this.wantedCharacterService.activate(this.initialData.id).subscribe({
      next: (res) => {
        this.statusActive.set(res.wanted_character_status === 0);
        this.topicService.updateTopicStatus(res.topic_status);
        this.topicService.updateWantedCharacterStatus(res.wanted_character_status);
      },
      error: (err) => console.error('Failed to activate wanted character', err)
    });
  }

  requestDeactivate() {
    this.showConfirmModal.set(true);
  }

  confirmDeactivate() {
    if (!this.initialData) return;
    this.wantedCharacterService.deactivate(this.initialData.id).subscribe({
      next: (res) => {
        this.statusActive.set(res.wanted_character_status === 0);
        this.topicService.updateTopicStatus(res.topic_status);
        this.topicService.updateWantedCharacterStatus(res.wanted_character_status);
        this.showConfirmModal.set(false);
      },
      error: (err) => console.error('Failed to deactivate wanted character', err)
    });
  }

  cancelDeactivate() {
    this.showConfirmModal.set(false);
  }

  ngOnInit() {
    this.statusActive.set((this.initialData?.wanted_character_status ?? 1) === 0);
    this.wantedCharacterService.loadTemplate();
    this.route.queryParams.subscribe(params => {
      if (params['fid']) {
        this.subforumId = +params['fid'];
        this.forumService.loadSubforum(this.subforumId);
      }
    });

    if (this.initialData) {
      this.characterName = this.initialData.name;
      if (this.initialData.relations && this.initialData.relations.length > 0) {
        this.relationInputValues = this.initialData.relations.map(r => r.name);
        this.selectedRelationIds = this.initialData.relations.map(r => r.id);
      }
    } else {
      this.autosaveSub = this.autosaveSubject.pipe(debounceTime(3000)).subscribe(() => this.performAutosave());
      this.entityDraftService.loadLatest('wanted_character').subscribe({
        next: draft => {
          this.draftId.set(draft.id);
          this.hasDraft.set(true);
        },
        error: () => {}
      });
    }
  }

  ngOnDestroy() {
    this.autosaveSub?.unsubscribe();
  }

  scheduleAutosave() {
    if (this.initialData) return;
    this.autosaveSubject.next();
  }

  private collectFormState(): any {
    const formData = this.formEl ? new FormData(this.formEl.nativeElement) : null;
    const customFields: Record<string, any> = {};
    if (formData) {
      for (const [key, value] of formData.entries()) {
        if (key !== 'req_name') customFields[key] = value;
      }
    }
    return {
      name: formData ? (formData.get('req_name') as string) : this.characterName,
      factionPaths: this.factionPaths,
      relations: this.selectedRelationIds
        .map((id, i) => id !== null ? { id, name: this.relationInputValues[i] } : null)
        .filter(Boolean),
      customFields,
    };
  }

  private performAutosave() {
    this.autosaveStatus.set('saving');
    this.entityDraftService.save('wanted_character', this.collectFormState(), this.draftId()).subscribe({
      next: meta => {
        this.draftId.set(meta.id);
        this.autosaveStatus.set('saved');
        setTimeout(() => this.autosaveStatus.set('idle'), 3000);
      },
      error: () => this.autosaveStatus.set('idle'),
    });
  }

  restoreDraft() {
    const id = this.draftId();
    if (!id) return;
    this.entityDraftService.loadLatest('wanted_character').subscribe({
      next: draft => {
        const c = draft.content;
        if (c.name) this.characterName = c.name;
        if (c.relations?.length) {
          this.relationInputValues = c.relations.map((r: any) => r.name);
          this.selectedRelationIds = c.relations.map((r: any) => r.id);
        }
        this.hasDraft.set(false);
      },
      error: () => {}
    });
  }

  dismissDraft() {
    const id = this.draftId();
    if (id) this.entityDraftService.delete(id).subscribe({ error: () => {} });
    this.hasDraft.set(false);
    this.draftId.set(null);
  }

  getFieldValue(machineName: string): any {
    if (this.initialData?.custom_fields?.custom_fields) {
      const field = this.initialData.custom_fields.custom_fields[machineName];
      return field ? (field.data ?? field.content) : null;
    }
    return null;
  }

  onCancel() {
    this.cancel.emit();
  }

  onFactionsChanged(paths: Faction[][]) {
    this.factionPaths = paths;
  }

  onRelationInput(index: number, value: string) {
    this.relationInputValues[index] = value;
    this.selectedRelationIds[index] = null;
    clearTimeout(this.relationSearchTimer);
    if (value.length >= 2) {
      this.activeRelationIndex = index;
      this.relationSearchTimer = setTimeout(() => {
        this.characterService.loadShortCharacterList(value);
      }, 300);
    } else {
      this.activeRelationIndex = null;
      this.characterService.loadShortCharacterList('');
    }
  }

  selectRelation(index: number, char: CharacterShort) {
    this.relationInputValues[index] = char.name;
    this.selectedRelationIds[index] = char.id;
    this.activeRelationIndex = null;
    this.characterService.loadShortCharacterList('');
  }

  addRelationField() {
    this.relationInputValues.push('');
    this.selectedRelationIds.push(null);
  }

  removeRelationField(index: number) {
    this.relationInputValues.splice(index, 1);
    this.selectedRelationIds.splice(index, 1);
    if (this.activeRelationIndex === index) {
      this.activeRelationIndex = null;
      this.characterService.loadShortCharacterList('');
    } else if (this.activeRelationIndex !== null && this.activeRelationIndex > index) {
      this.activeRelationIndex--;
    }
  }

  onSubmit(event: Event) {
    event.preventDefault();
    const form = event.target as HTMLFormElement;
    const formData = new FormData(form);

    const customFields: { [key: string]: any } = {};
    this.template().forEach(field => {
      let value: any = formData.get(field.machine_field_name);
      if (value !== null) {
        if (field.field_type === 'int') {
          const parsed = parseInt(value, 10);
          value = isNaN(parsed) ? null : parsed;
        } else if (field.content_field_type === 'free_format_date') {
          try { value = JSON.parse(value); } catch { value = null; }
        }
        customFields[field.machine_field_name] = { content: value };
      }
    });

    const allSelectedFactions = this.factionPaths.flat();
    const uniqueFactions = Array.from(new Map(allSelectedFactions.map(f => [f.id, f])).values());
    const factions = uniqueFactions.map(f => ({
      id: f.id,
      name: f.name,
      parent_id: f.parent_id,
      level: f.level,
      description: f.description,
      icon: f.icon,
      show_on_profile: true,
      faction_status: 0,
      characters: []
    }));

    const relations = this.selectedRelationIds.filter((id): id is number => id !== null);

    const request = {
      subforum_id: this.subforumId,
      name: formData.get('req_name') as string,
      custom_fields: customFields,
      factions,
      relations
    };

    const deleteDraft = () => {
      const id = this.draftId();
      if (id) this.entityDraftService.delete(id).subscribe({ error: () => {} });
    };

    if (this.formSubmit.observed) {
      deleteDraft();
      this.formSubmit.emit(request);
    } else {
      this.wantedCharacterService.save(request).subscribe({
        next: (response: any) => {
          deleteDraft();
          if (response?.id) {
            this.router.navigate(['/viewtopic', response.id]);
          } else {
            this.router.navigate(['/viewforum', this.subforumId]);
          }
        },
        error: (err) => console.error('Failed to save wanted character', err)
      });
    }
  }
}
