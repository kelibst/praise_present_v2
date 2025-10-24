# Presentation Hooks - Usage Guide

This directory contains custom hooks extracted from the LivePresentationPage refactoring. These hooks encapsulate complex presentation logic and make it reusable across the application.

## Overview

The presentation hooks follow a clear separation of concerns:

- **usePanelLayout** - UI panel state management
- **useSlideGeneration** - Content-to-slide conversion
- **usePresentationNavigation** - Slide/verse navigation logic
- **useServiceItems** - Service item CRUD operations
- **usePresentationKeyboard** - Keyboard shortcut handling

## Quick Start Example

```typescript
import React, { useState } from 'react';
import {
  usePanelLayout,
  useSlideGeneration,
  usePresentationNavigation,
  useServiceItems,
  usePresentationKeyboard
} from '../hooks/presentation';
import { useLiveDisplay } from '../components/live/LiveDisplayManager';
import { useFeatureSettings } from '../hooks/useFeatureSettings';

export const MyPresentationPage = () => {
  // Local state
  const [selectedItem, setSelectedItem] = useState(null);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [presentationMode, setPresentationMode] = useState('preview');
  const [isPresenting, setIsPresenting] = useState(false);

  // External hooks
  const { scriptureSettings, songSettings } = useFeatureSettings();
  const { liveDisplayActive, sendSlideToLive, createLiveDisplay, clearLiveDisplay, showBlackScreen } = useLiveDisplay();

  // Panel layout hook
  const { panelVisibility, panelSizes, togglePanel, handlePanelResize } = usePanelLayout();

  // Slide generation hook
  const { generateSlidesForItem, isGeneratingSlides } = useSlideGeneration({
    scriptureSettings,
    songSettings,
    liveDisplayActive,
    sendSlideToLive
  });

  // Service items hook
  const {
    serviceItems,
    handleServiceItemSelect,
    handleServiceItemPresent,
    handleDragEnd,
    quickAddAnnouncement
  } = useServiceItems({
    generateSlidesForItem,
    setSelectedItem,
    setCurrentSlideIndex,
    setPresentationMode,
    sendSlideToLive,
    liveDisplayActive,
    createLiveDisplay,
    setIsPresenting
  });

  // Navigation hook (placeholder for handleScriptureSelect)
  const handleScriptureSelect = async (verses) => {
    // Your scripture selection logic
  };

  const {
    goToNext,
    goToPrevious,
    presentCurrentSlide,
    canNavigatePrevious,
    canNavigateNext
  } = usePresentationNavigation({
    selectedItem,
    currentSlideIndex,
    presentationMode,
    liveDisplayActive,
    setCurrentSlideIndex,
    sendSlideToLive,
    handleScriptureSelect
  });

  // Keyboard shortcuts hook
  usePresentationKeyboard({
    goToNext,
    goToPrevious,
    presentCurrentSlide,
    showBlackScreen,
    clearLiveDisplay,
    liveDisplayActive,
    selectedItem,
    currentSlideIndex,
    setPresentationMode,
    setIsPresenting
  });

  return (
    <div>
      {/* Your presentation UI */}
    </div>
  );
};
```

## Hook Details

### 1. usePanelLayout

Manages panel visibility and sizing with localStorage persistence.

**Returns:**
- `panelVisibility` - Object with leftPanel, middlePanel, rightPanel booleans
- `panelSizes` - Array of panel size percentages [30, 45, 25]
- `togglePanel` - Function to toggle a specific panel
- `handlePanelResize` - Callback for panel resize events

**Keyboard Shortcuts:**
- `Ctrl+1` - Toggle left panel
- `Ctrl+2` - Toggle middle panel
- `Ctrl+3` - Toggle right panel

### 2. useSlideGeneration

Handles slide generation for all content types with caching.

**Parameters:**
- `scriptureSettings` - Feature settings for scripture slides
- `songSettings` - Feature settings for song slides
- `liveDisplayActive` - Whether live display is active
- `sendSlideToLive` - Function to send slide to live display

**Returns:**
- `generateSlidesForItem(item, autoPresent?)` - Generate slides for a service item
- `isGeneratingSlides` - Loading state boolean

**Features:**
- Preserves existing slides to maintain customizations
- Uses shape caching for performance
- Supports scripture (single/grouped verses), songs, announcements
- Auto-presentation on generation

