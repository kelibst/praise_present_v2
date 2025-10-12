# Live Presentation System - Implementation Plan

## Current Status Analysis (2025-10-12)

### What's Working 
- Advanced PowerPoint-style rendering engine with template system
- EditableSlidePreview for content editing with responsive scaling
- LiveDisplayRenderer for multi-window display
- Service plan management system with drag-and-drop
- Template generation (Scripture, Songs, Announcements)
- Preview window and live display monitor components

### Core Issues Identified �

**Main Problem**: The plan-to-preview-to-live workflow is incomplete. The preview window doesn't consistently show what will be displayed on the live screen.

**Current Reality**:
- Plan items exist but slide generation is inconsistent
- Preview window sometimes shows content, sometimes doesn't
- Live display doesn't always sync with preview
- Navigation between plan items and slides needs improvement

**Desired Flow**:
```
Plan Items � Slide Generation � Preview Window (Responsive) � Live Window � Live Screen
```

---

## Implementation Plan - 4 Phases

### **Phase 1: Complete Plan-to-Slides Pipeline** P START HERE
**Goal**: Ensure plan items reliably generate slides that display in preview

**Priority Tasks**:

1. **Fix Plan Item Slide Generation** (CRITICAL)
   - Audit `generateSlidesForItem()` in LivePresentationPage.tsx:376
   - Ensure Scripture items create slides with proper template
   - Ensure Song items create slides with verse/chorus structure
   - Ensure Announcement items create slides
   - Add error handling and fallback content

2. **Standardize Slide Structure**
   ```typescript
   interface Slide {
     id: string;
     shapes: Shape[];
     background: { type: 'color' | 'gradient', value: string };
     metadata?: {
       itemType: 'scripture' | 'song' | 'announcement';
       itemId: string;
       slideIndex: number;
       totalSlides: number;
     };
   }
   ```

3. **Preview Display Integration**
   - When plan item selected � generateSlidesForItem() � setSelectedItem with slides
   - Preview window receives: `{ type: 'template-slide', slide: currentSlide }`
   - EditableSlidePreview renders the slide with ResponsiveRenderingEngine
   - Verify slide displays correctly in preview panel

4. **Add Robust Error Handling**
   - If slide generation fails, show placeholder slide with error message
   - Log detailed errors for debugging
   - Provide user-friendly feedback in UI

**Expected Outcome**:
- Click plan item � see slides in preview window
- Preview shows properly formatted content (scripture verse, song lyrics, etc.)
- No blank/black preview panels

**Files to Modify**:
- `src/pages/LivePresentationPage.tsx` (generateSlidesForItem, error handling)
- `src/components/EditableSlidePreview.tsx` (verify rendering logic)
- `src/components/windows/PreviewWindow.tsx` (error states)

---

### **Phase 2: Preview-to-Live Synchronization**
**Goal**: Ensure live display shows exactly what preview shows

**Priority Tasks**:

1. **Unified Content Structure**
   - Preview generates slide � store in state
   - "Present Live" button sends same slide structure to live display
   - No transformation between preview and live

2. **Live Display Content Handling**
   - Verify LiveDisplayRenderer receives content correctly
   - Ensure SlideRenderer processes template-slide type
   - Match rendering settings (fonts, colors, scaling) between preview and live

3. **Presentation Mode State Management**
   - Track `presentationMode: 'preview' | 'live'`
   - Visual indicators show current mode
   - Keyboard shortcuts (F key) to present current slide

4. **Navigation Synchronization**
   - When navigating slides in preview, optionally update live
   - When in live mode, arrow keys navigate and update live display
   - Black screen (B key) and clear (Esc) controls

**Expected Outcome**:
- Preview slide � Press "Present Live" � Same content on live display
- Navigation in preview optionally updates live display
- Keyboard shortcuts work reliably

**Files to Modify**:
- `src/pages/LivePresentationPage.tsx` (presentCurrentSlide, navigation)
- `src/components/LiveDisplayRenderer.tsx` (content handling)
- `src/hooks/useLiveDisplay.tsx` (sendSlideToLive implementation)

---

### **Phase 3: Plan Item Management & Content Addition**
**Goal**: Complete the plan building workflow

**Priority Tasks**:

1. **Scripture Addition to Plan**
   - Use existing PlanScriptureSelector component (already created per ACTIVITIES.md)
   - Verify scripture verse selection adds to serviceItems
   - Test slide generation from scripture content

2. **Song Addition to Plan**
   - Integrate song selection into plan tab
   - Support adding songs from song library
   - Handle verse/chorus structure properly

3. **Announcement Addition**
   - Quick add announcement functionality (already exists: quickAddAnnouncement)
   - Custom text entry
   - Template-based announcement slides

4. **Plan Item Reordering**
   - Verify drag-and-drop reordering works (already implemented with dnd-kit)
   - Update item order numbers
   - Persist order in plan

5. **Plan Item Actions**
   - Edit item content
   - Delete item from plan
   - Duplicate item
   - Preview item without presenting live

