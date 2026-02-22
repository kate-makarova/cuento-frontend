import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CharacterProfileEditComponent } from './character-profile-edit.component';

describe('CharacterProfileEditComponent', () => {
  let component: CharacterProfileEditComponent;
  let fixture: ComponentFixture<CharacterProfileEditComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CharacterProfileEditComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CharacterProfileEditComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
