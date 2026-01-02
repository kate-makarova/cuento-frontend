import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ShortTextFieldDisplayComponent } from './short-text-field-display.component';

describe('ShortTextFieldDisplayComponent', () => {
  let component: ShortTextFieldDisplayComponent;
  let fixture: ComponentFixture<ShortTextFieldDisplayComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ShortTextFieldDisplayComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ShortTextFieldDisplayComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
