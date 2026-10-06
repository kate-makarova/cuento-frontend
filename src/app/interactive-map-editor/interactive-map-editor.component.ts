import { Component, OnInit, signal, computed, viewChild, ElementRef, AfterViewInit, HostListener, NgZone, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DecimalPipe } from '@angular/common';
import { MapMarkType, MapMark, MapConfig } from '../models/InteractiveMap';
import { InteractiveMapService } from '../services/interactive-map.service';

const INSTRUMENT_PANEL_HEIGHT = 44;
const RULER_TOP_HEIGHT = 24;
const RULER_LEFT_WIDTH = 52;

@Component({
  selector: 'app-interactive-map-editor',
  standalone: true,
  imports: [FormsModule, DecimalPipe],
  templateUrl: './interactive-map-editor.component.html',
  styleUrl: './interactive-map-editor.component.css'
})
export class InteractiveMapEditorComponent implements AfterViewInit, OnInit {
  private ngZone = inject(NgZone);
  private activatedRoute = inject(ActivatedRoute);
  private router = inject(Router);
  private mapService = inject(InteractiveMapService);

  mapId: number | null = null;
  saveState = signal<'idle' | 'saving' | 'saved' | 'error'>('idle');

  readonly rulerTopHeight = RULER_TOP_HEIGHT;
  readonly rulerLeftWidth = RULER_LEFT_WIDTH;
  readonly instrumentPanelHeight = INSTRUMENT_PANEL_HEIGHT;

  containerRef = viewChild.required<ElementRef<HTMLDivElement>>('container');

  mapConfig = signal<MapConfig>({
    mapUrl: '',
    mapWidth: 0,
    mapHeight: 0,
    horizontalDirection: 'right',
    verticalDirection: 'bottom',
    zeroPoint: [0, 0],
    measureUnit: '',
    measureRatio: [1, 1],
    markTypes: {},
    marks: []
  });

  // ── Setup panel ──
  setupOpen = signal(false);
  activeSetupSection = signal<'image' | 'metadata' | 'distance' | 'radial' | null>(null);

  imageUrlInput = '';
  imageLoadError = false;

  metaHorizontalDirection: '' | 'left' | 'right' = '';
  metaVerticalDirection: '' | 'top' | 'bottom' = '';
  metaMeasureUnit = '';
  metaZeroPointX = '';
  metaZeroPointY = '';
  metaMeasureRatioPixels = '';
  metaMeasureRatioUnits = '';
  metaCoordinateSystem: '' | 'cartesian' | 'radial' = '';

  // ── Config panel ──
  configOpen = signal(false);
  rawConfigModalOpen = signal(false);
  rawConfigText = '';
  rawConfigError = '';

  // ── Marks panel ──
  marksOpen = signal(false);
  activeMarksSection = signal<'legend' | null>(null);

  newMarkLegend = '';
  newMarkShape: MapMarkType['shape'] = 'circle';
  newMarkColor = '#e03c3c';

  readonly markTypesList = computed(() =>
    Object.entries(this.mapConfig().markTypes ?? {}).map(([key, v]) => ({ key, ...v }))
  );

  // ── Marks modal ──
  marksModalOpen = signal(false);
  editingMark = signal<MapMark | null>(null);

  editMarkType = '';
  editMarkTitle = '';
  editMarkDescription = '';

  // ── Mark tooltip ──
  markTooltip = signal<{ screenX: number; screenY: number; mark: MapMark } | null>(null);

  // ── Modes ──
  settingZeroPoint = signal(false);
  settingDistanceRef = signal(false);
  settingZeroMeridian = signal(false);
  settingRefPoint = signal(false);
  addingMark = signal(false);

  distanceRefPoints = signal<{ x: number; y: number }[]>([]);
  distanceInput = '';

  zeroMeridianPoints = signal<{ x: number; y: number }[]>([]);

  refPointX = '';
  refPointY = '';
  refPointLat = '';

  // ── Pan / zoom ──
  protected scale = signal(1);
  private translateX = signal(0);
  private translateY = signal(0);
  containerWidth = signal(window.innerWidth);

  readonly transform = computed(() =>
    `translate(${this.translateX()}px, ${this.translateY()}px) scale(${this.scale()})`
  );

  private isDragging = false;
  private hasDragged = false;
  private clickStartX = 0;
  private clickStartY = 0;
  private lastMouseX = 0;
  private lastMouseY = 0;

