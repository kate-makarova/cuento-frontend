export class Chat {
  id: number;
  userName: string;
  lastMessage: string;

  constructor(id: number, userName: string, lastMessage: string) {
    this.id = id;
    this.userName = userName;
    this.lastMessage = lastMessage;
  }
}
