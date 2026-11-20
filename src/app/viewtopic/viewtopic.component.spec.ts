import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ViewtopicComponent } from './viewtopic.component';
import { TopicService } from '../services/topic.service';
import { ForumService } from '../services/forum.service';
import { CharacterService } from '../services/character.service';
import { AuthService } from '../services/auth.service';
import { ActivatedRoute, Router } from '@angular/router';
import { of, Subject, EMPTY } from 'rxjs';
import { signal, WritableSignal, ChangeDetectionStrategy } from '@angular/core';
import { Topic, TopicType, TopicStatus } from '../models/Topic';
import { Post } from '../models/Post';
import { CommonModule } from '@angular/common';
import { RouterTestingModule } from '@angular/router/testing';
import { Component, Input, Output, EventEmitter } from '@angular/core';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { throwError } from 'rxjs';
import { InventoryService } from '../services/inventory.service';
import { EpisodeStatus } from '../models/Episode';

@Component({
  selector: 'app-episode-create',
  changeDetection: ChangeDetectionStrategy.Eager,
  template: ''
})
class MockEpisodeCreateComponent {
  @Input() initialData: any;
  @Output() formSubmit = new EventEmitter<any>();
  @Output() cancel = new EventEmitter<void>();
}

@Component({
  selector: 'app-character-create',
  changeDetection: ChangeDetectionStrategy.Eager,
  template: ''
})
class MockCharacterCreateComponent {
  @Input() initialData: any;
  @Output() formSubmit = new EventEmitter<any>();
  @Output() cancel = new EventEmitter<void>();
}

