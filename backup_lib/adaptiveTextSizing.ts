import { TextElement, TextZone, Rectangle } from './universalSlideSlice';

export interface TextMeasurement {
  width: number;
  height: number;
  lineCount: number;
  fontSize: number;
  overflow: boolean;
}

export interface SizingStrategy {
  name: string;
  priority: number;
  calculateSize: (element: TextElement, zone: TextZone, viewport: Rectangle) => number;
}

export class AdaptiveTextSizing {
  private canvas: HTMLCanvasElement | null = null;
  private context: CanvasRenderingContext2D | null = null;
  private strategies: SizingStrategy[] = [];

  constructor() {
    this.initializeCanvas();
    this.registerDefaultStrategies();
  }

  private initializeCanvas(): void {
    if (typeof window !== 'undefined') {
      this.canvas = document.createElement('canvas');
      this.context = this.canvas.getContext('2d');
    }
  }

  private registerDefaultStrategies(): void {
    this.strategies = [
      {
        name: 'content-length-based',
        priority: 1,
        calculateSize: (element, zone, viewport) => this.calculateByContentLength(element, zone)
      },
      {
        name: 'zone-proportional',
        priority: 2,
        calculateSize: (element, zone, viewport) => this.calculateByZoneSize(element, zone)
      },
      {
        name: 'viewport-responsive',
        priority: 3,
        calculateSize: (element, zone, viewport) => this.calculateByViewport(element, zone, viewport)
      }
    ];
  }

  /**
   * Calculate optimal font size for a text element within its zone
   */
  public calculateOptimalSize(
    element: TextElement, 
    zone: TextZone, 
    viewport: Rectangle,
    maxIterations: number = 10
  ): number {
    const constraints = element.constraints || zone.autoResize;
    const minSize = constraints?.minFontSize || zone.autoResize.minSize || 12;
    const maxSize = constraints?.maxFontSize || zone.autoResize.maxSize || 120;

    if (!zone.autoResize.enabled) {
      return element.formatting.font.size;
    }

    let bestSize = minSize;
    let bestFit = this.measureText(element, zone, minSize);

    // Binary search for optimal size
    let low = minSize;
    let high = maxSize;
    let iterations = 0;

    while (low <= high && iterations < maxIterations) {
      const mid = Math.floor((low + high) / 2);
      const measurement = this.measureText(element, zone, mid);

      if (this.fitsInZone(measurement, zone)) {
        bestSize = mid;
        bestFit = measurement;
        low = mid + 1;
      } else {
        high = mid - 1;
      }
      iterations++;
    }

    return bestSize;
  }

  /**
   * Calculate sizes for multiple text elements to ensure they work together
   */
  public adaptForMultipleElements(
    elements: TextElement[], 
    zones: TextZone[], 
    viewport: Rectangle
  ): Map<string, number> {
    const sizes = new Map<string, number>();
    const elementZoneMap = this.mapElementsToZones(elements, zones);

    // First pass: calculate individual optimal sizes
    elements.forEach(element => {
      const zone = elementZoneMap.get(element.id);
      if (zone) {
        const optimalSize = this.calculateOptimalSize(element, zone, viewport);
        sizes.set(element.id, optimalSize);
      }
    });

    // Second pass: adjust for harmony and consistency
    this.harmonizeSizes(elements, zones, sizes, viewport);

    return sizes;
  }

  /**
   * Measure text dimensions with given font size
   */
  public measureText(element: TextElement, zone: TextZone, fontSize: number): TextMeasurement {
    if (!this.context) {
      return this.fallbackMeasurement(element, fontSize);
    }

    const { font } = element.formatting;
    this.context.font = `${font.style} ${font.weight} ${fontSize}px ${font.family}`;
    
    const lines = this.wrapText(element.content, zone.bounds.width, this.context);
    const lineHeight = fontSize * element.formatting.spacing.lineHeight;
    
    const width = Math.max(...lines.map(line => this.context!.measureText(line).width));
    const height = lines.length * lineHeight + (lines.length - 1) * element.formatting.spacing.paragraphSpacing;

    return {
      width,
      height,
      lineCount: lines.length,
      fontSize,
      overflow: width > zone.bounds.width || height > zone.bounds.height
    };
  }

  private calculateByContentLength(element: TextElement, zone: TextZone): number {
    const contentLength = element.content.length;
    const zoneArea = zone.bounds.width * zone.bounds.height;
    
    // Base calculation: longer content needs smaller font
    const baseSize = Math.sqrt(zoneArea / contentLength) * 0.8;
    
    // Apply content-based multipliers
    let multiplier = 1.0;
    if (element.type === 'heading') multiplier = 1.5;
    else if (element.type === 'emphasis') multiplier = 1.2;
    else if (element.type === 'verse') multiplier = 1.1;
    
    return Math.max(12, Math.min(120, baseSize * multiplier));
  }

  private calculateByZoneSize(element: TextElement, zone: TextZone): number {
    const zoneArea = zone.bounds.width * zone.bounds.height;
    const aspectRatio = zone.bounds.width / zone.bounds.height;
    
    // Size based on zone dimensions
    let baseSize = Math.sqrt(zoneArea) * 0.1;
    
    // Adjust for aspect ratio - wider zones can handle larger text
    if (aspectRatio > 2) baseSize *= 1.2;
    else if (aspectRatio < 0.5) baseSize *= 0.8;
    
    return Math.max(12, Math.min(120, baseSize));
  }

