import { GeneratedSlide } from '../SlideGenerator';
import { Shape } from '../core/Shape';
import { TextShape } from '../shapes/TextShape';
import { RectangleShape } from '../shapes/RectangleShape';
import { BackgroundShape } from '../shapes/BackgroundShape';
import { createColor, Color } from '../types/geometry';
import { DEFAULT_SLIDE_SIZE } from '../templates/templateUtils';

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

    // Reconstruct Shape objects from serialized data
    for (const shapeData of slide.shapes) {
      const shapeInstance = reconstructShapeFromData(shapeData);
      if (shapeInstance) {
        baseSlide.shapes.push(shapeInstance);
      }
    }

    baseSlide.id = slide.id;
    baseSlide.metadata.shapeCount = baseSlide.shapes.length;

    return baseSlide;
  }

  return convertDefaultContent(content, slideSize, baseSlide);
}

/**
 * Reconstructs a Shape instance from serialized shape data
 * This handles the case where templates generate shapes that get serialized via IPC
 */
function reconstructShapeFromData(shapeData: any): Shape | null {
  try {
    if (!shapeData || typeof shapeData !== 'object') {
      console.warn('Invalid shape data:', shapeData);
      return null;
    }

    // If it's already a Shape instance, return as-is
    if (shapeData.render && typeof shapeData.render === 'function') {
      return shapeData as Shape;
    }

    // Reconstruct based on shape type
    switch (shapeData.type) {
      case 'background':
        return reconstructBackgroundShape(shapeData);

      case 'text':
        return reconstructTextShape(shapeData);

      case 'rectangle':
        return reconstructRectangleShape(shapeData);

      case 'image':
        // TODO: Implement when ImageShape reconstruction is needed
        console.warn('Image shape reconstruction not yet implemented');
        return null;

      default:
        console.warn(`Unknown shape type for reconstruction: ${shapeData.type}`);
        return null;
    }
  } catch (error) {
    console.error('Error reconstructing shape from data:', error, shapeData);
    return null;
  }
}

function reconstructBackgroundShape(shapeData: any): Shape | null {
  if (shapeData.backgroundStyle?.type === 'color') {
    const color = shapeData.backgroundStyle.color;
    return BackgroundShape.createSolidColor(
      createColor(color.r || 0, color.g || 0, color.b || 0, color.a || 1),
      shapeData.size?.width || 1920,
      shapeData.size?.height || 1080
    );
  } else if (shapeData.backgroundStyle?.type === 'gradient' && shapeData.backgroundStyle.gradient) {
    return BackgroundShape.createLinearGradient(
      shapeData.backgroundStyle.gradient,
      shapeData.backgroundStyle.angle || 90,
      shapeData.size?.width || 1920,
      shapeData.size?.height || 1080
    );
  }
  return null;
}

function reconstructTextShape(shapeData: any): Shape | null {
  const position = shapeData.position || { x: 0, y: 0 };
  const size = shapeData.size || { width: 100, height: 50 };

  // Reconstruct text style with defaults
  const textStyle = {
    fontFamily: shapeData.textStyle?.fontFamily || shapeData.fontFamily || SHARED_STYLES.fonts.primary,
    fontSize: shapeData.textStyle?.fontSize || shapeData.fontSize || 24,
    fontWeight: shapeData.textStyle?.fontWeight || shapeData.fontWeight || 'normal',
    fontStyle: shapeData.textStyle?.fontStyle || shapeData.fontStyle || 'normal',
    color: reconstructColor(shapeData.textStyle?.color || shapeData.color) || SHARED_STYLES.colors.text.primary,
    textAlign: shapeData.textStyle?.textAlign || shapeData.textAlign || 'left',
    verticalAlign: shapeData.textStyle?.verticalAlign || shapeData.verticalAlign || 'top',
    lineHeight: shapeData.textStyle?.lineHeight || shapeData.lineHeight || 1.2,
    letterSpacing: shapeData.textStyle?.letterSpacing || shapeData.letterSpacing || 0,
    textDecoration: shapeData.textStyle?.textDecoration || shapeData.textDecoration || 'none',
    textTransform: shapeData.textStyle?.textTransform || shapeData.textTransform || 'none',
    shadowColor: reconstructColor(shapeData.textStyle?.shadowColor || shapeData.shadowColor),
    shadowBlur: shapeData.textStyle?.shadowBlur || shapeData.shadowBlur || 0,
    shadowOffsetX: shapeData.textStyle?.shadowOffsetX || shapeData.shadowOffsetX || 0,
    shadowOffsetY: shapeData.textStyle?.shadowOffsetY || shapeData.shadowOffsetY || 0
  };

  const textShape = new TextShape(
    {
      position,
      size,
      zIndex: shapeData.zIndex || 0,
      opacity: shapeData.opacity !== undefined ? shapeData.opacity : 1.0,
      visible: shapeData.visible !== undefined ? shapeData.visible : true,
      rotation: shapeData.rotation || 0
    },
    textStyle
  );

  // Set the text content
  if (shapeData.text || shapeData.content) {
    textShape.setText(shapeData.text || shapeData.content);
  }

  return textShape;
}

