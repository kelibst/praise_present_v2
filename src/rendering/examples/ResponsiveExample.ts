/**
 * Example demonstrating the responsive rendering system
 * This file shows how to use the new responsive features
 */

import {
  ResponsiveRenderingEngine,
  ResponsiveTextShape,
  ResponsiveLayoutManager,
  TypographyScaler,
  TypographyScaleMode,
  LayoutMode,
  px,
  percent,
  vw,
  vh,
  rem,
  createFlexiblePosition,
  createFlexibleSize,
  parseFlexibleValue
} from '../responsive';

import { RenderQuality } from '../types/rendering';

/**
 * Create a responsive presentation slide example
 */
export function createResponsiveSlideExample(canvas: HTMLCanvasElement): ResponsiveRenderingEngine {
  // Create responsive rendering engine with breakpoints
  const engine = new ResponsiveRenderingEngine({
    canvas,
    enableDebug: true,
    settings: {
      quality: RenderQuality.HIGH,
      targetFPS: 60,
      enableCaching: true
    },
    breakpoints: [
      {
        name: 'mobile',
        maxWidth: 600,
        config: {
          mode: LayoutMode.STRETCH,
          padding: px(12),
          margin: px(8)
        }
      },
      {
        name: 'tablet',
        minWidth: 601,
        maxWidth: 1200,
        config: {
          mode: LayoutMode.CENTER,
          padding: px(24),
          margin: px(16)
        }
      },
      {
        name: 'desktop',
        minWidth: 1201,
        config: {
          mode: LayoutMode.FIT_CONTENT,
          padding: px(32),
          margin: px(24)
        }
      }
    ],
    baseFontSize: 16
  });

  // Create responsive title text
  const titleText = new ResponsiveTextShape({
    text: 'Responsive Presentation Title',
    flexiblePosition: createFlexiblePosition(percent(50), percent(15)),
    flexibleSize: createFlexibleSize(percent(80), percent(20)),
    layoutConfig: {
      mode: LayoutMode.CENTER,
      padding: px(16),
      aspectRatio: 4 // 4:1 width to height ratio
    },
    typography: {
      baseSize: rem(3), // 48px at default font size
      scaleRatio: 0.8,
      minSize: 24,
      maxSize: 80,
      lineHeightRatio: 1.2
    },
    textStyle: {
      fontFamily: 'Arial, sans-serif',
      fontWeight: 'bold',
      color: { r: 255, g: 255, b: 255, a: 1 },
      textAlign: 'center'
    },
    responsive: true,
    optimizeReadability: true,
    scaleMode: TypographyScaleMode.FLUID
  });

  // Create responsive body text
  const bodyText = new ResponsiveTextShape({
    text: 'This is an example of responsive text that adapts to different screen sizes. The font size, line height, and layout will automatically adjust based on the container dimensions and current breakpoint.',
    flexiblePosition: createFlexiblePosition(percent(10), percent(40)),
    flexibleSize: createFlexibleSize(percent(80), percent(40)),
    layoutConfig: {
      mode: LayoutMode.FIT_CONTENT,
      padding: px(20),
      margin: px(10)
    },
    typography: {
      baseSize: rem(1.2), // 19.2px at default font size
      scaleRatio: 0.6,
      minSize: 14,
      maxSize: 32,
      lineHeightRatio: 1.4
    },
    textStyle: {
      fontFamily: 'Arial, sans-serif',
      fontWeight: 'normal',
      color: { r: 200, g: 200, b: 200, a: 1 },
      textAlign: 'left'
    },
    responsive: true,
    optimizeReadability: true,
    scaleMode: TypographyScaleMode.LOGARITHMIC,
    wordWrap: true,
    maxLines: 6
  });

  // Create footer text with viewport-relative positioning
  const footerText = new ResponsiveTextShape({
    text: 'Footer - Always at bottom with responsive sizing',
    flexiblePosition: createFlexiblePosition(percent(50), percent(85)),
    flexibleSize: createFlexibleSize(percent(100), percent(10)),
    layoutConfig: {
      mode: LayoutMode.CENTER,
      padding: px(8)
    },
    typography: {
      baseSize: rem(0.9), // 14.4px at default font size
      scaleRatio: 0.4,
      minSize: 10,
      maxSize: 20,
      lineHeightRatio: 1.2
    },
    textStyle: {
      fontFamily: 'Arial, sans-serif',
      fontWeight: 'normal',
      color: { r: 150, g: 150, b: 150, a: 0.8 },
      textAlign: 'center'
    },
    responsive: true,
    scaleMode: TypographyScaleMode.LINEAR
  });

  // Add shapes to the engine
  engine.addResponsiveShape(titleText);
  engine.addResponsiveShape(bodyText);
  engine.addResponsiveShape(footerText);

  return engine;
}

/**
 * Example of different layout modes
 */
