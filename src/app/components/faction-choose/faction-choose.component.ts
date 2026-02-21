import { Component, inject, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FactionService } from '../../services/faction.service';
import { Faction } from '../../models/Faction';

interface FactionLevel {
  label: string;
  options: Faction[];
  selectedId: number | null;
}

@Component({
  selector: 'app-faction-choose',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './faction-choose.component.html',
  styleUrl: './faction-choose.component.css'
})
export class FactionChooseComponent {
  factionService = inject(FactionService);
  factionLevels: FactionLevel[] = [];
  showModal = false;
  modalLevelIndex: number | null = null;
  newFactionName = '';
  newFactionDescription = '';
  newFactionIcon = '';
  private tempIdCounter = -1;

  constructor() {
    this.factionLevels.push({
      label: 'Faction 1',
      options: this.factionService.currentFactionChildren(),
      selectedId: null
    });

    effect(() => {
      const children = this.factionService.currentFactionChildren();
      if (this.factionLevels.length > 0) {
        const lastLevel = this.factionLevels[this.factionLevels.length - 1];
        if (children.length === 0 && lastLevel.options.length === 0 && this.factionLevels.length > 1) {
          this.factionLevels.pop();
        } else {
          lastLevel.options = children;
        }
      }
    });

    this.factionService.setCurrentFaction(0);
  }

  onFactionChange(levelIndex: number, selectedId: number | null) {
    if (selectedId === null) return;

    this.factionLevels = this.factionLevels.slice(0, levelIndex + 1);
    this.factionService.setCurrentFaction(selectedId);

    this.factionLevels.push({
      label: `Faction ${this.factionLevels.length + 1}`,
      options: [],
      selectedId: null
    });
  }

  openModal(levelIndex: number) {
    this.modalLevelIndex = levelIndex;
    this.showModal = true;
    this.newFactionName = '';
    this.newFactionDescription = '';
    this.newFactionIcon = '';
  }

  closeModal() {
    this.showModal = false;
    this.modalLevelIndex = null;
  }

  submitNewFaction() {
    if (this.modalLevelIndex !== null && this.newFactionName.trim()) {
      const level = this.factionLevels[this.modalLevelIndex];
      const parentId = this.modalLevelIndex > 0 ? this.factionLevels[this.modalLevelIndex - 1].selectedId : 0;

      const tempId = this.tempIdCounter--;
      const newFaction: Faction = {
        id: tempId,
        name: this.newFactionName,
        parent_id: parentId,
        level: this.modalLevelIndex,
        description: this.newFactionDescription || null,
        icon: this.newFactionIcon || null,
        show_on_profile: false,
        characters: []
      };

      level.options.push(newFaction);
      level.selectedId = tempId;
      this.factionLevels = this.factionLevels.slice(0, this.modalLevelIndex + 1);
      this.closeModal();
    }
  }

  public getSelectedFactions(): Faction[] {
    const selectedFactions: Faction[] = [];
    this.factionLevels.forEach(level => {
      if (level.selectedId !== null) {
        const faction = level.options.find(f => f.id === level.selectedId);
        if (faction) {
          selectedFactions.push(faction);
        }
      }
    });
    return selectedFactions;
  }
}