function reconstructRectangleShape(shapeData: any): Shape | null {
  const position = shapeData.position || { x: 0, y: 0 };
  const size = shapeData.size || { width: 100, height: 100 };

  const rectangleShape = new RectangleShape(
    {
      position,
      size,
      zIndex: shapeData.zIndex || 0,
      opacity: shapeData.opacity !== undefined ? shapeData.opacity : 1.0,
      visible: shapeData.visible !== undefined ? shapeData.visible : true,
      rotation: shapeData.rotation || 0
    },
    {
      fill: reconstructColor(shapeData.fillColor || shapeData.fill),
      stroke: shapeData.strokeColor || shapeData.stroke ? {
        color: reconstructColor(shapeData.strokeColor || shapeData.stroke?.color),
        width: shapeData.strokeWidth || shapeData.stroke?.width || 1,
        style: 'solid'
      } : undefined,
      borderRadius: shapeData.borderRadius || 0
    }
  );

  return rectangleShape;
}

/**
 * Reconstructs a Color object from various color formats
 */
function reconstructColor(colorData: any): Color | undefined {
  if (!colorData) return undefined;

  // If it's already a Color object
  if (typeof colorData === 'object' && 'r' in colorData && 'g' in colorData && 'b' in colorData) {
    return createColor(
      colorData.r || 0,
      colorData.g || 0,
      colorData.b || 0,
      colorData.a !== undefined ? colorData.a : 1
    );
  }

  // If it's a hex string
  if (typeof colorData === 'string' && colorData.startsWith('#')) {
    return parseColor(colorData);
  }

  // If it's an array [r, g, b] or [r, g, b, a]
  if (Array.isArray(colorData) && colorData.length >= 3) {
    return createColor(
      colorData[0] || 0,
      colorData[1] || 0,
      colorData[2] || 0,
      colorData[3] !== undefined ? colorData[3] : 1
    );
  }

  console.warn('Unable to reconstruct color from:', colorData);
  return undefined;
}

