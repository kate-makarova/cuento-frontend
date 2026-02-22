import { Component, inject, OnInit, effect } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CharacterService } from '../services/character.service';
import { ShortTextFieldComponent } from '../components/short-text-field/short-text-field.component';
import { LongTextFieldComponent } from '../components/long-text-field/long-text-field.component';
import { ImageFieldComponent } from '../components/image-field/image-field.component';
import { NumberFieldComponent } from '../components/number-field/number-field.component';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-character-profile-edit',
  imports: [ShortTextFieldComponent, LongTextFieldComponent, ImageFieldComponent, NumberFieldComponent, FormsModule],
  templateUrl: './character-profile-edit.component.html',
  styleUrl: './character-profile-edit.component.css',
  standalone: true
})
export class CharacterProfileEditComponent implements OnInit {
  private characterService = inject(CharacterService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  template = this.characterService.characterProfileTemplate;
  profile = this.characterService.characterProfile;

  characterId: number = 0;
  characterName: string = '';
  characterAvatar: string = '';

  constructor() {
    effect(() => {
      const p = this.profile();
      if (p) {
        this.characterName = p.character_name;
        this.characterAvatar = p.avatar;
      }
    });
  }

  ngOnInit() {
    this.characterService.loadCharacterProfileTemplate();
    this.route.params.subscribe(params => {
      if (params['id']) {
        this.characterId = +params['id'];
        this.characterService.loadCharacterProfile(this.characterId);
      }
    });
  }

  onSubmit(event: Event) {
    event.preventDefault();
    const form = event.target as HTMLFormElement;
    const formData = new FormData(form);

    const customFields: { [key: string]: any } = {};
    this.template().forEach(field => {
      let value: any = formData.get(field.machine_field_name);
      if (value !== null) {
        if (field.content_field_type === 'number') {
          value = parseInt(value, 10);
        }
        customFields[field.machine_field_name] = {
          'content': value
        };
      }
    });

    const payload = {
      avatar: this.characterAvatar,
      custom_fields: customFields
    };

    this.characterService.updateCharacterProfile(this.characterId, payload).subscribe({
      next: () => {
        console.log('Character profile updated successfully');
      },
      error: (err) => console.error('Failed to update character profile', err)
    });
  }

  getFieldValue(machineName: string): any {
    const p = this.profile();
    if (!p || !p.custom_fields || !p.custom_fields.custom_fields) return null;
    const field = p.custom_fields.custom_fields[machineName];
    return field ? field.content : null;
  }
}
