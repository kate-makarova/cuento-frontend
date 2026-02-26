import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { FactionChooseComponent } from './faction-choose.component';

describe('FactionChooseComponent', () => {
  let component: FactionChooseComponent;
  let fixture: ComponentFixture<FactionChooseComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FactionChooseComponent, HttpClientTestingModule]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FactionChooseComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
