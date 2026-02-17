import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CharacterProfileTemplateEditComponent } from './character-profile-template-edit.component';

describe('CharacterProfileTemplateEditComponent', () => {
  let component: CharacterProfileTemplateEditComponent;
  let fixture: ComponentFixture<CharacterProfileTemplateEditComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CharacterProfileTemplateEditComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CharacterProfileTemplateEditComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