  // ── Grid ──
  readonly showGrid = computed(() =>
    !!this.mapConfig().zeroPoint && !!this.mapConfig().measureRatio && this.mapConfig().coordinateSystem !== 'radial'
  );

  private readonly pixelsPerUnit = computed(() => {
    const ratio = this.mapConfig().measureRatio;
    return ratio ? ratio[0] / ratio[1] : 1;
  });

  readonly gridLines = computed(() => {
    const cfg = this.mapConfig();
    if (!cfg.zeroPoint || !cfg.measureRatio || !cfg.mapWidth || !cfg.mapHeight) {
      return { verticals: [] as number[], horizontals: [] as number[], gridStepUnits: 1 };
    }
    const ppu = this.pixelsPerUnit();
    const visibleWidthUnits = this.containerWidth() / (this.scale() * ppu);
    const rawStep = visibleWidthUnits / 10;
    const power = Math.round(Math.log10(rawStep));
    const gridStepUnits = Math.pow(10, power);
    const stepPx = gridStepUnits * ppu;
    const [zx, zy] = cfg.zeroPoint;
    const verticals: number[] = [];
    const horizontals: number[] = [];

    for (let x = zx; x >= 0; x -= stepPx) verticals.push(Math.round(x));
    for (let x = zx + stepPx; x <= cfg.mapWidth; x += stepPx) verticals.push(Math.round(x));
    for (let y = zy; y >= 0; y -= stepPx) horizontals.push(Math.round(y));
    for (let y = zy + stepPx; y <= cfg.mapHeight; y += stepPx) horizontals.push(Math.round(y));

    return { verticals, horizontals, gridStepUnits };
  });

  readonly radialGrid = computed(() => {
    const cfg = this.mapConfig();
    if (cfg.coordinateSystem !== 'radial' || !cfg.zeroPoint || !cfg.measureRatio || !cfg.zeroMeridian) return null;

    const [zx, zy] = cfg.zeroPoint;
    const ppu = cfg.measureRatio[0] / cfg.measureRatio[1];
    const visibleWidthUnits = this.containerWidth() / (this.scale() * ppu);
    const rawStep = visibleWidthUnits / 10;
    const power = Math.round(Math.log10(rawStep));
    const gridStepUnits = Math.pow(10, power);

    const mapW = cfg.mapWidth ?? 1000;
    const mapH = cfg.mapHeight ?? 1000;
    const maxRadius = Math.hypot(mapW, mapH);
    const circles: { px: number; unit: number }[] = [];
    for (let n = 1; n * gridStepUnits * ppu <= maxRadius; n++) {
      circles.push({ px: Math.round(n * gridStepUnits * ppu), unit: n * gridStepUnits });
    }

    const [p1, p2] = cfg.zeroMeridian;
    const zeroAngle = Math.atan2(p2[1] - p1[1], p2[0] - p1[0]);
    const radialLines: { x2: number; y2: number; angle: number; deg: number }[] = [];
    for (let i = 0; i < 12; i++) {
      const angle = zeroAngle + (i * 2 * Math.PI) / 12;
      radialLines.push({ x2: zx + Math.cos(angle) * maxRadius, y2: zy + Math.sin(angle) * maxRadius, angle, deg: i * 30 });
    }

    const labelFontSize = Math.max(8, Math.min(20, Math.max(mapW, mapH) / 60));
    const margin = labelFontSize;

    // Distance labels on circles: along zero meridian, only if within SVG bounds
    const mDx = Math.cos(zeroAngle);
    const mDy = Math.sin(zeroAngle);
    const perpDx = -Math.sin(zeroAngle);
    const perpDy = Math.cos(zeroAngle);
    const offset = labelFontSize * 0.9;
    const circleDistLabels = circles.map(({ px, unit }) => {
      const x = zx + px * mDx + perpDx * offset;
      const y = zy + px * mDy + perpDy * offset;
      if (x < margin || x > mapW - margin || y < margin || y > mapH - margin) return null;
      return { x, y, value: this.formatUnit(unit) };
    }).filter((l): l is { x: number; y: number; value: string } => l !== null);

    // Angle labels in ruler panels (screen coords)
    const s = this.scale();
    const tx = this.translateX();
    const ty = this.translateY();
    const sx = zx * s + tx;
    const sy = zy * s + ty;
    const topEdgeY = INSTRUMENT_PANEL_HEIGHT + RULER_TOP_HEIGHT;
    const leftEdgeX = RULER_LEFT_WIDTH;
    const cw = this.containerWidth();
    const ch = window.innerHeight;

    const topRulerLabels = radialLines.map(({ angle, deg }) => {
      const sinA = Math.sin(angle);
      if (Math.abs(sinA) < 1e-6) return null;
      const t = (topEdgeY - sy) / (sinA * s);
      if (t <= 0) return null;
      const screenX = sx + t * Math.cos(angle) * s;
      if (screenX < leftEdgeX || screenX > cw) return null;
      return { screenX, value: `${deg}°` };
    }).filter((l): l is { screenX: number; value: string } => l !== null);

    const leftRulerLabels = radialLines.map(({ angle, deg }) => {
      const cosA = Math.cos(angle);
      if (Math.abs(cosA) < 1e-6) return null;
      const t = (leftEdgeX - sx) / (cosA * s);
      if (t <= 0) return null;
      const screenY = sy + t * Math.sin(angle) * s;
      if (screenY < topEdgeY || screenY > ch) return null;
      return { screenY, value: `${deg}°` };
    }).filter((l): l is { screenY: number; value: string } => l !== null);

    return { zx, zy, circles, radialLines, circleDistLabels, topRulerLabels, leftRulerLabels, labelFontSize };
  });

