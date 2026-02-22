import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CharacterService } from '../services/character.service';
import { ShortTextFieldComponent } from '../components/short-text-field/short-text-field.component';
import { LongTextFieldComponent } from '../components/long-text-field/long-text-field.component';
import { ImageFieldComponent } from '../components/image-field/image-field.component';
import { FactionChooseComponent } from '../components/faction-choose/faction-choose.component';
import { CreateCharacterRequest } from '../models/Character';
import { Faction } from '../models/Faction';

@Component({
  selector: 'app-character-create',
  imports: [ShortTextFieldComponent, LongTextFieldComponent, ImageFieldComponent, FactionChooseComponent],
  templateUrl: './character-create.component.html',
  standalone: true,
  styleUrl: './character-create.component.css'
})
export class CharacterCreateComponent implements OnInit {
  characterService = inject(CharacterService);
  router = inject(Router);
  route = inject(ActivatedRoute);
  characterTemplate = this.characterService.characterTemplate;

  subforumId: number = 0;
  selectedFactions: Faction[] = [];

  ngOnInit() {
    this.characterService.loadCharacterTemplate();
    this.route.queryParams.subscribe(params => {
      if (params['fid']) {
        this.subforumId = +params['fid'];
      }
    });
  }

  onFactionsChanged(factions: any[]) {
    console.log('--- CharacterCreate: onFactionsChanged called with:', factions);
    this.selectedFactions = factions;
  }

  onSubmit(event: Event) {
    event.preventDefault();
    const form = event.target as HTMLFormElement;
    const formData = new FormData(form);

    const customFields: { [key: string]: any } = {};
    this.characterTemplate().forEach(field => {
      let value: any = formData.get(field.machine_field_name);
      if (value !== null) {
        if (field.field_type === 'int') {
          value = parseInt(value, 10);
        }
        customFields[field.machine_field_name] = {
          'content': value
        };
      }
    });

    console.log('--- CharacterCreate: onSubmit selectedFactions:', this.selectedFactions);

    const factions = this.selectedFactions.map(f => ({
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

    const request: CreateCharacterRequest = {
      subforum_id: this.subforumId,
      name: formData.get('req_name') as string,
      avatar: formData.get('req_avatar') as string,
      custom_fields: customFields,
      factions: factions
    };

    this.characterService.createCharacter(request).subscribe({
      next: (response) => {
        console.log('Character created successfully', response);
        this.router.navigate(['/viewforum', this.subforumId]);
      },
      error: (err) => {
        console.error('Failed to create character', err);
      }
    });
  }
}
