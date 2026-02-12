import {inject, Injectable, signal} from '@angular/core';
import {Category} from '../models/Category';
import {HttpClient} from '@angular/common/http';

@Injectable({ providedIn: 'root' })
export class CategoryService {
  private homeCategoriesSignal = signal<Category[]>([]);
  readonly homeCategories = this.homeCategoriesSignal.asReadonly();

  private http = inject(HttpClient);
  private readonly apiUrl = 'http://localhost/api/categories/home';

  loadHomeCategories() {
    this.http.get<Category[]>(this.apiUrl).subscribe({
      next: (data) => {
        this.homeCategoriesSignal.set(data);
      },
      error: (err) => {
        console.error('Failed to load categories', err);
        // Handle error (e.g., set a default state or alert user)
      }
    });
  }
}
