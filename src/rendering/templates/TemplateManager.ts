import { SlideTemplate, TemplateTheme, TemplateContent } from './SlideTemplate';
import { Shape } from '../core/Shape';
import { Size, Point } from '../types/geometry';
import { ShapeStyle } from '../types/shapes';

export interface TemplateRegistration {
  template: SlideTemplate;
  metadata: {
    version: string;
    author?: string;
    description?: string;
    tags: string[];
    createdAt: Date;
    updatedAt: Date;
  };
}

/**
 * Template placeholder override
 * Allows customizing individual placeholder positions/styles
 */
export interface PlaceholderOverride {
  placeholderId: string;
  position?: Point;
  size?: Size;
  style?: Partial<ShapeStyle>;
}

/**
 * Template override set
 * Collection of overrides for a specific template instance
 */
export interface TemplateOverrides {
  templateId: string;
  overrideId: string; // Unique ID for this override set
  name?: string;
  placeholderOverrides: PlaceholderOverride[];
  createdAt: Date;
  updatedAt: Date;
}

export interface SlideGenerationOptions {
  templateId: string;
  content: TemplateContent;
  theme?: TemplateTheme;
  slideSize?: Size;
  customizations?: any;
  overrides?: TemplateOverrides; // Apply saved overrides
}

export interface SlideGenerationResult {
  success: boolean;
  shapes: Shape[];
  errors?: string[];
  metadata: {
    templateId: string;
    templateName: string;
    generatedAt: Date;
    shapeCount: number;
  };
}

export class TemplateManager {
  private templates: Map<string, TemplateRegistration> = new Map();
  private themes: Map<string, TemplateTheme> = new Map();
  private defaultTheme: TemplateTheme;
  private initialized: boolean = false;
  private slideSize: Size;
  private overrides: Map<string, TemplateOverrides> = new Map(); // Store template overrides

  constructor(slideSize?: Size) {
    this.slideSize = slideSize || { width: 1920, height: 1080 };
    this.defaultTheme = this.createDefaultTheme();
    this.themes.set(this.defaultTheme.id, this.defaultTheme);
    this.initialized = true;
  }

  /**
   * Checks if the TemplateManager is properly initialized
   */
  public isInitialized(): boolean {
    try {
      return this.initialized &&
             this.templates.size >= 0 &&
             this.themes.size > 0 &&
             this.defaultTheme !== undefined &&
             this.slideSize?.width > 0 &&
             this.slideSize?.height > 0;
    } catch (error) {
      console.error('TemplateManager: Error checking initialization state:', error);
      return false;
    }
  }

  /**
   * Validates the current state and attempts recovery if needed
   */
  public validateAndRecover(): { isValid: boolean; warnings: string[]; recovered: boolean } {
    const warnings: string[] = [];
    let recovered = false;

    // Check basic initialization
    if (!this.initialized) {
      warnings.push('TemplateManager not initialized');
      this.initialize(this.slideSize || { width: 1920, height: 1080 });
      recovered = true;
    }

    // Validate slide size
    if (!this.slideSize || this.slideSize.width <= 0 || this.slideSize.height <= 0) {
      warnings.push('Invalid slide size detected');
      this.slideSize = { width: 1920, height: 1080 };
      recovered = true;
    }

    // Validate themes
    if (this.themes.size === 0 || !this.defaultTheme) {
      warnings.push('No themes available');
      this.defaultTheme = this.createDefaultTheme();
      this.themes.set(this.defaultTheme.id, this.defaultTheme);
      recovered = true;
    }

    // Validate default theme structure
    try {
      const theme = this.defaultTheme;
      if (!theme.colors || !theme.fonts || !theme.spacing) {
        warnings.push('Default theme structure incomplete');
        this.defaultTheme = this.createDefaultTheme();
        this.themes.set(this.defaultTheme.id, this.defaultTheme);
        recovered = true;
      }
    } catch (error) {
      warnings.push('Default theme validation failed');
      this.defaultTheme = this.createDefaultTheme();
      this.themes.set(this.defaultTheme.id, this.defaultTheme);
      recovered = true;
    }

    const isValid = this.isInitialized();

    if (recovered) {
      console.log('TemplateManager: Recovery completed', {
        isValid,
        warnings,
        totalThemes: this.themes.size,
        totalTemplates: this.templates.size
      });
    }

    return { isValid, warnings, recovered };
  }

