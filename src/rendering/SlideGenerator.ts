import { templateManager, SlideGenerationOptions, SlideGenerationResult } from './templates/TemplateManager';
import { initializeDefaultTemplates, createSongSlides, createScriptureSlides, createAnnouncementSlides } from './templates/templateUtils';
import { RenderingEngine } from './core/RenderingEngine';
import { Shape } from './core/Shape';

export interface SlideContent {
  id: string;
  type: 'song' | 'scripture' | 'announcement' | 'media' | 'custom';
  title: string;
  data: any;
  metadata?: {
    createdAt: Date;
    updatedAt: Date;
    author?: string;
    tags?: string[];
  };
}

export interface GeneratedSlide {
  id: string;
  contentId: string;
  templateId: string;
  shapes: Shape[];
  metadata: {
    generatedAt: Date;
    shapeCount: number;
    templateName: string;
  };
}

export interface SlideGenerationProgress {
  contentId: string;
  currentSlide: number;
  totalSlides: number;
  status: 'processing' | 'completed' | 'error';
  error?: string;
}

export class SlideGenerator {
  private renderingEngine?: RenderingEngine;
  private generationCallbacks: Map<string, (progress: SlideGenerationProgress) => void> = new Map();

  constructor() {
    this.initializeTemplates();
  }

  private initializeTemplates(): void {
    try {
      initializeDefaultTemplates();
    } catch (error) {
      console.error('Failed to initialize default templates:', error);
    }
  }

  public setRenderingEngine(engine: RenderingEngine): void {
    this.renderingEngine = engine;
  }

