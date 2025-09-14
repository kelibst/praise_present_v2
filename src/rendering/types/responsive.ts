import { Point, Size, Rectangle } from './geometry';

/**
 * Flexible unit types for responsive design
 */
export type UnitType = 'px' | 'percent' | 'vw' | 'vh' | 'vmin' | 'vmax' | 'rem' | 'em';

/**
 * A value with its unit type
 */
export interface FlexibleValue {
  value: number;
  unit: UnitType;
  min?: number; // Minimum pixel value
  max?: number; // Maximum pixel value
}

/**
 * Position using flexible units
 */
export interface FlexiblePosition {
  x: FlexibleValue;
  y: FlexibleValue;
}

/**
 * Size using flexible units
 */
export interface FlexibleSize {
  width: FlexibleValue;
  height: FlexibleValue;
}

/**
 * Rectangle bounds using flexible units
 */
export interface FlexibleRectangle {
  x: FlexibleValue;
  y: FlexibleValue;
  width: FlexibleValue;
  height: FlexibleValue;
}

/**
 * Layout modes for content adaptation
 */
export enum LayoutMode {
  STRETCH = 'stretch',          // Fill entire container
  CENTER = 'center',            // Center within container
  FIT_CONTENT = 'fit-content',  // Size based on content
  FILL_CONTAINER = 'fill-container', // Fill available space
  ASPECT_FIT = 'aspect-fit',    // Fit while maintaining aspect ratio
  ASPECT_FILL = 'aspect-fill'   // Fill while maintaining aspect ratio
}

/**
 * Responsive layout configuration
 */
export interface ResponsiveLayoutConfig {
  mode: LayoutMode;
  padding?: FlexibleValue;
  margin?: FlexibleValue;
  minSize?: FlexibleSize;
  maxSize?: FlexibleSize;
  aspectRatio?: number; // width/height ratio
  breakpoints?: ResponsiveBreakpoint[];
}

/**
 * Breakpoint for responsive behavior
 */
export interface ResponsiveBreakpoint {
  name: string;
  minWidth?: number;
  maxWidth?: number;
  minHeight?: number;
  maxHeight?: number;
  config: Partial<ResponsiveLayoutConfig>;
}

/**
 * Container information for calculations
 */
export interface ContainerInfo {
  width: number;
  height: number;
  aspectRatio: number;
  pixelRatio: number;
  fontSize: number; // Base font size for rem/em calculations
}

/**
 * Typography scaling configuration
 */
export interface TypographyConfig {
  baseSize: FlexibleValue;
  scaleRatio: number; // Scale factor for different screen sizes
  minSize: number; // Minimum pixel size
  maxSize: number; // Maximum pixel size
  lineHeightRatio: number; // Line height as ratio of font size
}

/**
 * Responsive shape properties
 */
export interface ResponsiveShapeProps {
  position: FlexiblePosition;
  size: FlexibleSize;
  layoutConfig: ResponsiveLayoutConfig;
  typography?: TypographyConfig;
  responsive?: boolean; // Whether this shape should be responsive
}

/**
 * Utility type for creating flexible values
 */
export type FlexibleValueInput =
  | number // Treated as pixels
  | string // Parsed as "value + unit" (e.g., "50%", "10vw")
  | FlexibleValue; // Direct flexible value

/**
 * Helper functions for creating flexible values
 */
export const px = (value: number, min?: number, max?: number): FlexibleValue => ({
  value,
  unit: 'px',
  min,
  max
});

export const percent = (value: number, min?: number, max?: number): FlexibleValue => ({
  value,
  unit: 'percent',
  min,
  max
});

export const vw = (value: number, min?: number, max?: number): FlexibleValue => ({
  value,
  unit: 'vw',
  min,
  max
});

export const vh = (value: number, min?: number, max?: number): FlexibleValue => ({
  value,
  unit: 'vh',
  min,
  max
});

export const vmin = (value: number, min?: number, max?: number): FlexibleValue => ({
  value,
  unit: 'vmin',
  min,
  max
});

export const vmax = (value: number, min?: number, max?: number): FlexibleValue => ({
  value,
  unit: 'vmax',
  min,
  max
});

export const rem = (value: number, min?: number, max?: number): FlexibleValue => ({
  value,
  unit: 'rem',
  min,
  max
});

export const em = (value: number, min?: number, max?: number): FlexibleValue => ({
  value,
  unit: 'em',
  min,
  max
});

/**
 * Parse string value into FlexibleValue
 */
export function parseFlexibleValue(input: FlexibleValueInput): FlexibleValue {
  if (typeof input === 'number') {
    return px(input);
  }

  if (typeof input === 'object') {
    return input;
  }

  // Parse string format like "50%", "10vw", "2rem"
  const match = input.match(/^(-?\d*\.?\d+)(px|%|vw|vh|vmin|vmax|rem|em)?$/);

  if (!match) {
    console.warn(`Invalid flexible value format: ${input}, defaulting to 0px`);
    return px(0);
  }

  const value = parseFloat(match[1]);
  const unit = (match[2] || 'px') as UnitType;

  // Convert % to percent unit
  const normalizedUnit = unit === '%' ? 'percent' : unit;

  return {
    value,
    unit: normalizedUnit,
  };
}

/**
 * Create responsive position from various inputs
 */
export function createFlexiblePosition(
  x: FlexibleValueInput,
  y: FlexibleValueInput
): FlexiblePosition {
  return {
    x: parseFlexibleValue(x),
    y: parseFlexibleValue(y)
  };
}

/**
 * Create responsive size from various inputs
 */
export function createFlexibleSize(
  width: FlexibleValueInput,
  height: FlexibleValueInput
): FlexibleSize {
  return {
    width: parseFlexibleValue(width),
    height: parseFlexibleValue(height)
  };
}