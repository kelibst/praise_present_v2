import { ResponsiveShape, ResponsiveShapePropsExtended } from '../core/ResponsiveShape';
import { RenderContext } from '../types/rendering';
import { ShapeType, TextStyle, defaultTextStyle } from '../types/shapes';
import { Color, colorToString } from '../types/geometry';
import { ResponsiveLayoutManager } from '../layout/ResponsiveLayoutManager';
import { TypographyScaler, TypographyScaleMode } from '../layout/TypographyScaler';
import {
  TypographyConfig,
  FlexibleValue,
  px,
  rem
} from '../types/responsive';

/**
 * Props specific to responsive text shapes
 */
export interface ResponsiveTextShapeProps extends ResponsiveShapePropsExtended {
  text?: string;
  textStyle?: TextStyle;
  autoSize?: boolean;
  wordWrap?: boolean;
  maxLines?: number;
  optimizeReadability?: boolean;
  scaleMode?: TypographyScaleMode;
}

/**
 * Text metrics for responsive text rendering
 */
export interface ResponsiveTextMetrics {
  fontSize: number;
  lineHeight: number;
  actualWidth: number;
  actualHeight: number;
  lines: string[];
  charactersPerLine: number;
  readabilityScore: number;
}

/**
 * A text shape that adapts its font size and layout to container size
 */
export class ResponsiveTextShape extends ResponsiveShape {
  public readonly type = ShapeType.TEXT;

  // Text properties
  public text: string;
  public textStyle: TextStyle;
  public autoSize: boolean;
  public wordWrap: boolean;
  public maxLines: number;
  public optimizeReadability: boolean;
  public scaleMode: TypographyScaleMode;

  // Typography scaler for intelligent font sizing
  private typographyScaler: TypographyScaler;

  // Cached text metrics
  private cachedMetrics: ResponsiveTextMetrics | null = null;
  private lastTextHash: string | null = null;

  constructor(props: ResponsiveTextShapeProps = {}) {
    super(props);

    this.text = props.text || '';
    this.textStyle = { ...defaultTextStyle, ...props.textStyle };
    this.autoSize = props.autoSize !== false;
    this.wordWrap = props.wordWrap !== false;
    this.maxLines = props.maxLines || 0;
    this.optimizeReadability = props.optimizeReadability !== false;
    this.scaleMode = props.scaleMode || TypographyScaleMode.FLUID;

    this.typographyScaler = new TypographyScaler({
      mode: this.scaleMode,
      minScale: 0.3,
      maxScale: 5.0
    });

    // Ensure typography config exists
    if (!this.typography) {
      this.typography = this.createDefaultTypographyConfig();
    }
  }

  /**
   * Render the responsive text with optimized typography
   */
  public render(context: RenderContext): void {
    if (!(context.context instanceof CanvasRenderingContext2D)) {
      console.warn('ResponsiveTextShape requires Canvas 2D context');
      return;
    }

    if (!this.text.trim()) return;

    const ctx = context.context;
    const layoutManager = this.getLayoutManagerFromRenderContext(context);

    ctx.save();
    this.applyTransformation(ctx);

    // Calculate responsive typography
    const metrics = this.calculateResponsiveMetrics(layoutManager, context);

    // Apply responsive text styling
    this.applyResponsiveTextStyle(ctx, metrics);

    // Render the text with calculated metrics
    this.renderTextWithMetrics(ctx, metrics);

    ctx.restore();
  }

