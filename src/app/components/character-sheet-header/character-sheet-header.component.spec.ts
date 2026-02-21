import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CharacterSheetHeaderComponent } from './character-sheet-header.component';

describe('CharacterSheetHeaderComponent', () => {
  let component: CharacterSheetHeaderComponent;
  let fixture: ComponentFixture<CharacterSheetHeaderComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CharacterSheetHeaderComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CharacterSheetHeaderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