function convertScriptureContent(content: LiveContent, slideSize: { width: number; height: number }, baseSlide: GeneratedSlide): GeneratedSlide {
  const { width, height } = slideSize;

  // Background gradient
  const background = BackgroundShape.createLinearGradient(
    [
      { offset: 0, color: SHARED_STYLES.colors.background.gradient2.start },
      { offset: 1, color: SHARED_STYLES.colors.background.gradient2.end }
    ],
    90,
    width,
    height
  );
  baseSlide.shapes.push(background);

  // Main content area
  const contentArea = new RectangleShape(
    {
      position: { x: 100, y: 100 },
      size: { width: width - 200, height: height - 200 }
    },
    {
      fill: SHARED_STYLES.colors.scripture.background,
      stroke: { width: 2, color: SHARED_STYLES.colors.scripture.border, style: 'solid' },
      borderRadius: 15,
      shadowColor: SHARED_STYLES.shadows.card.color,
      shadowBlur: SHARED_STYLES.shadows.card.blur,
      shadowOffsetX: SHARED_STYLES.shadows.card.offsetX,
      shadowOffsetY: SHARED_STYLES.shadows.card.offsetY
    }
  );
  contentArea.setZIndex(1);
  baseSlide.shapes.push(contentArea);

  // Scripture reference title
  const referenceTitle = new TextShape(
    {
      position: { x: 150, y: 140 },
      size: { width: width - 300, height: 80 }
    },
    {
      fontFamily: SHARED_STYLES.fonts.serif,
      fontSize: Math.max(42, width * 0.025),
      fontWeight: 'bold',
      color: SHARED_STYLES.colors.scripture.title,
      textAlign: 'center',
      shadowColor: createColor(255, 255, 255, 0.8),
      shadowBlur: 2,
      shadowOffsetX: 1,
      shadowOffsetY: 1
    }
  );
  referenceTitle.setText(content.title || 'Scripture');
  referenceTitle.setZIndex(2);
  baseSlide.shapes.push(referenceTitle);

  // Scripture text
  const scriptureText = new TextShape(
    {
      position: { x: 150, y: 250 },
      size: { width: width - 300, height: height - 400 }
    },
    {
      fontFamily: SHARED_STYLES.fonts.serif,
      fontSize: Math.max(32, width * 0.02),
      lineHeight: 1.8,
      color: SHARED_STYLES.colors.text.dark,
      textAlign: 'center',
      shadowColor: createColor(255, 255, 255, 0.5),
      shadowBlur: 1,
      shadowOffsetX: 1,
      shadowOffsetY: 1
    }
  );

  const text = content.content?.text || 'Scripture text not available';
  scriptureText.setText(`"${text}"`);
  scriptureText.setZIndex(2);
  baseSlide.shapes.push(scriptureText);

  // Translation info
  if (content.content?.translation) {
    const translation = new TextShape(
      {
        position: { x: 150, y: height - 140 },
        size: { width: width - 300, height: 40 }
      },
      {
        fontFamily: SHARED_STYLES.fonts.primary,
        fontSize: Math.max(22, width * 0.015),
        color: SHARED_STYLES.colors.text.muted,
        textAlign: 'right',
        fontStyle: 'italic',
        shadowColor: createColor(255, 255, 255, 0.3),
        shadowBlur: 1,
        shadowOffsetX: 1,
        shadowOffsetY: 1
      }
    );
    translation.setText(`- ${content.content.translation}`);
    translation.setZIndex(2);
    baseSlide.shapes.push(translation);
  }

  baseSlide.metadata.shapeCount = baseSlide.shapes.length;
  baseSlide.contentId = 'scripture';

  return baseSlide;
}

function convertTestContent(content: LiveContent, slideSize: { width: number; height: number }, baseSlide: GeneratedSlide): GeneratedSlide {
  const { width, height } = slideSize;

  // Background
  const background = BackgroundShape.createLinearGradient(
    [
      { offset: 0, color: SHARED_STYLES.colors.background.gradient3.start },
      { offset: 1, color: SHARED_STYLES.colors.background.gradient3.end }
    ],
    135,
    width,
    height
  );
  baseSlide.shapes.push(background);

  // Title
  const title = new TextShape(
    { position: { x: width * 0.05, y: height * 0.05 }, size: { width: width * 0.9, height: height * 0.1 } },
    {
      fontSize: Math.floor(height * 0.06),
      fontWeight: 'bold',
      fontFamily: SHARED_STYLES.fonts.title,
      color: SHARED_STYLES.colors.text.primary,
      textAlign: 'center',
      verticalAlign: 'middle',
      shadowColor: SHARED_STYLES.shadows.strong.color,
      shadowBlur: SHARED_STYLES.shadows.strong.blur,
      shadowOffsetX: SHARED_STYLES.shadows.strong.offsetX,
      shadowOffsetY: SHARED_STYLES.shadows.strong.offsetY
    }
  );
  title.setText(content.title || 'Rendering Engine Live Test');
  title.setZIndex(2);
  baseSlide.shapes.push(title);

  // Create dynamic shapes for visual interest
  const shapeCount = 50;
  for (let i = 0; i < shapeCount; i++) {
    const rect = new RectangleShape(
      {
        position: {
          x: Math.random() * (width - 40),
          y: height * 0.2 + Math.random() * (height * 0.7)
        },
        size: { width: 30, height: 30 },
        rotation: Math.random() * 360
      },
      {
        fill: createColor(
          Math.random() * 255,
          Math.random() * 255,
          Math.random() * 255,
          0.7
        ),
        borderRadius: 5
      }
    );
    rect.setZIndex(1);
    baseSlide.shapes.push(rect);
  }

  // Performance info
  const perfText = new TextShape(
    { position: { x: width * 0.02, y: height * 0.9 }, size: { width: width * 0.3, height: height * 0.05 } },
    {
      fontSize: Math.floor(height * 0.025),
      fontFamily: SHARED_STYLES.fonts.primary,
      color: SHARED_STYLES.colors.text.accent,
      textAlign: 'left',
      verticalAlign: 'middle',
      shadowColor: SHARED_STYLES.shadows.text.color,
      shadowBlur: SHARED_STYLES.shadows.text.blur,
      shadowOffsetX: SHARED_STYLES.shadows.text.offsetX,
      shadowOffsetY: SHARED_STYLES.shadows.text.offsetY
    }
  );
  perfText.setText(`Live Display • ${shapeCount} shapes • Test Mode`);
  perfText.setZIndex(2);
  baseSlide.shapes.push(perfText);

  baseSlide.metadata.shapeCount = baseSlide.shapes.length;
  baseSlide.contentId = content.type;

  return baseSlide;
}

