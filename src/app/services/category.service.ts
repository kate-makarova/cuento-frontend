import {inject, Injectable, signal} from '@angular/core';
import {Category} from '../models/Category';
import {ApiService} from './api.service';

@Injectable({ providedIn: 'root' })
export class CategoryService {
  private homeCategoriesSignal = signal<Category[]>([]);
  readonly homeCategories = this.homeCategoriesSignal.asReadonly();

  private apiService = inject(ApiService);

  loadHomeCategories() {
    this.apiService.get<Category[]>('categories/home').subscribe({
      next: (data) => {
        this.homeCategoriesSignal.set(data);
      },
      error: (err) => {
        console.error('Failed to load categories', err);
      }
    });
  }
}
