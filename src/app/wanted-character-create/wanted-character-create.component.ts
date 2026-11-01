import { Component, computed, effect, inject, OnInit, OnDestroy, Input, Output, EventEmitter, signal, ViewChild, ElementRef } from '@angular/core';
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
import { TopicType, TopicStatus } from '../models/Topic';
import { PreviewService } from '../services/preview.service';
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
  private previewService = inject(PreviewService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private entityDraftService = inject(EntityDraftService);

  @ViewChild('formEl') formEl?: ElementRef<HTMLFormElement>;

  template = this.wantedCharacterService.template;
  templateBlocks = this.wantedCharacterService.templateBlocks;
  templateBlockSettings = this.wantedCharacterService.templateBlockSettings;
  selectedBlocks = signal<Record<string, string>>({});

  visibleFields = computed(() => {
    const template = this.template();
    const blocks = this.templateBlocks();
    const toggles = this.templateBlockSettings();
    if (toggles.length === 0) return template;
    const hidden = new Set<string>();
    for (const toggle of toggles) {
      const selected = this.selectedBlocks()[toggle.machine_name] ?? toggle.children[0];
      for (const childId of toggle.children) {
        if (childId !== selected) {
          const block = blocks.find(b => b.id === childId);
          if (block) block.fields.forEach(f => hidden.add(f));
        }
      }
    }
    return template.filter(f => !hidden.has(f.machine_field_name));
  });

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

    effect(() => {
      const toggles = this.templateBlockSettings();
      if (toggles.length === 0) return;
      const existing = (this.initialData as any)?.custom_fields?.block_settings ?? {};
      const init: Record<string, string> = {};
      for (const toggle of toggles) {
        init[toggle.machine_name] = existing[toggle.machine_name] ?? toggle.children[0];
      }
      this.selectedBlocks.set(init);
    }, { allowSignalWrites: true });
  }
  characterName = signal<string>('');
  factionPaths: Faction[][] = [[]];
  initialFactions = signal<Faction[]>([]);
  draftCustomFields = signal<Record<string, any>>({});

  relationInputValues = signal<string[]>(['']);
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
    const previewState = this.previewService.state();
    if (previewState?.formType === 'wanted_character') {
      const p = previewState.formPayload;
      this.initialData = {
        name: p.name,
        factions: p.factions,
        custom_fields: { custom_fields: p.custom_fields },
        relations: p._relationItems ?? []
      } as any;
      this.previewService.clear();
    }

    this.statusActive.set((this.initialData?.wanted_character_status ?? 1) === 0);
    this.wantedCharacterService.loadTemplate();

    this.route.queryParams.subscribe(params => {
      if (params['fid']) {
        this.subforumId = +params['fid'];
        this.forumService.loadSubforum(this.subforumId);
      }
    });

    if (this.initialData) {
      this.characterName.set(this.initialData.name);
      if (this.initialData.relations && this.initialData.relations.length > 0) {
        this.relationInputValues.set(this.initialData.relations.map(r => r.name));
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
      name: formData ? (formData.get('req_name') as string) : this.characterName(),
      factionPaths: this.factionPaths,
      relations: this.selectedRelationIds
        .map((id, i) => id !== null ? { id, name: this.relationInputValues()[i] } : null)
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
        if (c.name) this.characterName.set(c.name);
        if (c.relations?.length) {
          this.relationInputValues.set(c.relations.map((r: any) => r.name));
          this.selectedRelationIds = c.relations.map((r: any) => r.id);
        }
        if (c.factionPaths?.length) this.initialFactions.set(c.factionPaths.flat());
        if (c.customFields) this.draftCustomFields.set(c.customFields);
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
    return this.draftCustomFields()[machineName] ?? null;
  }

  onCancel() {
    this.cancel.emit();
  }

  onFactionsChanged(paths: Faction[][]) {
    this.factionPaths = paths;
  }

  onRelationInput(index: number, value: string) {
    this.relationInputValues.update(arr => { const copy = [...arr]; copy[index] = value; return copy; });
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
    this.relationInputValues.update(arr => { const copy = [...arr]; copy[index] = char.name; return copy; });
    this.selectedRelationIds[index] = char.id;
    this.activeRelationIndex = null;
    this.characterService.loadShortCharacterList('');
  }

  addRelationField() {
    this.relationInputValues.update(arr => [...arr, '']);
    this.selectedRelationIds.push(null);
  }

  removeRelationField(index: number) {
    this.relationInputValues.update(arr => arr.filter((_, i) => i !== index));
    this.selectedRelationIds.splice(index, 1);
    if (this.activeRelationIndex === index) {
      this.activeRelationIndex = null;
      this.characterService.loadShortCharacterList('');
    } else if (this.activeRelationIndex !== null && this.activeRelationIndex > index) {
      this.activeRelationIndex--;
    }
  }

  onBlockToggle(toggleName: string, blockId: string) {
    this.selectedBlocks.update(s => ({ ...s, [toggleName]: blockId }));
  }

  getBlock(blockId: string) {
    return this.templateBlocks().find(b => b.id === blockId) ?? null;
  }

  collectBlockSettings(): Record<string, string> {
    const result: Record<string, string> = {};
    for (const toggle of this.templateBlockSettings()) {
      result[toggle.machine_name] = this.selectedBlocks()[toggle.machine_name] ?? toggle.children[0];
    }
    return result;
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

    const relationItems = this.selectedRelationIds
      .map((id, i) => id !== null ? { id, name: this.relationInputValues()[i] } : null)
      .filter((r): r is { id: number; name: string } => r !== null);

    const request = {
      subforum_id: this.subforumId,
      name: formData.get('req_name') as string,
      custom_fields: customFields,
      factions,
      relations,
      _relationItems: relationItems,
      block_settings: this.collectBlockSettings()
    };

    const isPreview = ((event as SubmitEvent).submitter as HTMLInputElement | null)?.name === 'preview';

    if (isPreview) {
      this.wantedCharacterService.preview(request).subscribe({
        next: (wantedCharacter: WantedCharacter) => {
          this.previewService.set({
            formType: 'wanted_character',
            topic: {
              id: 0, name: wantedCharacter.name, subforum_id: 0,
              date_created: '', date_last_post: '', date_last_post_localized: null,
              author_user_id: 0, author_username: '',
              post_number: 0, last_post_author_user_id: null, last_post_author_username: null,
              type: TopicType.wanted_character, status: TopicStatus.active,
              episode: null, character: null, wanted_character: wantedCharacter
            },
            posts: [],
            returnUrl: this.router.url,
            formPayload: request
          });
          this.router.navigate(['/preview']);
        },
        error: (err: any) => console.error('Preview failed', err)
      });
      return;
    }

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
          if (response?.topic_id) {
            this.router.navigate(['/viewtopic', response.topic_id]);
          } else {
            this.router.navigate(['/viewforum', this.subforumId]);
          }
        },
        error: (err) => console.error('Failed to save wanted character', err)
      });
    }
  }
}
