# Responsive Rendering System

A comprehensive solution for creating adaptive, scalable presentation content that automatically adjusts to different container sizes and device types.

## Overview

The Responsive Rendering System addresses the core limitation of fixed pixel-based layouts by introducing:

- **Flexible Units**: CSS-like relative units (%, vw, vh, rem, em)
- **Smart Typography**: Automatic font scaling with readability optimization
- **Layout Modes**: Different content adaptation strategies
- **Breakpoint System**: Device-specific layout configurations
- **Aspect Ratio Preservation**: Maintain design proportions across screen sizes

## Key Components

### 1. Flexible Units System

Replace absolute pixel values with flexible units that adapt to container size:

```typescript
import { px, percent, vw, vh, rem, createFlexiblePosition, createFlexibleSize } from '../responsive';

// Position using different units
const position = createFlexiblePosition(
  percent(25),  // 25% from left edge
  vh(10)        // 10% of viewport height from top
);

// Size with constraints
const size = createFlexibleSize(
  vw(80, 200, 800),  // 80vw, min 200px, max 800px
  rem(3, 48, 120)    // 3rem, min 48px, max 120px
);
```

### 2. ResponsiveLayoutManager

Handles all coordinate conversions and layout calculations:

```typescript
import { ResponsiveLayoutManager, LayoutMode } from '../responsive';

const layoutManager = new ResponsiveLayoutManager(
  { width: 1920, height: 1080, aspectRatio: 16/9, pixelRatio: 1, fontSize: 16 },
  breakpoints
);

// Convert flexible units to pixels
const pixelPosition = layoutManager.positionToPixels(flexiblePosition);
const pixelSize = layoutManager.sizeToPixels(flexibleSize);
```

### 3. TypographyScaler

Intelligent text scaling for optimal readability:

```typescript
import { TypographyScaler, TypographyScaleMode } from '../responsive';

const scaler = new TypographyScaler({
  mode: TypographyScaleMode.FLUID,
  minScale: 0.5,
  maxScale: 3.0
});

const optimizedFontSize = scaler.calculateFontSize(typographyConfig, containerInfo);
```

### 4. ResponsiveShape Classes

Shapes that automatically adapt to container changes:

```typescript
import { ResponsiveTextShape, LayoutMode } from '../responsive';

const responsiveText = new ResponsiveTextShape({
  text: 'Adaptive text content',
  flexiblePosition: createFlexiblePosition(percent(50), percent(25)),
  flexibleSize: createFlexibleSize(percent(80), percent(30)),
  layoutConfig: {
    mode: LayoutMode.CENTER,
    padding: px(16),
    aspectRatio: 3 // 3:1 width to height
  },
  typography: {
    baseSize: rem(2),
    scaleRatio: 0.8,
    minSize: 16,
    maxSize: 64,
    lineHeightRatio: 1.3
  },
  responsive: true,
  optimizeReadability: true
});
```

## Layout Modes

Different strategies for content adaptation:

### `LayoutMode.STRETCH`
Fill entire container, may distort aspect ratio
- **Use case**: Background elements, full-screen content
- **Behavior**: Stretches to container bounds

### `LayoutMode.CENTER`
Center content within container, maintain original size
- **Use case**: Logos, icons, centered text blocks
- **Behavior**: Centers without scaling

### `LayoutMode.FIT_CONTENT`
Size based on content, center if smaller than container
- **Use case**: Variable-length text, dynamic content
- **Behavior**: Natural sizing with centering fallback

### `LayoutMode.ASPECT_FIT`
Scale to fit container while maintaining aspect ratio
- **Use case**: Images, proportional graphics
- **Behavior**: Letterboxed/pillarboxed scaling

### `LayoutMode.ASPECT_FILL`
Scale to fill container while maintaining aspect ratio (may crop)
- **Use case**: Background images, full-screen media
- **Behavior**: May crop content to maintain ratio

## Breakpoint System

Define different layouts for different screen sizes:

```typescript
const breakpoints = [
  {
    name: 'mobile',
    maxWidth: 768,
    config: {
      mode: LayoutMode.STRETCH,
      padding: px(12),
      margin: px(8)
    }
  },
  {
    name: 'desktop',
    minWidth: 1024,
    config: {
      mode: LayoutMode.FIT_CONTENT,
      padding: px(32),
      margin: px(24)
    }
  }
];
```

## Typography Scaling

Four scaling modes for different use cases:

### `LINEAR`
Direct proportional scaling
- **Best for**: Simple content, consistent scaling needed
- **Behavior**: Font size scales directly with container size

### `LOGARITHMIC`
Reduced scaling impact at extremes
- **Best for**: Reading content, prevents too-large/too-small text
- **Behavior**: Less dramatic changes at very large/small sizes

### `STEPPED`
Discrete size steps
- **Best for**: Consistent UI elements, predictable sizing
- **Behavior**: Jumps between predefined sizes

