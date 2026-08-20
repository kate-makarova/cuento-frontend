import { Component, OnDestroy, signal, ViewEncapsulation } from '@angular/core';

@Component({
  selector: 'app-post-sidebar',
  templateUrl: './post-sidebar.component.html',
  styleUrl: './post-sidebar.component.css',
  standalone: true,
  encapsulation: ViewEncapsulation.None,
  host: {
    '[class.post-form--sidebar]': 'sidebarMode()',
  },
})
export class PostSidebarComponent implements OnDestroy {
  sidebarMode = signal(false);

  toggle() {
    const next = !this.sidebarMode();
    this.sidebarMode.set(next);
    document.body.classList.toggle('post-sidebar-open', next);
  }

  ngOnDestroy() {
    document.body.classList.remove('post-sidebar-open');
  }
}
