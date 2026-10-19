import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { AdminWrapperComponent } from './admin-wrapper.component';

describe('AdminWrapperComponent', () => {
  let component: AdminWrapperComponent;
  let fixture: ComponentFixture<AdminWrapperComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminWrapperComponent, RouterTestingModule, HttpClientTestingModule]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AdminWrapperComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
