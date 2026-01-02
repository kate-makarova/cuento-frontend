import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ShortTextFieldComponent } from './short-text-field.component';

describe('ShortTextFieldComponent', () => {
  let component: ShortTextFieldComponent;
  let fixture: ComponentFixture<ShortTextFieldComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ShortTextFieldComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ShortTextFieldComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