  /**
   * Calculate responsive text metrics based on container and content
   */
  public calculateResponsiveMetrics(
    layoutManager?: ResponsiveLayoutManager,
    context?: RenderContext
  ): ResponsiveTextMetrics {
    const textHash = this.createTextHash(layoutManager);

    if (this.cachedMetrics && this.lastTextHash === textHash) {
      return this.cachedMetrics;
    }

    let metrics: ResponsiveTextMetrics;

    if (layoutManager && this.responsive && this.typography) {
      // Use responsive calculations
      const containerInfo = layoutManager.getContainerInfo();

      if (this.optimizeReadability) {
        // Optimize for readability
        const optimization = this.typographyScaler.optimizeForReadability(
          this.typography,
          containerInfo,
          this.text
        );

        metrics = {
          fontSize: optimization.fontSize,
          lineHeight: optimization.lineHeight,
          actualWidth: 0, // Will be calculated during text measurement
          actualHeight: 0, // Will be calculated during text measurement
          lines: this.wrapText(this.text, optimization.fontSize),
          charactersPerLine: optimization.metrics.charactersPerLine,
          readabilityScore: optimization.metrics.readabilityScore
        };
      } else {
        // Use basic responsive scaling
        const fontSize = this.typographyScaler.calculateFontSize(
          this.typography,
          containerInfo,
          this.text.length
        );

        const lineHeight = this.typographyScaler.calculateLineHeight(
          fontSize,
          this.typography,
          containerInfo
        );

        metrics = {
          fontSize,
          lineHeight,
          actualWidth: 0,
          actualHeight: 0,
          lines: this.wrapText(this.text, fontSize),
          charactersPerLine: Math.floor(this.size.width / (fontSize * 0.6)),
          readabilityScore: 1.0
        };
      }

      // Measure actual text dimensions
      if (context?.context instanceof CanvasRenderingContext2D) {
        const dimensions = this.measureTextDimensions(
          context.context,
          metrics.lines,
          metrics.fontSize,
          metrics.lineHeight
        );
        metrics.actualWidth = dimensions.width;
        metrics.actualHeight = dimensions.height;
      }
    } else {
      // Fallback to static typography
      const fontSize = this.textStyle.fontSize || 16;
      const lineHeight = fontSize * 1.2;
      const lines = this.wordWrap ? this.wrapText(this.text, fontSize) : [this.text];

      metrics = {
        fontSize,
        lineHeight,
        actualWidth: 0,
        actualHeight: lines.length * lineHeight,
        lines,
        charactersPerLine: 60, // Default assumption
        readabilityScore: 0.7
      };
    }

    this.cachedMetrics = metrics;
    this.lastTextHash = textHash;

    return metrics;
  }

  /**
   * Apply responsive text styling to canvas context
   */
  private applyResponsiveTextStyle(
    ctx: CanvasRenderingContext2D,
    metrics: ResponsiveTextMetrics
  ): void {
    const style = this.textStyle;

    // Build responsive font string
    const fontStyle = style.fontStyle || 'normal';
    const fontWeight = style.fontWeight || 'normal';
    const fontFamily = style.fontFamily || 'Arial, sans-serif';

    ctx.font = `${fontStyle} ${fontWeight} ${metrics.fontSize}px ${fontFamily}`;

    // Set text alignment
    ctx.textAlign = (style.textAlign as CanvasTextAlign) || 'left';
    ctx.textBaseline = 'top';

    // Set text color
    if (style.color) {
      ctx.fillStyle = colorToString(style.color);
    } else {
      ctx.fillStyle = 'white';
    }

    // Set stroke style if needed
    if (style.strokeColor && style.strokeWidth) {
      ctx.strokeStyle = colorToString(style.strokeColor);
      ctx.lineWidth = style.strokeWidth;
    }

    // Apply text shadow if specified
    if (style.shadowColor && style.shadowBlur) {
      const shadowColor = colorToString(style.shadowColor);
      ctx.shadowColor = shadowColor;
      ctx.shadowBlur = style.shadowBlur;
      ctx.shadowOffsetX = style.shadowOffsetX || 0;
      ctx.shadowOffsetY = style.shadowOffsetY || 0;
    }

    // Set global alpha for text opacity
    ctx.globalAlpha = this.opacity;
  }

  /**
   * Render text using calculated metrics
   */
  private renderTextWithMetrics(
    ctx: CanvasRenderingContext2D,
    metrics: ResponsiveTextMetrics
  ): void {
    const { lines, fontSize, lineHeight } = metrics;
    const startX = this.position.x;
    let currentY = this.position.y;

    // Handle vertical alignment
    const totalTextHeight = lines.length * lineHeight;
    if (this.textStyle.verticalAlign === 'middle') {
      currentY += (this.size.height - totalTextHeight) / 2;
    } else if (this.textStyle.verticalAlign === 'bottom') {
      currentY += this.size.height - totalTextHeight;
    }

    // Render each line
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      let x = startX;

      // Handle horizontal alignment
      if (ctx.textAlign === 'center') {
        x = startX + this.size.width / 2;
      } else if (ctx.textAlign === 'right') {
        x = startX + this.size.width;
      }

      const y = currentY + i * lineHeight;

      // Render text fill
      ctx.fillText(line, x, y);

      // Render text stroke if enabled
      if (this.textStyle.strokeColor && this.textStyle.strokeWidth) {
        ctx.strokeText(line, x, y);
      }
    }

