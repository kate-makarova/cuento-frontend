import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CharacterviewComponent } from './characterview.component';

describe('CharacterviewComponent', () => {
  let component: CharacterviewComponent;
  let fixture: ComponentFixture<CharacterviewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CharacterviewComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CharacterviewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
