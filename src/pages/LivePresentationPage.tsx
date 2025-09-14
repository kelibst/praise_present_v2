import React, { useState, useEffect } from 'react';
import { Play, Monitor, MonitorSpeaker, SkipBack, SkipForward, Eye, Settings, Save, Palette, AlignLeft, AlignCenter, AlignRight, Calendar, Plus } from 'lucide-react';

// Import data (using real database connections)
import { sampleSongs } from '../../data/sample-songs'; // Keep for song library until database integration

// Import template system
import { ScriptureTemplate, SongTemplate, SlideGenerator, Shape } from '../rendering';
import { TemplateManager, ensureTemplateManagerReady } from '../rendering/templates/TemplateManager';
import { DEFAULT_SLIDE_SIZE } from '../rendering/templates/templateUtils';
import BibleSelector from '../components/bible/BibleSelector';
import SongLibrary from '../components/songs/SongLibrary';

// Import editable preview component
import { EditableSlidePreview } from '../components/EditableSlidePreview';
import { GeneratedSlide } from '../rendering/SlideGenerator';

// Import plan components
import { PlanManager } from '../components/plans/PlanManager';
import { PlanWithItems, PlanItemWithContent } from '../types/plan';

// Define Slide interface
interface Slide {
  id: string;
  shapes: Shape[];
  background?: {
    type: 'color' | 'image' | 'gradient';
    value: string;
  };
  duration?: number;
}

// Unified service item interface that replaces both PresentationItem and ServiceItem
interface ServiceItem {
  id: string;
  type: 'scripture' | 'song' | 'announcement' | 'media' | 'sermon';
  title: string;
  content: any;
  slides?: Slide[];
  duration?: number;
  order?: number;
  notes?: string;
  // Plan-specific fields (when item comes from a plan)
  planId?: string;
  planItemId?: string;
}

interface LivePresentationPageProps {}

