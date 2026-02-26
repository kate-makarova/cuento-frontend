import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { NavlinksComponent } from './navlinks.component';

describe('NavlinksComponent', () => {
  let component: NavlinksComponent;
  let fixture: ComponentFixture<NavlinksComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NavlinksComponent, HttpClientTestingModule, RouterTestingModule]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NavlinksComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
