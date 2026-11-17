import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { of } from 'rxjs';
import { AiChatComponent } from './ai-chat.component';
import { ApiService } from '../services/api.service';
import { NotificationService } from '../services/notification.service';
import { AiMessageData } from '../models/event';
import { aiNotification } from '../services/notification.service.spec';

describe('AiChatComponent AI message notifications', () => {
  let fixture: ComponentFixture<AiChatComponent>;
  let api: jasmine.SpyObj<ApiService>;
  let notifications: NotificationService;

  const history: AiMessageData[] = [
    { id: 30, role: 'user', content: 'question', date_created: '2026-11-16T10:00:00Z' } as AiMessageData,
    { id: 31, role: 'assistant', content: '<p>answer</p>', date_created: '2026-11-16T10:01:00Z' } as AiMessageData
  ];

  beforeEach(async () => {
    api = jasmine.createSpyObj<ApiService>('ApiService', ['get', 'post']);
    api.get.and.callFake(((url: string) => url === 'ai-chat/history'
      ? of(history)
      : of({ system: [], ai_message: [aiNotification(1, 31), aiNotification(2, 40)] })) as any);
    api.post.and.returnValue(of({}));

    await TestBed.configureTestingModule({
      imports: [AiChatComponent, HttpClientTestingModule],
      providers: [{ provide: ApiService, useValue: api }]
    }).compileComponents();

    notifications = TestBed.inject(NotificationService);
    notifications.loadUnreadNotifications();
    fixture = TestBed.createComponent(AiChatComponent);
    fixture.detectChanges();
  });

  function dismissedIds(): string[] {
    return api.post.calls.allArgs().map(args => args[0]).filter(url => url.startsWith('notifications/dismiss/'));
  }

  it('dismisses the notification for an AI message in the loaded history', () => {
    expect(dismissedIds()).toEqual(['notifications/dismiss/1']);
    expect(notifications.systemNotifications().map(n => n.id)).toEqual([2]);
  });

  it('dismisses the notification for an AI message that arrives while the chat is open', () => {
    (notifications as any).aiMessageSubject.next({
      type: 'ai_message',
      data: { id: 40, role: 'assistant', content: '<p>hello</p>', date_created: '2026-11-16T10:05:00Z' }
    });
    fixture.detectChanges();

    expect(dismissedIds()).toEqual(['notifications/dismiss/1', 'notifications/dismiss/2']);
    expect(notifications.systemNotifications()).toEqual([]);
    expect(fixture.nativeElement.textContent).toContain('hello');
  });
});
