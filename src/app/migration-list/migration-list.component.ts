import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MigrationService } from '../services/migration.service';
import { MigrationStatus } from '../models/Migration';

@Component({
  selector: 'app-migration-list',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './migration-list.component.html',
  styleUrl: './migration-list.component.css'
})
export class MigrationListComponent implements OnInit {
  private migrationService = inject(MigrationService);

  migrations = this.migrationService.migrations;

  readonly statusLabels: Record<number, string> = {
    [MigrationStatus.Pending]: 'Pending',
    [MigrationStatus.Processed]: 'Processed',
    [MigrationStatus.Published]: 'Published'
  };

  statusClass(status: number): string {
    switch (status) {
      case MigrationStatus.Pending: return 'status-pending';
      case MigrationStatus.Processed: return 'status-processed';
      case MigrationStatus.Published: return 'status-published';
      default: return '';
    }
  }

  ngOnInit() {
    this.migrationService.load();
  }
}
