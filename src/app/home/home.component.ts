import {Component, effect, inject, OnInit, OnDestroy} from '@angular/core';
import {RouterLink} from '@angular/router';
import {Title} from '@angular/platform-browser';
import {Subject} from 'rxjs';
import {takeUntil} from 'rxjs/operators';
import {BoardService} from '../services/board.service';
import {CategoryService} from '../services/category.service';
import {NotificationService} from '../services/notification.service';
import {CurrentlyActiveComponent} from '../components/currently-active/currently-active.component';
import {RecentlyActiveComponent} from '../components/recently-active/recently-active.component';
import { RouterLinksDirective } from '../directives/router-links.directive';
import { SafeHtmlPipe } from '../pipes/safe-html.pipe';

@Component({
  selector: 'app-home',
  host: { class: 'pun-page' },
  standalone: true,
  templateUrl: './home.component.html',
  imports: [
    RouterLink,
    CurrentlyActiveComponent,
    RecentlyActiveComponent,
    RouterLinksDirective,
    SafeHtmlPipe
  ]
})
export class HomeComponent implements OnInit, OnDestroy {
  private titleService = inject(Title);
  private notificationService = inject(NotificationService);
  boardService = inject(BoardService);
  categoryService = inject(CategoryService);
  board = this.boardService.board;
  categories = this.categoryService.homeCategories;

  private destroy$ = new Subject<void>();

  constructor() {
    effect(() => {
      const name = this.board().site_name;
      if (name) this.titleService.setTitle(name);
    });
  }

  ngOnInit() {
    this.boardService.loadBoard();
    this.categoryService.loadHomeCategories();

    this.notificationService.pageChanged$
      .pipe(takeUntil(this.destroy$))
      .subscribe(event => {
        if (event.data.page_type === 'index') {
          this.categoryService.loadHomeCategories();
        }
      });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
