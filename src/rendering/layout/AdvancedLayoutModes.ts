import { LayoutMode } from '../types/responsive';
import { ResponsiveLayoutManager, ContainerInfo } from './ResponsiveLayoutManager';
import { Rectangle, Point, Size } from '../types/geometry';

/**
 * Specialized layout configurations for different content types
 */
export interface ContentLayoutConfig {
  mode: AdvancedLayoutMode;
  contentPadding: { top: number; right: number; bottom: number; left: number };
  titleArea?: Rectangle; // Relative to container (0-1 scale)
  contentArea?: Rectangle;
  footerArea?: Rectangle;
  maxContentLines?: number;
  textAlignment: 'left' | 'center' | 'right' | 'justify';
  verticalAlignment: 'top' | 'middle' | 'bottom' | 'distribute';
  backgroundStyle: 'none' | 'subtle' | 'card' | 'full-overlay';
  responsiveBreakpoints: {
    small: Partial<ContentLayoutConfig>;
    medium: Partial<ContentLayoutConfig>;
    large: Partial<ContentLayoutConfig>;
  };
}

/**
 * Advanced layout modes for different content types
 */
export enum AdvancedLayoutMode {
  // Scripture layouts
  SCRIPTURE_CENTERED = 'scripture-centered',
  SCRIPTURE_VERSE_REFERENCE = 'scripture-verse-reference',
  SCRIPTURE_READING = 'scripture-reading',
  SCRIPTURE_MEMORY = 'scripture-memory',

  // Song layouts
  SONG_TITLE_VERSE = 'song-title-verse',
  SONG_CHORUS_EMPHASIS = 'song-chorus-emphasis',
  SONG_BRIDGE = 'song-bridge',
  SONG_CREDITS = 'song-credits',

  // Announcement layouts
  ANNOUNCEMENT_HEADER = 'announcement-header',
  ANNOUNCEMENT_DETAILS = 'announcement-details',
  ANNOUNCEMENT_CALL_ACTION = 'announcement-call-action',
  ANNOUNCEMENT_EVENT = 'announcement-event',

  // Title and special layouts
  TITLE_SPLASH = 'title-splash',
  TITLE_SECTION = 'title-section',
  PRAYER_REQUEST = 'prayer-request',
  SERMON_POINT = 'sermon-point',
  WELCOME_MESSAGE = 'welcome-message'
}

/**
 * Predefined layout configurations for different content types
 */
