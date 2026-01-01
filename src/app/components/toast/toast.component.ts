import { Component } from '@angular/core';
import {Toast} from '../../models/Toast';

@Component({
  selector: 'app-toast',
  imports: [],
  templateUrl: './toast.component.html',
  styleUrl: './toast.component.css'
})
export class ToastComponent {
  toasts: Toast[] = [];

  remove(toastId: number) {}
}
