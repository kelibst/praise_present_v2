import {
  FlexibleValue,
  ContainerInfo,
  TypographyConfig,
  parseFlexibleValue
} from '../types/responsive';

/**
 * Typography scaling modes
 */
export enum TypographyScaleMode {
  LINEAR = 'linear',           // Linear scaling with container size
  LOGARITHMIC = 'logarithmic', // Logarithmic scaling (smaller changes at larger sizes)
  STEPPED = 'stepped',         // Discrete steps based on breakpoints
  FLUID = 'fluid'             // CSS clamp()-like fluid scaling
}

/**
 * Typography scale configuration
 */
export interface TypographyScaleConfig {
  mode: TypographyScaleMode;
  minScale: number; // Minimum scale factor (0.5 = 50% of base size)
  maxScale: number; // Maximum scale factor (2.0 = 200% of base size)
  referenceWidth: number; // Reference container width (typically 1920)
  referenceHeight: number; // Reference container height (typically 1080)
}

/**
 * Typography metrics for readability analysis
 */
export interface TypographyMetrics {
  fontSize: number;
  lineHeight: number;
  characterWidth: number; // Average character width
  charactersPerLine: number; // Optimal characters per line for readability
  linesPerContainer: number; // How many lines fit in container
  readabilityScore: number; // 0-1 score for readability
}

/**
 * Handles intelligent typography scaling and readability optimization
 */
export class TypographyScaler {
  private scaleConfig: TypographyScaleConfig;

  constructor(scaleConfig: Partial<TypographyScaleConfig> = {}) {
    this.scaleConfig = {
      mode: TypographyScaleMode.FLUID,
      minScale: 0.5,
      maxScale: 3.0,
      referenceWidth: 1920,
      referenceHeight: 1080,
      ...scaleConfig
    };
  }

  /**
   * Calculate optimal font size based on container and content requirements
   */
  public calculateFontSize(
    baseTypography: TypographyConfig,
    container: ContainerInfo,
    contentLength?: number
  ): number {
    const baseSize = this.parseBaseSize(baseTypography.baseSize);
    const scaleRatio = this.calculateScaleRatio(container);

    let scaledSize = baseSize * scaleRatio;

    // Apply additional scaling based on content length
    if (contentLength !== undefined) {
      const contentScale = this.calculateContentScale(contentLength, container);
      scaledSize *= contentScale;
    }

    // Apply constraints
    scaledSize = Math.max(baseTypography.minSize, scaledSize);
    scaledSize = Math.min(baseTypography.maxSize, scaledSize);

    return Math.round(scaledSize);
  }

  /**
   * Calculate optimal line height based on font size and container
   */
  public calculateLineHeight(
    fontSize: number,
    typography: TypographyConfig,
    container: ContainerInfo
  ): number {
    const baseLineHeight = fontSize * typography.lineHeightRatio;

    // Adjust line height based on container size for better readability
    const containerRatio = Math.min(container.width, container.height) / 1000;
    const adjustmentFactor = Math.max(0.9, Math.min(1.2, containerRatio));

    return baseLineHeight * adjustmentFactor;
  }

  /**
   * Get typography metrics for analysis and optimization
   */
  public getTypographyMetrics(
    fontSize: number,
    lineHeight: number,
    container: ContainerInfo,
    textContent?: string
  ): TypographyMetrics {
    // Estimate average character width (rough approximation)
    const characterWidth = fontSize * 0.6; // Most fonts have ~0.6 ratio

    // Calculate optimal characters per line for readability (45-75 chars)
    const containerWidth = container.width * 0.8; // Assume 80% width usage
    const maxCharactersPerLine = Math.floor(containerWidth / characterWidth);
    const optimalCharactersPerLine = Math.max(45, Math.min(75, maxCharactersPerLine));

    // Calculate how many lines fit in container
    const usableHeight = container.height * 0.9; // Assume 90% height usage
    const linesPerContainer = Math.floor(usableHeight / lineHeight);

    // Calculate readability score (simplified heuristic)
    const readabilityScore = this.calculateReadabilityScore(
      fontSize,
      lineHeight,
      optimalCharactersPerLine,
      container
    );

    return {
      fontSize,
      lineHeight,
      characterWidth,
      charactersPerLine: optimalCharactersPerLine,
      linesPerContainer,
      readabilityScore
    };
  }

  /**
   * Optimize typography for maximum readability
   */
  public optimizeForReadability(
    baseTypography: TypographyConfig,
    container: ContainerInfo,
    textContent?: string,
    maxIterations: number = 5
  ): { fontSize: number; lineHeight: number; metrics: TypographyMetrics } {
    let bestFontSize = this.calculateFontSize(baseTypography, container, textContent?.length);
    let bestLineHeight = this.calculateLineHeight(bestFontSize, baseTypography, container);
    let bestMetrics = this.getTypographyMetrics(bestFontSize, bestLineHeight, container, textContent);

    // Iteratively optimize
    for (let i = 0; i < maxIterations; i++) {
      // Try smaller and larger sizes
      const variations = [
        bestFontSize * 0.9,
        bestFontSize * 1.1,
        bestFontSize * 0.95,
        bestFontSize * 1.05
      ];

      for (const variation of variations) {
        if (variation < baseTypography.minSize || variation > baseTypography.maxSize) {
          continue;
        }

        const lineHeight = this.calculateLineHeight(variation, baseTypography, container);
        const metrics = this.getTypographyMetrics(variation, lineHeight, container, textContent);

        if (metrics.readabilityScore > bestMetrics.readabilityScore) {
          bestFontSize = variation;
          bestLineHeight = lineHeight;
          bestMetrics = metrics;
        }
      }
    }

    return {
      fontSize: Math.round(bestFontSize),
      lineHeight: Math.round(bestLineHeight),
      metrics: bestMetrics
    };
  }