**Expected Outcome**:
- Add scripture/songs/announcements to plan easily
- Reorder items with drag-and-drop
- Edit/delete items as needed
- Plan reflects actual service order

**Files to Modify**:
- `src/pages/LivePresentationPage.tsx` (item management functions)
- `src/components/plans/PlanScriptureSelector.tsx` (verify integration)
- `src/components/service/ServiceItem.tsx` (action buttons)

---

### **Phase 4: Polish & User Experience**
**Goal**: Refine the interface for smooth operation during live services

**Priority Tasks**:

1. **Visual Feedback Improvements**
   - Highlight current plan item clearly
   - Show slide count for each item (e.g., "3 slides")
   - Display current slide number in preview (e.g., "Slide 2/5")
   - Live mode indicator (green badge, "LIVE" text)

2. **Keyboard Shortcuts** (verify existing implementation)
   - Space/Enter/� : Next slide 
   - Backspace/� : Previous slide 
   - F : Present current slide 
   - B : Black screen 
   - Esc : Clear live display 
   - Add: Home/End for first/last slide

3. **Status Indicators**
   - Preview mode vs Live mode badge
   - Live display connection status
   - Unsaved changes warning (if editing)
   - Current item and slide position

4. **Empty States**
   - Helpful message when no plan items
   - Instructions for adding content
   - Quick action buttons

5. **Loading States**
   - Show spinner when generating slides
   - Indicate when presenting to live
   - Loading feedback for plan operations

**Expected Outcome**:
- Operators know exactly where they are in presentation
- Clear visual feedback for all actions
- Keyboard shortcuts work intuitively
- Professional, polished interface

**Files to Modify**:
- `src/pages/LivePresentationPage.tsx` (UI enhancements)
- `src/components/windows/PreviewWindow.tsx` (status displays)
- `src/components/service/ServiceItem.tsx` (visual feedback)

---

## Implementation Order & Strategy

### Week 1: Core Functionality
**Focus: Get the basics working perfectly**

**Day 1-2: Phase 1 - Plan to Slides**
- Fix slide generation for all content types
- Ensure preview displays generated slides
- Add comprehensive error handling

**Day 3-4: Phase 2 - Preview to Live**
- Synchronize preview and live display
- Fix presentation mode switching
- Test keyboard navigation

**Day 5: Phase 3 - Content Addition**
- Verify scripture/song/announcement addition
- Test plan item management
- Fix any issues with content flow

### Week 2: Polish & Testing
**Focus: Make it production-ready**

**Day 1-2: Phase 4 - UX Polish**
- Add all visual feedback
- Refine status indicators
- Test keyboard shortcuts

**Day 3-4: Integration Testing**
- Test complete workflow: add items � preview � present live
- Test all keyboard shortcuts
- Test edge cases (empty plan, errors, etc.)

**Day 5: Bug Fixes & Documentation**
- Fix any issues found in testing
- Update user documentation
- Prepare for production use

---

## Key Technical Considerations

### 1. Slide Generation Pipeline
```typescript
// LivePresentationPage.tsx
const generateSlidesForItem = async (item: ServiceItem, autoPresent = false) => {
  try {
    setIsGeneratingSlides(true);
    let slides: Slide[] = [];

    // Use appropriate template based on item type
    if (item.type === 'scripture') {
      slides = await generateScriptureSlides(item.content);
    } else if (item.type === 'song') {
      slides = await generateSongSlides(item.content);
    } else if (item.type === 'announcement') {
      slides = await generateAnnouncementSlides(item.content);
    }

    // Update item with generated slides
    const updatedItem = { ...item, slides };
    setSelectedItem(updatedItem);
    setCurrentSlideIndex(0);

    // Auto-present if requested
    if (autoPresent && liveDisplayActive) {
      await sendSlideToLive(slides[0], updatedItem, 0);
    }
  } catch (error) {
    console.error('Slide generation failed:', error);
    // Show error slide
    setSelectedItem({ ...item, slides: [createErrorSlide(error)] });
  } finally {
    setIsGeneratingSlides(false);
  }
};
```

### 2. Content Structure Consistency
**Preview and Live must use identical structure**:
```typescript
const slideContent = {
  type: 'template-slide',
  title: item.title,
  slide: {
    id: slide.id,
    shapes: slide.shapes,
    background: slide.background
  }
};

// Send to preview
<EditableSlidePreview content={slideContent} />

// Send to live (exact same structure)
sendSlideToLive(slideContent);
```

### 3. State Management
```typescript
// Current state in LivePresentationPage
const [serviceItems, setServiceItems] = useState<ServiceItem[]>([]);
const [selectedItem, setSelectedItem] = useState<ServiceItem | null>(null);
const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
const [presentationMode, setPresentationMode] = useState<'preview' | 'live'>('preview');

// Navigation logic
const goToNextSlide = () => {
  if (selectedItem?.slides && currentSlideIndex < selectedItem.slides.length - 1) {
    const newIndex = currentSlideIndex + 1;
    setCurrentSlideIndex(newIndex);

    // If in live mode, update live display
    if (presentationMode === 'live' && liveDisplayActive) {
      sendSlideToLive(selectedItem.slides[newIndex], selectedItem, newIndex);
    }
  }
};
```

