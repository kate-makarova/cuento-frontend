import { Component, ElementRef, HostListener, OnInit, computed, effect, signal, viewChild, inject, Signal } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';

const RULER_TOP_HEIGHT = 24;
const RULER_LEFT_WIDTH = 52;

interface CoordConfig {
  zeroPoint: number[];
  zeroMeridian: number[][];
  referencePoint?: { px: number[]; lat: number; lon: number };
  measureRatio: number[];
  coordinateSystem: string;
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

      const [p1, p2] = this.config.zeroMeridian;
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
    const [p1, p2] = this.config.zeroMeridian;
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

  public mapConfig = {
    mapWidth: 3206,
    mapHeight: 1603,
    coordinateSystem: 'radial',
    zeroMeridian: [[1607, 995], [1607, 0]],
    zeroPoint: [1607, 995],
    referencePoint: { px: [1607, 112], lat: 60, lon: 0 },
    measureUnit: 'km',
    measureRatio: [190, 200],
    mapUrl: 'https://upforme.ru/uploads/001c/9f/bb/7/12637.jpg',
    markTypes: {
      testingStation: {
        color: 'green',
        shape: 'triangle',
        legend: 'Botanical testing station'
      },
      sietch: {
        color: 'blue',
        shape: 'star',
        legend: 'Sietch'
      },
      pyon: {
        color: 'yellow',
        shape: 'circle',
        legend: 'Pyon village'
      }
    },
    marks: [
      {
        "type": "",
        "title": "Mt. Idaho",
        "x": 1260,
        "y": 516
      },
      {
        "type": "",
        "title": "North Pole",
        "x": 1607,
        "y": 995
      },
      {
        "type": "",
        "title": "Polar Sink",
        "x": 1609,
        "y": 938
      },
      {
        "type": "",
        "title": "Cave of Birds",
        "x": 764,
        "y": 1491
      },
      {
        "type": "",
        "title": "Hagga Basin",
        "x": 1538,
        "y": 509
      },
      {
        "type": "",
        "title": "Cielago Depression",
        "x": 1615,
        "y": 1506
      },
      {
        "type": "",
        "title": "Imperial Basin",
        "x": 1892,
        "y": 531
      },
      // Sietches
      { x: 1462, y: 72,   type: 'sietch', title: '' },
      { x: 1217, y: 96,   type: 'sietch', title: '' },
      { x: 1059, y: 125,  type: 'sietch', title: '' },
      { x: 1154, y: 133,  type: 'sietch', title: '' },
      { x: 2581, y: 156,  type: 'sietch', title: '' },
      { x: 2412, y: 218,  type: 'sietch', title: '' },
      { x: 2568, y: 281,  type: 'sietch', title: '' },
      { x: 2543, y: 352,  type: 'sietch', title: '' },
      { x: 1107, y: 390,  type: 'sietch', title: 'Sietch Tabr' },
      { x: 2508, y: 431,  type: 'sietch', title: '' },
      { x: 969,  y: 577,  type: 'sietch', title: '' },
      { x: 2328, y: 603,  type: 'sietch', title: '' },
      { x: 987,  y: 613,  type: 'sietch', title: '' },
      { x: 2337, y: 638,  type: 'sietch', title: '' },
      { x: 2348, y: 662,  type: 'sietch', title: '' },
      { x: 2335, y: 691,  type: 'sietch', title: '' },
      { x: 2355, y: 721,  type: 'sietch', title: '' },
      { x: 1887, y: 788,  type: 'sietch', title: '' },
      { x: 2626, y: 790,  type: 'sietch', title: '' },
      { x: 2349, y: 880,  type: 'sietch', title: '' },
      { x: 2259, y: 884,  type: 'sietch', title: '' },
      { x: 2521, y: 898,  type: 'sietch', title: '' },
      { x: 2567, y: 901,  type: 'sietch', title: '' },
      { x: 1343, y: 938,  type: 'sietch', title: '' },
      { x: 1320, y: 970,  type: 'sietch', title: '' },
      { x: 2201, y: 972,  type: 'sietch', title: '' },
      { x: 2365, y: 1037, type: 'sietch', title: '' },
      { x: 2288, y: 1040, type: 'sietch', title: '' },
      { x: 2423, y: 1044, type: 'sietch', title: '' },
      { x: 2541, y: 1050, type: 'sietch', title: '' },
      { x: 1233, y: 1059, type: 'sietch', title: '' },
      { x: 2398, y: 1083, type: 'sietch', title: '' },
      { x: 2433, y: 1105, type: 'sietch', title: '' },
      { x: 1122, y: 1120, type: 'sietch', title: '' },
      { x: 1118, y: 1162, type: 'sietch', title: '' },
      { x: 1167, y: 1178, type: 'sietch', title: '' },
      { x: 2250, y: 1283, type: 'sietch', title: '' },
      { x: 1956, y: 1298, type: 'sietch', title: '' },
      { x: 2366, y: 1346, type: 'sietch', title: 'Tuek\'s Sietch' },
      { x: 1083, y: 1367, type: 'sietch', title: '' },
      { x: 1830, y: 1440, type: 'sietch', title: '' },
      { x: 2134, y: 1463, type: 'sietch', title: '' },
      { x: 2184, y: 1464, type: 'sietch', title: '' },
      { x: 2390, y: 1465, type: 'sietch', title: '' },
      { x: 2009, y: 1492, type: 'sietch', title: '' },
      { x: 1253, y: 1531, type: 'sietch', title: '' },
      { x: 1166, y: 1535, type: 'sietch', title: '' },
      // Pyon villages
      { x: 1820, y: 128,  type: 'pyon', title: '' },
      { x: 1847, y: 132,  type: 'pyon', title: '' },
      { x: 1804, y: 149,  type: 'pyon', title: '' },
      { x: 1525, y: 261,  type: 'pyon', title: '' },
      { x: 1523, y: 284,  type: 'pyon', title: '' },
      { x: 1509, y: 308,  type: 'pyon', title: '' },
      { x: 1507, y: 331,  type: 'pyon', title: '' },
      { x: 1535, y: 337,  type: 'pyon', title: '' },
      { x: 1932, y: 337,  type: 'pyon', title: '' },
      { x: 1537, y: 359,  type: 'pyon', title: '' },
      { x: 1883, y: 359,  type: 'pyon', title: '' },
      { x: 1863, y: 371,  type: 'pyon', title: '' },
      { x: 1782, y: 375,  type: 'pyon', title: '' },
      { x: 1835, y: 375,  type: 'pyon', title: '' },
      { x: 1811, y: 376,  type: 'pyon', title: '' },
      { x: 1507, y: 378,  type: 'pyon', title: '' },
      { x: 1682, y: 381,  type: 'pyon', title: '' },
      { x: 1539, y: 382,  type: 'pyon', title: '' },
      { x: 1650, y: 384,  type: 'pyon', title: '' },
      { x: 1468, y: 394,  type: 'pyon', title: '' },
      { x: 1623, y: 400,  type: 'pyon', title: '' },
      { x: 1558, y: 403,  type: 'pyon', title: '' },
      { x: 1601, y: 411,  type: 'pyon', title: '' },
      { x: 1578, y: 422,  type: 'pyon', title: '' },
      { x: 1905, y: 438,  type: 'pyon', title: '' },
      { x: 1809, y: 441,  type: 'pyon', title: '' },
      { x: 1834, y: 453,  type: 'pyon', title: '' },
      { x: 1579, y: 458,  type: 'pyon', title: '' },
      { x: 1884, y: 461,  type: 'pyon', title: '' },
      { x: 1852, y: 466,  type: 'pyon', title: '' },
      { x: 1575, y: 483,  type: 'pyon', title: '' },
      { x: 1573, y: 518,  type: 'pyon', title: '' },
      { x: 1524, y: 535,  type: 'pyon', title: '' },
      { x: 1501, y: 543,  type: 'pyon', title: '' },
      { x: 1560, y: 555,  type: 'pyon', title: '' },
      { x: 1435, y: 579,  type: 'pyon', title: '' },
      { x: 1472, y: 600,  type: 'pyon', title: '' },
      { x: 1450, y: 623,  type: 'pyon', title: '' },
      // Testing stations
      { x: 1710, y: 237,  type: 'testingStation', title: '' },
      { x: 2385, y: 242,  type: 'testingStation', title: '' },
      { x: 1850, y: 294,  type: 'testingStation', title: '' },
      { x: 1176, y: 319,  type: 'testingStation', title: 'Cave of Ridges' },
      { x: 1148, y: 360,  type: 'testingStation', title: 'Tuono Basin' },
      { x: 1709, y: 372,  type: 'testingStation', title: '' },
      { x: 2527, y: 375,  type: 'testingStation', title: '' },
      { x: 1771, y: 417,  type: 'testingStation', title: '' },
      { x: 1740, y: 424,  type: 'testingStation', title: '' },
      { x: 1701, y: 430,  type: 'testingStation', title: '' },
      { x: 1725, y: 527,  type: 'testingStation', title: '' },
      { x: 1039, y: 528,  type: 'testingStation', title: 'Bight of the Cliff' },
      { x: 2656, y: 785,  type: 'testingStation', title: '' },
      { x: 2234, y: 899,  type: 'testingStation', title: '' },
      { x: 1997, y: 1047, type: 'testingStation', title: '' },
      { x: 2236, y: 1179, type: 'testingStation', title: '' },
      { x: 2239, y: 1197, type: 'testingStation', title: '' },
      { x: 2228, y: 1213, type: 'testingStation', title: '' },
      { x: 2226, y: 1233, type: 'testingStation', title: '' },
      { x: 2220, y: 1257, type: 'testingStation', title: '' },
      { x: 1992, y: 1298, type: 'testingStation', title: '' },
      { x: 735,  y: 1488, type: 'testingStation', title: '' },
      { x: 1171, y: 1500, type: 'testingStation', title: '' },
    ]
  };

