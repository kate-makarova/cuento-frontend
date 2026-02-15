import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FactionChooseComponent } from './faction-choose.component';

describe('FactionChooseComponent', () => {
  let component: FactionChooseComponent;
  let fixture: ComponentFixture<FactionChooseComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FactionChooseComponent]
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
