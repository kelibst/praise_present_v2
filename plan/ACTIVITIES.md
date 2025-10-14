# ACTIVITIES.md

This file tracks major features and changes implemented in PraisePresent.

## 2025-10-14

### 🔧 Fixed Scripture References Not Displaying in Preview Window
**Time:** Evening
**Description:** Fixed scripture references and translation names not appearing in preview window. References showed correctly on live display but were cut off/hidden in preview due to positioning outside visible area.

**Root Causes:**
1. **Color Contrast Issue:**
   - Reference and translation shapes used theme accent colors
   - Theme accent color had poor contrast against backgrounds (especially red)
   - Verse text used typography textColor, but reference/translation ignored it
   - Result: Even when positioned correctly, text was invisible

2. **Positioning Issue (Primary):**
   - References positioned at bottom-right corner: `{ x: 1200, y: 900 }`
   - Translation positioned even lower: `{ x: 1200, y: 980 }`
   - Preview window's aspect ratio fitting and container structure clipped this area
   - Toolbar/clickable overlays in preview covered bottom-right region
   - Live display has different container without these constraints

3. **Canvas Scaling Issue:**
   - `CanvasRenderer.setupCanvas()` was overriding React CSS styles
   - Set explicit `canvas.style.width/height = '1920px/1080px'`
   - Prevented responsive scaling to fit preview container properly

