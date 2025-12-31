import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ViewtopicComponent } from './viewtopic.component';

describe('ViewtopicComponent', () => {
  let component: ViewtopicComponent;
  let fixture: ComponentFixture<ViewtopicComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ViewtopicComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ViewtopicComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
