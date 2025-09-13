import { RenderingEngine } from './RenderingEngine';
import { GeneratedSlide } from '../SlideGenerator';
import { convertContentToSlide, validateSlideStructure } from '../utils/slideConverter';
import { DEFAULT_SLIDE_SIZE } from '../templates/templateUtils';
import { Shape } from './Shape';
import { createColor } from '../types/geometry';
import { TextShape } from '../shapes/TextShape';
import { BackgroundShape } from '../shapes/BackgroundShape';

/**
 * SlideRenderer provides a unified, consistent way to render slides
 * across all components (preview, live display, etc.)
 *
 * This ensures that the same content always looks identical regardless
 * of where it's being rendered.
 */
export class SlideRenderer {
  private renderingEngine: RenderingEngine;
  private slideSize: { width: number; height: number };
  private currentSlide: GeneratedSlide | null = null;
  private renderCallbacks: Set<() => void> = new Set();

  constructor(
    renderingEngine: RenderingEngine,
    slideSize: { width: number; height: number } = DEFAULT_SLIDE_SIZE
  ) {
    this.renderingEngine = renderingEngine;
    this.slideSize = slideSize;
  }

  /**
   * Renders any content type using the unified slide conversion system
   * This is the main entry point that ensures consistent rendering
   */
  public renderContent(content: any): GeneratedSlide {
    try {
      // Convert content to unified slide structure
      const slide = convertContentToSlide(content, this.slideSize);

      // Validate slide structure
      const validation = validateSlideStructure(slide);
      if (!validation.valid) {
        console.warn('SlideRenderer: Invalid slide structure:', validation.errors);
        // Continue with rendering but log issues
      }

      // Store current slide for reference
      this.currentSlide = slide;

      // Render the slide
      this.renderSlide(slide);

      // Notify callbacks
      this.notifyRenderCallbacks();

      console.log(`SlideRenderer: Rendered slide with ${slide.shapes.length} shapes (${slide.contentId})`);

      return slide;

    } catch (error) {
      console.error('SlideRenderer: Failed to render content:', error);
      return this.renderErrorSlide(`Rendering Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Renders a pre-generated slide directly
   */
  public renderSlide(slide: GeneratedSlide): void {
    try {
      // Clear previous content
      this.renderingEngine.clearShapes();

      // Add all shapes from the slide
      for (const shape of slide.shapes) {
        try {
          this.renderingEngine.addShape(shape);
        } catch (shapeError) {
          console.warn('SlideRenderer: Failed to add shape:', shapeError);
          // Continue with remaining shapes
        }
      }

      // Store as current slide
      this.currentSlide = slide;

      // Trigger render
      this.renderingEngine.render();

      // Notify callbacks
      this.notifyRenderCallbacks();

    } catch (error) {
      console.error('SlideRenderer: Failed to render slide:', error);
      this.renderErrorSlide('Failed to render slide');
    }
  }

  /**
   * Creates and renders an error slide for when rendering fails
   */
  private renderErrorSlide(errorMessage: string): GeneratedSlide {
    try {
      this.renderingEngine.clearShapes();

      // Create error background
      const errorBackground = BackgroundShape.createSolidColor(
        createColor(60, 20, 20), // Dark red
        this.slideSize.width,
        this.slideSize.height
      );
      this.renderingEngine.addShape(errorBackground);

      // Create error text
      const errorText = new TextShape(
        {
          position: {
            x: this.slideSize.width * 0.1,
            y: this.slideSize.height * 0.4
          },
          size: {
            width: this.slideSize.width * 0.8,
            height: this.slideSize.height * 0.2
          }
        },
        {
          fontSize: Math.floor(this.slideSize.height * 0.04),
          fontWeight: 'bold',
          color: createColor(255, 200, 200),
          textAlign: 'center',
          verticalAlign: 'middle',
          shadowColor: createColor(0, 0, 0, 0.8),
          shadowBlur: 4,
          shadowOffsetX: 2,
          shadowOffsetY: 2
        }
      );
      errorText.setText(errorMessage);
      errorText.setZIndex(1);
      this.renderingEngine.addShape(errorText);

      // Create error slide object
      const errorSlide: GeneratedSlide = {
        id: `error-${Date.now()}`,
        contentId: 'error',
        templateId: 'error-template',
        shapes: [errorBackground, errorText],
        metadata: {
          generatedAt: new Date(),
          shapeCount: 2,
          templateName: 'Error Template'
        }
      };

      this.currentSlide = errorSlide;
      this.renderingEngine.render();
      this.notifyRenderCallbacks();

      return errorSlide;

    } catch (criticalError) {
      console.error('SlideRenderer: Critical error in error slide rendering:', criticalError);
      throw criticalError; // Re-throw as this is a critical failure
    }
  }

  /**
   * Renders a blank/black slide
   */
  public renderBlankSlide(): GeneratedSlide {
    const blankSlide = convertContentToSlide(
      { type: 'black' },
      this.slideSize
    );

    this.renderSlide(blankSlide);
    return blankSlide;
  }

  /**
   * Renders the default/placeholder slide
   */
  public renderDefaultSlide(): GeneratedSlide {
    const defaultSlide = convertContentToSlide(
      {
        type: 'placeholder',
        content: {
          mainText: 'PraisePresent Live Display',
          subText: 'Ready for presentation content'
        }
      },
      this.slideSize
    );

    this.renderSlide(defaultSlide);
    return defaultSlide;
  }

  /**
   * Gets the currently rendered slide
   */
  public getCurrentSlide(): GeneratedSlide | null {
    return this.currentSlide;
  }

  /**
   * Updates the slide size and re-renders current slide if available
   */
  public setSlideSize(newSize: { width: number; height: number }): void {
    this.slideSize = newSize;

    // If we have a current slide, re-render it with new size
    if (this.currentSlide) {
      // We need to regenerate the slide with new dimensions
      // This would require storing the original content, which we don't have
      // For now, just log that a re-render might be needed
      console.log('SlideRenderer: Slide size updated, consider re-rendering current content');
    }
  }

  /**
   * Gets current slide size
   */
  public getSlideSize(): { width: number; height: number } {
    return { ...this.slideSize };
  }

  /**
   * Adds a callback that will be called after each render
   */
  public addRenderCallback(callback: () => void): void {
    this.renderCallbacks.add(callback);
  }

  /**
   * Removes a render callback
   */
  public removeRenderCallback(callback: () => void): void {
    this.renderCallbacks.delete(callback);
  }

  /**
   * Clears all render callbacks
   */
  public clearRenderCallbacks(): void {
    this.renderCallbacks.clear();
  }

  /**
   * Notifies all registered callbacks that a render has completed
   */
  private notifyRenderCallbacks(): void {
    this.renderCallbacks.forEach(callback => {
      try {
        callback();
      } catch (callbackError) {
        console.warn('SlideRenderer: Error in render callback:', callbackError);
      }
    });
  }

  /**
   * Gets performance metrics from the underlying rendering engine
   */
  public getPerformanceMetrics() {
    return this.renderingEngine.getPerformanceMetrics();
  }

  /**
   * Disposes of the slide renderer and cleans up resources
   */
  public dispose(): void {
    this.renderCallbacks.clear();
    this.currentSlide = null;
    // Note: We don't dispose the rendering engine as it might be used elsewhere
  }

  /**
   * Creates a preview of content without rendering it to the main engine
   * This is useful for generating thumbnails or previews
   */
  public previewContent(content: any): GeneratedSlide {
    // This would ideally create a separate rendering context for previews
    // For now, just convert to slide structure without rendering
    return convertContentToSlide(content, this.slideSize);
  }

  /**
   * Validates that content can be rendered successfully
   */
  public validateContent(content: any): { valid: boolean; errors: string[] } {
    try {
      const slide = convertContentToSlide(content, this.slideSize);
      return validateSlideStructure(slide);
    } catch (error) {
      return {
        valid: false,
        errors: [`Content conversion failed: ${error instanceof Error ? error.message : 'Unknown error'}`]
      };
    }
  }

  /**
   * Gets rendering statistics for debugging and monitoring
   */
  public getRenderingStats(): {
    currentSlideId: string | null;
    currentShapeCount: number;
    slideSize: { width: number; height: number };
    hasCurrentSlide: boolean;
    callbackCount: number;
  } {
    return {
      currentSlideId: this.currentSlide?.id || null,
      currentShapeCount: this.currentSlide?.shapes.length || 0,
      slideSize: this.getSlideSize(),
      hasCurrentSlide: this.currentSlide !== null,
      callbackCount: this.renderCallbacks.size
    };
  }
}

/**
 * Factory function to create a SlideRenderer with common defaults
 */
export function createSlideRenderer(
  renderingEngine: RenderingEngine,
  options?: {
    slideSize?: { width: number; height: number };
    onRender?: () => void;
  }
): SlideRenderer {
  const renderer = new SlideRenderer(
    renderingEngine,
    options?.slideSize || DEFAULT_SLIDE_SIZE
  );

  if (options?.onRender) {
    renderer.addRenderCallback(options.onRender);
  }

  return renderer;
}