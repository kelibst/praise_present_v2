export interface Point {
  x: number;
  y: number;
}

export interface Size {
  width: number;
  height: number;
}

export interface Rectangle {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Bounds extends Rectangle {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

export interface Transform {
  x: number;
  y: number;
  rotation: number;
  scaleX: number;
  scaleY: number;
}

export type Matrix = [number, number, number, number, number, number];

export interface Color {
  r: number;
  g: number;
  b: number;
  a?: number;
}

export interface Gradient {
  type: 'linear' | 'radial';
  stops: Array<{
    offset: number;
    color: Color;
  }>;
  angle?: number;
  centerX?: number;
  centerY?: number;
}

export interface Border {
  width: number;
  color: Color;
  style?: 'solid' | 'dashed' | 'dotted';
}

export const createPoint = (x: number = 0, y: number = 0): Point => ({ x, y });

export const createSize = (width: number = 0, height: number = 0): Size => ({ width, height });

export const createRectangle = (x: number = 0, y: number = 0, width: number = 0, height: number = 0): Rectangle => ({
  x, y, width, height
});

export const createBounds = (rect: Rectangle): Bounds => ({
  ...rect,
  left: rect.x,
  top: rect.y,
  right: rect.x + rect.width,
  bottom: rect.y + rect.height
});

export const createTransform = (): Transform => ({
  x: 0,
  y: 0,
  rotation: 0,
  scaleX: 1,
  scaleY: 1
});

export const createColor = (r: number, g: number, b: number, a: number = 1): Color => ({ r, g, b, a });

export const colorToString = (color: Color): string => {
  const { r, g, b, a = 1 } = color;
  if (a === 1) {
    return `rgb(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)})`;
  }
  return `rgba(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)}, ${a})`;
};