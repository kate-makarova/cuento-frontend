import { ComponentFixture, TestBed } from '@angular/core/testing';
import { InventoryActionPickerComponent } from './inventory-action-picker.component';
import { InventoryAction } from '../../models/Inventory';

describe('InventoryActionPickerComponent', () => {
  let fixture: ComponentFixture<InventoryActionPickerComponent>;
  let emitted: InventoryAction[];
  const el = () => fixture.nativeElement as HTMLElement;
  const button = (label: string) =>
    Array.from(el().querySelectorAll('button')).find(b => b.textContent!.trim() === label) as HTMLButtonElement;
  const checkboxes = () => el().querySelectorAll<HTMLInputElement>('input[type=checkbox]');

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [InventoryActionPickerComponent] });
    fixture = TestBed.createComponent(InventoryActionPickerComponent);
    fixture.componentRef.setInput('items', [
      { item_id: 3, name: 'Sword', description: null, icon: null, quantity: 1 },
      { item_id: 7, name: 'Gold coin', description: null, icon: null, quantity: 20 },
    ]);
    fixture.componentRef.setInput('recipients', [{ profile_id: 42, name: 'Bob' }]);
    emitted = [];
    fixture.componentInstance.act.subscribe(a => emitted.push(a));
    fixture.detectChanges();
  });

  function check(index: number) {
    checkboxes()[index].click();
    fixture.detectChanges();
  }

  it('drops every chosen item, all of each by default', () => {
    expect(button('Drop').disabled).toBeTrue();
    check(0);
    check(1);
    button('Drop').click();
    expect(emitted).toEqual([{ kind: 'drop', items: '3:1,7:20' }]);
  });

  it('keeps a chosen quantity between 1 and what the character holds', () => {
    check(1);
    const qty = el().querySelector<HTMLInputElement>('.action-quantity')!;
    for (const [typed, expected] of [['5', '7:5'], ['99', '7:20'], ['0', '7:1'], ['abc', '7:1']]) {
      qty.value = typed;
      qty.dispatchEvent(new Event('change'));
      fixture.detectChanges();
      expect(fixture.componentInstance.itemsArg()).toBe(expected);
    }
  });

  it('unchecking an item leaves it out', () => {
    check(0);
    check(0);
    expect(button('Drop').disabled).toBeTrue();
  });

  it('gives only once a recipient is chosen', () => {
    check(0);
    expect(button('Give').disabled).toBeTrue();
    const select = el().querySelector('select')!;
    select.value = '42';
    select.dispatchEvent(new Event('change'));
    fixture.detectChanges();
    button('Give').click();
    expect(emitted).toEqual([{ kind: 'give', items: '3:1', to: 42 }]);
  });

  it('hides giving when nobody can receive items', () => {
    fixture.componentRef.setInput('recipients', []);
    fixture.detectChanges();
    expect(el().querySelector('select')).toBeNull();
    expect(button('Give')).toBeUndefined();
  });

  it('says when the inventory is empty', () => {
    fixture.componentRef.setInput('items', []);
    fixture.detectChanges();
    expect(el().textContent).toContain('The inventory is empty.');
    expect(button('Drop')).toBeUndefined();
  });
});
