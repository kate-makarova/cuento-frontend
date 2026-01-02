import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LongTextFieldComponent } from './long-text-field.component';

describe('LongTextFieldComponent', () => {
  let component: LongTextFieldComponent;
  let fixture: ComponentFixture<LongTextFieldComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LongTextFieldComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LongTextFieldComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
