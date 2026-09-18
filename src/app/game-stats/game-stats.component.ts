import { Component, computed, ElementRef, AfterViewInit, OnDestroy, OnInit, ViewChild, inject, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../services/api.service';
import {
  Chart,
  CategoryScale,
  LinearScale,
  BarController,
  BarElement,
  LineController,
  LineElement,
  PointElement,
  Filler,
  Legend,
  Tooltip,
} from 'chart.js';

Chart.register(
  CategoryScale, LinearScale,
  BarController, BarElement,
  LineController, LineElement, PointElement,
  Filler, Legend, Tooltip,
);

type Period = 'week_to_date' | 'month_to_date' | 'last_week' | 'last_month' | 'custom';

export interface PeriodOption { value: Period; label: string; }
export const PERIOD_OPTIONS: PeriodOption[] = [
  { value: 'week_to_date',  label: 'Week to date' },
  { value: 'month_to_date', label: 'Month to date' },
  { value: 'last_week',     label: 'Last week' },
  { value: 'last_month',    label: 'Last month' },
  { value: 'custom',        label: 'Custom' },
];

const OPEN_COLOR      = '#52c97e';
const FINISHED_COLOR  = '#5289c9';
const ABANDONED_COLOR = '#c95252';

interface WritingActivityPoint {
  date: string;
  count: number;
}

interface TopWriter {
  user_id: number;
  username: string;
  post_count: number;
}

interface TopCharacter {
  character_id: number | null;
  name: string;
  is_mask: boolean;
  post_count: number;
}

interface FactionEpisodes {
  faction_id: number;
  name: string;
  created: number;
  finished: number;
  archived: number;
}

interface FactionPosts {
  faction_id: number;
  name: string;
  post_count: number;
}

interface OverallStats {
  created_episodes: number;
  finished_episodes: number;
  inactivated_episodes: number;
  total_posts: number;
  created_wanted_characters: number;
  accepted_characters: number;
}

function fmtDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function subDays(d: Date, n: number): Date {
  const r = new Date(d);
  r.setDate(r.getDate() - n);
  return r;
}

function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function endOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59);
}

function startOfMonday(d: Date): Date {
  const r = new Date(d);
  r.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  r.setHours(0, 0, 0, 0);
  return r;
}

