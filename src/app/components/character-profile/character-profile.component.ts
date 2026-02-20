import { Component, EventEmitter, inject, Input, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Post } from '../../models/Post';
import { ShortTextFieldDisplayComponent } from '../short-text-field-display/short-text-field-display.component';
import { LongTextFieldDisplayComponent } from '../long-text-field-display/long-text-field-display.component';
import { CharacterProfile, CustomFieldsData } from '../../models/Character';
import { FormsModule } from '@angular/forms';
import { CharacterService } from '../../services/character.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-character-profile',
  imports: [CommonModule, RouterLink, ShortTextFieldDisplayComponent, LongTextFieldDisplayComponent, FormsModule],
  templateUrl: './character-profile.component.html',
  standalone: true,
  styleUrl: './character-profile.component.css'
})
export class CharacterProfileComponent implements OnInit {
  private characterService = inject(CharacterService);
  private authService = inject(AuthService);

  @Input() post?: Post;
  @Input() accountName: string = '';
  @Output() characterSelected = new EventEmitter<number | null>();

  characters = this.characterService.userCharacterProfiles;
  selectedCharacterId: number | 'account' = 'account';

  displayName: string = '';
  displayAvatar: string = '';
  profileLink: string = '';
  isCharacter: boolean = false;
  customFields: any[] = [];

  ngOnInit() {
    if (this.post) {
      this.initFromPost();
    } else {
      this.characterService.loadUserCharacterProfiles();
      this.initForForm();
    }
  }

  private initFromPost() {
    if (this.post!.use_character_profile && this.post!.character_profile !== null) {
      this.isCharacter = true;
      this.displayName = this.post!.character_profile.character_name;
      this.displayAvatar = this.post!.character_profile.avatar;
      this.profileLink = `/character/${this.post!.character_profile.character_id}`;
      this.customFields = this.processCustomFields(this.post!.character_profile.custom_fields);
    } else {
      this.isCharacter = false;
      this.displayName = this.post!.user_profile?.user_name ?? '';
      this.displayAvatar = this.post!.user_profile?.avatar ?? '';
      this.profileLink = `/profile/${this.post!.user_profile?.user_id}`;
    }
  }

  private initForForm() {
    this.isCharacter = false;
    this.displayName = this.accountName;
    this.displayAvatar = this.authService.currentUser()?.avatar ?? '';
  }

  onSelect() {
    if (this.selectedCharacterId === 'account') {
      this.isCharacter = false;
      this.displayName = this.accountName;
      this.displayAvatar = this.authService.currentUser()?.avatar ?? '';
      this.customFields = [];
      this.characterSelected.emit(null);
    } else {
      const char = this.characters().find(c => c.id === +this.selectedCharacterId);
      if (char) {
        this.isCharacter = true;
        this.displayName = char.character_name;
        this.displayAvatar = char.avatar;
        this.customFields = this.processCustomFields(char.custom_fields);
        this.characterSelected.emit(char.character_id);
      }
    }
  }

  private processCustomFields(data: CustomFieldsData): any[] {
    if (!data || !data.field_config) return [];

    return data.field_config.map(config => {
      return {
        fieldMachineName: config.machine_field_name,
        fieldName: config.human_field_name,
        fieldValue: data.custom_fields ? data.custom_fields[config.machine_field_name] : null,
        type: config.content_field_type,
        showFieldName: true,
        order: config.order
      };
    }).sort((a, b) => a.order - b.order);
  }
}
