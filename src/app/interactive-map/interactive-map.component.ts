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
      harkonnenSettlement: {
        color: 'blue',
        shape: 'triangle',
        legend: 'Botanical testing station'
      },
      sietch: {
        color: 'brown',
        shape: 'diamond',
        legend: 'Sietch'
      },
      pyon: {
        color: 'yellow',
        shape: 'circle',
        legend: 'Pyon village'
      }
    },
    marks: [
      // Botanical testing stations
      { type: 'harkonnenSettlement', title: 'Cave of Ridges', x: 382, y: 117 },
      { type: 'harkonnenSettlement', title: 'Cave of Birds', x: 220, y: 431 },
      { type: 'harkonnenSettlement', title: '', x: 722, y: 248 },
      // Sietches
      { type: 'sietch', title: 'Sietch Tabr', x: 358, y: 120 },
      { type: 'sietch', title: 'Bight of the Cliff', x: 311, y: 165 },
      { type: 'sietch', title: '', x: 298, y: 177 },
      { type: 'sietch', title: '', x: 299, y: 188 },
      { type: 'sietch', title: '', x: 414, y: 286 },
      { type: 'sietch', title: '', x: 420, y: 296 },
      { type: 'sietch', title: '', x: 389, y: 313 },
      { type: 'sietch', title: '', x: 355, y: 327 },
      { type: 'sietch', title: '', x: 349, y: 338 },
      { type: 'sietch', title: '', x: 352, y: 347 },
      { type: 'sietch', title: '', x: 338, y: 391 },
      { type: 'sietch', title: '', x: 367, y: 445 },
      { type: 'sietch', title: '', x: 394, y: 444 },
      { type: 'sietch', title: '', x: 667, y: 455 },
      { type: 'sietch', title: '', x: 753, y: 463 },
      { type: 'sietch', title: '', x: 763, y: 463 },
      { type: 'sietch', title: 'Chin Rock', x: 700, y: 421 },
      { type: 'sietch', title: "Tuek's Sietch", x: 742, y: 418 },
      { type: 'sietch', title: '', x: 782, y: 358 },
      { type: 'sietch', title: '', x: 783, y: 334 },
      { type: 'sietch', title: '', x: 807, y: 332 },
      { type: 'sietch', title: '', x: 826, y: 332 },
      { type: 'sietch', title: '', x: 834, y: 341 },
      { type: 'sietch', title: '', x: 841, y: 351 },
      { type: 'sietch', title: '', x: 846, y: 329 },
      { type: 'sietch', title: 'Red Chasm', x: 836, y: 295 },
      { type: 'sietch', title: '', x: 845, y: 294 },
      { type: 'sietch', title: '', x: 846, y: 304 },
      { type: 'sietch', title: 'Gara Kulon', x: 818, y: 245 },
      { type: 'sietch', title: '', x: 734, y: 198 },
      { type: 'sietch', title: '', x: 734, y: 188 },
      { type: 'sietch', title: '', x: 733, y: 179 },
      { type: 'sietch', title: '', x: 733, y: 170 },
      { type: 'sietch', title: '', x: 754, y: 121 },
      { type: 'sietch', title: '', x: 758, y: 102 },
      { type: 'sietch', title: 'Sihaya Ridge', x: 741, y: 68 },
      { type: 'sietch', title: 'Sihaya Ridge', x: 737, y: 61 },
      { type: 'sietch', title: '', x: 447, y: 34 },
      { type: 'sietch', title: '', x: 378, y: 43 },
      { type: 'sietch', title: '', x: 388, y: 37 },
      // Pyon villages
      { type: 'pyon', title: '', x: 481, y: 88 },
      { type: 'pyon', title: '', x: 482, y: 97 },
      { type: 'pyon', title: '', x: 480, y: 105 },
      { type: 'pyon', title: '', x: 480, y: 115 },
      { type: 'pyon', title: 'Tsimpo', x: 492, y: 122 },
      { type: 'pyon', title: '', x: 501, y: 127 },
      { type: 'pyon', title: '', x: 506, y: 135 },
      { type: 'pyon', title: '', x: 498, y: 141 },
      { type: 'pyon', title: '', x: 491, y: 136 },
      { type: 'pyon', title: '', x: 516, y: 127 },
      { type: 'pyon', title: '', x: 526, y: 125 },
      { type: 'pyon', title: 'Arsunt', x: 535, y: 125 },
      { type: 'pyon', title: '', x: 544, y: 124 },
      { type: 'pyon', title: '', x: 552, y: 123 },
      { type: 'pyon', title: 'Carthag', x: 561, y: 122 },
      { type: 'pyon', title: '', x: 570, y: 127 },
      { type: 'pyon', title: '', x: 562, y: 135 },
      { type: 'pyon', title: '', x: 554, y: 142 },
      { type: 'pyon', title: '', x: 545, y: 147 },
      { type: 'pyon', title: '', x: 417, y: 173 },
      { type: 'pyon', title: '', x: 426, y: 177 },
      { type: 'pyon', title: '', x: 434, y: 182 },
      { type: 'pyon', title: '', x: 415, y: 189 },
      { type: 'pyon', title: '', x: 424, y: 196 },
    ]
  };

  containerRef = viewChild.required<ElementRef<HTMLDivElement>>('container');

  readonly rulerTopHeight = RULER_TOP_HEIGHT;
  readonly rulerLeftWidth = RULER_LEFT_WIDTH;

  scale = signal(1);
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
  markTooltip = signal<{ screenX: number; screenY: number; title: string; legend: string } | null>(null);

  private markTypesMap = this.mapConfig.markTypes as Record<string, { color: string; shape: string; legend: string }>;

  getMarkType(type: string) {
    return this.markTypesMap[type] ?? null;
  }

  get markTypesList() {
    return Object.entries(this.markTypesMap).map(([key, v]) => ({ key, ...v }));
  }

  hiddenMarkTypes = signal<Set<string>>(new Set());

  trianglePoints(x: number, y: number): string {
    return `${x},${y - 8} ${x + 7},${y + 5} ${x - 7},${y + 5}`;
  }

  diamondPoints(x: number, y: number): string {
    return `${x},${y - 8} ${x + 8},${y} ${x},${y + 8} ${x - 8},${y}`;
  }

  starPoints(x: number, y: number): string {
    const pts = [0, -9, 2.12, -2.91, 8.56, -2.78, 3.42, 1.11, 5.29, 7.28, 0, 3.6, -5.29, 7.28, -3.42, 1.11, -8.56, -2.78, -2.12, -2.91];
    const result: string[] = [];
    for (let i = 0; i < pts.length; i += 2) result.push(`${x + pts[i]},${y + pts[i + 1]}`);
    return result.join(' ');
  }

  pentagonPoints(x: number, y: number): string {
    const pts = [0, -9, 8.56, -2.78, 5.29, 7.28, -5.29, 7.28, -8.56, -2.78];
    const result: string[] = [];
    for (let i = 0; i < pts.length; i += 2) result.push(`${x + pts[i]},${y + pts[i + 1]}`);
    return result.join(' ');
  }

  hexagonPoints(x: number, y: number): string {
    const pts = [9, 0, 4.5, 7.79, -4.5, 7.79, -9, 0, -4.5, -7.79, 4.5, -7.79];
    const result: string[] = [];
    for (let i = 0; i < pts.length; i += 2) result.push(`${x + pts[i]},${y + pts[i + 1]}`);
    return result.join(' ');
  }

  crossPath(x: number, y: number): string {
    return `M${x - 3},${y - 9} H${x + 3} V${y - 3} H${x + 9} V${y + 3} H${x + 3} V${y + 9} H${x - 3} V${y + 3} H${x - 9} V${y - 3} H${x - 3} Z`;
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

  showMarkTooltip(event: MouseEvent, mark: { type: string; title: string }): void {
    const type = this.getMarkType(mark.type);
    this.markTooltip.set({ screenX: event.clientX, screenY: event.clientY, title: mark.title, legend: type.legend });
  }

  hideMarkTooltip(): void {
    this.markTooltip.set(null);
  }

  private onMapClick(event: MouseEvent): void {
    this.markTooltip.set(null);
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
