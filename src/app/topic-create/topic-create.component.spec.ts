import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TopicCreateComponent } from './topic-create.component';

describe('TopicCreateComponent', () => {
  let component: TopicCreateComponent;
  let fixture: ComponentFixture<TopicCreateComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TopicCreateComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TopicCreateComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
