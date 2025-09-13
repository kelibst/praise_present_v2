import React from 'react';
import { 
  UniversalSlide, 
  TextElement, 
  TextZone, 
  MediaZone, 
  RichTextContent,
  TextFormatting,
  Rectangle,
  SlideTemplate 
} from './universalSlideSlice';
import { adaptiveTextSizing, TextMeasurement } from './adaptiveTextSizing';

export interface RenderContext {
  viewport: Rectangle;
  isPreview: boolean;
  scaleFactor: number;
  theme: 'light' | 'dark' | 'auto';
}

export interface RenderPipelineStage {
  name: string;
  priority: number;
  process: (slide: UniversalSlide, context: RenderContext) => Promise<UniversalSlide>;
}

export interface ValidationResult {
  isValid: boolean;
  warnings: string[];
  errors: string[];
  suggestions: string[];
}

export class UniversalContentRenderer {
  private pipeline: RenderPipelineStage[] = [];
  private cache: Map<string, any> = new Map();

  constructor() {
    this.registerDefaultPipelineStages();
  }

  /**
   * Main processing method that runs a slide through the complete pipeline
   */
  public async processSlide(slide: UniversalSlide, context: RenderContext): Promise<UniversalSlide> {
    try {
      // Run through render pipeline
      let processedSlide = slide;
      for (const stage of this.pipeline.sort((a, b) => a.priority - b.priority)) {
        processedSlide = await stage.process(processedSlide, context);
      }
      return processedSlide;
    } catch (error) {
      console.error('Processing error:', error);
      throw error;
    }
  }

  /**
   * Synchronous rendering method that generates React element from processed slide
   */
  public renderContent(slide: UniversalSlide, context: RenderContext): React.ReactElement {
    try {
      // Generate the React element synchronously
      return this.generateSlideElement(slide, context);
    } catch (error) {
      console.error('Rendering error:', error);
      return this.generateErrorSlide(error as Error, slide);
    }
  }

  /**
   * Generate preview content with optimized performance
   */
  public async previewContent(slide: UniversalSlide, context: RenderContext): Promise<React.ReactElement> {
    const previewContext = { ...context, isPreview: true };
    const processedSlide = await this.processSlide(slide, previewContext);
    return this.renderContent(processedSlide, previewContext);
  }

  /**
   * Validate slide content for completeness and performance
   */
  public validateContent(slide: UniversalSlide): ValidationResult {
    const result: ValidationResult = {
      isValid: true,
      warnings: [],
      errors: [],
      suggestions: []
    };

    // Validate basic structure
    if (!slide.id) {
      result.errors.push('Slide must have an ID');
      result.isValid = false;
    }

    if (!slide.content) {
      result.errors.push('Slide must have content');
      result.isValid = false;
    }

    // Validate template compatibility
    this.validateTemplateCompatibility(slide, result);

    // Validate text content
    this.validateTextContent(slide, result);

    // Performance checks
    this.validatePerformance(slide, result);

    return result;
  }

  private registerDefaultPipelineStages(): void {
    this.pipeline = [
      {
        name: 'content-analysis',
        priority: 1,
        process: async (slide, context) => this.analyzeContent(slide, context)
      },
      {
        name: 'template-application',
        priority: 2,
        process: async (slide, context) => this.applyTemplate(slide, context)
      },
      {
        name: 'text-sizing-layout',
        priority: 3,
        process: async (slide, context) => this.calculateTextSizing(slide, context)
      },
      {
        name: 'effects-animations',
        priority: 4,
        process: async (slide, context) => this.processEffects(slide, context)
      },
      {
        name: 'final-composition',
        priority: 5,
        process: async (slide, context) => this.finalizeComposition(slide, context)
      }
    ];
  }

  private async analyzeContent(slide: UniversalSlide, context: RenderContext): Promise<UniversalSlide> {
    // Analyze content structure and prepare for rendering
    const analysis = {
      textElementCount: 0,
      mediaElementCount: 0,
      totalCharacters: 0,
      complexity: 'low' as 'low' | 'medium' | 'high',
      estimatedRenderTime: 0
    };

    // Convert legacy content to RichTextContent if needed
    const richContent = this.convertToRichTextContent(slide);
    
    if (richContent.elements) {
      analysis.textElementCount = richContent.elements.length;
      analysis.totalCharacters = richContent.elements.reduce((sum, el) => sum + el.content.length, 0);
    }

    // Determine complexity
    if (analysis.textElementCount > 5 || analysis.totalCharacters > 1000) {
      analysis.complexity = 'high';
    } else if (analysis.textElementCount > 2 || analysis.totalCharacters > 300) {
      analysis.complexity = 'medium';
    }

    // Cache analysis results
    this.cache.set(`analysis_${slide.id}`, analysis);

    return slide;
  }

