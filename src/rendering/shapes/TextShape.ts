import { Shape } from '../core/Shape';
import { RenderContext } from '../types/rendering';
import { ShapeType, ShapeProps, TextStyle, defaultTextStyle } from '../types/shapes';
import { Color, colorToString, Point } from '../types/geometry';

export interface TextShapeProps extends ShapeProps {
  text?: string;
  textStyle?: TextStyle;
  autoSize?: boolean;
  wordWrap?: boolean;
  maxLines?: number;
}

export interface TextMetrics {
  width: number;
  height: number;
  lineHeight: number;
  lines: string[];
  actualBounds: {
    width: number;
    height: number;
  };
}

export class TextShape extends Shape {
  public readonly type = ShapeType.TEXT;
  public text: string;
  public textStyle: TextStyle;
  public autoSize: boolean;
  public wordWrap: boolean;
  public maxLines: number;
  private cachedMetrics: TextMetrics | null = null;
  private metricsCache: Map<string, TextMetrics> = new Map();
  private readonly MAX_CACHE_SIZE = 50; // Limit cache to prevent memory leaks

  constructor(props: TextShapeProps = {}, style: TextStyle = {}) {
    super(props);
    this.text = props.text || '';
    this.textStyle = { ...defaultTextStyle, ...style };
    this.autoSize = props.autoSize !== false;
    this.wordWrap = props.wordWrap !== false;
    this.maxLines = props.maxLines || 0;
  }

  public render(context: RenderContext): void {
    if (!(context.context instanceof CanvasRenderingContext2D)) {
      console.warn('TextShape requires Canvas 2D context');
      return;
    }

    if (!this.text.trim()) return;

    const ctx = context.context;

    ctx.save();
    this.applyTransformation(ctx);
    this.applyStyle(ctx);
    this.applyTextStyle(ctx);

    const metrics = this.getTextMetrics(ctx);

    // Auto-size the shape if enabled
    if (this.autoSize) {
      this.size.width = Math.max(this.size.width, metrics.actualBounds.width);
      this.size.height = Math.max(this.size.height, metrics.actualBounds.height);
    }

    this.renderText(ctx, metrics);

    this.resetStyle(ctx);
    ctx.restore();
  }

  private applyTextStyle(ctx: CanvasRenderingContext2D): void {
    const style = this.textStyle;

    // Build font string
    const fontStyle = style.fontStyle || 'normal';
    const fontWeight = style.fontWeight || 'normal';
    const fontSize = style.fontSize || 16;
    const fontFamily = style.fontFamily || 'Arial, sans-serif';

    ctx.font = `${fontStyle} ${fontWeight} ${fontSize}px ${fontFamily}`;
    ctx.textAlign = style.textAlign || 'left';
    ctx.textBaseline = style.verticalAlign === 'middle' ? 'middle' :
                      style.verticalAlign === 'bottom' ? 'bottom' : 'top';

    if (style.color) {
      ctx.fillStyle = colorToString(style.color);
    }

    // Text decorations will be handled separately as Canvas doesn't support them directly
  }

  private getTextMetrics(ctx: CanvasRenderingContext2D): TextMetrics {
    const cacheKey = this.getCacheKey();

    if (this.metricsCache.has(cacheKey)) {
      return this.metricsCache.get(cacheKey)!;
    }

    const metrics = this.measureText(ctx);

    // Implement LRU-style cache eviction
    if (this.metricsCache.size >= this.MAX_CACHE_SIZE) {
      // Remove the oldest entry (first one in Map)
      const firstKey = this.metricsCache.keys().next().value;
      if (firstKey) {
        this.metricsCache.delete(firstKey);
      }
    }

    this.metricsCache.set(cacheKey, metrics);
    return metrics;
  }

  private getCacheKey(): string {
    return JSON.stringify({
      text: this.text,
      font: this.textStyle,
      width: this.size.width,
      wordWrap: this.wordWrap,
      maxLines: this.maxLines
    });
  }

  private measureText(ctx: CanvasRenderingContext2D): TextMetrics {
    const lines = this.wrapText(ctx, this.text);
    const fontSize = this.textStyle.fontSize || 16;
    const lineHeight = (this.textStyle.lineHeight || 1.2) * fontSize;

    let maxWidth = 0;

    for (const line of lines) {
      const lineMetrics = ctx.measureText(line);
      maxWidth = Math.max(maxWidth, lineMetrics.width);
    }

    const totalHeight = lines.length * lineHeight;

    return {
      width: maxWidth,
      height: totalHeight,
      lineHeight,
      lines,
      actualBounds: {
        width: maxWidth,
        height: totalHeight
      }
    };
  }

