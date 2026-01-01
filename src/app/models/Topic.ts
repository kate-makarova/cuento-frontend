export class Topic {
  id: number;
  name: string;
  description: string;
  createdAt: string;
  lastPostDate: string;

  constructor(id: number, name: string, description: string, createdAt: string, lastPostDate: string) {
    this.id = id;
    this.name = name;
    this.description = description;
    this.createdAt = createdAt;
    this.lastPostDate = lastPostDate;
  }
}
