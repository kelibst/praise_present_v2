import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Play, MonitorSpeaker, SkipBack, SkipForward, Settings, Calendar, ChevronLeft, ChevronRight, ChevronUp, ChevronDown, Maximize2, ExternalLink, BookOpen, Music, FileText, Mic } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  selectServiceItems,
  updateServiceItem,
  updateServiceItemSlides,
  addServiceItem as addServiceItemAction,
  reorderServiceItems,
  clearServiceItems,
  setServiceItems
} from '../lib/serviceItemsSlice';
import { RootState, AppDispatch } from '../lib/store';

// Unified presentation system
import {
  PresentationState,
  PresentationItem,
  ContentLibrary,
  INITIAL_PRESENTATION_STATE,
  INITIAL_CONTENT_LIBRARY
} from '../types/presentation';
// Legacy utils - keeping only for any remaining compatibility needs
import {
  serviceItemToPresentationItem
} from '../lib/presentationUtils';

// Redux Presentation Management
import { usePresentation } from '../hooks/usePresentation';
import { useUI } from '../hooks/useUI';
import {
  buildScriptureContent,
  buildSongContent,
  buildAnnouncementContent,
  serviceItemToContent
} from '../lib/contentBuilders';
import type { ActiveTab } from '../lib/presentationSlice';
import { updateSlide } from '../lib/presentationSlice';

// Import scripture navigation Redux slice
import {
  setScriptureSelection,
  navigateToPreviousSlide,
  navigateToNextSlide,
  navigateToPreviousVerse,
  navigateToNextVerse,
  navigateToPreviousChapter,
  navigateToNextChapter,
  setNavigationMode,
  setCurrentGroupIndex,
  selectScriptureNavigation,
  selectCanNavigate
} from '../lib/scriptureNavigationSlice';

// Import plan execution Redux slice
import { selectIsExecuting } from '../lib/planExecutionSlice';

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
import { ScriptureTemplate, SongTemplate, AnnouncementTemplate, SlideGenerator, Shape } from '../rendering';
import { ensureTemplateManagerReady } from '../rendering/templates/TemplateManager';
import { DEFAULT_SLIDE_SIZE } from '../rendering/templates/templateUtils';

// Import new slide components (PowerPoint pattern)
import { SlideEditor, SlideViewer, SlideEditorWithToolbar, Slide as NewSlide } from '../components/slides';

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

// Import Bible selectors
import BibleSelector from '../components/bible/BibleSelector';
import BibleBrowseSelector from '../components/bible/BibleBrowseSelector';
import { ScriptureVerse } from '../lib/services/bibleService';

// Import inline media selectors
import {
  InlineSongSelector,
  InlineScriptureSelector,
  InlinePresentationSelector,
  InlineAnnouncementEditor
} from '../components/plans/InlineMediaSelectors';

// Import execution components
import { LivePlanControls } from '../components/plans/LivePlanControls';

// Import plan management components
import { TemplateLibrary } from '../components/plans/TemplateLibrary';
import { PlanSearch } from '../components/plans/PlanSearch';
import { NextItemPreview } from '../components/plans/NextItemPreview';

// Import scripture navigation service
import { scriptureNavigationService, NavigatedVerse, VerseGroup } from '../lib/services/scriptureNavigationService';

// Import settings modal
import { FeatureSettingsModal } from '../components/settings/FeatureSettingsModal';
import { useFeatureSettings } from '../hooks/useFeatureSettings';

// Use the new Slide interface from SlideRenderer
interface Slide extends NewSlide {
  duration?: number;
  verseNumbers?: number[]; // Track which verse(s) are displayed on this slide
  verseIds?: string[]; // Track verse IDs for better identification
}

interface LivePresentationPageProps {}

// PERFORMANCE OPTIMIZATION: Shape cache to avoid regenerating identical slides
// Cache key format: "itemType-verseIds-background-settings"
const shapeCache = new Map<string, Shape[]>();
const MAX_CACHE_SIZE = 100; // Limit cache size to prevent memory issues

/**
 * Generate cache key for shape caching
 * Only regenerate shapes if content or styling actually changed
 */
const generateShapeCacheKey = (
  itemType: string,
  content: string,
  backgroundType: string,
  backgroundValue: string,
  settings: any
): string => {
  // Create a stable key based on actual content, not object references
  return `${itemType}:${content}:${backgroundType}:${backgroundValue}:${JSON.stringify(settings)}`;
};