  private wrapText(ctx: CanvasRenderingContext2D, text: string): string[] {
    if (!this.wordWrap || this.size.width <= 0) {
      const lines = text.split('\n');
      return this.maxLines > 0 ? lines.slice(0, this.maxLines) : lines;
    }

    const words = text.split(/\s+/);
    const lines: string[] = [];
    let currentLine = '';

    for (const word of words) {
      const testLine = currentLine + (currentLine ? ' ' : '') + word;
      const metrics = ctx.measureText(testLine);

      if (metrics.width > this.size.width && currentLine !== '') {
        lines.push(currentLine);
        currentLine = word;

        if (this.maxLines > 0 && lines.length >= this.maxLines) {
          break;
        }
      } else {
        currentLine = testLine;
      }
    }

    if (currentLine && (!this.maxLines || lines.length < this.maxLines)) {
      lines.push(currentLine);
    }

    // Handle ellipsis for maxLines
    if (this.maxLines > 0 && lines.length === this.maxLines && words.length > lines.join(' ').split(' ').length) {
      const lastLine = lines[lines.length - 1];
      const ellipsis = '...';
      let trimmed = lastLine;

      while (ctx.measureText(trimmed + ellipsis).width > this.size.width && trimmed.length > 0) {
        trimmed = trimmed.slice(0, -1);
      }

      lines[lines.length - 1] = trimmed + ellipsis;
    }

    return lines;
  }

