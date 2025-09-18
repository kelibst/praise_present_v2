import React, { useState, useEffect } from 'react';
import { Play, MonitorSpeaker, SkipBack, SkipForward, Settings, Calendar, ChevronLeft, ChevronRight, Maximize2, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// Import drag and drop utilities
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
} from '@dnd-kit/sortable';

// Import resizable panels
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';

// Import template system
import { ScriptureTemplate, SongTemplate, SlideGenerator, Shape } from '../rendering';
import { ensureTemplateManagerReady } from '../rendering/templates/TemplateManager';
import { DEFAULT_SLIDE_SIZE } from '../rendering/templates/templateUtils';

// Import editable preview component
import { EditableSlidePreview } from '../components/EditableSlidePreview';

// Import window components
import { PreviewWindow } from '../components/windows/PreviewWindow';

// Import plan components
import { PlanManager } from '../components/plans/PlanManager';
import { PlanWithItems } from '../types/plan';
import { usePlanIntegration, PlanStats } from '../components/plans/PlanServiceIntegration';

// Import service components
import { SortableServiceItem, ServiceItem } from '../components/service/ServiceItem';

// Import slide components
import { SlidePropertyPanel, SlideProperties } from '../components/slides/SlidePropertyPanel';

// Import live display components
import { useLiveDisplay, LiveDisplayControls } from '../components/live/LiveDisplayManager';

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

interface LivePresentationPageProps {}