  private async applyTemplate(slide: UniversalSlide, context: RenderContext): Promise<UniversalSlide> {
    const template = slide.template;
    if (!template) return slide;

    // Apply template constraints and layout
    const processedSlide = { ...slide };
    
    // Map content to template zones
    const richContent = this.convertToRichTextContent(slide);
    const mappedElements = this.mapContentToZones(richContent.elements || [], template.textZones);

    // Update slide with mapped content
    processedSlide.content = {
      ...processedSlide.content,
      richTextContent: {
        ...richContent,
        elements: mappedElements
      }
    };

    return processedSlide;
  }

  private async calculateTextSizing(slide: UniversalSlide, context: RenderContext): Promise<UniversalSlide> {
    const richContent = this.convertToRichTextContent(slide);
    const template = slide.template;

    if (!richContent.elements || !template.textZones) {
      return slide;
    }

    // Calculate optimal sizes for all text elements
    const optimizedSizes = adaptiveTextSizing.adaptForMultipleElements(
      richContent.elements,
      template.textZones,
      context.viewport
    );

    // Apply calculated sizes
    const updatedElements = richContent.elements.map(element => ({
      ...element,
      formatting: {
        ...element.formatting,
        font: {
          ...element.formatting.font,
          size: optimizedSizes.get(element.id) || element.formatting.font.size
        }
      }
    }));

    return {
      ...slide,
      content: {
        ...slide.content,
        richTextContent: {
          ...richContent,
          elements: updatedElements
        }
      }
    };
  }

  private async processEffects(slide: UniversalSlide, context: RenderContext): Promise<UniversalSlide> {
    // Process animations and effects
    // For preview mode, disable expensive effects
    if (context.isPreview) {
      return slide;
    }

    // Apply entrance animations, transitions, etc.
    return slide;
  }

  private async finalizeComposition(slide: UniversalSlide, context: RenderContext): Promise<UniversalSlide> {
    // Final validation and optimization
    const validation = this.validateContent(slide);
    
    if (!validation.isValid) {
      console.warn('Slide validation failed:', validation.errors);
    }

    return slide;
  }

  private generateSlideElement(slide: UniversalSlide, context: RenderContext): React.ReactElement {
    const slideStyle: React.CSSProperties = {
      width: context.viewport.width,
      height: context.viewport.height,
      position: 'relative',
      overflow: 'hidden',
      transform: `scale(${context.scaleFactor})`,
      transformOrigin: 'top left'
    };

    // Generate background
    const backgroundElement = this.generateBackground(slide, context);
    
    // Generate content elements
    const contentElements = this.generateContentElements(slide, context);

    return React.createElement(
      'div',
      {
        className: 'universal-slide-container',
        style: slideStyle,
        'data-slide-id': slide.id,
        'data-slide-type': slide.type
      },
      backgroundElement,
      ...contentElements
    );
  }

  private generateBackground(slide: UniversalSlide, context: RenderContext): React.ReactElement {
    const bg = slide.background;
    const style: React.CSSProperties = {
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      zIndex: 0
    };

    switch (bg.type) {
      case 'solid':
        style.backgroundColor = bg.colors?.[0] || '#000000';
        break;
      case 'gradient':
        if (bg.colors && bg.colors.length >= 2) {
          style.background = `linear-gradient(135deg, ${bg.colors[0]}, ${bg.colors[1]})`;
        }
        break;
      case 'image':
        if (bg.imageUrl) {
          style.backgroundImage = `url(${bg.imageUrl})`;
          style.backgroundSize = 'cover';
          style.backgroundPosition = 'center';
          style.backgroundRepeat = 'no-repeat';
        }
        break;
    }

    style.opacity = bg.opacity;

    // Add overlay if specified
    const overlayElement = bg.overlay ? React.createElement('div', {
      style: {
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        backgroundColor: bg.overlay.color,
        opacity: bg.overlay.opacity,
        zIndex: 1
      }
    }) : null;

    return React.createElement(
      'div',
      { className: 'slide-background', style },
      overlayElement
    );
  }