  public async generateSlidesFromContent(
    content: SlideContent,
    options?: {
      slideSize?: { width: number; height: number };
      theme?: string;
      onProgress?: (progress: SlideGenerationProgress) => void;
    }
  ): Promise<GeneratedSlide[]> {
    if (options?.onProgress) {
      this.generationCallbacks.set(content.id, options.onProgress);
    }

    try {
      this.notifyProgress(content.id, { contentId: content.id, currentSlide: 0, totalSlides: 0, status: 'processing' });

      let slideOptions: SlideGenerationOptions[] = [];

      switch (content.type) {
        case 'song':
          slideOptions = this.generateSongSlides(content);
          break;
        case 'scripture':
          slideOptions = this.generateScriptureSlides(content);
          break;
        case 'announcement':
          slideOptions = this.generateAnnouncementSlides(content);
          break;
        default:
          throw new Error(`Unsupported content type: ${content.type}`);
      }

      this.notifyProgress(content.id, {
        contentId: content.id,
        currentSlide: 0,
        totalSlides: slideOptions.length,
        status: 'processing'
      });

      const generatedSlides: GeneratedSlide[] = [];

      for (let i = 0; i < slideOptions.length; i++) {
        this.notifyProgress(content.id, {
          contentId: content.id,
          currentSlide: i + 1,
          totalSlides: slideOptions.length,
          status: 'processing'
        });

        const slideOption = slideOptions[i];

        // Apply custom theme and slide size if provided
        if (options?.theme) {
          const theme = templateManager.getTheme(options.theme);
          if (theme) {
            slideOption.theme = theme;
          }
        }

        if (options?.slideSize) {
          slideOption.slideSize = options.slideSize;
        }

        const result = templateManager.generateSlide(slideOption);

        if (!result.success) {
          throw new Error(`Failed to generate slide ${i + 1}: ${result.errors?.join(', ')}`);
        }

        const generatedSlide: GeneratedSlide = {
          id: `${content.id}_slide_${i + 1}`,
          contentId: content.id,
          templateId: slideOption.templateId,
          shapes: result.shapes,
          metadata: result.metadata
        };

        generatedSlides.push(generatedSlide);

        // Render slide for validation if rendering engine is available
        if (this.renderingEngine) {
          await this.validateSlideRendering(generatedSlide);
        }
      }

      this.notifyProgress(content.id, {
        contentId: content.id,
        currentSlide: slideOptions.length,
        totalSlides: slideOptions.length,
        status: 'completed'
      });

      return generatedSlides;

    } catch (error) {
      this.notifyProgress(content.id, {
        contentId: content.id,
        currentSlide: 0,
        totalSlides: 0,
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      throw error;
    } finally {
      this.generationCallbacks.delete(content.id);
    }
  }

  private generateSongSlides(content: SlideContent): SlideGenerationOptions[] {
    const songData = content.data;

    if (!songData.title || !songData.lyrics) {
      throw new Error('Song content must have title and lyrics');
    }

    // Parse lyrics into verses
    const verses = this.parseSongLyrics(songData.lyrics);

    return createSongSlides({
      title: songData.title,
      verses: verses.verses,
      chorus: verses.chorus,
      bridge: verses.bridge,
      author: songData.author,
      copyright: songData.copyright,
      ccli: songData.ccli,
      key: songData.key,
      tempo: songData.tempo
    });
  }

  private parseSongLyrics(lyrics: string): {
    verses: string[];
    chorus?: string;
    bridge?: string;
  } {
    const sections = lyrics.split(/\n\s*\n/); // Split by double newlines
    const verses: string[] = [];
    let chorus: string | undefined;
    let bridge: string | undefined;

    for (const section of sections) {
      const trimmed = section.trim();
      if (!trimmed) continue;

      const lowerSection = trimmed.toLowerCase();

      if (lowerSection.includes('chorus') || lowerSection.includes('refrain')) {
        chorus = trimmed.replace(/^(chorus|refrain):\s*/i, '');
      } else if (lowerSection.includes('bridge')) {
        bridge = trimmed.replace(/^bridge:\s*/i, '');
      } else if (lowerSection.includes('verse') || !chorus) {
        // Either explicitly marked as verse or first unmarked section
        verses.push(trimmed.replace(/^verse\s*\d*:\s*/i, ''));
      }
    }

    // If no verses found, treat all content as verses
    if (verses.length === 0) {
      verses.push(lyrics);
    }

    return { verses, chorus, bridge };
  }

  private generateScriptureSlides(content: SlideContent): SlideGenerationOptions[] {
    const scriptureData = content.data;

    if (!scriptureData.text || !scriptureData.reference) {
      throw new Error('Scripture content must have text and reference');
    }

    return createScriptureSlides({
      verses: scriptureData.text,
      book: scriptureData.book || this.extractBookFromReference(scriptureData.reference),
      chapter: scriptureData.chapter || this.extractChapterFromReference(scriptureData.reference),
      verseRange: scriptureData.verseRange || this.extractVerseRangeFromReference(scriptureData.reference),
      translation: scriptureData.translation || 'NIV',
      theme: scriptureData.theme || 'reading'
    });
  }

  private extractBookFromReference(reference: string): string {
    const match = reference.match(/^(\d?\s*\w+)/);
    return match ? match[1].trim() : 'Unknown';
  }

  private extractChapterFromReference(reference: string): number {
    const match = reference.match(/(\d+):(\d+)/);
    return match ? parseInt(match[1], 10) : 1;
  }

  private extractVerseRangeFromReference(reference: string): string {
    const match = reference.match(/:(\d+(?:-\d+)?)/);
    return match ? match[1] : '1';
  }

  private generateAnnouncementSlides(content: SlideContent): SlideGenerationOptions[] {
    const announcementData = content.data;

    if (!announcementData.title || !announcementData.message) {
      throw new Error('Announcement content must have title and message');
    }

    return createAnnouncementSlides({
      title: announcementData.title,
      message: announcementData.message,
      type: announcementData.type || 'announcement',
      date: announcementData.date,
      time: announcementData.time,
      location: announcementData.location,
      contact: announcementData.contact,
      urgency: announcementData.urgency || 'medium',
      imageUrl: announcementData.imageUrl,
      callToAction: announcementData.callToAction
    });
  }

  private async validateSlideRendering(slide: GeneratedSlide): Promise<void> {
    if (!this.renderingEngine) return;

    try {
      // Clear previous shapes
      this.renderingEngine.clearShapes();

      // Add shapes to rendering engine
      for (const shape of slide.shapes) {
        this.renderingEngine.addShape(shape);
      }

      // Perform a test render
      this.renderingEngine.render();

      // Check for rendering errors or performance issues
      const metrics = this.renderingEngine.getPerformanceMetrics();

      if (metrics.renderTime > 16.67) { // More than 60fps threshold
        console.warn(`Slide ${slide.id} took ${metrics.renderTime}ms to render (>16.67ms target)`);
      }

      if (metrics.shapeCount > 50) {
        console.warn(`Slide ${slide.id} has ${metrics.shapeCount} shapes (consider optimization)`);
      }

    } catch (error) {
      throw new Error(`Slide rendering validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private notifyProgress(contentId: string, progress: SlideGenerationProgress): void {
    const callback = this.generationCallbacks.get(contentId);
    if (callback) {
      callback(progress);
    }
  }

  public async batchGenerateSlides(
    contents: SlideContent[],
    options?: {
      slideSize?: { width: number; height: number };
      theme?: string;
      onProgress?: (contentId: string, progress: SlideGenerationProgress) => void;
      stopOnError?: boolean;
    }
  ): Promise<Map<string, GeneratedSlide[]>> {
    const results = new Map<string, GeneratedSlide[]>();
    const errors = new Map<string, Error>();

    for (const content of contents) {
      try {
        const slides = await this.generateSlidesFromContent(content, {
          slideSize: options?.slideSize,
          theme: options?.theme,
          onProgress: options?.onProgress ? (progress) => options.onProgress!(content.id, progress) : undefined
        });

        results.set(content.id, slides);

      } catch (error) {
        errors.set(content.id, error instanceof Error ? error : new Error('Unknown error'));

        if (options?.stopOnError) {
          throw error;
        }
      }
    }

    if (errors.size > 0 && !options?.stopOnError) {
      console.warn(`Batch generation completed with ${errors.size} errors:`, errors);
    }

    return results;
  }

  public getAvailableTemplates(): { id: string; name: string; category: string }[] {
    return templateManager.getAllTemplates().map(template => ({
      id: template.id,
      name: template.name,
      category: template.category
    }));
  }

  public getAvailableThemes(): { id: string; name: string }[] {
    return templateManager.getAllThemes().map(theme => ({
      id: theme.id,
      name: theme.name
    }));
  }

  public previewSlide(
    templateId: string,
    content: any,
    options?: {
      slideSize?: { width: number; height: number };
      theme?: string;
    }
  ): SlideGenerationResult {
    const slideOptions: SlideGenerationOptions = {
      templateId,
      content,
      slideSize: options?.slideSize,
      theme: options?.theme ? templateManager.getTheme(options.theme) || undefined : undefined
    };

    return templateManager.generateSlide(slideOptions);
  }

  public exportSlideAsJSON(slide: GeneratedSlide): string {
    const exportData = {
      slide: {
        id: slide.id,
        contentId: slide.contentId,
        templateId: slide.templateId,
        metadata: slide.metadata
      },
      shapes: slide.shapes.map(shape => shape.toJSON()),
      exportedAt: new Date().toISOString(),
      version: '1.0'
    };

    return JSON.stringify(exportData, null, 2);
  }

  public getGenerationStats(): {
    templatesAvailable: number;
    themesAvailable: number;
    supportedContentTypes: string[];
  } {
    return {
      templatesAvailable: templateManager.getAllTemplates().length,
      themesAvailable: templateManager.getAllThemes().length,
      supportedContentTypes: ['song', 'scripture', 'announcement', 'media', 'custom']
    };
  }
}

export const slideGenerator = new SlideGenerator();