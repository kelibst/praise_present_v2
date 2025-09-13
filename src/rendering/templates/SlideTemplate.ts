import { Shape } from '../core/Shape';
import { TextShape } from '../shapes/TextShape';
import { RectangleShape } from '../shapes/RectangleShape';
import { BackgroundShape } from '../shapes/BackgroundShape';
import { ImageShape } from '../shapes/ImageShape';
import { Rectangle, Point, Size, Color } from '../types/geometry';
import { ShapeCollection } from '../core/ShapeCollection';

export interface TemplateTheme {
  id: string;
  name: string;
  colors: {
    primary: Color;
    secondary: Color;
    accent: Color;
    background: Color;
    text: Color;
    textSecondary: Color;
  };
  fonts: {
    primary: string;
    secondary: string;
    display: string;
  };
  spacing: {
    small: number;
    medium: number;
    large: number;
    xlarge: number;
  };
}

export interface TemplatePlaceholder {
  id: string;
  name: string;
  type: 'text' | 'image' | 'background' | 'shape';
  bounds: Rectangle;
  style?: any;
  required: boolean;
  defaultValue?: any;
}

export interface TemplateContent {
  [key: string]: any;
}

export interface SlideTemplateOptions {
  id: string;
  name: string;
  category: 'song' | 'scripture' | 'announcement' | 'media' | 'custom';
  theme?: TemplateTheme;
  slideSize: Size;
  placeholders: TemplatePlaceholder[];
}

export abstract class SlideTemplate {
  public readonly id: string;
  public readonly name: string;
  public readonly category: string;
  protected slideSize: Size;
  protected theme: TemplateTheme;
  protected placeholders: Map<string, TemplatePlaceholder>;
  protected shapes: ShapeCollection;

  constructor(options: SlideTemplateOptions) {
    this.id = options.id;
    this.name = options.name;
    this.category = options.category;
    this.slideSize = options.slideSize;
    this.theme = options.theme || this.getDefaultTheme();
    this.placeholders = new Map(options.placeholders.map(p => [p.id, p]));
    this.shapes = new ShapeCollection();

    this.initializeTemplate();
  }

  protected abstract initializeTemplate(): void;

  public abstract generateSlide(content: TemplateContent): Shape[];

  protected getDefaultTheme(): TemplateTheme {
    return {
      id: 'default',
      name: 'Default Theme',
      colors: {
        primary: { r: 30, g: 58, b: 138, a: 1 },      // Blue-900
        secondary: { r: 55, g: 65, b: 81, a: 1 },     // Gray-700
        accent: { r: 59, g: 130, b: 246, a: 1 },      // Blue-500
        background: { r: 15, g: 23, b: 42, a: 1 },    // Slate-900
        text: { r: 248, g: 250, b: 252, a: 1 },       // Slate-50
        textSecondary: { r: 203, g: 213, b: 225, a: 1 } // Slate-300
      },
      fonts: {
        primary: 'Inter, system-ui, sans-serif',
        secondary: 'system-ui, sans-serif',
        display: 'Inter, system-ui, sans-serif'
      },
      spacing: {
        small: 8,
        medium: 16,
        large: 24,
        xlarge: 32
      }
    };
  }

  public setTheme(theme: TemplateTheme): void {
    this.theme = theme;
    this.shapes.clear();
    this.initializeTemplate();
  }

  public getTheme(): TemplateTheme {
    return { ...this.theme };
  }

  public getPlaceholder(id: string): TemplatePlaceholder | undefined {
    return this.placeholders.get(id);
  }

  public getAllPlaceholders(): TemplatePlaceholder[] {
    return Array.from(this.placeholders.values());
  }

  public validateContent(content: TemplateContent): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    for (const placeholder of this.placeholders.values()) {
      if (placeholder.required && !content[placeholder.id]) {
        errors.push(`Required content missing: ${placeholder.name}`);
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  protected createTextShape(
    placeholder: TemplatePlaceholder,
    text: string,
    customStyle?: any
  ): TextShape {
    const style = {
      fontFamily: this.theme.fonts.primary,
      fontSize: 24,
      color: this.theme.colors.text,
      textAlign: 'left' as const,
      verticalAlign: 'top' as const,
      ...customStyle
    };

    return new TextShape(
      {
        position: { x: placeholder.bounds.x, y: placeholder.bounds.y },
        size: { width: placeholder.bounds.width, height: placeholder.bounds.height },
        text,
        autoSize: false,
        wordWrap: true
      },
      style
    );
  }

  protected createBackgroundShape(color?: Color): BackgroundShape {
    return new BackgroundShape({
      position: { x: 0, y: 0 },
      size: { width: this.slideSize.width, height: this.slideSize.height },
      backgroundStyle: {
        type: 'color',
        color: color || this.theme.colors.background
      }
    });
  }

  protected createRectangleShape(
    bounds: Rectangle,
    color: Color,
    customStyle?: any
  ): RectangleShape {
    return new RectangleShape(
      {
        position: { x: bounds.x, y: bounds.y },
        size: { width: bounds.width, height: bounds.height }
      },
      {
        fillColor: color,
        strokeWidth: 0,
        ...customStyle
      }
    );
  }

  protected createImageShape(
    placeholder: TemplatePlaceholder,
    imageUrl: string,
    customStyle?: any
  ): ImageShape {
    return new ImageShape(
      {
        position: { x: placeholder.bounds.x, y: placeholder.bounds.y },
        size: { width: placeholder.bounds.width, height: placeholder.bounds.height },
        imageUrl,
        preserveAspectRatio: true
      },
      customStyle
    );
  }

  protected calculateResponsiveBounds(
    baseBounds: Rectangle,
    availableSize: Size
  ): Rectangle {
    const scaleX = availableSize.width / this.slideSize.width;
    const scaleY = availableSize.height / this.slideSize.height;
    const scale = Math.min(scaleX, scaleY);

    return {
      x: baseBounds.x * scale,
      y: baseBounds.y * scale,
      width: baseBounds.width * scale,
      height: baseBounds.height * scale
    };
  }

  protected fitTextToSize(
    text: string,
    bounds: Rectangle,
    minFontSize: number = 12,
    maxFontSize: number = 72
  ): number {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return 24;

    let fontSize = maxFontSize;

    while (fontSize >= minFontSize) {
      ctx.font = `${fontSize}px ${this.theme.fonts.primary}`;
      const metrics = ctx.measureText(text);

      if (metrics.width <= bounds.width) {
        return fontSize;
      }

      fontSize -= 2;
    }

    return minFontSize;
  }

  public getSlideSize(): Size {
    return { ...this.slideSize };
  }

  public setSlideSize(size: Size): void {
    this.slideSize = size;
    this.shapes.clear();
    this.initializeTemplate();
  }

  public clone(): SlideTemplate {
    const cloned = Object.create(Object.getPrototypeOf(this));
    Object.assign(cloned, {
      id: `${this.id}_clone_${Date.now()}`,
      name: `${this.name} (Copy)`,
      category: this.category,
      slideSize: { ...this.slideSize },
      theme: JSON.parse(JSON.stringify(this.theme)),
      placeholders: new Map(this.placeholders),
      shapes: new ShapeCollection()
    });

    cloned.initializeTemplate();
    return cloned;
  }

  public toJSON(): any {
    return {
      id: this.id,
      name: this.name,
      category: this.category,
      slideSize: this.slideSize,
      theme: this.theme,
      placeholders: Array.from(this.placeholders.entries())
    };
  }
}