  /**
   * Initialize or re-initialize the TemplateManager with a specific slide size
   */
  public initialize(slideSize: Size): void {
    this.slideSize = slideSize;
    this.defaultTheme = this.createDefaultTheme();
    this.themes.clear();
    this.themes.set(this.defaultTheme.id, this.defaultTheme);
    this.initialized = true;
  }

  /**
   * Gets the current slide size
   */
  public getSlideSize(): Size {
    return { ...this.slideSize };
  }

  private createDefaultTheme(): TemplateTheme {
    return {
      id: 'church-classic',
      name: 'Church Classic',
      colors: {
        primary: { r: 30, g: 58, b: 138, a: 1 },      // Deep Blue
        secondary: { r: 55, g: 65, b: 81, a: 1 },     // Gray
        accent: { r: 184, g: 134, b: 11, a: 1 },      // Gold
        background: { r: 15, g: 23, b: 42, a: 1 },    // Dark Blue
        text: { r: 248, g: 250, b: 252, a: 1 },       // White
        textSecondary: { r: 203, g: 213, b: 225, a: 1 } // Light Gray
      },
      fonts: {
        primary: 'Crimson Text, serif',
        secondary: 'Inter, sans-serif',
        display: 'Playfair Display, serif'
      },
      spacing: {
        small: 8,
        medium: 16,
        large: 24,
        xlarge: 32
      }
    };
  }

  public registerTemplate(template: SlideTemplate, metadata?: Partial<TemplateRegistration['metadata']>): void {
    const now = new Date();
    const registration: TemplateRegistration = {
      template,
      metadata: {
        version: '1.0.0',
        author: 'PraisePresent',
        description: `${template.name} template for ${template.category} content`,
        tags: [template.category],
        createdAt: now,
        updatedAt: now,
        ...metadata
      }
    };

    this.templates.set(template.id, registration);
  }

  public unregisterTemplate(templateId: string): boolean {
    return this.templates.delete(templateId);
  }

  public getTemplate(templateId: string): SlideTemplate | null {
    const registration = this.templates.get(templateId);
    return registration ? registration.template : null;
  }

  public getTemplateRegistration(templateId: string): TemplateRegistration | null {
    return this.templates.get(templateId) || null;
  }

  public getAllTemplates(): SlideTemplate[] {
    return Array.from(this.templates.values()).map(reg => reg.template);
  }

  public getTemplatesByCategory(category: string): SlideTemplate[] {
    return Array.from(this.templates.values())
      .filter(reg => reg.template.category === category)
      .map(reg => reg.template);
  }

  public searchTemplates(query: string): SlideTemplate[] {
    const lowerQuery = query.toLowerCase();

    return Array.from(this.templates.values())
      .filter(reg => {
        const template = reg.template;
        const metadata = reg.metadata;

        return (
          template.name.toLowerCase().includes(lowerQuery) ||
          template.category.toLowerCase().includes(lowerQuery) ||
          metadata.description?.toLowerCase().includes(lowerQuery) ||
          metadata.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
        );
      })
      .map(reg => reg.template);
  }

  public generateSlide(options: SlideGenerationOptions): SlideGenerationResult {
    const template = this.getTemplate(options.templateId);

    if (!template) {
      return {
        success: false,
        shapes: [],
        errors: [`Template not found: ${options.templateId}`],
        metadata: {
          templateId: options.templateId,
          templateName: 'Unknown',
          generatedAt: new Date(),
          shapeCount: 0
        }
      };
    }

    // Validate content
    const validation = template.validateContent(options.content);
    if (!validation.valid) {
      return {
        success: false,
        shapes: [],
        errors: validation.errors,
        metadata: {
          templateId: options.templateId,
          templateName: template.name,
          generatedAt: new Date(),
          shapeCount: 0
        }
      };
    }

    try {
      // Apply custom theme if provided
      if (options.theme) {
        template.setTheme(options.theme);
      }

      // Apply custom slide size if provided
      if (options.slideSize) {
        template.setSlideSize(options.slideSize);
      }

      // Generate shapes
      const shapes = template.generateSlide(options.content);

      return {
        success: true,
        shapes,
        metadata: {
          templateId: template.id,
          templateName: template.name,
          generatedAt: new Date(),
          shapeCount: shapes.length
        }
      };

    } catch (error) {
      return {
        success: false,
        shapes: [],
        errors: [`Failed to generate slide: ${error instanceof Error ? error.message : 'Unknown error'}`],
        metadata: {
          templateId: template.id,
          templateName: template.name,
          generatedAt: new Date(),
          shapeCount: 0
        }
      };
    }
  }

