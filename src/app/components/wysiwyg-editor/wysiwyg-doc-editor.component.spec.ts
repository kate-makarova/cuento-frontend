import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { WysiwygDocEditorComponent } from './wysiwyg-doc-editor.component';
import { BoardService } from '../../services/board.service';
import { ImageService } from '../../services/image.service';

describe('WysiwygDocEditorComponent inventory actions', () => {
  let fixture: ComponentFixture<WysiwygDocEditorComponent>;
  let editor: WysiwygDocEditorComponent;
  const drop = { kind: 'drop' as const, items: '1:2' };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [WysiwygDocEditorComponent],
      providers: [
        { provide: BoardService, useValue: { board: signal({ use_image_uploading: 'n' }) } },
        { provide: ImageService, useValue: {} },
      ],
    });
    fixture = TestBed.createComponent(WysiwygDocEditorComponent);
    editor = fixture.componentInstance;
    fixture.detectChanges();
  });

  function type(text: string) {
    editor.onBeforeInput(new InputEvent('beforeinput', { inputType: 'insertText', data: text, cancelable: true }));
  }

  it('inserts an action with a placeholder that typing replaces', () => {
    editor.setValue('She ');
    editor.insertItemAction(drop, 'describe it');
    expect(editor.getValue()).toBe('[item-drop items=1:2]describe it[/item-drop]She ');

    type('X');
    expect(editor.getValue()).toBe('[item-drop items=1:2]X[/item-drop]She ');
  });

  it('wraps selected text in the action', () => {
    editor.setValue('he threw the sword');
    (editor as any).cursor = { anchor: { path: [0], offset: 3 }, focus: { path: [0], offset: 18 } };
    editor.insertItemAction({ kind: 'give', items: '3:1', to: 42 }, 'unused');
    expect(editor.getValue()).toBe('he [item-give to=42 items=3:1]threw the sword[/item-give]');
  });
});