@Component({
  selector: 'app-game-stats',
  host: { class: 'pun-page' },
  standalone: true,
  imports: [DecimalPipe, FormsModule],
  templateUrl: './game-stats.component.html',
  styleUrl: './game-stats.component.css',
})
export class GameStatsComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('activityCanvas')   activityCanvas!:   ElementRef<HTMLCanvasElement>;
  @ViewChild('topWritersCanvas') topWritersCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('topCharsCanvas')      topCharsCanvas!:      ElementRef<HTMLCanvasElement>;
  @ViewChild('factionEpCanvas')     factionEpCanvas!:     ElementRef<HTMLCanvasElement>;
  @ViewChild('factionPostsCanvas')  factionPostsCanvas!:  ElementRef<HTMLCanvasElement>;

  private apiService = inject(ApiService);

  readonly overallStats = signal<OverallStats | null>(null);

  private activityChart:   Chart | null = null;
  private topWritersChart: Chart | null = null;
  private topCharsChart:      Chart | null = null;
  private factionEpChart:     Chart | null = null;
  private factionPostsChart:  Chart | null = null;

  readonly periodOptions = PERIOD_OPTIONS;
  readonly period    = signal<Period>('month_to_date');
  readonly customFrom = signal<string>(fmtDate(subDays(new Date(), 30)));
  readonly customTo   = signal<string>(fmtDate(new Date()));

  readonly config = computed(() =>
    this.getDateRange(this.period(), this.customFrom(), this.customTo())
  );

  readonly periodRangeLabel = computed(() => {
    const { from, to } = this.config();
    const opts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short', year: 'numeric' };
    return `${from.toLocaleDateString(undefined, opts)} – ${to.toLocaleDateString(undefined, opts)}`;
  });

  ngOnInit() {
    this.loadOverallStats();
  }

  ngAfterViewInit() {
    this.activityChart    = this.buildActivityChart();
    this.topWritersChart  = this.buildTopWritersChart();
    this.topCharsChart    = this.buildTopCharsChart();
    this.factionEpChart   = this.buildFactionEpChart();
    this.factionPostsChart = this.buildFactionPostsChart();
    this.loadActivityData();
    this.loadTopWriters();
    this.loadTopChars();
    this.loadFactionEpisodes();
    this.loadFactionPosts();
  }

  ngOnDestroy() {
    [this.activityChart, this.topWritersChart, this.topCharsChart,
     this.factionEpChart, this.factionPostsChart].forEach(c => c?.destroy());
  }

  setPeriod(p: Period) {
    this.period.set(p === 'custom' && this.period() === 'custom' ? 'month_to_date' : p);
    this.loadAll();
  }

  onCustomFromChange(val: string) {
    this.customFrom.set(val);
    if (this.period() === 'custom') this.loadAll();
  }

  onCustomToChange(val: string) {
    this.customTo.set(val);
    if (this.period() === 'custom') this.loadAll();
  }

  private loadAll() {
    this.loadOverallStats();
    this.loadActivityData();
    this.loadTopWriters();
    this.loadTopChars();
    this.loadFactionEpisodes();
    this.loadFactionPosts();
  }

  private loadOverallStats() {
    const { from, to } = this.config();
    this.overallStats.set(null);
    this.apiService.get<OverallStats>(
      `stats/overall?date_from=${fmtDate(from)}&date_to=${fmtDate(to)}`
    ).subscribe({
      next: data => this.overallStats.set(data),
      error: err => console.error('Failed to load overall stats', err),
    });
  }

  private loadActivityData() {
    const { from, to } = this.config();
    const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    this.activityChart!.data.labels = [];
    this.activityChart!.data.datasets[0].data = [];
    this.activityChart!.update('none');
    this.apiService.get<WritingActivityPoint[]>(
      `stats/writing-activity?date_from=${fmtDate(from)}&date_to=${fmtDate(to)}`
    ).subscribe({
      next: points => {
        this.activityChart!.data.labels = points.map(p => {
          const d = new Date(p.date + 'T00:00:00');
          const day = d.getDate();
          return day === 1 ? `${day} ${MONTH_NAMES[d.getMonth()]}` : String(day);
        });
        this.activityChart!.data.datasets[0].data = points.map(p => p.count);
        this.activityChart!.update('none');
      },
      error: err => console.error('Failed to load writing activity', err),
    });
  }

  private loadTopWriters() {
    const { from, to } = this.config();
    this.topWritersChart!.data.labels = [];
    this.topWritersChart!.data.datasets[0].data = [];
    this.topWritersChart!.update('none');
    this.apiService.get<TopWriter[]>(
      `stats/top-writers?date_from=${fmtDate(from)}&date_to=${fmtDate(to)}`
    ).subscribe({
      next: rows => {
        this.topWritersChart!.data.labels = rows.map(r => r.username);
        this.topWritersChart!.data.datasets[0].data = rows.map(r => r.post_count);
        this.topWritersChart!.update('none');
      },
      error: err => console.error('Failed to load top writers', err),
    });
  }

  private loadTopChars() {
    const { from, to } = this.config();
    this.topCharsChart!.data.labels = [];
    this.topCharsChart!.data.datasets[0].data = [];
    this.topCharsChart!.update('none');
    this.apiService.get<TopCharacter[]>(
      `stats/top-characters?date_from=${fmtDate(from)}&date_to=${fmtDate(to)}`
    ).subscribe({
      next: rows => {
        this.topCharsChart!.data.labels = rows.map(r => r.name);
        this.topCharsChart!.data.datasets[0].data = rows.map(r => r.post_count);
        this.topCharsChart!.update('none');
      },
      error: err => console.error('Failed to load top characters', err),
    });
  }

  private loadFactionEpisodes() {
    const { from, to } = this.config();
    this.factionEpChart!.data.labels = [];
    this.factionEpChart!.data.datasets.forEach(ds => ds.data = []);
    this.factionEpChart!.update('none');
    this.apiService.get<FactionEpisodes[]>(
      `stats/episodes-by-faction?date_from=${fmtDate(from)}&date_to=${fmtDate(to)}`
    ).subscribe({
      next: rows => {
        this.factionEpChart!.data.labels = rows.map(r => r.name);
        this.factionEpChart!.data.datasets[0].data = rows.map(r => r.created);
        this.factionEpChart!.data.datasets[1].data = rows.map(r => r.finished);
        this.factionEpChart!.data.datasets[2].data = rows.map(r => r.archived);
        this.factionEpChart!.update('none');
      },
      error: err => console.error('Failed to load faction episodes', err),
    });
  }

  private loadFactionPosts() {
    const { from, to } = this.config();
    this.factionPostsChart!.data.labels = [];
    this.factionPostsChart!.data.datasets[0].data = [];
    this.factionPostsChart!.update('none');
    this.apiService.get<FactionPosts[]>(
      `stats/posts-by-faction?date_from=${fmtDate(from)}&date_to=${fmtDate(to)}`
    ).subscribe({
      next: rows => {
        this.factionPostsChart!.data.labels = rows.map(r => r.name);
        this.factionPostsChart!.data.datasets[0].data = rows.map(r => r.post_count);
        this.factionPostsChart!.update('none');
      },
      error: err => console.error('Failed to load faction posts', err),
    });
  }

  // --- Date range ---

  private getDateRange(period: Period, customFrom: string, customTo: string): { from: Date; to: Date } {
    const today = new Date();
    today.setHours(23, 59, 59, 999);

    switch (period) {
      case 'week_to_date':
        return { from: startOfMonday(today), to: today };
      case 'month_to_date':
        return { from: startOfMonth(today), to: today };
      case 'last_week': {
        const thisMonday = startOfMonday(today);
        const lastMon = subDays(thisMonday, 7);
        const lastSun = subDays(thisMonday, 1);
        lastSun.setHours(23, 59, 59, 999);
        return { from: lastMon, to: lastSun };
      }
      case 'last_month': {
        const prevMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0, 23, 59, 59);
        return { from: startOfMonth(prevMonthEnd), to: endOfMonth(prevMonthEnd) };
      }
      case 'custom': {
        const from = new Date(customFrom + 'T00:00:00');
        const to   = new Date(customTo   + 'T23:59:59');
        return { from: isNaN(from.getTime()) ? subDays(today, 30) : from,
                 to:   isNaN(to.getTime())   ? today              : to  };
      }
    }
  }

  // --- Chart builders (initial render) ---

  private buildActivityChart(): Chart {
    return new Chart(this.activityCanvas.nativeElement, {
      type: 'line',
      data: {
        labels: [],
        datasets: [{
          label: 'Posts',
          data: [],
          borderColor: '#7c52e0',
          backgroundColor: 'rgba(124,82,224,0.12)',
          fill: true,
          tension: 0.4,
          pointRadius: 4,
        }],
      },
      options: {
        responsive: true,
        plugins: { legend: { display: false } },
        scales: { y: { beginAtZero: true, title: { display: true, text: 'Posts' } } },
      },
    });
  }

  private buildTopWritersChart(): Chart {
    return new Chart(this.topWritersCanvas.nativeElement, {
      type: 'bar',
      data: {
        labels: [],
        datasets: [{
          label: 'Posts',
          data: [],
          backgroundColor: 'rgba(124,82,224,0.75)',
          borderColor: '#7c52e0',
          borderWidth: 1,
        }],
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        plugins: { legend: { display: false } },
        scales: { x: { beginAtZero: true, ticks: { precision: 0 }, title: { display: true, text: 'Posts' } } },
      },
    });
  }

  private buildTopCharsChart(): Chart {
    return new Chart(this.topCharsCanvas.nativeElement, {
      type: 'bar',
      data: {
        labels: [],
        datasets: [{
          label: 'Posts',
          data: [],
          backgroundColor: 'rgba(82,201,168,0.75)',
          borderColor: '#52c9a8',
          borderWidth: 1,
        }],
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        plugins: { legend: { display: false } },
        scales: { x: { beginAtZero: true, ticks: { precision: 0 }, title: { display: true, text: 'Posts' } } },
      },
    });
  }

  private buildFactionEpChart(): Chart {
    return new Chart(this.factionEpCanvas.nativeElement, {
      type: 'bar',
      data: {
        labels: [],
        datasets: [
          { label: 'Created',  data: [], backgroundColor: OPEN_COLOR,      stack: 'ep' },
          { label: 'Finished', data: [], backgroundColor: FINISHED_COLOR,  stack: 'ep' },
          { label: 'Archived', data: [], backgroundColor: ABANDONED_COLOR, stack: 'ep' },
        ],
      },
      options: {
        responsive: true,
        plugins: { legend: { position: 'top' } },
        scales: {
          x: { stacked: true },
          y: { stacked: true, beginAtZero: true, ticks: { precision: 0 }, title: { display: true, text: 'Episodes' } },
        },
      },
    });
  }

  private buildFactionPostsChart(): Chart {
    return new Chart(this.factionPostsCanvas.nativeElement, {
      type: 'bar',
      data: {
        labels: [],
        datasets: [{
          label: 'Posts',
          data: [],
          backgroundColor: 'rgba(224,140,82,0.75)',
          borderColor: '#e08c52',
          borderWidth: 1,
        }],
      },
      options: {
        responsive: true,
        plugins: { legend: { display: false } },
        scales: { y: { beginAtZero: true, ticks: { precision: 0 }, title: { display: true, text: 'Posts' } } },
      },
    });
  }

}
