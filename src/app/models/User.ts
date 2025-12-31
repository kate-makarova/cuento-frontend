export class User {
  id: number;
  username: string;
  email: string;
  avatar: string;

  constructor(id: number, username: string, email: string, avatar: string) {
    this.id = id;
    this.username = username;
    this.email = email;
    this.avatar = avatar;
  }
}
