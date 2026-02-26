import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TopicReadByComponent } from './topic-read-by.component';
import { NotificationService } from '../../services/notification.service';
import { RouterTestingModule } from '@angular/router/testing';
import { Subject } from 'rxjs';

describe('TopicReadByComponent', () => {
  let component: TopicReadByComponent;
  let fixture: ComponentFixture<TopicReadByComponent>;
  let notificationServiceSpy: jasmine.SpyObj<NotificationService>;

  beforeEach(async () => {
    notificationServiceSpy = jasmine.createSpyObj('NotificationService', [], {
      topicViewersUpdate$: new Subject()
    });

    await TestBed.configureTestingModule({
      imports: [TopicReadByComponent, RouterTestingModule],
      providers: [
        { provide: NotificationService, useValue: notificationServiceSpy }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TopicReadByComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
