export interface MapMarkType {
  color: string;
  shape: string;
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
  coordinateSystem?: 'cartesian' | 'radial';
  zeroMeridian?: [[number, number], [number, number]];
  referencePoint?: { px: [number, number]; lat: number; lon: number };
  markTypes?: Record<string, MapMarkType>;
  marks?: MapMark[];
}

export interface InteractiveMap {
  id: number;
  title: string;
  config: MapConfig;
  is_public: boolean;
  creator_id: number;
  can_edit: boolean;
}
