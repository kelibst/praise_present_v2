## Implementation Plan: PowerPoint-Style Architecture for PraisePresent

### Executive Summary
Implement a **single source of truth** rendering system where slides are rendered once at 1920x1080, then displayed at any size using CSS scaling. This matches how PowerPoint, Google Slides, and Canva work.

### The Core Problem
Current system has 3 separate rendering instances that each try to adapt to their container size, causing inconsistent rendering and the "tiny text" bug. We need ONE renderer that all windows display.

### Implementation Phases

#### **Phase 1: Fix Immediate Canvas Setup Bug** ⚡ (QUICK WIN - DO THIS FIRST)
**Time:** 15 minutes  
**Goal:** Stop CanvasRenderer from overwriting canvas dimensions

**File:** `src/rendering/core/CanvasRenderer.ts` (lines 62-79)

**Change `setupCanvas()` to respect existing canvas dimensions:**
```typescript
private setupCanvas(): void {
  const pixelRatio = this.getPixelRatio();
  
  // CRITICAL: Check if canvas already has dimensions set
  // If so, respect them (EditableSlidePreview sets to 1920x1080)
  let displayWidth = this.canvas.width;
  let displayHeight = this.canvas.height;
  
  // Only use clientWidth as fallback if canvas not initialized
  if (displayWidth === 0 || displayHeight === 0) {
    displayWidth = this.canvas.clientWidth || 800;
    displayHeight = this.canvas.clientHeight || 600;
  }
  
  // Set canvas size with pixel ratio
  this.canvas.width = displayWidth * pixelRatio;
  this.canvas.height = displayHeight * pixelRatio;
  
  // Scale back down using CSS
  this.canvas.style.width = displayWidth + 'px';
  this.canvas.style.height = displayHeight + 'px';
  
  this.setupContextEventHandlers();
}
```

**Expected Result:** Preview windows should immediately show better text scaling

---

#### **Phase 2: Create Core SlideRenderer Component** 🎯 (FOUNDATION)
**Time:** 2 hours  
**Goal:** Build new clean component that ONLY renders slides

**Create:** `src/components/slides/SlideRenderer.tsx`
- Always renders at 1920x1080
- Never reads container size
- Simple, focused, single purpose
- Returns canvas element for display

**Test:** Render a scripture slide and verify it looks correct at any container size

---

#### **Phase 3: Create SlideViewer Component** 👀 (DISPLAY)
**Time:** 30 minutes  
**Goal:** Wrapper for SlideRenderer that handles display

**Create:** `src/components/slides/SlideViewer.tsx`
- Uses SlideRenderer
- Applies CSS scaling via object-fit: contain
- Read-only display
- No editing capabilities

**Test:** Display same slide in multiple containers of different sizes

---

#### **Phase 4: Create SlideEditor Component** ✏️ (EDITING)
**Time:** 2 hours  
**Goal:** SlideViewer + editing capabilities

**Create:** `src/components/slides/SlideEditor.tsx`
- Wraps SlideRenderer
- Handles click-to-edit
- Transforms display coordinates → canvas coordinates
- Updates slide data (single source of truth)

**Test:** Click on text, edit it, verify updates appear everywhere

---

#### **Phase 5: Refactor ScriptureTemplate** 📖 (CONTENT)
**Time:** 1 hour  
**Goal:** Generate slides with simple TextShape (not ResponsiveTextShape)

**Modify:** `src/rendering/templates/ScriptureTemplate.ts`
- Remove ResponsiveTextShape usage
- Use simple TextShape with absolute 1920x1080 positions
- Fixed font sizes (not responsive)
- Absolute pixel positions

**Test:** Generate scripture slide, verify it renders correctly in all viewers

---

#### **Phase 6: Integrate into LivePresentationPage** 🔗 (INTEGRATION)
**Time:** 2 hours  
**Goal:** Replace EditableSlidePreview with new components

**Modify:** `src/pages/LivePresentationPage.tsx`
- Preview window: Use SlideEditor
- Live monitor: Use SlideViewer  
- Keep live display window using SlideViewer

**Test:** Full workflow - select verse, preview, edit, present

---

#### **Phase 7: Clean Up Legacy Code** 🧹 (CLEANUP)
**Time:** 1 hour  
**Goal:** Remove old, unused code

**Remove:**
- `EditableSlidePreview.tsx` (replaced by SlideEditor)
- ResponsiveTextShape usage in templates
- Container size detection from CanvasRenderer (after Phase 1 fix)

---

### Quick Win Strategy (START HERE)

**Option A: Band-Aid Fix (15 min) - Get Something Working**
- Just do Phase 1
- Fixes immediate canvas setup bug
- Should improve preview windows significantly
- Buys time to implement proper architecture

**Option B: Proper Fix (8-10 hours over 2-3 days)**
- Do all phases 1-7
- Results in clean, maintainable architecture
- Matches PowerPoint/Slides behavior exactly
- Future-proof for new features

### Recommendation

**START WITH PHASE 1** (the CanvasRenderer fix) - it's a quick win that should improve things significantly. Then assess if you want to continue with the full rewrite or if Phase 1 is "good enough" for now.

The full rewrite (Phases 2-7) is the RIGHT solution long-term, but Phase 1 alone might be sufficient to unblock you.