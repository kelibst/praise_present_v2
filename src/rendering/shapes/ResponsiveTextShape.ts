import { ResponsiveShape, ResponsiveShapePropsExtended } from '../core/ResponsiveShape';
import { RenderContext } from '../types/rendering';
import { ShapeType, TextStyle, defaultTextStyle } from '../types/shapes';
import { Color, colorToString } from '../types/geometry';
import { ResponsiveLayoutManager } from '../layout/ResponsiveLayoutManager';
import { TypographyScaler, TypographyScaleMode } from '../layout/TypographyScaler';
import { SmartTextScaler, ContentCharacteristics } from '../layout/SmartTextScaler';
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

  // Smart scaling options
  enableSmartScaling?: boolean;
  contentContext?: 'scripture' | 'song' | 'announcement' | 'title';
  smartScalingConfig?: Partial<import('../layout/SmartTextScaler').SmartScalingConfig>;
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

  // Smart text scaler for content-aware scaling
  private smartTextScaler?: SmartTextScaler;
  public enableSmartScaling: boolean;
  public contentContext: 'scripture' | 'song' | 'announcement' | 'title';

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

    // Smart scaling configuration
    this.enableSmartScaling = props.enableSmartScaling !== false;
    this.contentContext = props.contentContext || 'scripture';

    this.typographyScaler = new TypographyScaler({
      mode: this.scaleMode,
      minScale: 0.3,
      maxScale: 5.0
    });

    // Initialize smart text scaler if enabled
    if (this.enableSmartScaling) {
      this.smartTextScaler = new SmartTextScaler(props.smartScalingConfig);
      console.log('🧠 ResponsiveTextShape: Smart scaling enabled', {
        context: this.contentContext,
        hasCustomConfig: !!props.smartScalingConfig
      });
    }

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
      // Reduce warning frequency to prevent console spam
      if (Math.random() < 0.01) {
        console.warn('ResponsiveTextShape requires Canvas 2D context');
      }
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

      // Calculate initial metrics
      metrics = this.calculateInitialMetrics(containerInfo, context);

      // Apply overflow protection
      metrics = this.applyOverflowProtection(metrics, context?.context as CanvasRenderingContext2D);
    } else {
      // Fallback to static typography
      metrics = this.calculateFallbackMetrics(context?.context as CanvasRenderingContext2D);
    }

    this.cachedMetrics = metrics;
    this.lastTextHash = textHash;

    return metrics;
  }

  /**
   * Calculate initial responsive metrics
   */
  private calculateInitialMetrics(
    containerInfo: any,
    context?: RenderContext
  ): ResponsiveTextMetrics {
    let metrics: ResponsiveTextMetrics;

    // Debug logging (reduced verbosity)
    if (Math.random() < 0.1) { // Only log 10% of the time to reduce spam
      console.log('🔍 ResponsiveTextShape: calculateInitialMetrics called', {
        shapeId: this.id,
        containerSize: `${containerInfo?.width || this.size.width}x${containerInfo?.height || this.size.height}`,
        isPreview: containerInfo?.scaleInfo?.isPreview,
        scaleFactor: containerInfo?.scaleInfo?.scaleFactor,
        textLength: this.text.length
      });
    }

    if (this.enableSmartScaling && this.smartTextScaler && this.text.trim().length > 0) {
        // Use smart scaling for optimal size based on content
        console.log('🎯 ResponsiveTextShape: Using smart scaling for content analysis');

        const smartResult = this.smartTextScaler.calculateOptimalSize(
          this.text,
          containerInfo,
          this.typography,
          this.contentContext
        );

        console.log('🧠 Smart scaling result:', {
          fontSize: smartResult.fontSize,
          confidence: smartResult.confidence,
          wordCount: smartResult.metrics.wordCount,
          complexity: smartResult.metrics.complexity.toFixed(2),
          reasons: smartResult.adjustmentReason,
          originalTypographyBaseSize: this.typography?.baseSize,
          containerUsed: containerInfo
        });

      metrics = {
        fontSize: smartResult.fontSize,
        lineHeight: smartResult.lineHeight,
        actualWidth: 0,
        actualHeight: 0,
        lines: this.wrapText(this.text, smartResult.fontSize, context?.context as CanvasRenderingContext2D),
        charactersPerLine: smartResult.metrics.characterCount / Math.max(smartResult.metrics.wordCount, 1),
        readabilityScore: smartResult.confidence
      };
    } else if (this.optimizeReadability) {
      // Optimize for readability
      console.log('📖 ResponsiveTextShape: Using readability optimization');

      const optimization = this.typographyScaler.optimizeForReadability(
        this.typography,
        containerInfo,
        this.text
      );

      console.log('📈 Readability optimization result:', {
        fontSize: optimization.fontSize,
        lineHeight: optimization.lineHeight,
        charactersPerLine: optimization.metrics.charactersPerLine,
        readabilityScore: optimization.metrics.readabilityScore,
        containerInfo,
        typography: this.typography
      });

      metrics = {
        fontSize: optimization.fontSize,
        lineHeight: optimization.lineHeight,
        actualWidth: 0, // Will be calculated during text measurement
        actualHeight: 0, // Will be calculated during text measurement
        lines: this.wrapText(this.text, optimization.fontSize, context?.context as CanvasRenderingContext2D),
        charactersPerLine: optimization.metrics.charactersPerLine,
        readabilityScore: optimization.metrics.readabilityScore
      };
    } else {
      // Use basic responsive scaling
      console.log('⚙️ ResponsiveTextShape: Using basic responsive scaling');

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

      // Apply preview scaling if this is a preview container
      let adjustedFontSize = fontSize;
      let adjustedLineHeight = lineHeight;

      if (containerInfo?.scaleInfo?.isPreview) {
        // For preview containers, scale the calculated font size appropriately
        const scaleFactor = containerInfo.scaleInfo.scaleFactor;
        adjustedFontSize = fontSize * scaleFactor;
        adjustedLineHeight = lineHeight * scaleFactor;

        console.log('📏 ResponsiveTextShape: Applied preview scaling', {
          originalFontSize: fontSize,
          adjustedFontSize,
          scaleFactor,
          actualCanvasSize: containerInfo.scaleInfo.actualCanvasSize
        });
      }

      console.log('🔧 Basic scaling result:', {
        fontSize,
        adjustedFontSize,
        lineHeight,
        adjustedLineHeight,
        containerInfo,
        typography: this.typography,
        textLength: this.text.length,
        calculatedCharsPerLine: Math.floor(Math.max(this.size.width, adjustedFontSize * 2) / (adjustedFontSize * 0.6))
      });

      metrics = {
        fontSize: adjustedFontSize,
        lineHeight: adjustedLineHeight,
        actualWidth: 0,
        actualHeight: 0,
        lines: this.wrapText(this.text, adjustedFontSize, context?.context as CanvasRenderingContext2D),
        charactersPerLine: Math.floor(Math.max(this.size.width, adjustedFontSize * 2) / (adjustedFontSize * 0.6)),
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

    return metrics;
  }

  /**
   * Calculate fallback metrics for non-responsive mode
   */
  private calculateFallbackMetrics(ctx?: CanvasRenderingContext2D): ResponsiveTextMetrics {
    const fontSize = this.textStyle.fontSize || 16;
    const lineHeight = fontSize * 1.2;
    const lines = this.wordWrap ? this.wrapText(this.text, fontSize, ctx) : [this.text];

    return {
      fontSize,
      lineHeight,
      actualWidth: 0,
      actualHeight: lines.length * lineHeight,
      lines,
      charactersPerLine: 60, // Default assumption
      readabilityScore: 0.7
    };
  }

  /**
   * Apply overflow protection by reducing font size if text doesn't fit
   */
  private applyOverflowProtection(
    metrics: ResponsiveTextMetrics,
    ctx?: CanvasRenderingContext2D
  ): ResponsiveTextMetrics {
    if (!ctx || !this.size.width || !this.size.height) {
      console.log('⚠️ ResponsiveTextShape: Skipping overflow protection - missing context or container size');
      return metrics; // Can't measure without context or container
    }

    console.log('🛡️ ResponsiveTextShape: Starting overflow protection', {
      initialMetrics: {
        fontSize: metrics.fontSize,
        lineHeight: metrics.lineHeight,
        linesCount: metrics.lines.length,
        estimatedHeight: metrics.lines.length * metrics.lineHeight
      },
      containerSize: this.size,
      shapeId: this.id
    });

    const maxIterations = 10;
    let currentMetrics = { ...metrics };
    let iteration = 0;
    let adjustmentsMade = [];

    while (iteration < maxIterations) {
      // Check if current metrics fit in container
      const estimatedHeight = currentMetrics.lines.length * currentMetrics.lineHeight;

      // Check vertical overflow
      if (estimatedHeight > this.size.height) {
        // Reduce font size by 10%
        const oldFontSize = currentMetrics.fontSize;
        const newFontSize = Math.max(currentMetrics.fontSize * 0.9, 8); // Minimum 8px
        const newLineHeight = newFontSize * (currentMetrics.lineHeight / currentMetrics.fontSize);

        if (newFontSize === currentMetrics.fontSize) {
          console.log('🔒 ResponsiveTextShape: Hit minimum font size, stopping overflow protection');
          break; // Can't reduce further
        }

        currentMetrics = {
          ...currentMetrics,
          fontSize: newFontSize,
          lineHeight: newLineHeight,
          lines: this.wrapText(this.text, newFontSize, ctx)
        };

        adjustmentsMade.push({
          iteration,
          reason: 'vertical_overflow',
          oldFontSize,
          newFontSize,
          estimatedHeight,
          containerHeight: this.size.height
        });

        console.log(`🔧 ResponsiveTextShape: Reduced font size ${oldFontSize}px → ${newFontSize}px for vertical overflow (${estimatedHeight}px > ${this.size.height}px)`);
      } else {
        // Check horizontal overflow for each line
        let hasHorizontalOverflow = false;
        ctx.save();
        this.setCanvasFont(ctx, currentMetrics.fontSize);

        for (const line of currentMetrics.lines) {
          const lineWidth = ctx.measureText(line).width;
          if (lineWidth > this.size.width) {
            hasHorizontalOverflow = true;
            break;
          }
        }
        ctx.restore();

        if (hasHorizontalOverflow) {
          // Re-wrap text with current font size
          currentMetrics = {
            ...currentMetrics,
            lines: this.wrapText(this.text, currentMetrics.fontSize, ctx)
          };
          adjustmentsMade.push({
            iteration,
            reason: 'horizontal_overflow_rewrap',
            fontSize: currentMetrics.fontSize,
            linesCount: currentMetrics.lines.length
          });
          console.log(`🔄 ResponsiveTextShape: Re-wrapped text for horizontal overflow at ${currentMetrics.fontSize}px`);
        } else {
          // Text fits, we're done
          console.log('✅ ResponsiveTextShape: Text fits within container, overflow protection complete');
          break;
        }
      }

      iteration++;
    }

    // Update actual dimensions
    if (ctx) {
      const dimensions = this.measureTextDimensions(
        ctx,
        currentMetrics.lines,
        currentMetrics.fontSize,
        currentMetrics.lineHeight
      );
      currentMetrics.actualWidth = dimensions.width;
      currentMetrics.actualHeight = dimensions.height;
    }

    // Log final overflow protection summary
    console.log('🔚 ResponsiveTextShape: Overflow protection complete', {
      initialFontSize: metrics.fontSize,
      finalFontSize: currentMetrics.fontSize,
      adjustmentsMade: adjustmentsMade,
      iterations: iteration,
      finalDimensions: {
        width: currentMetrics.actualWidth,
        height: currentMetrics.actualHeight
      },
      containerSize: this.size
    });

    return currentMetrics;
  }

  /**
   * Set canvas font based on text style and font size
   */
  private setCanvasFont(ctx: CanvasRenderingContext2D, fontSize: number): void {
    const style = this.textStyle;
    const fontStyle = style.fontStyle || 'normal';
    const fontWeight = style.fontWeight || 'normal';
    const fontFamily = style.fontFamily || 'Arial, sans-serif';
    ctx.font = `${fontStyle} ${fontWeight} ${fontSize}px ${fontFamily}`;
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
   * Wrap text to fit within specified width using proper canvas text measurement
   */
  private wrapText(text: string, fontSize: number, context?: CanvasRenderingContext2D): string[] {
    if (!this.wordWrap) {
      return [text];
    }

    // Ensure we have a minimum container width to work with
    const minWidth = Math.max(fontSize * 2, 50); // At least 2 characters worth of space
    const containerWidth = Math.max(this.size.width, minWidth);

    // If we have a canvas context, use precise text measurement
    if (context) {
      return this.wrapTextWithMeasurement(text, fontSize, containerWidth, context);
    }

    // Fallback to improved character width estimation
    return this.wrapTextWithEstimation(text, fontSize, containerWidth);
  }

  /**
   * Wrap text using precise canvas text measurement
   */
  private wrapTextWithMeasurement(
    text: string,
    fontSize: number,
    containerWidth: number,
    ctx: CanvasRenderingContext2D
  ): string[] {
    // Set font for measurement
    const style = this.textStyle;
    const fontStyle = style.fontStyle || 'normal';
    const fontWeight = style.fontWeight || 'normal';
    const fontFamily = style.fontFamily || 'Arial, sans-serif';
    ctx.font = `${fontStyle} ${fontWeight} ${fontSize}px ${fontFamily}`;

    const words = text.split(' ');
    const lines: string[] = [];
    let currentLine = '';

    for (const word of words) {
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      const metrics = ctx.measureText(testLine);

      if (metrics.width > containerWidth && currentLine) {
        // Current line would overflow, push it and start new line
        lines.push(currentLine);
        currentLine = word;

        // Check if single word is too long
        const wordMetrics = ctx.measureText(word);
        if (wordMetrics.width > containerWidth) {
          // Break long word into parts
          const brokenWord = this.breakLongWord(word, containerWidth, ctx);
          if (brokenWord.length > 1) {
            // Add all but last part to lines, keep last part as current
            for (let i = 0; i < brokenWord.length - 1; i++) {
              lines.push(brokenWord[i]);
            }
            currentLine = brokenWord[brokenWord.length - 1];
          }
        }

        // Check max lines limit
        if (this.maxLines > 0 && lines.length >= this.maxLines) {
          if (lines.length === this.maxLines) {
            // Add ellipsis to the last line
            const lastLine = lines[lines.length - 1];
            const ellipsis = '...';
            const ellipsisWidth = ctx.measureText(ellipsis).width;

            // Trim the last line to fit ellipsis
            let trimmedLine = lastLine;
            while (trimmedLine.length > 0 && ctx.measureText(trimmedLine + ellipsis).width > containerWidth) {
              trimmedLine = trimmedLine.slice(0, -1);
            }
            lines[lines.length - 1] = trimmedLine + ellipsis;
          }
          break;
        }
      } else {
        currentLine = testLine;
      }
    }

    // Add remaining text if within line limits
    if (currentLine && (this.maxLines === 0 || lines.length < this.maxLines)) {
      lines.push(currentLine);
    }

    return lines.length > 0 ? lines : ['']; // Always return at least one line
  }

  /**
   * Wrap text using improved character width estimation (fallback)
   */
  private wrapTextWithEstimation(text: string, fontSize: number, containerWidth: number): string[] {
    // Improved character width estimation based on font properties
    let charWidth = fontSize * 0.6; // Base estimate

    // Adjust for font weight
    if (this.textStyle.fontWeight === 'bold' || this.textStyle.fontWeight === '700' || this.textStyle.fontWeight === '800' || this.textStyle.fontWeight === '900') {
      charWidth *= 1.1; // Bold text is wider
    }

    // Adjust for font family
    if (this.textStyle.fontFamily?.includes('monospace')) {
      charWidth = fontSize * 0.6; // Monospace is more predictable
    } else if (this.textStyle.fontFamily?.includes('serif')) {
      charWidth *= 1.05; // Serif fonts tend to be slightly wider
    }

    const maxCharsPerLine = Math.floor(containerWidth / charWidth);

    // Ensure we can fit at least one character
    if (maxCharsPerLine < 1) {
      return [text]; // Return as-is if container is too small
    }

    const words = text.split(' ');
    const lines: string[] = [];
    let currentLine = '';

    for (const word of words) {
      const testLine = currentLine ? `${currentLine} ${word}` : word;

      if (testLine.length > maxCharsPerLine && currentLine) {
        lines.push(currentLine);

        // Handle long words that exceed line length
        if (word.length > maxCharsPerLine) {
          const brokenParts = this.breakLongWordByChars(word, maxCharsPerLine);
          for (let i = 0; i < brokenParts.length - 1; i++) {
            lines.push(brokenParts[i]);
          }
          currentLine = brokenParts[brokenParts.length - 1];
        } else {
          currentLine = word;
        }

        // Check max lines limit
        if (this.maxLines > 0 && lines.length >= this.maxLines) {
          if (lines.length === this.maxLines) {
            const lastLine = lines[lines.length - 1];
            const maxCharsWithEllipsis = maxCharsPerLine - 3;
            if (lastLine.length > maxCharsWithEllipsis) {
              lines[lines.length - 1] = lastLine.slice(0, maxCharsWithEllipsis) + '...';
            }
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

    return lines.length > 0 ? lines : [''];
  }

  /**
   * Break a long word using canvas measurement
   */
  private breakLongWord(word: string, containerWidth: number, ctx: CanvasRenderingContext2D): string[] {
    if (word.length <= 1) return [word];

    const parts: string[] = [];
    let currentPart = '';

    for (const char of word) {
      const testPart = currentPart + char;
      const metrics = ctx.measureText(testPart);

      if (metrics.width > containerWidth && currentPart) {
        parts.push(currentPart);
        currentPart = char;
      } else {
        currentPart = testPart;
      }
    }

    if (currentPart) {
      parts.push(currentPart);
    }

    return parts.length > 0 ? parts : [word];
  }

  /**
   * Break a long word by character count (fallback)
   */
  private breakLongWordByChars(word: string, maxCharsPerLine: number): string[] {
    if (word.length <= maxCharsPerLine) return [word];

    const parts: string[] = [];
    for (let i = 0; i < word.length; i += maxCharsPerLine) {
      parts.push(word.slice(i, i + maxCharsPerLine));
    }

    return parts;
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
   * Get layout manager from render context or cached instance
   */
  private getLayoutManagerFromRenderContext(context: RenderContext): ResponsiveLayoutManager | undefined {
    // First try to get from render context (preferred)
    const contextLayoutManager = context.layoutManager as ResponsiveLayoutManager | undefined;
    if (contextLayoutManager) {
      return contextLayoutManager;
    }

    // Fallback to cached layout manager
    return this.getLayoutManager();
  }

  /**
   * Override invalidateLayout to clear cached metrics
   */
  protected invalidateLayout(): void {
    super.invalidateLayout();
    this.cachedMetrics = null;
    this.lastTextHash = null;

    console.log('🎯 ResponsiveTextShape: Layout invalidated, cached metrics cleared', {
      shapeId: this.id,
      hasLayoutManager: !!this.getLayoutManager(),
      responsive: this.responsive,
      hasTypography: !!this.typography,
      text: this.text.substring(0, 30) + '...'
    });
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
   * Update smart scaling configuration
   */
  public updateSmartScaling(enabled: boolean, context?: 'scripture' | 'song' | 'announcement' | 'title'): void {
    this.enableSmartScaling = enabled;
    if (context) {
      this.contentContext = context;
    }

    if (enabled && !this.smartTextScaler) {
      this.smartTextScaler = new SmartTextScaler();
    }

    this.invalidateTextCache();
    console.log('🧠 ResponsiveTextShape: Smart scaling updated', {
      enabled,
      context: this.contentContext
    });
  }

  /**
   * Get content analysis for the current text
   */
  public analyzeContent(): ContentCharacteristics | null {
    if (!this.smartTextScaler || !this.text.trim()) return null;
    return this.smartTextScaler.analyzeContent(this.text);
  }

  /**
   * Predict if current text will fit with given constraints
   */
  public predictTextFit(maxLines?: number): ReturnType<SmartTextScaler['predictTextFit']> | null {
    if (!this.smartTextScaler || !this.text.trim()) return null;

    const containerInfo = {
      width: this.size.width,
      height: this.size.height
    };

    const currentMetrics = this.cachedMetrics;
    if (!currentMetrics) return null;

    return this.smartTextScaler.predictTextFit(
      this.text,
      currentMetrics.fontSize,
      currentMetrics.lineHeight,
      containerInfo,
      maxLines || this.maxLines || undefined
    );
  }

  /**
   * Find the optimal font size that fits the content
   */
  public findOptimalFitSize(): ReturnType<SmartTextScaler['findOptimalFitSize']> | null {
    if (!this.smartTextScaler || !this.text.trim() || !this.typography) return null;

    const containerInfo = {
      width: this.size.width,
      height: this.size.height
    };

    return this.smartTextScaler.findOptimalFitSize(
      this.text,
      containerInfo,
      this.typography,
      this.contentContext,
      this.maxLines || undefined
    );
  }

  /**
   * Invalidate text-related caches
   */
  private invalidateTextCache(): void {
    this.cachedMetrics = null;
    this.lastTextHash = null;
  }
}