import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PermissionMatrixComponent } from './permission-matrix.component';

describe('PermissionMatrixComponent', () => {
  let component: PermissionMatrixComponent;
  let fixture: ComponentFixture<PermissionMatrixComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PermissionMatrixComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PermissionMatrixComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