  containerRef = viewChild<ElementRef<HTMLDivElement>>('container');

  readonly rulerTopHeight = RULER_TOP_HEIGHT;
  readonly rulerLeftWidth = RULER_LEFT_WIDTH;

  scale = signal(1);
  private translateX = signal(0);
  private translateY = signal(0);
  private containerWidth = signal(window.innerWidth);

  readonly coords = new CartesianCoordinates(this.mapConfig, this.scale, this.translateX, this.translateY, this.containerWidth);
  readonly radialCoords = new RadialCoordinates(this.mapConfig, this.scale, this.translateX, this.translateY, this.containerWidth);

  get gridLines() { return this.coords.gridLines; }
  get gridLabels() { return this.coords.gridLabels; }

  readonly radialGrid = computed(() => {
    if (this.mapConfig.coordinateSystem !== 'radial') return null;
    const { circles, radials } = this.radialCoords.gridLines();
    const [zx, zy] = this.mapConfig.zeroPoint;
    const maxR = Math.hypot(this.mapConfig.mapWidth, this.mapConfig.mapHeight);
    const radialLines = radials.map(r => ({
      label: r.label,
      x1: zx, y1: zy,
      x2: zx + Math.cos(r.angle) * maxR,
      y2: zy + Math.sin(r.angle) * maxR,
    }));

    let refCircle: { px: number; label: string; labelX: number; labelY: number } | null = null;
    if (this.mapConfig.referencePoint) {
      const { px: refPx, lat: refLat } = this.mapConfig.referencePoint;
      const radiusPx = Math.hypot(refPx[0] - zx, refPx[1] - zy);
      const [p1, p2] = this.mapConfig.zeroMeridian;
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

  readonly allPathData = computed(() =>
    this.paths().map(pts => {
      const segments = pts.slice(0, -1).map((a, i) => {
        const b = pts[i + 1];
        const distKm = this.coords.distanceInUnits(b.x - a.x, b.y - a.y);
        return { a, b, distLabel: this.coords.formatUnit(distKm), mx: (a.x + b.x) / 2, my: (a.y + b.y) / 2 };
      });
      const totalKm = segments.reduce((sum, s) => sum + this.coords.distanceInUnits(s.b.x - s.a.x, s.b.y - s.a.y), 0);
      return { pts, segments, totalLabel: this.coords.formatUnit(totalKm) };
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

  tooltip = signal<{ screenX: number; screenY: number; text: string; mapX: number; mapY: number } | null>(null);
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

  readonly transform = computed(() =>
    `translate(${this.translateX()}px, ${this.translateY()}px) scale(${this.scale()})`
  );

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
    const rect = this.containerRef()!.nativeElement.getBoundingClientRect();
    const containerX = this.hoverClientX - rect.left;
    const containerY = this.hoverClientY - rect.top;
    const mapX = Math.round((containerX - this.translateX()) / this.scale());
    const mapY = Math.round((containerY - this.translateY()) / this.scale());
    let text: string;
    if (this.mapConfig.coordinateSystem === 'radial') {
      const { lat, lon } = this.radialCoords.pixelToLatLon(mapX, mapY);
      const latStr = lat >= 0 ? `${lat}°N` : `${-lat}°S`;
      const lonStr = lon >= 0 ? `${lon}°E` : `${-lon}°W`;
      text = `${latStr}, ${lonStr}`;
    } else {
      const { x, y } = this.coords.pixelToUnit(mapX, mapY);
      text = `${x} × ${y} ${this.mapConfig.measureUnit}`;
    }
    this.tooltip.set({ screenX: this.hoverClientX, screenY: this.hoverClientY, text, mapX, mapY });
  }
}
