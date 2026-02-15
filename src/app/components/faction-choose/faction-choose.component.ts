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

  constructor() {
    // Initialize with the first faction level
    this.factionLevels.push({
      label: 'Faction 1',
      options: this.factionService.currentFactionChildren(),
      selectedId: null
    });

    // Watch for faction children updates and update the last level's options
    effect(() => {
      const children = this.factionService.currentFactionChildren();

      if (this.factionLevels.length > 0) {
        const lastLevel = this.factionLevels[this.factionLevels.length - 1];
        lastLevel.options = children;
      }
    });

    // Load initial children (parent id 0)
    this.factionService.setCurrentFaction(0);
  }

  onFactionChange(levelIndex: number, factionId: string) {
    const selectedId = Number(factionId);
    // Update the selected value
    this.factionLevels[levelIndex].selectedId = selectedId;

    // Remove all levels after this one
    this.factionLevels = this.factionLevels.slice(0, levelIndex + 1);

    // Set the current faction in the service to load its children
    this.factionService.setCurrentFaction(selectedId);

    // Add a new level for the children (will be populated by the effect)
    this.factionLevels.push({
      label: `Faction ${this.factionLevels.length + 1}`,
      options: [],
      selectedId: null
    });
  }
}
