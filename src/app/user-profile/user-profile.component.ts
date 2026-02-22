import { Component, inject, Input, OnInit, computed } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { UserService } from '../services/user.service';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-user-profile',
  standalone: true,
  imports: [CommonModule, RouterLink, DatePipe],
  templateUrl: './user-profile.component.html',
  styleUrls: ['./user-profile.component.css']
})
export class UserProfileComponent implements OnInit {
  @Input() id?: number;

  private userService = inject(UserService);
  private authService = inject(AuthService);

  userProfile = this.userService.userProfile;
  currentUser = this.authService.currentUser;

  isOwnProfile = computed(() => {
    const profile = this.userProfile();
    const current = this.currentUser();
    return profile && current && profile.user_id === current.id;
  });

  ngOnInit() {
    if (this.id) {
      this.userService.loadUserProfile(this.id);
    }
  }

  addCharacter() {
    // Navigate to character creation or open modal
    console.log('Add character clicked');
  }
}
