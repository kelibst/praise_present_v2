import { TypographyScaler, TypographyScaleMode } from './TypographyScaler';
import { ResponsiveLayoutManager, ContainerInfo } from './ResponsiveLayoutManager';
import { TypographyConfig } from '../types/responsive';

/**
 * Content characteristics for intelligent scaling
 */
export interface ContentCharacteristics {
  wordCount: number;
  characterCount: number;
  averageWordLength: number;
  hasLongWords: boolean;
  complexity: number; // 0-1 scale
  density: number; // characters per area unit
  readabilityScore?: number;
}

/**
 * Smart scaling configuration
 */
export interface SmartScalingConfig {
  baseSize: number;
  minSize: number;
  maxSize: number;
  targetDensity: number; // characters per 1000px²
  readabilityWeight: number; // 0-1, how much to prioritize readability
  compactnesWeight: number; // 0-1, how much to prioritize fitting content

  // Content-specific scaling factors
  scalingFactors: {
    shortText: number;    // < 20 words
    mediumText: number;   // 20-100 words
    longText: number;     // > 100 words
    veryLongText: number; // > 300 words
  };

  // Contextual adjustments
  contexts: {
    scripture: { factor: number; minLineHeight: number };
    song: { factor: number; emphasizeBold: boolean };
    announcement: { factor: number; maxLines: number };
    title: { factor: number; allowOverflow: boolean };
  };
}

/**
 * Default smart scaling configuration optimized for church presentations
 */
export const DEFAULT_SMART_SCALING_CONFIG: SmartScalingConfig = {
  baseSize: 48,
  minSize: 16,
  maxSize: 120,
  targetDensity: 15, // 15 chars per 1000px²
  readabilityWeight: 0.7,
  compactnesWeight: 0.3,

  scalingFactors: {
    shortText: 1.4,     // Make short text larger for impact
    mediumText: 1.0,    // Standard scaling
    longText: 0.85,     // Reduce size to fit more content
    veryLongText: 0.7   // Significantly reduce for readability
  },

  contexts: {
    scripture: {
      factor: 1.1,        // Slightly larger for readability
      minLineHeight: 1.6  // Better line spacing for scripture
    },
    song: {
      factor: 1.2,        // Larger for singing along
      emphasizeBold: true // Make choruses stand out
    },
    announcement: {
      factor: 0.9,        // Smaller to fit more info
      maxLines: 8         // Limit to prevent crowding
    },
    title: {
      factor: 1.8,        // Much larger for titles
      allowOverflow: false // Ensure titles fit
    }
  }
};

/**
 * Advanced text scaler that intelligently adjusts font sizes based on content characteristics
 */
export class SmartTextScaler {
  private typographyScaler: TypographyScaler;
  private config: SmartScalingConfig;

  constructor(config: Partial<SmartScalingConfig> = {}) {
    this.config = { ...DEFAULT_SMART_SCALING_CONFIG, ...config };
    this.typographyScaler = new TypographyScaler({
      mode: TypographyScaleMode.FLUID,
      minScale: this.config.minSize / this.config.baseSize,
      maxScale: this.config.maxSize / this.config.baseSize
    });
  }

  /**
   * Analyze text content to determine scaling characteristics
   */
  public analyzeContent(text: string): ContentCharacteristics {
    const words = text.trim().split(/\s+/).filter(word => word.length > 0);
    const wordCount = words.length;
    const characterCount = text.length;
    const averageWordLength = wordCount > 0 ? characterCount / wordCount : 0;

    // Detect long words (> 12 characters) that might cause layout issues
    const hasLongWords = words.some(word => word.length > 12);

    // Calculate complexity based on word variety and sentence structure
    const uniqueWords = new Set(words.map(word => word.toLowerCase()));
    const vocabulary = uniqueWords.size / Math.max(wordCount, 1);
    const sentenceCount = (text.match(/[.!?]+/g) || []).length;
    const avgWordsPerSentence = sentenceCount > 0 ? wordCount / sentenceCount : wordCount;

    const complexity = Math.min(1, (vocabulary * 0.5) + (avgWordsPerSentence / 20 * 0.3) + (hasLongWords ? 0.2 : 0));

    // Calculate base density (will be adjusted by container)
    const density = characterCount / 1000; // per 1000px² as baseline

    return {
      wordCount,
      characterCount,
      averageWordLength,
      hasLongWords,
      complexity,
      density
    };
  }

