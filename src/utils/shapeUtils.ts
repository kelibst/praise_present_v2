/**
 * Shape Utilities - Helper functions for shape manipulation and formatting
 *
 * This module provides optimized utilities for working with shapes in the
 * presentation editor, including color conversions, shape lookups, and
 * formatting operations.
 */

import { Shape } from '../rendering/core/Shape';
import { TextShape } from '../rendering/shapes/TextShape';
import { Color } from '../rendering/types/geometry';
import { TextStyle } from '../rendering/types/shapes';

/**
 * Type guard to check if a shape is a TextShape
 */
export function isTextShape(shape: Shape | null | undefined): shape is TextShape {
  return shape !== null && shape !== undefined && shape.type === 'text';
}

/**
 * Build a Map of shapes for O(1) lookup by ID
 * @param shapes Array of shapes from a slide
 * @returns Map with shape IDs as keys
 */
export function buildShapeMap(shapes: Shape[]): Map<string, Shape> {
  const map = new Map<string, Shape>();
  shapes.forEach(shape => {
    map.set(shape.id, shape);
  });
  return map;
}

/**
 * Build a Map of only TextShapes for O(1) lookup
 * @param shapes Array of shapes from a slide
 * @returns Map with TextShape IDs as keys
 */
export function buildTextShapeMap(shapes: Shape[]): Map<string, TextShape> {
  const map = new Map<string, TextShape>();
  shapes.forEach(shape => {
    if (isTextShape(shape)) {
      map.set(shape.id, shape as TextShape);
    }
  });
  return map;
}

/**
 * Convert RGB color object to hex string
 * @param color Color object with r, g, b values (0-255)
 * @returns Hex color string (e.g., "#FF5733")
 */
export function rgbToHex(color: Color): string {
  const { r, g, b } = color;
  return `#${[r, g, b]
    .map(x => Math.round(x).toString(16).padStart(2, '0'))
    .join('')}`;
}

/**
 * Convert hex string to RGB color object
 * @param hex Hex color string (e.g., "#FF5733" or "FF5733")
 * @returns Color object with r, g, b, a values
 */
