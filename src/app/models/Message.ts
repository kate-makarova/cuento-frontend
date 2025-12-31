import {ElementRef} from '@angular/core';

export class Message {
  id: number;
  text: string;
  time: string;
  isMe: boolean;

  constructor(id: number, text: string, time: string, isMe: boolean) {
    this.id = id;
    this.text = text;
    this.time = time;
    this.isMe = isMe;
  }
}
