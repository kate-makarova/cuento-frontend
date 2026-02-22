import {Component, inject, OnInit, ViewChild} from '@angular/core';
import {CharacterService} from '../services/character.service';
import {ShortTextFieldComponent} from '../components/short-text-field/short-text-field.component';
import {LongTextFieldComponent} from '../components/long-text-field/long-text-field.component';
import {ImageFieldComponent} from '../components/image-field/image-field.component';
import {FactionChooseComponent} from '../components/faction-choose/faction-choose.component';
import {ActivatedRoute, Router} from '@angular/router';
import {CreateCharacterRequest} from '../models/Character';

@Component({
  selector: 'app-character-create',
  imports: [ShortTextFieldComponent, LongTextFieldComponent, ImageFieldComponent, FactionChooseComponent],
  templateUrl: './character-create.component.html',
  standalone: true,
  styleUrl: './character-create.component.css'
})
export class CharacterCreateComponent implements OnInit
{
  characterService = inject(CharacterService);
  router = inject(Router);
  route = inject(ActivatedRoute);
  characterTemplate = this.characterService.characterTemplate;

  subforumId: number = 0;

  @ViewChild(FactionChooseComponent) factionChoose!: FactionChooseComponent;

  ngOnInit() {
    this.characterService.loadCharacterTemplate();
    this.route.queryParams.subscribe(params => {
      if (params['fid']) {
        this.subforumId = +params['fid'];
      }
    });
  }

  onSubmit(event: Event) {
    event.preventDefault();
    const form = event.target as HTMLFormElement;
    const formData = new FormData(form);

    const customFields: { [key: string]: any } = {};
    this.characterTemplate().forEach(field => {
      const value = formData.get(field.machine_field_name);
      if (value !== null) {
        customFields[field.machine_field_name] = {
          'content': value
        };
      }
    });

    const factions = this.factionChoose.getSelectedFactions().map(f => ({
      ...f,
      faction_status: 0,
      show_on_profile: true
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
