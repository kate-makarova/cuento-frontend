import {Component, ElementRef, ViewChild} from '@angular/core';
import {User} from '../models/User';
import {Message} from '../models/Message';
import {Chat} from '../models/Chat';

@Component({
  selector: 'app-messenger',
  imports: [],
  templateUrl: './messenger.component.html',
  styleUrl: './messenger.component.css'
})
export class MessengerComponent {
  @ViewChild('chatInput') messageField!: ElementRef<HTMLTextAreaElement>;

  activeUser: User  = new User(1, 'test', 'test', 'test');
  messages: Message[] = [
    new Message(1, 'Hi!', 'today', false)
  ];
  chatList: Chat[] = [
    new Chat(2, 'username', 'hi')
  ]

  insertTag(tag: string) {
    const textarea = this.messageField.nativeElement;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;

    // Handle tags with parameters like [color=red]
    const tagBase = tag.split('=')[0];
    const openTag = `[${tag}]`;
    const closeTag = `[/${tagBase}]`;

    const selectedText = text.substring(start, end);
    const replacement = openTag + selectedText + closeTag;

    textarea.value = text.substring(0, start) + replacement + text.substring(end);
    textarea.focus();

    // Position cursor
    const newPos = start + openTag.length + selectedText.length;
    textarea.setSelectionRange(newPos, newPos);
  }

  handleSend() {}
  selectUser(chat: Chat) {}
}
