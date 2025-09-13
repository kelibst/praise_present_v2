import { Point, Size, Rectangle, Transform, Color, Gradient, Border } from './geometry';
import { RenderContext } from './rendering';

export interface ShapeProps {
  id?: string;
  position?: Point;
  size?: Size;
  rotation?: number;
  opacity?: number;
  zIndex?: number;
  visible?: boolean;
  transform?: Transform;
}

export interface ShapeStyle {
  fill?: Color | Gradient;
  stroke?: Border;
  opacity?: number;
  shadowColor?: Color;
  shadowBlur?: number;
  shadowOffsetX?: number;
  shadowOffsetY?: number;
}

export enum ShapeType {
  RECTANGLE = 'rectangle',
  TEXT = 'text',
  IMAGE = 'image',
  BACKGROUND = 'background',
  CIRCLE = 'circle',
  LINE = 'line',
  PATH = 'path'
}

export interface TextStyle {
  fontFamily?: string;
  fontSize?: number;
  fontWeight?: 'normal' | 'bold' | 'lighter' | 'bolder' | number;
  fontStyle?: 'normal' | 'italic' | 'oblique';
  textAlign?: 'left' | 'center' | 'right';
  verticalAlign?: 'top' | 'middle' | 'bottom' | 'baseline';
  lineHeight?: number;
  letterSpacing?: number;
  wordSpacing?: number;
  textDecoration?: 'none' | 'underline' | 'overline' | 'line-through';
  color?: Color;
}

export interface ImageStyle {
  objectFit?: 'fill' | 'contain' | 'cover' | 'scale-down' | 'none';
  objectPosition?: string;
  opacity?: number;
  filter?: string;
}

export interface RectangleStyle extends ShapeStyle {
  borderRadius?: number | [number, number, number, number];
}

export interface BackgroundStyle {
  type: 'color' | 'gradient' | 'image';
  color?: Color;
  gradient?: Gradient;
  imageUrl?: string;
  imageStyle?: ImageStyle;
}

export const defaultShapeProps: Required<ShapeProps> = {
  id: '',
  position: { x: 0, y: 0 },
  size: { width: 100, height: 100 },
  rotation: 0,
  opacity: 1,
  zIndex: 0,
  visible: true,
  transform: {
    x: 0,
    y: 0,
    rotation: 0,
    scaleX: 1,
    scaleY: 1
  }
};

export const defaultTextStyle: TextStyle = {
  fontFamily: 'Arial, sans-serif',
  fontSize: 16,
  fontWeight: 'normal',
  fontStyle: 'normal',
  textAlign: 'left',
  verticalAlign: 'top',
  lineHeight: 1.2,
  letterSpacing: 0,
  wordSpacing: 0,
  textDecoration: 'none',
  color: { r: 0, g: 0, b: 0, a: 1 }
};