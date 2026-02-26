import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SettingsComponent } from './settings.component';
import { AuthService } from '../services/auth.service';
import { UserService } from '../services/user.service';
import { of } from 'rxjs';
import { signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

describe('SettingsComponent', () => {
  let component: SettingsComponent;
  let fixture: ComponentFixture<SettingsComponent>;
  let authServiceSpy: jasmine.SpyObj<AuthService>;
  let userServiceSpy: jasmine.SpyObj<UserService>;

  beforeEach(async () => {
    authServiceSpy = jasmine.createSpyObj('AuthService', ['currentUser', 'hashPassword', 'updateUser']);
    authServiceSpy.currentUser.and.returnValue({ id: 1, username: 'TestUser', avatar: 'avatar.png', interface_language: 'en-US', interface_timezone: 'UTC', roles: [] });
    authServiceSpy.hashPassword.and.returnValue(Promise.resolve('hashedPassword'));

    userServiceSpy = jasmine.createSpyObj('UserService', ['updateUserSettings']);
    userServiceSpy.updateUserSettings.and.returnValue(of({ id: 1, username: 'TestUser', avatar: 'avatar.png', interface_language: 'en-US', interface_timezone: 'UTC', roles: [] }));

    await TestBed.configureTestingModule({
      imports: [SettingsComponent, FormsModule],
      providers: [
        { provide: AuthService, useValue: authServiceSpy },
        { provide: UserService, useValue: userServiceSpy }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SettingsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with current user settings', () => {
    expect(component.avatarUrl).toBe('avatar.png');
    expect(component.language).toBe('en-US');
    expect(component.timezone).toBe('UTC');
  });

  it('should call updateUserSettings on submit', () => {
    component.onSubmit(new Event('submit'));
    expect(userServiceSpy.updateUserSettings).toHaveBeenCalled();
  });
});