export function createLayoutModeExamples(canvas: HTMLCanvasElement): ResponsiveRenderingEngine {
  const engine = new ResponsiveRenderingEngine({
    canvas,
    enableDebug: true
  });

  const layoutModes = [
    { mode: LayoutMode.STRETCH, label: 'Stretch', y: 10 },
    { mode: LayoutMode.CENTER, label: 'Center', y: 25 },
    { mode: LayoutMode.FIT_CONTENT, label: 'Fit Content', y: 40 },
    { mode: LayoutMode.ASPECT_FIT, label: 'Aspect Fit', y: 55 },
    { mode: LayoutMode.ASPECT_FILL, label: 'Aspect Fill', y: 70 }
  ];

  layoutModes.forEach(({ mode, label, y }) => {
    const text = new ResponsiveTextShape({
      text: `${label} Mode Example`,
      flexiblePosition: createFlexiblePosition(percent(20), percent(y)),
      flexibleSize: createFlexibleSize(percent(60), percent(10)),
      layoutConfig: {
        mode,
        padding: px(8),
        margin: px(4)
      },
      typography: {
        baseSize: rem(1),
        scaleRatio: 0.5,
        minSize: 12,
        maxSize: 24,
        lineHeightRatio: 1.3
      },
      textStyle: {
        fontFamily: 'Arial, sans-serif',
        color: { r: 255, g: 255, b: 255, a: 1 },
        textAlign: 'center'
      },
      responsive: true
    });

    engine.addResponsiveShape(text);
  });

  return engine;
}

/**
 * Example showing different flexible units
 */
export function createFlexibleUnitsExample(canvas: HTMLCanvasElement): ResponsiveRenderingEngine {
  const engine = new ResponsiveRenderingEngine({
    canvas,
    enableDebug: true
  });

  const unitExamples = [
    { unit: 'px(200)', position: px(200), label: 'Pixels (200px)' },
    { unit: '25%', position: percent(25), label: '25% of container' },
    { unit: '30vw', position: vw(30), label: '30% viewport width' },
    { unit: '20vh', position: vh(20), label: '20% viewport height' },
    { unit: '2rem', position: rem(2), label: '2rem (2x base font)' }
  ];

  unitExamples.forEach(({ position, label }, index) => {
    const text = new ResponsiveTextShape({
      text: label,
      flexiblePosition: createFlexiblePosition(position, percent(15 + index * 15)),
      flexibleSize: createFlexibleSize(percent(40), percent(8)),
      layoutConfig: {
        mode: LayoutMode.FIT_CONTENT,
        padding: px(4)
      },
      typography: {
        baseSize: rem(0.9),
        scaleRatio: 0.4,
        minSize: 10,
        maxSize: 18,
        lineHeightRatio: 1.2
      },
      textStyle: {
        fontFamily: 'monospace',
        color: { r: 255, g: 255, b: 255, a: 1 },
        textAlign: 'left'
      },
      responsive: true
    });

    engine.addResponsiveShape(text);
  });

  return engine;
}

/**
 * Example showing typography scaling modes
 */
export function createTypographyScalingExample(canvas: HTMLCanvasElement): ResponsiveRenderingEngine {
  const engine = new ResponsiveRenderingEngine({
    canvas,
    enableDebug: true
  });

  const scalingModes = [
    { mode: TypographyScaleMode.LINEAR, label: 'Linear Scaling' },
    { mode: TypographyScaleMode.LOGARITHMIC, label: 'Logarithmic Scaling' },
    { mode: TypographyScaleMode.STEPPED, label: 'Stepped Scaling' },
    { mode: TypographyScaleMode.FLUID, label: 'Fluid Scaling' }
  ];

  scalingModes.forEach((config, index) => {
    const text = new ResponsiveTextShape({
      text: `${config.label}: Text that scales using ${config.mode} mode`,
      flexiblePosition: createFlexiblePosition(percent(5), percent(20 + index * 20)),
      flexibleSize: createFlexibleSize(percent(90), percent(15)),
      layoutConfig: {
        mode: LayoutMode.FIT_CONTENT,
        padding: px(8)
      },
      typography: {
        baseSize: rem(1.2),
        scaleRatio: 0.7,
        minSize: 12,
        maxSize: 36,
        lineHeightRatio: 1.3
      },
      textStyle: {
        fontFamily: 'Arial, sans-serif',
        color: { r: 255, g: 255, b: 255, a: 1 },
        textAlign: 'left'
      },
      responsive: true,
      optimizeReadability: true,
      scaleMode: config.mode,
      wordWrap: true
    });

    engine.addResponsiveShape(text);
  });

  return engine;
}

/**
 * Utility function to demonstrate responsive behavior
 */
export function demonstrateResponsiveBehavior(engine: ResponsiveRenderingEngine): void {
  const canvas = engine.getLayoutManager().getContainerInfo();

  console.log('Current Responsive Status:', engine.getResponsiveStatus());

  // Simulate different container sizes
  const testSizes = [
    { width: 400, height: 300, name: 'Small Mobile' },
    { width: 768, height: 576, name: 'Tablet' },
    { width: 1200, height: 900, name: 'Desktop' },
    { width: 1920, height: 1080, name: 'Full HD' }
  ];

  console.log('Testing responsive behavior at different sizes:');

  testSizes.forEach(size => {
    // Simulate resize (in real usage, this would be handled by ResizeObserver)
    engine.resize(size.width, size.height);

    const status = engine.getResponsiveStatus();
    console.log(`${size.name} (${size.width}x${size.height}):`, {
      breakpoint: status.currentBreakpoint?.name,
      aspectRatio: status.containerInfo.aspectRatio.toFixed(2),
      responsiveShapes: status.responsiveShapeCount
    });
  });
}