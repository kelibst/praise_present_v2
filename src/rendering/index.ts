// Core rendering engine
export * from './core';

// Shape library
export * from './shapes';

// Template system
export * from './templates';

// Responsive rendering system
export * from './responsive';

// Slide generation
export { SlideGenerator, slideGenerator, type SlideContent, type GeneratedSlide, type SlideGenerationProgress } from './SlideGenerator';

// Type definitions
export * from './types';

// Utilities
export { convertContentToSlide, validateSlideStructure } from './utils/slideConverter';
export { ShapeFactory, reconstructShape, reconstructShapes } from './utils/ShapeFactory';
export { ResourceManager, useResourceCleanup } from './utils/ResourceManager';
export {
  isTextShape,
  isRectangleShape,
  isBackgroundShape,
  isImageShape,
  isShape,
  isRenderableShape,
  analyzeShape
} from './utils/shapeTypeGuards';
export { ScalingManager } from './utils/ScalingManager';

// Advanced layout system
export {
  AdvancedLayoutMode,
  AdvancedLayoutManager,
  ADVANCED_LAYOUT_CONFIGS
} from './layout/AdvancedLayoutModes';