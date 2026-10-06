import { Component, DestroyRef, ElementRef, HostListener, OnInit, computed, effect, signal, viewChild, inject, Signal } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { InteractiveMapService } from '../services/interactive-map.service';

const RULER_TOP_HEIGHT = 24;
const RULER_LEFT_WIDTH = 52;

interface CoordConfig {
  zeroPoint: number[];
  zeroMeridian?: number[][];
  referencePoint?: { px: number[]; lat: number; lon: number };
  measureRatio: number[];
  coordinateSystem?: string;
  mapWidth: number;
  mapHeight: number;
}

class CartesianCoordinates {
  readonly pixelsPerUnit: number;
  readonly gridLines: Signal<{
    verticals: { px: number; km: number }[];
    horizontals: { px: number; km: number }[];
    stepPx: number;
    gridStepKm: number;
  }>;
  readonly gridLabels: Signal<{
    xLabels: { screenX: number; value: string }[];
    yLabels: { screenY: number; value: string }[];
  }>;

  constructor(
    private config: CoordConfig,
    private scale: Signal<number>,
    private translateX: Signal<number>,
    private translateY: Signal<number>,
    private containerWidth: Signal<number>,
  ) {
    this.pixelsPerUnit = config.measureRatio[0] / config.measureRatio[1];

    this.gridLines = computed(() => {
      const visibleWidthKm = this.containerWidth() / (this.scale() * this.pixelsPerUnit);
      const rawStep = visibleWidthKm / 10;
      const power = Math.round(Math.log10(rawStep));
      const gridStepKm = Math.pow(10, power);
      const stepPx = gridStepKm * this.pixelsPerUnit;

      const [zx, zy] = this.config.zeroPoint;
      const verticals: { px: number; km: number }[] = [];
      const horizontals: { px: number; km: number }[] = [];

      for (let n = 0; zx - n * stepPx >= 0; n++) verticals.push({ px: Math.round(zx - n * stepPx), km: -n * gridStepKm });
      for (let n = 1; zx + n * stepPx <= this.config.mapWidth; n++) verticals.push({ px: Math.round(zx + n * stepPx), km: n * gridStepKm });

      for (let n = 0; zy - n * stepPx >= 0; n++) horizontals.push({ px: Math.round(zy - n * stepPx), km: -n * gridStepKm });
      for (let n = 1; zy + n * stepPx <= this.config.mapHeight; n++) horizontals.push({ px: Math.round(zy + n * stepPx), km: n * gridStepKm });

      return { verticals, horizontals, stepPx, gridStepKm };
    });

    this.gridLabels = computed(() => {
      const { verticals, horizontals } = this.gridLines();
      const tx = this.translateX();
      const ty = this.translateY();
      const s = this.scale();

      const xLabels = verticals
        .map(({ px, km }) => ({ screenX: px * s + tx, value: this.formatUnit(km) }))
        .filter(l => l.screenX >= RULER_LEFT_WIDTH && l.screenX <= this.containerWidth());

      const yLabels = horizontals
        .map(({ px, km }) => ({ screenY: px * s + ty, value: this.formatUnit(km) }))
        .filter(l => l.screenY >= RULER_TOP_HEIGHT && l.screenY <= window.innerHeight);

      return { xLabels, yLabels };
    });
  }

  formatUnit(value: number): string {
    const rounded = Math.round(value * 10) / 10;
    return rounded % 1 === 0 ? String(rounded) : rounded.toFixed(1);
  }

  pixelToUnit(mapX: number, mapY: number): { x: number; y: number } {
    const [zx, zy] = this.config.zeroPoint;
    const rawX = (mapX - zx) / this.pixelsPerUnit;
    const rawY = (mapY - zy) / this.pixelsPerUnit;
    return {
      x: Math.round(rawX * 10) / 10,
      y: Math.round(rawY * 10) / 10,
    };
  }

  distanceInUnits(dx: number, dy: number): number {
    return Math.sqrt(dx ** 2 + dy ** 2) / this.pixelsPerUnit;
  }
}

class RadialCoordinates {
  readonly pixelsPerUnit: number;
  readonly kmPerDegree: number;
  readonly gridLines: Signal<{
    circles: { px: number; unit: number }[];
    radials: { angle: number; label: string }[];
  }>;
  readonly gridLabels: Signal<{
    circleLabels: { screenX: number; screenY: number; value: string }[];
  }>;