  readonly gridLabels = computed(() => {
    const cfg = this.mapConfig();
    if (!cfg.zeroPoint || !cfg.measureRatio || cfg.coordinateSystem === 'radial') return { xLabels: [] as { screenX: number; value: string }[], yLabels: [] as { screenY: number; value: string }[] };
    const { verticals, horizontals, gridStepUnits } = this.gridLines();
    const tx = this.translateX();
    const ty = this.translateY();
    const s = this.scale();
    const [zx, zy] = cfg.zeroPoint;
    const ppu = this.pixelsPerUnit();
    const snap = (raw: number) => Math.round(raw / gridStepUnits) * gridStepUnits;

    const xLabels = verticals
      .map(x => {
        const screenX = x * s + tx;
        const raw = snap((x - zx) / ppu);
        return { screenX, value: this.formatUnit(cfg.horizontalDirection === 'left' ? -raw : raw) };
      })
      .filter(l => l.screenX >= RULER_LEFT_WIDTH && l.screenX <= this.containerWidth());

    const yLabels = horizontals
      .map(y => {
        const screenY = y * s + ty;
        const raw = snap((y - zy) / ppu);
        return { screenY, value: this.formatUnit(cfg.verticalDirection === 'top' ? -raw : raw) };
      })
      .filter(l => l.screenY >= INSTRUMENT_PANEL_HEIGHT + RULER_TOP_HEIGHT && l.screenY <= window.innerHeight);

    return { xLabels, yLabels };
  });

  private formatUnit(value: number): string {
    const rounded = Math.round(value * 10) / 10;
    return rounded % 1 === 0 ? String(rounded) : rounded.toFixed(1);
  }

  // ── Lifecycle ──

  ngOnInit(): void {
    const idStr = this.activatedRoute.snapshot.paramMap.get('id');
    if (!idStr) return;
    const id = Number(idStr);
    if (isNaN(id)) return;
    this.mapId = id;
    this.mapService.getMap(id).subscribe({
      next: (map) => {
        this.rawConfigText = JSON.stringify(map.config, null, 2);
        this.applyRawConfig();
      },
      error: (err) => console.error('Failed to load map', err),
    });
  }

  saveConfig(): void {
    this.saveState.set('saving');
    if (this.mapId === null) {
      this.mapService.createMap({ title: 'New Map', config: this.mapConfig(), is_public: false }).subscribe({
        next: (map) => {
          this.mapId = map.id;
          this.saveState.set('saved');
          setTimeout(() => this.saveState.set('idle'), 2000);
          this.router.navigate(['/interactive-map-editor', map.id], { replaceUrl: true });
        },
        error: () => this.saveState.set('error'),
      });
    } else {
      this.mapService.updateMap(this.mapId, { config: this.mapConfig() }).subscribe({
        next: () => {
          this.saveState.set('saved');
          setTimeout(() => this.saveState.set('idle'), 2000);
        },
        error: () => this.saveState.set('error'),
      });
    }
  }

  ngAfterViewInit(): void {
    this.ngZone.runOutsideAngular(() => {
      this.containerRef().nativeElement.addEventListener('wheel', (e: WheelEvent) => this.onWheel(e), { passive: false });
    });
  }

  @HostListener('window:resize')
  onResize(): void {
    this.containerWidth.set(window.innerWidth);
  }

  // ── Mouse events ──