export const ADVANCED_LAYOUT_CONFIGS: Record<AdvancedLayoutMode, ContentLayoutConfig> = {
  // Scripture Layouts
  [AdvancedLayoutMode.SCRIPTURE_CENTERED]: {
    mode: AdvancedLayoutMode.SCRIPTURE_CENTERED,
    contentPadding: { top: 80, right: 120, bottom: 80, left: 120 },
    contentArea: { x: 0.1, y: 0.25, width: 0.8, height: 0.5 },
    footerArea: { x: 0.1, y: 0.8, width: 0.8, height: 0.15 },
    maxContentLines: 8,
    textAlignment: 'center',
    verticalAlignment: 'middle',
    backgroundStyle: 'subtle',
    responsiveBreakpoints: {
      small: { contentPadding: { top: 40, right: 60, bottom: 40, left: 60 } },
      medium: { contentPadding: { top: 60, right: 90, bottom: 60, left: 90 } },
      large: { contentPadding: { top: 100, right: 150, bottom: 100, left: 150 } }
    }
  },

  [AdvancedLayoutMode.SCRIPTURE_VERSE_REFERENCE]: {
    mode: AdvancedLayoutMode.SCRIPTURE_VERSE_REFERENCE,
    contentPadding: { top: 60, right: 100, bottom: 120, left: 100 },
    contentArea: { x: 0.1, y: 0.2, width: 0.8, height: 0.6 },
    footerArea: { x: 0.1, y: 0.85, width: 0.8, height: 0.1 },
    maxContentLines: 10,
    textAlignment: 'center',
    verticalAlignment: 'middle',
    backgroundStyle: 'card',
    responsiveBreakpoints: {
      small: { maxContentLines: 6 },
      medium: { maxContentLines: 8 },
      large: { maxContentLines: 12 }
    }
  },

  [AdvancedLayoutMode.SCRIPTURE_READING]: {
    mode: AdvancedLayoutMode.SCRIPTURE_READING,
    contentPadding: { top: 40, right: 80, bottom: 40, left: 80 },
    titleArea: { x: 0.1, y: 0.05, width: 0.8, height: 0.1 },
    contentArea: { x: 0.1, y: 0.18, width: 0.8, height: 0.7 },
    footerArea: { x: 0.1, y: 0.92, width: 0.8, height: 0.06 },
    maxContentLines: 15,
    textAlignment: 'left',
    verticalAlignment: 'top',
    backgroundStyle: 'none',
    responsiveBreakpoints: {
      small: { textAlignment: 'center', maxContentLines: 10 },
      medium: { maxContentLines: 12 },
      large: { maxContentLines: 18 }
    }
  },

  [AdvancedLayoutMode.SCRIPTURE_MEMORY]: {
    mode: AdvancedLayoutMode.SCRIPTURE_MEMORY,
    contentPadding: { top: 100, right: 140, bottom: 100, left: 140 },
    contentArea: { x: 0.15, y: 0.3, width: 0.7, height: 0.4 },
    footerArea: { x: 0.15, y: 0.75, width: 0.7, height: 0.15 },
    maxContentLines: 6,
    textAlignment: 'center',
    verticalAlignment: 'middle',
    backgroundStyle: 'full-overlay',
    responsiveBreakpoints: {
      small: { contentPadding: { top: 60, right: 80, bottom: 60, left: 80 } },
      medium: { contentPadding: { top: 80, right: 100, bottom: 80, left: 100 } },
      large: { contentPadding: { top: 120, right: 160, bottom: 120, left: 160 } }
    }
  },

  // Song Layouts
  [AdvancedLayoutMode.SONG_TITLE_VERSE]: {
    mode: AdvancedLayoutMode.SONG_TITLE_VERSE,
    contentPadding: { top: 60, right: 80, bottom: 80, left: 80 },
    titleArea: { x: 0.1, y: 0.1, width: 0.8, height: 0.15 },
    contentArea: { x: 0.1, y: 0.3, width: 0.8, height: 0.6 },
    maxContentLines: 12,
    textAlignment: 'center',
    verticalAlignment: 'middle',
    backgroundStyle: 'subtle',
    responsiveBreakpoints: {
      small: { maxContentLines: 8 },
      medium: { maxContentLines: 10 },
      large: { maxContentLines: 15 }
    }
  },

  [AdvancedLayoutMode.SONG_CHORUS_EMPHASIS]: {
    mode: AdvancedLayoutMode.SONG_CHORUS_EMPHASIS,
    contentPadding: { top: 80, right: 60, bottom: 80, left: 60 },
    contentArea: { x: 0.05, y: 0.25, width: 0.9, height: 0.5 },
    maxContentLines: 8,
    textAlignment: 'center',
    verticalAlignment: 'middle',
    backgroundStyle: 'card',
    responsiveBreakpoints: {
      small: { maxContentLines: 6 },
      medium: { maxContentLines: 7 },
      large: { maxContentLines: 10 }
    }
  },

  [AdvancedLayoutMode.SONG_BRIDGE]: {
    mode: AdvancedLayoutMode.SONG_BRIDGE,
    contentPadding: { top: 100, right: 100, bottom: 100, left: 100 },
    contentArea: { x: 0.15, y: 0.35, width: 0.7, height: 0.3 },
    maxContentLines: 4,
    textAlignment: 'center',
    verticalAlignment: 'middle',
    backgroundStyle: 'full-overlay',
    responsiveBreakpoints: {
      small: { maxContentLines: 3 },
      medium: { maxContentLines: 4 },
      large: { maxContentLines: 6 }
    }
  },

  [AdvancedLayoutMode.SONG_CREDITS]: {
    mode: AdvancedLayoutMode.SONG_CREDITS,
    contentPadding: { top: 40, right: 60, bottom: 40, left: 60 },
    titleArea: { x: 0.1, y: 0.1, width: 0.8, height: 0.2 },
    contentArea: { x: 0.1, y: 0.35, width: 0.8, height: 0.5 },
    footerArea: { x: 0.1, y: 0.9, width: 0.8, height: 0.08 },
    maxContentLines: 10,
    textAlignment: 'center',
    verticalAlignment: 'distribute',
    backgroundStyle: 'subtle',
    responsiveBreakpoints: {
      small: { maxContentLines: 6 },
      medium: { maxContentLines: 8 },
      large: { maxContentLines: 12 }
    }
  },

  // Announcement Layouts
  [AdvancedLayoutMode.ANNOUNCEMENT_HEADER]: {
    mode: AdvancedLayoutMode.ANNOUNCEMENT_HEADER,
    contentPadding: { top: 40, right: 60, bottom: 40, left: 60 },
    titleArea: { x: 0.05, y: 0.05, width: 0.9, height: 0.2 },
    contentArea: { x: 0.1, y: 0.3, width: 0.8, height: 0.65 },
    maxContentLines: 15,
    textAlignment: 'left',
    verticalAlignment: 'top',
    backgroundStyle: 'card',
    responsiveBreakpoints: {
      small: { textAlignment: 'center', maxContentLines: 10 },
      medium: { maxContentLines: 12 },
      large: { maxContentLines: 18 }
    }
  },

  [AdvancedLayoutMode.ANNOUNCEMENT_DETAILS]: {
    mode: AdvancedLayoutMode.ANNOUNCEMENT_DETAILS,
    contentPadding: { top: 50, right: 70, bottom: 50, left: 70 },
    titleArea: { x: 0.1, y: 0.08, width: 0.8, height: 0.12 },
    contentArea: { x: 0.1, y: 0.25, width: 0.8, height: 0.7 },
    maxContentLines: 20,
    textAlignment: 'left',
    verticalAlignment: 'top',
    backgroundStyle: 'subtle',
    responsiveBreakpoints: {
      small: { maxContentLines: 12 },
      medium: { maxContentLines: 16 },
      large: { maxContentLines: 25 }
    }
  },

  [AdvancedLayoutMode.ANNOUNCEMENT_CALL_ACTION]: {
    mode: AdvancedLayoutMode.ANNOUNCEMENT_CALL_ACTION,
    contentPadding: { top: 80, right: 100, bottom: 80, left: 100 },
    titleArea: { x: 0.1, y: 0.15, width: 0.8, height: 0.2 },
    contentArea: { x: 0.1, y: 0.4, width: 0.8, height: 0.35 },
    footerArea: { x: 0.1, y: 0.8, width: 0.8, height: 0.15 },
    maxContentLines: 8,
    textAlignment: 'center',
    verticalAlignment: 'middle',
    backgroundStyle: 'card',
    responsiveBreakpoints: {
      small: { maxContentLines: 6 },
      medium: { maxContentLines: 7 },
      large: { maxContentLines: 10 }
    }
  },

  [AdvancedLayoutMode.ANNOUNCEMENT_EVENT]: {
    mode: AdvancedLayoutMode.ANNOUNCEMENT_EVENT,
    contentPadding: { top: 60, right: 80, bottom: 60, left: 80 },
    titleArea: { x: 0.1, y: 0.1, width: 0.8, height: 0.15 },
    contentArea: { x: 0.1, y: 0.3, width: 0.8, height: 0.5 },
    footerArea: { x: 0.1, y: 0.85, width: 0.8, height: 0.1 },
    maxContentLines: 12,
    textAlignment: 'center',
    verticalAlignment: 'distribute',
    backgroundStyle: 'subtle',
    responsiveBreakpoints: {
      small: { maxContentLines: 8 },
      medium: { maxContentLines: 10 },
      large: { maxContentLines: 15 }
    }
  },

  // Special Layouts
  [AdvancedLayoutMode.TITLE_SPLASH]: {
    mode: AdvancedLayoutMode.TITLE_SPLASH,
    contentPadding: { top: 120, right: 150, bottom: 120, left: 150 },
    contentArea: { x: 0.1, y: 0.35, width: 0.8, height: 0.3 },
    maxContentLines: 3,
    textAlignment: 'center',
    verticalAlignment: 'middle',
    backgroundStyle: 'full-overlay',
    responsiveBreakpoints: {
      small: { maxContentLines: 2, contentPadding: { top: 80, right: 100, bottom: 80, left: 100 } },
      medium: { maxContentLines: 3, contentPadding: { top: 100, right: 125, bottom: 100, left: 125 } },
      large: { maxContentLines: 4, contentPadding: { top: 140, right: 180, bottom: 140, left: 180 } }
    }
  },

  [AdvancedLayoutMode.TITLE_SECTION]: {
    mode: AdvancedLayoutMode.TITLE_SECTION,
    contentPadding: { top: 100, right: 120, bottom: 100, left: 120 },
    titleArea: { x: 0.1, y: 0.25, width: 0.8, height: 0.2 },
    contentArea: { x: 0.1, y: 0.5, width: 0.8, height: 0.25 },
    maxContentLines: 5,
    textAlignment: 'center',
    verticalAlignment: 'middle',
    backgroundStyle: 'card',
    responsiveBreakpoints: {
      small: { maxContentLines: 3 },
      medium: { maxContentLines: 4 },
      large: { maxContentLines: 6 }
    }
  },

  [AdvancedLayoutMode.PRAYER_REQUEST]: {
    mode: AdvancedLayoutMode.PRAYER_REQUEST,
    contentPadding: { top: 80, right: 100, bottom: 80, left: 100 },
    titleArea: { x: 0.1, y: 0.15, width: 0.8, height: 0.15 },
    contentArea: { x: 0.1, y: 0.35, width: 0.8, height: 0.5 },
    maxContentLines: 10,
    textAlignment: 'center',
    verticalAlignment: 'middle',
    backgroundStyle: 'subtle',
    responsiveBreakpoints: {
      small: { maxContentLines: 6 },
      medium: { maxContentLines: 8 },
      large: { maxContentLines: 12 }
    }
  },

  [AdvancedLayoutMode.SERMON_POINT]: {
    mode: AdvancedLayoutMode.SERMON_POINT,
    contentPadding: { top: 60, right: 80, bottom: 60, left: 80 },
    titleArea: { x: 0.1, y: 0.1, width: 0.8, height: 0.2 },
    contentArea: { x: 0.1, y: 0.35, width: 0.8, height: 0.55 },
    maxContentLines: 12,
    textAlignment: 'left',
    verticalAlignment: 'top',
    backgroundStyle: 'card',
    responsiveBreakpoints: {
      small: { textAlignment: 'center', maxContentLines: 8 },
      medium: { maxContentLines: 10 },
      large: { maxContentLines: 15 }
    }
  },

  [AdvancedLayoutMode.WELCOME_MESSAGE]: {
    mode: AdvancedLayoutMode.WELCOME_MESSAGE,
    contentPadding: { top: 100, right: 120, bottom: 100, left: 120 },
    titleArea: { x: 0.1, y: 0.2, width: 0.8, height: 0.2 },
    contentArea: { x: 0.1, y: 0.45, width: 0.8, height: 0.35 },
    maxContentLines: 8,
    textAlignment: 'center',
    verticalAlignment: 'middle',
    backgroundStyle: 'subtle',
    responsiveBreakpoints: {
      small: { maxContentLines: 5 },
      medium: { maxContentLines: 6 },
      large: { maxContentLines: 10 }
    }
  }
};