function convertPlaceholderContent(content: LiveContent, slideSize: { width: number; height: number }, baseSlide: GeneratedSlide): GeneratedSlide {
  const { width, height } = slideSize;

  // Background
  const background = BackgroundShape.createLinearGradient(
    [
      { offset: 0, color: SHARED_STYLES.colors.background.gradient1.start },
      { offset: 1, color: SHARED_STYLES.colors.background.gradient1.end }
    ],
    90,
    width,
    height
  );
  baseSlide.shapes.push(background);

  // Main content
  if (content.content?.mainText) {
    const mainText = new TextShape(
      { position: { x: width * 0.1, y: height * 0.35 }, size: { width: width * 0.8, height: height * 0.15 } },
      {
        fontSize: Math.floor(height * 0.09),
        fontWeight: 'bold',
        fontFamily: SHARED_STYLES.fonts.title,
        color: SHARED_STYLES.colors.text.primary,
        textAlign: 'center',
        verticalAlign: 'middle',
        shadowColor: SHARED_STYLES.shadows.text.color,
        shadowBlur: SHARED_STYLES.shadows.text.blur,
        shadowOffsetX: 3,
        shadowOffsetY: 3
      }
    );
    mainText.setText(content.content.mainText);
    mainText.setZIndex(1);
    baseSlide.shapes.push(mainText);
  }

  if (content.content?.subText) {
    const subText = new TextShape(
      { position: { x: width * 0.1, y: height * 0.55 }, size: { width: width * 0.8, height: height * 0.08 } },
      {
        fontSize: Math.floor(height * 0.035),
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
    subText.setText(content.content.subText);
    subText.setZIndex(1);
    baseSlide.shapes.push(subText);
  }

  baseSlide.metadata.shapeCount = baseSlide.shapes.length;
  baseSlide.contentId = 'placeholder';

  return baseSlide;
}

function convertBlackScreen(content: LiveContent, slideSize: { width: number; height: number }, baseSlide: GeneratedSlide): GeneratedSlide {
  const { width, height } = slideSize;

  // Black background
  const background = BackgroundShape.createSolidColor(SHARED_STYLES.colors.background.black, width, height);
  baseSlide.shapes.push(background);

  baseSlide.metadata.shapeCount = baseSlide.shapes.length;
  baseSlide.contentId = 'black';
  baseSlide.id = 'black-screen';

  return baseSlide;
}

function convertLogoScreen(content: LiveContent, slideSize: { width: number; height: number }, baseSlide: GeneratedSlide): GeneratedSlide {
  const { width, height } = slideSize;

  // Dark background
  const background = BackgroundShape.createSolidColor(SHARED_STYLES.colors.background.dark, width, height);
  baseSlide.shapes.push(background);

  // Logo placeholder
  const logoBox = new RectangleShape(
    { position: { x: width * 0.4, y: height * 0.4 }, size: { width: width * 0.2, height: height * 0.2 } },
    {
      fill: createColor(100, 150, 255, 0.3),
      stroke: { width: 3, color: createColor(100, 150, 255), style: 'solid' },
      borderRadius: 20
    }
  );
  logoBox.setZIndex(1);
  baseSlide.shapes.push(logoBox);

  // Logo text
  const logoText = new TextShape(
    { position: { x: width * 0.3, y: height * 0.65 }, size: { width: width * 0.4, height: height * 0.08 } },
    {
      fontSize: Math.floor(height * 0.04),
      fontWeight: 'bold',
      fontFamily: SHARED_STYLES.fonts.primary,
      color: SHARED_STYLES.colors.text.primary,
      textAlign: 'center',
      verticalAlign: 'middle'
    }
  );
  logoText.setText('Church Logo');
  logoText.setZIndex(1);
  baseSlide.shapes.push(logoText);

  baseSlide.metadata.shapeCount = baseSlide.shapes.length;
  baseSlide.contentId = 'logo';
  baseSlide.id = 'logo-screen';

  return baseSlide;
}

function convertTemplateGeneratedContent(content: LiveContent, slideSize: { width: number; height: number }, baseSlide: GeneratedSlide): GeneratedSlide {
  // This is a complex case that would need template system integration
  // For now, create a placeholder that indicates template generation is needed
  const { width, height } = slideSize;

  // Background
  const background = BackgroundShape.createLinearGradient(
    [
      { offset: 0, color: SHARED_STYLES.colors.background.gradient1.start },
      { offset: 1, color: SHARED_STYLES.colors.background.gradient1.end }
    ],
    135,
    width,
    height
  );
  baseSlide.shapes.push(background);

  // Template generation message
  const message = new TextShape(
    { position: { x: width * 0.1, y: height * 0.4 }, size: { width: width * 0.8, height: height * 0.2 } },
    {
      fontSize: Math.floor(height * 0.05),
      fontWeight: 'bold',
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
  message.setText('Template Generation Required\nContent needs template processing');
  message.setZIndex(1);
  baseSlide.shapes.push(message);

  baseSlide.metadata.shapeCount = baseSlide.shapes.length;
  baseSlide.contentId = content.type;

  return baseSlide;
}

function convertDefaultContent(content: LiveContent, slideSize: { width: number; height: number }, baseSlide: GeneratedSlide): GeneratedSlide {
  const { width, height } = slideSize;

  // Default gradient background
  const background = BackgroundShape.createLinearGradient(
    [
      { offset: 0, color: SHARED_STYLES.colors.background.gradient1.start },
      { offset: 1, color: SHARED_STYLES.colors.background.gradient1.end }
    ],
    135,
    width,
    height
  );
  baseSlide.shapes.push(background);

  // Welcome text
  const welcomeText = new TextShape(
    { position: { x: width * 0.1, y: height * 0.4 }, size: { width: width * 0.8, height: height * 0.1 } },
    {
      fontSize: Math.floor(height * 0.08),
      fontWeight: 'bold',
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
  welcomeText.setText('PraisePresent Live Display');
  welcomeText.setZIndex(1);
  baseSlide.shapes.push(welcomeText);

  // Status text
  const statusText = new TextShape(
    { position: { x: width * 0.1, y: height * 0.55 }, size: { width: width * 0.8, height: height * 0.05 } },
    {
      fontSize: Math.floor(height * 0.035),
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
  statusText.setText('Ready for presentation content');
  statusText.setZIndex(1);
  baseSlide.shapes.push(statusText);

  baseSlide.metadata.shapeCount = baseSlide.shapes.length;
  baseSlide.contentId = 'default';

  return baseSlide;
}

// Helper function to parse color strings to Color objects
function parseColor(colorString: string) {
  if (colorString.startsWith('#')) {
    // Parse hex color
    const hex = colorString.slice(1);
    const r = parseInt(hex.slice(0, 2), 16);
    const g = parseInt(hex.slice(2, 4), 16);
    const b = parseInt(hex.slice(4, 6), 16);
    return createColor(r, g, b);
  }
  // Default fallback
  return createColor(26, 26, 26); // Dark background
}

/**
 * Validates that a slide has the correct structure for rendering
 */
export function validateSlideStructure(slide: GeneratedSlide): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!slide.id) {
    errors.push('Slide missing required id');
  }

  if (!Array.isArray(slide.shapes)) {
    errors.push('Slide missing shapes array');
  }

  if (!slide.metadata) {
    errors.push('Slide missing metadata');
  }

  // Validate that shapes are actual Shape instances
  if (slide.shapes) {
    slide.shapes.forEach((shape, index) => {
      if (!shape || typeof shape.render !== 'function') {
        errors.push(`Shape at index ${index} is not a valid Shape instance`);
      }
    });
  }

  return { valid: errors.length === 0, errors };
}