    // Auto-size the shape if enabled
    if (this.autoSize) {
      this.size.width = Math.max(this.size.width, metrics.actualWidth);
      this.size.height = Math.max(this.size.height, metrics.actualHeight);
    }
  }

  /**
   * Wrap text to fit within specified width
   */
  private wrapText(text: string, fontSize: number): string[] {
    if (!this.wordWrap) {
      return [text];
    }

    // Estimate character width (rough approximation)
    const charWidth = fontSize * 0.6;
    const maxCharsPerLine = Math.floor(this.size.width / charWidth);

    if (maxCharsPerLine <= 0) {
      return [text];
    }

    const words = text.split(' ');
    const lines: string[] = [];
    let currentLine = '';

    for (const word of words) {
      const testLine = currentLine ? `${currentLine} ${word}` : word;

      if (testLine.length > maxCharsPerLine && currentLine) {
        lines.push(currentLine);
        currentLine = word;

        // Check max lines limit
        if (this.maxLines > 0 && lines.length >= this.maxLines) {
          // Add ellipsis to the last line if we've hit the limit
          if (lines.length === this.maxLines) {
            const lastLine = lines[lines.length - 1];
            lines[lines.length - 1] = lastLine.slice(0, -3) + '...';
          }
          break;
        }
      } else {
        currentLine = testLine;
      }
    }

    if (currentLine && (this.maxLines === 0 || lines.length < this.maxLines)) {
      lines.push(currentLine);
    }

    return lines;
  }

  /**
   * Measure actual text dimensions
   */
  private measureTextDimensions(
    ctx: CanvasRenderingContext2D,
    lines: string[],
    fontSize: number,
    lineHeight: number
  ): { width: number; height: number } {
    let maxWidth = 0;

    // Set font for measurement
    const style = this.textStyle;
    const fontStyle = style.fontStyle || 'normal';
    const fontWeight = style.fontWeight || 'normal';
    const fontFamily = style.fontFamily || 'Arial, sans-serif';

    ctx.font = `${fontStyle} ${fontWeight} ${fontSize}px ${fontFamily}`;

    // Measure each line
    for (const line of lines) {
      const metrics = ctx.measureText(line);
      maxWidth = Math.max(maxWidth, metrics.width);
    }

    const height = lines.length * lineHeight;

    return { width: maxWidth, height };
  }

  /**
   * Create default typography configuration
   */
  private createDefaultTypographyConfig(): TypographyConfig {
    return {
      baseSize: rem(1.5), // 24px at default 16px base
      scaleRatio: 0.8,
      minSize: 12,
      maxSize: 96,
      lineHeightRatio: 1.3
    };
  }

  /**
   * Create hash for cache invalidation
   */
  private createTextHash(layoutManager?: ResponsiveLayoutManager): string {
    const containerHash = layoutManager
      ? JSON.stringify(layoutManager.getContainerInfo())
      : 'static';

    return JSON.stringify({
      text: this.text,
      textStyle: this.textStyle,
      typography: this.typography,
      containerHash,
      responsive: this.responsive,
      optimizeReadability: this.optimizeReadability,
      position: this.position,
      size: this.size
    });
  }

  /**
   * Get layout manager from render context
   */
  private getLayoutManagerFromRenderContext(context: RenderContext): ResponsiveLayoutManager | undefined {
    // Extract layout manager from render context if available
    return context.layoutManager as ResponsiveLayoutManager | undefined;
  }

  /**
   * Update text content and invalidate caches
   */
  public setText(text: string): void {
    if (this.text !== text) {
      this.text = text;
      this.invalidateTextCache();
    }
  }

  /**
   * Update text style and invalidate caches
   */
  public updateTextStyle(style: Partial<TextStyle>): void {
    this.textStyle = { ...this.textStyle, ...style };
    this.invalidateTextCache();
  }

  /**
   * Update typography configuration and invalidate caches
   */
  public updateTypography(typography: Partial<TypographyConfig>): void {
    if (this.typography) {
      this.typography = { ...this.typography, ...typography };
      this.invalidateTextCache();
    }
  }

  /**
   * Get current text metrics (calculate if not cached)
   */
  public getTextMetrics(layoutManager?: ResponsiveLayoutManager): ResponsiveTextMetrics {
    return this.calculateResponsiveMetrics(layoutManager);
  }

  /**
   * Invalidate text-related caches
   */
  private invalidateTextCache(): void {
    this.cachedMetrics = null;
    this.lastTextHash = null;
  }
}