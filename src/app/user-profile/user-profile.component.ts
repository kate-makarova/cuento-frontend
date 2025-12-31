import { Component } from '@angular/core';

interface Character {
  id: number;
  name: string;
  avatar: string;
  bio: string;
  race: string;
  status: string;
}

@Component({
  selector: 'app-user-profile',
  standalone: true,
  templateUrl: './user-profile.component.html',
  styleUrls: ['./user-profile.component.css']
})
export class UserProfileComponent {
  user = {
    username: 'Viper',
    avatar: 'https://viperstest.rusff.me/i/avatars/00/00/00/01.png',
    registrationDate: '2025-10-12'
  };

  isOwnProfile = true;

  characters: Character[] = [
    {
      id: 101,
      name: 'Soren the Exile',
      avatar: 'https://i.pravatar.cc/150?u=soren',
      bio: 'A disgraced knight from the northern reaches, wandering the wastes in search of redemption. He carries a shattered blade that still hums with ancestral magic.',
      race: 'Human',
      status: 'Active'
    },
    {
      id: 102,
      name: 'Valerius Vance',
      avatar: 'https://i.pravatar.cc/150?u=valerius',
      bio: 'A smooth-talking merchant with a hidden talent for shadow-weaving. He deals in information and rare artifacts, always keeping one eye on the nearest exit.',
      race: 'Elf',
      status: 'In Prison'
    }
  ];

  addCharacter() {}
}
