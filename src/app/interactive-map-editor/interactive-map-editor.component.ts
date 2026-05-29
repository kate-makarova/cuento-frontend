import { Component, signal, computed, viewChild, ElementRef, AfterViewInit, HostListener, NgZone, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DecimalPipe } from '@angular/common';

const INSTRUMENT_PANEL_HEIGHT = 44;
const RULER_TOP_HEIGHT = 24;
const RULER_LEFT_WIDTH = 52;

export interface MapMarkType {
  color: string;
  shape: 'circle' | 'square' | 'triangle' | 'diamond' | 'star' | 'pentagon' | 'hexagon' | 'cross';
  legend: string;
}

export interface MapMark {
  id: number;
  type: string;
  title: string;
  description?: string;
  x: number;
  y: number;
}

export interface MapConfig {
  mapUrl?: string;
  mapWidth?: number;
  mapHeight?: number;
  horizontalDirection?: 'left' | 'right';
  verticalDirection?: 'top' | 'bottom';
  zeroPoint?: [number, number];
  measureUnit?: string;
  measureRatio?: [number, number];
  markTypes?: Record<string, MapMarkType>;
  marks?: MapMark[];
}

@Component({
  selector: 'app-interactive-map-editor',
  standalone: true,
  imports: [FormsModule, DecimalPipe],
  templateUrl: './interactive-map-editor.component.html',
  styleUrl: './interactive-map-editor.component.css'
})
export class InteractiveMapEditorComponent implements AfterViewInit {
  private ngZone = inject(NgZone);

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
  activeSetupSection = signal<'image' | 'metadata' | 'distance' | null>(null);

  imageUrlInput = '';
  imageLoadError = false;

  metaHorizontalDirection: '' | 'left' | 'right' = '';
  metaVerticalDirection: '' | 'top' | 'bottom' = '';
  metaMeasureUnit = '';
  metaZeroPointX = '';
  metaZeroPointY = '';
  metaMeasureRatioPixels = '';
  metaMeasureRatioUnits = '';

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
  addingMark = signal(false);

  distanceRefPoints = signal<{ x: number; y: number }[]>([]);
  distanceInput = '';

  // ── Pan / zoom ──
  private scale = signal(1);
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
    !!this.mapConfig().zeroPoint && !!this.mapConfig().measureRatio
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

  readonly gridLabels = computed(() => {
    const cfg = this.mapConfig();
    if (!cfg.zeroPoint || !cfg.measureRatio) return { xLabels: [] as { screenX: number; value: string }[], yLabels: [] as { screenY: number; value: string }[] };
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
      this.settingZeroPoint.set(false);
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
    const marks = this.mapConfig().marks ?? [];
    return marks.length === 0 ? 1 : Math.max(...marks.map(m => m.id)) + 1;
  }

  // ── Setup panel ──

  toggleSetup(): void {
    this.setupOpen.update(v => !v);
    if (this.setupOpen()) { this.marksOpen.set(false); this.closeAllModes(); }
    if (!this.setupOpen()) this.activeSetupSection.set(null);
  }

  toggleSection(section: 'image' | 'metadata' | 'distance'): void {
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
    this.addingMark.set(false);
  }
}
