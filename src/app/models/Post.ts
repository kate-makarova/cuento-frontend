import {CharacterProfile} from './CharacterProfile';
import {UserProfile} from './UserProfile';

export class Post {
  id: number;
  topicId: number;
  authorUserProfile: UserProfile;
  authorCharacterProfile: CharacterProfile|null = null;
  message: string;
  createdAt: string;

  constructor(id: number, topicId: number, authorUser: UserProfile,
              message: string, createdAt: string, authorCharacter: CharacterProfile|null = null) {
    this.id = id;
    this.topicId = topicId;
    this.authorUserProfile = authorUser;
    this.message = message;
    this.createdAt = createdAt;
    this.authorCharacterProfile = authorCharacter;
  }
}