/**
 * Advanced layout manager that applies specialized layouts for different content types
 */
export class AdvancedLayoutManager extends ResponsiveLayoutManager {
  private currentLayoutMode?: AdvancedLayoutMode;
  private currentLayoutConfig?: ContentLayoutConfig;

  /**
   * Apply an advanced layout mode to the container
   */
  public applyAdvancedLayout(
    layoutMode: AdvancedLayoutMode,
    containerSize: Size,
    customConfig?: Partial<ContentLayoutConfig>
  ): {
    layout: ContentLayoutConfig;
    areas: {
      title?: Rectangle;
      content: Rectangle;
      footer?: Rectangle;
    };
    metrics: {
      availableContentWidth: number;
      availableContentHeight: number;
      recommendedFontSize: number;
      maxTextLines: number;
    };
  } {
    this.currentLayoutMode = layoutMode;

    // Get base layout configuration
    let layoutConfig = { ...ADVANCED_LAYOUT_CONFIGS[layoutMode] };

    // Apply custom overrides
    if (customConfig) {
      layoutConfig = { ...layoutConfig, ...customConfig };
    }

    // Apply responsive breakpoints
    const containerInfo = this.getContainerInfo();
    const breakpointConfig = this.getBreakpointConfig(layoutConfig, containerInfo);
    layoutConfig = { ...layoutConfig, ...breakpointConfig };

    this.currentLayoutConfig = layoutConfig;

    // Calculate actual areas in pixels
    const areas = this.calculateLayoutAreas(layoutConfig, containerSize);

    // Calculate metrics
    const metrics = this.calculateLayoutMetrics(layoutConfig, areas, containerSize);

    console.log('🎨 AdvancedLayoutManager: Applied layout', {
      mode: layoutMode,
      containerSize,
      areas: {
        title: areas.title ? `${areas.title.width}x${areas.title.height}` : 'none',
        content: `${areas.content.width}x${areas.content.height}`,
        footer: areas.footer ? `${areas.footer.width}x${areas.footer.height}` : 'none'
      },
      metrics
    });

    return {
      layout: layoutConfig,
      areas,
      metrics
    };
  }

