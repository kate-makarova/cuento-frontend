import { Component, ElementRef, AfterViewInit, OnDestroy, ViewChild } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import {
  Chart,
  CategoryScale,
  LinearScale,
  BarController,
  BarElement,
  LineController,
  LineElement,
  PointElement,
  DoughnutController,
  ArcElement,
  Filler,
  Legend,
  Tooltip,
} from 'chart.js';

Chart.register(
  CategoryScale, LinearScale,
  BarController, BarElement,
  LineController, LineElement, PointElement,
  DoughnutController, ArcElement,
  Filler, Legend, Tooltip,
);

const OPEN_COLOR      = '#52c97e';
const FINISHED_COLOR  = '#5289c9';
const ABANDONED_COLOR = '#c95252';

const SUBFORUMS = ['Northlands', 'The Capital', 'Sea of Stars', 'Ancient Ruins', 'Merchant Roads'];
const FACTIONS  = ["Crown & Court", "Mage's Circle", 'Shadowmere Guild', 'Free Merchants', 'Wanderers', 'Unaligned'];

@Component({
  selector: 'app-game-stats',
  host: { class: 'pun-page' },
  standalone: true,
  imports: [DecimalPipe],
  templateUrl: './game-stats.component.html',
  styleUrl: './game-stats.component.css',
})
export class GameStatsComponent implements AfterViewInit, OnDestroy {
  @ViewChild('statusCanvas')        statusCanvas!:        ElementRef<HTMLCanvasElement>;
  @ViewChild('activityCanvas')      activityCanvas!:      ElementRef<HTMLCanvasElement>;
  @ViewChild('subforumEpCanvas')    subforumEpCanvas!:    ElementRef<HTMLCanvasElement>;
  @ViewChild('subforumPostsCanvas') subforumPostsCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('topWritersCanvas')    topWritersCanvas!:    ElementRef<HTMLCanvasElement>;
  @ViewChild('topCharsCanvas')      topCharsCanvas!:      ElementRef<HTMLCanvasElement>;
  @ViewChild('factionEpCanvas')     factionEpCanvas!:     ElementRef<HTMLCanvasElement>;

  private charts: Chart[] = [];

  readonly totalOpen      = 22;
  readonly totalFinished  = 39;
  readonly totalAbandoned = 13;
  readonly totalPosts     = 4550;
  readonly totalPlayers   = 47;
  readonly totalChars     = 84;

  ngAfterViewInit() {
    this.charts = [
      this.buildStatusChart(),
      this.buildActivityChart(),
      this.buildSubforumEpChart(),
      this.buildSubforumPostsChart(),
      this.buildTopWritersChart(),
      this.buildTopCharsChart(),
      this.buildFactionEpChart(),
    ];
  }

  ngOnDestroy() {
    this.charts.forEach(c => c.destroy());
  }

  private buildStatusChart(): Chart {
    return new Chart(this.statusCanvas.nativeElement, {
      type: 'doughnut',
      data: {
        labels: ['Open', 'Finished', 'Abandoned'],
        datasets: [{
          data: [this.totalOpen, this.totalFinished, this.totalAbandoned],
          backgroundColor: [OPEN_COLOR, FINISHED_COLOR, ABANDONED_COLOR],
          borderWidth: 2,
          hoverOffset: 6,
        }],
      },
      options: {
        responsive: true,
        plugins: { legend: { position: 'bottom' } },
      },
    });
  }

  private buildActivityChart(): Chart {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const posts   = [342, 289, 315, 378, 425, 512, 498, 467, 389, 356, 301, 278];
    return new Chart(this.activityCanvas.nativeElement, {
      type: 'line',
      data: {
        labels: months,
        datasets: [{
          label: 'Posts',
          data: posts,
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

  private buildSubforumEpChart(): Chart {
    return new Chart(this.subforumEpCanvas.nativeElement, {
      type: 'bar',
      data: {
        labels: SUBFORUMS,
        datasets: [
          { label: 'Open',      data: [5, 8, 4, 2, 3], backgroundColor: OPEN_COLOR,      stack: 'ep' },
          { label: 'Finished',  data: [9, 12, 7, 5, 6], backgroundColor: FINISHED_COLOR,  stack: 'ep' },
          { label: 'Abandoned', data: [3, 4, 2, 2, 2], backgroundColor: ABANDONED_COLOR, stack: 'ep' },
        ],
      },
      options: {
        responsive: true,
        plugins: { legend: { position: 'top' } },
        scales: {
          x: { stacked: true },
          y: { stacked: true, beginAtZero: true, title: { display: true, text: 'Episodes' } },
        },
      },
    });
  }

  private buildSubforumPostsChart(): Chart {
    return new Chart(this.subforumPostsCanvas.nativeElement, {
      type: 'bar',
      data: {
        labels: SUBFORUMS,
        datasets: [{
          label: 'Posts',
          data: [890, 1250, 720, 580, 610],
          backgroundColor: 'rgba(82,137,201,0.75)',
          borderColor: FINISHED_COLOR,
          borderWidth: 1,
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
    const users = ['Aelindra', 'ThornKnight', 'SilverMoon', 'DesertWalker', 'FrostBorn',
                   'Nightshade', 'GoldenQuill', 'IronVeil', 'StormSeer', 'WillowDancer'];
    return new Chart(this.topWritersCanvas.nativeElement, {
      type: 'bar',
      data: {
        labels: users,
        datasets: [{
          label: 'Posts',
          data: [892, 756, 634, 589, 512, 487, 445, 398, 367, 334],
          backgroundColor: 'rgba(124,82,224,0.75)',
          borderColor: '#7c52e0',
          borderWidth: 1,
        }],
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        plugins: { legend: { display: false } },
        scales: { x: { beginAtZero: true, title: { display: true, text: 'Posts' } } },
      },
    });
  }

  private buildTopCharsChart(): Chart {
    const chars = ['Lady Seraphine', 'Sir Dorian', 'Kira the Swift', 'The Wanderer',
                   'Frost Mage Elara', 'Shadow', 'Archmage Valdris', 'Cmdr. Ashra',
                   'Oracle Mira', 'Livia of the Wood'];
    return new Chart(this.topCharsCanvas.nativeElement, {
      type: 'bar',
      data: {
        labels: chars,
        datasets: [{
          label: 'Posts',
          data: [645, 589, 478, 412, 389, 356, 334, 298, 267, 245],
          backgroundColor: 'rgba(82,201,168,0.75)',
          borderColor: '#52c9a8',
          borderWidth: 1,
        }],
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        plugins: { legend: { display: false } },
        scales: { x: { beginAtZero: true, title: { display: true, text: 'Posts' } } },
      },
    });
  }

  private buildFactionEpChart(): Chart {
    return new Chart(this.factionEpCanvas.nativeElement, {
      type: 'bar',
      data: {
        labels: FACTIONS,
        datasets: [
          { label: 'Open',      data: [8, 4, 3, 2, 2, 3], backgroundColor: OPEN_COLOR,      stack: 'ep' },
          { label: 'Finished',  data: [8, 8, 6, 6, 4, 7], backgroundColor: FINISHED_COLOR,  stack: 'ep' },
          { label: 'Abandoned', data: [2, 2, 2, 1, 2, 4], backgroundColor: ABANDONED_COLOR, stack: 'ep' },
        ],
      },
      options: {
        responsive: true,
        plugins: { legend: { position: 'top' } },
        scales: {
          x: { stacked: true },
          y: { stacked: true, beginAtZero: true, title: { display: true, text: 'Episodes' } },
        },
      },
    });
  }
}
