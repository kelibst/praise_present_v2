# Simplify Preview Scaling - Use Industry Standard Pattern

## Core Philosophy Change
**Stop trying to be clever. Do what PowerPoint does.**

## The Simple Approach

# THE CORRECT ARCHITECTURE - PowerPoint Pattern (2025-10-12)

## The Vision: Single Source of Truth Like PowerPoint

### The Problem with Current Approach
We have **3 different rendering instances**, each fighting with its container size:
- Preview window: Tries to render for ~305x171px container
- Live monitor: Tries to render for ~444x250px container
- Live display: Renders for 1365x1080px window (works because it's close to target)

**This is fundamentally wrong!** We're trying to "fix" symptoms instead of fixing the architecture.

### How PowerPoint Actually Works

```
┌─────────────────────────────────────────────────────────┐
│ Slide Document (Single Source of Truth)                │
│ - Fixed resolution: 1920x1080 (or user-defined)        │
│ - Contains shapes with absolute pixel positions        │
│ - All styling, fonts, positions are absolute           │
└────────────────┬────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────┐
│ Master Rendering Engine                                 │
│ - Renders ONCE at document resolution (1920x1080)      │
│ - Produces a "master canvas" with all shapes rendered  │
│ - This canvas is the single source of truth            │
└────────────────┬────────────────────────────────────────┘
                 │
                 ├──────────────┬──────────────┬──────────┐
                 ▼              ▼              ▼          ▼
         ┌─────────────┐ ┌─────────────┐ ┌─────────┐ ┌─────────┐
         │   Preview   │ │   Editor    │ │  Live   │ │  Thumb  │
         │   Window    │ │   Window    │ │ Display │ │  View   │
         │             │ │             │ │         │ │         │
         │ 305x171     │ │ 812x457     │ │ 1920x   │ │ 120x68  │
         │ (CSS scale) │ │ (CSS scale) │ │  1080   │ │ (scale) │
         └─────────────┘ └─────────────┘ └─────────┘ └─────────┘

         All windows show THE SAME rendered canvas,
         just scaled to fit their container using CSS
```

### Key Principles

1. **One Slide = One Canvas = One Render**
   - Slide is rendered ONCE at document resolution (1920x1080)
   - This produces a "master canvas" or bitmap
   - All windows display this same canvas, just scaled differently

2. **Resolution Independence**
   - Slide shapes have absolute pixel positions for 1920x1080
   - Rendering engine doesn't know or care about display container size
   - CSS handles ALL scaling from 1920x1080 to display size

3. **WYSIWYG Guaranteed**
   - Preview window shows EXACTLY what will appear in presentation
   - No surprises, no "looks different in presentation" issues
   - Edit in preview → see exact result in presentation

4. **Container Size Pollution Eliminated**
   - Rendering engine never reads container dimensions
   - No clientWidth/clientHeight usage in rendering pipeline
   - Container size only affects CSS scaling, not rendering

## Proposed Architecture for PraisePresent

### Component Hierarchy

```typescript
// Single source of truth - renders slide to canvas
SlideRenderer
  - Takes: Slide (with shapes at 1920x1080 positions)
  - Renders: Canvas at 1920x1080
  - Returns: Canvas element
  - Does NOT care about display size

// Displays rendered canvas at any size
SlideViewer
  - Takes: Canvas from SlideRenderer
  - Props: width, height (display size)
  - Uses: CSS object-fit: contain
  - Handles: Click-to-edit coordinate transformation

// Manages slide editing
SlideEditor
  - Wraps: SlideViewer
  - Adds: Click handlers, edit UI
  - Transforms: Display coordinates → canvas coordinates
  - Updates: Slide data (single source of truth)
```

### Implementation Plan

#### Phase 1: Create Core SlideRenderer Component
**Goal:** Single-purpose component that ONLY renders slides

```typescript
// src/components/slides/SlideRenderer.tsx
interface SlideRendererProps {
  slide: Slide;  // Contains shapes with absolute positions
  targetResolution?: { width: number; height: number };  // Default: 1920x1080
  onRendered?: (canvas: HTMLCanvasElement) => void;
}

const SlideRenderer: React.FC<SlideRendererProps> = ({
  slide,
  targetResolution = { width: 1920, height: 1080 },
  onRendered
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // ALWAYS set to target resolution, NEVER read container size
    canvas.width = targetResolution.width;
    canvas.height = targetResolution.height;

    // Create rendering engine (simple, no responsive features)
    const engine = new SimpleRenderingEngine({ canvas });

    // Add shapes (already at correct positions for 1920x1080)
    slide.shapes.forEach(shape => engine.addShape(shape));

    // Render once
    engine.render();

    // Notify parent
    if (onRendered) onRendered(canvas);

    return () => engine.dispose();
  }, [slide, targetResolution]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        width: '100%',
        height: '100%',
        objectFit: 'contain',
        display: 'block'
      }}
    />
  );
};
```

#### Phase 2: Create SlideViewer (Display Only)
**Goal:** Shows rendered slide at any size

```typescript
// src/components/slides/SlideViewer.tsx
interface SlideViewerProps {
  slide: Slide;
  className?: string;
}

const SlideViewer: React.FC<SlideViewerProps> = ({ slide, className }) => {
  return (
    <div className={`relative w-full h-full ${className}`}>
      <SlideRenderer slide={slide} />
    </div>
  );
};
```

#### Phase 3: Create SlideEditor (Interactive)
**Goal:** SlideViewer + editing capabilities

```typescript
// src/components/slides/SlideEditor.tsx
interface SlideEditorProps {
  slide: Slide;
  onSlideChange?: (updatedSlide: Slide) => void;
  editable?: boolean;
}

const SlideEditor: React.FC<SlideEditorProps> = ({
  slide,
  onSlideChange,
  editable = true
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handleCanvasClick = (e: React.MouseEvent) => {
    if (!editable || !canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();

    // Transform display coordinates to canvas coordinates
    const scaleX = 1920 / rect.width;
    const scaleY = 1080 / rect.height;

    const canvasX = (e.clientX - rect.left) * scaleX;
    const canvasY = (e.clientY - rect.top) * scaleY;

    // Find clicked shape and handle edit
    // ... editing logic here
  };

  return (
    <div onClick={handleCanvasClick}>
      <SlideRenderer
        slide={slide}
        onRendered={(canvas) => canvasRef.current = canvas}
      />
    </div>
  );
};
```

#### Phase 4: Refactor Template System
**Goal:** Templates create shapes with absolute 1920x1080 positions

```typescript
// Templates should ONLY create shapes at 1920x1080 resolution
class ScriptureTemplate {
  generate(verses: Verse[]): Slide {
    return {
      id: generateId(),
      shapes: [
        new TextShape({
          text: verses[0].text,
          position: { x: 100, y: 300 },  // Absolute pixels for 1920x1080
          size: { width: 1720, height: 400 },
          textStyle: {
            fontSize: 64,  // Absolute pixels for 1920x1080
            fontFamily: 'Arial',
            color: { r: 255, g: 255, b: 255, a: 1 }
          }
        }),
        // Reference text shape
        new TextShape({
          text: `${verses[0].book} ${verses[0].chapter}:${verses[0].verse}`,
          position: { x: 1400, y: 900 },  // Bottom right
          size: { width: 400, height: 100 },
          textStyle: {
            fontSize: 32,
            fontFamily: 'Arial',
            color: { r: 200, g: 200, b: 200, a: 1 }
          }
        })
      ],
      background: { type: 'color', value: '#000000' }
    };
  }
}
```

#### Phase 5: Update LivePresentationPage
**Goal:** Use SlideEditor for preview, SlideViewer for monitoring

```typescript
// Preview Window (editable)
<PreviewWindow title="Preview" type="preview">
  <SlideEditor
    slide={currentSlide}
    onSlideChange={handleSlideUpdate}
    editable={true}
  />
</PreviewWindow>

// Live Monitor (display only)
<PreviewWindow title="Live Monitor" type="live-display">
  <SlideViewer slide={currentSlide} />
</PreviewWindow>

// Live Display Window (full screen, display only)
// Same SlideViewer component, just in a different window
```

## Benefits of This Architecture

### 1. **True WYSIWYG**
- Preview shows EXACTLY what will appear in presentation
- No surprises, no differences between preview and live
- Edit in preview = see exact result in presentation

### 2. **Simplified Rendering**
- No responsive shapes needed for preview
- No container size detection
- No complex scaling calculations
- Just render at 1920x1080, let CSS scale

### 3. **Consistent Everywhere**
- Same slide renders identically in:
  - Preview window (small)
  - Live monitor (medium)
  - Live display (full screen)
  - Thumbnails (tiny)

### 4. **Better Performance**
- Render once, display many times
- No re-rendering when container resizes
- Browser-native CSS scaling (GPU accelerated)

### 5. **Easier Debugging**
- Single rendering path
- No container pollution
- Predictable behavior

### 6. **Scalable**
- Easy to add new view types (thumbnails, grid view, etc.)
- All views automatically show correct content
- No special cases needed

## Migration Strategy

### Step 1: Create New Components (Non-Breaking)
- Build SlideRenderer, SlideViewer, SlideEditor alongside existing code
- Test thoroughly with various slide types
- Ensure rendering quality matches or exceeds current system

### Step 2: Refactor Templates (Breaking)
- Update ScriptureTemplate to output simple TextShape (not ResponsiveTextShape)
- Update SongTemplate similarly
- All shapes use absolute 1920x1080 positions

### Step 3: Replace EditableSlidePreview (Breaking)
- Replace EditableSlidePreview with SlideEditor in LivePresentationPage preview
- Replace with SlideViewer in LivePresentationPage monitor
- Replace with SlideViewer in live display window

### Step 4: Remove Legacy Code
- Remove ResponsiveTextShape (no longer needed for preview)
- Remove EditableSlidePreview component
- Remove container size detection logic from CanvasRenderer
- Simplify rendering engine

### Step 5: Polish
- Add transition animations between slides
- Add edit UI overlays
- Add shape selection/manipulation
- Add formatting toolbar

## Success Criteria

- [ ] Preview window shows text at correct scale (fills canvas)
- [ ] Live monitor shows identical content to preview
- [ ] Live display shows identical content to preview and monitor
- [ ] Window resize doesn't affect rendering (only display scale)
- [ ] Editing in preview updates slide data (single source of truth)
- [ ] All three views show updates immediately
- [ ] Performance is smooth (no lag, no re-renders on resize)
- [ ] Code is simple and maintainable