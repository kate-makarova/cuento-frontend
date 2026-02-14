import { Component } from '@angular/core';
import { LongTextFieldComponent } from '../components/long-text-field/long-text-field.component';

@Component({
  selector: 'app-topic-create',
  imports: [LongTextFieldComponent],
  templateUrl: './topic-create.component.html',
  styleUrl: './topic-create.component.css'
})
export class TopicCreateComponent {
  accountName = 'User123';
  currentName = 'User123';
  currentAvatarUrl = 'assets/default-avatar.png';

  characters = [
    { id: 1, name: 'Hero Knight', avatar: 'assets/knight.png' },
    { id: 2, name: 'Dark Mage', avatar: 'assets/mage.png' }
  ];

  onCharacterChange(event: Event) {
    const select = event.target as HTMLSelectElement;
    const selectedId = select.value;

    if (selectedId === 'account') {
      this.currentName = this.accountName;
      this.currentAvatarUrl = 'assets/default-avatar.png';
    } else {
      const char = this.characters.find(c => c.id === +selectedId);
      if (char) {
        this.currentName = char.name;
        this.currentAvatarUrl = char.avatar;
      }
    }
  }
}
