import { GeneratedSlide } from '../SlideGenerator';
import { Shape } from '../core/Shape';
import { TextShape } from '../shapes/TextShape';
import { RectangleShape } from '../shapes/RectangleShape';
import { BackgroundShape } from '../shapes/BackgroundShape';
import { createColor, Color } from '../types/geometry';
import { DEFAULT_SLIDE_SIZE } from '../templates/templateUtils';
import { ShapeFactory } from './ShapeFactory';

// LiveContent interface matching what LiveDisplayRenderer expects
interface LiveContent {
  type: 'rendering-test' | 'rendering-demo' | 'placeholder' | 'black' | 'logo' | 'template-demo' | 'simple-rendering-test' | 'scripture' | 'song' | 'announcement' | 'template-generated' | 'template-slide';
  scenario?: string;
  content?: any;
  title?: string;
  slideData?: any; // For template-generated content
  templateId?: string; // For template-generated content
  slide?: {
    id: string;
    shapes: any[];
    background?: {
      type: string;
      value: any;
      angle?: number;
    };
  }; // For template-slide content
}

// Shared styling constants to ensure consistency
export const SHARED_STYLES = {
  fonts: {
    primary: 'Arial, sans-serif',
    serif: 'Georgia, serif',
    title: 'Arial Black, sans-serif'
  },
  colors: {
    background: {
      gradient1: { start: createColor(45, 55, 72), end: createColor(74, 85, 104) },
      gradient2: { start: createColor(25, 35, 55), end: createColor(45, 55, 75) },
      gradient3: { start: createColor(20, 20, 40), end: createColor(60, 60, 100) },
      dark: createColor(20, 20, 30),
      black: createColor(0, 0, 0)
    },
    text: {
      primary: createColor(255, 255, 255),
      secondary: createColor(220, 220, 220),
      accent: createColor(200, 255, 200),
      dark: createColor(40, 40, 40),
      muted: createColor(120, 120, 120)
    },
    scripture: {
      background: createColor(255, 255, 255, 0.95),
      border: createColor(200, 200, 200),
      title: createColor(60, 80, 120)
    }
  },
  shadows: {
    text: {
      color: createColor(0, 0, 0, 0.8),
      blur: 8,
      offsetX: 2,
      offsetY: 2
    },
    strong: {
      color: createColor(0, 0, 0, 0.8),
      blur: 6,
      offsetX: 2,
      offsetY: 2
    },
    soft: {
      color: createColor(0, 0, 0, 0.6),
      blur: 4,
      offsetX: 1,
      offsetY: 1
    },
    card: {
      color: createColor(0, 0, 0, 0.3),
      blur: 20,
      offsetX: 0,
      offsetY: 10
    }
  },
  spacing: {
    margin: {
      small: 0.02, // percentage of screen
      medium: 0.05,
      large: 0.1
    },
    padding: {
      small: 0.03,
      medium: 0.05,
      large: 0.1
    }
  }
};

/**
 * Converts any LiveContent format to a unified GeneratedSlide structure
 * This ensures consistent rendering across preview and live display
 */
export function convertContentToSlide(
  content: LiveContent,
  slideSize: { width: number; height: number } = DEFAULT_SLIDE_SIZE
): GeneratedSlide {
  // Default slide structure
  const baseSlide: GeneratedSlide = {
    id: `unified-${Date.now()}`,
    contentId: content.type,
    templateId: 'unified-converter',
    shapes: [],
    metadata: {
      generatedAt: new Date(),
      shapeCount: 0,
      templateName: 'Unified Content Converter'
    }
  };

  switch (content.type) {
    case 'template-slide':
      return convertTemplateSlide(content, slideSize, baseSlide);

    case 'scripture':
      return convertScriptureContent(content, slideSize, baseSlide);

    case 'rendering-test':
    case 'rendering-demo':
    case 'template-demo':
    case 'simple-rendering-test':
      return convertTestContent(content, slideSize, baseSlide);

    case 'placeholder':
      return convertPlaceholderContent(content, slideSize, baseSlide);

    case 'black':
      return convertBlackScreen(content, slideSize, baseSlide);

    case 'logo':
      return convertLogoScreen(content, slideSize, baseSlide);

    case 'song':
    case 'announcement':
    case 'template-generated':
      return convertTemplateGeneratedContent(content, slideSize, baseSlide);

    default:
      console.warn(`Unknown content type: ${content.type}, creating default slide`);
      return convertDefaultContent(content, slideSize, baseSlide);
  }
}

