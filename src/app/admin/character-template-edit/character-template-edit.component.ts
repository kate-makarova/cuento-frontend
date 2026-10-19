import { Component, inject, signal, OnInit, effect } from '@angular/core';
import { CharacterService } from '../../services/character.service';
import { FieldTemplateRowComponent, FieldTemplateForm } from '../field-template-row/field-template-row.component';
import { BlockSettingsEditorComponent } from '../block-settings-editor/block-settings-editor.component';
import { Block, BlockSettingToggle } from '../../models/FieldTemplate';
import { SaveButtonComponent } from '../save-button/save-button.component';

@Component({
  selector: 'app-character-template-edit',
  host: { class: 'pun-page' },
  imports: [FieldTemplateRowComponent, SaveButtonComponent, BlockSettingsEditorComponent],
  templateUrl: './character-template-edit.component.html',
  standalone: true,
  styleUrl: './character-template-edit.component.css'
})
export class CharacterTemplateEditComponent implements OnInit {
  characterService = inject(CharacterService);
  fields: FieldTemplateForm[] = [];
  blocks: Block[] = [];
  blockSettings: BlockSettingToggle[] = [];
  saveState = signal<'idle' | 'loading' | 'success' | 'error'>('idle');
  schemaConflicts = signal<{ machineName: string; existingType: string; newType: string }[]>([]);

  dbSchema = this.characterService.characterDbSchema;

  private templateLoaded = false;

  constructor() {
    effect(() => {
      const template = this.characterService.characterTemplate();
      const blocks = this.characterService.characterTemplateBlocks();
      const blockSettings = this.characterService.characterTemplateBlockSettings();
      if (template.length > 0 && !this.templateLoaded) {
        this.templateLoaded = true;
        this.fields = template.map((field, index) => ({ ...field, id: index }));
        this.addEmptyField();
        this.blocks = [...blocks];
        this.blockSettings = [...blockSettings];
      }
    });
  }

  ngOnInit() {
    this.characterService.loadCharacterTemplate();
    this.characterService.loadCharacterDbFieldSchema();

    setTimeout(() => {
      if (this.fields.length === 0) {
        this.addEmptyField();
      }
    }, 200);
  }

  addEmptyField() {
    this.fields.push({
      id: this.fields.length,
      machine_field_name: '',
      human_field_name: '',
      field_type: 'text',
      content_field_type: 'string',
      order: this.fields.length
    });
  }

  removeField(index: number) {
    this.fields.splice(index, 1);
    this.schemaConflicts.set([]);
  }

  private normalizeFieldType(fieldType: string): string {
    return fieldType === 'select' ? 'int' : fieldType;
  }

  saveTemplate() {
    const data = this.fields.filter(field => field.machine_field_name !== '');
    const schemaMap = new Map(this.characterService.characterDbSchema().map(s => [s.machine_name, s.field_type]));

    const conflicts = data
      .filter(field => {
        const existingType = schemaMap.get(field.machine_field_name);
        return existingType !== undefined && existingType !== this.normalizeFieldType(field.field_type);
      })
      .map(field => ({
        machineName: field.machine_field_name,
        existingType: schemaMap.get(field.machine_field_name)!,
        newType: field.field_type
      }));

    if (conflicts.length > 0) {
      this.schemaConflicts.set(conflicts);
      return;
    }

    this.schemaConflicts.set([]);
    this.saveState.set('loading');
    this.characterService.saveCharacterTemplate(data, this.blocks, this.blockSettings).subscribe({
      next: () => { this.saveState.set('success'); setTimeout(() => this.saveState.set('idle'), 3000); },
      error: () => { this.saveState.set('error'); setTimeout(() => this.saveState.set('idle'), 3000); }
    });
  }
}
