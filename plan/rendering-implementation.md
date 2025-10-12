## Full Rewrite: PowerPoint-Style Architecture Implementation

### Total Estimated Time: 8-10 hours
### Approach: Build new system alongside old, then swap atomically

---

## **Phase 1: Fix Canvas Setup Bug** ⚡ (15 minutes)
### Goal: Stop CanvasRenderer from overwriting canvas dimensions

**Tasks:**
1. Modify `src/rendering/core/CanvasRenderer.ts` (lines 62-79)
2. Change `setupCanvas()` to check if canvas already has dimensions
3. If canvas.width > 0, respect it; otherwise use clientWidth as fallback
4. Test: Restart app, check if preview windows show better text

**Files Modified:**
- `src/rendering/core/CanvasRenderer.ts`

**Expected Result:** Text should scale better in preview windows (may not be perfect yet)

---

## **Phase 2: Create SlideRenderer Component** 🎯 (2 hours)
### Goal: Build core rendering component - single source of truth

**Tasks:**
1. Create `src/components/slides/` directory
2. Create `src/components/slides/SlideRenderer.tsx`
3. Implement:
   - Always renders at 1920x1080 (never reads container)
   - Uses simple RenderingEngine (not Responsive)
   - Canvas with CSS: `width: 100%, height: 100%, object-fit: contain`
   - useEffect renders when slide changes
   - Cleanup on unmount
4. Create `src/components/slides/index.ts` for exports
5. Test: Import in test file, render a simple slide with TextShape

**Files Created:**
- `src/components/slides/SlideRenderer.tsx`
- `src/components/slides/index.ts`

**Success Criteria:**
- Slide renders at 1920x1080 regardless of container size
- Canvas scales correctly via CSS
- Text appears at correct size for 1920x1080

---

## **Phase 3: Create SlideViewer Component** 👀 (30 minutes)
### Goal: Display-only wrapper for SlideRenderer

**Tasks:**
1. Create `src/components/slides/SlideViewer.tsx`
2. Implement:
   - Wraps SlideRenderer in container div
   - Passes slide prop through
   - No editing capabilities
   - Clean, minimal wrapper
3. Export from index.ts
4. Test: Display same slide in multiple div sizes

**Files Created:**
- `src/components/slides/SlideViewer.tsx`

**Success Criteria:**
- Same slide looks identical in different container sizes
- Only scale changes, not content
- No flickering or re-rendering on resize

---

## **Phase 4: Create SlideEditor Component** ✏️ (2 hours)
### Goal: Editable version with click-to-edit

**Tasks:**
1. Create `src/components/slides/SlideEditor.tsx`
2. Implement:
   - Uses SlideRenderer
   - Handles canvas click events
   - Transforms display coords → canvas coords (1920x1080)
   - Finds clicked shape
   - Shows edit input for text shapes
   - Calls onSlideChange callback with updated slide
3. Add coordinate transformation:
   ```typescript
   const scaleX = 1920 / rect.width;
   const scaleY = 1080 / rect.height;
   const canvasX = (clientX - rect.left) * scaleX;
   const canvasY = (clientY - rect.top) * scaleY;
   ```
4. Export from index.ts
5. Test: Click text, edit it, verify coordinates are correct

**Files Created:**
- `src/components/slides/SlideEditor.tsx`

**Success Criteria:**
- Can click on text shapes accurately at any display size
- Edit input appears in correct location
- Changes update the slide object
- Editing works in small and large containers

---

## **Phase 5: Refactor ScriptureTemplate** 📖 (1 hour)
### Goal: Generate slides with simple TextShape (not ResponsiveTextShape)

**Tasks:**
1. Backup current `src/rendering/templates/ScriptureTemplate.ts`
2. Modify `generateSlide()` method:
   - Replace ResponsiveTextShape with TextShape
   - Use absolute pixel positions for 1920x1080
   - Use fixed font sizes (e.g., 64px for verse, 32px for reference)
   - Example positions:
     ```typescript
     Verse text: { x: 100, y: 300, width: 1720, height: 400 }
     Reference: { x: 1400, y: 900, width: 400, height: 100 }
     ```
3. Remove flexible position/size logic
4. Test: Generate scripture slide, verify it renders correctly

**Files Modified:**
- `src/rendering/templates/ScriptureTemplate.ts`

**Success Criteria:**
- Generated slides have simple TextShape instances
- All positions are absolute pixels for 1920x1080
- Renders correctly in SlideViewer
- No ResponsiveTextShape in shape array

