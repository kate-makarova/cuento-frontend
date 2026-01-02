import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LongTextFieldDisplayComponent } from './long-text-field-display.component';

describe('LongTextFieldDisplayComponent', () => {
  let component: LongTextFieldDisplayComponent;
  let fixture: ComponentFixture<LongTextFieldDisplayComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LongTextFieldDisplayComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LongTextFieldDisplayComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
