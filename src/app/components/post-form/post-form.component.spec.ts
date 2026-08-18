import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { of } from 'rxjs';
import { PostFormComponent } from './post-form.component';
import { UserService } from '../../services/user.service';
import { AuthService } from '../../services/auth.service';
import { ImageService } from '../../services/image.service';
import { BoardService } from '../../services/board.service';

const HAIR_SPACE = ' ';

function makeUser(username: string) {
  return { id: 1, username, avatar: null };
}

describe('PostFormComponent', () => {
  let component: PostFormComponent;
  let fixture: ComponentFixture<PostFormComponent>;
  let textarea: HTMLTextAreaElement;

  const mockAuthService = { currentUser: () => ({ editor_type: 2 }) }; // 2 = bbcode
  const mockBoardService = { board: signal({ use_image_uploading: 'n' }) };
  const mockUserService = { searchUsers: () => of([]) };
  const mockImageService = {};

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PostFormComponent],
      providers: [
        { provide: AuthService, useValue: mockAuthService },
        { provide: BoardService, useValue: mockBoardService },
        { provide: UserService, useValue: mockUserService },
        { provide: ImageService, useValue: mockImageService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(PostFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    textarea = fixture.nativeElement.querySelector('textarea');
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('mention autocomplete (bbcode mode)', () => {
    function setTextareaValue(value: string, cursorAt: number) {
      textarea.value = value;
      textarea.setSelectionRange(cursorAt, cursorAt);
    }

    function triggerInput() {
      textarea.dispatchEvent(new Event('input'));
      fixture.detectChanges();
    }

    it('inserts username + hair space after @, replacing the typed partial', () => {
      setTextareaValue('@kat', 4);
      triggerInput();

      component.selectMention(makeUser('katemakarova'));

      expect(textarea.value).toBe('@katemakarova' + HAIR_SPACE);
    });

    it('preserves the @ sign', () => {
      setTextareaValue('@v', 2);
      triggerInput();

      component.selectMention(makeUser('viper'));

      expect(textarea.value.startsWith('@')).toBeTrue();
    });

    it('replaces only the partial typed after @ when preceded by other text', () => {
      setTextareaValue('hello @kat', 10);
      triggerInput();

      component.selectMention(makeUser('katemakarova'));

      expect(textarea.value).toBe('hello @katemakarova' + HAIR_SPACE);
    });

    it('uses U+200A hair space (not regular space) as the trailing character', () => {
      setTextareaValue('@u', 2);
      triggerInput();

      component.selectMention(makeUser('user'));

      const inserted = textarea.value;
      const lastChar = inserted.codePointAt(inserted.length - 1);
      expect(lastChar).toBe(0x200A);
    });

    it('places cursor after the hair space', () => {
      setTextareaValue('@v', 2);
      triggerInput();

      component.selectMention(makeUser('viper'));

      const expected = ('@viper' + HAIR_SPACE).length;
      expect(textarea.selectionStart).toBe(expected);
      expect(textarea.selectionEnd).toBe(expected);
    });

    it('clears mention results after selection', () => {
      setTextareaValue('@v', 2);
      triggerInput();
      component.mentionResults = [makeUser('viper')];

      component.selectMention(makeUser('viper'));

      expect(component.mentionResults.length).toBe(0);
    });

    it('preserves text after cursor', () => {
      setTextareaValue('@kat world', 4);
      triggerInput();

      component.selectMention(makeUser('kate'));

      expect(textarea.value).toBe('@kate' + HAIR_SPACE + ' world');
    });
  });
});
