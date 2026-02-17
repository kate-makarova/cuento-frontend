import { Component, EventEmitter, inject, Input, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Post } from '../../models/Post';
import { ShortTextFieldDisplayComponent } from '../short-text-field-display/short-text-field-display.component';
import { LongTextFieldDisplayComponent } from '../long-text-field-display/long-text-field-display.component';
import { CharacterProfile } from '../../models/Character';
import { FormsModule } from '@angular/forms';
import { CharacterService } from '../../services/character.service';

@Component({
  selector: 'app-character-profile',
  imports: [CommonModule, RouterLink, ShortTextFieldDisplayComponent, LongTextFieldDisplayComponent, FormsModule],
  templateUrl: './character-profile.component.html',
  standalone: true,
  styleUrl: './character-profile.component.css'
})
export class CharacterProfileComponent implements OnInit {
  private characterService = inject(CharacterService);

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
    if (this.post!.useCharacterProfile && this.post!.authorCharacterProfile !== null) {
      this.isCharacter = true;
      this.displayName = this.post!.authorCharacterProfile.name;
      this.displayAvatar = this.post!.authorCharacterProfile.avatar;
      this.profileLink = `/character/${this.post!.authorCharacterProfile.id}`;
      this.customFields = this.post!.authorCharacterProfile.customFields;
    } else {
      this.isCharacter = false;
      this.displayName = this.post!.authorUserProfile.userName;
      this.displayAvatar = this.post!.authorUserProfile.avatar;
      this.profileLink = `/profile/${this.post!.authorUserProfile.id}`;
    }
  }

  private initForForm() {
    this.isCharacter = false;
    this.displayName = this.accountName;
    this.displayAvatar = 'assets/default-avatar.png'; // Default or from user profile if available
  }

  onSelect() {
    if (this.selectedCharacterId === 'account') {
      this.isCharacter = false;
      this.displayName = this.accountName;
      this.displayAvatar = 'assets/default-avatar.png';
      this.customFields = [];
      this.characterSelected.emit(null);
    } else {
      const char = this.characters().find(c => c.id === +this.selectedCharacterId);
      if (char) {
        this.isCharacter = true;
        this.displayName = char.name;
        this.displayAvatar = char.avatar;
        this.customFields = char.customFields;
        this.characterSelected.emit(char.id);
      }
    }
  }
}
