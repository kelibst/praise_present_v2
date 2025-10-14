# ACTIVITIES.md

This file tracks major features and changes implemented in PraisePresent.

## 2025-10-14

### ✅ Implement Element-Specific Color Settings for Scripture Elements
**Time:** Evening (Latest)
**Description:** Implemented separate color settings for verse, reference, and translation elements so that changing one element's color doesn't affect the others.

**Problem:**
- User edits Reference → changes color to yellow → clicks "Save as Default"
- User selects different verse → ALL elements (verse, reference, translation) appear yellow
- Only wanted reference to be yellow, not verse or translation

**Root Cause:**
- All three element types shared one `textColor` setting
- Saving reference color as default updated `textColor` for everyone
- No way to have element-specific colors

**Solution:**
- [featureSettingsSlice.ts:13-15](src/lib/featureSettingsSlice.ts#L13): Added `verseColor`, `referenceColor`, `translationColor` fields to ScriptureSettings
- [SlideEditorWithToolbar.tsx:200-212](src/components/slides/SlideEditorWithToolbar.tsx#L200): Updated handleSaveAsDefault to save element-specific colors
- [ScriptureTemplate.ts:189](src/rendering/templates/ScriptureTemplate.ts#L189): Use `verseColor || textColor || theme default`
- [ScriptureTemplate.ts:308](src/rendering/templates/ScriptureTemplate.ts#L308): Use `referenceColor || textColor || white`
- [ScriptureTemplate.ts:377](src/rendering/templates/ScriptureTemplate.ts#L377): Use `translationColor || textColor || white`

**Impact:**
- Each element type now has its own independent color setting
- Fallback chain: element-specific → shared textColor → theme default
- Users can customize colors per element or use shared color
- "Save as Default" now saves both font size AND color for specific element

## 2025-10-14

### 🔧 Save Element-Specific Font Sizes with "Save as Default"
**Time:** Evening
**Description:** Fixed "Save as Default" to save font sizes for the specific element type (verse/reference/translation), not just general typography settings.

**Problem:**
- User edits Reference → changes font size to 48 and color to yellow
- User clicks "Save as Default"
- User selects different verse
- Reference appears with yellow color ✓ but size 36 (default) ✗
- Font size wasn't being saved!

**Root Cause:**
- `handleSaveAsDefault` only saved general typography (color, alignment, bold, italic)
- Intentionally skipped font sizes with comment: "font sizes are specific per element"
- But didn't actually save to the element-specific font size settings

**Solution:**
- [SlideEditorWithToolbar.tsx:184-212](src/components/slides/SlideEditorWithToolbar.tsx#L184): Detect element type from metadata
- Save font size to appropriate setting:
  - verse → `verseFontSize`
  - reference → `referenceFontSize`
  - translation → `translationFontSize`
- All other typography settings still shared across elements

**Impact:**
- "Save as Default" now fully functional for all elements
- Font size persists when creating new scripture slides
- Each element type maintains its own default font size
- Color, alignment, and style settings still shared (as expected)

## 2025-10-14

### 🔧 Preserve Slide Edits When Re-selecting Same Verses
**Time:** Evening
**Description:** Fixed scripture preview regenerating slides when user clicks on verses that are already in the current selection, which was discarding toolbar edits.

**Problem:**
- User has Genesis 1:1-10 selected in preview
- User edits reference on verse 8 slide
- User clicks verse 9 in the list
- handleScriptureSelect triggered → regenerates ALL slides → edits lost

**Root Cause:**
- BibleSelector fires `onVersesSelected` event when user clicks verses
- `handleScriptureSelect` always called `generateSlidesForItem`
- No check if the new selection is the same as current selection
- Resulted in unnecessary slide regeneration

**Solution:**
- [LivePresentationPage.tsx:772-817](src/pages/LivePresentationPage.tsx#L772): Compare current and new verse selections
- Only regenerate slides if verse selection actually changed
- Preserve existing slides when same verses re-selected
- Use verse IDs to detect if selection is identical

**Implementation:**
```typescript
const currentVerseIds = selectedItem?.content?.verses?.map(v => v.id).sort().join(',');
const newVerseIds = verses.map(v => v.id).sort().join(',');
const isSameVerseSelection = currentVerseIds === newVerseIds;

if (!isSameVerseSelection) {
  await generateSlidesForItem(scriptureItem, false); // Regenerate
} else {
  setSelectedItem(scriptureItem); // Reuse existing slides
}
```

**Impact:**
- Clicking verses within current selection doesn't regenerate slides
- Toolbar edits to preview slides now persist when navigating verses
- Only regenerates when selecting different verses (expected behavior)
- Better UX for exploring scripture while maintaining formatting

## 2025-10-14

### ✨ Individual Text Element Editing with Visual Indicators
**Time:** Evening
**Description:** Enabled editing of individual text elements (verse, reference, translation) independently with visual indicators showing which element is being edited.

**Problem:**
- Scripture slides have 3 text elements: Verse, Reference, Translation
- User clicks Reference → toolbar appears
- User changes font → ALL 3 elements change (not just reference)
- User has no way to know which element they're editing

**Solution:**
1. **Added Metadata System**
   - [shapes.ts:13](src/rendering/types/shapes.ts#L13): Added `metadata?: Record<string, any>` to ShapeProps
   - [Shape.ts:15,29](src/rendering/core/Shape.ts#L15): Added metadata property and initialization
   - [Shape.ts:186](src/rendering/core/Shape.ts#L186): Include metadata in clone() method

2. **Tagged Scripture Elements**
   - [ScriptureTemplate.ts:203](src/rendering/templates/ScriptureTemplate.ts#L203): Tag verse with `{ elementType: 'verse' }`
   - [ScriptureTemplate.ts:319](src/rendering/templates/ScriptureTemplate.ts#L319): Tag reference with `{ elementType: 'reference' }`
   - [ScriptureTemplate.ts:373](src/rendering/templates/ScriptureTemplate.ts#L373): Tag translation with `{ elementType: 'translation' }`

3. **Added Visual Indicator**
   - [TypographyToolbar.tsx:223-227](src/components/formatting/TypographyToolbar.tsx#L223): Show "Editing: Verse/Reference/Translation" badge in toolbar
   - Blue badge with element name clearly indicates which text is being edited

4. **Enhanced Logging**
   - Added element type to console logs when shapes are created
   - Helps verify each shape has unique ID and correct metadata

**How It Works:**
- Each scripture element tagged with metadata when created by template
- SlideEditor correctly selects individual shape when clicked (already working)
- Toolbar updates only the selected shape (already working)
- NEW: Visual indicator shows user exactly which element they're editing
- Metadata preserved through clone operations

**User Experience:**
1. User clicks Reference text → sees "Editing: Reference" in toolbar
2. User changes font size → ONLY reference updates ✓
3. User clicks Verse text → sees "Editing: Verse" in toolbar
4. User changes color → ONLY verse updates ✓
5. Each element independently editable ✓

**Impact:**
- Clear visual feedback about which element is being edited
- Prevents confusion about toolbar scope
- Foundation for future per-element formatting presets
- Professional PowerPoint-like editing experience

## 2025-10-14

### 🎯 CRITICAL FIX: Slides Being Regenerated on Every Selection
**Time:** Late Afternoon
**Description:** Fixed the root cause of toolbar edits not persisting - slides were being regenerated from scratch every time a user selected a service item, discarding all toolbar changes.

**Problem:**
- User makes toolbar edits to Scripture A
- User selects Scripture B
- User selects Scripture A again
- **All edits to Scripture A are lost!**
- Font size, color, alignment changes didn't persist across selections

**Root Cause:**
- `handleServiceItemSelect()` always called `generateSlidesForItem(item)`
- This recreated slides from template using only global settings
- Edited slides stored in serviceItems array were ignored
- Same issue in `handleServiceItemPresent()` for double-click

**Solution:**
- [LivePresentationPage.tsx:648-659](src/pages/LivePresentationPage.tsx#L648): Check if item.slides exists before generating
- Only call `generateSlidesForItem()` if slides don't exist
- Otherwise, use existing slides from the serviceItems array
- [LivePresentationPage.tsx:665-698](src/pages/LivePresentationPage.tsx#L665): Same fix for double-click presentation

**Additional Fixes:**
- [SlideEditor.tsx:73-88](src/components/slides/SlideEditor.tsx#L73): Added useEffect to sync selectedShape when slide updates
- [TextShape.ts:565-576](src/rendering/shapes/TextShape.ts#L565): Deep clone textStyle.color to prevent shared references
- [TypographyToolbar.tsx:126-130](src/components/formatting/TypographyToolbar.tsx#L126): Filter undefined values before sending updates

**Impact:**
- Toolbar edits now persist when navigating between service items
- Slides are generated once and reused with edits intact
- "Save as Default" button updates global settings for future slides
- Individual slide edits are preserved in the serviceItems array
- Full PowerPoint-like editing experience

## 2025-10-14

### 🔧 CRITICAL FIX: Toolbar Changes Resetting Other Properties
**Time:** Late Afternoon
**Description:** Fixed critical bug where changing one property (font size) would reset others (color to black). The root cause was in TextShape constructor not properly merging textStyle from props.

**Problem:**
- User increases font size → color resets to black
- User changes color → font size resets to default
- All toolbar changes were overwriting other properties instead of preserving them

**Root Cause:**
- TextShape constructor signature: `constructor(props, style)`
- Constructor merged: `{ ...defaultTextStyle, ...style }`
- But clone() passed textStyle in props: `new TextShape({ textStyle: {...} })`
- The second `style` parameter was empty, so defaultTextStyle (black color!) overwrote everything
- `defaultTextStyle` has `color: { r: 0, g: 0, b: 0, a: 1 }` (BLACK)

**Solution:**
- [TextShape.ts:52-59](src/rendering/shapes/TextShape.ts#L52): Changed constructor to merge props.textStyle properly
- Now merges: `{ ...defaultTextStyle, ...(props.textStyle || {}), ...style }`
- This preserves all properties during clone while still allowing style overrides

**Impact:**
- Toolbar changes now work correctly
- Changing font size preserves color, alignment, etc.
- Changing color preserves font size, weight, etc.
- All properties properly maintained through clone operations

## 2025-10-14

### ✅ Added "Save as Default" to Toolbar - Fixed Toolbar Persistence Issue
**Time:** Afternoon
**Description:** Fixed the critical issue where toolbar formatting changes would reset when navigating between slides or regenerating content. Added "Save as Default" button to make formatting changes persist.

**Problem:**
- Toolbar changes only updated individual slide instances
- When slides were regenerated (navigation, reload), they used global settings, losing toolbar edits
- Users would make font/color changes, navigate away, and return to find changes lost

**Solution:**
- Added "Save as Default" button to TypographyToolbar
- Button extracts current shape's formatting and updates global scripture settings
- Changes now persist to Redux and localStorage
- Visual confirmation toast shows when settings are saved

**Technical Implementation:**
- [TypographyToolbar.tsx:32](src/components/formatting/TypographyToolbar.tsx#L32): Added onSaveAsDefault optional callback prop
- [TypographyToolbar.tsx:382-395](src/components/formatting/TypographyToolbar.tsx#L382): Added "Save as Default" button with green styling
- [SlideEditorWithToolbar.tsx:10](src/components/slides/SlideEditorWithToolbar.tsx#L10): Imported useFeatureSettings hook
- [SlideEditorWithToolbar.tsx:155-187](src/components/slides/SlideEditorWithToolbar.tsx#L155): Implemented handleSaveAsDefault handler
- [SlideEditorWithToolbar.tsx:210-214](src/components/slides/SlideEditorWithToolbar.tsx#L210): Connected button to handler
- [SlideEditorWithToolbar.tsx:217-221](src/components/slides/SlideEditorWithToolbar.tsx#L217): Added confirmation toast

**How It Works:**
1. User selects text shape in preview
2. Uses toolbar to change font, color, alignment, etc.
3. Changes apply immediately to current slide
4. User clicks "Save as Default" button
5. Current formatting updates global scripture settings
6. Future slides generated with new defaults
7. Settings persist after app restart

**User Impact:**
- Clear UX: temporary edits vs. permanent defaults
- Toolbar changes no longer mysteriously disappear
- Users can experiment with formatting without commitment
- One click to make favorite formatting the new default
- Visual feedback confirms save operation

## 2025-10-14

### ✅ Added Scripture Reference Position Controls and Fixed Settings Persistence
**Time:** Morning
**Description:** Implemented 6-position reference placement controls (top-left, top-center, top-right, bottom-left, bottom-center, bottom-right) and ensured all scripture settings persist correctly after restart.

**Features Added:**
1. **Reference Position Controls:**
   - 6-position grid in ScriptureSettingsPanel for placing references
   - Positions: top-left, top-center, top-right, bottom-left, bottom-center, bottom-right
   - Dynamic bounds calculation in ScriptureTemplate.calculateReferenceBounds()
   - Corner positions (left/right) use half-width, center positions use full-width
   - Bottom positions leave 100px space to avoid toolbar overlap

2. **Reference Text Alignment:**
   - Separate alignment control for reference text (left/center/right)
   - Independent from verse text alignment
   - Allows fine-tuning of reference appearance within its bounding box

**Technical Implementation:**
- [featureSettingsSlice.ts](src/lib/featureSettingsSlice.ts): Extended ScriptureSettings interface with referencePosition and referenceAlign
- [featureSettingsSlice.ts:280-320](src/lib/featureSettingsSlice.ts): Fixed updateFeatureSettings to do deep merge of typography and background objects
- [ScriptureTemplate.ts:237-272](src/rendering/templates/ScriptureTemplate.ts): Added calculateReferenceBounds() method for dynamic positioning
- [ScriptureTemplate.ts:254-268](src/rendering/templates/ScriptureTemplate.ts): Updated createReferenceShape() to use calculated bounds and referenceAlign
- [ScriptureSettingsPanel.tsx:218-320](src/components/settings/ScriptureSettingsPanel.tsx): Added position grid and alignment controls UI

**Settings Persistence Fix:**
- Fixed shallow merge issue in updateFeatureSettings reducer
- Now properly deep-merges nested typography object
- Handles gradient background objects correctly
- Added console logging for debugging settings load/save
- Settings save immediately to localStorage on every change
- Default values properly merged with saved settings on load

**User Impact:**
- All scripture settings (fonts, colors, alignment, position) persist after app restart
- Reference position can be customized for different presentation styles
- Settings changes reflect immediately in preview and live display
- No more lost settings after closing the app

## 2025-10-14

### 🔧 Fixed Scripture References Not Displaying in Preview Window
**Time:** Evening
**Description:** Fixed scripture references and translation names not appearing in preview window. After investigation, moved references from bottom of slide to top for consistent visibility across all views.

**Root Causes:**
1. **Color Contrast Issue:**
   - Reference and translation shapes used theme accent colors
   - Theme accent color had poor contrast against backgrounds (especially red)
   - Verse text used typography textColor, but reference/translation ignored it
   - Result: Even when positioned correctly, text was invisible

2. **Positioning Issue (Primary):**
   - References originally positioned at bottom: `{ x: 1200, y: 900 }`
   - Preview window's clickable overlay/toolbar area obscured bottom region
   - Bottom positioning conflicted with preview window's interactive controls
   - Only content within the main editable area was reliably visible

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

2. **Repositioned References to Top of Slide** ([ScriptureTemplate.ts:52-74](src/rendering/templates/ScriptureTemplate.ts)):
   - **Final Layout (top to bottom):**
     - Reference: `{ x: 100, y: 40, width: 1720, height: 80 }` (top of slide)
     - Translation: `{ x: 100, y: 125, width: 1720, height: 60 }` (below reference)
     - Verse: `{ x: 100, y: 220, width: 1720, height: 800 }` (main content area)
   - Full-width positioning (100 to 1820) with center alignment
   - References at top are always visible in preview, live display, and editing modes
   - Follows common presentation pattern: title at top, content below

3. **Fixed Canvas Responsive Scaling** ([CanvasRenderer.ts:62-93](src/rendering/core/CanvasRenderer.ts)):
   - Modified `setupCanvas()` to detect when canvas already initialized
   - When preset dimensions detected (1920x1080), skip ALL style modifications
   - Let React CSS (`width: 100%`, `height: 100%`) handle responsive display
   - Canvas buffer stays 1920x1080, CSS scales to fit any container

**Technical Notes:**
- References positioned at slide top, well above any toolbar/overlay regions
- Reordered placeholders: reference first, then translation, then verse
- Both use `textAlign: 'center'` (from style.centerAlign default)
- Translation maintains opacity 0.8 for subtle appearance
- Added debug logging to verify shape creation
- Layout works consistently across preview window, live display, and presentation mode

**Impact:**
- References consistently visible in ALL views (preview, live, presentation)
- No conflicts with preview window's interactive controls/overlays
- Clean, professional layout with scripture reference as title
- Better UX: viewers immediately know what passage they're reading
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