  constructor(
    private config: CoordConfig,
    private scale: Signal<number>,
    private translateX: Signal<number>,
    private translateY: Signal<number>,
    private containerWidth: Signal<number>,
  ) {
    this.pixelsPerUnit = config.measureRatio[0] / config.measureRatio[1];

    if (config.referencePoint) {
      const [zx, zy] = config.zeroPoint;
      const { px: refPx, lat: refLat } = config.referencePoint;
      const radiusKm = Math.hypot(refPx[0] - zx, refPx[1] - zy) / this.pixelsPerUnit;
      this.kmPerDegree = radiusKm / (90 - refLat);
    } else {
      this.kmPerDegree = 111;
    }

    this.gridLines = computed(() => {
      const visibleWidthKm = this.containerWidth() / (this.scale() * this.pixelsPerUnit);
      const rawStep = visibleWidthKm / 10;
      const power = Math.round(Math.log10(rawStep));
      const gridStepKm = Math.pow(10, power);

      const maxRadius = Math.hypot(this.config.mapWidth, this.config.mapHeight);
      const circles: { px: number; unit: number }[] = [];
      for (let n = 1; n * gridStepKm * this.pixelsPerUnit <= maxRadius; n++) {
        circles.push({ px: Math.round(n * gridStepKm * this.pixelsPerUnit), unit: n * gridStepKm });
      }

      const [p1, p2] = this.config.zeroMeridian!;
      const zeroAngle = Math.atan2(p2[1] - p1[1], p2[0] - p1[0]);
      const radials: { angle: number; label: string }[] = [];
      for (let i = 0; i < 12; i++) {
        const angle = zeroAngle + (i * 2 * Math.PI) / 12;
        radials.push({ angle, label: `${i * 30}°` });
      }

      return { circles, radials };
    });

    this.gridLabels = computed(() => {
      const { circles } = this.gridLines();
      const [zx, zy] = this.config.zeroPoint;
      const s = this.scale();
      const tx = this.translateX();
      const ty = this.translateY();
      const cx = zx * s + tx;
      const cy = zy * s + ty;

      const circleLabels = circles
        .map(({ px, unit }) => ({ screenX: cx + px * s, screenY: cy, value: this.formatUnit(unit) }))
        .filter(l => l.screenX >= RULER_LEFT_WIDTH && l.screenX <= this.containerWidth() && l.screenY >= RULER_TOP_HEIGHT && l.screenY <= window.innerHeight);

      return { circleLabels };
    });
  }

  formatUnit(value: number): string {
    const rounded = Math.round(value * 10) / 10;
    return rounded % 1 === 0 ? String(rounded) : rounded.toFixed(1);
  }

  pixelToUnit(mapX: number, mapY: number): { radius: number; angle: number } {
    const [zx, zy] = this.config.zeroPoint;
    const [p1, p2] = this.config.zeroMeridian!;
    const zeroAngle = Math.atan2(p2[1] - p1[1], p2[0] - p1[0]);
    const dx = mapX - zx;
    const dy = mapY - zy;
    const rawAngle = Math.atan2(dy, dx) - zeroAngle;
    return {
      radius: Math.sqrt(dx ** 2 + dy ** 2) / this.pixelsPerUnit,
      angle: ((rawAngle % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI),
    };
  }

  pixelToLatLon(mapX: number, mapY: number): { lat: number; lon: number } {
    const { radius, angle } = this.pixelToUnit(mapX, mapY);
    const lat = 90 - radius / this.kmPerDegree;
    const lon = angle * 180 / Math.PI;
    return {
      lat: Math.round(lat * 10) / 10,
      lon: Math.round(lon * 10) / 10,
    };
  }
}

@Component({
  selector: 'app-interactive-map',
  standalone: true,
  imports: [RouterModule],
  templateUrl: './interactive-map.component.html',
  styleUrl: './interactive-map.component.css'
})
export class InteractiveMapComponent implements OnInit {
  private router = inject(Router);
  private activatedRoute = inject(ActivatedRoute);
  private mapService = inject(InteractiveMapService);
  private destroyRef = inject(DestroyRef);