  public batchGenerateSlides(
    templateId: string,
    contentList: TemplateContent[],
    options?: {
      theme?: TemplateTheme;
      slideSize?: Size;
      stopOnError?: boolean;
    }
  ): SlideGenerationResult[] {
    const results: SlideGenerationResult[] = [];

    for (const content of contentList) {
      const result = this.generateSlide({
        templateId,
        content,
        theme: options?.theme,
        slideSize: options?.slideSize
      });

      results.push(result);

      if (options?.stopOnError && !result.success) {
        break;
      }
    }

    return results;
  }

  public registerTheme(theme: TemplateTheme): void {
    this.themes.set(theme.id, theme);
  }

  public getTheme(themeId: string): TemplateTheme | null {
    return this.themes.get(themeId) || null;
  }

  public getAllThemes(): TemplateTheme[] {
    return Array.from(this.themes.values());
  }

  public getDefaultTheme(): TemplateTheme {
    return { ...this.defaultTheme };
  }

  public setDefaultTheme(themeId: string): boolean {
    const theme = this.themes.get(themeId);
    if (theme) {
      this.defaultTheme = theme;
      return true;
    }
    return false;
  }

  public cloneTemplate(templateId: string, newId?: string): SlideTemplate | null {
    const template = this.getTemplate(templateId);
    if (!template) return null;

    const cloned = template.clone();

    if (newId) {
      (cloned as any).id = newId;
    }

    this.registerTemplate(cloned, {
      version: '1.0.0',
      description: `Cloned from ${template.name}`,
      tags: [template.category, 'cloned']
    });

    return cloned;
  }

  public exportTemplate(templateId: string): string | null {
    const registration = this.getTemplateRegistration(templateId);
    if (!registration) return null;

    const exportData = {
      template: registration.template.toJSON(),
      metadata: registration.metadata,
      exportedAt: new Date().toISOString(),
      version: '1.0'
    };

    return JSON.stringify(exportData, null, 2);
  }

