import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { GlobalSettingsService } from '../../services/global-settings.service';

@Component({
  selector: 'app-admin-settings',
  imports: [CommonModule, FormsModule],
  standalone: true,
  templateUrl: './admin-settings.component.html',
  styleUrl: './admin-settings.component.css'
})
export class AdminSettingsComponent implements OnInit {
  private globalSettingsService = inject(GlobalSettingsService);

  settings = this.globalSettingsService.settings;

  ngOnInit() {
    this.globalSettingsService.loadSettings();
  }

  save() {
    this.globalSettingsService.updateSettings(this.settings()).subscribe({
      error: (err) => console.error('Failed to save settings', err)
    });
  }
}