export function hexToRgb(hex: string): Color {
  // Remove # if present
  const cleanHex = hex.replace('#', '');

  // Parse hex values
  const result = /^([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(cleanHex);

  if (!result) {
    console.warn('[shapeUtils] Invalid hex color:', hex);
    return { r: 255, g: 255, b: 255, a: 1.0 };
  }

  return {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16),
    a: 1.0
  };
}

/**
 * Normalize color value to hex string
 * Handles both Color objects and hex strings
 * @param color Color object or hex string
 * @returns Normalized hex string
 */
export function normalizeColor(color: Color | string | undefined): string {
  if (!color) return '#ffffff';
  if (typeof color === 'string') return color;
  return rgbToHex(color);
}

/**
 * Apply formatting updates to a TextShape (mutable operation)
 * This directly modifies the shape for performance during editing
 *
 * @param shape TextShape to update
 * @param updates Partial TextStyle with properties to update
 */
export function applyFormattingToShape(
  shape: TextShape,
  updates: Partial<TextStyle>
): void {
  // Apply style updates via Object.assign for performance
  Object.assign(shape.textStyle, updates);

  // Update maxFontSize if fontSize changed (for auto-shrink)
  if (updates.fontSize !== undefined) {
    shape.maxFontSize = updates.fontSize;
  }

  // Mark as custom formatting (no longer using defaults)
  shape.metadata = {
    ...shape.metadata,
    isDefaultFormatting: false
  };

  // Mark shape as dirty for selective rendering
  shape.markDirty();
}

/**
 * Extract formatting properties from a TextShape
 * @param shape TextShape to extract from
 * @returns Partial TextStyle object with current formatting
 */
export function extractFormatting(shape: TextShape): Partial<TextStyle> {
  const style = shape.textStyle;

  return {
    fontSize: style.fontSize,
    fontFamily: style.fontFamily,
    fontWeight: style.fontWeight,
    fontStyle: style.fontStyle,
    textDecoration: style.textDecoration,
    textAlign: style.textAlign,
    lineHeight: style.lineHeight,
    color: style.color,
    fill: style.fill,
    opacity: style.opacity
  };
}

/**
 * Check if a shape is using default formatting
 * @param shape Shape to check
 * @returns True if using defaults, false if custom
 */
export function isUsingDefaults(shape: TextShape): boolean {
  return shape.metadata?.isDefaultFormatting ?? true;
}

/**
 * Get element type label for display
 * @param shape TextShape to get label for
 * @returns Human-readable label (e.g., "Verse", "Reference", "Text")
 */
export function getElementTypeLabel(shape: TextShape): string {
  const elementType = shape.metadata?.elementType;

  switch (elementType) {
    case 'verse':
      return 'Verse';
    case 'reference':
      return 'Reference';
    case 'translation':
      return 'Translation';
    case 'chorus':
      return 'Chorus';
    case 'bridge':
      return 'Bridge';
    default:
      return 'Text';
  }
}

/**
 * Clamp a number between min and max values
 * @param value Number to clamp
 * @param min Minimum value
 * @param max Maximum value
 * @returns Clamped value
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * Clamp font size to valid range (8-200)
 * @param fontSize Font size to clamp
 * @returns Clamped font size
 */
export function clampFontSize(fontSize: number): number {
  return clamp(fontSize, 8, 200);
}

/**
 * Clamp line height to valid range (0.8-3.0)
 * @param lineHeight Line height to clamp
 * @returns Clamped line height
 */
export function clampLineHeight(lineHeight: number): number {
  return clamp(lineHeight, 0.8, 3.0);
}

/**
 * Clamp opacity to valid range (0-1)
 * @param opacity Opacity to clamp
 * @returns Clamped opacity
 */
export function clampOpacity(opacity: number): number {
  return clamp(opacity, 0, 1);
}

/**
 * Create a shallow copy of a shape for non-destructive updates
 * Note: Only use this for Redux persistence, not for editing
 * @param shape Shape to copy
 * @returns Shallow copy of the shape
 */
export function shallowCopyShape<T extends Shape>(shape: T): T {
  return Object.assign(Object.create(Object.getPrototypeOf(shape)), shape);
}

/**
 * Validate that a shape exists and is a TextShape
 * Throws an error if validation fails
 * @param shape Shape to validate
 * @param shapeId Expected shape ID for error messages
 * @throws Error if shape is invalid
 */
export function validateTextShape(
  shape: Shape | null | undefined,
  shapeId: string
): asserts shape is TextShape {
  if (!shape) {
    throw new Error(`[shapeUtils] Shape not found: ${shapeId}`);
  }

  if (!isTextShape(shape)) {
    throw new Error(`[shapeUtils] Shape is not a TextShape: ${shapeId} (type: ${shape.type})`);
  }
}

/**
 * Get safe reference to a TextShape from a map
 * Returns null if shape doesn't exist or isn't a TextShape
 * @param shapeMap Map of shapes
 * @param shapeId Shape ID to look up
 * @returns TextShape or null
 */
export function getSafeTextShape(
  shapeMap: Map<string, Shape>,
  shapeId: string
): TextShape | null {
  const shape = shapeMap.get(shapeId);
  return isTextShape(shape) ? (shape as TextShape) : null;
}

/**
 * Common presentation fonts for dropdown
 */
export const PRESENTATION_FONTS = [
  'Arial',
  'Times New Roman',
  'Georgia',
  'Verdana',
  'Trebuchet MS',
  'Courier New',
  'Impact',
  'Comic Sans MS',
  'Calibri',
  'Helvetica'
] as const;

export type PresentationFont = typeof PRESENTATION_FONTS[number];