  public importTemplate(templateData: string): { success: boolean; error?: string; templateId?: string } {
    try {
      const data = JSON.parse(templateData);

      if (!data.template || !data.metadata) {
        return { success: false, error: 'Invalid template format' };
      }

      // This would need implementation in each concrete template class
      // For now, return success but note that full implementation requires
      // template-specific deserialization logic

      return {
        success: false,
        error: 'Template import requires template-specific deserialization - not implemented yet'
      };

    } catch (error) {
      return {
        success: false,
        error: `Failed to parse template data: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  public getTemplateStats(): {
    totalTemplates: number;
    templatesByCategory: Record<string, number>;
    totalThemes: number;
    recentlyUsed: string[];
  } {
    const templatesByCategory: Record<string, number> = {};

    for (const registration of this.templates.values()) {
      const category = registration.template.category;
      templatesByCategory[category] = (templatesByCategory[category] || 0) + 1;
    }

    return {
      totalTemplates: this.templates.size,
      templatesByCategory,
      totalThemes: this.themes.size,
      recentlyUsed: [] // Would be implemented with usage tracking
    };
  }

  public validateTemplateIntegrity(templateId: string): {
    valid: boolean;
    errors: string[];
    warnings: string[];
  } {
    const template = this.getTemplate(templateId);
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!template) {
      errors.push('Template not found');
      return { valid: false, errors, warnings };
    }

    try {
      // Test with empty content to check template structure
      const placeholders = template.getAllPlaceholders();
      const requiredPlaceholders = placeholders.filter(p => p.required);

      if (requiredPlaceholders.length === 0) {
        warnings.push('Template has no required placeholders');
      }

      // Check theme integrity
      const theme = template.getTheme();
      if (!theme.colors.background || !theme.colors.text) {
        errors.push('Template theme is missing essential colors');
      }

      if (!theme.fonts.primary) {
        errors.push('Template theme is missing primary font');
      }

    } catch (error) {
      errors.push(`Template integrity check failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }

  // ========================
  // Template Override Methods
  // ========================

  /**
   * Save template overrides for reuse
   */
  public saveOverrides(overrides: TemplateOverrides): void {
    this.overrides.set(overrides.overrideId, overrides);
    console.log(`✅ Saved template overrides: ${overrides.name || overrides.overrideId}`);
  }

  /**
   * Get template overrides by ID
   */
  public getOverrides(overrideId: string): TemplateOverrides | null {
    return this.overrides.get(overrideId) || null;
  }

  /**
   * Get all overrides for a specific template
   */
  public getOverridesForTemplate(templateId: string): TemplateOverrides[] {
    return Array.from(this.overrides.values())
      .filter(override => override.templateId === templateId);
  }

  /**
   * Delete template overrides
   */
  public deleteOverrides(overrideId: string): boolean {
    return this.overrides.delete(overrideId);
  }

  /**
   * Create new override set from customizations
   */
  public createOverrides(
    templateId: string,
    placeholderOverrides: PlaceholderOverride[],
    name?: string
  ): TemplateOverrides {
    const now = new Date();
    return {
      templateId,
      overrideId: `override-${templateId}-${Date.now()}`,
      name,
      placeholderOverrides,
      createdAt: now,
      updatedAt: now
    };
  }

  /**
   * Apply overrides to generated shapes
   * This modifies shape positions/styles based on saved overrides
   */
  public applyOverridesToShapes(shapes: Shape[], overrides: TemplateOverrides): Shape[] {
    if (!overrides || overrides.placeholderOverrides.length === 0) {
      return shapes;
    }

    // Create a map of placeholder overrides for quick lookup
    const overrideMap = new Map<string, PlaceholderOverride>();
    overrides.placeholderOverrides.forEach(override => {
      overrideMap.set(override.placeholderId, override);
    });

    // Apply overrides to matching shapes
    return shapes.map(shape => {
      // Try to find matching override by shape metadata
      const placeholderId = shape.metadata?.placeholderId || shape.metadata?.role;
      if (!placeholderId) return shape;

      const override = overrideMap.get(placeholderId);
      if (!override) return shape;

      // Apply position override
      if (override.position) {
        shape.position = { ...override.position };
      }

      // Apply size override
      if (override.size) {
        shape.size = { ...override.size };
      }

      // Apply style override (for shapes that have a style property)
      if (override.style && 'style' in shape) {
        (shape as any).style = { ...(shape as any).style, ...override.style };
      }

      return shape;
    });
  }

  /**
   * Export overrides to JSON for storage
   */
  public exportOverrides(overrideId: string): string | null {
    const overrides = this.getOverrides(overrideId);
    if (!overrides) return null;

    return JSON.stringify(overrides, null, 2);
  }

  /**
   * Import overrides from JSON
   */
  public importOverrides(overridesData: string): { success: boolean; error?: string; overrideId?: string } {
    try {
      const overrides: TemplateOverrides = JSON.parse(overridesData);

      if (!overrides.templateId || !overrides.overrideId || !overrides.placeholderOverrides) {
        return { success: false, error: 'Invalid overrides format' };
      }

      this.saveOverrides(overrides);

      return {
        success: true,
        overrideId: overrides.overrideId
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to parse overrides data: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Get override statistics
   */
  public getOverrideStats(): {
    totalOverrides: number;
    overridesByTemplate: Record<string, number>;
  } {
    const overridesByTemplate: Record<string, number> = {};

    for (const override of this.overrides.values()) {
      const templateId = override.templateId;
      overridesByTemplate[templateId] = (overridesByTemplate[templateId] || 0) + 1;
    }

    return {
      totalOverrides: this.overrides.size,
      overridesByTemplate
    };
  }
}

// Create singleton with enhanced initialization and recovery
export const templateManager = (() => {
  const manager = new TemplateManager();

  // Validate and recover if needed
  const validationResult = manager.validateAndRecover();

  if (!validationResult.isValid) {
    console.error('Global TemplateManager: Critical initialization failure. Attempting full reset...');
    try {
      manager.initialize({ width: 1920, height: 1080 });
      const retryValidation = manager.validateAndRecover();

      if (retryValidation.isValid) {
        console.log('Global TemplateManager: Successfully recovered after full reset');
      } else {
        console.error('Global TemplateManager: Failed to initialize even after full reset', retryValidation.warnings);
      }
    } catch (error) {
      console.error('Global TemplateManager: Fatal initialization error:', error);
    }
  } else if (validationResult.recovered) {
    console.log('Global TemplateManager: Successfully initialized with auto-recovery', validationResult.warnings);
  } else {
    console.log('Global TemplateManager: Successfully initialized without issues');
  }

  return manager;
})();

/**
 * Utility function to ensure template manager is ready before use
 */
export function ensureTemplateManagerReady(): typeof templateManager {
  const validation = templateManager.validateAndRecover();

  if (!validation.isValid) {
    console.warn('TemplateManager validation failed, attempting recovery');
    templateManager.initialize({ width: 1920, height: 1080 });
  }

  return templateManager;
}