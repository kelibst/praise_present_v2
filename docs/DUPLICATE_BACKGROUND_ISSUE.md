# Duplicate Background Issue - Technical Documentation

## Overview

This document explains a critical bug that was causing background colors to not render correctly, and in some cases, backgrounds appearing in front of text content, covering it completely.

## The Problem

### Symptom
- Background colors set through settings/toolbar were not appearing on slides
- Default dark background (#0f172a) was showing instead of user-selected colors
- In some cases, background appeared to render "on top" of text, covering content

### Visual Evidence
User reported seeing the background color (#5e1e1e - reddish-brown) appearing only around the edges of the canvas, while the main slide content area showed the default dark color. The actual text content was visible, but the background was wrong.

## Root Cause Analysis

### Part 1: Manual Canvas Drawing (Initial Issue)

**Location:** `src/components/slides/SlideRenderer.tsx` (lines 143-188, now removed)

**What was happening:**
```typescript
// Old code - PROBLEMATIC
if (slide.background) {
  const ctx = canvasRef.current.getContext('2d');
  if (ctx) {
    ctx.fillStyle = slide.background.value || '#1a1a1a';
    ctx.fillRect(0, 0, width, height);
  }
}

// Then later...
engine.render(); // This CLEARS the canvas!
```

**The flaw:**
1. Background was manually drawn using `ctx.fillRect()` directly on canvas
2. Then `engine.render()` was called
3. The rendering engine calls `renderer.clear()` which uses `ctx.clearRect()` to clear the entire canvas
4. The manually-drawn background was erased
5. Only shapes managed by the engine were rendered
6. Result: No background visible (or only visible briefly before being cleared)

### Part 2: Duplicate Background Creation (Critical Issue)

**Location:** `src/rendering/templates/ScriptureTemplate.ts` (line 123)

**What was happening:**
```typescript
// In ScriptureTemplate.generateSlide()
const shapes: Shape[] = [];

// Background with solid color (simplified for PowerPoint pattern)
// Note: Background from featureSettings is handled by SlideRenderer
shapes.push(this.createScriptureBackground(content.theme)); // ❌ ALWAYS created!

// Main verse text
shapes.push(verseShape);
// ... more shapes
```

**The flaw:**
1. `SlideRenderer` creates a `BackgroundShape` with user's selected color (#5e1e1e)
2. `ScriptureTemplate` ALSO creates a `BackgroundShape` with theme color (#0f172a)
3. Both backgrounds are added to the engine's shape collection
4. Shapes are rendered in order (z-index sorting)
5. Template's background has same/higher z-index, so it renders AFTER
6. Result: Template's background covers user's background

**Console Log Evidence:**
```
🎨 BackgroundShape: Rendering color background
colorString: 'rgb(94, 30, 30)'     // User's red color - rendered first
fillStyle= #5e1e1e

🎨 BackgroundShape: Rendering color background
colorString: 'rgb(15, 23, 42)'     // Template's dark blue - rendered second, covers first!
fillStyle= #0f172a
```

### Why Text Was Sometimes Covered

The z-index system determines render order:
- Background shapes typically have z-index: -1000
- Text shapes typically have z-index: 0 (default)
- Shapes render in ascending z-index order

**Normal scenario:**
```
Render order:
1. Background (-1000) ✓
2. Text (0) ✓
Result: Text visible on background
```

**Bug scenario:**
```
Render order:
1. User background (-1000) ✓
2. Template background (-1000) ← Same z-index!
3. Text (0) ✓

When z-indexes are equal, render order depends on:
- Order shapes were added to collection
- Array iteration order
- JavaScript Map insertion order

Result: Whichever background is added last wins
```

**Worst case scenario (text covered):**
If template background accidentally got z-index ≥ 0:
```
Render order:
1. User background (-1000) ✓
2. Text (0) ✓
3. Template background (0 or higher) ← COVERS TEXT!
Result: Text invisible, only background visible
```

### Part 3: Race Condition - Rapid Engine Creation/Disposal (Preview Window Issue)

**Location:** `src/components/slides/SlideRenderer.tsx` (useEffect dependencies)

**What was happening:**

User reported that when selecting a scripture verse:
- **Preview window** showed ONLY background color (no text)
- **Live display** showed correct rendering (text + background)
- **After selecting another verse**, preview would fix itself

**Console Log Evidence:**
```
ResourceManager: Registered engine slide-renderer-scripture-...-1760432036424
CanvasRenderer.setupCanvas: Canvas setup complete
ResourceManager: Disposed engine slide-renderer-scripture-...-1760432036424
ResourceManager: Registered engine slide-renderer-scripture-...-1760432044571
CanvasRenderer.setupCanvas: Canvas setup complete
ResourceManager: Disposed engine slide-renderer-scripture-...-1760432044571
[... pattern repeats 10+ times in under 1 second]
```

**The flaw:**
1. SlideRenderer had `slide.id` in the useEffect dependency array
2. Every time a new slide was selected, it had a new ID
3. This triggered the useEffect, which disposed the old engine and created a new one
4. But React was re-rendering the component multiple times rapidly (React batching, state updates)
5. Each re-render created and immediately disposed an engine
6. Result: Engines were created/disposed before they could finish rendering shapes

**The race condition:**
```typescript
// OLD CODE - PROBLEMATIC
useEffect(() => {
  const resourceId = `slide-renderer-${slide.id}-${Date.now()}`;
  // ... create engine
  return () => {
    resourceManager.cleanup(resourceId); // Cleanup on unmount OR dependency change
  };
}, [slide.id, targetResolution, onRendered]); // ❌ slide.id changes on every selection!
```

**What happened:**
1. Slide selected → new slide.id
2. useEffect cleanup runs → disposes engine
3. useEffect runs → creates new engine
4. React re-renders (state propagation) → repeats steps 2-3
5. Background shape gets added and rendered (fast operation)
6. Engine disposed before text shapes can be added/rendered
7. Next render: background visible, text missing

**Why live display worked but preview didn't:**
- Live display has fewer React re-renders (different component tree)
- Preview window is deeply nested with more state dependencies
- More re-renders = more opportunities for race condition to occur

## The Fix

### Solution 1: Use BackgroundShape in Rendering Engine

**File:** `src/components/slides/SlideRenderer.tsx`

**Changes:**
1. Created helper function `parseHexColor()` to convert hex strings to Color objects
2. Created helper function `convertSlideBackgroundToBackgroundStyle()` to convert UI format to rendering format
3. Created `BackgroundShape` instance and added it to engine's shape collection
4. Removed manual `ctx.fillRect()` code

**New flow:**
```typescript
// Convert slide background to BackgroundShape
if (slide.background) {
  const backgroundStyle = convertSlideBackgroundToBackgroundStyle(
    slide.background,
    targetResolution
  );

  const backgroundShape = new BackgroundShape({
    position: { x: 0, y: 0 },
    size: { width: 1920, height: 1080 },
    opacity: slide.background.opacity || 1,
    zIndex: -1000, // Ensure background is always behind
    backgroundStyle
  });

  allShapes.push(backgroundShape); // Add to shape collection
}

// Add content shapes
allShapes = [...allShapes, ...reconstructedShapes];

// Add all shapes to engine (background first, then content)
allShapes.forEach(shape => engine.addShape(shape));

// Render - background is now managed by engine!
engine.render();
```

**Benefits:**
- Background is part of the rendering pipeline
- Engine manages clearing and rendering order
- Background persists through render cycles
- Works with all rendering contexts (preview, live, export)

### Solution 2: Prevent Duplicate Background Creation

**File:** `src/rendering/templates/ScriptureTemplate.ts`

**Change:**
```typescript
// OLD CODE - Always created background
shapes.push(this.createScriptureBackground(content.theme));

// NEW CODE - Only create if no user-provided background
if (!content.featureSettings?.background) {
  shapes.push(this.createScriptureBackground(content.theme));
}
```

**Logic:**
- If user has configured a background via feature settings → Don't create template background
- If no background configured → Use template's default background
- This respects user choices while providing sensible defaults

### Solution 3: Fix Race Condition - Stabilize Engine Lifecycle

**File:** `src/components/slides/SlideRenderer.tsx`

**Change:**
```typescript
// OLD CODE - Engine recreated on every slide change
useEffect(() => {
  const resourceId = `slide-renderer-${slide.id}-${Date.now()}`;
  // ... create engine
  return () => {
    resourceManager.cleanup(resourceId);
  };
}, [slide.id, targetResolution, onRendered]); // ❌ Recreates engine constantly!

// NEW CODE - Engine created once, reused for all slides
useEffect(() => {
  const resourceId = `slide-renderer-${Date.now()}`; // ✓ No slide.id
  // ... create engine
  return () => {
    resourceManager.cleanup(resourceId);
  };
}, [targetResolution.width, targetResolution.height]); // ✓ Only resolution changes
```

**Key changes:**
1. **Removed `slide.id` from dependency array** - prevents recreation on slide change
2. **Removed `slide.id` from resourceId** - makes ID stable across slides
3. **Changed dependencies to specific resolution values** - only recreate if resolution actually changes
4. **Separate useEffect handles slide content updates** - renders new content using existing engine

**Architecture:**
```
Component Mount:
  └─> Create engine (once)
      └─> Register with ResourceManager

Slide Change (new slide.id):
  └─> Second useEffect fires
      └─> Clears shapes from engine
      └─> Adds new BackgroundShape
      └─> Adds new text shapes
      └─> Calls engine.render()
      └─> Engine persists! ✓

Component Unmount:
  └─> Cleanup function runs
      └─> Dispose engine
      └─> Unregister from ResourceManager
```

**Benefits:**
- **No more race conditions** - engine lifecycle is stable
- **Better performance** - engine reused instead of recreated
- **Consistent rendering** - all slides use the same engine instance
- **Proper cleanup** - engine only disposed when component unmounts

## Why This Pattern Matters

### The PowerPoint Model

Professional presentation software (PowerPoint, Keynote, Google Slides) use a **shape-based rendering model**:

1. **Everything is a shape** - backgrounds, text, images, all managed uniformly
2. **Layering system** - z-index determines what renders in front
3. **No manual drawing** - renderer handles all drawing operations
4. **State consistency** - shapes persist across frames/renders

### Anti-Pattern: Manual Canvas Drawing

```typescript
// ❌ WRONG - Manual drawing
ctx.fillStyle = '#5e1e1e';
ctx.fillRect(0, 0, width, height);
engine.render(); // Clears everything!

// ✓ RIGHT - Shape-based
const bg = new BackgroundShape({ backgroundStyle });
engine.addShape(bg);
engine.render(); // Renders all shapes in correct order
```

**Why manual drawing fails:**
- Not part of rendering pipeline
- Gets cleared on every render cycle
- No z-index management
- Can't be serialized/deserialized
- Breaks with responsive rendering
- Incompatible with export/print workflows

## Lessons Learned

### 1. Single Source of Truth
**Problem:** Two systems creating backgrounds
- SlideRenderer created one background
- ScriptureTemplate created another background

**Solution:** Clear ownership hierarchy
- SlideRenderer owns slide-level background (user settings)
- Template provides default only if no user setting exists

### 2. Respect the Rendering Pipeline
**Problem:** Bypassing engine with manual drawing

**Solution:** All visual elements as shapes
- Backgrounds → BackgroundShape
- Text → TextShape
- Images → ImageShape
- Everything goes through engine.render()

### 3. Debug with Logging
**Key insight:** Console logs revealed both backgrounds were rendering

```javascript
🎨 BackgroundShape: Color background rendered, fillStyle= #5e1e1e  // ✓ User color
🎨 BackgroundShape: Color background rendered, fillStyle= #0f172a  // ❌ Template overwrite
```

This immediately showed the duplicate background issue, leading to the fix.

### 4. Test All Contexts
Background rendering works in:
- ✓ Preview window (editor)
- ✓ Live display window (presentation monitor)
- ✓ Live screen (projector output)
- ✓ All background types (color, gradient, image)
- ✓ Opacity settings

### 5. Manage React Component Lifecycle Carefully
**Problem:** useEffect dependencies causing rapid engine recreation

**Key insights:**
- Don't put frequently-changing values in effect dependencies if they don't need to trigger recreation
- `slide.id` changes on every slide selection - causes constant recreation
- Use separate effects: one for initialization (runs once), one for updates (runs on changes)
- Resource cleanup should only happen on unmount, not on every prop change

**Solution:**
```typescript
// Initialization effect - runs once on mount
useEffect(() => {
  // Create long-lived resources
}, [stable.dependencies.only]);

// Update effect - runs on content changes
useEffect(() => {
  // Update content using existing resources
}, [content.that.changes]);
```

## Related Code Locations

### Fixed Files
1. `src/components/slides/SlideRenderer.tsx` - Main rendering component
2. `src/rendering/templates/ScriptureTemplate.ts` - Scripture slide template
3. `src/rendering/shapes/BackgroundShape.ts` - Background shape class (already existed, now used properly)

### Key Classes
- **BackgroundShape** - Renders backgrounds (color/gradient/image)
- **RenderingEngine** - Manages shape collection and rendering
- **ShapeCollection** - Stores and sorts shapes by z-index
- **CanvasRenderer** - Low-level canvas operations

### Architecture
```
User Settings
    ↓
SlideRenderer (creates BackgroundShape)
    ↓
RenderingEngine (manages all shapes)
    ↓
ShapeCollection (sorts by z-index)
    ↓
CanvasRenderer (draws to canvas)
    ↓
Canvas (final output)
```

## Prevention Guidelines

### For Future Development

1. **Never bypass the rendering engine**
   - Don't use `ctx.fillRect()`, `ctx.fillText()`, etc. directly
   - Always create Shape objects
   - Let engine manage rendering

2. **Check for duplicates**
   - Before creating a shape, check if one already exists
   - Use conditional logic: `if (!alreadyProvided) { createDefault(); }`
   - Respect user settings over template defaults

3. **Use z-index correctly**
   - Backgrounds: -1000
   - Content: 0 to 100
   - Overlays: 1000+
   - Never have two shapes with critical importance at same z-index

4. **Test with logging**
   - Add temporary console.log() to track rendering
   - Check what shapes are being created
   - Verify rendering order
   - Remove logs after debugging

5. **Document ownership**
   - Who creates each shape?
   - What's the default behavior?
   - How do user settings override defaults?

6. **Be careful with React useEffect dependencies**
   - Only include dependencies that should trigger the effect
   - Avoid putting IDs or frequently-changing values unless necessary
   - Use useRef for values that shouldn't trigger re-runs
   - Separate initialization effects from update effects
   - Log when effects run to catch unexpected behavior

7. **Watch for race conditions**
   - Monitor resource creation/disposal patterns in console
   - Look for repeated create→dispose cycles
   - Test in different rendering contexts (preview, live, different components)
   - Use React DevTools Profiler to see re-render patterns

## Testing Checklist

When modifying background rendering:

**Functionality:**
- [ ] Background color changes in settings apply immediately
- [ ] Background color changes in toolbar apply immediately
- [ ] Background persists when switching between slides
- [ ] Text remains visible on all background colors
- [ ] Gradients render correctly (all directions)
- [ ] Images load and display properly
- [ ] Opacity settings work (0.0 to 1.0)

**Rendering Contexts:**
- [ ] Works in preview window (shows text + background immediately)
- [ ] Works in live display window
- [ ] Works on live screen (projector)
- [ ] Works when switching between different verses rapidly
- [ ] Works after multiple slide selections

**Performance & Stability:**
- [ ] No console errors or warnings
- [ ] Performance is acceptable (no lag)
- [ ] No rapid engine creation/disposal in console
- [ ] No "flashing" or "blank" slides during transitions
- [ ] Preview and live display stay in sync
- [ ] Text never disappears (covered by background)

## References

- **Issue Reports:**
  - Background not rendering (Part 1 & 2)
  - Text covered by background (Part 2)
  - Preview window showing only background, no text (Part 3)
- **Console Logs:**
  - Showed duplicate BackgroundShape rendering (Part 2)
  - Showed rapid engine creation/disposal cycles (Part 3)
- **Fix Commits:** See ACTIVITIES.md for 2025-10-14
- **Related Docs:** See rendering architecture documentation

---

**Document Created:** 2025-10-14
**Last Updated:** 2025-10-14 (Added Part 3: Race Condition Fix)
**Status:** All Issues Resolved
**Issues Fixed:** 3 (Manual drawing, Duplicate backgrounds, Race condition)
**Author:** Development Team

## Summary

This document covered **three interconnected issues** that all manifested as background rendering problems:

1. **Manual Canvas Drawing** - Background drawn outside engine, gets cleared
2. **Duplicate Backgrounds** - Template creating second background that covers user's choice
3. **Race Condition** - Rapid engine recreation preventing text from rendering

The root causes were:
- Not following the shape-based rendering pattern (everything must be a shape)
- Creating shapes in multiple places without coordination
- React useEffect dependencies causing unnecessary recreation

The fixes ensure:
- All backgrounds are BackgroundShape objects managed by the rendering engine
- Only one background per slide (user settings take precedence)
- Engine lifecycle is stable (created once, reused for all slides)
- Proper rendering order (background → text → overlays)