  private generateContentElements(slide: UniversalSlide, context: RenderContext): React.ReactElement[] {
    const elements: React.ReactElement[] = [];
    const richContent = this.convertToRichTextContent(slide);

    if (richContent.elements && Array.isArray(richContent.elements)) {
      richContent.elements.forEach((element, index) => {
        const textElement = this.generateTextElement(element, context, index);
        elements.push(textElement);
      });
    }

    return elements;
  }

  private generateTextElement(element: TextElement, context: RenderContext, index: number): React.ReactElement {
    // Ensure element has required properties with safe defaults
    const position = element.position || { x: 0, y: 0, zIndex: 1 };
    const formatting = element.formatting || {};
    const font = formatting.font || {};
    const spacing = formatting.spacing || {};
    const alignment = formatting.alignment || {};
    const effects = formatting.effects || {};

    const style: React.CSSProperties = {
      position: 'absolute',
      left: position.x || 0,
      top: position.y || 0,
      width: position.width || 'auto',
      height: position.height || 'auto',
      zIndex: position.zIndex || index + 10,
      
      // Typography with safe defaults
      fontFamily: font.family || 'Arial, sans-serif',
      fontSize: typeof font.size === 'number' ? `${font.size}px` : font.size || '32px',
      fontWeight: font.weight || 'normal',
      fontStyle: font.style || 'normal',
      color: font.color || '#ffffff',
      
      // Spacing with safe defaults
      letterSpacing: typeof spacing.letterSpacing === 'number' ? `${spacing.letterSpacing}px` : 'normal',
      lineHeight: spacing.lineHeight || 1.4,
      wordSpacing: typeof spacing.wordSpacing === 'number' ? `${spacing.wordSpacing}px` : 'normal',
      
      // Alignment with safe defaults
      textAlign: (alignment.horizontal as any) || 'center',
      display: 'flex',
      alignItems: this.mapVerticalAlignment(alignment.vertical || 'middle'),
      justifyContent: this.mapHorizontalAlignment(alignment.horizontal || 'center'),
      
      // Layout control
      boxSizing: 'border-box',
      padding: '0 40px', // Add some horizontal padding for readability
      
      // Effects with safe defaults
      textShadow: effects.textShadow || '0 2px 4px rgba(0, 0, 0, 0.7)'
    };

    // Add stroke if specified
    if (font.strokeColor && font.strokeWidth) {
      style.WebkitTextStroke = `${font.strokeWidth}px ${font.strokeColor}`;
    }

    // Add transform effects
    if (effects.transform) {
      const transform = effects.transform;
      const transforms = [];
      if (transform.rotation) transforms.push(`rotate(${transform.rotation}deg)`);
      if (transform.scale) transforms.push(`scale(${transform.scale})`);
      if (transform.skewX) transforms.push(`skewX(${transform.skewX}deg)`);
      if (transform.skewY) transforms.push(`skewY(${transform.skewY}deg)`);
      
      if (transforms.length > 0) {
        style.transform = transforms.join(' ');
      }
    }

    const className = `text-element text-element-${element.type}`;

    return React.createElement(
      'div',
      {
        key: `text-element-${index}`,
        className,
        style,
        'data-element-id': element.id,
        'data-element-type': element.type
      },
      element.content
    );
  }

  private generateErrorSlide(error: Error, slide: UniversalSlide): React.ReactElement {
    return React.createElement(
      'div',
      {
        className: 'error-slide',
        style: {
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#1f1f1f',
          color: '#ff6b6b',
          fontFamily: 'Arial, sans-serif',
          padding: '2rem'
        }
      },
      React.createElement('h2', null, 'Rendering Error'),
      React.createElement('p', null, `Slide ID: ${slide.id}`),
      React.createElement('p', null, `Error: ${error.message}`),
      React.createElement('pre', 
        { style: { fontSize: '0.8rem', opacity: 0.7, marginTop: '1rem' } }, 
        error.stack
      )
    );
  }