  /**
   * Get layout configuration for current breakpoint
   */
  private getBreakpointConfig(
    baseConfig: ContentLayoutConfig,
    containerInfo: ContainerInfo
  ): Partial<ContentLayoutConfig> {
    const { width } = containerInfo;

    if (width < 800) {
      return baseConfig.responsiveBreakpoints.small;
    } else if (width < 1400) {
      return baseConfig.responsiveBreakpoints.medium;
    } else {
      return baseConfig.responsiveBreakpoints.large;
    }
  }

  /**
   * Calculate actual pixel areas from relative layout config
   */
  private calculateLayoutAreas(
    config: ContentLayoutConfig,
    containerSize: Size
  ): {
    title?: Rectangle;
    content: Rectangle;
    footer?: Rectangle;
  } {
    const areas: { title?: Rectangle; content: Rectangle; footer?: Rectangle } = {
      content: { x: 0, y: 0, width: 0, height: 0 }
    };

    // Apply padding
    const contentBounds = {
      x: config.contentPadding.left,
      y: config.contentPadding.top,
      width: containerSize.width - config.contentPadding.left - config.contentPadding.right,
      height: containerSize.height - config.contentPadding.top - config.contentPadding.bottom
    };

    // Calculate title area
    if (config.titleArea) {
      areas.title = {
        x: contentBounds.x + (config.titleArea.x * contentBounds.width),
        y: contentBounds.y + (config.titleArea.y * contentBounds.height),
        width: config.titleArea.width * contentBounds.width,
        height: config.titleArea.height * contentBounds.height
      };
    }

    // Calculate main content area
    if (config.contentArea) {
      areas.content = {
        x: contentBounds.x + (config.contentArea.x * contentBounds.width),
        y: contentBounds.y + (config.contentArea.y * contentBounds.height),
        width: config.contentArea.width * contentBounds.width,
        height: config.contentArea.height * contentBounds.height
      };
    } else {
      // Use remaining space after title and footer
      const titleHeight = areas.title?.height || 0;
      const footerHeight = config.footerArea ? (config.footerArea.height * contentBounds.height) : 0;

      areas.content = {
        x: contentBounds.x,
        y: contentBounds.y + titleHeight,
        width: contentBounds.width,
        height: contentBounds.height - titleHeight - footerHeight
      };
    }

    // Calculate footer area
    if (config.footerArea) {
      areas.footer = {
        x: contentBounds.x + (config.footerArea.x * contentBounds.width),
        y: contentBounds.y + (config.footerArea.y * contentBounds.height),
        width: config.footerArea.width * contentBounds.width,
        height: config.footerArea.height * contentBounds.height
      };
    }

    return areas;
  }

