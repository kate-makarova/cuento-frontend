import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { ArcDetailComponent } from './arc-detail.component';
import { ApiService } from '../services/api.service';
import { ArcInventory } from '../models/Inventory';
import { ArcEpisode, StoryArc } from '../models/StoryArc';

describe('ArcDetailComponent inventory', () => {
  let fixture: ComponentFixture<ArcDetailComponent>;
  let api: jasmine.SpyObj<ApiService>;

  const arc = (canEdit: boolean): StoryArc => ({
    id: 7, title: 'Campaign', is_public: true, status: 1, factions: [], game_masters: [], episode_count: 2, can_edit: canEdit,
  });

  const episode = (id: number, usesInventory: boolean): ArcEpisode => ({
    id, topic_id: id * 10, title: `Scene ${id}`, status: 0, last_post_date: null, last_post_author: null,
    characters: [], factions: [], uses_inventory: usesInventory,
  });

  const item = (id: number, name: string, hidden = false) => ({
    id, arc_id: 7, name, description: null, icon: null, is_hidden: hidden, display_order: 0,
  });

  async function render(canEdit: boolean, inventory: ArcInventory) {
    api = jasmine.createSpyObj<ApiService>('ApiService', ['get', 'post']);
    api.get.and.callFake(((url: string) => {
      if (url === 'arc/7') return of(arc(canEdit));
      if (url === 'arc/7/episodes') return of([episode(1, true), episode(2, false)]);
      if (url === 'arc/7/inventory/items') return of(inventory);
      return of([]);
    }) as any);
    api.post.and.returnValue(of({}) as any);

    await TestBed.configureTestingModule({
      imports: [ArcDetailComponent],
      providers: [
        provideRouter([]),
        { provide: ApiService, useValue: api },
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: { get: () => '7' } } } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ArcDetailComponent);
    fixture.detectChanges();
  }

  function text(): string {
    return (fixture.nativeElement as HTMLElement).textContent!.replace(/\s+/g, ' ');
  }

  function buttons(): string[] {
    return Array.from(fixture.nativeElement.querySelectorAll('.arc-inventory .button') as NodeListOf<HTMLElement>)
      .map(b => b.textContent!.trim());
  }

  function itemNames(): string[] {
    return Array.from(fixture.nativeElement.querySelectorAll('.arc-inventory .npc-name') as NodeListOf<HTMLElement>)
      .map(n => n.textContent!.trim());
  }

  function inventoryLinks(): number {
    return Array.from(fixture.nativeElement.querySelectorAll('.episodes-table a') as NodeListOf<HTMLElement>)
      .filter(a => a.textContent!.trim() === 'Inventories').length;
  }

  it('lets a GM turn inventory on', async () => {
    await render(true, { enabled: false, in_use: false, can_edit: true, items: [] });
    expect(buttons()).toEqual(['Turn on inventory']);

    (fixture.nativeElement.querySelector('.arc-inventory button') as HTMLButtonElement).click();
    fixture.detectChanges();

    expect(api.post).toHaveBeenCalledWith('arc/7/inventory/enable', {});
    expect(buttons()).toEqual(['Add item', 'Turn off inventory']);
  });

  it('shows hidden items to a GM, blocks turning off a used inventory and links scene inventories', async () => {
    await render(true, { enabled: true, in_use: true, can_edit: true, items: [item(1, 'Gold coin'), item(2, 'Map', true)] });

    expect(itemNames()).toEqual(['Gold coin', 'Map']);
    expect(fixture.nativeElement.querySelectorAll('.inventory-card--hidden').length).toBe(1);
    const disable = Array.from(fixture.nativeElement.querySelectorAll('.arc-inventory button') as NodeListOf<HTMLButtonElement>)
      .find(b => b.textContent!.includes('Turn off'))!;
    expect(disable.disabled).toBeTrue();
    expect(inventoryLinks()).toBe(1);
  });

  it('shows the catalogue to players without GM controls', async () => {
    await render(false, { enabled: true, in_use: true, can_edit: false, items: [item(1, 'Gold coin')] });

    expect(itemNames()).toEqual(['Gold coin']);
    expect(buttons()).toEqual([]);
    expect(inventoryLinks()).toBe(0);
  });

  it('hides the section from players when there is nothing to show', async () => {
    await render(false, { enabled: true, in_use: false, can_edit: false, items: [] });
    expect(fixture.nativeElement.querySelector('.arc-inventory')).toBeNull();
    expect(text()).not.toContain('Inventory');
  });
});
