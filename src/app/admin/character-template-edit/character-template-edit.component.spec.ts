import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CharacterTemplateEditComponent } from './character-template-edit.component';

describe('CharacterTemplateEditComponent', () => {
  let component: CharacterTemplateEditComponent;
  let fixture: ComponentFixture<CharacterTemplateEditComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CharacterTemplateEditComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CharacterTemplateEditComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