  /**
   * Calculate metrics for the layout
   */
  private calculateLayoutMetrics(
    config: ContentLayoutConfig,
    areas: ReturnType<AdvancedLayoutManager['calculateLayoutAreas']>,
    containerSize: Size
  ): {
    availableContentWidth: number;
    availableContentHeight: number;
    recommendedFontSize: number;
    maxTextLines: number;
  } {
    const { content } = areas;
    const maxLines = config.maxContentLines || 10;

    // Calculate recommended font size based on content area
    const contentArea = content.width * content.height;
    const baseSize = Math.sqrt(contentArea) * 0.08; // Base scaling factor
    const recommendedFontSize = Math.max(16, Math.min(72, baseSize));

    return {
      availableContentWidth: content.width,
      availableContentHeight: content.height,
      recommendedFontSize,
      maxTextLines: maxLines
    };
  }

  /**
   * Get recommended layout mode for content type and characteristics
   */
  public static getRecommendedLayout(
    contentType: 'scripture' | 'song' | 'announcement' | 'title' | 'prayer' | 'sermon',
    contentSubtype?: string,
    textLength?: number
  ): AdvancedLayoutMode {
    switch (contentType) {
      case 'scripture':
        if (textLength && textLength > 500) return AdvancedLayoutMode.SCRIPTURE_READING;
        if (contentSubtype === 'memory') return AdvancedLayoutMode.SCRIPTURE_MEMORY;
        return AdvancedLayoutMode.SCRIPTURE_CENTERED;

      case 'song':
        if (contentSubtype === 'chorus') return AdvancedLayoutMode.SONG_CHORUS_EMPHASIS;
        if (contentSubtype === 'bridge') return AdvancedLayoutMode.SONG_BRIDGE;
        if (contentSubtype === 'credits') return AdvancedLayoutMode.SONG_CREDITS;
        return AdvancedLayoutMode.SONG_TITLE_VERSE;

      case 'announcement':
        if (contentSubtype === 'call-to-action') return AdvancedLayoutMode.ANNOUNCEMENT_CALL_ACTION;
        if (contentSubtype === 'event') return AdvancedLayoutMode.ANNOUNCEMENT_EVENT;
        if (textLength && textLength > 300) return AdvancedLayoutMode.ANNOUNCEMENT_DETAILS;
        return AdvancedLayoutMode.ANNOUNCEMENT_HEADER;

      case 'title':
        if (contentSubtype === 'section') return AdvancedLayoutMode.TITLE_SECTION;
        return AdvancedLayoutMode.TITLE_SPLASH;

      case 'prayer':
        return AdvancedLayoutMode.PRAYER_REQUEST;

      case 'sermon':
        return AdvancedLayoutMode.SERMON_POINT;

      default:
        return AdvancedLayoutMode.SCRIPTURE_CENTERED;
    }
  }

