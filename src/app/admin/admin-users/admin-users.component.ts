import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../services/api.service';

export interface AdminUserListItem {
  id: number;
  username: string;
  user_status: number;
  date_registered: string | null;
  date_last_visit: string | null;
  character_count: number;
  last_game_post_date: string | null;
}

@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [CommonModule, DatePipe, RouterLink],
  templateUrl: './admin-users.component.html',
  styleUrl: './admin-users.component.css'
})
export class AdminUsersComponent implements OnInit {
  private apiService = inject(ApiService);

  users = signal<AdminUserListItem[]>([]);

  ngOnInit() {
    this.apiService.get<AdminUserListItem[]>('admin/user-list').subscribe({
      next: (data) => this.users.set(data),
      error: (err) => console.error('Failed to load admin user list', err)
    });
  }
}