  private convertToRichTextContent(slide: UniversalSlide): RichTextContent {
    // Convert legacy content structure to RichTextContent
    if (slide.content?.richTextContent) {
      return slide.content.richTextContent;
    }

    // Create default RichTextContent from legacy content
    const elements: TextElement[] = [];
    
    // Handle different slide types
    switch (slide.type) {
      case 'scripture':
        elements.push(this.createTextElement('heading', slide.title || '', slide.textFormatting, 0));
        if (slide.content?.verses) {
          const verseText = slide.content.verses.map((v: any) => v.text).join(' ');
          elements.push(this.createTextElement('verse', verseText, slide.textFormatting, 1));
        }
        break;
        
      case 'song':
        elements.push(this.createTextElement('heading', slide.title || '', slide.textFormatting, 0));
        if (slide.content?.lyrics) {
          elements.push(this.createTextElement('text', slide.content.lyrics, slide.textFormatting, 1));
        }
        break;
        
      default:
        elements.push(this.createTextElement('text', slide.content?.text || slide.title || '', slide.textFormatting, 0));
        break;
    }

    return {
      elements,
      formatRules: [],
      positioning: {
        containerBounds: { x: 0, y: 0, width: 1920, height: 1080 },
        contentFlow: 'vertical',
        spacing: {
          between: 20,
          padding: { top: 40, right: 40, bottom: 40, left: 40 },
          margin: { top: 0, right: 0, bottom: 0, left: 0 }
        },
        overflow: 'auto-scale'
      },
      metadata: {
        version: '1.0',
        lastModified: new Date().toISOString(),
        wordCount: elements.reduce((sum, el) => sum + el.content.split(' ').length, 0),
        estimatedReadTime: elements.reduce((sum, el) => sum + el.content.length / 200, 0)
      }
    };
  }

