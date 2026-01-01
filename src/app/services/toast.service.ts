import { Injectable, signal } from '@angular/core';
import {Toast} from '../models/Toast';

@Injectable({ providedIn: 'root' })
export class ToastService {
  toasts = signal<Toast[]>([]);

  show(from: string, message: string, category: 'pm' | 'game' = 'pm') {
    const id = Date.now();
    const newToast = { id, from, message, category };

    this.toasts.update(current => [...current, newToast]);

    // Auto-remove after 4 seconds
    setTimeout(() => this.remove(id), 4000);
  }

  remove(id: number) {
    this.toasts.update(current => current.filter(t => t.id !== id));
  }
}
