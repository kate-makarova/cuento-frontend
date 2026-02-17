import {UserProfile} from './UserProfile';
import {CharacterProfile} from './Character';


export class Post {
  id: number;
  topicId: number;
  authorUserProfile: UserProfile;
  useCharacterProfile: boolean = false;
  authorCharacterProfile: CharacterProfile|null = null;
  message: string;
  createdAt: string;

  constructor(id: number, topicId: number, authorUser: UserProfile,
              message: string, createdAt: string, authorCharacter: CharacterProfile|null = null,
              useCharacterProfile: boolean = false) {
    this.id = id;
    this.topicId = topicId;
    this.authorUserProfile = authorUser;
    this.message = message;
    this.createdAt = createdAt;
    this.authorCharacterProfile = authorCharacter;
    this.useCharacterProfile = useCharacterProfile;
  }
}
