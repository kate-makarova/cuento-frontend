import { Component, ElementRef, HostListener, AfterViewInit, OnInit, computed, signal, viewChild, inject } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';

const RULER_TOP_HEIGHT = 24;
const RULER_LEFT_WIDTH = 52;

@Component({
  selector: 'app-interactive-map',
  standalone: true,
  imports: [RouterModule],
  templateUrl: './interactive-map.component.html',
  styleUrl: './interactive-map.component.css'
})
export class InteractiveMapComponent implements OnInit, AfterViewInit {
  private router = inject(Router);
  private activatedRoute = inject(ActivatedRoute);

  public mapConfig = {
    mapWidth: 1514,
    mapHeight: 757,
    horizontalDirection: 'right',
    verticalDirection: 'bottom',
    zeroPoint: [760, 470],
    measureUnit: 'km',
    measureRatio: [20, 1],
    mapUrl: 'https://upforme.ru/uploads/001c/9f/bb/7/12637.jpg',
    markTypes: {
      maasKharet: {
        color: 'red',
        shape: 'circle',
        legend: 'Mass Kharet settlement'
      },
      harkonnenSettlement: {
        color: 'blue',
        shape: 'square',
        legend: 'Harkonnen settlement'
      },
      atreidesSettlement: {
        color: 'green',
        shape: 'triangle',
        legend: 'Atreides settlement'
      },
      banditSettlement: {
        color: 'grey',
        shape: 'circle',
        legend: 'Bandit settlement'
      }
    },
    marks: [
      {
        type: 'maasKharet',
        title: 'Maas Kharet secret secret layer',
        x: 380,
        y: 310,
      },
      {
        type: 'harkonnenSettlement',
        title: 'Harkonnen outpost',
        x: 1100,
        y: 200,
      }
    ]
  };

  containerRef = viewChild.required<ElementRef<HTMLDivElement>>('container');

  readonly rulerTopHeight = RULER_TOP_HEIGHT;
  readonly rulerLeftWidth = RULER_LEFT_WIDTH;

  private scale = signal(1);
  private translateX = signal(0);
  private translateY = signal(0);
  private containerWidth = signal(window.innerWidth);

  readonly flagColors = ['black', 'white', 'blue', 'purple', 'green', 'yellow', 'red', 'orange', 'grey'];

  mode = signal<'cursor' | 'flag' | 'path'>('cursor');
  selectedFlagColor = signal('red');
  flags = signal<{ x: number; y: number; color: string }[]>([]);
  paths = signal<{ x: number; y: number }[][]>([]);

  readonly allPathData = computed(() =>
    this.paths().map(pts => {
      const segments = pts.slice(0, -1).map((a, i) => {
        const b = pts[i + 1];
        const distKm = Math.sqrt((b.x - a.x) ** 2 + (b.y - a.y) ** 2) / this.pixelsPerKm;
        return { a, b, distLabel: this.formatUnit(distKm), mx: (a.x + b.x) / 2, my: (a.y + b.y) / 2 };
      });
      const totalKm = segments.reduce((sum, s) => sum + Math.sqrt((s.b.x - s.a.x) ** 2 + (s.b.y - s.a.y) ** 2) / this.pixelsPerKm, 0);
      return { pts, segments, totalLabel: this.formatUnit(totalKm) };
    })
  );

  private isDragging = false;
  private hasDragged = false;
  private clickStartX = 0;
  private clickStartY = 0;
  private lastMouseX = 0;
  private lastMouseY = 0;

  private hoverTimer: ReturnType<typeof setTimeout> | null = null;
  private hoverClientX = 0;
  private hoverClientY = 0;

  tooltip = signal<{ screenX: number; screenY: number; mapX: number; mapY: number; unitX: number; unitY: number } | null>(null);

  private markTypesMap = this.mapConfig.markTypes as Record<string, { color: string; shape: string; legend: string }>;

  getMarkType(type: string) {
    return this.markTypesMap[type] ?? { color: 'white', shape: 'circle', legend: '' };
  }

  get markTypesList() {
    return Object.entries(this.markTypesMap).map(([key, v]) => ({ key, ...v }));
  }

  hiddenMarkTypes = signal<Set<string>>(new Set());

  trianglePoints(x: number, y: number): string {
    return `${x},${y - 7} ${x + 6},${y + 4} ${x - 6},${y + 4}`;
  }

  private get pixelsPerKm(): number {
    return this.mapConfig.measureRatio[0] / this.mapConfig.measureRatio[1];
  }

