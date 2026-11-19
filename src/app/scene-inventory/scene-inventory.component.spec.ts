import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, provideRouter, Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { SceneInventoryComponent } from './scene-inventory.component';
import { ApiService } from '../services/api.service';
import { SceneInventories, SceneInventory } from '../models/Inventory';
import { EpisodeStatus } from '../models/Episode';

describe('SceneInventoryComponent', () => {
  let fixture: ComponentFixture<SceneInventoryComponent>;
  let api: jasmine.SpyObj<ApiService>;

  const profile = (id: number, name: string, locked: boolean): SceneInventory => ({
    profile_id: id, name, is_mask: false, owner_user_id: id, owner_username: `user${id}`, exists: locked, is_locked: locked,
    locked_at: locked ? 'Today 9:00 AM' : undefined,
    items: locked ? [{ item_id: 1, name: 'Gold coin', description: null, icon: null, quantity: 20 }] : [],
  });

  const scene = (inventories: SceneInventory[], status = EpisodeStatus.Pending): SceneInventories => ({
    episode_id: 5, topic_id: 50, name: 'Heist', status, arc_id: 7,
    catalogue: [
      { id: 1, arc_id: 7, name: 'Gold coin', description: null, icon: null, is_hidden: false, display_order: 0 },
      { id: 2, arc_id: 7, name: 'Sword', description: null, icon: null, is_hidden: true, display_order: 1 },
    ],
    inventories,
  });

  async function render(data: SceneInventories) {
    api = jasmine.createSpyObj<ApiService>('ApiService', ['get', 'post']);
    api.get.and.returnValue(of(data) as any);
    api.post.and.returnValue(of({}) as any);

    await TestBed.configureTestingModule({
      imports: [SceneInventoryComponent],
      providers: [
        provideRouter([]),
        { provide: ApiService, useValue: api },
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: { get: () => '5' } } } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(SceneInventoryComponent);
    fixture.detectChanges();
  }

  function section(index: number): HTMLElement {
    return fixture.nativeElement.querySelectorAll('.scene-inventory-profile')[index];
  }

  function startButton(): HTMLButtonElement {
    return fixture.nativeElement.querySelector('.scene-inventory-start button');
  }

  function clickButton(root: HTMLElement, label: string) {
    const button = Array.from(root.querySelectorAll('button')).find(b => b.textContent!.trim() === label)!;
    button.click();
    fixture.detectChanges();
  }

  it('shows locked inventories read-only and unlocked ones as editable rows', async () => {
    await render(scene([profile(10, 'Alice', true), profile(11, 'Bob', false)]));

    expect(section(0).querySelector('select')).toBeNull();
    expect(section(0).textContent).toContain('Gold coin');
    expect(section(0).textContent).toContain('Today 9:00 AM');
    expect(section(1).querySelector('select')).toBeNull();

    clickButton(section(1), 'Add item');
    const options = Array.from(section(1).querySelectorAll('option')).map(o => o.textContent!.trim());
    expect(options).toEqual(['— Choose an item —', 'Gold coin', 'Sword']);
  });

  it('enables Start only when every inventory is locked', async () => {
    await render(scene([profile(10, 'Alice', true), profile(11, 'Bob', false)]));
    expect(startButton().disabled).toBeTrue();
  });

  it('starts the scene and goes back to the topic', async () => {
    await render(scene([profile(10, 'Alice', true)]));
    const navigate = spyOn(TestBed.inject(Router), 'navigate');

    startButton().click();

    expect(api.post).toHaveBeenCalledWith('episode/5/start', {});
    expect(navigate).toHaveBeenCalledWith(['/viewtopic', 50]);
  });

  it('lists the unlocked inventories when the server refuses to start', async () => {
    await render(scene([profile(10, 'Alice', true)]));
    api.post.and.returnValue(throwError(() => ({ status: 409, error: { unlocked: ['Bob', 'The Stranger'] } })) as any);

    startButton().click();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.scene-inventory-start').textContent).toContain('Bob, The Stranger');
  });

  it('saves the rows and then locks them', async () => {
    await render(scene([profile(11, 'Bob', false)]));
    spyOn(window, 'confirm').and.returnValue(true);

    clickButton(section(0), 'Add item');
    const select: HTMLSelectElement = section(0).querySelector('select')!;
    select.value = '1';
    select.dispatchEvent(new Event('change'));
    const quantity: HTMLInputElement = section(0).querySelector('input[type="number"]')!;
    quantity.value = '20';
    quantity.dispatchEvent(new Event('change'));
    clickButton(section(0), 'Lock');

    expect(api.post.calls.allArgs()).toEqual([
      ['episode/5/inventory/11/update', { items: [{ item_id: 1, quantity: 20 }] }],
      ['episode/5/inventory/11/lock', {}],
    ]);
  });

  it('does not offer Start for a scene that has already started', async () => {
    await render(scene([profile(10, 'Alice', true)], EpisodeStatus.Active));
    expect(startButton()).toBeNull();
  });
});
