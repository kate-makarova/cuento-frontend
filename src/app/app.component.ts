import {Component, inject, OnInit} from '@angular/core';
import {ActivatedRoute, NavigationEnd, Router, RouterOutlet} from '@angular/router';
import {FooterComponent} from './footer/footer.component';
import {NavlinksComponent} from './navlinks/navlinks.component';
import {filter, map, mergeMap} from 'rxjs';
import {ToastComponent} from './components/toast/toast.component';
import {BoardService} from './services/board.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, FooterComponent, NavlinksComponent, ToastComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent implements OnInit {
  private router = inject(Router);
  private activatedRoute = inject(ActivatedRoute);
  title = 'dunebb';
  pageId = 'pun-main';
  boardService = inject(BoardService);

  constructor() {
    this.router.events.pipe(
      // Only trigger when navigation is finished
      filter(event => event instanceof NavigationEnd),
      // Traverse to the deepest child route to get the data
      map(() => this.activatedRoute),
      map(route => {
        while (route.firstChild) route = route.firstChild;
        return route;
      }),
      mergeMap(route => route.data)
    ).subscribe(data => {
      // Update the pageId based on the route data
      this.pageId = data['pageId'] || 'pun-index';
    });
  }

  ngOnInit() {
    this.boardService.loadBoard();
  }
}
