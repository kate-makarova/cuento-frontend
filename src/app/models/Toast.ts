export class Toast {
  id: number;
  from: string;
  message: string;
  category: string;

  constructor(id: number, from: string, message: string, category: string) {
    this.id = id;
    this.from = from;
    this.message = message;
    this.category = category;
  }
}
