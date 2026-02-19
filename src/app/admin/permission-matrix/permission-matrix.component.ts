import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PermissionService } from '../../services/permission.service';
import { PermissionMatrixObject } from '../../models/Permission';

@Component({
  selector: 'app-permission-matrix',
  imports: [CommonModule, FormsModule],
  templateUrl: './permission-matrix.component.html',
  standalone: true,
  styleUrl: './permission-matrix.component.css'
})
export class PermissionMatrixComponent implements OnInit {
  private permissionService = inject(PermissionService);

  matrixMap = this.permissionService.permissionMatrix;

  roles = computed(() => {
    const firstMatrix = this.getFirstMatrix();
    return firstMatrix ? Object.entries(firstMatrix.roles) : [];
  });

  permissions = computed(() => {
    const firstMatrix = this.getFirstMatrix();
    return firstMatrix ? Object.entries(firstMatrix.permissions) : [];
  });

  matrixKeys = computed(() => Object.keys(this.matrixMap()));

  ngOnInit() {
    this.permissionService.loadPermissionMatrix();
  }

  private getFirstMatrix(): PermissionMatrixObject | null {
    const keys = Object.keys(this.matrixMap());
    if (keys.length > 0) {
      return this.matrixMap()[+keys[0]];
    }
    return null;
  }

  getMatrixFor(key: string): PermissionMatrixObject {
    return this.matrixMap()[+key];
  }

  saveMatrix() {
    console.log('Saving Matrix:', this.matrixMap());
    // this.permissionService.savePermissionMatrix(this.matrixMap());
  }
}