  /**
   * Get current layout mode
   */
  public getCurrentLayoutMode(): AdvancedLayoutMode | undefined {
    return this.currentLayoutMode;
  }

  /**
   * Get current layout configuration
   */
  public getCurrentLayoutConfig(): ContentLayoutConfig | undefined {
    return this.currentLayoutConfig;
  }

  /**
   * Get layout configuration for a specific mode and container
   * Called by ResponsiveRenderingEngine
   */
  public getLayoutConfig(
    layoutMode: AdvancedLayoutMode,
    containerInfo: ContainerInfo
  ): ContentLayoutConfig {
    const baseConfig = ADVANCED_LAYOUT_CONFIGS[layoutMode];
    const breakpointConfig = this.getBreakpointConfig(baseConfig, containerInfo);

    return { ...baseConfig, ...breakpointConfig };
  }

  /**
   * Apply layout configuration to a responsive shape
   * Called by ResponsiveRenderingEngine for each responsive shape
   */
  public applyLayoutToShape(
    shape: any, // ResponsiveShape - avoiding circular import
    layoutConfig: ContentLayoutConfig,
    containerInfo: ContainerInfo
  ): void {
    if (!shape.responsive || !shape.flexiblePosition || !shape.flexibleSize) {
      return; // Skip non-responsive shapes
    }

    // Apply layout-specific positioning and sizing
    const containerSize = { width: containerInfo.width, height: containerInfo.height };

    // Get appropriate area for this shape type
    let targetArea = layoutConfig.contentArea;

    // Simple heuristic: if shape has small text or is positioned at bottom, it might be a reference
    if (shape.text && shape.text.length < 50 && layoutConfig.footerArea) {
      targetArea = layoutConfig.footerArea;
    } else if (shape.textStyle?.fontSize && shape.textStyle.fontSize > 32 && layoutConfig.titleArea) {
      targetArea = layoutConfig.titleArea;
    }

    if (targetArea) {
      // Convert relative coordinates to pixels
      const pixelX = targetArea.x * containerSize.width;
      const pixelY = targetArea.y * containerSize.height;
      const pixelWidth = targetArea.width * containerSize.width;
      const pixelHeight = targetArea.height * containerSize.height;

      // Update shape's flexible position and size to match layout
      shape.flexiblePosition = {
        x: { value: (pixelX / containerSize.width) * 100, unit: 'percent' },
        y: { value: (pixelY / containerSize.height) * 100, unit: 'percent' }
      };

      shape.flexibleSize = {
        width: { value: (pixelWidth / containerSize.width) * 100, unit: 'percent' },
        height: { value: (pixelHeight / containerSize.height) * 100, unit: 'percent' }
      };

      // Apply text alignment from layout config
      if (shape.textStyle) {
        shape.textStyle.textAlign = layoutConfig.textAlignment;
        shape.textStyle.verticalAlign = layoutConfig.verticalAlignment === 'middle' ? 'middle' :
                                        layoutConfig.verticalAlignment === 'bottom' ? 'bottom' : 'top';
      }

      console.log('🎨 AdvancedLayoutManager: Applied layout to shape', {
        shapeId: shape.id,
        targetArea: `${(targetArea.x * 100).toFixed(1)}%,${(targetArea.y * 100).toFixed(1)}% ${(targetArea.width * 100).toFixed(1)}%x${(targetArea.height * 100).toFixed(1)}%`,
        textAlign: layoutConfig.textAlignment,
        verticalAlign: layoutConfig.verticalAlignment
      });
    }
  }