  private mapConfigData = signal<(CoordConfig & { mapUrl?: string; coordinateSystem?: string; zeroMeridian?: number[][]; referencePoint?: any; markTypes?: Record<string, any>; marks?: any[]; measureUnit?: string }) | null>(null);

  get mapConfig() {
    return this.mapConfigData() ?? {
      mapUrl: '', mapWidth: 0, mapHeight: 0, coordinateSystem: '',
      zeroPoint: [0, 0], measureRatio: [1, 1],
      measureUnit: '', markTypes: {}, marks: [],
    } as any;
  }

  private coordsInstance = signal<CartesianCoordinates | null>(null);
  private radialCoordsInstance = signal<RadialCoordinates | null>(null);

  containerRef = viewChild<ElementRef<HTMLDivElement>>('container');

  readonly rulerTopHeight = RULER_TOP_HEIGHT;
  readonly rulerLeftWidth = RULER_LEFT_WIDTH;

  scale = signal(1);
  private translateX = signal(0);
  private translateY = signal(0);
  private containerWidth = signal(window.innerWidth);

  readonly gridLines = computed(() => {
    const c = this.coordsInstance();
    if (!c) return { verticals: [] as { px: number; km: number }[], horizontals: [] as { px: number; km: number }[], stepPx: 0, gridStepKm: 0 };
    return c.gridLines();
  });

  readonly gridLabels = computed(() => {
    const c = this.coordsInstance();
    if (!c) return { xLabels: [] as { screenX: number; value: string }[], yLabels: [] as { screenY: number; value: string }[] };
    return c.gridLabels();
  });

  readonly radialGrid = computed(() => {
    const cfg = this.mapConfigData();
    if (!cfg || cfg.coordinateSystem !== 'radial') return null;
    const rc = this.radialCoordsInstance();
    if (!rc) return null;
    const { circles, radials } = rc.gridLines();
    const [zx, zy] = cfg.zeroPoint;
    const maxR = Math.hypot(cfg.mapWidth, cfg.mapHeight);
    const radialLines = radials.map(r => ({
      label: r.label,
      x1: zx, y1: zy,
      x2: zx + Math.cos(r.angle) * maxR,
      y2: zy + Math.sin(r.angle) * maxR,
    }));

    let refCircle: { px: number; label: string; labelX: number; labelY: number } | null = null;
    if (cfg.referencePoint) {
      const { px: refPx, lat: refLat } = cfg.referencePoint;
      const radiusPx = Math.hypot(refPx[0] - zx, refPx[1] - zy);
      const [p1, p2] = cfg.zeroMeridian!;
      const zeroAngle = Math.atan2(p2[1] - p1[1], p2[0] - p1[0]);
      const latStr = refLat >= 0 ? `${refLat}°N` : `${-refLat}°S`;
      refCircle = {
        px: radiusPx,
        label: latStr,
        labelX: zx + Math.cos(zeroAngle) * radiusPx + 6,
        labelY: zy + Math.sin(zeroAngle) * radiusPx,
      };
    }

    return { circles, radialLines, zx, zy, refCircle };
  });

  readonly flagColors = ['black', 'white', 'blue', 'purple', 'green', 'yellow', 'red', 'orange', 'grey'];

  mode = signal<'cursor' | 'flag' | 'path'>('cursor');
  selectedFlagColor = signal('red');
  flags = signal<{ x: number; y: number; color: string }[]>([]);
  paths = signal<{ x: number; y: number }[][]>([]);

  readonly allPathData = computed(() => {
    const c = this.coordsInstance();
    if (!c) return [];
    return this.paths().map(pts => {
      const segments = pts.slice(0, -1).map((a, i) => {
        const b = pts[i + 1];
        const distKm = c.distanceInUnits(b.x - a.x, b.y - a.y);
        return { a, b, distLabel: c.formatUnit(distKm), mx: (a.x + b.x) / 2, my: (a.y + b.y) / 2 };
      });
      const totalKm = segments.reduce((sum, s) => sum + c.distanceInUnits(s.b.x - s.a.x, s.b.y - s.a.y), 0);
      return { pts, segments, totalLabel: c.formatUnit(totalKm) };
    });
  });

  private isDragging = false;
  private hasDragged = false;
  private clickStartX = 0;
  private clickStartY = 0;
  private lastMouseX = 0;
  private lastMouseY = 0;

