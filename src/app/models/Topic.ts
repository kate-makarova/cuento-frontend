export class Topic {
  id: number;
  name: string;
  description: string;
  forumId: number;
  createdAt: string;
  lastPostDate: string;

  constructor(id: number, name: string, description: string, forumId: number,
              createdAt: string, lastPostDate: string) {
    this.id = id;
    this.name = name;
    this.description = description;
    this.forumId = forumId;
    this.createdAt = createdAt;
    this.lastPostDate = lastPostDate;
  }
}