  private createTextElement(type: TextElement['type'], content: string, baseFormatting?: TextFormatting, index = 0): TextElement {
    // Provide safe default formatting if none provided
    const defaultFormatting: TextFormatting = {
      font: {
        family: 'Arial, sans-serif',
        size: 32,
        weight: 'normal',
        style: 'normal',
        color: '#ffffff'
      },
      spacing: {
        lineHeight: 1.4,
        letterSpacing: 1,
        wordSpacing: 1,
        paragraphSpacing: 16
      },
      alignment: {
        horizontal: 'center',
        vertical: 'middle'
      },
      effects: {
        textShadow: '0 2px 4px rgba(0, 0, 0, 0.7)'
      }
    };

    // Create better default positioning based on element type and index
    const getDefaultPosition = (elementType: TextElement['type'], elementIndex: number) => {
      const baseY = 100; // Start positioning from top
      const lineHeight = 80; // Space between elements
      
      switch (elementType) {
        case 'heading':
          return { x: 0, y: baseY, width: 1920, height: 80, zIndex: 1 };
        case 'text':
        case 'verse':
          return { x: 0, y: baseY + (elementIndex * lineHeight), width: 1920, height: 60, zIndex: 1 };
        default:
          return { x: 0, y: baseY + (elementIndex * lineHeight), width: 1920, height: 50, zIndex: 1 };
      }
    };

    return {
      id: `element_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
      type,
      content: content || '',
      formatting: this.adaptFormattingForElement(baseFormatting || defaultFormatting, type),
      position: getDefaultPosition(type, index),
      alignment: { horizontal: 'center', vertical: 'middle' },
      constraints: { autoResize: true, preserveAspectRatio: false }
    };
  }

  private adaptFormattingForElement(baseFormatting: TextFormatting, elementType: TextElement['type']): TextFormatting {
    // Deep copy with safe defaults
    const adapted: TextFormatting = {
      font: {
        family: baseFormatting.font?.family || 'Arial, sans-serif',
        size: baseFormatting.font?.size || 32,
        weight: baseFormatting.font?.weight || 'normal',
        style: baseFormatting.font?.style || 'normal',
        color: baseFormatting.font?.color || '#ffffff'
      },
      spacing: {
        lineHeight: baseFormatting.spacing?.lineHeight || 1.4,
        letterSpacing: baseFormatting.spacing?.letterSpacing || 1,
        wordSpacing: baseFormatting.spacing?.wordSpacing || 1,
        paragraphSpacing: baseFormatting.spacing?.paragraphSpacing || 16
      },
      alignment: {
        horizontal: baseFormatting.alignment?.horizontal || 'center',
        vertical: baseFormatting.alignment?.vertical || 'middle'
      },
      effects: {
        textShadow: baseFormatting.effects?.textShadow || '0 2px 4px rgba(0, 0, 0, 0.7)'
      }
    };
    
    // Adjust formatting based on element type
    switch (elementType) {
      case 'heading':
        adapted.font.weight = 'bold';
        // Increase font size for headings
        adapted.font.size = (typeof adapted.font.size === 'number' ? adapted.font.size : 32) * 1.5;
        break;
      case 'emphasis':
        adapted.font.weight = 'bold';
        break;
      case 'verse':
        adapted.spacing.lineHeight = adapted.spacing.lineHeight * 1.2;
        break;
    }
    
    return adapted;
  }

  private mapContentToZones(elements: TextElement[], zones: TextZone[]): TextElement[] {
    if (!elements || !zones || !zones.length) return elements || [];

    return elements.map((element, index) => {
      // Find appropriate zone for this element with safe null checks
      const zone = zones.find(z => 
        z?.contentRules?.allowedTypes && 
        Array.isArray(z.contentRules.allowedTypes) &&
        z.contentRules.allowedTypes.includes(element.type)
      ) || zones[0];
      
      // Ensure zone and zone.bounds exist
      if (!zone || !zone.bounds) {
        return element;
      }
      
      // Update element position to fit within zone
      return {
        ...element,
        position: {
          ...element.position,
          x: zone.bounds.x || 0,
          y: (zone.bounds.y || 0) + (index * 50), // Basic vertical stacking
          width: zone.bounds.width || undefined,
          height: zones.length > 0 ? (zone.bounds.height || 100) / zones.length : zone.bounds.height || 100
        }
      };
    });
  }

  private mapVerticalAlignment(alignment: 'top' | 'middle' | 'bottom'): string {
    switch (alignment) {
      case 'top': return 'flex-start';
      case 'middle': return 'center';
      case 'bottom': return 'flex-end';
      default: return 'center';
    }
  }

  private mapHorizontalAlignment(alignment: 'left' | 'center' | 'right' | 'justify'): string {
    switch (alignment) {
      case 'left': return 'flex-start';
      case 'center': return 'center';
      case 'right': return 'flex-end';
      case 'justify': return 'space-between';
      default: return 'center';
    }
  }

  private validateTemplateCompatibility(slide: UniversalSlide, result: ValidationResult): void {
    const template = slide.template;
    if (!template) {
      result.warnings.push('No template specified for slide');
      return;
    }

    // Check if slide type is compatible with template category
    const compatibleCategories = this.getCompatibleCategories(slide.type);
    if (!compatibleCategories.includes(template.category)) {
      result.warnings.push(`Template category '${template.category}' may not be optimal for slide type '${slide.type}'`);
    }
  }

  private validateTextContent(slide: UniversalSlide, result: ValidationResult): void {
    const richContent = this.convertToRichTextContent(slide);
    
    richContent.elements.forEach((element, index) => {
      if (!element.content.trim()) {
        result.warnings.push(`Text element ${index + 1} is empty`);
      }
      
      if (element.content.length > 500) {
        result.warnings.push(`Text element ${index + 1} may be too long for optimal display`);
      }
    });
  }

  private validatePerformance(slide: UniversalSlide, result: ValidationResult): void {
    const analysis = this.cache.get(`analysis_${slide.id}`);
    if (!analysis) return;

    if (analysis.complexity === 'high') {
      result.warnings.push('Slide has high complexity and may render slowly');
      result.suggestions.push('Consider breaking complex slides into multiple simpler slides');
    }

    if (analysis.textElementCount > 8) {
      result.suggestions.push('Consider reducing the number of text elements for better readability');
    }
  }

  private getCompatibleCategories(slideType: string): string[] {
    const compatibility: Record<string, string[]> = {
      'scripture': ['verse', 'content', 'text-heavy'],
      'song': ['song', 'content', 'text-heavy'],
      'announcement': ['content', 'title-focus', 'balanced'],
      'note': ['content', 'minimal'],
      'media': ['media', 'balanced']
    };
    
    return compatibility[slideType] || ['content'];
  }
}

export const universalContentRenderer = new UniversalContentRenderer();