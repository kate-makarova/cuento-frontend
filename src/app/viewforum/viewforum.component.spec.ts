import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { ViewforumComponent } from './viewforum.component';

describe('ViewforumComponent', () => {
  let component: ViewforumComponent;
  let fixture: ComponentFixture<ViewforumComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ViewforumComponent, HttpClientTestingModule, RouterTestingModule]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ViewforumComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