  /**
   * Calculate optimal font size based on content and container
   */
  public calculateOptimalSize(
    text: string,
    container: ContainerInfo,
    typography: TypographyConfig,
    context: keyof SmartScalingConfig['contexts'] = 'scripture'
  ): {
    fontSize: number;
    lineHeight: number;
    confidence: number; // 0-1 how confident we are in this size
    adjustmentReason: string[];
    metrics: ContentCharacteristics;
  } {
    const metrics = this.analyzeContent(text);
    const contextConfig = this.config.contexts[context];
    const reasons: string[] = [];

    // Start with base size
    let fontSize = this.config.baseSize;
    reasons.push(`Started with base size ${fontSize}px`);

    // Apply context factor
    fontSize *= contextConfig.factor;
    reasons.push(`Applied ${context} context factor: ${contextConfig.factor}x`);

    // Apply content-length scaling
    const lengthFactor = this.getContentLengthFactor(metrics.wordCount);
    fontSize *= lengthFactor;
    reasons.push(`Applied content length factor for ${metrics.wordCount} words: ${lengthFactor}x`);

    // Calculate container area and target density
    const containerArea = container.width * container.height;
    const actualDensity = metrics.characterCount / (containerArea / 1000);
    const densityRatio = actualDensity / this.config.targetDensity;

    if (densityRatio > 1.2) {
      // Content is too dense, scale down
      const densityAdjustment = Math.pow(densityRatio, -0.4);
      fontSize *= densityAdjustment;
      reasons.push(`Reduced for high density (${actualDensity.toFixed(1)} chars/1000px²): ${densityAdjustment.toFixed(2)}x`);
    } else if (densityRatio < 0.5) {
      // Content is sparse, can scale up
      const densityAdjustment = Math.pow(densityRatio, -0.2);
      fontSize *= densityAdjustment;
      reasons.push(`Increased for low density (${actualDensity.toFixed(1)} chars/1000px²): ${densityAdjustment.toFixed(2)}x`);
    }

    // Adjust for content complexity
    if (metrics.complexity > 0.7) {
      fontSize *= 1.1; // Slightly larger for complex content
      reasons.push(`Increased for high complexity: ${metrics.complexity.toFixed(2)}`);
    }

    // Adjust for long words
    if (metrics.hasLongWords) {
      fontSize *= 0.95; // Slightly smaller to prevent overflow
      reasons.push('Reduced for long words');
    }

    // Apply readability vs compactness weighting
    const readabilityBonus = this.config.readabilityWeight * 1.1;
    const compactnessBonus = this.config.compactnesWeight * 0.9;
    const balanceFactor = readabilityBonus + compactnessBonus;
    fontSize *= balanceFactor;
    reasons.push(`Applied readability/compactness balance: ${balanceFactor.toFixed(2)}x`);

    // Ensure within bounds
    const originalFontSize = fontSize;
    fontSize = Math.max(this.config.minSize, Math.min(this.config.maxSize, fontSize));

    if (fontSize !== originalFontSize) {
      reasons.push(`Clamped to bounds: ${this.config.minSize}-${this.config.maxSize}px`);
    }

    // Calculate line height based on context and font size
    let lineHeight = this.calculateLineHeight(fontSize, context, metrics);

    // Calculate confidence based on how many adjustments were needed
    const majorAdjustments = reasons.filter(r =>
      r.includes('density') || r.includes('complexity') || r.includes('Clamped')
    ).length;
    const confidence = Math.max(0.3, 1 - (majorAdjustments * 0.2));

    return {
      fontSize: Math.round(fontSize),
      lineHeight,
      confidence,
      adjustmentReason: reasons,
      metrics
    };
  }

  /**
   * Get scaling factor based on content length
   */
  private getContentLengthFactor(wordCount: number): number {
    if (wordCount < 20) {
      return this.config.scalingFactors.shortText;
    } else if (wordCount < 100) {
      return this.config.scalingFactors.mediumText;
    } else if (wordCount < 300) {
      return this.config.scalingFactors.longText;
    } else {
      return this.config.scalingFactors.veryLongText;
    }
  }

  /**
   * Calculate optimal line height
   */
  private calculateLineHeight(
    fontSize: number,
    context: keyof SmartScalingConfig['contexts'],
    metrics: ContentCharacteristics
  ): number {
    const contextConfig = this.config.contexts[context];
    let baseLineHeight = 1.4; // Default line height ratio

    // Context-specific line heights
    if (context === 'scripture' && contextConfig.minLineHeight) {
      baseLineHeight = Math.max(baseLineHeight, contextConfig.minLineHeight);
    } else if (context === 'song') {
      baseLineHeight = 1.5; // More spacing for singing
    } else if (context === 'announcement') {
      baseLineHeight = 1.3; // Tighter for more content
    } else if (context === 'title') {
      baseLineHeight = 1.2; // Tighter for impact
    }

    // Adjust based on font size
    if (fontSize < 24) {
      baseLineHeight += 0.1; // More spacing for small text
    } else if (fontSize > 72) {
      baseLineHeight -= 0.1; // Less spacing for large text
    }

    // Adjust for complexity
    if (metrics.complexity > 0.8) {
      baseLineHeight += 0.1; // More spacing for complex content
    }

    return Math.round(fontSize * baseLineHeight);
  }

