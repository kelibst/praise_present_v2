import { Rectangle, Matrix, Point } from './geometry';

export interface RenderContext {
  canvas: HTMLCanvasElement;
  context: CanvasRenderingContext2D | WebGL2RenderingContext;
  width: number;
  height: number;
  pixelRatio: number;
  transformation: Matrix;

  // Drawing state
  fillStyle?: string | CanvasGradient | CanvasPattern;
  strokeStyle?: string | CanvasGradient | CanvasPattern;
  lineWidth?: number;
  font?: string;
  textAlign?: CanvasTextAlign;
  textBaseline?: CanvasTextBaseline;
  globalAlpha?: number;
}

export interface RenderOptions {
  antialias?: boolean;
  hardwareAcceleration?: boolean;
  pixelRatio?: number;
  preserveDrawingBuffer?: boolean;
}

export interface PerformanceMetrics {
  frameTime: number;
  renderTime: number;
  shapeCount: number;
  memoryUsage: number;
  fps: number;
}

export type RenderMode = '2d' | 'webgl';

export interface RenderStats {
  totalShapes: number;
  visibleShapes: number;
  culledShapes: number;
  drawCalls: number;
  frameTime: number;
  lastFrameTimestamp: number;
}

export interface ViewportInfo {
  width: number;
  height: number;
  pixelRatio: number;
  visibleArea: Rectangle;
  scrollOffset: Point;
}

export enum RenderQuality {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  ULTRA = 'ultra'
}

export interface RenderSettings {
  quality: RenderQuality;
  targetFPS: number;
  enableCaching: boolean;
  enableGPUAcceleration: boolean;
  maxTextureSize: number;
  debugMode: boolean;
}

export const defaultRenderSettings: RenderSettings = {
  quality: RenderQuality.HIGH,
  targetFPS: 60,
  enableCaching: true,
  enableGPUAcceleration: true,
  maxTextureSize: 2048,
  debugMode: false
};