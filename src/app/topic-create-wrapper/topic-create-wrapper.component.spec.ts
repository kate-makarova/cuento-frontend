import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TopicCreateWrapperComponent } from './topic-create-wrapper.component';

describe('TopicCreateWrapperComponent', () => {
  let component: TopicCreateWrapperComponent;
  let fixture: ComponentFixture<TopicCreateWrapperComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TopicCreateWrapperComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TopicCreateWrapperComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