### `FLUID`
CSS clamp()-like smooth transitions
- **Best for**: Modern responsive design, smooth scaling
- **Behavior**: Smooth scaling between min/max bounds

## Usage Examples

### Basic Responsive Text

```typescript
import { ResponsiveRenderingEngine, ResponsiveTextShape } from '../responsive';

const engine = new ResponsiveRenderingEngine({
  canvas: myCanvas,
  enableResponsive: true
});

const text = new ResponsiveTextShape({
  text: 'Hello Responsive World!',
  flexiblePosition: createFlexiblePosition(percent(50), percent(50)),
  flexibleSize: createFlexibleSize(percent(60), percent(20)),
  layoutConfig: { mode: LayoutMode.CENTER },
  responsive: true
});

engine.addResponsiveShape(text);
engine.startRenderLoop();
```

### Advanced Configuration

```typescript
const advancedText = new ResponsiveTextShape({
  text: 'Advanced responsive text with optimal readability',
  flexiblePosition: createFlexiblePosition(vw(10), vh(20)),
  flexibleSize: createFlexibleSize(vw(80), vh(40)),
  layoutConfig: {
    mode: LayoutMode.FIT_CONTENT,
    padding: px(20),
    margin: px(10),
    aspectRatio: 2.5
  },
  typography: {
    baseSize: rem(1.5),
    scaleRatio: 0.7,
    minSize: 14,
    maxSize: 48,
    lineHeightRatio: 1.4
  },
  textStyle: {
    fontFamily: 'Arial, sans-serif',
    fontWeight: 'normal',
    color: { r: 255, g: 255, b: 255, a: 1 },
    textAlign: 'center'
  },
  responsive: true,
  optimizeReadability: true,
  scaleMode: TypographyScaleMode.FLUID,
  wordWrap: true,
  maxLines: 0 // No limit
});
```

## Integration with Existing System

The responsive system is designed to work alongside existing shapes:

```typescript
// Mix responsive and non-responsive shapes
engine.addShape(regularTextShape);      // Fixed positioning
engine.addResponsiveShape(flexibleText); // Responsive positioning

// Convert existing shapes to responsive (conceptual)
const responsiveVersion = new ResponsiveTextShape({
  text: regularTextShape.text,
  flexiblePosition: createFlexiblePosition(
    px(regularTextShape.position.x),
    px(regularTextShape.position.y)
  ),
  responsive: true
});
```

## Performance Considerations

- **Caching**: Layout calculations are cached until container size changes
- **Selective Updates**: Only responsive shapes recalculate on resize
- **Optimization**: Typography optimization can be disabled for better performance
- **Memory**: Flexible values have minimal memory overhead compared to pixels

## Best Practices

### 1. Choose Appropriate Units
- Use `percent` for content that should scale with container
- Use `vw/vh` for viewport-relative positioning
- Use `rem/em` for typography-based sizing
- Use `px` for fixed elements that shouldn't scale

### 2. Layout Mode Selection
- Use `STRETCH` sparingly, primarily for backgrounds
- Use `CENTER` for logos and icons
- Use `FIT_CONTENT` for text blocks
- Use `ASPECT_FIT` for images and graphics

### 3. Typography Configuration
- Set appropriate min/max font sizes for readability
- Use `optimizeReadability: true` for body text
- Consider `scaleMode` based on content type
- Test across different screen sizes

### 4. Breakpoint Strategy
- Define breakpoints based on content, not devices
- Test breakpoint transitions for smooth changes
- Use progressive disclosure for small screens
- Maintain consistent visual hierarchy

## Debugging

Enable debug mode to see responsive information:

```typescript
const engine = new ResponsiveRenderingEngine({
  canvas,
  enableDebug: true, // Shows responsive debug overlay
  enableResponsive: true
});

// Check responsive status
const status = engine.getResponsiveStatus();
console.log('Responsive shapes:', status.responsiveShapeCount);
console.log('Current breakpoint:', status.currentBreakpoint?.name);
```

## Migration Guide

### From Fixed to Responsive

1. **Identify scaling requirements**: Which elements should adapt vs. stay fixed?
2. **Choose flexible units**: Convert pixel values to appropriate relative units
3. **Configure typography**: Set up scaling parameters for text content
4. **Define breakpoints**: Create responsive breakpoints for your use cases
5. **Test thoroughly**: Verify behavior across different container sizes

### Gradual Adoption

- Start with new content using responsive shapes
- Gradually convert existing content as needed
- Mix responsive and non-responsive shapes during transition
- Use responsive system for templates and dynamic content first

## Future Enhancements

- **Vector Graphics Support**: SVG-like scalable graphics
- **Animation Integration**: Responsive animations that adapt to screen size
- **Content-Aware Scaling**: Automatic layout based on content analysis
- **Accessibility Features**: Enhanced scaling for accessibility requirements
- **Performance Optimizations**: Advanced caching and rendering optimizations