  readonly transform = computed(() =>
    `translate(${this.translateX()}px, ${this.translateY()}px) scale(${this.scale()})`
  );

  readonly gridLabels = computed(() => {
    const { verticals, horizontals } = this.gridLines();
    const tx = this.translateX();
    const ty = this.translateY();
    const s = this.scale();
    const [zx, zy] = this.mapConfig.zeroPoint;

    const xLabels = verticals
      .map(x => {
        const screenX = x * s + tx;
        const raw = (x - zx) / this.pixelsPerKm;
        const km = this.mapConfig.horizontalDirection === 'right' ? raw : -raw;
        return { screenX, value: this.formatUnit(km) };
      })
      .filter(l => l.screenX >= RULER_LEFT_WIDTH && l.screenX <= this.containerWidth());

    const yLabels = horizontals
      .map(y => {
        const screenY = y * s + ty;
        const raw = (y - zy) / this.pixelsPerKm;
        const km = this.mapConfig.verticalDirection === 'bottom' ? raw : -raw;
        return { screenY, value: this.formatUnit(km) };
      })
      .filter(l => l.screenY >= RULER_TOP_HEIGHT && l.screenY <= window.innerHeight);

    return { xLabels, yLabels };
  });

  private formatUnit(value: number): string {
    const rounded = Math.round(value * 10) / 10;
    return rounded % 1 === 0 ? String(rounded) : rounded.toFixed(1);
  }

  readonly gridLines = computed(() => {
    const visibleWidthKm = this.containerWidth() / (this.scale() * this.pixelsPerKm);
    const rawStep = visibleWidthKm / 10;
    const power = Math.round(Math.log10(rawStep));
    const gridStepKm = Math.pow(10, power);
    const stepPx = gridStepKm * this.pixelsPerKm;

    const [zx, zy] = this.mapConfig.zeroPoint;
    const verticals: number[] = [];
    const horizontals: number[] = [];

    for (let x = zx; x >= 0; x -= stepPx) verticals.push(Math.round(x));
    for (let x = zx + stepPx; x <= this.mapConfig.mapWidth; x += stepPx) verticals.push(Math.round(x));

    for (let y = zy; y >= 0; y -= stepPx) horizontals.push(Math.round(y));
    for (let y = zy + stepPx; y <= this.mapConfig.mapHeight; y += stepPx) horizontals.push(Math.round(y));

    return { verticals, horizontals, stepPx, gridStepKm };
  });

  ngOnInit(): void {
    const scaleX = window.innerWidth / this.mapConfig.mapWidth;
    const scaleY = window.innerHeight / this.mapConfig.mapHeight;
    const initialScale = Math.min(scaleX, scaleY);
    this.scale.set(initialScale);
    this.translateX.set((window.innerWidth - this.mapConfig.mapWidth * initialScale) / 2);
    this.translateY.set((window.innerHeight - this.mapConfig.mapHeight * initialScale) / 2);

    const qp = this.activatedRoute.snapshot.queryParamMap;

    this.flags.set(
      qp.getAll('flag')
        .map(s => { const [px, py, color] = s.split(','); return { x: Number(px), y: Number(py), color: color ?? 'red' }; })
        .filter(f => !isNaN(f.x) && !isNaN(f.y))
    );

    this.paths.set(
      qp.getAll('path')
        .map(s => s.split(';').map(pt => { const [px, py] = pt.split(','); return { x: Number(px), y: Number(py) }; }).filter(p => !isNaN(p.x) && !isNaN(p.y)))
        .filter(pts => pts.length > 0)
    );

    const rawHidden = qp.getAll('hidden');
    if (rawHidden.length) this.hiddenMarkTypes.set(new Set(rawHidden));
  }

  ngAfterViewInit(): void {
    this.containerRef().nativeElement.addEventListener(
      'wheel',
      (e: WheelEvent) => this.onWheel(e),
      { passive: false }
    );
  }

  @HostListener('window:resize')
  onResize(): void {
    this.containerWidth.set(window.innerWidth);
  }

  onWheel(event: WheelEvent): void {
    event.preventDefault();
    const factor = event.deltaY < 0 ? 1.1 : 0.9;
    const rect = this.containerRef().nativeElement.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;
    this.translateX.set(mouseX - (mouseX - this.translateX()) * factor);
    this.translateY.set(mouseY - (mouseY - this.translateY()) * factor);
    this.scale.set(this.scale() * factor);
  }

