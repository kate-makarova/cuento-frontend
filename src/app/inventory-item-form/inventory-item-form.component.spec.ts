import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, provideRouter, Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { InventoryItemFormComponent } from './inventory-item-form.component';
import { ApiService } from '../services/api.service';

describe('InventoryItemFormComponent', () => {
  let fixture: ComponentFixture<InventoryItemFormComponent>;
  let api: jasmine.SpyObj<ApiService>;
  let navigate: jasmine.Spy;

  async function render(itemId: string | null) {
    api = jasmine.createSpyObj<ApiService>('ApiService', ['get', 'post', 'delete']);
    api.get.and.callFake(((url: string) => {
      if (url === 'arc/7') return of({ id: 7, title: 'Campaign' });
      if (url === 'inventory/item/3') {
        return of({ id: 3, arc_id: 7, name: 'Sword', description: 'Sharp', icon: null, is_hidden: true, display_order: 2 });
      }
      return of({});
    }) as any);
    api.post.and.returnValue(of({ id: 9 }) as any);

    await TestBed.configureTestingModule({
      imports: [InventoryItemFormComponent],
      providers: [
        provideRouter([]),
        { provide: ApiService, useValue: api },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: { get: () => itemId }, queryParamMap: { get: (k: string) => k === 'arc_id' ? '7' : null } } },
        },
      ],
    }).compileComponents();

    navigate = spyOn(TestBed.inject(Router), 'navigate');
    fixture = TestBed.createComponent(InventoryItemFormComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  }

  it('creates an item in the arc and opens it', async () => {
    await render(null);
    const component = fixture.componentInstance;
    component.name = '  Gold coin ';
    component.isHidden = true;

    component.submit();

    expect(api.post).toHaveBeenCalledWith('inventory/item/create', jasmine.objectContaining({
      arc_id: 7, name: 'Gold coin', is_hidden: true,
    }));
    expect(navigate).toHaveBeenCalledWith(['/inventory-item', 9]);
  });

  it('asks for a name before saving', async () => {
    await render(null);
    fixture.componentInstance.submit();
    fixture.detectChanges();

    expect(api.post).not.toHaveBeenCalled();
    expect(fixture.nativeElement.querySelector('.error-msg').textContent).toContain('Enter a name.');
  });

  it('loads an item for editing', async () => {
    await render('3');
    expect(fixture.componentInstance.name).toBe('Sword');
    expect(fixture.nativeElement.querySelector('input[type="checkbox"]').checked).toBeTrue();
  });

  it('explains why a used item cannot be deleted', async () => {
    await render('3');
    spyOn(window, 'confirm').and.returnValue(true);
    api.delete.and.returnValue(throwError(() => ({ status: 409 })) as any);

    fixture.componentInstance.deleteItem();
    fixture.detectChanges();

    expect(api.delete).toHaveBeenCalledWith('inventory/item/delete/3');
    expect(fixture.nativeElement.querySelector('.error-msg').textContent).toContain('Hide it instead.');
  });
});