export const LivePresentationPage: React.FC<LivePresentationPageProps> = () => {
  // Navigation
  const navigate = useNavigate();

  // Redux hooks
  const dispatch = useDispatch<AppDispatch>();
  const serviceItems = useSelector(selectServiceItems);

  // Scripture navigation Redux state
  const scriptureNav = useSelector(selectScriptureNavigation);
  const canNavigate = useSelector(selectCanNavigate);

  // Plan execution Redux state
  const isExecutingService = useSelector(selectIsExecuting);

  // ============================================
  // NEW: CENTRALIZED PRESENTATION MANAGER
  // ============================================
  // Redux Presentation Hook
  const presentation = usePresentation();
  const hasAutoSwitchedRef = useRef(false);
  const ui = useUI();

  // Local-only state (things that don't need Redux)
  const [navigationFieldsPopulated, setNavigationFieldsPopulated] = useState<boolean | null>(null);

  // Legacy compatibility - Keep selectedItem in sync with Redux presentation state
  const selectedItem = useMemo(() => presentation.current.content ? {
    id: presentation.current.content.id,
    type: presentation.current.content.type as any,
    title: presentation.current.content.title,
    content: presentation.current.content.metadata,
    slides: presentation.current.content.slides as any[],
    order: 0
  } : null, [presentation.current.content]);

  const currentSlideIndex = presentation.slideIndex;
  const presentationMode = presentation.isLive ? 'live' : 'preview';
  const isPresenting = presentation.isLive;

  // Feature settings hook
  const { scriptureSettings, songSettings } = useFeatureSettings();

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

  // Refs for auto-scrolling
  const thumbnailsContainerRef = useRef<HTMLDivElement>(null);
  const thumbnailRefs = useRef<(HTMLButtonElement | null)[]>([]);

  // Plan integration management
  const { handlePlanSelect, handlePlanCreate } = usePlanIntegration({
    onPlanLoaded: (items, plan) => {
      setSelectedPlan(plan);
      dispatch(setServiceItems(items));
      ui.clearLoading();

      // Auto-switch to Current Service tab and select first item
      ui.setActiveTab('plan');
      if (items.length > 0) {
        generateSlidesForItem(items[0]);
      }
    },
    onPlanCreated: (plan) => {
      console.log('Plan created in LivePresentationPage:', plan.name);
    }
  });

  // Wrap handlePlanSelect to add loading state and error handling
  const handlePlanSelectWithLoading = async (plan: any) => {
    ui.setLoading({ type: "loading-plan", planId: plan.id });

    try {
      await handlePlanSelect(plan);
    } catch (error) {
      console.error('Error loading plan:', error);
      ui.setLoading({ type: "loading-plan", planId: plan.id, error: error instanceof Error ? error.message : 'Failed to load plan content' });
    }
  };

  // Slide properties (kept for property panel)
  const [slideProperties, setSlideProperties] = useState<SlideProperties>({
    backgroundColor: '#1a1a1a',
    fontSize: 48,
    textAlign: 'center',
    fontFamily: 'Arial, sans-serif',
    textColor: '#ffffff'
  });
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

  // Check navigation fields on mount
  useEffect(() => {
    const checkNavigationFields = async () => {
      if (window.electronAPI) {
        try {
          const result = await window.electronAPI.invoke('db:checkNavigationFields');
          console.log('Navigation fields check:', result);
          setNavigationFieldsPopulated(result.isPopulated);

          // Auto-populate if not populated and verses exist
          if (!result.isPopulated && result.totalVerses > 0) {
            console.log('Navigation fields not populated, showing notification...');
          }
        } catch (error) {
          console.error('Error checking navigation fields:', error);
        }
      }
    };

    checkNavigationFields();
  }, []);

  // Initialize and check for pending items from other pages
  useEffect(() => {
    // Check for pending service items from other pages (like SongsPage)
    const checkPendingItems = () => {
      const pendingItems = localStorage.getItem('pendingServiceItems');
      if (pendingItems) {
        try {
          const items = JSON.parse(pendingItems);
          if (Array.isArray(items) && items.length > 0) {
            // Add pending items to Redux store
            items.forEach((item: ServiceItem) => {
              dispatch(addServiceItemAction(item));
            });
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

  // NOTE: Pending songs are now managed through Redux (uiSlice)
  // Other pages can dispatch ui.addPendingSong(song) and it will appear here instantly
  // No more localStorage polling needed!

  // ============================================
  // TAB SWITCHING - Smart tab switching with content restoration
  // ============================================
  const prevTabRef = useRef<ActiveTab>(ui.activeTab);

  useEffect(() => {
    const prevTab = prevTabRef.current;

    // Only process if tab actually changed
    if (prevTab !== ui.activeTab) {
      console.log(`🔄 Tab Switch: ${prevTab} → ${ui.activeTab}`);

      // Use smart tab switching from presentationSlice
      // This will save current tab state and restore target tab automatically
      presentation.switchTab(prevTab, ui.activeTab);

      // Update the ref
      prevTabRef.current = ui.activeTab;
    }
  }, [ui.activeTab, presentation]);

  // Initialize service for plan functionality
  useEffect(() => {
    const initializeService = async () => {
      try {
        ui.setLoading({ type: "initializing-service" });

        // Check if there's a stored current service ID
        const storedServiceId = localStorage.getItem('ui.currentServiceId');

        if (storedServiceId && window.electronAPI) {
          // Verify the stored service still exists
          try {
            const service = await window.electronAPI.invoke('db:getService', storedServiceId);
            if (service) {
              ui.setCurrentServiceId(storedServiceId);
              console.log('✅ Using existing service:', service.name);
              return;
            }
          } catch (error) {
            console.warn('Stored service no longer exists, creating new one');
            localStorage.removeItem('ui.currentServiceId');
          }
        }

        // Create or get default service for live presentation
        if (window.electronAPI) {
          try {
            // Try to get an existing default service
            const services = await window.electronAPI.invoke('db:getServices', 50);
            let defaultService = services.find((s: any) => s.name === 'Live Presentation Service');

            if (!defaultService) {
              // Create default service
              defaultService = await window.electronAPI.invoke('db:createService', {
                name: 'Live Presentation Service',
                description: 'Default service for live presentation plans',
                date: new Date().toISOString(),
                startTime: '10:00',
                endTime: '11:30'
              });
              console.log('📝 Created default service for live presentation');
            }

            ui.setCurrentServiceId(defaultService.id);
            localStorage.setItem('ui.currentServiceId', defaultService.id);
            console.log('✅ Initialized service:', defaultService.name);

          } catch (error) {
            console.error('Failed to initialize service:', error);
            // Continue without service - plan manager will show appropriate message
          }
        }
      } catch (error) {
        console.error('Error initializing service:', error);
      } finally {
        ui.clearLoading();
      }
    };

    initializeService();
  }, []);

  /**
   * Parse song lyrics into structured sections (verse, chorus, bridge, etc.)
   * Supports both marked sections [Verse 1], [Chorus] and unmarked lyrics
   */
  interface SongSection {
    type: 'verse' | 'chorus' | 'bridge' | 'pre-chorus' | 'outro' | 'intro';
    number?: number;
    lyrics: string;
  }

  const parseSongLyrics = (lyrics: string): SongSection[] => {
    const sections: SongSection[] = [];

    // Ensure lyrics is a string and not empty
    if (!lyrics || typeof lyrics !== 'string') {
      return [{
        type: 'verse',
        number: 1,
        lyrics: 'No lyrics available'
      }];
    }

    // Section marker patterns: [Verse 1], [Chorus], [Bridge], etc.
    const sectionMarkerRegex = /\[(Verse|Chorus|Bridge|Pre-Chorus|Outro|Intro)(\s+\d+)?\]/gi;

    // Split by section markers
    const parts = lyrics.split(sectionMarkerRegex);

    if (parts.length > 1) {
      // Has section markers
      for (let i = 1; i < parts.length; i += 3) {
        const sectionType = parts[i].toLowerCase().replace('-', '-') as SongSection['type'];
        const sectionNumber = parts[i + 1] ? parseInt(parts[i + 1].trim()) : undefined;
        const sectionLyrics = parts[i + 2]?.trim() || '';

        if (sectionLyrics) {
          sections.push({
            type: sectionType,
            number: sectionNumber,
            lyrics: sectionLyrics
          });
        }
      }
    } else {
      // No markers - split by double newlines (paragraph breaks)
      const paragraphs = lyrics.split(/\n\s*\n/).filter(p => p.trim());

      if (paragraphs.length === 0) {
        // Single block of lyrics - treat as one verse
        sections.push({
          type: 'verse',
          number: 1,
          lyrics: lyrics.trim()
        });
      } else {
        // Multiple paragraphs - alternate verse/chorus pattern
        paragraphs.forEach((paragraph, index) => {
          sections.push({
            type: index === 0 ? 'verse' : (index % 2 === 0 ? 'verse' : 'chorus'),
            number: index === 0 ? 1 : (index % 2 === 0 ? Math.ceil(index / 2) + 1 : undefined),
            lyrics: paragraph.trim()
          });
        });
      }
    }

    return sections;
  };

  // Generate slides for selected item
  const generateSlidesForItem = async (item: ServiceItem, autoPresent = false) => {
    if (ui.isGeneratingSlides) return; // Prevent multiple concurrent generations

    // IMPORTANT: If this item already has slides, use them instead of regenerating
    // This preserves user customizations (background colors, shape sizes/positions, etc.)
    if (item.slides && item.slides.length > 0) {
      console.log('📋 Using existing slides for item (preserving customizations):', {
        itemId: item.id,
        slideCount: item.slides.length
      });

      // Auto-present if requested
      if (autoPresent && item.slides[0] && liveDisplayActive) {
        await sendSlideToLive(item.slides[0], item, 0);
      }

      console.log('✅ Scripture preview generated/updated');
      return;
    }

    try {
      ui.setLoading({ type: "generating-slides", itemId: item.id });
      let slides: Slide[] = [];

      if (item.type === 'scripture' && item.content.verses) {
        const scriptureTemplate = new ScriptureTemplate(DEFAULT_SLIDE_SIZE);

        // Use navigation service to group consecutive verses efficiently
        const groupedVerses = scriptureNavigationService.groupConsecutiveVerses(
          item.content.verses as NavigatedVerse[]
        );

        for (const group of groupedVerses) {
          // VerseGroup structure: { verses, reference, isConsecutive }
          const verses = group.verses;
          const preFormattedReference = group.reference;

          if (verses.length === 1) {
            // Single Verse slide
            const verse = verses[0];
            const scriptureContent = {
              verse: verse.text || 'Loading...',
              reference: `${verse.book} ${verse.chapter}:${verse.verse}`,
              translation: verse.translation || 'KJV',
              book: verse.book,
              chapter: verse.chapter,
              verseNumber: verse.verse,
              theme: 'reading' as const,
              showTranslation: true,
              emphasizeReference: true,
              // Pass feature settings to template
              featureSettings: {
                background: scriptureSettings.background,
                typography: scriptureSettings.typography
              }
            };

            console.log('🎨 Generating slide with scripture settings:', {
              referenceFontSize: scriptureSettings.typography.referenceFontSize,
              textColor: scriptureSettings.typography.textColor,
              bold: scriptureSettings.typography.bold,
              italic: scriptureSettings.typography.italic
            });

            // PERFORMANCE OPTIMIZATION: Check cache before generating shapes
            const cacheKey = generateShapeCacheKey(
              'scripture-single',
              verse.text || '',
              scriptureSettings.background.type,
              scriptureSettings.background.value || '',
              scriptureSettings.typography
            );

            let shapes: Shape[];
            if (shapeCache.has(cacheKey)) {
              console.log('✅ Using cached shapes for verse:', verse.verse);
              shapes = shapeCache.get(cacheKey)!;
            } else {
              console.log('🔨 Generating new shapes for verse:', verse.verse);
              shapes = scriptureTemplate.generateSlide(scriptureContent);

              // Add to cache with LRU eviction
              if (shapeCache.size >= MAX_CACHE_SIZE) {
                const firstKey = shapeCache.keys().next().value;
                if (firstKey) shapeCache.delete(firstKey);
              }
              shapeCache.set(cacheKey, shapes);
            }

            // Convert SlideBackground to Slide background format
            // IMPORTANT: Maintain gradient structure with start/end/direction, not comma-separated string
            const slideBackground = scriptureSettings.background.type === 'gradient' && scriptureSettings.background.gradient
              ? {
                  type: 'gradient' as const,
                  gradient: {
                    start: scriptureSettings.background.gradient.start,
                    end: scriptureSettings.background.gradient.end,
                    direction: scriptureSettings.background.gradient.direction
                  },
                  opacity: scriptureSettings.background.opacity
                }
              : {
                  type: scriptureSettings.background.type as 'color' | 'image',
                  value: scriptureSettings.background.value || '#1a1a1a',
                  opacity: scriptureSettings.background.opacity
                };

            slides.push({
              id: `scripture-${verse.id || Date.now()}`,
              shapes: shapes,
              background: slideBackground,
              verseNumbers: [verse.verse],
              verseIds: [verse.id]
            });
          } else {
            // Multiple consecutive verses on one slide
            const firstVerse = verses[0];
            const lastVerse = verses[verses.length - 1];
            const combinedText = verses.map(v => `${v.verse} ${v.text}`).join(' ');

            const scriptureContent = {
              verse: combinedText,
              reference: `${firstVerse.book} ${firstVerse.chapter}:${firstVerse.verse}-${lastVerse.verse}`,
              translation: firstVerse.translation || 'KJV',
              book: firstVerse.book,
              chapter: firstVerse.chapter,
              verseNumber: firstVerse.verse,
              theme: 'reading' as const,
              showTranslation: true,
              emphasizeReference: true,
              // Pass feature settings to template
              featureSettings: {
                background: scriptureSettings.background,
                typography: scriptureSettings.typography
              }
            };

            // PERFORMANCE OPTIMIZATION: Check cache before generating shapes
            const cacheKey = generateShapeCacheKey(
              'scripture-group',
              combinedText,
              scriptureSettings.background.type,
              scriptureSettings.background.value || '',
              scriptureSettings.typography
            );

            let shapes: Shape[];
            if (shapeCache.has(cacheKey)) {
              console.log('✅ Using cached shapes for verse group:', `${firstVerse.verse}-${lastVerse.verse}`);
              shapes = shapeCache.get(cacheKey)!;
            } else {
              console.log('🔨 Generating new shapes for verse group:', `${firstVerse.verse}-${lastVerse.verse}`);
              shapes = scriptureTemplate.generateSlide(scriptureContent);

              // Add to cache with LRU eviction
              if (shapeCache.size >= MAX_CACHE_SIZE) {
                const firstKey = shapeCache.keys().next().value;
                if (firstKey) shapeCache.delete(firstKey);
              }
              shapeCache.set(cacheKey, shapes);
            }

            // Convert SlideBackground to Slide background format
            // IMPORTANT: Maintain gradient structure with start/end/direction, not comma-separated string
            const slideBackground = scriptureSettings.background.type === 'gradient' && scriptureSettings.background.gradient
              ? {
                  type: 'gradient' as const,
                  gradient: {
                    start: scriptureSettings.background.gradient.start,
                    end: scriptureSettings.background.gradient.end,
                    direction: scriptureSettings.background.gradient.direction
                  },
                  opacity: scriptureSettings.background.opacity
                }
              : {
                  type: scriptureSettings.background.type as 'color' | 'image',
                  value: scriptureSettings.background.value || '#1a1a1a',
                  opacity: scriptureSettings.background.opacity
                };

            slides.push({
              id: `scripture-group-${firstVerse.id}-${lastVerse.id}`,
              shapes: shapes,
              background: slideBackground,
              verseNumbers: verses.map(v => v.verse),
              verseIds: verses.map(v => v.id)
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

            // Convert SlideBackground to Slide background format
            const slideBackground = songSettings.background.type === 'gradient' && songSettings.background.gradient
              ? {
                  type: 'gradient' as const,
                  gradient: {
                    start: songSettings.background.gradient.start,
                    end: songSettings.background.gradient.end,
                    direction: songSettings.background.gradient.direction
                  },
                  opacity: songSettings.background.opacity
                }
              : {
                  type: songSettings.background.type as 'color' | 'image',
                  value: songSettings.background.value || '#1a1a1a',
                  opacity: songSettings.background.opacity
                };

            slides.push({
              id: `song-verse-${index}`,
              shapes: shapes,
              background: slideBackground
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

            // Convert SlideBackground to Slide background format
            const slideBackground = songSettings.background.type === 'gradient' && songSettings.background.gradient
              ? {
                  type: 'gradient' as const,
                  gradient: {
                    start: songSettings.background.gradient.start,
                    end: songSettings.background.gradient.end,
                    direction: songSettings.background.gradient.direction
                  },
                  opacity: songSettings.background.opacity
                }
              : {
                  type: songSettings.background.type as 'color' | 'image',
                  value: songSettings.background.value || '#1a1a1a',
                  opacity: songSettings.background.opacity
                };

            slides.push({
              id: 'song-chorus',
              shapes: shapes,
              background: slideBackground
            });
          }
        } else {
          // Handle simple lyrics string - parse into sections
          console.log('🎵 Song content before parsing:', {
            title: item.title,
            lyricsType: typeof songContent.lyrics,
            lyricsValue: songContent.lyrics,
            fullContent: songContent
          });

          const lyricsString = String(songContent.lyrics || 'No lyrics available');
          const sections = parseSongLyrics(lyricsString);

          console.log('🎵 Parsed song sections:', {
            title: item.title,
            sectionCount: sections.length,
            sections: sections.map(s => `${s.type}${s.number ? ` ${s.number}` : ''}`)
          });

          // Generate a slide for each section
          sections.forEach((section, index) => {
            const songSlideContent = {
              title: item.title || songContent.title || 'Untitled Song',
              lyrics: String(section.lyrics || ''), // Ensure lyrics is always a string
              section: section.type,
              sectionNumber: section.number,
              author: songContent.author,
              copyright: songContent.copyright,
              ccli: songContent.ccli || songContent.ccliNumber,
              key: songContent.key,
              tempo: songContent.tempo,
              showChords: false,
              showCopyright: index === sections.length - 1 // Show on last section
            };

            const shapes = songTemplate.generateSlide(songSlideContent);

            // Convert SlideBackground to Slide background format
            const slideBackground = songSettings.background.type === 'gradient' && songSettings.background.gradient
              ? {
                  type: 'gradient' as const,
                  gradient: {
                    start: songSettings.background.gradient.start,
                    end: songSettings.background.gradient.end,
                    direction: songSettings.background.gradient.direction
                  },
                  opacity: songSettings.background.opacity
                }
              : {
                  type: songSettings.background.type as 'color' | 'image',
                  value: songSettings.background.value || '#1a1a1a',
                  opacity: songSettings.background.opacity
                };

            slides.push({
              id: `song-${section.type}-${section.number || index}`,
              shapes: shapes,
              background: slideBackground
            });
          });
        }
      } else if (item.type === 'announcement' && item.content.text) {
        const announcementTemplate = new AnnouncementTemplate(DEFAULT_SLIDE_SIZE);

        console.log('📢 Generating announcement slide:', {
          title: item.title,
          contentLength: item.content.text?.length
        });

        // Create announcement slide content
        const announcementContent = {
          title: item.title || 'Announcement',
          message: item.content.text || '',
          details: item.content.details,
          date: item.content.date,
          time: item.content.time,
          location: item.content.location,
          contact: item.content.contact,
          imageUrl: item.content.imageUrl,
          callToAction: item.content.callToAction,
          type: (item.content.announcementType || 'announcement') as 'event' | 'announcement' | 'reminder' | 'welcome' | 'celebration',
          urgency: (item.content.urgency || 'medium') as 'low' | 'medium' | 'high',
          showLogo: false
        };

        const shapes = announcementTemplate.generateSlide(announcementContent);

        // Use default dark background for announcements
        const slideBackground = {
          type: 'color' as const,
          value: '#1a1a1a',
          opacity: 1
        };

        slides.push({
          id: `announcement-${item.id}`,
          shapes: shapes,
          background: slideBackground
        });

        console.log('✅ Announcement slide generated');
      }

      const updatedItem = { ...item, slides };

      // Update the item in Redux store
      dispatch(updateServiceItem(updatedItem));

      // Auto-present if double-clicked
      if (autoPresent && slides.length > 0 && liveDisplayActive) {
        await sendSlideToLive(slides[0], updatedItem, 0);
      }

    } catch (error) {
      console.error('Failed to generate slides:', error);
    } finally {
      ui.clearLoading();
    }
  };

  // Handle service item selection (single click)
  const handleServiceItemSelect = (item: ServiceItem, event: React.MouseEvent) => {
    event.stopPropagation();

    // CRITICAL: Only generate slides if they don't exist
    // This preserves toolbar edits made to existing slides
    if (!item.slides || item.slides.length === 0) {
      console.log('📝 Generating slides for new item:', item.id);
      generateSlidesForItem(item, false);
    } else {
      console.log('✅ Using existing slides for item:', item.id, 'slides:', item.slides.length);
    }
  };

  // Handle service item presentation (double click)
  const handleServiceItemPresent = async (item: ServiceItem, event: React.MouseEvent) => {
    event.stopPropagation();

    // Generate slides only if they don't exist
    const needsGeneration = !item.slides || item.slides.length === 0;

    if (!liveDisplayActive) {
      // Create live display if it doesn't exist
      await createLiveDisplay();
      // Wait a moment for live display to be ready
      setTimeout(() => {
        if (needsGeneration) {
          generateSlidesForItem(item, true);
        } else {
          if (item.slides && item.slides.length > 0) {
            sendSlideToLive(item.slides[0], item, 0);
          }
        }
      }, 500);
    } else {
      if (needsGeneration) {
        generateSlidesForItem(item, true);
      } else {
        if (item.slides && item.slides.length > 0) {
          sendSlideToLive(item.slides[0], item, 0);
        }
      }
    }
  };

  // ============================================
  // SCRIPTURE SELECTION - Using Presentation Manager
  // ============================================
  const handleScriptureSelect = async (verses: ScriptureVerse[]) => {
    console.log('📖 PresentationManager: Scripture selected', {
      versesCount: verses.length,
      activeTab: ui.activeTab
    });

    if (verses.length === 0) {
      console.log('⚠️ No verses selected, skipping');
      return;
    }

    try {
      ui.setLoading({ type: "generating-slides", itemId: `scripture-${Date.now()}` });

      // Set active verse numbers for UI highlighting
      const verseNumbers = verses.map(v => v.verse);
      ui.setActiveVerseNumbers(verseNumbers);

      // Update Redux scripture navigation state
      const navigatedVerses = verses.map(v => ({ ...v })) as NavigatedVerse[];

      // Create one slide per verse (instead of grouping) for better navigation
      const individualGroups = navigatedVerses.map(verse => ({
        verses: [verse],
        reference: `${verse.book} ${verse.chapter}:${verse.verse}`,
        isConsecutive: false
      }));

      dispatch(setScriptureSelection({
        verses: navigatedVerses,
        groups: individualGroups
      }));

      // Build presentation content using content builder
      // NOTE: buildScriptureContent now uses scriptureSettings from featureSettingsSlice
      // which is the single source of truth for all scripture formatting
      const scriptureContent = await buildScriptureContent(
        navigatedVerses,
        scriptureSettings,
        individualGroups
      );

      // Switch to new scripture content in presentation manager
      await presentation.switchTo(scriptureContent);

      console.log('✅ Scripture content loaded in presentation manager');
    } catch (error) {
      console.error('❌ Failed to load scripture content:', error);
    } finally {
      ui.clearLoading();
    }
  };

  // ============================================
  // SCRIPTURE VERSE NAVIGATION (O(1) with metadata)
  // ============================================
  const goToPreviousVerse = async () => {
    if (selectedItem?.type !== 'scripture' || !scriptureNav.canNavigatePrevious) return;

    console.log('⬆️ Navigating to previous verse in Bible');
    const result = await dispatch(navigateToPreviousVerse()).unwrap();
    if (result) {
      // Generate slide for the new verse
      await handleScriptureSelect([result as ScriptureVerse]);
    }
  };

  const goToNextVerse = async () => {
    if (selectedItem?.type !== 'scripture' || !scriptureNav.canNavigateNext) return;

    console.log('⬇️ Navigating to next verse in Bible');
    const result = await dispatch(navigateToNextVerse()).unwrap();
    if (result) {
      // Generate slide for the new verse
      await handleScriptureSelect([result as ScriptureVerse]);
    }
  };

  const goToPreviousChapter = async () => {
    if (selectedItem?.type !== 'scripture' || !scriptureNav.canNavigatePreviousChapter) return;

    console.log('⏮️ Navigating to previous chapter');
    const result = await dispatch(navigateToPreviousChapter()).unwrap();
    if (result) {
      await handleScriptureSelect([result as ScriptureVerse]);
    }
  };

  const goToNextChapter = async () => {
    if (selectedItem?.type !== 'scripture' || !scriptureNav.canNavigateNextChapter) return;

    console.log('⏭️ Navigating to next chapter');
    const result = await dispatch(navigateToNextChapter()).unwrap();
    if (result) {
      await handleScriptureSelect([result as ScriptureVerse]);
    }
  };

  // ============================================
  // UNIFIED NAVIGATION (Smart routing)
  // ============================================
  const goToPrevious = React.useCallback(async () => {
    // For scripture with O(1) navigation metadata, use verse navigation
    if (presentation.current.content?.type === 'scripture' && scriptureNav.canNavigatePrevious) {
      await goToPreviousVerse();
    } else {
      // For other content types, use slide navigation
      await presentation.previous();
    }
  }, [presentation, scriptureNav.canNavigatePrevious]);

  const goToNext = React.useCallback(async () => {
    // For scripture with O(1) navigation metadata, use verse navigation
    if (presentation.current.content?.type === 'scripture' && scriptureNav.canNavigateNext) {
      await goToNextVerse();
    } else {
      // For other content types, use slide navigation
      await presentation.next();
    }
  }, [presentation, scriptureNav.canNavigateNext]);

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
          // Next (unified)
          await goToNext();
          break;

        case 'Backspace':
        case 'ArrowLeft':
          // Previous (unified)
          await goToPrevious();
          break;

        case 'KeyB':
          // Black screen
          await presentation.showBlack();
          break;

        case 'Escape':
          // Stop live presentation
          if (presentation.isLive) {
            await presentation.stopLive();
          }
          break;

        case 'KeyF':
          // Go to live mode (present current slide)
          if (presentation.hasContent) {
            await presentCurrentSlide();
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => {
      window.removeEventListener('keydown', handleKeyPress);
    };
  }, [presentation, goToNext, goToPrevious]);

  // Present current slide (go live)
  const presentCurrentSlide = async () => {
    if (presentation.hasContent) {
      await presentation.startLive();
    } else {
      console.warn('⚠️ No content loaded to present');
    }
  };

  // Slide property management (simplified for new PowerPoint pattern)
  const updateSlideProperty = (property: string, value: any) => {
    setSlideProperties(prev => ({
      ...prev,
      [property]: value
    }));
    // Note: With new PowerPoint pattern, slides update immediately via handleSlideUpdate
    // No need for hasUnsavedChanges state
  };

  // Service item management functions
  const addServiceItem = (item: ServiceItem) => {
    const newItem = {
      ...item,
      id: `${item.type}-${Date.now()}`,
      order: serviceItems.length + 1
    };
    dispatch(addServiceItemAction(newItem));
  };



  // Handle drag end for service item reordering
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      return;
    }

    const oldIndex = serviceItems.findIndex((item) => item.id === active.id);
    const newIndex = serviceItems.findIndex((item) => item.id === over.id);

    const reorderedItems = arrayMove(serviceItems, oldIndex, newIndex);

    // Update order numbers and dispatch to Redux
    const itemsWithOrder = reorderedItems.map((item, index) => ({
      ...item,
      order: index + 1
    }));

    dispatch(reorderServiceItems(itemsWithOrder));
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

  // Inline media addition handlers
  const openInlineMediaModal = (type: 'song' | 'scripture' | 'presentation' | 'announcement', position: number) => {
    ui.openInlineMediaModal(type, position);
  };

  const closeInlineMediaModal = () => {
    ui.closeInlineMediaModal();
  };

  const handleInlineSongSelect = async (song: any) => {
    const songItem: ServiceItem = {
      id: `song-${Date.now()}`,
      type: 'song',
      title: song.title,
      content: {
        lyrics: song.lyrics || '',
        artist: song.artist || ''
      },
      order: ui.inlineMediaModal.insertPosition + 1
    };

    // Insert at specific position
    const newItems = [...serviceItems];
    newItems.splice(ui.inlineMediaModal.insertPosition, 0, songItem);

    // Update order for all items
    const reorderedItems = newItems.map((item, index) => ({ ...item, order: index + 1 }));
    dispatch(setServiceItems(reorderedItems));

    // Generate slides for the new song
    await generateSlidesForItem(songItem);

    closeInlineMediaModal();
  };

  const handleInlineScriptureSelect = async (scripture: any) => {
    const scriptureItem: ServiceItem = {
      id: `scripture-${Date.now()}`,
      type: 'scripture',
      title: scripture.reference,
      content: {
        reference: scripture.reference,
        book: scripture.book,
        chapter: scripture.chapter,
        verses: scripture.text ? [scripture] : []
      },
      order: ui.inlineMediaModal.insertPosition + 1
    };

    // Insert at specific position
    const newItems = [...serviceItems];
    newItems.splice(ui.inlineMediaModal.insertPosition, 0, scriptureItem);

    // Update order for all items
    const reorderedItems = newItems.map((item, index) => ({ ...item, order: index + 1 }));
    dispatch(setServiceItems(reorderedItems));

    // Generate slides for the new scripture
    await generateSlidesForItem(scriptureItem);

    closeInlineMediaModal();
  };

  const handleInlinePresentationSelect = async (presentation: any) => {
    const presentationItem: ServiceItem = {
      id: `presentation-${Date.now()}`,
      type: 'presentation',
      title: presentation.name,
      content: {
        name: presentation.name,
        slideCount: presentation.slideCount
      },
      order: ui.inlineMediaModal.insertPosition + 1
    };

    // Insert at specific position
    const newItems = [...serviceItems];
    newItems.splice(ui.inlineMediaModal.insertPosition, 0, presentationItem);

    // Update order for all items
    const reorderedItems = newItems.map((item, index) => ({ ...item, order: index + 1 }));
    dispatch(setServiceItems(reorderedItems));

    // Generate slides for the new presentation
    await generateSlidesForItem(presentationItem);

    closeInlineMediaModal();
  };

  const handleInlineAnnouncementSave = async (announcement: { title: string; content: string; duration?: number }) => {
    const announcementItem: ServiceItem = {
      id: `announcement-${Date.now()}`,
      type: 'announcement',
      title: announcement.title,
      content: {
        text: announcement.content,
        description: ''
      },
      duration: announcement.duration || 60,
      order: ui.inlineMediaModal.insertPosition + 1
    };

    // Insert at specific position
    const newItems = [...serviceItems];
    newItems.splice(ui.inlineMediaModal.insertPosition, 0, announcementItem);

    // Update order for all items
    const reorderedItems = newItems.map((item, index) => ({ ...item, order: index + 1 }));
    dispatch(setServiceItems(reorderedItems));

    // Generate slides for the new announcement
    await generateSlidesForItem(announcementItem);

    closeInlineMediaModal();
  };

  // Inline edit and delete handlers
  const handleServiceItemEdit = (item: ServiceItem) => {
    dispatch(updateServiceItem(item));
    // If this is the selected item, update it
    if (selectedItem?.id === item.id) {
    }
  };

  const handleServiceItemDelete = (itemId: string) => {
    // Remove from service items
    const newItems = serviceItems.filter(item => item.id !== itemId);
    dispatch(setServiceItems(newItems));

    // If this was the selected item, clear selection
    if (selectedItem?.id === itemId) {
    }
  };

  // Session management functions
  const clearAllItems = () => {
    dispatch(clearServiceItems());
    setSelectedPlan(null);
  };

  const saveCurrentAsNewPlan = () => {
    if (serviceItems.length === 0) return;

    // This would integrate with plan creation - for now just show notification
    console.log('Save current items as new plan:', serviceItems);
    // TODO: Open plan creation modal with current items
  };

  // Get current slide from presentation manager
  const currentSlide = presentation.currentSlide;

  // Update active verse numbers based on current slide
  useEffect(() => {
    if (presentation.current.content?.type === 'scripture' && currentSlide) {
      if ((currentSlide as any).verseNumbers) {
        console.log('📖 Updating active verses to:', (currentSlide as any).verseNumbers);
        ui.setActiveVerseNumbers((currentSlide as any).verseNumbers);
      }
    } else {
      // Clear active verses if not scripture
      ui.setActiveVerseNumbers([]);
    }
  }, [presentation.current.slideIndex, presentation.current.content, currentSlide]);

  // Reset thumbnail refs when item changes
  useEffect(() => {
    thumbnailRefs.current = [];
  }, [selectedItem]);

  // Auto-scroll thumbnails to keep active slide in view
  useEffect(() => {
    if (thumbnailRefs.current[currentSlideIndex] && thumbnailsContainerRef.current) {
      const thumbnail = thumbnailRefs.current[currentSlideIndex];
      const container = thumbnailsContainerRef.current;

      if (thumbnail && container) {
        // Calculate the thumbnail's position relative to the container
        const thumbnailRect = thumbnail.getBoundingClientRect();
        const containerRect = container.getBoundingClientRect();

        // Check if thumbnail is out of view
        if (thumbnailRect.left < containerRect.left || thumbnailRect.right > containerRect.right) {
          // Scroll the thumbnail into view
          thumbnail.scrollIntoView({
            behavior: 'smooth',
            block: 'nearest',
            inline: 'center'
          });
        }
      }
    }
  }, [currentSlideIndex]);

  // Handle slide updates from SlideEditor (PowerPoint pattern)
  const handleSlideUpdate = React.useCallback((updatedSlide: Slide) => {
    if (!selectedItem || !selectedItem.slides) return;

    console.log('🎨 LivePresentationPage: Slide updated', {
      slideId: updatedSlide.id,
      shapeCount: updatedSlide.shapes.length,
      currentSlideIndex
    });

    // Update the slide in the service item
    const updatedSlides = [...selectedItem.slides];
    updatedSlides[currentSlideIndex] = updatedSlide;

    const updatedServiceItem: ServiceItem = {
      ...selectedItem,
      slides: updatedSlides
    };

    // CRITICAL FIX: Update BOTH Redux slices for complete synchronization

    // 1. Update serviceItemsSlice (for persistence and service item list)
    dispatch(updateServiceItem(updatedServiceItem));

    // 2. Update presentationSlice (for currentSlide display)
    // This is what was missing - the presentation slice needs to know about slide changes!
    dispatch(updateSlide({ slideIndex: currentSlideIndex, slide: updatedSlide }));

    console.log('✅ Updated both serviceItems and presentation slices');

    // NOTE: Removed scriptureFormattingSlice save - now using featureSettingsSlice as single source of truth
    // Users must explicitly "Save as Default" via toolbar to persist formatting changes
  }, [selectedItem, currentSlideIndex, dispatch, presentation]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <div className="bg-card border-b border-border p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <MonitorSpeaker className="w-8 h-8 text-blue-400" />
            <h1 className="text-2xl font-bold">Live Presentation</h1>
          </div>

          <div className="flex items-center gap-3">
            {/* Settings Button */}
            <button
              onClick={() => ui.setSettingsModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg border border-gray-600 transition-colors"
              title="Feature Settings"
            >
              <Settings className="w-4 h-4" />
              <span className="text-sm font-medium">Settings</span>
            </button>

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
      </div>

      {/* Feature Settings Modal */}
      <FeatureSettingsModal
        isOpen={ui.settingsModalOpen}
        onClose={() => ui.setSettingsModalOpen(false)}
        initialTab={ui.activeTab === 'scripture' ? 'scriptures' : 'songs'}
      />

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

          {/* Tab Navigation - Enhanced with clear active states */}
          <div className="flex border-b border-gray-700 bg-gray-900">
            {[
              { key: 'scripture', label: 'Scripture', icon: BookOpen, color: 'purple' },
              { key: 'songs', label: 'Songs', icon: Music, color: 'orange' },
              { key: 'plan', label: 'Current Service', icon: Play, color: 'green' },
              { key: 'plans', label: 'Plan Manager', icon: Calendar, color: 'blue' }
            ].map(({ key, label, icon: Icon, color }) => {
              const isActive = ui.activeTab === key;

              // Color-specific styling
              const colorClasses = {
                purple: {
                  active: 'bg-purple-600 text-white border-b-4 border-purple-400 shadow-lg shadow-purple-900/50',
                  inactive: 'bg-gray-900 text-gray-400 hover:bg-purple-900/20 hover:text-purple-300',
                  icon: 'text-purple-400'
                },
                orange: {
                  active: 'bg-orange-600 text-white border-b-4 border-orange-400 shadow-lg shadow-orange-900/50',
                  inactive: 'bg-gray-900 text-gray-400 hover:bg-orange-900/20 hover:text-orange-300',
                  icon: 'text-orange-400'
                },
                green: {
                  active: 'bg-green-600 text-white border-b-4 border-green-400 shadow-lg shadow-green-900/50',
                  inactive: 'bg-gray-900 text-gray-400 hover:bg-green-900/20 hover:text-green-300',
                  icon: 'text-green-400'
                },
                blue: {
                  active: 'bg-blue-600 text-white border-b-4 border-blue-400 shadow-lg shadow-blue-900/50',
                  inactive: 'bg-gray-900 text-gray-400 hover:bg-blue-900/20 hover:text-blue-300',
                  icon: 'text-blue-400'
                }
              };

              const itemCount = key === 'plan' ? serviceItems.length : key === 'songs' ? ui.pendingSongsCount : 0;

              return (
                <button
                  key={key}
                  onClick={() => ui.setActiveTab(key as any)}
                  className={`
                    relative flex-1 px-4 py-3 text-sm font-medium
                    border-r border-gray-700 last:border-r-0
                    flex items-center justify-center gap-2
                    transition-all duration-200
                    ${isActive ? colorClasses[color as keyof typeof colorClasses].active : colorClasses[color as keyof typeof colorClasses].inactive}
                  `}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'animate-pulse' : ''}`} />
                  <span>{label}</span>

                  {/* Item count badge for Current Service and Songs tabs */}
                  {(key === 'plan' || key === 'songs') && itemCount > 0 && (
                    <span className={`
                      ml-1 px-2 py-0.5 rounded-full text-xs font-bold
                      ${isActive ? 'bg-white/20 text-white' : key === 'plan' ? 'bg-green-900/50 text-green-400' : 'bg-orange-900/50 text-orange-400'}
                    `}>
                      {itemCount}
                    </span>
                  )}

                  {/* Active indicator gradient line */}
                  {isActive && (
                    <div
                      className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r opacity-50"
                      style={{
                        backgroundImage: color === 'purple'
                          ? 'linear-gradient(to right, transparent, rgb(192, 132, 252), transparent)'
                          : color === 'orange'
                          ? 'linear-gradient(to right, transparent, rgb(251, 146, 60), transparent)'
                          : color === 'green'
                          ? 'linear-gradient(to right, transparent, rgb(74, 222, 128), transparent)'
                          : 'linear-gradient(to right, transparent, rgb(96, 165, 250), transparent)'
                      }}
                    />
                  )}
                </button>
              );
            })}
          </div>

          {/* Tab Content */}
          <div className="p-4 overflow-y-auto" style={{ height: 'calc(100vh - 220px)' }}>
            {ui.activeTab === 'scripture' && (
              <div className="space-y-4">
                <div className="mb-3">
                  <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-purple-400" />
                    Scripture Selection
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Select Bible verses to present • Automatically loads in preview window
                  </p>
                </div>

                {/* Navigation Fields Warning */}
                {navigationFieldsPopulated === false && (
                  <div className="bg-yellow-900/50 border border-yellow-600 rounded-lg p-3 mb-4">
                    <div className="flex items-start gap-2">
                      <div className="text-yellow-400 mt-0.5">⚠️</div>
                      <div className="flex-1">
                        <h4 className="text-sm font-semibold text-yellow-300 mb-1">
                          Bible Navigation Not Configured
                        </h4>
                        <p className="text-xs text-yellow-200 mb-2">
                          Navigation between verses, chapters, and books requires one-time setup.
                        </p>
                        <button
                          onClick={async () => {
                            if (window.electronAPI) {
                              try {
                                console.log('Starting navigation field population...');
                                const result = await window.electronAPI.invoke('db:populateNavigation');
                                console.log('Navigation population result:', result);
                                setNavigationFieldsPopulated(true);

                                // Show success message (you might want to add a toast notification here)
                                console.log('✅ Navigation fields populated successfully!');
                              } catch (error) {
                                console.error('Error populating navigation fields:', error);
                              }
                            }
                          }}
                          className="px-3 py-1 bg-yellow-600 hover:bg-yellow-700 text-white rounded text-xs font-medium transition-colors"
                        >
                          Enable Navigation (One-time Setup)
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Scripture Sub-Tabs */}
                <div className="flex gap-2 mb-4 border-b border-border">
                  <button
                    onClick={() => ui.setScriptureSubTab('browse')}
                    className={`px-4 py-2 font-medium transition-colors flex items-center gap-2 ${
                      ui.scriptureSubTab === 'browse'
                        ? 'border-b-2 border-purple-500 text-purple-400'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <BookOpen className="w-4 h-4" />
                    Browse Books
                  </button>
                  <button
                    onClick={() => ui.setScriptureSubTab('type')}
                    className={`px-4 py-2 font-medium transition-colors flex items-center gap-2 ${
                      ui.scriptureSubTab === 'type'
                        ? 'border-b-2 border-purple-500 text-purple-400'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <BookOpen className="w-4 h-4" />
                    Type Reference
                  </button>
                </div>

                {/* Sub-Tab Content */}
                {ui.scriptureSubTab === 'browse' && (
                  <BibleBrowseSelector
                    onVerseSelect={handleScriptureSelect}
                    defaultVersion="kjv"
                  />
                )}

                {ui.scriptureSubTab === 'type' && (
                  <BibleSelector
                    onVerseSelect={handleScriptureSelect}
                    defaultVersion="kjv"
                    activeVerses={ui.activeVerseNumbers}
                  />
                )}
              </div>
            )}

            {ui.activeTab === 'songs' && (
              <div className="space-y-4">
                <div className="mb-3">
                  <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                    <Music className="w-5 h-5 text-orange-400" />
                    Song Presentation
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Songs ready to present • Click to preview • Double-click to present live
                  </p>
                </div>

                {ui.pendingSongsCount === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Music className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <div className="text-lg font-medium mb-2">No songs added yet</div>
                    <p className="text-sm">
                      Go to the Songs page and click "Add to Service" to add songs for presentation
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {ui.pendingSongs.map((song, index) => (
                      <div
                        key={song.id}
                        className={`
                          group relative bg-card border rounded-lg p-4 cursor-pointer transition-all
                          ${presentation.current.content?.id === song.id
                            ? 'border-orange-500 bg-orange-900/20 shadow-lg shadow-orange-900/50'
                            : 'border-border hover:border-orange-400 hover:bg-orange-900/10'
                          }
                        `}
                        onClick={async () => {
                          console.log('🎵 Song selected:', song.title);
                          // Build song content and present in preview mode
                          const songContent = buildSongContent(song, songSettings);
                          await presentation.present(songContent, { goLive: false });
                        }}
                        onDoubleClick={async () => {
                          console.log('🎵 Song double-clicked (go live):', song.title);
                          // Build song content and present live
                          const songContent = buildSongContent(song, songSettings);
                          await presentation.present(songContent, { goLive: true });
                        }}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <Music className="w-4 h-4 text-orange-400" />
                              <h4 className="font-semibold text-foreground">{song.title}</h4>
                              {presentation.current.content?.id === song.id && (
                                <span className="px-2 py-0.5 bg-orange-600 text-white text-xs rounded-full">
                                  Selected
                                </span>
                              )}
                            </div>
                            <div className="text-sm text-muted-foreground mb-2">
                              {song.content?.author && <span>{song.content.author}</span>}
                              {song.content?.artist && song.content.artist !== song.content.author && (
                                <span> • {song.content.artist}</span>
                              )}
                              {song.slides && (
                                <span className="ml-2">• {song.slides.length} slides</span>
                              )}
                            </div>
                            {song.content?.key && (
                              <div className="text-xs text-muted-foreground">
                                Key: {song.content.key}
                                {song.content?.tempo && ` • Tempo: ${song.content.tempo}`}
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/songs/${song.content?.id || song.id.replace('song-', '').split('-')[0]}`);
                              }}
                              className="px-3 py-1.5 bg-blue-600 text-white rounded text-xs hover:bg-blue-700"
                            >
                              Edit
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                const newSongs = ui.pendingSongs.filter(s => s.id !== song.id);
                                ui.addPendingSongs(newSongs);
                                localStorage.setItem('ui.pendingSongs', JSON.stringify(newSongs));
                                // Clear presentation if removing the active song
                                if (presentation.current.content?.id === song.id) {
                                  presentation.clear();
                                }
                              }}
                              className="px-3 py-1.5 bg-red-600 text-white rounded text-xs hover:bg-red-700"
                            >
                              Remove
                            </button>
                          </div>
                        </div>

                        {/* Slide thumbnail preview */}
                        {presentation.current.content?.id === song.id && song.slides && song.slides.length > 0 && (
                          <div className="mt-3 pt-3 border-t border-border">
                            <div className="text-xs font-medium text-muted-foreground mb-2">Preview</div>
                            <div className="grid grid-cols-4 gap-2">
                              {song.slides.slice(0, 4).map((slide, slideIdx) => (
                                <div
                                  key={slide.id}
                                  className="aspect-video bg-black rounded border border-border overflow-hidden cursor-pointer hover:border-orange-400"
                                  onClick={async (e) => {
                                    e.stopPropagation();
                                    await presentation.jumpTo(slideIdx);
                                  }}
                                >
                                  <div className="w-full h-full flex items-center justify-center text-xs text-white/50">
                                    Slide {slideIdx + 1}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {ui.activeTab === 'plan' && (
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
                </div>
                <div>
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
                        onClick={() => ui.setActiveTab('plans')}
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

                {/* QuickAdd toolbar at top - before any items */}
                {serviceItems.length > 0 && (
                  <div className="mb-2 group">
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      <div className="flex items-center justify-center gap-2 py-2 border-2 border-dashed border-gray-700 rounded-lg bg-gray-900/30 hover:bg-gray-900/50 hover:border-green-600 transition-all">
                        <button
                          onClick={() => openInlineMediaModal('song', 0)}
                          className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-xs font-medium transition-colors"
                        >
                          <Music className="w-3 h-3" />
                          Song
                        </button>
                        <button
                          onClick={() => openInlineMediaModal('scripture', 0)}
                          className="flex items-center gap-1 px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-md text-xs font-medium transition-colors"
                        >
                          <BookOpen className="w-3 h-3" />
                          Scripture
                        </button>
                        <button
                          onClick={() => openInlineMediaModal('presentation', 0)}
                          className="flex items-center gap-1 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-md text-xs font-medium transition-colors"
                        >
                          <FileText className="w-3 h-3" />
                          Presentation
                        </button>
                        <button
                          onClick={() => openInlineMediaModal('announcement', 0)}
                          className="flex items-center gap-1 px-3 py-1.5 bg-yellow-600 hover:bg-yellow-700 text-white rounded-md text-xs font-medium transition-colors"
                        >
                          <Mic className="w-3 h-3" />
                          Announcement
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                <DndContext
                  sensors={sensors}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext items={serviceItems.map(item => item.id)}>
                    {serviceItems.map((item, index) => {
                      const isSelected = selectedItem?.id === item.id;
                      const isLoading = ui.isGeneratingSlides && isSelected;
                      const isPresentingThis = isPresenting && isSelected && presentationMode === 'live';

                      return (
                        <React.Fragment key={item.id}>
                          <SortableServiceItem
                            item={item}
                            index={index}
                            isSelected={isSelected}
                            isLoading={isLoading}
                            isPresentingThis={isPresentingThis}
                            onSelect={handleServiceItemSelect}
                            onPresent={handleServiceItemPresent}
                            onEdit={handleServiceItemEdit}
                            onDelete={handleServiceItemDelete}
                          />

                          {/* QuickAdd toolbar between items */}
                          <div className="my-2 group">
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                              <div className="flex items-center justify-center gap-2 py-2 border-2 border-dashed border-gray-700 rounded-lg bg-gray-900/30 hover:bg-gray-900/50 hover:border-green-600 transition-all">
                                <button
                                  onClick={() => openInlineMediaModal('song', index + 1)}
                                  className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-xs font-medium transition-colors"
                                >
                                  <Music className="w-3 h-3" />
                                  Song
                                </button>
                                <button
                                  onClick={() => openInlineMediaModal('scripture', index + 1)}
                                  className="flex items-center gap-1 px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-md text-xs font-medium transition-colors"
                                >
                                  <BookOpen className="w-3 h-3" />
                                  Scripture
                                </button>
                                <button
                                  onClick={() => openInlineMediaModal('presentation', index + 1)}
                                  className="flex items-center gap-1 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-md text-xs font-medium transition-colors"
                                >
                                  <FileText className="w-3 h-3" />
                                  Presentation
                                </button>
                                <button
                                  onClick={() => openInlineMediaModal('announcement', index + 1)}
                                  className="flex items-center gap-1 px-3 py-1.5 bg-yellow-600 hover:bg-yellow-700 text-white rounded-md text-xs font-medium transition-colors"
                                >
                                  <Mic className="w-3 h-3" />
                                  Announcement
                                </button>
                              </div>
                            </div>
                          </div>
                        </React.Fragment>
                      );
                    })}
                  </SortableContext>
                </DndContext>

                {/* LivePlanControls - Service execution controls */}
                {serviceItems.length > 0 && (
                  <LivePlanControls
                    plan={selectedPlan}
                    serviceItems={serviceItems}
                    currentItem={selectedItem}
                    onItemSelect={(item) => handleServiceItemSelect(item, {} as any)}
                    className="mt-4"
                  />
                )}

                {/* Service Planning & Execution Assistance */}
                {serviceItems.length > 0 && isExecutingService && selectedItem && (
                  <div className="mt-6">
                    {/* Next Item Preview - Shows when executing */}
                    <NextItemPreview
                      currentItem={selectedItem}
                      nextItem={serviceItems[serviceItems.findIndex(item => item.id === selectedItem.id) + 1]}
                      upcomingItems={serviceItems.slice(
                        serviceItems.findIndex(item => item.id === selectedItem.id) + 1,
                        serviceItems.findIndex(item => item.id === selectedItem.id) + 4
                      )}
                    />
                  </div>
                )}
              </div>
            )}


            {ui.activeTab === 'plans' && (
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
                    {isLoadingService ? (
                      <div className="flex items-center justify-center py-8">
                        <div className="text-gray-400">Initializing service for plans...</div>
                      </div>
                    ) : (
                      <>
                        <PlanManager
                          serviceId={ui.currentServiceId}
                          onPlanSelect={handlePlanSelectWithLoading}
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
                              dispatch(clearServiceItems());
                            }
                          }}
                          className=""
                        />

                        {/* Plan Error Display */}
                        {ui.planError && (
                        <div className="bg-red-900/50 border border-red-600 rounded-lg p-4 mb-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="text-sm font-semibold text-red-300 mb-1">Plan Loading Error</h4>
                              <p className="text-sm text-red-200">{ui.planError}</p>
                            </div>
                            <button
                              onClick={() => setPlanError(null)}
                              className="text-red-300 hover:text-red-100 ml-2"
                              title="Dismiss error"
                            >
                              ✕
                            </button>
                          </div>
                        </div>
                      )}

                        {/* Plan Statistics */}
                        {ui.isPlanLoading ? (
                          <div className="bg-card rounded-lg border border-border p-4 mb-4">
                            <div className="flex items-center justify-center py-4">
                              <div className="text-gray-400">Loading plan content...</div>
                            </div>
                          </div>
                        ) : (
                          <PlanStats plan={selectedPlan} serviceItems={serviceItems} />
                        )}
                      </>
                    )}
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
                        onClick={() => ui.setActiveTab('plan')}
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
                      hasUnsavedChanges={false} // PowerPoint pattern: changes save immediately
                      onPropertyChange={updateSlideProperty}
                      onSave={() => {}} // No-op: slides update immediately via handleSlideUpdate
                    />
                  </div>
                )}

                {/* Preview Window with Typography Toolbar */}
                <div className="flex-1 min-h-0 flex flex-col">
                  {currentSlide ? (
                    <SlideEditorWithToolbar
                      slide={currentSlide}
                      onSlideChange={handleSlideUpdate}
                      editable={true}
                      showToolbar={true}
                      className="flex-1"
                    />
                  ) : (
                    <PreviewWindow
                      title="Preview Window"
                      type="preview"
                      showControls={true}
                      contentResolution={{ width: 1920, height: 1080 }}
                      renderResolution={{ width: 1920, height: 1080 }}
                      isEditable={true}
                      connectionStatus="connected"
                      onToggleControls={() => setShowPropertyPanel(!showPropertyPanel)}
                      className="h-full"
                    >
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        <div className="text-center">
                          <div className="text-4xl mb-2">🎯</div>
                          <div>Select an item to preview</div>
                        </div>
                      </div>
                    </PreviewWindow>
                  )}
                </div>

                {/* Navigation Controls */}
                {(presentation.current.content?.slides || selectedItem?.slides) && (
                  <div className="border-t border-border bg-card p-3">
                    {/* Slide Thumbnails Strip */}
                    {((presentation.current.content?.slides && presentation.current.content.slides.length > 1) || (selectedItem?.slides && selectedItem.slides.length > 1)) && (
                      <div className="mb-3">
                        <div className="text-xs text-muted-foreground mb-1 font-medium">Slides</div>
                        <div
                          ref={thumbnailsContainerRef}
                          className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-primary/20 scrollbar-track-transparent"
                        >
                          {(presentation.current.content?.slides || selectedItem?.slides || []).map((slide, index) => (
                            <button
                              key={slide.id}
                              ref={(el) => { thumbnailRefs.current[index] = el; }}
                              onClick={async () => {
                                // Use unified presentation manager - it handles live display sync automatically
                                await presentation.jumpTo(index);

                                // Update Redux navigation state if scripture
                                if (selectedItem?.type === 'scripture' && scriptureNav.currentGroups.length > 0) {
                                  dispatch(setCurrentGroupIndex(index));
                                }
                              }}
                              className={`flex-shrink-0 border-2 rounded transition-all ${
                                index === presentation.current.slideIndex
                                  ? 'border-primary ring-2 ring-primary/50 scale-105'
                                  : 'border-border hover:border-primary/50'
                              }`}
                              title={`Slide ${index + 1}`}
                            >
                              <div className="relative w-24 h-16 bg-background overflow-hidden rounded">
                                {/* Mini slide preview */}
                                <div className="absolute inset-0 p-1 text-xs">
                                  <div className={`w-full h-full flex items-center justify-center ${
                                    slide.background?.type === 'color' ? '' : 'bg-secondary'
                                  }`}
                                    style={{
                                      backgroundColor: slide.background?.type === 'color' ? slide.background.value : undefined,
                                      backgroundImage: slide.background?.type === 'image' ? `url(${slide.background.value})` :
                                                       slide.background?.type === 'gradient' ? slide.background.value : undefined,
                                      backgroundSize: 'cover',
                                      backgroundPosition: 'center'
                                    }}
                                  >
                                    {/* Show text content preview if available */}
                                    {slide.shapes && slide.shapes.length > 0 && (
                                      <div className="text-[6px] text-center text-foreground/70 line-clamp-3 px-1">
                                        {slide.shapes
                                          .filter(shape => shape.type === 'text' && shape.text)
                                          .map(shape => shape.text)
                                          .join(' ')
                                          .slice(0, 50)}
                                      </div>
                                    )}
                                  </div>
                                </div>
                                {/* Slide number badge */}
                                <div className={`absolute bottom-0 right-0 px-1 text-[10px] font-semibold rounded-tl ${
                                  index === currentSlideIndex
                                    ? 'bg-primary text-primary-foreground'
                                    : 'bg-secondary text-secondary-foreground'
                                }`}>
                                  {index + 1}
                                </div>
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-center gap-4 mb-2">
                      <button
                        onClick={goToPrevious}
                        disabled={
                          presentation.current.content?.type === 'scripture'
                            ? !scriptureNav.canNavigatePrevious
                            : !presentation.canGoPrevious
                        }
                        className="px-4 py-2 bg-secondary text-secondary-foreground rounded hover:bg-secondary/80 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        title={`Slide ${presentation.current.slideIndex + 1} of ${presentation.slideCount}`}
                      >
                        <SkipBack className="w-4 h-4" />
                        Previous
                      </button>

                      {/* <div className="text-sm text-muted-foreground min-w-[120px] text-center">
                        {selectedItem?.type === 'scripture' && selectedItem.slides?.length === 1 ? (
                          <div>
                            <div>Slide 1 / 1</div>
                            {scriptureNav.currentVerses.length > 0 && (
                              <div className="text-xs mt-0.5">
                                {scriptureNav.currentVerses[0].book} {scriptureNav.currentVerses[0].chapter}:{scriptureNav.currentVerses[0].verse}
                              </div>
                            )}
                          </div>
                        ) : (
                          `Slide ${currentSlideIndex + 1} / ${selectedItem?.slides?.length || 0}`
                        )}
                      </div> */}

                      <button
                        onClick={presentCurrentSlide}
                        disabled={!presentation.display.isActive || !presentation.hasContent}
                        className={`px-6 py-2 rounded flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed ${
                          presentation.isLive
                            ? 'bg-green-600 text-white hover:bg-green-700'
                            : 'bg-blue-600 text-white hover:bg-blue-700'
                        }`}
                      >
                        <Play className="w-4 h-4" />
                        {presentation.isLive ? 'Update Live' : 'Present Live'}
                      </button>

                      <button
                        onClick={goToNext}
                        disabled={
                          presentation.current.content?.type === 'scripture'
                            ? !scriptureNav.canNavigateNext
                            : !presentation.canGoNext
                        }
                        className="px-4 py-2 bg-secondary text-secondary-foreground rounded hover:bg-secondary/80 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        title={`Slide ${presentation.current.slideIndex + 1} of ${presentation.slideCount}`}
                      >
                        Next
                        <SkipForward className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Chapter Navigation for Scripture (optional) */}
                    {selectedItem?.type === 'scripture' && selectedItem.slides?.length === 1 && (
                      <div className="flex items-center justify-center gap-2 mt-2">
                        <button
                          onClick={goToPreviousChapter}
                          disabled={!scriptureNav.canNavigatePreviousChapter || scriptureNav.isNavigating}
                          className="px-2 py-1 text-xs bg-secondary text-secondary-foreground rounded hover:bg-secondary/80 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                          title="Previous Chapter"
                        >
                          <ChevronUp className="w-3 h-3" />
                          Prev Chapter
                        </button>

                        <button
                          onClick={goToNextChapter}
                          disabled={!scriptureNav.canNavigateNextChapter || scriptureNav.isNavigating}
                          className="px-2 py-1 text-xs bg-secondary text-secondary-foreground rounded hover:bg-secondary/80 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                          title="Next Chapter"
                        >
                          Next Chapter
                          <ChevronDown className="w-3 h-3" />
                        </button>
                      </div>
                    )}

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

                      {/* PowerPoint pattern: No unsaved changes - updates are immediate */}
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
                  <SlideViewer
                    slide={currentSlide}
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

      {/* Inline Media Addition Modal */}
      {ui.inlineMediaModal.open && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="bg-background rounded-lg shadow-2xl w-full max-w-3xl max-h-[80vh] border border-border overflow-hidden">
            {ui.inlineMediaModal.mediaType === 'song' && (
              <InlineSongSelector
                onSelect={handleInlineSongSelect}
                onCancel={closeInlineMediaModal}
              />
            )}
            {ui.inlineMediaModal.mediaType === 'scripture' && (
              <InlineScriptureSelector
                onSelect={handleInlineScriptureSelect}
                onCancel={closeInlineMediaModal}
              />
            )}
            {ui.inlineMediaModal.mediaType === 'presentation' && (
              <InlinePresentationSelector
                onSelect={handleInlinePresentationSelect}
                onCancel={closeInlineMediaModal}
              />
            )}
            {ui.inlineMediaModal.mediaType === 'announcement' && (
              <InlineAnnouncementEditor
                onSave={handleInlineAnnouncementSave}
                onCancel={closeInlineMediaModal}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default LivePresentationPage;