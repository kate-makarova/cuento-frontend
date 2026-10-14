import { Component, Input, Output, EventEmitter } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Block, BlockSettingToggle, FieldTemplate } from '../../models/FieldTemplate';

@Component({
  selector: 'app-block-settings-editor',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './block-settings-editor.component.html',
  styleUrl: './block-settings-editor.component.css'
})
export class BlockSettingsEditorComponent {
  @Input() availableFields: FieldTemplate[] = [];
  @Input() blocks: Block[] = [];
  @Input() blockSettings: BlockSettingToggle[] = [];
  @Output() blocksChange = new EventEmitter<Block[]>();
  @Output() blockSettingsChange = new EventEmitter<BlockSettingToggle[]>();

  get namedFields(): FieldTemplate[] {
    return this.availableFields.filter(f => f.machine_field_name !== '');
  }

  addBlock() {
    this.blocks = [...this.blocks, { id: '', label: '', fields: [] }];
    this.blocksChange.emit(this.blocks);
  }

  removeBlock(index: number) {
    const removedId = this.blocks[index].id;
    this.blocks = this.blocks.filter((_, i) => i !== index);
    if (removedId) {
      this.blockSettings = this.blockSettings.map(t => ({
        ...t,
        children: t.children.filter(c => c !== removedId)
      }));
      this.blockSettingsChange.emit(this.blockSettings);
    }
    this.blocksChange.emit(this.blocks);
  }

  isFieldInBlock(block: Block, machineName: string): boolean {
    return block.fields.includes(machineName);
  }

  toggleFieldInBlock(block: Block, machineName: string) {
    const idx = block.fields.indexOf(machineName);
    block.fields = idx >= 0
      ? block.fields.filter(f => f !== machineName)
      : [...block.fields, machineName];
    this.blocksChange.emit([...this.blocks]);
  }

  onBlockChange() {
    this.blocksChange.emit([...this.blocks]);
  }

  addToggle() {
    this.blockSettings = [...this.blockSettings, { machine_name: '', label: '', children: [], control_type: 'manual' }];
    this.blockSettingsChange.emit(this.blockSettings);
  }

  removeToggle(index: number) {
    this.blockSettings = this.blockSettings.filter((_, i) => i !== index);
    this.blockSettingsChange.emit(this.blockSettings);
  }

  isBlockInToggle(toggle: BlockSettingToggle, blockId: string): boolean {
    return toggle.children.includes(blockId);
  }

  toggleChildBlock(toggle: BlockSettingToggle, blockId: string) {
    const idx = toggle.children.indexOf(blockId);
    toggle.children = idx >= 0
      ? toggle.children.filter(c => c !== blockId)
      : [...toggle.children, blockId];
    this.blockSettingsChange.emit([...this.blockSettings]);
  }

  onToggleChange() {
    this.blockSettingsChange.emit([...this.blockSettings]);
  }
}