  onMouseDown(event: MouseEvent): void {
    if (!this.mapConfig().mapUrl) return;
    this.isDragging = true;
    this.hasDragged = false;
    this.clickStartX = event.clientX;
    this.clickStartY = event.clientY;
    this.lastMouseX = event.clientX;
    this.lastMouseY = event.clientY;
    event.preventDefault();
  }

  onMouseMove(event: MouseEvent): void {
    if (!this.isDragging) return;
    const dx = event.clientX - this.clickStartX;
    const dy = event.clientY - this.clickStartY;
    if (!this.hasDragged && dx * dx + dy * dy > 25) this.hasDragged = true;
    if (this.hasDragged) {
      this.translateX.update(x => x + event.clientX - this.lastMouseX);
      this.translateY.update(y => y + event.clientY - this.lastMouseY);
      this.lastMouseX = event.clientX;
      this.lastMouseY = event.clientY;
    }
  }

  onMouseUp(event: MouseEvent): void {
    if (this.isDragging && !this.hasDragged) this.onMapClick(event);
    this.isDragging = false;
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

  stopPropagation(event: MouseEvent): void {
    event.stopPropagation();
  }

  private onMapClick(event: MouseEvent): void {
    this.markTooltip.set(null);

    const rect = this.containerRef().nativeElement.getBoundingClientRect();
    const mapX = Math.round((event.clientX - rect.left - this.translateX()) / this.scale());
    const mapY = Math.round((event.clientY - rect.top - this.translateY()) / this.scale());

    if (this.settingZeroPoint()) {
      this.mapConfig.update(cfg => ({ ...cfg, zeroPoint: [mapX, mapY] }));
      return;
    }

    if (this.settingDistanceRef()) {
      this.distanceRefPoints.update(pts => pts.length < 2 ? [...pts, { x: mapX, y: mapY }] : [{ x: mapX, y: mapY }]);
      if (this.distanceRefPoints().length === 2) {
        this.settingDistanceRef.set(false);
        this.distanceInput = '';
        this.setupOpen.set(true);
        this.activeSetupSection.set('distance');
      }
      return;
    }

    if (this.settingZeroMeridian()) {
      this.zeroMeridianPoints.update(pts => [...pts, { x: mapX, y: mapY }]);
      if (this.zeroMeridianPoints().length === 2) {
        const [p1, p2] = this.zeroMeridianPoints();
        this.mapConfig.update(cfg => ({ ...cfg, zeroMeridian: [[p1.x, p1.y], [p2.x, p2.y]] as [[number, number], [number, number]] }));
        this.zeroMeridianPoints.set([]);
      }
      return;
    }

    if (this.settingRefPoint()) {
      this.refPointX = String(mapX);
      this.refPointY = String(mapY);
      this.settingRefPoint.set(false);
      this.setupOpen.set(true);
      this.activeSetupSection.set('radial');
      return;
    }

    if (this.addingMark()) {
      const id = this.nextMarkId();
      this.mapConfig.update(cfg => ({
        ...cfg,
        marks: [...(cfg.marks ?? []), { id, type: '', title: '', x: mapX, y: mapY }]
      }));
      return;
    }
  }

  onMarkClick(event: MouseEvent, mark: MapMark): void {
    // onMapClick runs first (via mouseup) and clears any tooltip;
    // this handler then sets the tooltip for the clicked mark.
    if (this.addingMark()) return;
    this.markTooltip.set({ screenX: event.clientX, screenY: event.clientY, mark });
  }

  getMarkTypeForKey(key: string): MapMarkType | null {
    return this.mapConfig().markTypes?.[key] ?? null;
  }

  private nextMarkId(): number {
    const ids = (this.mapConfig().marks ?? []).map(m => m.id).filter(id => id != null);
    return ids.length === 0 ? 1 : Math.max(...ids) + 1;
  }

  // ── Setup panel ──

  toggleSetup(): void {
    this.setupOpen.update(v => !v);
    if (this.setupOpen()) { this.marksOpen.set(false); this.closeAllModes(); }
    if (!this.setupOpen()) this.activeSetupSection.set(null);
  }

  toggleSection(section: 'image' | 'metadata' | 'distance' | 'radial'): void {
    if (section === 'radial' && this.activeSetupSection() !== 'radial') {
      const rp = this.mapConfig().referencePoint;
      if (rp) {
        this.refPointX = String(rp.px[0]);
        this.refPointY = String(rp.px[1]);
        this.refPointLat = String(rp.lat);
      }
    }
    this.activeSetupSection.update(s => s === section ? null : section);
  }

  loadImage(): void {
    this.imageLoadError = false;
    const url = this.imageUrlInput.trim();
    if (!url) return;
    const img = new Image();
    img.onload = () => {
      this.mapConfig.update(cfg => ({ ...cfg, mapUrl: url, mapWidth: img.naturalWidth, mapHeight: img.naturalHeight }));
      this.fitImageToScreen(img.naturalWidth, img.naturalHeight);
      this.activeSetupSection.set(null);
    };
    img.onerror = () => { this.imageLoadError = true; };
    img.src = url;
  }

  private fitImageToScreen(imgWidth: number, imgHeight: number): void {
    const availableWidth = window.innerWidth - RULER_LEFT_WIDTH;
    const availableHeight = window.innerHeight - INSTRUMENT_PANEL_HEIGHT - RULER_TOP_HEIGHT;
    const s = Math.min(availableWidth / imgWidth, availableHeight / imgHeight);
    this.scale.set(s);
    this.translateX.set(RULER_LEFT_WIDTH + (availableWidth - imgWidth * s) / 2);
    this.translateY.set(INSTRUMENT_PANEL_HEIGHT + RULER_TOP_HEIGHT + (availableHeight - imgHeight * s) / 2);
  }

  applyMetadata(): void {
    this.mapConfig.update(cfg => {
      const next: MapConfig = { ...cfg };
      if (this.metaHorizontalDirection) next.horizontalDirection = this.metaHorizontalDirection;
      if (this.metaVerticalDirection) next.verticalDirection = this.metaVerticalDirection;
      if (this.metaMeasureUnit.trim()) next.measureUnit = this.metaMeasureUnit.trim();
      const zx = parseFloat(this.metaZeroPointX);
      const zy = parseFloat(this.metaZeroPointY);
      if (!isNaN(zx) && !isNaN(zy)) next.zeroPoint = [zx, zy];
      const rp = parseFloat(this.metaMeasureRatioPixels);
      const ru = parseFloat(this.metaMeasureRatioUnits);
      if (!isNaN(rp) && !isNaN(ru)) next.measureRatio = [rp, ru];
      if (this.metaCoordinateSystem) next.coordinateSystem = this.metaCoordinateSystem;
      return next;
    });
    this.activeSetupSection.set(null);
  }

  toggleSetZeroPoint(): void {
    const activating = !this.settingZeroPoint();
    if (activating) this.closeAllModes();
    this.settingZeroPoint.set(activating);
    if (activating) { this.setupOpen.set(false); this.marksOpen.set(false); }
  }

  toggleDistanceRef(): void {
    const activating = !this.settingDistanceRef();
    if (activating) this.closeAllModes();
    this.settingDistanceRef.set(activating);
    if (activating) {
      this.distanceRefPoints.set([]);
      this.distanceInput = '';
      this.setupOpen.set(false);
      this.marksOpen.set(false);
    }
  }

  toggleZeroMeridian(): void {
    const activating = !this.settingZeroMeridian();
    if (activating) this.closeAllModes();
    this.settingZeroMeridian.set(activating);
    if (activating) {
      this.zeroMeridianPoints.set([]);
      this.setupOpen.set(false);
      this.marksOpen.set(false);
    }
  }

  toggleSetRefPoint(): void {
    const activating = !this.settingRefPoint();
    if (activating) this.closeAllModes();
    this.settingRefPoint.set(activating);
    if (activating) {
      this.setupOpen.set(false);
      this.marksOpen.set(false);
    }
  }

  applyRefPoint(): void {
    const x = parseFloat(this.refPointX);
    const y = parseFloat(this.refPointY);
    const lat = parseFloat(this.refPointLat);
    if (isNaN(x) || isNaN(y) || isNaN(lat)) return;
    this.mapConfig.update(cfg => ({ ...cfg, referencePoint: { px: [x, y] as [number, number], lat, lon: 0 } }));
    this.activeSetupSection.set(null);
  }

  clearRefPoint(): void {
    this.mapConfig.update(({ referencePoint: _, ...rest }) => rest);
    this.refPointX = '';
    this.refPointY = '';
    this.refPointLat = '';
  }

  clearZeroMeridian(): void {
    this.mapConfig.update(({ zeroMeridian: _, ...rest }) => rest);
  }

  applyDistanceRef(): void {
    const pts = this.distanceRefPoints();
    const dist = parseFloat(this.distanceInput);
    if (pts.length !== 2 || isNaN(dist) || dist <= 0) return;
    const pixelDist = Math.sqrt((pts[1].x - pts[0].x) ** 2 + (pts[1].y - pts[0].y) ** 2);
    this.mapConfig.update(cfg => ({ ...cfg, measureRatio: [pixelDist, dist] }));
    this.distanceRefPoints.set([]);
    this.activeSetupSection.set(null);
  }

  // ── Config panel ──

  toggleConfig(): void {
    this.configOpen.update(v => !v);
    if (this.configOpen()) { this.setupOpen.set(false); this.marksOpen.set(false); this.closeAllModes(); }
  }

  openRawConfigModal(): void {
    this.rawConfigText = JSON.stringify(this.mapConfig(), null, 2);
    this.rawConfigError = '';
    this.rawConfigModalOpen.set(true);
    this.configOpen.set(false);
  }

  closeRawConfigModal(): void {
    this.rawConfigModalOpen.set(false);
    this.rawConfigError = '';
  }

  applyRawConfig(): void {
    try {
      const parsed = JSON.parse(this.rawConfigText) as MapConfig;
      let nextId = Math.max(0, ...(parsed.marks ?? []).filter(m => m.id != null).map(m => m.id)) + 1;
      parsed.marks = (parsed.marks ?? []).map(m => m.id != null ? m : { ...m, id: nextId++ });
      this.mapConfig.set(parsed);
      if (parsed.mapWidth && parsed.mapHeight) {
        this.fitImageToScreen(parsed.mapWidth, parsed.mapHeight);
      }
      this.closeRawConfigModal();
    } catch {
      this.rawConfigError = 'Invalid JSON — please fix the syntax and try again.';
    }
  }

  // ── Marks panel ──

  toggleMarks(): void {
    this.marksOpen.update(v => !v);
    if (this.marksOpen()) { this.setupOpen.set(false); this.closeAllModes(); }
    if (!this.marksOpen()) this.activeMarksSection.set(null);
  }

  toggleMarksSection(section: 'legend'): void {
    this.activeMarksSection.update(s => s === section ? null : section);
  }

  toggleAddMark(): void {
    const activating = !this.addingMark();
    this.closeAllModes();
    this.addingMark.set(activating);
    if (activating) { this.setupOpen.set(false); this.marksOpen.set(false); }
  }

  openMarksModal(): void {
    this.marksOpen.set(false);
    this.marksModalOpen.set(true);
    this.editingMark.set(null);
  }

  closeMarksModal(): void {
    this.marksModalOpen.set(false);
    this.editingMark.set(null);
  }

  openMarkDetail(mark: MapMark): void {
    this.editingMark.set(mark);
    this.editMarkType = mark.type;
    this.editMarkTitle = mark.title;
    this.editMarkDescription = mark.description ?? '';
  }

  backToMarksList(): void {
    this.editingMark.set(null);
  }

  saveMarkDetail(): void {
    const mark = this.editingMark();
    if (!mark) return;
    this.mapConfig.update(cfg => ({
      ...cfg,
      marks: (cfg.marks ?? []).map(m => m.id === mark.id
        ? { ...m, type: this.editMarkType, title: this.editMarkTitle.trim(), description: this.editMarkDescription.trim() || undefined }
        : m
      )
    }));
    this.editingMark.set(null);
  }

  deleteMark(id: number): void {
    this.mapConfig.update(cfg => ({ ...cfg, marks: (cfg.marks ?? []).filter(m => m.id !== id) }));
    if (this.editingMark()?.id === id) this.editingMark.set(null);
  }

  addMarkType(): void {
    if (!this.newMarkLegend.trim()) return;
    const key = Math.random().toString(36).slice(2, 8);
    this.mapConfig.update(cfg => ({
      ...cfg,
      markTypes: { ...(cfg.markTypes ?? {}), [key]: { color: this.newMarkColor, shape: this.newMarkShape, legend: this.newMarkLegend.trim() } }
    }));
    this.newMarkLegend = '';
    this.newMarkColor = '#e03c3c';
    this.newMarkShape = 'circle';
  }

  removeMarkType(key: string): void {
    this.mapConfig.update(cfg => {
      const { [key]: _removed, ...rest } = cfg.markTypes ?? {};
      return { ...cfg, markTypes: rest };
    });
  }

  private closeAllModes(): void {
    this.settingZeroPoint.set(false);
    this.settingDistanceRef.set(false);
    this.settingZeroMeridian.set(false);
    this.settingRefPoint.set(false);
    this.addingMark.set(false);
  }
}
