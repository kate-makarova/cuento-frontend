import { Component, inject, OnInit } from '@angular/core';
import { FeatureService } from '../../services/feature.service';

@Component({
  selector: 'app-admin-features',
  standalone: true,
  imports: [],
  templateUrl: './admin-features.component.html',
})
export class AdminFeaturesComponent implements OnInit {
  private featureService = inject(FeatureService);

  features = this.featureService.features;

  ngOnInit(): void {
    this.featureService.loadFeatures();
  }

  toggle(key: string): void {
    this.featureService.toggle(key);
  }
}