**Solutions:**
1. **Fixed Text Color** ([ScriptureTemplate.ts:264, 317](src/rendering/templates/ScriptureTemplate.ts)):
   - Updated `createReferenceShape()` to use typography textColor when provided
   - Updated `createTranslationShape()` to use typography textColor when provided
   - Changed fallback from theme colors to white (#ffffff) for guaranteed visibility
   - Reference and translation now use same color scheme as verse text

2. **Repositioned References to Safe Visible Area** ([ScriptureTemplate.ts:52-74](src/rendering/templates/ScriptureTemplate.ts)):
   - **Before:** Reference at `{ x: 1200, y: 900, width: 600 }` (bottom-right corner)
   - **After:** Reference at `{ x: 100, y: 820, width: 1720 }` (centered, higher up)
   - **Before:** Translation at `{ x: 1200, y: 980, width: 600 }` (very bottom)
   - **After:** Translation at `{ x: 100, y: 920, width: 1720 }` (centered, well within bounds)
   - Moved verse up slightly: `y: 180` (was 200) to make room
   - Full-width positioning (100 to 1820) allows center alignment
   - References now ~260px and ~160px from bottom edge (safer margins)

3. **Fixed Canvas Responsive Scaling** ([CanvasRenderer.ts:62-93](src/rendering/core/CanvasRenderer.ts)):
   - Modified `setupCanvas()` to detect when canvas already initialized
   - When preset dimensions detected (1920x1080), skip ALL style modifications
   - Let React CSS (`width: 100%`, `height: 100%`) handle responsive display
   - Canvas buffer stays 1920x1080, CSS scales to fit any container

**Technical Notes:**
- References now positioned well within the "safe area" of the slide
- Both use `textAlign: 'center'` (from style.centerAlign default)
- Translation maintains opacity 0.8 for subtle appearance
- Added debug logging to verify shape creation
- Positioning follows title-safe broadcast standards (avoid extreme edges)

**Impact:**
- References visible in both preview and live display
- No clipping regardless of preview window size or overlay elements
- Professional centered layout instead of corner positioning
- Better readability with full-width centering
- Canvas scales responsively while maintaining 1920x1080 rendering quality

## 2025-10-14

### 🎨 Fixed Gradient Background Rendering and Persistence (3 Bugs)
**Time:** Afternoon
**Description:** Fixed three critical bugs: gradient backgrounds not rendering in preview/live display, gradient settings not persisting or reflecting in toolbar, and gradient data being corrupted when creating slides.

**Bug 1 - Gradient Rendering:**
**Root Cause:**
- `slideConverter.ts` was checking for wrong gradient format: `slide.background.value` as array
- Actual format uses `slide.background.gradient` object with `start`, `end`, and `direction` properties
- Condition `Array.isArray(slide.background.value)` was always false for gradients
- Result: Gradients were never converted to BackgroundShape, falling back to default solid color

**Solution:**
- Updated `convertTemplateSlide()` in `slideConverter.ts` to handle correct gradient format
- Added proper conversion from `{start, end, direction}` to gradient color stops
- Maintained backwards compatibility with old array format as fallback
- Gradient now properly converts: `{start: '#1a1a1a', end: '#4a4a4a', direction: 'vertical'}` → BackgroundShape with linear gradient

**Bug 2 - Gradient Settings Not Reflecting in Toolbar:**
**Root Cause:**
- BackgroundToolbar useEffect only had `[currentBackground]` dependency
- React doesn't detect deep changes in nested objects (gradient.start, gradient.end, gradient.direction)
- When Redux updated the gradient colors, the same object reference was maintained
- Result: useEffect didn't re-run, so local state (gradientStart, gradientEnd, gradientDirection) wasn't updated
- User would set gradient colors, but toolbar would show old values when reopened

**Solution:**
- Changed BackgroundToolbar useEffect dependencies to track individual properties
- Added `JSON.stringify(currentBackground.gradient)` as dependency to detect deep changes
- Now properly detects when gradient start/end/direction colors change
- Also improved deep merge in `loadSettingsFromStorage()` to ensure gradient structure preserved

**Technical Notes:**
- Direction mapping: horizontal=0°, diagonal=45°, vertical=90°
- Colors parsed from hex strings to Color objects with RGBA values
- Settings auto-save to localStorage on every change
- Deep merge ensures gradient nested structure isn't lost during load

**Bug 3 - Gradient Data Corruption in LivePresentationPage:**
**Root Cause:**
- When creating scripture/song slides, code converted gradients to comma-separated string: `value: "start,end"`
- This destroyed the gradient structure needed by slideConverter and SlideRenderer
- Result: Even though settings had correct gradient, slides were created with wrong format
- Songs were also hardcoded to `#1a1a1a` solid color, ignoring songSettings entirely

**Solution:**
- Fixed all 5 locations in `LivePresentationPage.tsx` where slides are created
- Changed from `value: comma-separated-string` to proper `gradient: {start, end, direction}` object
- Now uses scriptureSettings.background and songSettings.background correctly
- Added opacity support that was previously missing

**Files Modified:**
- src/rendering/utils/slideConverter.ts (lines 166-205)
- src/components/formatting/BackgroundToolbar.tsx (lines 87-93)
- src/lib/featureSettingsSlice.ts (lines 137-165)
- src/pages/LivePresentationPage.tsx (lines 418-433, 467-481, 515-530, 555-570, 596-611)

## 2025-10-14

### 🎨 Fixed Background Rendering Issues (3 Critical Bugs)
**Time:** Evening
**Description:** Fixed three interconnected critical bugs causing background rendering problems: manual canvas drawing being cleared, duplicate backgrounds covering user settings, and race condition causing preview window to show only background without text.

**Root Cause - Part 1:**
- Background was manually drawn to canvas using `ctx.fillRect` before shape rendering
- Then `engine.render()` was called, which cleared the canvas
- The rendering engine didn't know about the manually-drawn background
- Result: Background appeared briefly or not at all, despite being set correctly

**Root Cause - Part 2 (Duplicate Backgrounds):**
- ScriptureTemplate was creating its OWN BackgroundShape with theme colors
- This template background was being added AFTER the SlideRenderer background
- Result: Template's dark background (#0f172a) was covering user's selected background (#5e1e1e)
- Console logs revealed both backgrounds were being rendered, but in wrong order

**Root Cause - Part 3 (Race Condition - Preview Window Issue):**
- SlideRenderer had `slide.id` in useEffect dependency array
- Every slide selection triggered engine disposal and recreation
- React was re-rendering component multiple times rapidly (batching, state propagation)
- Each re-render created and immediately disposed an engine
- Result: Engines disposed before text shapes could be rendered
- Console showed 10+ create→dispose cycles in under 1 second
- Preview window showed only background (fast to render) but no text (disposed before rendering)
- Live display worked because it had fewer re-renders, stabilizing faster

**Solutions:**

**Solution 1 - Use BackgroundShape in Engine:**
- Removed manual canvas drawing of backgrounds (lines 143-188)
- Created `convertSlideBackgroundToBackgroundStyle()` helper function
- Converted `Slide.background` format to `BackgroundStyle` format
- Created `BackgroundShape` instance and added it as first shape to engine
- Engine now renders background as a shape with z-index of -1000 (always behind)

**Solution 2 - Prevent Duplicate Backgrounds:**
- **Modified ScriptureTemplate to NOT create background when featureSettings.background is provided**
- Template only creates default background if user hasn't configured one

**Solution 3 - Fix Race Condition:**
- **Removed `slide.id` from useEffect dependency array** (was causing recreation on every slide change)
- **Removed `slide.id` from resourceId** (makes engine ID stable across slides)
- **Changed dependencies to `[targetResolution.width, targetResolution.height]`** (only recreate on resolution change)
- Engine now created once on mount, reused for all slide changes
- Separate useEffect handles slide content updates (renders using existing engine)
- No more rapid create→dispose cycles

**Technical Changes:**
- [SlideRenderer.tsx:48-64](src/components/slides/SlideRenderer.tsx#L48): Added `parseHexColor()` helper for robust hex parsing
- [SlideRenderer.tsx:67-112](src/components/slides/SlideRenderer.tsx#L67): Added conversion helper for background formats
- [SlideRenderer.tsx:146-202](src/components/slides/SlideRenderer.tsx#L146): Fixed useEffect dependencies to stabilize engine lifecycle
- [SlideRenderer.tsx:224-238](src/components/slides/SlideRenderer.tsx#L224): Create BackgroundShape and add to shape list
- [ScriptureTemplate.ts:121-125](src/rendering/templates/ScriptureTemplate.ts#L121): Only create background if no featureSettings
- Removed manual `ctx.fillRect` drawing code that was being cleared
- Leveraged existing `BackgroundShape` class from rendering system
- Removed debug logging after identifying issues

**User Impact:**
- Background settings from toolbar now render correctly on slide canvas
- Background settings from feature settings modal work properly
- User-selected backgrounds no longer overwritten by template defaults
- All background types work: solid colors, gradients, images
- Background persists through engine rendering cycles
- **Preview window now shows text immediately** (no more blank red screen)
- Works in preview window, live display, and live screen
- Consistent behavior across all rendering contexts
- No more flashing or temporary blank slides
- Significantly improved performance (no rapid engine recreation)

**Documentation:**
- Created comprehensive technical document: `docs/DUPLICATE_BACKGROUND_ISSUE.md`
- Documents all three issues, their root causes, and solutions
- Includes prevention guidelines and testing checklist
- Explains PowerPoint-style rendering pattern and why it matters
