import { Component } from '@angular/core';
import {Notification} from '../../models/Notification';

@Component({
  selector: 'app-toast',
  imports: [],
  templateUrl: './toast.component.html',
  styleUrl: './toast.component.css'
})
export class ToastComponent {
  notifications: Notification[] = [{
    id: 1,
    title: "Test",
    message: "Sample message",
    from: "system"
  }];

  remove(toastId: number) {}
}