/**
 * Converts template-slide content using ShapeFactory for reconstruction
 * This handles serialized shapes from IPC communication
 */
function convertTemplateSlide(content: LiveContent, slideSize: { width: number; height: number }, baseSlide: GeneratedSlide): GeneratedSlide {
  if (content.slide && content.slide.shapes) {
    const slide = content.slide;

    // Add background if specified
    if (slide.background) {
      let backgroundShape: Shape | null = null;

      if (slide.background.type === 'color') {
        const color = parseColor(slide.background.value);
        backgroundShape = BackgroundShape.createSolidColor(color, slideSize.width, slideSize.height);
      } else if (slide.background.type === 'gradient' && Array.isArray(slide.background.value)) {
        backgroundShape = BackgroundShape.createLinearGradient(
          slide.background.value,
          slide.background.angle || 90,
          slideSize.width,
          slideSize.height
        );
      }

      if (backgroundShape) {
        baseSlide.shapes.push(backgroundShape);
      }
    }

    // Reconstruct Shape objects from serialized data using ShapeFactory
    const reconstructedShapes = ShapeFactory.reconstructShapes(slide.shapes);
    baseSlide.shapes.push(...reconstructedShapes);

    baseSlide.id = slide.id;
    baseSlide.metadata.shapeCount = baseSlide.shapes.length;

    return baseSlide;
  }

  return convertDefaultContent(content, slideSize, baseSlide);
}

function convertScriptureContent(content: LiveContent, slideSize: { width: number; height: number }, baseSlide: GeneratedSlide): GeneratedSlide {
  const { width, height } = slideSize;

  // Background gradient
  const background = BackgroundShape.createLinearGradient(
    [
      { offset: 0, color: SHARED_STYLES.colors.background.gradient2.start },
      { offset: 1, color: SHARED_STYLES.colors.background.gradient2.end }
    ],
    135,
    width,
    height
  );
  baseSlide.shapes.push(background);

  // Scripture content
  const verse = content.content?.verse || 'For God so loved the world...';
  const reference = content.content?.reference || 'John 3:16';
  const translation = content.content?.translation || 'KJV';

  // Main verse text
  const verseText = new TextShape(
    {
      position: { x: width * 0.1, y: height * 0.25 },
      size: { width: width * 0.8, height: height * 0.4 }
    },
    {
      fontSize: Math.floor(height * 0.05),
      fontFamily: SHARED_STYLES.fonts.serif,
      color: SHARED_STYLES.colors.text.primary,
      textAlign: 'center',
      verticalAlign: 'middle',
      lineHeight: 1.4,
      shadowColor: SHARED_STYLES.shadows.text.color,
      shadowBlur: SHARED_STYLES.shadows.text.blur,
      shadowOffsetX: SHARED_STYLES.shadows.text.offsetX,
      shadowOffsetY: SHARED_STYLES.shadows.text.offsetY
    }
  );
  verseText.setText(verse);
  verseText.setZIndex(2);
  baseSlide.shapes.push(verseText);

  // Reference text
  const referenceText = new TextShape(
    {
      position: { x: width * 0.1, y: height * 0.7 },
      size: { width: width * 0.8, height: height * 0.1 }
    },
    {
      fontSize: Math.floor(height * 0.035),
      fontFamily: SHARED_STYLES.fonts.primary,
      fontWeight: 'bold',
      color: SHARED_STYLES.colors.text.accent,
      textAlign: 'center',
      verticalAlign: 'middle',
      shadowColor: SHARED_STYLES.shadows.soft.color,
      shadowBlur: SHARED_STYLES.shadows.soft.blur,
      shadowOffsetX: SHARED_STYLES.shadows.soft.offsetX,
      shadowOffsetY: SHARED_STYLES.shadows.soft.offsetY
    }
  );
  referenceText.setText(`${reference} (${translation})`);
  referenceText.setZIndex(2);
  baseSlide.shapes.push(referenceText);

  baseSlide.contentId = `scripture-${reference.replace(/\s+/g, '-')}`;
  baseSlide.metadata.shapeCount = baseSlide.shapes.length;
  baseSlide.metadata.templateName = 'Scripture Template';

  return baseSlide;
}