  /**
   * Calculate scale ratio based on container size and scaling mode
   */
  private calculateScaleRatio(container: ContainerInfo): number {
    const { mode, referenceWidth, referenceHeight, minScale, maxScale } = this.scaleConfig;

    // Calculate size ratio compared to reference
    const widthRatio = container.width / referenceWidth;
    const heightRatio = container.height / referenceHeight;
    const sizeRatio = Math.min(widthRatio, heightRatio); // Use smaller dimension

    let scaleRatio: number;

    switch (mode) {
      case TypographyScaleMode.LINEAR:
        scaleRatio = sizeRatio;
        break;

      case TypographyScaleMode.LOGARITHMIC:
        // Logarithmic scaling reduces the impact of very large or small screens
        scaleRatio = sizeRatio > 1
          ? 1 + Math.log(sizeRatio) / Math.log(2) * 0.3
          : Math.pow(sizeRatio, 0.7);
        break;

      case TypographyScaleMode.STEPPED:
        // Discrete steps for consistent sizing
        if (sizeRatio < 0.5) scaleRatio = 0.5;
        else if (sizeRatio < 0.75) scaleRatio = 0.75;
        else if (sizeRatio < 1.25) scaleRatio = 1.0;
        else if (sizeRatio < 1.75) scaleRatio = 1.5;
        else scaleRatio = 2.0;
        break;

      case TypographyScaleMode.FLUID:
        // CSS clamp()-like behavior with smooth transitions
        const clampMin = minScale;
        const clampMax = maxScale;
        const clampRatio = (sizeRatio - 0.5) / (2.0 - 0.5); // Normalize to 0-1
        scaleRatio = clampMin + (clampMax - clampMin) * Math.max(0, Math.min(1, clampRatio));
        break;

      default:
        scaleRatio = sizeRatio;
    }

    return Math.max(minScale, Math.min(maxScale, scaleRatio));
  }

  /**
   * Calculate content-based scaling factor
   */
  private calculateContentScale(contentLength: number, container: ContainerInfo): number {
    // Longer content might need smaller font to fit better
    const containerArea = container.width * container.height;
    const contentDensity = contentLength / containerArea * 1000000; // Normalize

    if (contentDensity > 50) {
      return 0.85; // Reduce font size for dense content
    } else if (contentDensity < 10) {
      return 1.15; // Increase font size for sparse content
    }

    return 1.0; // No adjustment needed
  }

  /**
   * Calculate readability score (0-1, higher is better)
   */
  private calculateReadabilityScore(
    fontSize: number,
    lineHeight: number,
    charactersPerLine: number,
    container: ContainerInfo
  ): number {
    let score = 1.0;

    // Font size scoring (prefer sizes between 16-48px)
    if (fontSize < 12 || fontSize > 72) {
      score *= 0.5;
    } else if (fontSize < 16 || fontSize > 48) {
      score *= 0.8;
    }

    // Line height scoring (prefer 1.2-1.6 ratio)
    const lineHeightRatio = lineHeight / fontSize;
    if (lineHeightRatio < 1.0 || lineHeightRatio > 2.0) {
      score *= 0.6;
    } else if (lineHeightRatio < 1.2 || lineHeightRatio > 1.6) {
      score *= 0.9;
    }

    // Characters per line scoring (prefer 45-75 characters)
    if (charactersPerLine < 30 || charactersPerLine > 100) {
      score *= 0.7;
    } else if (charactersPerLine < 45 || charactersPerLine > 75) {
      score *= 0.9;
    }

    // Container utilization scoring (prefer good space usage)
    const utilizationRatio = (fontSize * charactersPerLine * lineHeight) / (container.width * container.height);
    if (utilizationRatio < 0.1 || utilizationRatio > 0.8) {
      score *= 0.8;
    }

    return Math.max(0, Math.min(1, score));
  }

  /**
   * Parse base size from flexible value
   */
  private parseBaseSize(baseSize: FlexibleValue): number {
    // For now, convert to pixels using default assumptions
    // In real usage, this would use ResponsiveLayoutManager
    switch (baseSize.unit) {
      case 'px':
        return baseSize.value;
      case 'rem':
        return baseSize.value * 16; // Assume 16px base
      case 'em':
        return baseSize.value * 16; // Assume 16px base
      case 'vw':
        return (baseSize.value / 100) * 1920; // Assume 1920px width
      case 'vh':
        return (baseSize.value / 100) * 1080; // Assume 1080px height
      default:
        return baseSize.value;
    }
  }

  /**
   * Update scale configuration
   */
  public updateScaleConfig(config: Partial<TypographyScaleConfig>): void {
    this.scaleConfig = { ...this.scaleConfig, ...config };
  }

  /**
   * Get current scale configuration
   */
  public getScaleConfig(): TypographyScaleConfig {
    return { ...this.scaleConfig };
  }
}