---

## Success Criteria

### Phase 1 Success:
- [ ] Click any plan item � slides appear in preview
- [ ] Scripture items show formatted verses
- [ ] Song items show lyrics with proper structure
- [ ] Announcements show custom text
- [ ] No blank/black preview panels

### Phase 2 Success:
- [ ] Preview content matches live display exactly
- [ ] "Present Live" button works reliably
- [ ] Keyboard navigation updates both preview and live
- [ ] Black screen and clear functions work

### Phase 3 Success:
- [ ] Can add scripture to plan from within page
- [ ] Can add songs to plan
- [ ] Can add announcements quickly
- [ ] Can reorder items with drag-and-drop
- [ ] Can delete items from plan

### Phase 4 Success:
- [ ] Clear visual feedback for all states
- [ ] Operators know current position in service
- [ ] All keyboard shortcuts work
- [ ] Professional, polished appearance
- [ ] No confusing UI states

---

## Testing Checklist

### Basic Workflow Test:
1. Start LivePresentationPage
2. Add a scripture verse to plan
3. Verify slides appear in preview
4. Click "Present Live"
5. Verify same content appears in live display
6. Navigate to next slide with arrow key
7. Verify live display updates
8. Press B for black screen
9. Press Esc to clear
10. Add song to plan
11. Select song item
12. Verify song slides in preview
13. Present song live
14. Navigate through verses

### Edge Cases:
- Empty plan (no items)
- Plan with only one item
- Item with only one slide
- Rapid navigation (spam arrow keys)
- Present while generating slides
- Close live display while presenting
- Edit text during presentation
- Network/IPC errors

---

## Next Steps

**Immediate Priority**: Start with Phase 1, Task 1
- Open `src/pages/LivePresentationPage.tsx`
- Find `generateSlidesForItem()` function (line 376)
- Audit slide generation logic for all content types
- Add detailed error handling and logging
- Test with sample scripture/song/announcement items

**Success Check**: After Phase 1 Task 1
- Run the app
- Go to Live Presentation page
- Add a scripture verse using PlanScriptureSelector
- Verify slides appear in middle preview panel
- If slides don't appear, debug the generation pipeline

---

## Notes & Considerations

- **Keep ACTIVITIES.md compact**: Log only major milestones
- **Detailed logging here**: This file tracks the complete plan
- **Backward compatibility**: Don't break existing features
- **Performance**: Keep slide generation fast (<500ms)
- **Error recovery**: Always provide fallback content
- **User feedback**: Show loading/error states clearly

---

## Implementation Progress

### ✅ Phase 3.1 Complete: Scripture Addition to Plan (2025-10-12 Afternoon)

**Status**: COMPLETED

**What was implemented**:
- Added dedicated Scripture tab as the primary/default tab in LivePresentationPage
- Integrated BibleSelector component with KJV default version
- Genesis 1:1 automatically loaded via BibleSelector's existing defaultReference
- Implemented `handleScriptureSelect()` function for verse → service item → slide generation flow
- Added quick action buttons: "View Service Plan" and "Present Live"
- Scripture verses automatically generate slides and display in preview window

**Technical Changes**:
- Updated `activeTab` state type to include 'scripture' and set as default
- Added Scripture tab to navigation (first in tab list)
- Created `handleScriptureSelect` function that:
  - Converts selected verses to ServiceItem
  - Generates proper title (e.g., "Genesis 1:1-3" for verse ranges)
  - Adds item to serviceItems state
  - Automatically calls `generateSlidesForItem()` to show preview
- Added quick action buttons for navigation and presentation

**Files Modified**:
- `src/pages/LivePresentationPage.tsx` (lines ~30, ~692-740, ~939, ~1005-1040)

**User Experience Flow Achieved**:
1. User opens Live Presentation page → Scripture tab active by default
2. BibleSelector loads with KJV selected and Genesis 1:1 as default reference
3. User selects verses → `handleScriptureSelect` creates service item
4. Slides automatically generated via `generateSlidesForItem`
5. Preview window displays the scripture slides
6. User can click "Present Live" to send to live display

**Success Criteria Met**:
- [x] Can add scripture to plan from within page
- [x] Scripture tab is primary/default tab
- [x] KJV automatically selected
- [x] Genesis 1:1 automatically loaded
- [x] Preview generates automatically on verse selection

**Next Steps**:
- User testing to verify Scripture tab functionality
- Consider similar implementation for Songs and Announcements tabs
- Continue with Phase 2 (Preview-to-Live Synchronization) once Scripture tab is verified

---

## Version History

- **2025-10-12 Morning**: Initial plan created based on current codebase analysis
- **2025-10-12 Afternoon**: Completed Scripture tab implementation (Phase 3.1)
- Focus on completing plan-to-preview-to-live workflow
- Phased approach with clear success criteria
