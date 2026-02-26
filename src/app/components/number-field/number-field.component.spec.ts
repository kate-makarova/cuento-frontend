import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NumberFieldComponent } from './number-field.component';
import { FormsModule } from '@angular/forms';

describe('NumberFieldComponent', () => {
  let component: NumberFieldComponent;
  let fixture: ComponentFixture<NumberFieldComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NumberFieldComponent, FormsModule]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NumberFieldComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
