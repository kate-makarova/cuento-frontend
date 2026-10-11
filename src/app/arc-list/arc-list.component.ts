import { Component, inject, OnInit, signal } from '@angular/core';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { debounceTime, distinctUntilChanged, Subject } from 'rxjs';
import { ArcService } from '../services/arc.service';
import { FactionService } from '../services/faction.service';
import { AuthService } from '../services/auth.service';
import { ArcStatus, ArcFilterRequest } from '../models/StoryArc';

@Component({
  selector: 'app-arc-list',
  host: { class: 'pun-page' },
  standalone: true,
  imports: [RouterLink, FormsModule],
  templateUrl: './arc-list.component.html',
  styleUrl: './arc-list.component.css',
})
export class ArcListComponent implements OnInit {
  private arcService = inject(ArcService);
  private factionService = inject(FactionService);
  private authService = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  readonly arcs = this.arcService.arcs;
  readonly totalPages = this.arcService.totalPages;
  readonly factions = this.factionService.factions;

  filtersOpen = signal(false);
  currentPage = 1;

  searchQuery = '';
  selectedStatuses: number[] = [];
  selectedFactions: number[] = [];

  canCreate = this.authService.isAuthenticated() &&
    this.authService.hasPermission('can_create_story_arc');

  readonly ArcStatus = ArcStatus;

  readonly allStatuses = [
    { value: ArcStatus.Pending,   label: $localize`:@@arclist.statusPending:Pending` },
    { value: ArcStatus.Active,    label: $localize`:@@arclist.statusActive:Active` },
    { value: ArcStatus.Archived,  label: $localize`:@@arclist.statusArchived:Archived` },
    { value: ArcStatus.Finished,  label: $localize`:@@arclist.statusFinished:Finished` },
  ];

  private searchSubject = new Subject<string>();

  constructor() {
    this.factionService.loadFactions();
    this.searchSubject.pipe(debounceTime(300), distinctUntilChanged()).subscribe(() => {
      this.currentPage = 1;
      this.loadPage();
    });
  }

  ngOnInit(): void {
    const params = this.route.snapshot.queryParamMap;
    const factions = params.get('factions');
    if (factions) this.selectedFactions = factions.split(',').map(Number).filter(n => !isNaN(n));
    const statuses = params.get('statuses');
    if (statuses) this.selectedStatuses = statuses.split(',').map(Number).filter(n => !isNaN(n));
    const page = params.get('page');
    if (page) this.currentPage = parseInt(page, 10) || 1;
    const search = params.get('search');
    if (search) this.searchQuery = search;
    this.loadPage();
  }

  isStatusSelected(value: number): boolean {
    return this.selectedStatuses.includes(value);
  }

  toggleStatus(value: number): void {
    const idx = this.selectedStatuses.indexOf(value);
    if (idx > -1) this.selectedStatuses.splice(idx, 1);
    else this.selectedStatuses.push(value);
  }

  isFactionSelected(id: number): boolean {
    return this.selectedFactions.includes(id);
  }

  toggleFaction(id: number): void {
    const idx = this.selectedFactions.indexOf(id);
    if (idx > -1) this.selectedFactions.splice(idx, 1);
    else this.selectedFactions.push(id);
  }

  onSearchInput(): void {
    this.searchSubject.next(this.searchQuery);
  }

  applyFilters(): void {
    this.currentPage = 1;
    this.loadPage();
    this.updateUrlParams();
  }

  prevPage(): void {
    if (this.currentPage > 1) { this.currentPage--; this.loadPage(); this.updateUrlParams(); }
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages()) { this.currentPage++; this.loadPage(); this.updateUrlParams(); }
  }

  statusLabel(status: ArcStatus): string {
    return this.allStatuses.find(s => s.value === status)?.label ?? String(status);
  }

  private loadPage(): void {
    const filter: ArcFilterRequest = { page: this.currentPage };
    if (this.selectedStatuses.length) filter.statuses = this.selectedStatuses;
    if (this.selectedFactions.length) filter.faction_ids = this.selectedFactions;
    if (this.searchQuery.trim()) filter.search = this.searchQuery.trim();
    this.arcService.loadArcs(filter);
    this.updateUrlParams();
  }

  private updateUrlParams(): void {
    const queryParams: Record<string, string | number> = {};
    if (this.selectedFactions.length) queryParams['factions'] = this.selectedFactions.join(',');
    if (this.selectedStatuses.length) queryParams['statuses'] = this.selectedStatuses.join(',');
    if (this.currentPage > 1) queryParams['page'] = this.currentPage;
    if (this.searchQuery.trim()) queryParams['search'] = this.searchQuery.trim();
    this.router.navigate([], { relativeTo: this.route, queryParams, replaceUrl: true });
  }
}
