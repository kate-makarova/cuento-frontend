import { Component, ElementRef, HostListener, AfterViewInit, OnInit, computed, signal, viewChild } from '@angular/core';

const RULER_TOP_HEIGHT = 24;
const RULER_LEFT_WIDTH = 52;

@Component({
  selector: 'app-interactive-map',
  standalone: true,
  imports: [],
  templateUrl: './interactive-map.component.html',
  styleUrl: './interactive-map.component.css'
})
export class InteractiveMapComponent implements OnInit, AfterViewInit {
  public mapConfig = {
    mapWidth: 1514,
    mapHeight: 757,
    horizontalDirection: 'right',
    verticalDirection: 'bottom',
    zeroPoint: [0, 0],
    measureUnit: 'km',
    measureRatio: [20, 1],
    mapUrl: 'https://upforme.ru/uploads/001c/9f/bb/7/12637.jpg',
    markTypes: {
      maasKharet: {
        color: 'red'
      },
      harkonnenSettlement: {
        color: 'blue'
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

  private isDragging = false;
  private lastMouseX = 0;
  private lastMouseY = 0;

  private hoverTimer: ReturnType<typeof setTimeout> | null = null;
  private hoverClientX = 0;
  private hoverClientY = 0;

  tooltip = signal<{ screenX: number; screenY: number; mapX: number; mapY: number; unitX: number; unitY: number } | null>(null);

  getMarkColor(type: string): string {
    return (this.mapConfig.markTypes as Record<string, { color: string }>)[type]?.color ?? 'white';
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

    const verticals: number[] = [];
    const horizontals: number[] = [];

    for (let x = 0; x <= this.mapConfig.mapWidth; x += stepPx) {
      verticals.push(Math.round(x));
    }
    for (let y = 0; y <= this.mapConfig.mapHeight; y += stepPx) {
      horizontals.push(Math.round(y));
    }

    return { verticals, horizontals, stepPx, gridStepKm };
  });

  ngOnInit(): void {
    const scaleX = window.innerWidth / this.mapConfig.mapWidth;
    const scaleY = window.innerHeight / this.mapConfig.mapHeight;
    const initialScale = Math.min(scaleX, scaleY);
    this.scale.set(initialScale);
    this.translateX.set((window.innerWidth - this.mapConfig.mapWidth * initialScale) / 2);
    this.translateY.set((window.innerHeight - this.mapConfig.mapHeight * initialScale) / 2);
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
    this.lastMouseX = event.clientX;
    this.lastMouseY = event.clientY;
    event.preventDefault();
  }

  onMouseMove(event: MouseEvent): void {
    if (this.isDragging) {
      this.translateX.update((x: number) => x + event.clientX - this.lastMouseX);
      this.translateY.update((y: number) => y + event.clientY - this.lastMouseY);
      this.lastMouseX = event.clientX;
      this.lastMouseY = event.clientY;
      return;
    }
    this.clearHoverTimer();
    this.hoverClientX = event.clientX;
    this.hoverClientY = event.clientY;
    this.hoverTimer = setTimeout(() => this.showTooltip(), 2000);
  }

  onMouseUp(): void {
    this.isDragging = false;
    this.clearHoverTimer();
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
    const mapX = Math.round((containerX - this.translateX()) / this.scale());
    const mapY = Math.round((containerY - this.translateY()) / this.scale());
    const unitX = Math.round((mapX / this.pixelsPerKm) * 10) / 10;
    const unitY = Math.round((mapY / this.pixelsPerKm) * 10) / 10;
    this.tooltip.set({ screenX: this.hoverClientX, screenY: this.hoverClientY, mapX, mapY, unitX, unitY });
  }
}