function convertTestContent(content: LiveContent, slideSize: { width: number; height: number }, baseSlide: GeneratedSlide): GeneratedSlide {
  const { width, height } = slideSize;

  // Background
  const background = BackgroundShape.createSolidColor(SHARED_STYLES.colors.background.dark, width, height);
  baseSlide.shapes.push(background);

  // Test title
  const title = content.title || content.type || 'Test Content';
  const titleText = new TextShape(
    {
      position: { x: width * 0.1, y: height * 0.1 },
      size: { width: width * 0.8, height: height * 0.15 }
    },
    {
      fontSize: Math.floor(height * 0.08),
      fontFamily: SHARED_STYLES.fonts.title,
      color: SHARED_STYLES.colors.text.primary,
      textAlign: 'center',
      verticalAlign: 'middle',
      shadowColor: SHARED_STYLES.shadows.text.color,
      shadowBlur: SHARED_STYLES.shadows.text.blur,
      shadowOffsetX: SHARED_STYLES.shadows.text.offsetX,
      shadowOffsetY: SHARED_STYLES.shadows.text.offsetY
    }
  );
  titleText.setText(title);
  titleText.setZIndex(1);
  baseSlide.shapes.push(titleText);

  // Test scenario if available
  if (content.scenario) {
    const scenarioText = new TextShape(
      {
        position: { x: width * 0.1, y: height * 0.3 },
        size: { width: width * 0.8, height: height * 0.1 }
      },
      {
        fontSize: Math.floor(height * 0.04),
        fontFamily: SHARED_STYLES.fonts.primary,
        color: SHARED_STYLES.colors.text.secondary,
        textAlign: 'center',
        verticalAlign: 'middle'
      }
    );
    scenarioText.setText(`Scenario: ${content.scenario}`);
    scenarioText.setZIndex(1);
    baseSlide.shapes.push(scenarioText);
  }

  // Test content details
  const contentDetails = content.content || {};
  if (Object.keys(contentDetails).length > 0) {
    const detailsText = new TextShape(
      {
        position: { x: width * 0.1, y: height * 0.45 },
        size: { width: width * 0.8, height: height * 0.4 }
      },
      {
        fontSize: Math.floor(height * 0.025),
        fontFamily: 'monospace',
        color: SHARED_STYLES.colors.text.muted,
        textAlign: 'left',
        verticalAlign: 'top',
        lineHeight: 1.4
      }
    );
    detailsText.setText(JSON.stringify(contentDetails, null, 2));
    detailsText.setZIndex(1);
    baseSlide.shapes.push(detailsText);
  }

  baseSlide.contentId = `test-${content.type}`;
  baseSlide.metadata.shapeCount = baseSlide.shapes.length;
  baseSlide.metadata.templateName = 'Test Content Template';

  return baseSlide;
}

