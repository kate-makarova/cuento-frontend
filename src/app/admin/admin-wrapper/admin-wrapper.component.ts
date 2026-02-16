import { Component } from '@angular/core';
import { RouterOutlet, RouterLink } from '@angular/router';

@Component({
  selector: 'app-admin-wrapper',
  imports: [RouterOutlet, RouterLink],
  templateUrl: './admin-wrapper.component.html',
  styleUrl: './admin-wrapper.component.css'
})
export class AdminWrapperComponent {

}