  /**
   * Predict if text will fit in container with given settings
   */
  public predictTextFit(
    text: string,
    fontSize: number,
    lineHeight: number,
    container: ContainerInfo,
    maxLines?: number
  ): {
    willFit: boolean;
    estimatedLines: number;
    estimatedHeight: number;
    overflowBy: number;
    confidence: number;
  } {
    const metrics = this.analyzeContent(text);

    // Estimate character width (rough approximation)
    const avgCharWidth = fontSize * 0.6; // Typical ratio for most fonts
    const charsPerLine = Math.floor(container.width / avgCharWidth);
    const estimatedLines = Math.ceil(metrics.characterCount / charsPerLine);
    const estimatedHeight = estimatedLines * lineHeight;

    const willFit = maxLines
      ? estimatedLines <= maxLines && estimatedHeight <= container.height
      : estimatedHeight <= container.height;

    const overflowBy = Math.max(0, estimatedHeight - container.height);

    // Confidence based on estimation accuracy (lower for very long or complex text)
    const confidence = Math.max(0.4, 1 - (metrics.complexity * 0.3) - (estimatedLines > 10 ? 0.2 : 0));

    return {
      willFit,
      estimatedLines,
      estimatedHeight,
      overflowBy,
      confidence
    };
  }

  /**
   * Find the largest font size that fits the content
   */
  public findOptimalFitSize(
    text: string,
    container: ContainerInfo,
    typography: TypographyConfig,
    context: keyof SmartScalingConfig['contexts'] = 'scripture',
    maxLines?: number
  ): {
    fontSize: number;
    lineHeight: number;
    fitAnalysis: ReturnType<typeof this.predictTextFit>;
    iterations: number;
  } {
    let iterations = 0;
    const maxIterations = 10;

    // Start with optimal size
    let result = this.calculateOptimalSize(text, container, typography, context);
    let { fontSize, lineHeight } = result;

    // Binary search for best fit
    let minSize = this.config.minSize;
    let maxSize = fontSize;

    while (iterations < maxIterations) {
      iterations++;

      const fitAnalysis = this.predictTextFit(text, fontSize, lineHeight, container, maxLines);

      if (fitAnalysis.willFit) {
        // Try larger size
        minSize = fontSize;
        fontSize = Math.min(maxSize, fontSize * 1.1);
      } else {
        // Reduce size
        maxSize = fontSize;
        fontSize = Math.max(minSize, fontSize * 0.9);
      }

      lineHeight = this.calculateLineHeight(fontSize, context, result.metrics);

      // Check for convergence
      if (Math.abs(maxSize - minSize) < 1) {
        break;
      }
    }

    const finalFitAnalysis = this.predictTextFit(text, fontSize, lineHeight, container, maxLines);

    return {
      fontSize: Math.round(fontSize),
      lineHeight: Math.round(lineHeight),
      fitAnalysis: finalFitAnalysis,
      iterations
    };
  }

  /**
   * Get recommended settings for different content types
   */
  public getRecommendedSettings(contentType: 'title' | 'verse' | 'chorus' | 'bridge' | 'announcement'): Partial<SmartScalingConfig> {
    switch (contentType) {
      case 'title':
        return {
          readabilityWeight: 0.3,
          compactnesWeight: 0.7,
          scalingFactors: {
            shortText: 2.0,
            mediumText: 1.5,
            longText: 1.2,
            veryLongText: 1.0
          }
        };

      case 'verse':
        return {
          readabilityWeight: 0.8,
          compactnesWeight: 0.2,
          targetDensity: 12
        };

      case 'chorus':
        return {
          readabilityWeight: 0.6,
          compactnesWeight: 0.4,
          scalingFactors: {
            shortText: 1.6,
            mediumText: 1.3,
            longText: 1.1,
            veryLongText: 0.9
          }
        };

      case 'bridge':
        return {
          readabilityWeight: 0.7,
          compactnesWeight: 0.3,
          targetDensity: 10
        };

      case 'announcement':
        return {
          readabilityWeight: 0.5,
          compactnesWeight: 0.5,
          targetDensity: 18,
          scalingFactors: {
            shortText: 1.2,
            mediumText: 1.0,
            longText: 0.8,
            veryLongText: 0.65
          }
        };

      default:
        return {};
    }
  }

  /**
   * Update scaling configuration
   */
  public updateConfig(updates: Partial<SmartScalingConfig>): void {
    this.config = { ...this.config, ...updates };
  }

  /**
   * Get current configuration
   */
  public getConfig(): SmartScalingConfig {
    return { ...this.config };
  }
}