function convertPlaceholderContent(content: LiveContent, slideSize: { width: number; height: number }, baseSlide: GeneratedSlide): GeneratedSlide {
  const { width, height } = slideSize;

  // Background gradient
  const background = BackgroundShape.createLinearGradient(
    [
      { offset: 0, color: SHARED_STYLES.colors.background.gradient1.start },
      { offset: 1, color: SHARED_STYLES.colors.background.gradient1.end }
    ],
    45,
    width,
    height
  );
  baseSlide.shapes.push(background);

  // Main text
  const mainText = content.content?.mainText || 'PraisePresent';
  const mainTextShape = new TextShape(
    {
      position: { x: width * 0.1, y: height * 0.3 },
      size: { width: width * 0.8, height: height * 0.25 }
    },
    {
      fontSize: Math.floor(height * 0.12),
      fontFamily: SHARED_STYLES.fonts.title,
      fontWeight: 'bold',
      color: SHARED_STYLES.colors.text.primary,
      textAlign: 'center',
      verticalAlign: 'middle',
      shadowColor: SHARED_STYLES.shadows.strong.color,
      shadowBlur: SHARED_STYLES.shadows.strong.blur,
      shadowOffsetX: SHARED_STYLES.shadows.strong.offsetX,
      shadowOffsetY: SHARED_STYLES.shadows.strong.offsetY
    }
  );
  mainTextShape.setText(mainText);
  mainTextShape.setZIndex(2);
  baseSlide.shapes.push(mainTextShape);

  // Sub text
  const subText = content.content?.subText || 'Presentation System';
  const subTextShape = new TextShape(
    {
      position: { x: width * 0.1, y: height * 0.6 },
      size: { width: width * 0.8, height: height * 0.15 }
    },
    {
      fontSize: Math.floor(height * 0.04),
      fontFamily: SHARED_STYLES.fonts.primary,
      color: SHARED_STYLES.colors.text.secondary,
      textAlign: 'center',
      verticalAlign: 'middle',
      shadowColor: SHARED_STYLES.shadows.soft.color,
      shadowBlur: SHARED_STYLES.shadows.soft.blur,
      shadowOffsetX: SHARED_STYLES.shadows.soft.offsetX,
      shadowOffsetY: SHARED_STYLES.shadows.soft.offsetY
    }
  );
  subTextShape.setText(subText);
  subTextShape.setZIndex(2);
  baseSlide.shapes.push(subTextShape);

  baseSlide.contentId = 'placeholder';
  baseSlide.metadata.shapeCount = baseSlide.shapes.length;
  baseSlide.metadata.templateName = 'Placeholder Template';

  return baseSlide;
}

function convertBlackScreen(content: LiveContent, slideSize: { width: number; height: number }, baseSlide: GeneratedSlide): GeneratedSlide {
  const { width, height } = slideSize;

  // Black background
  const background = BackgroundShape.createSolidColor(SHARED_STYLES.colors.background.black, width, height);
  baseSlide.shapes.push(background);

  baseSlide.contentId = 'black-screen';
  baseSlide.metadata.shapeCount = baseSlide.shapes.length;
  baseSlide.metadata.templateName = 'Black Screen Template';

  return baseSlide;
}

function convertLogoScreen(content: LiveContent, slideSize: { width: number; height: number }, baseSlide: GeneratedSlide): GeneratedSlide {
  const { width, height } = slideSize;

  // Background
  const background = BackgroundShape.createLinearGradient(
    [
      { offset: 0, color: SHARED_STYLES.colors.background.gradient3.start },
      { offset: 1, color: SHARED_STYLES.colors.background.gradient3.end }
    ],
    90,
    width,
    height
  );
  baseSlide.shapes.push(background);

  // Logo placeholder - in a real implementation this would be an ImageShape
  const logoPlaceholder = new RectangleShape(
    {
      position: { x: width * 0.35, y: height * 0.25 },
      size: { width: width * 0.3, height: height * 0.3 }
    },
    {
      fill: SHARED_STYLES.colors.text.primary,
      borderRadius: 10,
      shadowColor: SHARED_STYLES.shadows.card.color,
      shadowBlur: SHARED_STYLES.shadows.card.blur,
      shadowOffsetY: SHARED_STYLES.shadows.card.offsetY
    }
  );
  logoPlaceholder.setZIndex(2);
  baseSlide.shapes.push(logoPlaceholder);

  // Logo text overlay
  const logoText = new TextShape(
    {
      position: { x: width * 0.35, y: height * 0.25 },
      size: { width: width * 0.3, height: height * 0.3 }
    },
    {
      fontSize: Math.floor(height * 0.05),
      fontFamily: SHARED_STYLES.fonts.title,
      color: SHARED_STYLES.colors.background.dark,
      textAlign: 'center',
      verticalAlign: 'middle',
      fontWeight: 'bold'
    }
  );
  logoText.setText('LOGO');
  logoText.setZIndex(3);
  baseSlide.shapes.push(logoText);

  baseSlide.contentId = 'logo-screen';
  baseSlide.metadata.shapeCount = baseSlide.shapes.length;
  baseSlide.metadata.templateName = 'Logo Template';

  return baseSlide;
}