  private renderText(ctx: CanvasRenderingContext2D, metrics: TextMetrics): void {
    const { lines, lineHeight } = metrics;
    const style = this.textStyle;

    let startY = 0;

    // Vertical alignment
    switch (style.verticalAlign) {
      case 'middle':
        startY = (this.size.height - metrics.actualBounds.height) / 2;
        break;
      case 'bottom':
        startY = this.size.height - metrics.actualBounds.height;
        break;
      default: // 'top'
        startY = 0;
    }

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const y = startY + (i + 1) * lineHeight;

      let x = 0;
      switch (style.textAlign) {
        case 'center':
          x = this.size.width / 2;
          break;
        case 'right':
          x = this.size.width;
          break;
        default: // 'left'
          x = 0;
      }

      // Apply letter spacing if specified
      if (style.letterSpacing && style.letterSpacing !== 0) {
        this.renderTextWithSpacing(ctx, line, x, y, style.letterSpacing);
      } else {
        ctx.fillText(line, x, y);
      }

      // Render text decoration if specified
      if (style.textDecoration && style.textDecoration !== 'none') {
        this.renderTextDecoration(ctx, line, x, y, lineHeight, style.textDecoration);
      }
    }
  }

  private renderTextWithSpacing(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, spacing: number): void {
    const chars = text.split('');
    let currentX = x;

    // Adjust for text alignment
    if (this.textStyle.textAlign === 'center') {
      const totalWidth = this.measureTextWithSpacing(ctx, text, spacing);
      currentX = x - totalWidth / 2;
    } else if (this.textStyle.textAlign === 'right') {
      const totalWidth = this.measureTextWithSpacing(ctx, text, spacing);
      currentX = x - totalWidth;
    }

    for (const char of chars) {
      ctx.fillText(char, currentX, y);
      currentX += ctx.measureText(char).width + spacing;
    }
  }

  private measureTextWithSpacing(ctx: CanvasRenderingContext2D, text: string, spacing: number): number {
    const chars = text.split('');
    let totalWidth = 0;

    for (let i = 0; i < chars.length; i++) {
      totalWidth += ctx.measureText(chars[i]).width;
      if (i < chars.length - 1) {
        totalWidth += spacing;
      }
    }

    return totalWidth;
  }

  private renderTextDecoration(
    ctx: CanvasRenderingContext2D,
    text: string,
    x: number,
    y: number,
    lineHeight: number,
    decoration: string
  ): void {
    const metrics = ctx.measureText(text);
    let decorationY = y;

    switch (decoration) {
      case 'underline':
        decorationY = y + lineHeight * 0.1;
        break;
      case 'overline':
        decorationY = y - lineHeight * 0.8;
        break;
      case 'line-through':
        decorationY = y - lineHeight * 0.3;
        break;
    }

    let startX = x;
    if (this.textStyle.textAlign === 'center') {
      startX = x - metrics.width / 2;
    } else if (this.textStyle.textAlign === 'right') {
      startX = x - metrics.width;
    }

    ctx.save();
    ctx.strokeStyle = ctx.fillStyle;
    ctx.lineWidth = Math.max(1, (this.textStyle.fontSize || 16) / 16);
    ctx.beginPath();
    ctx.moveTo(startX, decorationY);
    ctx.lineTo(startX + metrics.width, decorationY);
    ctx.stroke();
    ctx.restore();
  }

  // Public methods
  public setText(text: string): void {
    if (this.text !== text) {
      this.text = text;
      this.cachedMetrics = null;
      this.clearMetricsCache();
    }
  }

  public setTextStyle(style: Partial<TextStyle>): void {
    this.textStyle = { ...this.textStyle, ...style };
    this.cachedMetrics = null;
    this.clearMetricsCache();
  }

  /**
   * Clears the text metrics cache to free memory
   */
  public clearMetricsCache(): void {
    this.metricsCache.clear();
  }

  /**
   * Gets cache statistics for debugging
   */
  public getCacheStats(): { size: number; maxSize: number } {
    return {
      size: this.metricsCache.size,
      maxSize: this.MAX_CACHE_SIZE
    };
  }

  public setFontSize(size: number): void {
    this.setTextStyle({ fontSize: Math.max(1, size) });
  }

  public setFontFamily(family: string): void {
    this.setTextStyle({ fontFamily: family });
  }

  public setTextColor(color: Color): void {
    this.setTextStyle({ color });
  }

  public setTextAlign(align: 'left' | 'center' | 'right'): void {
    this.setTextStyle({ textAlign: align });
  }

  public setVerticalAlign(align: 'top' | 'middle' | 'bottom'): void {
    this.setTextStyle({ verticalAlign: align });
  }

  public getTextMetricsSync(): TextMetrics | null {
    return this.cachedMetrics;
  }

  public measureTextAsync(ctx?: CanvasRenderingContext2D): Promise<TextMetrics> {
    return new Promise((resolve) => {
      if (ctx) {
        resolve(this.getTextMetrics(ctx));
      } else {
        // Create temporary context for measurement
        const canvas = document.createElement('canvas');
        const tempCtx = canvas.getContext('2d');
        if (tempCtx) {
          this.applyTextStyle(tempCtx);
          resolve(this.getTextMetrics(tempCtx));
        }
      }
    });
  }

  public fitToText(ctx?: CanvasRenderingContext2D): void {
    if (ctx) {
      const metrics = this.getTextMetrics(ctx);
      this.resize({
        width: Math.max(this.size.width, metrics.actualBounds.width),
        height: Math.max(this.size.height, metrics.actualBounds.height)
      });
    } else {
      this.autoSize = true;
    }
  }

  public clone(): TextShape {
    const cloned = new TextShape(
      {
        id: this.generateId(),
        position: { ...this.position },
        size: { ...this.size },
        rotation: this.rotation,
        opacity: this.opacity,
        zIndex: this.zIndex,
        visible: this.visible,
        transform: { ...this.transform },
        text: this.text,
        textStyle: { ...this.textStyle },
        autoSize: this.autoSize,
        wordWrap: this.wordWrap,
        maxLines: this.maxLines
      }
    );
    return cloned;
  }

  public toJSON(): any {
    return {
      ...super.toJSON(),
      text: this.text,
      textStyle: this.textStyle,
      autoSize: this.autoSize,
      wordWrap: this.wordWrap,
      maxLines: this.maxLines
    };
  }

  public static fromJSON(data: any): TextShape {
    return new TextShape(
      {
        id: data.id,
        position: data.position,
        size: data.size,
        rotation: data.rotation,
        opacity: data.opacity,
        zIndex: data.zIndex,
        visible: data.visible,
        transform: data.transform,
        text: data.text,
        textStyle: data.textStyle,
        autoSize: data.autoSize,
        wordWrap: data.wordWrap,
        maxLines: data.maxLines
      }
    );
  }
}