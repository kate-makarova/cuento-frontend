import { Component, inject, OnInit } from '@angular/core';
import { FormArray, FormControl, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { EpisodeService } from '../services/episode.service';
import { CharacterService } from '../services/character.service';
import { ShortTextFieldComponent } from '../components/short-text-field/short-text-field.component';
import { LongTextFieldComponent } from '../components/long-text-field/long-text-field.component';
import { ImageFieldComponent } from '../components/image-field/image-field.component';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { Router } from '@angular/router';

@Component({
  selector: 'app-episode-create',
  imports: [CommonModule, ReactiveFormsModule, ShortTextFieldComponent, LongTextFieldComponent, ImageFieldComponent],
  templateUrl: './episode-create.component.html',
  standalone: true,
  styleUrl: './episode-create.component.css'
})
export class EpisodeCreateComponent implements OnInit {
  episodeService = inject(EpisodeService);
  characterService = inject(CharacterService);
  router = inject(Router);
  episodeTemplate = this.episodeService.episodeTemplate;
  characterSuggestions = this.characterService.shortCharacterList;

  // Character inputs
  characterControls = new FormArray([new FormControl('')]);

  // Track which input is currently active for suggestions
  activeInputIndex: number | null = null;

  constructor() {
    this.setupAutocomplete(0);
  }

  ngOnInit() {
    this.episodeService.loadEpisodeTemplate();
  }

  setupAutocomplete(index: number) {
    this.characterControls.at(index).valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(value => {
      if (value && value.length >= 2) {
        this.activeInputIndex = index;
        this.characterService.loadShortCharacterList(value);
      } else {
        this.activeInputIndex = null;
        this.characterService.loadShortCharacterList('');
      }
    });
  }

  selectCharacter(index: number, charName: string) {
    this.characterControls.at(index).setValue(charName, { emitEvent: false });
    this.activeInputIndex = null;
    this.characterService.loadShortCharacterList('');
  }

  addCharacterField() {
    this.characterControls.push(new FormControl(''));
    this.setupAutocomplete(this.characterControls.length - 1);
  }

  removeCharacterField(index: number) {
    if (this.characterControls.length > 1) {
      this.characterControls.removeAt(index);
      // If we removed the active input, clear suggestions
      if (this.activeInputIndex === index) {
        this.activeInputIndex = null;
        this.characterService.loadShortCharacterList('');
      } else if (this.activeInputIndex !== null && this.activeInputIndex > index) {
        // Adjust index if we removed an item before the active one
        this.activeInputIndex--;
      }
    }
  }

  onSubmit(event: Event) {
    event.preventDefault();
    const form = event.target as HTMLFormElement;
    const formData = new FormData(form);

    const data: any = {};
    formData.forEach((value, key) => {
      data[key] = value;
    });

    // Add characters manually
    // Filter out empty values
    data['characters'] = this.characterControls.value.filter((c: string|null) => c && c.trim() !== '');

    this.episodeService.createEpisode(data).subscribe({
      next: (response) => {
        console.log('Episode created successfully', response);
        // Navigate to episode list or the new episode
        this.router.navigate(['/episode-list']);
      },
      error: (err) => {
        console.error('Failed to create episode', err);
      }
    });
  }
}