  private hoverTimer: ReturnType<typeof setTimeout> | null = null;
  private hoverClientX = 0;
  private hoverClientY = 0;

  tooltip = signal<{ screenX: number; screenY: number; text: string; mapX: number; mapY: number } | null>(null);
  markTooltip = signal<{ screenX: number; screenY: number; title: string; legend: string } | null>(null);

  private get markTypesMap(): Record<string, { color: string; shape: string; legend: string }> {
    return (this.mapConfigData()?.markTypes ?? {}) as Record<string, { color: string; shape: string; legend: string }>;
  }

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

  readonly transform = computed(() =>
    `translate(${this.translateX()}px, ${this.translateY()}px) scale(${this.scale()})`
  );

  ngOnInit(): void {
    const idStr = this.activatedRoute.snapshot.paramMap.get('id');
    if (!idStr) return;
    const id = Number(idStr);
    if (isNaN(id)) return;

    this.mapService.getMap(id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (map) => {
        const cfg = map.config as any;
        this.mapConfigData.set(cfg);
        this.coordsInstance.set(new CartesianCoordinates(cfg, this.scale, this.translateX, this.translateY, this.containerWidth));
        if (cfg.coordinateSystem === 'radial' && cfg.zeroMeridian) {
          this.radialCoordsInstance.set(new RadialCoordinates(cfg, this.scale, this.translateX, this.translateY, this.containerWidth));
        }

        const scaleX = window.innerWidth / cfg.mapWidth;
        const scaleY = window.innerHeight / cfg.mapHeight;
        const initialScale = Math.min(scaleX, scaleY);
        this.scale.set(initialScale);
        this.translateX.set((window.innerWidth - cfg.mapWidth * initialScale) / 2);
        this.translateY.set((window.innerHeight - cfg.mapHeight * initialScale) / 2);

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
      },
      error: (err) => console.error('Failed to load map', err),
    });
  }

  constructor() {
    effect((onCleanup) => {
      const el = this.containerRef()?.nativeElement;
      if (!el) return;
      const handler = (e: WheelEvent) => this.onWheel(e);
      el.addEventListener('wheel', handler, { passive: false });
      onCleanup(() => el.removeEventListener('wheel', handler));
    });
  }

  @HostListener('window:resize')
  onResize(): void {
    this.containerWidth.set(window.innerWidth);
  }

  onWheel(event: WheelEvent): void {
    event.preventDefault();
    const factor = event.deltaY < 0 ? 1.1 : 0.9;
    const rect = this.containerRef()!.nativeElement.getBoundingClientRect();
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
      queryParamsHandling: 'merge',
    });
  }

  showMarkTooltip(event: MouseEvent, mark: { type: string; title: string }): void {
    const type = this.getMarkType(mark.type);
    this.markTooltip.set({ screenX: event.clientX, screenY: event.clientY, title: mark.title, legend: type?.legend ?? '' });
  }

  hideMarkTooltip(): void {
    this.markTooltip.set(null);
  }

  private onMapClick(event: MouseEvent): void {
    this.markTooltip.set(null);
    const rect = this.containerRef()!.nativeElement.getBoundingClientRect();
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
    const cfg = this.mapConfigData();
    if (!cfg) return;
    const c = this.coordsInstance();
    const rc = this.radialCoordsInstance();
    const rect = this.containerRef()!.nativeElement.getBoundingClientRect();
    const containerX = this.hoverClientX - rect.left;
    const containerY = this.hoverClientY - rect.top;
    const mapX = Math.round((containerX - this.translateX()) / this.scale());
    const mapY = Math.round((containerY - this.translateY()) / this.scale());
    let text: string;
    if (cfg.coordinateSystem === 'radial' && rc) {
      const { lat, lon } = rc.pixelToLatLon(mapX, mapY);
      const latStr = lat >= 0 ? `${lat}°N` : `${-lat}°S`;
      const lonStr = lon >= 0 ? `${lon}°E` : `${-lon}°W`;
      text = `${latStr}, ${lonStr}`;
    } else if (c) {
      const { x, y } = c.pixelToUnit(mapX, mapY);
      text = `${x} × ${y} ${cfg.measureUnit ?? ''}`;
    } else {
      return;
    }
    this.tooltip.set({ screenX: this.hoverClientX, screenY: this.hoverClientY, text, mapX, mapY });
  }
}