  onMouseDown(event: MouseEvent): void {
    this.clearHoverTimer();
    this.isDragging = true;
    this.hasDragged = false;
    this.clickStartX = event.clientX;
    this.clickStartY = event.clientY;
    this.lastMouseX = event.clientX;
    this.lastMouseY = event.clientY;
    event.preventDefault();
  }

  onMouseMove(event: MouseEvent): void {
    if (this.isDragging) {
      const dx = event.clientX - this.clickStartX;
      const dy = event.clientY - this.clickStartY;
      if (!this.hasDragged && dx * dx + dy * dy > 25) this.hasDragged = true;
      if (this.hasDragged) {
        this.translateX.update((x: number) => x + event.clientX - this.lastMouseX);
        this.translateY.update((y: number) => y + event.clientY - this.lastMouseY);
        this.lastMouseX = event.clientX;
        this.lastMouseY = event.clientY;
      }
      return;
    }
    this.clearHoverTimer();
    this.hoverClientX = event.clientX;
    this.hoverClientY = event.clientY;
    this.hoverTimer = setTimeout(() => this.showTooltip(), 2000);
  }

  onMouseUp(event: MouseEvent): void {
    if (this.isDragging && !this.hasDragged) this.onMapClick(event);
    this.isDragging = false;
    this.clearHoverTimer();
  }

  onClick(event: MouseEvent): void {
    event.stopPropagation();
  }

  toggleFlagPanel(): void {
    this.mode.set(this.mode() === 'flag' ? 'cursor' : 'flag');
  }

  selectFlagColor(color: string): void {
    this.selectedFlagColor.set(color);
    this.mode.set('flag');
  }

  enterPathMode(): void {
    this.paths.update(ps => [...ps, []]);
    this.mode.set('path');
  }

  toggleMarkType(key: string): void {
    this.hiddenMarkTypes.update(s => {
      const next = new Set(s);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
    this.updateUrl();
  }

  private updateUrl(): void {
    const flagParams = this.flags().map(f => `${f.x},${f.y},${f.color}`);
    const pathParams = this.paths().filter(pts => pts.length > 0).map(pts => pts.map(p => `${p.x},${p.y}`).join(';'));
    const hiddenParams = [...this.hiddenMarkTypes()];
    this.router.navigate([], {
      relativeTo: this.activatedRoute,
      queryParams: {
        flag: flagParams.length ? flagParams : null,
        path: pathParams.length ? pathParams : null,
        hidden: hiddenParams.length ? hiddenParams : null,
      },
      queryParamsHandling: 'replace',
    });
  }

  private onMapClick(event: MouseEvent): void {
    const rect = this.containerRef().nativeElement.getBoundingClientRect();
    const mapX = Math.round((event.clientX - rect.left - this.translateX()) / this.scale());
    const mapY = Math.round((event.clientY - rect.top - this.translateY()) / this.scale());

    if (this.mode() === 'flag') {
      this.flags.update(fs => [...fs, { x: mapX, y: mapY, color: this.selectedFlagColor() }]);
      this.updateUrl();
    } else if (this.mode() === 'path') {
      this.paths.update(ps => {
        const updated = ps.map((pts, i) => i === ps.length - 1 ? [...pts, { x: mapX, y: mapY }] : pts);
        return updated;
      });
      this.updateUrl();
    }
  }

  private clearHoverTimer(): void {
    if (this.hoverTimer !== null) {
      clearTimeout(this.hoverTimer);
      this.hoverTimer = null;
    }
    this.tooltip.set(null);
  }

  private showTooltip(): void {
    const rect = this.containerRef().nativeElement.getBoundingClientRect();
    const containerX = this.hoverClientX - rect.left;
    const containerY = this.hoverClientY - rect.top;
    const [zx, zy] = this.mapConfig.zeroPoint;
    const mapX = Math.round((containerX - this.translateX()) / this.scale());
    const mapY = Math.round((containerY - this.translateY()) / this.scale());
    const rawUnitX = (mapX - zx) / this.pixelsPerKm;
    const rawUnitY = (mapY - zy) / this.pixelsPerKm;
    const unitX = Math.round((this.mapConfig.horizontalDirection === 'right' ? rawUnitX : -rawUnitX) * 10) / 10;
    const unitY = Math.round((this.mapConfig.verticalDirection === 'bottom' ? rawUnitY : -rawUnitY) * 10) / 10;
    this.tooltip.set({ screenX: this.hoverClientX, screenY: this.hoverClientY, mapX, mapY, unitX, unitY });
  }
}
