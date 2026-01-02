import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ImageFieldDisplayComponent } from './image-field-display.component';

describe('ImageFieldDisplayComponent', () => {
  let component: ImageFieldDisplayComponent;
  let fixture: ComponentFixture<ImageFieldDisplayComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ImageFieldDisplayComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ImageFieldDisplayComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
