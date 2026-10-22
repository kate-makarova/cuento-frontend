import {inject, Injectable, signal} from '@angular/core';
import {Category} from '../models/Category';
import {ApiService} from './api.service';

@Injectable({ providedIn: 'root' })
export class CategoryService {
  private homeCategoriesSignal = signal<Category[]>([]);
  readonly homeCategories = this.homeCategoriesSignal.asReadonly();

  private apiService = inject(ApiService);

  loadHomeCategories(noHighlightSubforumId?: number | null) {
    this.apiService.get<Category[]>('categories/home').subscribe({
      next: (data) => {
        if (noHighlightSubforumId != null) {
          data = data.map(cat => ({
            ...cat,
            subforums: cat.subforums.map(sf =>
              sf.id === noHighlightSubforumId ? { ...sf, has_new_messages: false } : sf
            ),
          }));
        }
        this.homeCategoriesSignal.set(data);
      },
      error: (err) => {
        console.error('Failed to load categories', err);
      }
    });
  }
}
