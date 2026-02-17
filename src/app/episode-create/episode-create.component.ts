import { Component, inject, OnInit } from '@angular/core';
import { FormArray, FormControl, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { EpisodeService } from '../services/episode.service';
import { CharacterService } from '../services/character.service';
import { ShortTextFieldComponent } from '../components/short-text-field/short-text-field.component';
import { LongTextFieldComponent } from '../components/long-text-field/long-text-field.component';
import { ImageFieldComponent } from '../components/image-field/image-field.component';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { ActivatedRoute, Router } from '@angular/router';
import { CreateEpisodeRequest } from '../models/Episode';

@Component({
  selector: 'app-episode-create',
  imports: [CommonModule, ReactiveFormsModule, ShortTextFieldComponent, LongTextFieldComponent, ImageFieldComponent],
  templateUrl: './episode-create.component.html',
  styleUrl: './episode-create.component.css'
})
export class EpisodeCreateComponent implements OnInit {
  episodeService = inject(EpisodeService);
  characterService = inject(CharacterService);
  router = inject(Router);
  route = inject(ActivatedRoute);
  episodeTemplate = this.episodeService.episodeTemplate;
  characterSuggestions = this.characterService.shortCharacterList;

  // Character inputs
  characterControls = new FormArray([new FormControl('')]);
  selectedCharacterIds: (number | null)[] = [null];

  // Track which input is currently active for suggestions
  activeInputIndex: number | null = null;

  subforumId: number = 0;

  constructor() {
    this.setupAutocomplete(0);
  }

  ngOnInit() {
    this.episodeService.loadEpisodeTemplate();
    this.route.queryParams.subscribe(params => {
      if (params['fid']) {
        this.subforumId = +params['fid'];
      }
    });
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

  selectCharacter(index: number, charName: string, charId: number) {
    this.characterControls.at(index).setValue(charName, { emitEvent: false });
    this.selectedCharacterIds[index] = charId;
    this.activeInputIndex = null;
    this.characterService.loadShortCharacterList('');
  }

  addCharacterField() {
    this.characterControls.push(new FormControl(''));
    this.selectedCharacterIds.push(null);
    this.setupAutocomplete(this.characterControls.length - 1);
  }

  removeCharacterField(index: number) {
    if (this.characterControls.length > 1) {
      this.characterControls.removeAt(index);
      this.selectedCharacterIds.splice(index, 1);

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

    const customFields: any = {};

    // Iterate over template to get custom fields
    this.episodeTemplate().forEach(field => {
      const value = formData.get(field.machine_field_name);
      if (value !== null) {
        customFields[field.machine_field_name] = value;
      }
    });

    const request: CreateEpisodeRequest = {
      subforum_id: this.subforumId,
      name: formData.get('req_subject') as string,
      character_ids: this.selectedCharacterIds.filter((id): id is number => id !== null),
      custom_fields: customFields
    };

    this.episodeService.createEpisode(request).subscribe({
      next: (response) => {
        console.log('Episode created successfully', response);
        this.router.navigate(['/viewforum', this.subforumId]);
      },
      error: (err) => {
        console.error('Failed to create episode', err);
      }
    });
  }
}