describe('ViewtopicComponent', () => {
  let component: ViewtopicComponent;
  let fixture: ComponentFixture<ViewtopicComponent>;
  let topicServiceSpy: jasmine.SpyObj<TopicService>;
  let forumServiceSpy: jasmine.SpyObj<ForumService>;
  let characterServiceSpy: jasmine.SpyObj<CharacterService>;
  let authServiceSpy: jasmine.SpyObj<AuthService>;
  let inventoryServiceSpy: jasmine.SpyObj<InventoryService>;

  let topicSignal: WritableSignal<Topic>;
  let postsSignal: WritableSignal<Post[]>;
  let currentPageSignal: WritableSignal<{page: number, topicId: number}>;

  // Initial topic has ID 0 to trigger loadTopic when route param is 1
  const mockTopic: Topic = {
    id: 0,
    name: 'Test Topic',
    subforum_id: 1,
    date_created: '2023-01-01',
    date_last_post: '2023-01-02',
    date_last_post_localized: null,
    author_user_id: 1,
    author_username: 'User1',
    post_number: 20,
    last_post_author_user_id: 1,
    last_post_author_username: 'User1',
    type: TopicType.general,
    status: TopicStatus.active,
    episode: null,
    character: null,
    wanted_character: null,
    can_edit: true
  };

  const mockPosts: Post[] = [
    { id: 1, topic_id: 1, user_profile: { user_id: 1, user_name: 'User1', avatar: '', total_posts: 0, total_general_posts: 0 }, use_character_profile: false, character_profile: null, content: 'Post 1', content_html: 'Post 1', date_created: '2023-01-01', date_created_localized: '2023-01-01', author_user_id: 1, author_user_name: 'User1', can_edit: true },
    { id: 2, topic_id: 1, user_profile: { user_id: 2, user_name: 'User2', avatar: '', total_posts: 0, total_general_posts: 0 }, use_character_profile: false, character_profile: null, content: 'Post 2', content_html: 'Post 2', date_created: '2023-01-02', date_created_localized: '2023-01-02', author_user_id: 2, author_user_name: 'User2', can_edit: false }
  ];

  beforeEach(async () => {
    topicSignal = signal(mockTopic);
    postsSignal = signal(mockPosts);
    currentPageSignal = signal({ page: 1, topicId: 1 });

    topicServiceSpy = jasmine.createSpyObj('TopicService', ['loadTopic', 'loadPosts', 'createPost', 'updatePost', 'updateLocalPost', 'updateTopic', 'updateLocalTopic', 'clear', 'removeLocalPost'], {
      topic: topicSignal,
      posts: postsSignal,
      currentPage: currentPageSignal,
      wsNewPosts: signal([]),
      ownPostAdded$: new Subject<{ postId: number; page: number }>(),
      pageLoaded$: new Subject<{ page: number; topicId: number }>()
    });
    forumServiceSpy = jasmine.createSpyObj('ForumService', ['loadSubforum'], {
      subforum: signal(null)
    });
    characterServiceSpy = jasmine.createSpyObj('CharacterService', ['loadUserCharacterProfilesForTopic', 'loadUserCharacterProfiles', 'loadShortCharacterList', 'clearUserCharacterProfiles'], {
      userCharacterProfiles: signal([])
    });
    authServiceSpy = jasmine.createSpyObj('AuthService', ['hasPermission'], {
      currentUser: signal({ id: 1, username: 'User1', avatar: '', roles: [] }),
      isAdmin: signal(false),
      isAuthenticated: signal(true)
    });
    authServiceSpy.hasPermission.and.returnValue(false);
    inventoryServiceSpy = jasmine.createSpyObj('InventoryService', ['getPostInventory', 'getCurrentInventories', 'getRecipients']);

    await TestBed.configureTestingModule({
      imports: [ViewtopicComponent, CommonModule, RouterTestingModule, HttpClientTestingModule],
      providers: [
        { provide: TopicService, useValue: topicServiceSpy },
        { provide: ForumService, useValue: forumServiceSpy },
        { provide: CharacterService, useValue: characterServiceSpy },
        { provide: AuthService, useValue: authServiceSpy },
        { provide: InventoryService, useValue: inventoryServiceSpy },
        {
          provide: ActivatedRoute,
          useValue: {
            paramMap: of({ get: (key: string) => (key === 'id' ? '1' : null) }),
            queryParamMap: of({ get: (key: string) => (key === 'page' ? '1' : null) }),
            snapshot: { queryParamMap: { get: () => null } } // Mock snapshot
          }
        }
      ]
    })
    .overrideComponent(ViewtopicComponent, {
      remove: { imports: [MockEpisodeCreateComponent, MockCharacterCreateComponent] },
      add: { imports: [MockEpisodeCreateComponent, MockCharacterCreateComponent] }
    })
    .compileComponents();

    fixture = TestBed.createComponent(ViewtopicComponent);
    component = fixture.componentInstance;

    topicServiceSpy.loadTopic.and.returnValue(EMPTY);
    characterServiceSpy.loadUserCharacterProfilesForTopic.and.returnValue(EMPTY);

    // Set inputs manually since we are not running a real router navigation
    fixture.componentRef.setInput('id', 1);
    fixture.componentRef.setInput('page', 1);

    fixture.detectChanges();

    // Simulate topic loaded: id must match input to make isTopicLoading() false
    topicSignal.set({ ...mockTopic, id: 1 });
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load topic and posts on init', () => {
    expect(topicServiceSpy.loadTopic).toHaveBeenCalledWith(1);
    expect(topicServiceSpy.loadPosts).toHaveBeenCalledWith(1, 1, undefined);
  });

  it('should display topic title', () => {
    // We need to update the signal to reflect the loaded topic for the template to render it
    topicSignal.set({ ...mockTopic, id: 1 });
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('h1')?.textContent).toContain('Test Topic');
  });

  it('should display posts', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const posts = compiled.querySelectorAll('.post');
    expect(posts.length).toBe(2);
  });

  it('should show edit link for editable post', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const posts = compiled.querySelectorAll('.post');
    const firstPostLinks = posts[0].querySelector('.post-links');
    expect(firstPostLinks?.textContent).toContain('Edit');
  });

  it('should not show edit link for non-editable post', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const posts = compiled.querySelectorAll('.post');
    const secondPostLinks = posts[1].querySelector('.post-links');
    expect(secondPostLinks?.textContent).not.toContain('Edit');
  });

  it('should show edit link for topic header when can_edit is true', () => {
    topicSignal.set({ ...mockTopic, id: 1, can_edit: true });
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    const headerEdit = compiled.querySelector('.main-header a.topic-edit');
    expect(headerEdit?.textContent?.trim()).toContain('Edit');
  });

  it('should toggle edit mode for topic', () => {
    component.editTopic(new Event('click'));
    expect(component.editingTopic()).toBeTrue();

    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    const input = compiled.querySelector('input[name="title"]');
    expect(input).toBeTruthy();
  });

  it('should calculate total pages correctly', () => {
    // 20 posts, 15 per page -> 2 pages
    expect(component.totalPages()).toBe(2);
  });

  it('should show pagination when pages > 1', () => {
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    const pagination = compiled.querySelector('.pagelink');
    expect(pagination?.textContent).toContain('Pages');
  });

  describe('scene inventory', () => {
    const inCharacterPost = (id: number): Post => ({
      ...mockPosts[0], id, use_character_profile: true,
      character_profile: { id: 40 + id, character_id: 70 + id } as any,
    });

    function showScene(usesInventory: boolean, status = EpisodeStatus.Active) {
      topicSignal.set({
        ...mockTopic, id: 1, type: TopicType.episode,
        episode: {
          id: 5, name: 'Heist', characters: [], masks: [], open_to_everyone: false,
          custom_fields: { custom_fields: {} } as any,
          episode_status: status, uses_inventory: usesInventory,
        },
      });
      postsSignal.set([inCharacterPost(1), mockPosts[1]]);
      fixture.detectChanges();
    }

    function inventoryLinks(): HTMLAnchorElement[] {
      return Array.from(fixture.nativeElement.querySelectorAll('.post-contacts a') as NodeListOf<HTMLAnchorElement>)
        .filter(a => a.textContent!.trim() === 'Inventory');
    }

    it('links the inventory of in-character posts in a scene that uses it', () => {
      showScene(true);
      expect(inventoryLinks().length).toBe(1);
    });

    it('shows no inventory links or button in a scene without inventory', () => {
      showScene(false);
      expect(inventoryLinks().length).toBe(0);
      expect(fixture.nativeElement.querySelector('.scene-inventory-bar')).toBeNull();
    });

    it('loads a post inventory into the modal on click', () => {
      inventoryServiceSpy.getPostInventory.and.returnValue(of({
        profile_id: 41, name: 'Alice', items: [{ item_id: 1, name: 'Gold coin', description: null, icon: null, quantity: 5 }],
      }));
      showScene(true);

      inventoryLinks()[0].click();
      fixture.detectChanges();

      expect(inventoryServiceSpy.getPostInventory).toHaveBeenCalledWith(1);
      const modal = fixture.nativeElement.querySelector('.inventory-modal').textContent;
      expect(modal).toContain('Alice');
      expect(modal).toContain('Gold coin');
      expect(modal).toContain('× 5');
    });

    it('explains when the viewer may not see a post inventory', () => {
      inventoryServiceSpy.getPostInventory.and.returnValue(throwError(() => ({ status: 403 })));
      showScene(true);

      inventoryLinks()[0].click();
      fixture.detectChanges();

      expect(fixture.nativeElement.querySelector('.inventory-modal').textContent)
        .toContain('Only the player and the game masters can see this inventory.');
    });

    it('shows the current inventories from the My inventory button', () => {
      inventoryServiceSpy.getCurrentInventories.and.returnValue(of([]));
      showScene(true);

      (fixture.nativeElement.querySelector('.scene-inventory-bar button') as HTMLButtonElement).click();
      fixture.detectChanges();

      expect(inventoryServiceSpy.getCurrentInventories).toHaveBeenCalledWith(5);
      expect(fixture.nativeElement.querySelector('.inventory-modal').textContent).toContain('You have no characters in this scene.');
    });

    it('tells players a pending scene has not started', () => {
      showScene(true, EpisodeStatus.Pending);
      expect(fixture.nativeElement.querySelector('.scene-pending-notice')).toBeTruthy();
    });

    describe('inventory actions', () => {
      const coins = { item_id: 1, name: 'Gold coin', description: null, icon: null, quantity: 5 };
      const inventory = (profileId: number, name: string, isLocked = true) => ({
        profile_id: profileId, name, is_mask: false, owner_user_id: 1, owner_username: 'me',
        exists: true, is_locked: isLocked, items: [coins],
      });
      let postFormStub: { insertItemAction: jasmine.Spy };

      function openMyInventory(status = EpisodeStatus.Active) {
        showScene(true, status);
        postFormStub = { insertItemAction: jasmine.createSpy('insertItemAction') };
        component.postForm = postFormStub as any;
        component.selectedCharacterId = 41;
        (fixture.nativeElement.querySelector('.scene-inventory-bar button') as HTMLButtonElement).click();
        fixture.detectChanges();
      }

      beforeEach(() => {
        inventoryServiceSpy.getCurrentInventories.and.returnValue(of([inventory(41, 'Alice'), inventory(42, 'Alice in disguise')]));
        inventoryServiceSpy.getRecipients.and.returnValue(of([{ profile_id: 41, name: 'Alice' }, { profile_id: 77, name: 'Bob' }]));
      });

      it('offers drop and give only for the character the post is written as', () => {
        openMyInventory();
        const pickers = fixture.nativeElement.querySelectorAll('app-inventory-action-picker');
        expect(pickers.length).toBe(1);
        expect(pickers[0].closest('section').textContent).toContain('Alice');
        const options = Array.from(pickers[0].querySelectorAll('option') as NodeListOf<HTMLOptionElement>).map(o => o.textContent!.trim());
        expect(options).toEqual(['Give to…', 'Bob']);
      });

      it('offers no actions while the scene is pending', () => {
        openMyInventory(EpisodeStatus.Pending);
        expect(fixture.nativeElement.querySelector('app-inventory-action-picker')).toBeNull();
        expect(inventoryServiceSpy.getRecipients).not.toHaveBeenCalled();
      });

      it('offers no actions for an inventory that is not locked', () => {
        inventoryServiceSpy.getCurrentInventories.and.returnValue(of([inventory(41, 'Alice', false)]));
        openMyInventory();
        expect(fixture.nativeElement.querySelector('app-inventory-action-picker')).toBeNull();
      });

      it('puts the chosen action into the post and closes the inventory', () => {
        openMyInventory();
        const picker = fixture.nativeElement.querySelector('app-inventory-action-picker');
        (picker.querySelector('input[type=checkbox]') as HTMLInputElement).click();
        fixture.detectChanges();
        (Array.from(picker.querySelectorAll('button') as NodeListOf<HTMLButtonElement>).find(b => b.textContent!.trim() === 'Drop'))!.click();
        fixture.detectChanges();

        expect(postFormStub.insertItemAction).toHaveBeenCalledWith({ kind: 'drop', items: '1:5' });
        expect(fixture.nativeElement.querySelector('.inventory-modal')).toBeNull();
      });
    });
  });
});