  /**
   * Get all available layout modes
   */
  public static getAllLayoutModes(): AdvancedLayoutMode[] {
    return Object.values(AdvancedLayoutMode);
  }

  /**
   * Get layout modes for a specific content type
   */
  public static getLayoutModesForType(contentType: 'scripture' | 'song' | 'announcement' | 'title' | 'special'): AdvancedLayoutMode[] {
    switch (contentType) {
      case 'scripture':
        return [
          AdvancedLayoutMode.SCRIPTURE_CENTERED,
          AdvancedLayoutMode.SCRIPTURE_VERSE_REFERENCE,
          AdvancedLayoutMode.SCRIPTURE_READING,
          AdvancedLayoutMode.SCRIPTURE_MEMORY
        ];
      case 'song':
        return [
          AdvancedLayoutMode.SONG_TITLE_VERSE,
          AdvancedLayoutMode.SONG_CHORUS_EMPHASIS,
          AdvancedLayoutMode.SONG_BRIDGE,
          AdvancedLayoutMode.SONG_CREDITS
        ];
      case 'announcement':
        return [
          AdvancedLayoutMode.ANNOUNCEMENT_HEADER,
          AdvancedLayoutMode.ANNOUNCEMENT_DETAILS,
          AdvancedLayoutMode.ANNOUNCEMENT_CALL_ACTION,
          AdvancedLayoutMode.ANNOUNCEMENT_EVENT
        ];
      case 'title':
        return [
          AdvancedLayoutMode.TITLE_SPLASH,
          AdvancedLayoutMode.TITLE_SECTION
        ];
      case 'special':
        return [
          AdvancedLayoutMode.PRAYER_REQUEST,
          AdvancedLayoutMode.SERMON_POINT,
          AdvancedLayoutMode.WELCOME_MESSAGE
        ];
      default:
        return [];
    }
  }
}