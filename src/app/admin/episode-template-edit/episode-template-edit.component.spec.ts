import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { EpisodeTemplateEditComponent } from './episode-template-edit.component';

describe('EpisodeTemplateEditComponent', () => {
  let component: EpisodeTemplateEditComponent;
  let fixture: ComponentFixture<EpisodeTemplateEditComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EpisodeTemplateEditComponent, HttpClientTestingModule]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EpisodeTemplateEditComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
