import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { EpisodeCreateComponent } from './episode-create.component';
import { ActivatedRoute, Router } from '@angular/router';
import { of } from 'rxjs';
import { ApiService } from '../services/api.service';

describe('EpisodeCreateComponent', () => {
  let component: EpisodeCreateComponent;
  let fixture: ComponentFixture<EpisodeCreateComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EpisodeCreateComponent, HttpClientTestingModule, RouterTestingModule]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EpisodeCreateComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

describe('EpisodeCreateComponent inventory toggle', () => {
  let fixture: ComponentFixture<EpisodeCreateComponent>;
  let api: jasmine.SpyObj<ApiService>;

  async function render(arcInventory: { enabled: boolean; can_edit: boolean }) {
    api = jasmine.createSpyObj<ApiService>('ApiService', ['get', 'post']);
    api.get.and.callFake(((url: string) => url === 'arc/7/inventory/items'
      ? of({ ...arcInventory, in_use: false, items: [] })
      : of([])) as any);
    api.post.and.returnValue(of({ episode_id: 12, topic_id: 120 }) as any);

    await TestBed.configureTestingModule({
      imports: [EpisodeCreateComponent, HttpClientTestingModule, RouterTestingModule],
      providers: [
        { provide: ApiService, useValue: api },
        { provide: ActivatedRoute, useValue: { queryParams: of({ fid: '1', arc_id: '7', arc_title: 'Campaign' }) } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(EpisodeCreateComponent);
    fixture.detectChanges();
  }

  function toggle(): HTMLInputElement | null {
    return fixture.nativeElement.querySelector('input[name="use_inventory"]');
  }

  it('offers the toggle to a GM of an arc with inventory', async () => {
    await render({ enabled: true, can_edit: true });
    expect(toggle()).toBeTruthy();
  });

  it('hides the toggle when the arc has no inventory', async () => {
    await render({ enabled: false, can_edit: true });
    expect(toggle()).toBeNull();
  });

  it('hides the toggle from users who are not GMs of the arc', async () => {
    await render({ enabled: true, can_edit: false });
    expect(toggle()).toBeNull();
  });

  it('sends the GM to the inventories page after creating a scene with inventory', async () => {
    await render({ enabled: true, can_edit: true });
    const navigate = spyOn(TestBed.inject(Router), 'navigate');

    (fixture.componentInstance as any).executeSubmit({ subforum_id: 1, name: 'Heist', arc_id: 7, use_inventory: true });

    expect(api.post).toHaveBeenCalledWith('episode/create', jasmine.objectContaining({ use_inventory: true }));
    expect(navigate).toHaveBeenCalledWith(['/episode', 12, 'inventory']);
  });
});