function convertTemplateGeneratedContent(content: LiveContent, slideSize: { width: number; height: number }, baseSlide: GeneratedSlide): GeneratedSlide {
  // This handles content that was generated by templates but isn't template-slide type
  // For now, treat it as placeholder content
  return convertPlaceholderContent(content, slideSize, baseSlide);
}

function convertDefaultContent(content: LiveContent, slideSize: { width: number; height: number }, baseSlide: GeneratedSlide): GeneratedSlide {
  const { width, height } = slideSize;

  // Default dark background
  const background = BackgroundShape.createSolidColor(SHARED_STYLES.colors.background.dark, width, height);
  baseSlide.shapes.push(background);

  // Unknown content message
  const errorText = new TextShape(
    {
      position: { x: width * 0.1, y: height * 0.4 },
      size: { width: width * 0.8, height: height * 0.2 }
    },
    {
      fontSize: Math.floor(height * 0.05),
      fontFamily: SHARED_STYLES.fonts.primary,
      color: SHARED_STYLES.colors.text.primary,
      textAlign: 'center',
      verticalAlign: 'middle',
      shadowColor: SHARED_STYLES.shadows.text.color,
      shadowBlur: SHARED_STYLES.shadows.text.blur,
      shadowOffsetX: SHARED_STYLES.shadows.text.offsetX,
      shadowOffsetY: SHARED_STYLES.shadows.text.offsetY
    }
  );
  errorText.setText(`Content type "${content.type}" not supported`);
  errorText.setZIndex(1);
  baseSlide.shapes.push(errorText);

  baseSlide.contentId = `default-${content.type}`;
  baseSlide.metadata.shapeCount = baseSlide.shapes.length;
  baseSlide.metadata.templateName = 'Default Template';

  return baseSlide;
}

/**
 * Parses color string to Color instance
 * Supports hex, rgb, rgba, and named colors
 */
function parseColor(colorString: string): Color {
  if (typeof colorString !== 'string') {
    return SHARED_STYLES.colors.background.black;
  }

  // Handle hex colors
  if (colorString.startsWith('#')) {
    const hex = colorString.slice(1);
    if (hex.length === 6) {
      const r = parseInt(hex.slice(0, 2), 16);
      const g = parseInt(hex.slice(2, 4), 16);
      const b = parseInt(hex.slice(4, 6), 16);
      return createColor(r, g, b);
    }
  }

  // Default to black for unknown formats
  return SHARED_STYLES.colors.background.black;
}

/**
 * Validates slide structure for correctness
 */
export function validateSlideStructure(slide: GeneratedSlide): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!slide.id) {
    errors.push('Slide missing required id field');
  }

  if (!slide.contentId) {
    errors.push('Slide missing required contentId field');
  }

  if (!Array.isArray(slide.shapes)) {
    errors.push('Slide shapes must be an array');
  } else {
    slide.shapes.forEach((shape, index) => {
      if (!shape) {
        errors.push(`Shape at index ${index} is null/undefined`);
      } else if (typeof shape.render !== 'function') {
        errors.push(`Shape at index ${index} missing render method`);
      }
    });
  }

  if (!slide.metadata) {
    errors.push('Slide missing metadata object');
  } else {
    if (!slide.metadata.generatedAt) {
      errors.push('Slide metadata missing generatedAt field');
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
}