export const LivePresentationPage: React.FC<LivePresentationPageProps> = () => {
  // State management
  const [activeTab, setActiveTab] = useState<'plan' | 'plans' | 'scriptures' | 'songs'>('plan');
  const [serviceItems, setServiceItems] = useState<ServiceItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<ServiceItem | null>(null);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [isPresenting, setIsPresenting] = useState(false);
  const [isGeneratingSlides, setIsGeneratingSlides] = useState(false);
  const [presentationMode, setPresentationMode] = useState<'preview' | 'live'>('preview');

  // Live display state (using standardized pattern)
  const [liveDisplayActive, setLiveDisplayActive] = useState(false);
  const [liveDisplayStatus, setLiveDisplayStatus] = useState('Disconnected');

  // Editable slide state
  const [editableSlideContent, setEditableSlideContent] = useState<any>(null);
  const [slideProperties, setSlideProperties] = useState({
    backgroundColor: '#1a1a1a',
    fontSize: 48,
    textAlign: 'center' as 'left' | 'center' | 'right',
    fontFamily: 'Arial, sans-serif',
    textColor: '#ffffff'
  });
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showPropertyPanel, setShowPropertyPanel] = useState(false);

  // Plan-related state (simplified)
  const [selectedPlan, setSelectedPlan] = useState<PlanWithItems | null>(null);
  const [currentPlanItemIndex, setCurrentPlanItemIndex] = useState(0);

  // Service item management
  const [showQuickAdd, setShowQuickAdd] = useState(false);

  // Template system with enhanced initialization
  const [templateManager] = useState(() => {
    console.log('🔧 LivePresentationPage: Initializing TemplateManager with enhanced validation');

    // Use the enhanced template manager initialization
    const manager = ensureTemplateManagerReady();

    // Validate it's ready for our specific slide size
    const validation = manager.validateAndRecover();

    if (!validation.isValid) {
      console.warn('TemplateManager validation failed for LivePresentationPage, performing full initialization');
      manager.initialize(DEFAULT_SLIDE_SIZE);
    } else if (validation.recovered) {
      console.log('TemplateManager auto-recovered successfully', validation.warnings);
    }

    // Double-check with our slide size
    if (manager.getSlideSize().width !== DEFAULT_SLIDE_SIZE.width ||
        manager.getSlideSize().height !== DEFAULT_SLIDE_SIZE.height) {
      console.log('TemplateManager: Updating slide size to match DEFAULT_SLIDE_SIZE');
      manager.initialize(DEFAULT_SLIDE_SIZE);
    }

    console.log('✅ LivePresentationPage: TemplateManager ready', {
      isInitialized: manager.isInitialized(),
      slideSize: manager.getSlideSize(),
      themeCount: manager.getAllThemes().length,
      templateCount: manager.getAllTemplates().length
    });

    return manager;
  });
  const [slideGenerator] = useState(() => new SlideGenerator());

  // Initialize with empty service items - users should create plans or add items manually
  useEffect(() => {
    setServiceItems([]);
  }, []);

  // Check live display status on mount
  useEffect(() => {
    const checkStatus = async () => {
      if (window.electronAPI) {
        const status = await window.electronAPI.invoke('live-display:getStatus');
        if (status?.hasWindow && status?.isVisible) {
          setLiveDisplayActive(true);
          setLiveDisplayStatus('Active');
        }
      }
    };
    checkStatus();
  }, []);

  // Keyboard shortcuts for presentation control
  useEffect(() => {
    const handleKeyPress = async (event: KeyboardEvent) => {
      // Only handle keyboard shortcuts when not typing in an input
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement || event.target instanceof HTMLSelectElement) {
        return;
      }

      // Prevent default for our shortcuts
      const shortcuts = [' ', 'Enter', 'Backspace', 'ArrowLeft', 'ArrowRight', 'Escape', 'KeyB', 'KeyF'];
      if (shortcuts.includes(event.code)) {
        event.preventDefault();
      }

      switch (event.code) {
        case 'Space':
        case 'Enter':
        case 'ArrowRight':
          // Next slide
          if (selectedItem?.slides && currentSlideIndex < selectedItem.slides.length - 1) {
            const newIndex = currentSlideIndex + 1;
            setCurrentSlideIndex(newIndex);
            if (presentationMode === 'live' && liveDisplayActive && selectedItem.slides[newIndex]) {
              await sendSlideToLive(selectedItem.slides[newIndex], selectedItem, newIndex);
            }
          }
          break;

        case 'Backspace':
        case 'ArrowLeft':
          // Previous slide
          if (selectedItem?.slides && currentSlideIndex > 0) {
            const newIndex = currentSlideIndex - 1;
            setCurrentSlideIndex(newIndex);
            if (presentationMode === 'live' && liveDisplayActive && selectedItem.slides[newIndex]) {
              await sendSlideToLive(selectedItem.slides[newIndex], selectedItem, newIndex);
            }
          }
          break;

        case 'KeyB':
          // Black screen
          if (liveDisplayActive) {
            await showBlackScreen();
          }
          break;

        case 'Escape':
          // Clear live display
          if (liveDisplayActive) {
            await clearLiveDisplay();
            setPresentationMode('preview');
            setIsPresenting(false);
          }
          break;

        case 'KeyF':
          // Go to live mode (present current slide)
          if (selectedItem?.slides && selectedItem.slides[currentSlideIndex] && liveDisplayActive) {
            await presentCurrentSlide();
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => {
      window.removeEventListener('keydown', handleKeyPress);
    };
  }, [selectedItem, currentSlideIndex, presentationMode, liveDisplayActive]);

  // Live display functions (standardized pattern)
  const createLiveDisplay = async () => {
    try {
      const result = await window.electronAPI?.invoke('live-display:create', {});
      if (result?.success) {
        setLiveDisplayActive(true);
        setLiveDisplayStatus('Active');
      }
    } catch (error) {
      console.error('Failed to create live display:', error);
      setLiveDisplayStatus('Error');
    }
  };

  const closeLiveDisplay = async () => {
    try {
      await window.electronAPI?.invoke('live-display:close');
      setLiveDisplayActive(false);
      setLiveDisplayStatus('Disconnected');
    } catch (error) {
      console.error('Failed to close live display:', error);
    }
  };

  const sendSlideToLive = async (slide: Slide, item: PresentationItem, slideIndex?: number) => {
    if (!liveDisplayActive) return;

    try {
      // Determine the slide index - either passed in or find it in the slides array
      let actualSlideIndex = slideIndex ?? 0;
      if (slideIndex === undefined && item.slides) {
        actualSlideIndex = item.slides.findIndex(s => s.id === slide.id);
        if (actualSlideIndex === -1) actualSlideIndex = currentSlideIndex;
      }

      // Enhanced shape serialization with responsive properties preservation
      const serializeShape = (shape: any) => {
        const baseProps = {
          id: shape.id,
          type: shape.type,
          position: shape.position || { x: 0, y: 0 },
          size: shape.size || { width: 100, height: 50 },
          rotation: shape.rotation || 0,
          opacity: shape.opacity !== undefined ? shape.opacity : 1.0,
          zIndex: shape.zIndex || 0,
          visible: shape.visible !== undefined ? shape.visible : true,
          transform: shape.transform,
          style: shape.style
        };

        // Responsive properties (if shape is responsive)
        const responsiveProps: any = {};
        if (shape.responsive !== undefined) {
          responsiveProps.responsive = shape.responsive;
        }
        if (shape.flexiblePosition) {
          responsiveProps.flexiblePosition = shape.flexiblePosition;
        }
        if (shape.flexibleSize) {
          responsiveProps.flexibleSize = shape.flexibleSize;
        }
        if (shape.layoutConfig) {
          responsiveProps.layoutConfig = shape.layoutConfig;
        }
        if (shape.typography) {
          responsiveProps.typography = shape.typography;
        }
        if (shape.maintainAspectRatio !== undefined) {
          responsiveProps.maintainAspectRatio = shape.maintainAspectRatio;
        }

        // Text-specific properties with comprehensive serialization
        if (shape.type === 'text') {
          const textProps = {
            text: shape.text || '',
            textStyle: {
              fontFamily: shape.textStyle?.fontFamily || 'Arial, sans-serif',
              fontSize: shape.textStyle?.fontSize || 24,
              fontWeight: shape.textStyle?.fontWeight || 'normal',
              fontStyle: shape.textStyle?.fontStyle || 'normal',
              color: shape.textStyle?.color || { r: 255, g: 255, b: 255, a: 1 },
              textAlign: shape.textStyle?.textAlign || 'left',
              verticalAlign: shape.textStyle?.verticalAlign || 'top',
              lineHeight: shape.textStyle?.lineHeight || 1.2,
              letterSpacing: shape.textStyle?.letterSpacing || 0,
              textDecoration: shape.textStyle?.textDecoration || 'none',
              textTransform: shape.textStyle?.textTransform || 'none',
              textShadow: shape.textStyle?.textShadow,
              shadowColor: shape.textStyle?.shadowColor,
              shadowBlur: shape.textStyle?.shadowBlur,
              shadowOffsetX: shape.textStyle?.shadowOffsetX,
              shadowOffsetY: shape.textStyle?.shadowOffsetY
            },
            autoSize: shape.autoSize !== false,
            wordWrap: shape.wordWrap !== false,
            maxLines: shape.maxLines || 0,
            // Responsive text-specific properties
            optimizeReadability: shape.optimizeReadability !== false,
            scaleMode: shape.scaleMode || 'fluid'
          };

          return {
            ...baseProps,
            ...responsiveProps,
            ...textProps
          };
        }

        // Background-specific properties
        if (shape.type === 'background') {
          return {
            ...baseProps,
            ...responsiveProps,
            backgroundStyle: shape.backgroundStyle
          };
        }

        // Rectangle-specific properties
        if (shape.type === 'rectangle') {
          return {
            ...baseProps,
            ...responsiveProps,
            fillColor: shape.fillColor,
            strokeColor: shape.strokeColor,
            strokeWidth: shape.strokeWidth,
            borderRadius: shape.borderRadius,
            fill: shape.fill,
            stroke: shape.stroke
          };
        }

        return {
          ...baseProps,
          ...responsiveProps
        };
      };

      const serializedSlide = {
        id: slide.id,
        shapes: slide.shapes.map(serializeShape),
        background: slide.background
      };

      const content = {
        type: 'template-slide',
        title: `${item.title} - Slide ${actualSlideIndex + 1}`,
        slide: serializedSlide,
        metadata: {
          itemType: item.type,
          slideIndex: actualSlideIndex,
          totalSlides: item.slides?.length || 1
        }
      };

      await window.electronAPI?.invoke('live-display:sendContent', content);
    } catch (error) {
      console.error('Failed to send slide to live display:', error);
    }
  };

  const clearLiveDisplay = async () => {
    if (!liveDisplayActive) return;
    await window.electronAPI?.invoke('live-display:clearContent');
  };

  const showBlackScreen = async () => {
    if (!liveDisplayActive) return;
    await window.electronAPI?.invoke('live-display:showBlack');
  };

  // Generate slides for selected item
  const generateSlidesForItem = async (item: ServiceItem, autoPresent = false) => {
    if (isGeneratingSlides) return; // Prevent multiple concurrent generations

    try {
      setIsGeneratingSlides(true);
      let slides: Slide[] = [];

      if (item.type === 'scripture' && item.content.verses) {
        const scriptureTemplate = new ScriptureTemplate(DEFAULT_SLIDE_SIZE);
        for (const verse of item.content.verses) {
          // Create content structure for ScriptureTemplate
          const scriptureContent = {
            verse: verse.text || 'Sample verse text',
            reference: `${verse.book} ${verse.chapter}:${verse.verse}`,
            translation: verse.translation || 'KJV',
            book: verse.book,
            chapter: verse.chapter,
            verseNumber: verse.verse,
            theme: 'reading' as const,
            showTranslation: true,
            emphasizeReference: true
          };

          // Generate shapes and create slide
          const shapes = scriptureTemplate.generateSlide(scriptureContent);
          slides.push({
            id: `scripture-${verse.id || Date.now()}`,
            shapes: shapes,
            background: { type: 'color', value: '#1a1a1a' }
          });
        }
      } else if (item.type === 'song' && item.content.lyrics) {
        const songTemplate = new SongTemplate(DEFAULT_SLIDE_SIZE);

        // Handle song content - parse lyrics into verses/chorus if needed
        const songContent = item.content;

        if (songContent.verses && Array.isArray(songContent.verses)) {
          // Process verses array
          songContent.verses.forEach((verse: string, index: number) => {
            const songSlideContent = {
              title: songContent.title || 'Untitled Song',
              lyrics: verse,
              section: 'verse',
              sectionNumber: index + 1,
              author: songContent.author,
              copyright: songContent.copyright,
              ccli: songContent.ccli,
              key: songContent.key,
              tempo: songContent.tempo,
              showChords: false,
              showCopyright: index === songContent.verses.length - 1 // Show on last verse
            };

            const shapes = songTemplate.generateSlide(songSlideContent);
            slides.push({
              id: `song-verse-${index}`,
              shapes: shapes,
              background: { type: 'color', value: '#1a1a1a' }
            });
          });

          // Add chorus if exists
          if (songContent.chorus) {
            const chorusContent = {
              title: songContent.title || 'Untitled Song',
              lyrics: songContent.chorus,
              section: 'chorus',
              sectionNumber: 1,
              author: songContent.author,
              copyright: songContent.copyright,
              ccli: songContent.ccli,
              showChords: false,
              showCopyright: false
            };

            const shapes = songTemplate.generateSlide(chorusContent);
            slides.push({
              id: 'song-chorus',
              shapes: shapes,
              background: { type: 'color', value: '#1a1a1a' }
            });
          }
        } else {
          // Handle simple lyrics string
          const songSlideContent = {
            title: songContent.title || 'Untitled Song',
            lyrics: songContent.lyrics || 'No lyrics available',
            section: 'verse',
            sectionNumber: 1,
            author: songContent.author,
            copyright: songContent.copyright,
            ccli: songContent.ccli,
            key: songContent.key,
            tempo: songContent.tempo,
            showChords: false,
            showCopyright: true
          };

          const shapes = songTemplate.generateSlide(songSlideContent);
          slides.push({
            id: 'song-slide',
            shapes: shapes,
            background: { type: 'color', value: '#1a1a1a' }
          });
        }
      }

      const updatedItem = { ...item, slides };
      setSelectedItem(updatedItem);
      setCurrentSlideIndex(0);
      setPresentationMode(autoPresent ? 'live' : 'preview');

      // Update the item in service items list
      setServiceItems(prev =>
        prev.map(p => p.id === item.id ? updatedItem : p)
      );

      // Auto-present if double-clicked
      if (autoPresent && slides.length > 0 && liveDisplayActive) {
        await sendSlideToLive(slides[0], updatedItem, 0);
        setIsPresenting(true);
      }

    } catch (error) {
      console.error('Failed to generate slides:', error);
    } finally {
      setIsGeneratingSlides(false);
    }
  };

  // Handle service item selection (single click)
  const handleServiceItemSelect = (item: ServiceItem, event: React.MouseEvent) => {
    event.stopPropagation();
    generateSlidesForItem(item, false);
  };

  // Handle service item presentation (double click)
  const handleServiceItemPresent = async (item: ServiceItem, event: React.MouseEvent) => {
    event.stopPropagation();

    if (!liveDisplayActive) {
      // Create live display if it doesn't exist
      await createLiveDisplay();
      // Wait a moment for live display to be ready
      setTimeout(() => {
        generateSlidesForItem(item, true);
      }, 500);
    } else {
      generateSlidesForItem(item, true);
    }
  };

  // Navigation functions
  const goToPreviousSlide = () => {
    if (selectedItem?.slides && currentSlideIndex > 0) {
      setCurrentSlideIndex(currentSlideIndex - 1);
    }
  };

  const goToNextSlide = () => {
    if (selectedItem?.slides && currentSlideIndex < selectedItem.slides.length - 1) {
      setCurrentSlideIndex(currentSlideIndex + 1);
    }
  };

  // Present current slide
  const presentCurrentSlide = async () => {
    if (selectedItem?.slides && selectedItem.slides[currentSlideIndex]) {
      await sendSlideToLive(selectedItem.slides[currentSlideIndex], selectedItem, currentSlideIndex);
      setIsPresenting(true);
    }
  };

  // Slide editing functions
  const handleSlideContentChange = (newContent: any) => {
    console.log('🔄 HandleSlideContentChange: Content changed', {
      hasSelectedItem: !!selectedItem,
      hasSelectedSlides: !!selectedItem?.slides,
      newContentType: newContent?.type,
      hasNewSlide: !!newContent?.slide,
      newSlideShapeCount: newContent?.slide?.shapes?.length
    });

    if (!selectedItem || !selectedItem.slides) {
      console.log('❌ HandleSlideContentChange: Missing selected item or slides');
      return;
    }

    // Update editable content and mark as changed
    setEditableSlideContent(newContent);
    setHasUnsavedChanges(true);
    console.log('✅ HandleSlideContentChange: Content updated and marked as changed');
  };

  // Note: handleSlideGenerated removed to prevent infinite loop
  // The EditableSlidePreview will use the content directly from getPreviewContent()

  const saveSlideChanges = async () => {
    console.log('💾 SaveSlideChanges: Starting save process', {
      hasSelectedItem: !!selectedItem,
      hasSelectedSlides: !!selectedItem?.slides,
      hasEditableContent: !!editableSlideContent,
      slidesLength: selectedItem?.slides?.length,
      currentSlideIndex,
      hasUnsavedChanges
    });

    if (!selectedItem || !selectedItem.slides || !editableSlideContent) {
      console.log('❌ SaveSlideChanges: Missing required data');
      return;
    }

    try {
      console.log('🔄 SaveSlideChanges: Processing changes', {
        editableContentType: editableSlideContent.type,
        hasSlide: !!editableSlideContent.slide,
        slideShapeCount: editableSlideContent.slide?.shapes?.length
      });

      // Update the current slide with modified content
      const updatedSlides = [...selectedItem.slides];
      if (editableSlideContent.slide) {
        const updatedSlide = {
          id: editableSlideContent.slide.id,
          shapes: editableSlideContent.slide.shapes,
          background: editableSlideContent.slide.background || { type: 'color', value: slideProperties.backgroundColor }
        };

        console.log('📝 SaveSlideChanges: Updated slide created', {
          slideId: updatedSlide.id,
          shapeCount: updatedSlide.shapes.length,
          background: updatedSlide.background
        });

        updatedSlides[currentSlideIndex] = updatedSlide;
      }

      // Update the presentation item
      const updatedItem = { ...selectedItem, slides: updatedSlides };
      console.log('📋 SaveSlideChanges: Setting updated item');
      setSelectedItem(updatedItem);

      // Update service items array
      console.log('📊 SaveSlideChanges: Updating service items');
      setServiceItems(prev =>
        prev.map(item => item.id === selectedItem.id ? updatedItem : item)
      );

      // If in live mode, immediately update the live display
      if (presentationMode === 'live' && liveDisplayActive) {
        console.log('📺 SaveSlideChanges: Updating live display');
        await sendSlideToLive(updatedSlides[currentSlideIndex], updatedItem, currentSlideIndex);
      }

      setHasUnsavedChanges(false);
      console.log('✅ SaveSlideChanges: Save completed successfully');
    } catch (error) {
      console.error('❌ SaveSlideChanges: Failed to save slide changes:', error);
    }
  };

  const updateSlideProperty = (property: string, value: any) => {
    setSlideProperties(prev => ({
      ...prev,
      [property]: value
    }));
    setHasUnsavedChanges(true);
  };

  // Service item management functions
  const addServiceItem = (item: ServiceItem) => {
    const newItem = {
      ...item,
      id: `${item.type}-${Date.now()}`,
      order: serviceItems.length + 1
    };
    setServiceItems(prev => [...prev, newItem]);
  };

  const removeServiceItem = (itemId: string) => {
    setServiceItems(prev => prev.filter(item => item.id !== itemId));
    // Clear selection if removed item was selected
    if (selectedItem?.id === itemId) {
      setSelectedItem(null);
    }
  };

  const moveServiceItem = (itemId: string, direction: 'up' | 'down') => {
    setServiceItems(prev => {
      const currentIndex = prev.findIndex(item => item.id === itemId);
      if (currentIndex === -1) return prev;

      const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
      if (newIndex < 0 || newIndex >= prev.length) return prev;

      const newItems = [...prev];
      [newItems[currentIndex], newItems[newIndex]] = [newItems[newIndex], newItems[currentIndex]];

      // Update order numbers
      return newItems.map((item, index) => ({
        ...item,
        order: index + 1
      }));
    });
  };

  const quickAddAnnouncement = () => {
    const announcement: ServiceItem = {
      id: `announcement-${Date.now()}`,
      type: 'announcement',
      title: 'New Announcement',
      content: {
        text: 'Announcement text',
        description: ''
      },
      duration: 60,
      order: serviceItems.length + 1
    };
    addServiceItem(announcement);
    generateSlidesForItem(announcement);
  };

  // Session management functions
  const clearAllItems = () => {
    setServiceItems([]);
    setSelectedItem(null);
    setSelectedPlan(null);
  };

  const saveCurrentAsNewPlan = () => {
    if (serviceItems.length === 0) return;

    // This would integrate with plan creation - for now just show notification
    console.log('Save current items as new plan:', serviceItems);
    // TODO: Open plan creation modal with current items
  };

  const currentSlide = selectedItem?.slides?.[currentSlideIndex];

  // Prepare content for EditableSlidePreview - stable reference to prevent loops
  const getPreviewContent = React.useMemo(() => {
    if (editableSlideContent) {
      return editableSlideContent;
    }

    if (currentSlide && selectedItem) {
      return {
        type: 'template-slide' as const,
        title: selectedItem.title,
        content: selectedItem.content,
        slide: currentSlide
      };
    }

    return null;
  }, [editableSlideContent, currentSlide?.id, selectedItem?.id]); // Use IDs for stable comparison

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <div className="bg-card border-b border-border p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <MonitorSpeaker className="w-8 h-8 text-blue-400" />
            <h1 className="text-2xl font-bold">Live Presentation</h1>
          </div>

          {/* Live Display Controls */}
          {window.electronAPI && (
            <div className="flex items-center space-x-4">
              <div className="text-sm text-muted-foreground">
                Live Display: <span className={
                  liveDisplayStatus === 'Active' ? 'text-green-400' :
                  liveDisplayStatus === 'Error' ? 'text-red-400' : 'text-yellow-400'
                }>{liveDisplayStatus}</span>
              </div>
              <div className="flex gap-2">
                {!liveDisplayActive ? (
                  <button
                    onClick={createLiveDisplay}
                    className="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90 flex items-center gap-2"
                  >
                    <Monitor className="w-4 h-4" />
                    Create Live Display
                  </button>
                ) : (
                  <>
                    <button
                      onClick={clearLiveDisplay}
                      className="px-3 py-1 bg-orange-500 text-white rounded text-sm hover:bg-orange-600 border border-orange-600 hover:border-orange-700"
                    >
                      Clear
                    </button>
                    <button
                      onClick={showBlackScreen}
                      className="px-3 py-1 bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900 rounded text-sm hover:bg-gray-800 dark:hover:bg-gray-200 border border-gray-900 dark:border-gray-100"
                    >
                      Black
                    </button>
                    <button
                      onClick={closeLiveDisplay}
                      className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700 border border-red-600 hover:border-red-700"
                    >
                      Close
                    </button>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Keyboard Shortcuts Help */}
      <div className="bg-card border-b border-border px-4 py-2">
        <div className="text-xs text-muted-foreground text-center">
          <span className="font-medium text-foreground">Keyboard Shortcuts:</span>
          <span className="mx-2">Space/Enter/→ Next</span>
          <span className="mx-2">Backspace/← Prev</span>
          <span className="mx-2">F Present</span>
          <span className="mx-2">B Black</span>
          <span className="mx-2">Esc Clear</span>
        </div>
      </div>

      <div className="flex h-[calc(100vh-120px)]">
        {/* Left Panel - Tabs and Content */}
        <div className="w-1/3 bg-card border-r border-border">
          {/* Tab Navigation */}
          <div className="flex border-b border-border">
            {[
              { key: 'plan', label: 'Current Service', icon: Settings },
              { key: 'plans', label: 'Plan Manager', icon: Calendar },
              { key: 'scriptures', label: 'Scripture Library', icon: Eye },
              { key: 'songs', label: 'Song Library', icon: Play }
            ].map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key as any)}
                className={`flex-1 px-4 py-3 text-sm font-medium border-r border-border last:border-r-0 flex items-center justify-center gap-2 ${
                  activeTab === key
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="p-4 h-full overflow-y-auto">
            {activeTab === 'plan' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                      <Play className="w-5 h-5 text-green-400" />
                      Current Service
                    </h3>
                    <p className="text-sm text-muted-foreground">Ready for presentation • Click to preview • Double-click to present live</p>
                    {selectedPlan && (
                      <div className="text-xs text-green-300 mt-1 flex items-center gap-1">
                        <div className="w-1.5 h-1.5 bg-green-400 rounded-full"></div>
                        Loaded from plan: {selectedPlan.name}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">{serviceItems.length} items</span>
                    {serviceItems.length > 0 && (
                      <button
                        onClick={saveCurrentAsNewPlan}
                        className="px-2 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700 transition-colors"
                        title="Save current items as new plan"
                      >
                        💾 Save Plan
                      </button>
                    )}
                    {serviceItems.length > 0 && (
                      <button
                        onClick={clearAllItems}
                        className="px-2 py-1 bg-red-600 text-white rounded text-xs hover:bg-red-700 transition-colors"
                        title="Clear all items"
                      >
                        🗑️ Clear
                      </button>
                    )}
                    <button
                      onClick={quickAddAnnouncement}
                      className="px-2 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700 transition-colors"
                      title="Quick add announcement"
                    >
                      + Announcement
                    </button>
                  </div>
                </div>

                {serviceItems.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-green-800 to-blue-800 rounded-full flex items-center justify-center">
                      <Play className="w-10 h-10 text-white" />
                    </div>
                    <h4 className="text-xl font-bold mb-2 text-foreground">🎯 Ready for Presentation</h4>
                    <p className="text-sm mb-6 text-foreground max-w-md mx-auto">
                      Start by loading a saved plan or adding individual items to build your service presentation
                    </p>
                    <div className="grid grid-cols-1 gap-3 max-w-sm mx-auto">
                      <button
                        onClick={() => setActiveTab('plans')}
                        className="flex items-center justify-center gap-3 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                      >
                        <Calendar className="w-5 h-5" />
                        Load Saved Plan
                      </button>
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          onClick={() => setActiveTab('scriptures')}
                          className="flex items-center justify-center gap-2 px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm"
                        >
                          <span className="text-lg">📖</span>
                          Scripture
                        </button>
                        <button
                          onClick={() => setActiveTab('songs')}
                          className="flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                        >
                          <span className="text-lg">♪</span>
                          Song
                        </button>
                      </div>
                      <button
                        onClick={quickAddAnnouncement}
                        className="flex items-center justify-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                      >
                        <span className="text-lg">📢</span>
                        Add Announcement
                      </button>
                    </div>
                  </div>
                ) : null}

                {serviceItems.map((item, index) => {
                  const isSelected = selectedItem?.id === item.id;
                  const isLoading = isGeneratingSlides && isSelected;
                  const isPresentingThis = isPresenting && isSelected && presentationMode === 'live';

                  return (
                    <div
                      key={item.id}
                      onClick={(e) => handleServiceItemSelect(item, e)}
                      onDoubleClick={(e) => handleServiceItemPresent(item, e)}
                      className={`p-3 rounded-lg border cursor-pointer transition-all duration-200 ${
                        isSelected
                          ? isPresentingThis
                            ? 'border-green-500 bg-green-500/10 dark:bg-green-900/30 shadow-lg'
                            : 'border-primary bg-primary/10 dark:bg-blue-900/30 shadow-md'
                          : 'border-border bg-secondary hover:bg-secondary/80 hover:border-border'
                      } ${isLoading ? 'animate-pulse' : ''}`}
                      title={`Single click to preview • Double click to present live`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <div className="text-xs text-muted-foreground bg-secondary px-2 py-1 rounded">
                              {index + 1}
                            </div>
                            {/* Type icon */}
                            {item.type === 'song' && <div className="text-blue-400">♪</div>}
                            {item.type === 'scripture' && <div className="text-purple-400">📖</div>}
                            {item.type === 'announcement' && <div className="text-yellow-400">📢</div>}
                            {item.type === 'sermon' && <div className="text-green-400">🎯</div>}

                            <div className="font-medium text-white">{item.title}</div>

                            {isLoading && (
                              <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                            )}
                            {isPresentingThis && (
                              <div className="px-2 py-1 bg-green-600 text-white text-xs rounded-full font-medium animate-pulse">
                                LIVE
                              </div>
                            )}
                            {item.planId && (
                              <div className="px-2 py-1 bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300 text-xs rounded border border-purple-300 dark:border-purple-600/30">
                                Plan Item
                              </div>
                            )}
                          </div>

                          <div className="text-sm text-muted-foreground flex items-center gap-2">
                            <span className="capitalize">{item.type}</span>
                            {item.slides && <span>• {item.slides.length} slides</span>}
                            {item.duration && <span>• {item.duration}s</span>}
                            {item.notes && <span>• Has notes</span>}
                          </div>
                        </div>

                        <div className="flex flex-col items-end gap-1">
                          {isSelected && (
                            <div className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary dark:bg-blue-900/50 dark:text-blue-300 border border-primary dark:border-blue-600/30">
                              {presentationMode === 'live' ? 'Live Mode' : 'Preview'}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {activeTab === 'scriptures' && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold mb-4">Select Scripture</h3>
                <BibleSelector
                  onVerseSelect={(verses) => {
                    if (verses.length > 0) {
                      // Create scripture reference from verses
                      const firstVerse = verses[0];
                      const lastVerse = verses[verses.length - 1];
                      let title = `${firstVerse.book} ${firstVerse.chapter}:${firstVerse.verse}`;
                      if (verses.length > 1 && lastVerse.verse !== firstVerse.verse) {
                        title += `-${lastVerse.verse}`;
                      }

                      const scriptureItem: ServiceItem = {
                        id: `scripture-${Date.now()}`,
                        type: 'scripture',
                        title,
                        content: { verses: verses.map(v => ({ ...v, id: v.id || `verse-${v.book}-${v.chapter}-${v.verse}` })) }
                      };
                      generateSlidesForItem(scriptureItem);
                    }
                  }}
                  className="h-full"
                />

                {/* Quick Scripture Selection */}
                <div className="border-t border-border pt-4">
                  <h4 className="text-sm font-medium text-foreground mb-2">Popular Verses</h4>
                  <div className="space-y-2">
                    {[
                      { ref: 'John 3:16', text: 'For God so loved the world...' },
                      { ref: 'Psalm 23:1', text: 'The Lord is my shepherd...' },
                      { ref: 'Romans 3:23', text: 'For all have sinned...' },
                      { ref: 'Romans 6:23', text: 'For the wages of sin...' },
                    ].map((verse, index) => (
                      <button
                        key={index}
                        onClick={() => {
                          // Parse the reference and create scripture item
                          const parts = verse.ref.split(' ');
                          const book = parts[0];
                          const chapterVerse = parts[1].split(':');
                          const chapter = parseInt(chapterVerse[0]);
                          const verseNum = parseInt(chapterVerse[1]);

                          const scriptureItem: ServiceItem = {
                            id: `quick-scripture-${index}`,
                            type: 'scripture',
                            title: verse.ref,
                            content: {
                              verses: [{
                                id: `${book}-${chapter}-${verseNum}`,
                                book,
                                chapter,
                                verse: verseNum,
                                text: verse.text + ' (Sample text - full verse would be loaded from database)',
                                translation: 'KJV'
                              }]
                            }
                          };
                          generateSlidesForItem(scriptureItem);
                        }}
                        className="w-full text-left p-2 rounded border border-border bg-card hover:bg-card/80 text-sm"
                      >
                        <div className="font-medium text-blue-400">{verse.ref}</div>
                        <div className="text-muted-foreground text-xs">{verse.text}</div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'plans' && (
              <div className="space-y-4">
                {/* Saved Plans Section */}
                <div className="bg-card rounded-lg border border-border">
                  <div className="p-4 border-b border-border">
                    <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                      <Settings className="w-5 h-5 text-green-400" />
                      Saved Plans
                    </h3>
                    <p className="text-sm text-muted-foreground">Load a saved presentation plan for this service</p>
                  </div>

                  <div className="p-4">
                    <PlanManager
                      serviceId={undefined} // Remove service dependency
                      onPlanSelect={(plan) => {
                        setSelectedPlan(plan);
                        setCurrentPlanItemIndex(0);

                        // Convert plan items to service items
                        const planServiceItems: ServiceItem[] = plan.planItems.map((planItem: any) => ({
                          id: planItem.id,
                          type: planItem.type as 'scripture' | 'song' | 'announcement',
                          title: planItem.title,
                          content: {
                            // Map content based on type
                            ...(planItem.type === 'song' && planItem.song ? {
                              title: planItem.song.title,
                              artist: planItem.song.artist || planItem.song.artist,
                              lyrics: planItem.song.lyrics || 'Lyrics not available'
                            } : {}),
                            ...(planItem.type === 'scripture' && planItem.scriptureRef ? {
                              scriptureRef: planItem.scriptureRef,
                              verses: [{
                                id: planItem.id,
                                text: 'Sample verse text',
                                book: 'Sample Book',
                                chapter: 1,
                                verse: 1,
                                translation: 'KJV'
                              }]
                            } : {}),
                            ...(planItem.type === 'announcement' ? {
                              text: planItem.title,
                              description: planItem.notes || ''
                            } : {})
                          },
                          duration: planItem.duration,
                          order: planItem.order,
                          notes: planItem.notes,
                          planId: plan.id,
                          planItemId: planItem.id
                        }));

                        setServiceItems(planServiceItems);

                        // Auto-switch to Current Service tab and select first item
                        setActiveTab('plan');
                        if (planServiceItems.length > 0) {
                          generateSlidesForItem(planServiceItems[0]);
                        }
                      }}
                      onPlanCreate={(plan) => {
                        console.log('Plan created:', plan.name);
                        setSelectedPlan(plan);
                      }}
                      onPlanUpdate={(plan) => {
                        console.log('Plan updated:', plan.name);
                        if (selectedPlan?.id === plan.id) {
                          setSelectedPlan(plan);
                        }
                      }}
                      onPlanDelete={(planId) => {
                        console.log('Plan deleted:', planId);
                        if (selectedPlan?.id === planId) {
                          setSelectedPlan(null);
                          setServiceItems([]);
                          setSelectedItem(null);
                        }
                      }}
                      className=""
                    />
                  </div>
                </div>

                {/* Compact Selected Plan Status */}
                {selectedPlan && (
                  <div className="bg-green-100 dark:bg-green-900/20 border border-green-300 dark:border-green-600/30 rounded-lg p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-500 dark:bg-green-400 rounded-full"></div>
                        <span className="text-green-800 dark:text-green-200 text-sm font-medium">Loaded: {selectedPlan.name}</span>
                        <span className="text-green-700 dark:text-green-300 text-xs">({selectedPlan.planItems?.length || 0} items)</span>
                      </div>
                      <button
                        onClick={() => setActiveTab('plan')}
                        className="text-green-700 dark:text-green-300 text-xs hover:text-green-600 dark:hover:text-green-200 underline"
                      >
                        View in Current Service →
                      </button>
                    </div>
                  </div>
                )}

                {/* Quick Actions */}
                <div className="bg-card rounded-lg border border-border p-4">
                  <h4 className="text-sm font-medium text-foreground mb-3">Quick Actions</h4>
                  <div className="grid grid-cols-1 gap-2">
                    <button
                      onClick={() => setActiveTab('scriptures')}
                      className="p-3 bg-secondary rounded-lg text-left hover:bg-secondary/80 transition-colors border border-border hover:border-border"
                    >
                      <div className="flex items-center gap-3">
                        <div className="text-purple-400 text-xl">📖</div>
                        <div>
                          <div className="text-sm font-medium text-white">Add Scripture</div>
                          <div className="text-xs text-muted-foreground">Browse and select Bible verses</div>
                        </div>
                      </div>
                    </button>
                    <button
                      onClick={() => setActiveTab('songs')}
                      className="p-3 bg-secondary rounded-lg text-left hover:bg-secondary/80 transition-colors border border-border hover:border-border"
                    >
                      <div className="flex items-center gap-3">
                        <div className="text-blue-400 text-xl">♪</div>
                        <div>
                          <div className="text-sm font-medium text-white">Add Song</div>
                          <div className="text-xs text-muted-foreground">Browse song library</div>
                        </div>
                      </div>
                    </button>
                    <button
                      onClick={quickAddAnnouncement}
                      className="p-3 bg-secondary rounded-lg text-left hover:bg-secondary/80 transition-colors border border-border hover:border-border"
                    >
                      <div className="flex items-center gap-3">
                        <div className="text-yellow-400 text-xl">📢</div>
                        <div>
                          <div className="text-sm font-medium text-white">Add Announcement</div>
                          <div className="text-xs text-muted-foreground">Create custom announcement</div>
                        </div>
                      </div>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'songs' && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold mb-4">Song Library</h3>
                <SongLibrary
                  songs={sampleSongs}
                  onSongSelect={(song) => {
                    const songItem: ServiceItem = {
                      id: `song-${song.id}`,
                      type: 'song',
                      title: song.title,
                      content: song
                    };
                    generateSlidesForItem(songItem);
                  }}
                  className="h-full"
                />
              </div>
            )}
          </div>
        </div>

        {/* Center Panel - Editable Preview */}
        <div className="flex-1 bg-background p-4">
          <div className="h-full flex flex-col">
            {/* Header with title and controls */}
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Editable Preview</h3>
              <div className="flex items-center gap-4">
                {selectedItem && (
                  <div className="text-sm text-muted-foreground">
                    {selectedItem.title} - Slide {currentSlideIndex + 1} of {selectedItem.slides?.length || 0}
                  </div>
                )}
                <button
                  onClick={() => setShowPropertyPanel(!showPropertyPanel)}
                  className="p-2 bg-secondary text-secondary-foreground rounded hover:bg-secondary/80 flex items-center gap-2"
                  title="Toggle Properties Panel"
                >
                  <Settings className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Property Panel */}
            {showPropertyPanel && (
              <div className="bg-card rounded-lg p-4 mb-4 border border-border">
                <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                  <Palette className="w-4 h-4" />
                  Slide Properties
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  {/* Background Color */}
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1">Background</label>
                    <input
                      type="color"
                      value={slideProperties.backgroundColor}
                      onChange={(e) => updateSlideProperty('backgroundColor', e.target.value)}
                      className="w-full h-8 rounded border border-border bg-input"
                    />
                  </div>

                  {/* Font Size */}
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1">Font Size</label>
                    <input
                      type="range"
                      min="16"
                      max="120"
                      value={slideProperties.fontSize}
                      onChange={(e) => updateSlideProperty('fontSize', parseInt(e.target.value))}
                      className="w-full"
                    />
                    <div className="text-xs text-muted-foreground text-center">{slideProperties.fontSize}px</div>
                  </div>

                  {/* Text Alignment */}
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1">Text Align</label>
                    <div className="flex gap-1">
                      {(['left', 'center', 'right'] as const).map((align) => (
                        <button
                          key={align}
                          onClick={() => updateSlideProperty('textAlign', align)}
                          className={`p-2 rounded ${
                            slideProperties.textAlign === align
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                          }`}
                        >
                          {align === 'left' && <AlignLeft className="w-4 h-4" />}
                          {align === 'center' && <AlignCenter className="w-4 h-4" />}
                          {align === 'right' && <AlignRight className="w-4 h-4" />}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Text Color */}
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1">Text Color</label>
                    <input
                      type="color"
                      value={slideProperties.textColor}
                      onChange={(e) => updateSlideProperty('textColor', e.target.value)}
                      className="w-full h-8 rounded border border-border bg-input"
                    />
                  </div>
                </div>

                {/* Save Button */}
                <div className="flex justify-end mt-4">
                  <button
                    onClick={saveSlideChanges}
                    disabled={!hasUnsavedChanges}
                    className={`px-4 py-2 rounded flex items-center gap-2 ${
                      hasUnsavedChanges
                        ? 'bg-green-600 text-white hover:bg-green-700'
                        : 'bg-secondary text-muted-foreground cursor-not-allowed'
                    }`}
                  >
                    <Save className="w-4 h-4" />
                    {hasUnsavedChanges ? 'Save Changes' : 'No Changes'}
                  </button>
                </div>
              </div>
            )}

            {/* Editable Preview Screen */}
            <div className="flex-1 min-h-0">
              {getPreviewContent ? (
                <div className="h-full flex flex-col">
                  {/* Debug info - remove after testing */}
                  <div className="flex-1 min-h-0">
                    <EditableSlidePreview
                      content={getPreviewContent}
                      width={800}
                      height={450}
                      editable={true}
                      onContentChange={handleSlideContentChange}
                      backgroundColor={slideProperties.backgroundColor}
                      showControls={true}
                      className="h-full"
                    />
                  </div>
                </div>
              ) : (
                <div className="h-full bg-black rounded-lg border border-border flex items-center justify-center">
                  <div className="text-gray-300">
                    Select an item to preview and edit slides
                  </div>
                </div>
              )}
            </div>

            {/* Navigation Controls */}
            {selectedItem?.slides && (
              <div className="space-y-4 mt-4">
                <div className="flex items-center justify-center gap-4">
                  <button
                    onClick={goToPreviousSlide}
                    disabled={currentSlideIndex === 0}
                    className="px-4 py-2 bg-secondary text-secondary-foreground rounded hover:bg-secondary/80 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    <SkipBack className="w-4 h-4" />
                    Previous
                  </button>

                  <button
                    onClick={presentCurrentSlide}
                    disabled={!liveDisplayActive}
                    className={`px-6 py-2 rounded flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed ${
                      presentationMode === 'live'
                        ? 'bg-green-600 text-white hover:bg-green-700'
                        : 'bg-blue-600 text-white hover:bg-blue-700'
                    }`}
                  >
                    <Play className="w-4 h-4" />
                    {presentationMode === 'live' ? 'Update Live' : 'Present Live'}
                  </button>

                  <button
                    onClick={goToNextSlide}
                    disabled={currentSlideIndex >= (selectedItem.slides?.length || 1) - 1}
                    className="px-4 py-2 bg-secondary text-secondary-foreground rounded hover:bg-secondary/80 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    Next
                    <SkipForward className="w-4 h-4" />
                  </button>
                </div>

                {/* Presentation Mode Indicator */}
                <div className="text-center">
                  <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm ${
                    presentationMode === 'live'
                      ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300 border border-green-300 dark:border-green-600'
                      : 'bg-primary/10 text-primary dark:bg-blue-900/50 dark:text-blue-300 border border-primary dark:border-blue-600'
                  }`}>
                    {presentationMode === 'live' ? (
                      <>Live Mode - Changes go directly to display</>
                    ) : (
                      <>Preview Mode - Click 'Present Live' to display</>
                    )}
                  </div>
                </div>

                {/* Unsaved Changes Indicator */}
                {hasUnsavedChanges && (
                  <div className="text-center">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300 border border-yellow-300 dark:border-yellow-600">
                      Unsaved changes - Click save to apply
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Panel - Live Display Preview */}
        <div className="w-1/3 bg-card border-l border-border p-4">
          <div className="h-full flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Live Display</h3>
              <div className={`px-2 py-1 rounded text-xs ${
                liveDisplayActive ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
              }`}>
                {liveDisplayActive ? 'LIVE' : 'OFF'}
              </div>
            </div>

            {/* Live Display Preview */}
            <div className="flex-1 bg-black rounded-lg border border-border flex items-center justify-center relative overflow-hidden">
              {liveDisplayActive && isPresenting && currentSlide ? (
                <div className="w-full h-full relative">
                  {/* Background rendering */}
                  {currentSlide.background && currentSlide.background.type === 'color' && (
                    <div
                      className="absolute inset-0"
                      style={{ backgroundColor: currentSlide.background.value }}
                    />
                  )}

                  {/* Use EditableSlidePreview for consistent rendering */}
                  <EditableSlidePreview
                    content={{
                      type: 'template-slide',
                      title: `${selectedItem?.title} - Slide ${currentSlideIndex + 1}`,
                      slide: currentSlide
                    }}
                    width={300} // Smaller width for right panel
                    height={169} // Maintain 16:9 aspect ratio (300*9/16 = 169)
                    editable={false}
                    showControls={false}
                    backgroundColor={currentSlide.background?.value || '#1a1a1a'}
                    className="w-full h-full"
                  />
                </div>
              ) : (
                <div className="text-muted-foreground text-center">
                  {liveDisplayActive ? 'Ready for presentation' : 'Create live display to see preview'}
                </div>
              )}
            </div>

            {/* Live Status */}
            <div className="mt-4 text-sm text-muted-foreground text-center space-y-2">
              <div>
                {liveDisplayActive ? (
                  isPresenting ? (
                    <span className="text-green-400">Currently presenting: {selectedItem?.title}</span>
                  ) : (
                    'Live display ready'
                  )
                ) : (
                  'Live display not active'
                )}
              </div>
              {selectedItem && (
                <div className="text-xs text-muted-foreground">
                  Slide {currentSlideIndex + 1} of {selectedItem.slides?.length || 0}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LivePresentationPage;