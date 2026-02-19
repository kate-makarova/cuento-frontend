import { Injectable, signal, inject } from '@angular/core';
import { ApiService } from './api.service';
import { PermissionMatrixObject } from '../models/Permission';

@Injectable({ providedIn: 'root' })
export class PermissionService {
  private apiService = inject(ApiService);
  private permissionMatrixSignal = signal<{[key: number]: PermissionMatrixObject}>({});
  readonly permissionMatrix = this.permissionMatrixSignal.asReadonly();

  loadPermissionMatrix(): void {
    this.apiService.get<{[key: number]: PermissionMatrixObject}>('/permission-matrix/get').subscribe({
      next: (data) => {
        this.permissionMatrixSignal.set(data);
      },
      error: (err) => {
        console.error('Failed to load permission matrix', err);
      }
    });
  }

  savePermissionMatrix(permissions: string[]) {
    return this.apiService.post('/permission-matrix/update', { permissions });
  }
}
