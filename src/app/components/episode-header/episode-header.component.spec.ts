import { ComponentFixture, TestBed } from '@angular/core/testing';
import { EpisodeHeaderComponent } from './episode-header.component';
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';
import { Episode } from '../../models/Episode';

describe('EpisodeHeaderComponent', () => {
  let component: EpisodeHeaderComponent;
  let fixture: ComponentFixture<EpisodeHeaderComponent>;

  const mockEpisode: Episode = {
    id: 1,
    name: 'Test Episode',
    characters: [
      { id: 101, name: 'Char 1', avatar: 'avatar1.png' },
      { id: 102, name: 'Char 2', avatar: 'avatar2.png' }
    ],
    custom_fields: {
      custom_fields: {
        'location': { content: 'Forest', content_html: 'Forest' }
      },
      field_config: [
        { machine_field_name: 'location', human_field_name: 'Location', content_field_type: 'short_text', field_type: 'string', order: 1 }
      ]
    }
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EpisodeHeaderComponent],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: {
            params: of({}),
            snapshot: { paramMap: { get: () => null } }
          }
        }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(EpisodeHeaderComponent);
    component = fixture.componentInstance;
    component.episode = mockEpisode;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display episode name', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('h2')?.textContent).toContain('Test Episode');
  });

  it('should display participants', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const chars = compiled.querySelectorAll('.character-item');
    expect(chars.length).toBe(2);
    expect(chars[0].textContent).toContain('Char 1');
    expect(chars[1].textContent).toContain('Char 2');
  });

  it('should display custom fields', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Location');
    expect(compiled.textContent).toContain('Forest');
  });
});
