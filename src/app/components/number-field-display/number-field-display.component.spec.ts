import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NumberFieldDisplayComponent } from './number-field-display.component';

describe('NumberFieldDisplayComponent', () => {
  let component: NumberFieldDisplayComponent;
  let fixture: ComponentFixture<NumberFieldDisplayComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NumberFieldDisplayComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NumberFieldDisplayComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
