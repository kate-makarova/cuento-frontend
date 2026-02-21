import { Component, ElementRef, Input, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-long-text-field',
  imports: [CommonModule],
  templateUrl: './long-text-field.component.html',
  standalone: true,
  styleUrl: './long-text-field.component.css'
})
export class LongTextFieldComponent {
  @Input() fieldName: string | undefined;
  @Input() fieldValue: string = '';
  @Input() showFieldName: boolean = true;
  @Input() name: string | undefined;
  @Input() rows: number = 20;

  @ViewChild('messageField') messageField!: ElementRef<HTMLTextAreaElement>;

  activeArea: string | null = null;

  fonts = ['Arial', 'Verdana', 'Georgia', 'Times New Roman', 'Courier New', 'Impact'];
  colors = ['black', 'white', 'red', 'blue', 'green', 'yellow', 'purple', 'gray', 'silver'];

  toggleArea(area: string) {
    this.activeArea = this.activeArea === area ? null : area;
  }

  insertTag(tag: string) {
    const textarea = this.messageField.nativeElement;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;

    let openTag = `[${tag}]`;
    let closeTag = `[/${tag.split('=')[0]}]`;

    const selectedText = text.substring(start, end);
    const replacement = openTag + selectedText + closeTag;

    textarea.value = text.substring(0, start) + replacement + text.substring(end);

    this.activeArea = null;
    textarea.focus();

    const newPos = start + openTag.length + selectedText.length;
    textarea.setSelectionRange(newPos, newPos);
  }
}