### 3. usePresentationNavigation

Unified navigation for slides, verses, and chapters.

**Parameters:**
- `selectedItem` - Currently selected service item
- `currentSlideIndex` - Current slide index
- `presentationMode` - 'preview' | 'live'
- `liveDisplayActive` - Live display status
- `setCurrentSlideIndex` - State setter
- `sendSlideToLive` - Function to send slide
- `handleScriptureSelect` - Scripture selection handler

**Returns:**
- `goToNext()` - Navigate to next slide/verse
- `goToPrevious()` - Navigate to previous slide/verse
- `goToNextVerse()` - Next verse in Bible (scripture only)
- `goToPreviousVerse()` - Previous verse in Bible
- `goToNextChapter()` - Next chapter in Bible
- `goToPreviousChapter()` - Previous chapter in Bible
- `presentCurrentSlide()` - Present current slide live
- `canNavigatePrevious` - Can go previous
- `canNavigateNext` - Can go next
- `canNavigatePreviousChapter` - Can go to previous chapter
- `canNavigateNextChapter` - Can go to next chapter
- `isNavigating` - Navigation loading state

**Smart Navigation:**
- For multi-slide items: navigates between slides
- For single-verse scripture: navigates verse-by-verse through Bible

### 4. useServiceItems

Complete service item management with CRUD and drag-drop.

**Parameters:**
- `generateSlidesForItem` - Slide generation function
- `setSelectedItem` - State setter
- `setCurrentSlideIndex` - State setter
- `setPresentationMode` - State setter
- `sendSlideToLive` - Function to send slide
- `liveDisplayActive` - Live display status
- `createLiveDisplay` - Function to create live display
- `setIsPresenting` - State setter

**Returns:**
- `serviceItems` - Array of service items from Redux
- `addServiceItem(item)` - Add new service item
- `handleServiceItemSelect(item, event)` - Single-click preview
- `handleServiceItemPresent(item, event)` - Double-click present
- `handleServiceItemEdit(item)` - Edit item
- `handleServiceItemDelete(itemId)` - Delete item
- `handleDragEnd(event)` - Drag-drop reorder handler
- `quickAddAnnouncement()` - Quick add announcement
- `addInlineSong(song, position)` - Add song at position
- `addInlineScripture(scripture, position)` - Add scripture at position
- `addInlinePresentation(presentation, position)` - Add presentation
- `addInlineAnnouncement(announcement, position)` - Add announcement

**Features:**
- Preserves slide customizations on selection
- Auto-creates live display if needed
- Position-based inline additions
- Drag-and-drop with @dnd-kit

### 5. usePresentationKeyboard

Centralized keyboard shortcut management.

**Parameters:**
- `goToNext` - Next navigation function
- `goToPrevious` - Previous navigation function
- `presentCurrentSlide` - Present function
- `showBlackScreen` - Black screen function
- `clearLiveDisplay` - Clear display function
- `liveDisplayActive` - Live display status
- `selectedItem` - Current item
- `currentSlideIndex` - Current index
- `setPresentationMode` - State setter
- `setIsPresenting` - State setter

**Keyboard Shortcuts:**
- `Space` / `Enter` / `→` - Next slide/verse
- `Backspace` / `←` - Previous slide/verse
- `B` - Black screen (when live)
- `Esc` - Clear live display
- `F` - Present current slide

**Features:**
- Ignores shortcuts when typing in input fields
- Prevents default browser shortcuts
- Proper event cleanup

## Best Practices

1. **Hook Dependencies**: Always provide all required dependencies to avoid stale closures
2. **State Management**: Use local state for UI, Redux for shared data
3. **Error Handling**: Wrap hook usage in try-catch for production
4. **Performance**: Hooks use useCallback/useMemo internally for optimization
5. **Testing**: Each hook can be tested independently with @testing-library/react-hooks

## Migration from LivePresentationPage

If you're migrating from the original LivePresentationPage:

1. Remove all inline slide generation logic
2. Replace navigation functions with hook returns
3. Replace service item handlers with hook returns
4. Remove keyboard event listeners (hook handles it)
5. Replace panel management with usePanelLayout

See [LivePresentationPage.tsx](../../pages/LivePresentationPage.tsx) for complete integration example.
