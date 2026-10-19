import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';

import { ActiveTopicsComponent } from './active-topics.component';

describe('ActiveTopicsComponent', () => {
  let component: ActiveTopicsComponent;
  let fixture: ComponentFixture<ActiveTopicsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ActiveTopicsComponent, HttpClientTestingModule, RouterTestingModule]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ActiveTopicsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