export const LivePresentationPage: React.FC<LivePresentationPageProps> = () => {
  // Navigation
  const navigate = useNavigate();

  // State management
  const [activeTab, setActiveTab] = useState<'plan' | 'plans'>('plan');
  const [serviceItems, setServiceItems] = useState<ServiceItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<ServiceItem | null>(null);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [isPresenting, setIsPresenting] = useState(false);
  const [isGeneratingSlides, setIsGeneratingSlides] = useState(false);
  const [presentationMode, setPresentationMode] = useState<'preview' | 'live'>('preview');

  // Live display management
  const {
    liveDisplayActive,
    liveDisplayStatus,
    createLiveDisplay,
    closeLiveDisplay,
    sendSlideToLive,
    clearLiveDisplay,
    showBlackScreen,
  } = useLiveDisplay();

  // Plan integration management
  const { handlePlanSelect, handlePlanCreate } = usePlanIntegration({
    onPlanLoaded: (serviceItems, plan) => {
      setSelectedPlan(plan);
      setServiceItems(serviceItems);

      // Auto-switch to Current Service tab and select first item
      setActiveTab('plan');
      if (serviceItems.length > 0) {
        generateSlidesForItem(serviceItems[0]);
      }
    },
    onPlanCreated: (plan) => {
      console.log('Plan created in LivePresentationPage:', plan.name);
    }
  });

  // Editable slide state
  const [editableSlideContent, setEditableSlideContent] = useState<any>(null);
  const [slideProperties, setSlideProperties] = useState<SlideProperties>({
    backgroundColor: '#1a1a1a',
    fontSize: 48,
    textAlign: 'center',
    fontFamily: 'Arial, sans-serif',
    textColor: '#ffffff'
  });
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showPropertyPanel, setShowPropertyPanel] = useState(false);

  // Plan-related state (simplified)
  const [selectedPlan, setSelectedPlan] = useState<PlanWithItems | null>(null);

  // Panel visibility and layout state
  const [panelVisibility, setPanelVisibility] = useState({
    leftPanel: true,
    middlePanel: true,
    rightPanel: true
  });
  const [panelSizes, setPanelSizes] = useState([30, 45, 25]); // Default sizes as percentages

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // 8px of movement required before drag starts
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

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

  // Initialize with empty service items and check for pending items from other pages
  useEffect(() => {
    setServiceItems([]);

    // Check for pending service items from other pages (like SongsPage)
    const checkPendingItems = () => {
      const pendingItems = localStorage.getItem('pendingServiceItems');
      if (pendingItems) {
        try {
          const items = JSON.parse(pendingItems);
          if (Array.isArray(items) && items.length > 0) {
            setServiceItems(prev => [...prev, ...items]);
            localStorage.removeItem('pendingServiceItems'); // Clear after loading

            // Auto-select the first added item
            if (items.length > 0) {
              generateSlidesForItem(items[0]);
            }
          }
        } catch (error) {
          console.error('Error loading pending service items:', error);
          localStorage.removeItem('pendingServiceItems'); // Clear invalid data
        }
      }
    };

    checkPendingItems();

    // Set up listener for storage events (when SongsPage adds items)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'pendingServiceItems' && e.newValue) {
        checkPendingItems();
      }
    };

    window.addEventListener('storage', handleStorageChange);

    // Also check periodically in case storage events don't work (same-window updates)
    const interval = setInterval(checkPendingItems, 1000);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
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


  // Generate slides for selected item
  const generateSlidesForItem = async (item: ServiceItem, autoPresent = false) => {
    if (isGeneratingSlides) return; // Prevent multiple concurrent generations

    try {
      setIsGeneratingSlides(true);
      let slides: Slide[] = [];

      if (item.type === 'scripture' && item.content.verses) {
        const scriptureTemplate = new ScriptureTemplate(DEFAULT_SLIDE_SIZE);

        // Group consecutive verses into single slides for better readability
        const groupedVerses = groupConsecutiveVerses(item.content.verses);

        for (const group of groupedVerses) {
          if (group.length === 1) {
            // Single verse slide
            const verse = group[0];
            const scriptureContent = {
              verse: verse.text || 'Loading verse...',
              reference: `${verse.book} ${verse.chapter}:${verse.verse}`,
              translation: verse.translation || 'KJV',
              book: verse.book,
              chapter: verse.chapter,
              verseNumber: verse.verse,
              theme: 'reading' as const,
              showTranslation: true,
              emphasizeReference: true
            };

            const shapes = scriptureTemplate.generateSlide(scriptureContent);
            slides.push({
              id: `scripture-${verse.id || Date.now()}`,
              shapes: shapes,
              background: { type: 'color', value: '#1a1a1a' }
            });
          } else {
            // Multiple consecutive verses on one slide
            const firstVerse = group[0];
            const lastVerse = group[group.length - 1];
            const combinedText = group.map(v => `${v.verse} ${v.text}`).join(' ');

            const scriptureContent = {
              verse: combinedText,
              reference: `${firstVerse.book} ${firstVerse.chapter}:${firstVerse.verse}-${lastVerse.verse}`,
              translation: firstVerse.translation || 'KJV',
              book: firstVerse.book,
              chapter: firstVerse.chapter,
              verseNumber: firstVerse.verse,
              theme: 'reading' as const,
              showTranslation: true,
              emphasizeReference: true
            };

            const shapes = scriptureTemplate.generateSlide(scriptureContent);
            slides.push({
              id: `scripture-group-${firstVerse.id}-${lastVerse.id}`,
              shapes: shapes,
              background: { type: 'color', value: '#1a1a1a' }
            });
          }
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


  // Handle drag end for service item reordering
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      return;
    }

    setServiceItems((items) => {
      const oldIndex = items.findIndex((item) => item.id === active.id);
      const newIndex = items.findIndex((item) => item.id === over.id);

      const reorderedItems = arrayMove(items, oldIndex, newIndex);

      // Update order numbers
      return reorderedItems.map((item, index) => ({
        ...item,
        order: index + 1
      }));
    });
  };

  // Panel management functions
  const togglePanel = (panel: 'leftPanel' | 'middlePanel' | 'rightPanel') => {
    setPanelVisibility(prev => {
      const newVisibility = {
        ...prev,
        [panel]: !prev[panel]
      };
      // Save to localStorage
      localStorage.setItem('live-presentation-panel-visibility', JSON.stringify(newVisibility));
      return newVisibility;
    });
  };

  const handlePanelResize = (sizes: number[]) => {
    setPanelSizes(sizes);
    // Save to localStorage for persistence
    localStorage.setItem('live-presentation-panel-sizes', JSON.stringify(sizes));
  };

  // Load saved panel sizes and visibility on mount
  useEffect(() => {
    // Load panel sizes
    const savedSizes = localStorage.getItem('live-presentation-panel-sizes');
    if (savedSizes) {
      try {
        const parsedSizes = JSON.parse(savedSizes);
        if (Array.isArray(parsedSizes) && parsedSizes.length === 3) {
          setPanelSizes(parsedSizes);
        }
      } catch (error) {
        console.warn('Failed to parse saved panel sizes:', error);
      }
    }

    // Load panel visibility
    const savedVisibility = localStorage.getItem('live-presentation-panel-visibility');
    if (savedVisibility) {
      try {
        const parsedVisibility = JSON.parse(savedVisibility);
        if (parsedVisibility && typeof parsedVisibility === 'object') {
          setPanelVisibility(prev => ({
            ...prev,
            ...parsedVisibility
          }));
        }
      } catch (error) {
        console.warn('Failed to parse saved panel visibility:', error);
      }
    }
  }, []);

  // Keyboard shortcuts for panel toggles
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Check if Ctrl is pressed and prevent default browser shortcuts
      if (event.ctrlKey) {
        switch (event.key) {
          case '1':
            event.preventDefault();
            togglePanel('leftPanel');
            break;
          case '2':
            event.preventDefault();
            togglePanel('middlePanel');
            break;
          case '3':
            event.preventDefault();
            togglePanel('rightPanel');
            break;
          default:
            break;
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

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
            <LiveDisplayControls
              liveDisplayActive={liveDisplayActive}
              liveDisplayStatus={liveDisplayStatus}
              onCreateDisplay={createLiveDisplay}
              onCloseDisplay={closeLiveDisplay}
              onClearDisplay={clearLiveDisplay}
              onShowBlack={showBlackScreen}
            />
          )}
        </div>
      </div>

      {/* Keyboard Shortcuts Help & Panel Controls */}
      <div className="bg-card border-b border-border px-4 py-2">
        <div className="flex items-center justify-between">
          <div className="text-xs text-muted-foreground">
            <span className="font-medium text-foreground">Keyboard Shortcuts:</span>
            <span className="mx-2">Space/Enter/→ Next</span>
            <span className="mx-2">Backspace/← Prev</span>
            <span className="mx-2">F Present</span>
            <span className="mx-2">B Black</span>
            <span className="mx-2">Esc Clear</span>
            <span className="mx-2 text-primary">Ctrl+1/2/3 Toggle Panels</span>
          </div>

          {/* Panel Toggle Buttons (when collapsed) */}
          <div className="flex items-center gap-1">
            {!panelVisibility.leftPanel && (
              <button
                onClick={() => togglePanel('leftPanel')}
                className="p-1 rounded hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                title="Show left panel"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
            {!panelVisibility.middlePanel && (
              <button
                onClick={() => togglePanel('middlePanel')}
                className="p-1 rounded hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                title="Show middle panel"
              >
                <Maximize2 className="w-4 h-4" />
              </button>
            )}
            {!panelVisibility.rightPanel && (
              <button
                onClick={() => togglePanel('rightPanel')}
                className="p-1 rounded hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                title="Show right panel"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      <PanelGroup
        direction="horizontal"
        autoSaveId="live-presentation-layout"
        onLayout={handlePanelResize}
        className="h-[calc(100vh-120px)]"
      >
        {/* Left Panel - Tabs and Content */}
        {panelVisibility.leftPanel && (
          <Panel defaultSize={panelSizes[0]} minSize={20} maxSize={50}>
            <div className="bg-card border-r border-border h-full transition-all duration-300 ease-in-out animate-in slide-in-from-left-5">
          {/* Panel Header with Collapse Button */}
          <div className="flex items-center justify-between px-2 py-2 border-b border-border bg-secondary/50">
            <div className="text-sm font-medium text-foreground">Content Library</div>
            <button
              onClick={() => togglePanel('leftPanel')}
              className="p-1 rounded hover:bg-muted transition-colors"
              title="Collapse left panel"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>

          {/* Tab Navigation */}
          <div className="flex border-b border-border">
            {[
              { key: 'plan', label: 'Current Service', icon: Settings },
              { key: 'plans', label: 'Plan Manager', icon: Calendar }
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
                      onClick={() => navigate('/songs')}
                      className="px-2 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700 transition-colors flex items-center gap-1"
                      title="Go to song library"
                    >
                      ♪ Songs
                      <ExternalLink className="w-3 h-3" />
                    </button>
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
                          onClick={() => navigate('/scripture')}
                          className="flex items-center justify-center gap-2 px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm"
                        >
                          <span className="text-lg">📖</span>
                          Scripture
                        </button>
                        <button
                          onClick={() => navigate('/songs')}
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

                <DndContext
                  sensors={sensors}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext items={serviceItems.map(item => item.id)}>
                    {serviceItems.map((item, index) => {
                      const isSelected = selectedItem?.id === item.id;
                      const isLoading = isGeneratingSlides && isSelected;
                      const isPresentingThis = isPresenting && isSelected && presentationMode === 'live';

                      return (
                        <SortableServiceItem
                          key={item.id}
                          item={item}
                          index={index}
                          isSelected={isSelected}
                          isLoading={isLoading}
                          isPresentingThis={isPresentingThis}
                          onSelect={handleServiceItemSelect}
                          onPresent={handleServiceItemPresent}
                        />
                      );
                    })}
                  </SortableContext>
                </DndContext>
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
                      onPlanSelect={handlePlanSelect}
                      onPlanCreate={(plan) => {
                        handlePlanCreate(plan);
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

                    {/* Plan Statistics */}
                    <PlanStats plan={selectedPlan} serviceItems={serviceItems} />
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
                      onClick={() => navigate('/scripture')}
                      className="p-3 bg-secondary rounded-lg text-left hover:bg-secondary/80 transition-colors border border-border hover:border-border"
                    >
                      <div className="flex items-center gap-3">
                        <div className="text-purple-400 text-xl">📖</div>
                        <div>
                          <div className="text-sm font-medium text-white flex items-center gap-2">
                            Add Scripture
                            <ExternalLink className="w-3 h-3" />
                          </div>
                          <div className="text-xs text-muted-foreground">Browse and select Bible verses</div>
                        </div>
                      </div>
                    </button>
                    <button
                      onClick={() => navigate('/songs')}
                      className="p-3 bg-secondary rounded-lg text-left hover:bg-secondary/80 transition-colors border border-border hover:border-border"
                    >
                      <div className="flex items-center gap-3">
                        <div className="text-blue-400 text-xl">♪</div>
                        <div>
                          <div className="text-sm font-medium text-white flex items-center gap-2">
                            Add Song
                            <ExternalLink className="w-3 h-3" />
                          </div>
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

          </div>
            </div>
          </Panel>
        )}

        {panelVisibility.leftPanel && (
          <PanelResizeHandle className="w-2 bg-border hover:bg-primary/50 transition-all duration-200 group relative">
            <div className="absolute inset-y-0 left-0 w-full bg-gradient-to-r from-transparent via-primary/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              <div className="w-1 h-8 bg-primary/60 rounded-full" />
            </div>
          </PanelResizeHandle>
        )}

        {/* Center Panel - Preview Window */}
        {panelVisibility.middlePanel && (
          <Panel defaultSize={panelSizes[1]} minSize={30}>
            <div className="bg-background h-full transition-all duration-300 ease-in-out animate-in fade-in-0 zoom-in-95">
              <div className="h-full flex flex-col">
                {/* Property Panel (when shown) */}
                {showPropertyPanel && (
                  <div className="border-b border-border p-3">
                    <SlidePropertyPanel
                      properties={slideProperties}
                      hasUnsavedChanges={hasUnsavedChanges}
                      onPropertyChange={updateSlideProperty}
                      onSave={saveSlideChanges}
                    />
                  </div>
                )}

                {/* Preview Window */}
                <div className="flex-1 min-h-0">
                  <PreviewWindow
                    title={selectedItem ? `${selectedItem.title} - Slide ${currentSlideIndex + 1}/${selectedItem.slides?.length || 0}` : "Preview Window"}
                    type="preview"
                    showControls={true}
                    contentResolution={{ width: 1920, height: 1080 }}
                    renderResolution={{ width: 1920, height: 1080 }}
                    isEditable={true}
                    connectionStatus="connected"
                    onToggleControls={() => setShowPropertyPanel(!showPropertyPanel)}
                    className="h-full"
                  >
                    {getPreviewContent ? (
                      <EditableSlidePreview
                        content={getPreviewContent}
                        width={0} // Let PreviewWindow handle sizing
                        height={0} // Let PreviewWindow handle sizing
                        editable={true}
                        onContentChange={handleSlideContentChange}
                        backgroundColor={slideProperties.backgroundColor}
                        showControls={false} // PreviewWindow provides controls
                        className="w-full h-full"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        <div className="text-center">
                          <div className="text-4xl mb-2">🎯</div>
                          <div>Select an item to preview</div>
                        </div>
                      </div>
                    )}
                  </PreviewWindow>
                </div>

                {/* Navigation Controls */}
                {selectedItem?.slides && (
                  <div className="border-t border-border bg-card p-3">
                    <div className="flex items-center justify-center gap-4 mb-3">
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

                    {/* Status Indicators */}
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <div className={`flex items-center gap-2 ${
                        presentationMode === 'live' ? 'text-green-400' : 'text-blue-400'
                      }`}>
                        <div className={`w-2 h-2 rounded-full ${
                          presentationMode === 'live' ? 'bg-green-400' : 'bg-blue-400'
                        } animate-pulse`} />
                        {presentationMode === 'live' ? 'LIVE MODE' : 'PREVIEW MODE'}
                      </div>

                      {hasUnsavedChanges && (
                        <div className="flex items-center gap-2 text-yellow-400">
                          <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse" />
                          UNSAVED CHANGES
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </Panel>
        )}

        {panelVisibility.middlePanel && (
          <PanelResizeHandle className="w-2 bg-border hover:bg-primary/50 transition-all duration-200 group relative">
            <div className="absolute inset-y-0 left-0 w-full bg-gradient-to-r from-transparent via-primary/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              <div className="w-1 h-8 bg-primary/60 rounded-full" />
            </div>
          </PanelResizeHandle>
        )}

        {/* Right Panel - Live Display Monitor */}
        {panelVisibility.rightPanel && (
          <Panel defaultSize={panelSizes[2]} minSize={20} maxSize={40}>
            <div className="bg-background h-full transition-all duration-300 ease-in-out animate-in slide-in-from-right-5">
              <PreviewWindow
                title="Live Display Monitor"
                type="live-display"
                showControls={true}
                contentResolution={{ width: 1920, height: 1080 }}
                renderResolution={{ width: 1920, height: 1080 }}
                isLiveActive={liveDisplayActive}
                connectionStatus={liveDisplayActive ? "connected" : "disconnected"}
                className="h-full"
              >
                {liveDisplayActive && isPresenting && currentSlide ? (
                  <EditableSlidePreview
                    content={{
                      type: 'template-slide',
                      title: `${selectedItem?.title} - Slide ${currentSlideIndex + 1}`,
                      slide: currentSlide
                    }}
                    width={0} // Let PreviewWindow handle sizing
                    height={0} // Let PreviewWindow handle sizing
                    editable={false}
                    showControls={false}
                    backgroundColor={currentSlide.background?.value || '#1a1a1a'}
                    className="w-full h-full"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    <div className="text-center">
                      {liveDisplayActive ? (
                        <>
                          <div className="text-4xl mb-2">📺</div>
                          <div className="text-sm">Ready for presentation</div>
                          <div className="text-xs mt-1 text-gray-500">Click "Present Live" to display content</div>
                        </>
                      ) : (
                        <>
                          <div className="text-4xl mb-2 opacity-50">📺</div>
                          <div className="text-sm">Live Display Off</div>
                          <div className="text-xs mt-1 text-gray-500">Create live display to see preview</div>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </PreviewWindow>
            </div>
          </Panel>
        )}
      </PanelGroup>
    </div>
  );
};

// Helper function to group consecutive verses for better slide layout
const groupConsecutiveVerses = (verses: any[]): any[][] => {
  if (!verses || verses.length === 0) return [];

  // Sort verses by verse number
  const sortedVerses = [...verses].sort((a, b) => a.verse - b.verse);

  const groups: any[][] = [];
  let currentGroup: any[] = [sortedVerses[0]];

  for (let i = 1; i < sortedVerses.length; i++) {
    const prevVerse = sortedVerses[i - 1];
    const currentVerse = sortedVerses[i];

    // If verses are consecutive and from the same chapter, add to current group
    if (
      currentVerse.verse === prevVerse.verse + 1 &&
      currentVerse.chapter === prevVerse.chapter &&
      currentVerse.book === prevVerse.book
    ) {
      currentGroup.push(currentVerse);
    } else {
      // Start new group
      groups.push(currentGroup);
      currentGroup = [currentVerse];
    }
  }

  // Add the last group
  groups.push(currentGroup);

  return groups;
};

export default LivePresentationPage;