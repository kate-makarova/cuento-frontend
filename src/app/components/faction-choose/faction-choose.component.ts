import { Component, inject, effect, signal, Output, EventEmitter } from '@angular/core';
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
  private factionService = inject(FactionService);

  @Output() selectionChange = new EventEmitter<Faction[]>();

  factionLevels = signal<FactionLevel[]>([]);

  constructor() {
    this.addFactionLevel(0);
  }

  addFactionLevel(parentId: number) {
    this.factionService.getFactionChildren(parentId).subscribe(children => {
      if (children.length > 0 || this.factionLevels().length === 0) {
        this.factionLevels.update(levels => [
          ...levels,
          {
            label: `Faction ${levels.length + 1}`,
            options: children,
            selectedId: null
          }
        ]);
      }
    });
  }

  onFactionChange(levelIndex: number) {
    const currentLevels = this.factionLevels();
    let selectedId = currentLevels[levelIndex].selectedId;

    if (selectedId !== null) {
      selectedId = +selectedId;
      currentLevels[levelIndex].selectedId = selectedId;
    }

    const nextLevels = currentLevels.slice(0, levelIndex + 1);
    this.factionLevels.set(nextLevels);

    if (selectedId !== null) {
      this.addFactionLevel(selectedId);
    }

    this.emitSelection();
  }

  private emitSelection() {
    const selectedFactions = this.factionLevels()
      .map(level => level.options.find(f => f.id == level.selectedId))
      .filter((f): f is Faction => f !== undefined);

    this.selectionChange.emit(selectedFactions);
  }

  // Keep this for backward compatibility if needed, but prefer the event
  public getSelectedFactions(): Faction[] {
    return this.factionLevels()
      .map(level => level.options.find(f => f.id == level.selectedId))
      .filter((f): f is Faction => f !== undefined);
  }
}