---

## **Phase 6: Integrate into LivePresentationPage** 🔗 (2 hours)
### Goal: Replace EditableSlidePreview with new components

**Tasks:**
1. Import SlideEditor and SlideViewer in LivePresentationPage
2. Replace preview window (middle panel):
   ```tsx
   <PreviewWindow title="Preview" type="preview">
     <SlideEditor
       slide={currentSlide}
       onSlideChange={handleSlideUpdate}
       editable={true}
     />
   </PreviewWindow>
   ```
3. Replace live monitor (right panel):
   ```tsx
   <PreviewWindow title="Live Monitor" type="live-display">
     <SlideViewer slide={currentSlide} />
   </PreviewWindow>
   ```
4. Update slide data structure handling
5. Implement `handleSlideUpdate` to update service item slides
6. Test full workflow:
   - Select verse
   - See in preview
   - Edit text
   - See update in monitor
   - Present to live display

**Files Modified:**
- `src/pages/LivePresentationPage.tsx`

**Success Criteria:**
- Preview shows editable slide
- Monitor shows read-only slide
- Both show identical content
- Edits in preview update service item
- Present button works

---

## **Phase 7: Update Live Display Window** 🖥️ (1 hour)
### Goal: Use SlideViewer in live display window

**Tasks:**
1. Check current live display rendering code
2. Replace with SlideViewer component
3. Ensure IPC communication works
4. Test: Present slide, verify it appears in live window

**Files Modified:**
- Live display window component (wherever it's rendered)

**Success Criteria:**
- Live display shows same content as preview/monitor
- IPC communication works
- Full screen presentation works

---

## **Phase 8: Clean Up Legacy Code** 🧹 (1 hour)
### Goal: Remove old, unused code

**Tasks:**
1. Comment out EditableSlidePreview usage (don't delete yet)
2. Remove ResponsiveTextShape from template imports
3. Remove container size detection from CanvasRenderer
4. Update exports
5. Run app, verify everything works
6. Delete commented code if all works

**Files Modified:**
- `src/components/EditableSlidePreview.tsx` (archive, don't delete)
- `src/rendering/templates/ScriptureTemplate.ts` (cleanup imports)
- `src/rendering/core/CanvasRenderer.ts` (remove old logic)

**Success Criteria:**
- App runs without errors
- No "unused import" warnings
- Codebase is cleaner

---

## **Phase 9: Testing & Validation** ✅ (1 hour)
### Goal: Comprehensive testing of all workflows

**Test Cases:**
1. Generate scripture slide → appears correctly in preview
2. Edit text in preview → updates everywhere
3. Resize preview panel → content scales, doesn't re-render
4. Present to live display → shows identical content
5. Navigate between slides → smooth transitions
6. Multiple different verse types → all render correctly
7. Long text → wraps correctly at 1920x1080

**Success Criteria:**
- All test cases pass
- No flickering or re-rendering issues
- Preview matches live display perfectly
- Performance is smooth

---

## **Phase 10: Update ACTIVITIES.md** 📝 (15 minutes)
### Goal: Document the architectural change

**Tasks:**
1. Add comprehensive entry to ACTIVITIES.md
2. Document:
   - The problem (3 separate renderers)
   - The solution (single source of truth)
   - Architecture change (PowerPoint pattern)
   - Files created/modified
   - Benefits achieved

---

## **Rollback Plan** 🔄
If anything breaks:
1. Git stash current changes
2. Revert to previous commit
3. EditableSlidePreview is still in codebase
4. Can switch back to old system immediately

---

## **Success Metrics**
After completion, verify:
- [ ] Preview text fills canvas correctly (not cramped)
- [ ] Monitor shows identical content to preview
- [ ] Live display shows identical content
- [ ] Editing works in preview
- [ ] Window resize doesn't affect rendering
- [ ] No console errors or warnings
- [ ] Code is simpler and easier to understand
- [ ] WYSIWYG guarantee: preview = presentation

---

## **Order of Execution**
1. Phase 1 (Canvas fix) - immediate improvement
2. Phases 2-4 (New components) - build foundation
3. Phase 5 (Template) - fix content generation
4. Phases 6-7 (Integration) - swap to new system
5. Phase 8 (Cleanup) - remove old code
6. Phases 9-10 (Testing & docs) - validate & document

**Ready to start with Phase 1?**