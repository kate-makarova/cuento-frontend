import { Component, inject, signal } from '@angular/core';
import { RouterOutlet, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-admin-wrapper',
  imports: [RouterOutlet, RouterLink, CommonModule],
  templateUrl: './admin-wrapper.component.html',
  styleUrl: './admin-wrapper.component.css'
})
export class AdminWrapperComponent {
  private authService = inject(AuthService);

  openGroups = signal<Set<string>>(new Set(['general']));

  hasPermission(permission: string): boolean {
    return this.authService.hasPermission(permission);
  }

  isOpen(group: string): boolean {
    return this.openGroups().has(group);
  }

  toggleGroup(group: string) {
    const current = new Set(this.openGroups());
    if (current.has(group)) {
      current.delete(group);
    } else {
      current.add(group);
    }
    this.openGroups.set(current);
  }
}