  private calculateByViewport(element: TextElement, zone: TextZone, viewport: Rectangle): number {
    const viewportArea = viewport.width * viewport.height;
    const zoneRatio = (zone.bounds.width * zone.bounds.height) / viewportArea;
    
    // Scale based on how much of the viewport this zone occupies
    const baseSize = Math.sqrt(viewportArea) * 0.05 * Math.sqrt(zoneRatio);
    
    return Math.max(12, Math.min(120, baseSize));
  }

  private wrapText(text: string, maxWidth: number, context: CanvasRenderingContext2D): string[] {
    const words = text.split(' ');
    const lines: string[] = [];
    let currentLine = '';

    for (const word of words) {
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      const metrics = context.measureText(testLine);
      
      if (metrics.width > maxWidth && currentLine) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    }
    
    if (currentLine) {
      lines.push(currentLine);
    }

    return lines;
  }

  private fitsInZone(measurement: TextMeasurement, zone: TextZone): boolean {
    const fitsWidth = measurement.width <= zone.bounds.width;
    const fitsHeight = measurement.height <= zone.bounds.height;
    const fitsLines = !zone.contentRules.maxLines || measurement.lineCount <= zone.contentRules.maxLines;
    
    return fitsWidth && fitsHeight && fitsLines;
  }

  private mapElementsToZones(elements: TextElement[], zones: TextZone[]): Map<string, TextZone> {
    const map = new Map<string, TextZone>();
    
    elements.forEach(element => {
      // Find the best matching zone based on position and content type
      const zone = zones.find(z => 
        z.contentRules.allowedTypes.includes(element.type) &&
        this.isElementInZone(element, z)
      ) || zones[0]; // Fallback to first zone
      
      if (zone) {
        map.set(element.id, zone);
      }
    });
    
    return map;
  }

  private isElementInZone(element: TextElement, zone: TextZone): boolean {
    const { x, y, width = 0, height = 0 } = element.position;
    const elementBounds = { x, y, width, height };
    
    return (
      elementBounds.x >= zone.bounds.x &&
      elementBounds.y >= zone.bounds.y &&
      elementBounds.x + elementBounds.width <= zone.bounds.x + zone.bounds.width &&
      elementBounds.y + elementBounds.height <= zone.bounds.y + zone.bounds.height
    );
  }

  private harmonizeSizes(
    elements: TextElement[], 
    zones: TextZone[], 
    sizes: Map<string, number>, 
    viewport: Rectangle
  ): void {
    // Group elements by type for size consistency
    const typeGroups = new Map<string, TextElement[]>();
    
    elements.forEach(element => {
      const group = typeGroups.get(element.type) || [];
      group.push(element);
      typeGroups.set(element.type, group);
    });

    // Harmonize sizes within each type group
    typeGroups.forEach((group, type) => {
      if (group.length > 1) {
        const groupSizes = group.map(el => sizes.get(el.id) || 16);
        const harmonizedSize = this.findHarmoniousSize(groupSizes, type);
        
        group.forEach(element => {
          sizes.set(element.id, harmonizedSize);
        });
      }
    });
  }

  private findHarmoniousSize(sizes: number[], elementType: string): number {
    // For headings, use the largest size to maintain hierarchy
    if (elementType === 'heading') {
      return Math.max(...sizes);
    }
    
    // For regular text, use average but bias towards readability
    const average = sizes.reduce((sum, size) => sum + size, 0) / sizes.length;
    const median = sizes.sort((a, b) => a - b)[Math.floor(sizes.length / 2)];
    
    // Use median for better consistency, but ensure minimum readability
    return Math.max(14, median);
  }

  private fallbackMeasurement(element: TextElement, fontSize: number): TextMeasurement {
    // Fallback calculation when canvas is not available
    const charWidth = fontSize * 0.6; // Approximate character width
    const lineHeight = fontSize * element.formatting.spacing.lineHeight;
    
    const lines = Math.ceil(element.content.length * charWidth / 800); // Assume 800px line width
    const width = Math.min(element.content.length * charWidth, 800);
    const height = lines * lineHeight;

    return {
      width,
      height,
      lineCount: lines,
      fontSize,
      overflow: false // Can't determine overflow without proper measurement
    };
  }

  /**
   * Handle content overflow with different strategies
   */
  public handleOverflow(element: TextElement, zone: TextZone, measurement: TextMeasurement): TextElement {
    const strategy = zone.overflow.behavior;
    
    switch (strategy) {
      case 'scale-down':
        // Reduce font size until it fits
        const newSize = this.calculateOptimalSize(element, zone, { x: 0, y: 0, width: 1920, height: 1080 });
        return {
          ...element,
          formatting: {
            ...element.formatting,
            font: { ...element.formatting.font, size: newSize }
          }
        };
        
      case 'wrap':
        // Content will naturally wrap, no changes needed
        return element;
        
      case 'clip':
        // Content will be clipped, potentially add ellipsis
        return element;
        
      default:
        return element;
    }
  }
}

export const adaptiveTextSizing = new AdaptiveTextSizing();