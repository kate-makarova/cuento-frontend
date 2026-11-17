import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { of } from 'rxjs';
import { UserDataMigrationComponent } from './user-data-migration.component';
import { ApiService } from '../services/api.service';
import { Migration, MigrationStatus } from '../models/Migration';

describe('UserDataMigrationComponent', () => {
  let fixture: ComponentFixture<UserDataMigrationComponent>;
  let component: UserDataMigrationComponent;
  let api: jasmine.SpyObj<ApiService>;

  // Two deleted MyBB users: both reported with user_id 1.
  const migration: Migration = {
    id: 5,
    date_created: '2026-11-15T10:00:00Z',
    date_created_localized: '15.11.2026',
    user_id: 2,
    status: MigrationStatus.Processed,
    original_topic_id: '77',
    original_topic_title: 'Crossroads',
    new_topic_id: null,
    original_post_count: 3,
    parsed_post_count: 3,
    forum_domain: 'example.mybb.ru',
    data_extraction_urls: [],
    user_character_map: {
      '1:papa gede': { key: '1:papa gede', original_user_id: '1', original_user_name: 'papa gede', character_id: null, character_name: null, user_id: null },
      '1:baron samedi': { key: '1:baron samedi', original_user_id: '1', original_user_name: 'baron samedi', character_id: null, character_name: null, user_id: null }
    }
  };

  beforeEach(async () => {
    api = jasmine.createSpyObj<ApiService>('ApiService', ['get', 'post']);
    api.get.and.returnValue(of(migration));
    api.post.and.returnValue(of({ published_posts: 2, skipped_posts: 1 }));

    await TestBed.configureTestingModule({
      imports: [UserDataMigrationComponent],
      providers: [
        { provide: ApiService, useValue: api },
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: convertToParamMap({ id: '5' }) } } }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(UserDataMigrationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('renders deleted users sharing id 1 as separate rows', () => {
    const names = Array.from(fixture.nativeElement.querySelectorAll('.user-map-table .username'))
      .map((el: any) => el.textContent.trim());
    expect(names).toEqual(['papa gede', 'baron samedi']);
  });

  it('maps a character only to the selected user', () => {
    component.selectChar('1:papa gede', { id: 11, name: 'Ghede Nibo' } as any);
    fixture.detectChanges();

    const rows = fixture.nativeElement.querySelectorAll('.user-map-table tbody tr');
    expect(rows[0].querySelector('.mapped-char')?.textContent.trim()).toBe('Ghede Nibo');
    expect(rows[1].querySelector('.mapped-char')).toBeNull();
    expect(component.allMapped()).toBeFalse();
  });

  it('publishes with user_map keyed by id and username', () => {
    component.selectChar('1:papa gede', { id: 11, name: 'Ghede Nibo' } as any);
    component.selectChar('1:baron samedi', { id: 12, name: 'Maman Brigitte' } as any);
    component.selectEpisode({ id: 40, name: 'Crossroads' });
    component.publish();

    expect(api.post).toHaveBeenCalledWith('user-data-migration/publish', {
      processing_id: 5,
      topic_id: 40,
      user_map: { '1:papa gede': 11, '1:baron samedi': 12 },
      skip_first_post: true
    });
    expect(component.publishResult()).toEqual({ published_posts: 2, skipped_posts: 1 });
  });
});
