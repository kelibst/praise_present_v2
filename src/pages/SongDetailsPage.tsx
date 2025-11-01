import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import {
  Music,
  ArrowLeft,
  Play,
  Save,
  ChevronLeft,
  ChevronRight,
  SkipBack,
  SkipForward,
  MonitorSpeaker,
  Settings as SettingsIcon,
  Maximize2,
  Eye,
  EyeOff,
  FileText
} from 'lucide-react';
import { sampleSongs } from '../../data/sample-songs';
import { SongMetadataEditor, SongMetadata } from '../components/songs/SongMetadataEditor';
import { SongSectionEditor, SongSection } from '../components/songs/SongSectionEditor';
import { SongSlideSettingsPanel } from '../components/songs/SongSlideSettings';
import {
  Song,
  SongSlide,
  SongSlideGenerator,
  SongSlideSettings
} from '../lib/presentation/songSlideGenerator';
import { parseSongLyrics } from '../lib/presentation/songParser';
import { SlideRenderer, Slide } from '../components/slides/SlideRenderer';
import { UnifiedSlideEditor } from '../components/formatting/UnifiedSlideEditor';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import { useLiveDisplay } from '../components/live/LiveDisplayManager';
import { addPendingSong, setActiveTab } from '../lib/uiSlice';
import type { AppDispatch } from '../lib/store';

const SongDetailsPage: React.FC = () => {
  const { songId } = useParams<{ songId: string }>();
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();

  // Live display integration
  const {
    liveDisplayActive,
    createLiveDisplay,
    closeLiveDisplay,
    sendSlideToLive,
    clearLiveDisplay,
    showBlackScreen
  } = useLiveDisplay();

  // Find the song
  const [song, setSong] = useState<Song | null>(null);
  const [metadata, setMetadata] = useState<SongMetadata | null>(null);
  const [sections, setSections] = useState<SongSection[]>([]);
  const [slideSettings, setSlideSettings] = useState<SongSlideSettings>({
    background: { type: 'color', value: '#1a1a1a' },
    typography: {
      fontSize: 56,
      fontFamily: 'Arial, sans-serif',
      textAlign: 'center',
      textColor: '#ffffff',
      lineSpacing: 1.4
    },
    showSectionLabels: true,
    showCopyright: true,
    maxLinesPerSlide: 8
  });

  // Presentation state
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [isPresenting, setIsPresenting] = useState(false);

  // Panel visibility
  const [panelVisibility, setPanelVisibility] = useState({
    leftPanel: true,
    rightPanel: false
  });

  // Load song data
  useEffect(() => {
    if (!songId) return;

    const foundSong = sampleSongs.find(s => s.id === songId);
    if (foundSong) {
      setSong(foundSong as Song);

      setMetadata({
        title: foundSong.title,
        author: foundSong.author,
        artist: foundSong.artist,
        key: foundSong.key,
        tempo: foundSong.tempo,
        category: foundSong.category,
        copyright: foundSong.copyright,
        ccliNumber: foundSong.ccliNumber,
        tags: foundSong.tags,
        notes: foundSong.notes
      });

      if (foundSong.verses && foundSong.verses.length > 0) {
        setSections(foundSong.verses.map(v => ({
          id: v.id,
          type: v.type,
          number: v.number,
          lyrics: v.lyrics,
          chords: v.chords
        })));
      } else {
        const parsed = parseSongLyrics(foundSong.lyrics);
        setSections(parsed.map((section, index) => ({
          id: `section-${index}`,
          ...section
        })));
      }

      if ((foundSong as Song).slideSettings) {
        setSlideSettings((foundSong as Song).slideSettings!);
      }
    }
  }, [songId]);

  // Generate slides
  const [slides, setSlides] = useState<SongSlide[]>([]);

  useEffect(() => {
    if (!song || !metadata) {
      setSlides([]);
      return;
    }

    const songWithSections: Song = {
      ...song,
      ...metadata,
      verses: sections,
      slideSettings
    };

    const generator = new SongSlideGenerator({
      maxLinesPerSlide: slideSettings.maxLinesPerSlide || 8,
      showSectionLabels: slideSettings.showSectionLabels ?? true,
      showCopyrightSlide: slideSettings.showCopyright ?? true
    });

    setSlides(generator.generateSlides(songWithSections));
  }, [song, metadata, sections, slideSettings]);

  const currentSlide = slides[currentSlideIndex];

  // Handler for slide edits
  const handleSlideChange = (updatedSlide: Slide) => {
    const newSlides = [...slides];
    newSlides[currentSlideIndex] = {
      ...slides[currentSlideIndex],
      shapes: updatedSlide.shapes,
      background: updatedSlide.background
    };
    setSlides(newSlides);
  };

  // Helper to create service item for live display
  const createServiceItem = () => {
    if (!song || !metadata) return null;
    return {
      id: `song-${song.id}`,
      type: 'song' as const,
      title: metadata.title,
      content: song,
      slides: slides.map(slide => ({
        id: slide.id,
        shapes: slide.shapes,
        background: slide.background as any
      }))
    };
  };

  // Slide navigation
  const goToNextSlide = () => {
    if (currentSlideIndex < slides.length - 1) {
      const newIndex = currentSlideIndex + 1;
      setCurrentSlideIndex(newIndex);
      if (isPresenting && liveDisplayActive) {
        const serviceItem = createServiceItem();
        if (serviceItem) {
          sendSlideToLive(slides[newIndex] as any, serviceItem, newIndex, newIndex);
        }
      }
    }
  };

  const goToPreviousSlide = () => {
    if (currentSlideIndex > 0) {
      const newIndex = currentSlideIndex - 1;
      setCurrentSlideIndex(newIndex);
      if (isPresenting && liveDisplayActive) {
        const serviceItem = createServiceItem();
        if (serviceItem) {
          sendSlideToLive(slides[newIndex] as any, serviceItem, newIndex, newIndex);
        }
      }
    }
  };

  const goToSlide = (index: number) => {
    setCurrentSlideIndex(index);
    if (isPresenting && liveDisplayActive) {
      const serviceItem = createServiceItem();
      if (serviceItem) {
        sendSlideToLive(slides[index] as any, serviceItem, index, index);
      }
    }
  };

  // Live display controls
  const handleStartPresentation = async () => {
    if (!liveDisplayActive) {
      await createLiveDisplay();
    }
    if (currentSlide) {
      const serviceItem = createServiceItem();
      if (serviceItem) {
        await sendSlideToLive(currentSlide as any, serviceItem, currentSlideIndex, currentSlideIndex);
        setIsPresenting(true);
      }
    }
  };

  const handleStopPresentation = () => {
    clearLiveDisplay();
    setIsPresenting(false);
  };

  const togglePanel = (panel: 'leftPanel' | 'rightPanel') => {
    setPanelVisibility(prev => ({
      ...prev,
      [panel]: !prev[panel]
    }));
  };

  const handleAddToService = () => {
    if (!song || !metadata) return;

    const serviceItem = {
      id: `song-${song.id}-${Date.now()}`,
      title: metadata.title,
      content: {
        ...song,
        ...metadata,
        verses: sections,
        slideSettings
      },
      slides: slides.map(slide => ({
        id: slide.id,
        shapes: slide.shapes,
        background: slide.background
      })),
      addedAt: Date.now()
    };

    // Add to Redux pending songs (replaces localStorage)
    dispatch(addPendingSong(serviceItem));

    // Navigate to live presentation page
    navigate('/live');

    // Auto-switch to songs tab
    dispatch(setActiveTab('songs'));

    console.log(`✅ "${metadata.title}" added to service and navigating to songs tab`);
  };

  const handleSave = () => {
    console.log('Saving song:', {
      ...song,
      ...metadata,
      verses: sections,
      slideSettings
    });
    alert('Song saved successfully!');
  };

  // Handle section click to jump to corresponding slide
  const handleSectionClick = (sectionIndex: number) => {
    // Title slide is at index 0, so section slides start at index 1
    // Find the first slide for this section
    let targetSlideIndex = 1; // Start after title slide

    for (let i = 0; i < sectionIndex; i++) {
      // Count how many slides each previous section generated
      const section = sections[i];
      const lyricParts = Math.ceil(section.lyrics.split('\n').length / (slideSettings.maxLinesPerSlide || 8));
      targetSlideIndex += lyricParts;
    }

    setCurrentSlideIndex(targetSlideIndex);
    if (isPresenting && liveDisplayActive) {
      const serviceItem = createServiceItem();
      if (serviceItem) {
        sendSlideToLive(slides[targetSlideIndex] as any, serviceItem, targetSlideIndex, targetSlideIndex);
      }
    }
  };

  if (!song || !metadata) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <div className="text-center">
          <Music className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
          <div className="text-xl font-medium">Song not found</div>
          <button
            onClick={() => navigate('/songs')}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Back to Songs
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Header - Compact like LivePresentationPage */}
      <div className="border-b border-border bg-card">
        <div className="px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/songs')}
              className="p-2 hover:bg-secondary rounded-lg transition-colors"
              title="Back to songs"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-lg font-bold flex items-center gap-2">
                <Music className="w-5 h-5 text-blue-400" />
                {metadata.title}
              </h1>
              <p className="text-xs text-muted-foreground">
                {metadata.author}
                {metadata.artist && metadata.artist !== metadata.author && ` • ${metadata.artist}`}
                <span className="ml-2">•</span>
                <span className="ml-2">{slides.length} slides</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Panel toggles */}
            {!panelVisibility.leftPanel && (
              <button
                onClick={() => togglePanel('leftPanel')}
                className="px-3 py-1.5 rounded hover:bg-secondary transition-colors text-muted-foreground text-sm flex items-center gap-1.5"
                title="Show lyrics panel"
              >
                <Music className="w-4 h-4" />
                Lyrics
              </button>
            )}
            {!panelVisibility.rightPanel && (
              <button
                onClick={() => togglePanel('rightPanel')}
                className="px-3 py-1.5 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 flex items-center gap-1.5 transition-colors"
                title="Show settings panel"
              >
                <SettingsIcon className="w-4 h-4" />
                Settings
              </button>
            )}

            <button
              onClick={handleSave}
              className="px-3 py-1.5 bg-gray-600 text-white rounded text-sm hover:bg-gray-700 flex items-center gap-1.5"
            >
              <Save className="w-4 h-4" />
              Save
            </button>
            <button
              onClick={handleAddToService}
              className="px-3 py-1.5 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 flex items-center gap-1.5"
            >
              <Play className="w-4 h-4" />
              Add to Service
            </button>
          </div>
        </div>
      </div>

      {/* Main Content - 3 Panel Layout - Fixed height, no page scroll */}
      <PanelGroup direction="horizontal" className="flex-1 overflow-hidden">
        {/* Left Panel - Lyrics & Sections */}
        {panelVisibility.leftPanel && (
          <>
            <Panel defaultSize={25} minSize={20} maxSize={40}>
              <div className="h-full bg-card border-r border-border">
                <div className="flex items-center justify-between px-3 py-2 border-b border-border bg-secondary/50">
                  <div className="text-sm font-medium">Slides Navigation</div>
                  <button
                    onClick={() => togglePanel('leftPanel')}
                    className="p-1 rounded hover:bg-muted transition-colors"
                    title="Collapse panel"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                </div>

                <div className="p-3 overflow-y-auto space-y-3" style={{ height: 'calc(100vh - 160px)' }}>
                  {/* Title Slide Navigation */}
                  <div
                    onClick={() => setCurrentSlideIndex(0)}
                    className={`p-3 border rounded-lg cursor-pointer transition-all ${
                      currentSlideIndex === 0
                        ? 'bg-blue-600 border-blue-500 text-white'
                        : 'bg-card border-border hover:bg-secondary/50'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Music className="w-4 h-4" />
                      <div className="flex-1">
                        <div className="font-medium text-sm">Title Slide</div>
                        <div className={`text-xs ${currentSlideIndex === 0 ? 'text-blue-100' : 'text-muted-foreground'}`}>
                          {metadata?.title || 'Song Title'}
                        </div>
                      </div>
                      {currentSlideIndex === 0 && (
                        <div className="w-2 h-2 bg-white rounded-full" />
                      )}
                    </div>
                  </div>

                  {/* Lyrics Sections */}
                  <SongSectionEditor
                    sections={sections}
                    onChange={setSections}
                    onSectionClick={handleSectionClick}
                  />

                  {/* Copyright Slide Navigation */}
                  {slideSettings.showCopyright && slides.length > 0 && (
                    <div
                      onClick={() => setCurrentSlideIndex(slides.length - 1)}
                      className={`p-3 border rounded-lg cursor-pointer transition-all ${
                        currentSlideIndex === slides.length - 1
                          ? 'bg-blue-600 border-blue-500 text-white'
                          : 'bg-card border-border hover:bg-secondary/50'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4" />
                        <div className="flex-1">
                          <div className="font-medium text-sm">Copyright Slide</div>
                          <div className={`text-xs ${currentSlideIndex === slides.length - 1 ? 'text-blue-100' : 'text-muted-foreground'}`}>
                            {metadata?.copyright || 'Copyright information'}
                          </div>
                        </div>
                        {currentSlideIndex === slides.length - 1 && (
                          <div className="w-2 h-2 bg-white rounded-full" />
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </Panel>
            <PanelResizeHandle className="w-1 bg-border hover:bg-blue-500 transition-colors" />
          </>
        )}

        {/* Middle Panel - Slide Preview & Controls */}
        <Panel defaultSize={panelVisibility.leftPanel && panelVisibility.rightPanel ? 50 : panelVisibility.leftPanel || panelVisibility.rightPanel ? 75 : 100} minSize={30}>
          <div className="h-full bg-background flex flex-col">
            {/* Preview Header with Controls */}
            <div className="flex-shrink-0 border-b border-border bg-card px-4 py-2">
              <div className="flex items-center justify-between">
                <div className="text-sm font-medium text-foreground">
                  Slide Preview
                  {currentSlide && (
                    <span className="ml-2 text-xs text-muted-foreground">
                      ({currentSlideIndex + 1} of {slides.length})
                      {currentSlide.sectionType && ` • ${currentSlide.sectionType.charAt(0).toUpperCase() + currentSlide.sectionType.slice(1)}`}
                      {currentSlide.sectionNumber && ` ${currentSlide.sectionNumber}`}
                    </span>
                  )}
                </div>

                {/* Live Display Controls */}
                <div className="flex items-center gap-2">
                  {isPresenting ? (
                    <>
                      <button
                        onClick={handleStopPresentation}
                        className="px-3 py-1.5 bg-red-600 text-white rounded text-xs hover:bg-red-700 flex items-center gap-1.5"
                      >
                        <EyeOff className="w-3 h-3" />
                        Stop
                      </button>
                      <button
                        onClick={() => showBlackScreen()}
                        className="px-3 py-1.5 bg-gray-700 text-white rounded text-xs hover:bg-gray-800"
                      >
                        Black
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={handleStartPresentation}
                      className="px-3 py-1.5 bg-green-600 text-white rounded text-xs hover:bg-green-700 flex items-center gap-1.5"
                    >
                      <MonitorSpeaker className="w-3 h-3" />
                      Present Live
                    </button>
                  )}
                </div>
              </div>

              {/* Navigation Controls */}
              <div className="flex items-center justify-center gap-2 mt-2">
                <button
                  onClick={goToPreviousSlide}
                  disabled={currentSlideIndex === 0}
                  className="p-2 bg-secondary rounded hover:bg-secondary/80 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  title="Previous slide"
                >
                  <SkipBack className="w-4 h-4" />
                </button>

                <div className="text-sm font-mono bg-secondary px-3 py-1 rounded">
                  {currentSlideIndex + 1} / {slides.length}
                </div>

                <button
                  onClick={goToNextSlide}
                  disabled={currentSlideIndex === slides.length - 1}
                  className="p-2 bg-secondary rounded hover:bg-secondary/80 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  title="Next slide"
                >
                  <SkipForward className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Large Slide Preview - Takes remaining space */}
            <div className="flex-1 min-h-0 flex items-center justify-center p-6 bg-gray-950 overflow-hidden">
              {currentSlide ? (
                <div className="w-full h-full">
                  <UnifiedSlideEditor
                    contentType="song"
                    slide={{
                      id: currentSlide.id,
                      shapes: currentSlide.shapes,
                      background: currentSlide.background
                    }}
                    slideIndex={currentSlideIndex}
                    onSlideChange={handleSlideChange}
                    editable={true}
                    showBackgroundToolbar={true}
                    showTypographyToolbar={true}
                    targetResolution={{ width: 1920, height: 1080 }}
                    className="w-full h-full"
                  />
                </div>
              ) : (
                <div className="text-center text-muted-foreground">
                  <Music className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <div>No slides generated</div>
                </div>
              )}
            </div>

            {/* Slide Thumbnails - Fixed at bottom */}
            <div className="flex-shrink-0 border-t border-border bg-card p-2 h-24">
              <div className="flex gap-2 overflow-x-auto h-full pb-1">
                {slides.map((slide, index) => (
                  <button
                    key={slide.id}
                    onClick={() => goToSlide(index)}
                    className={`
                      relative flex-shrink-0 w-28 h-full rounded border-2 overflow-hidden transition-all
                      ${index === currentSlideIndex
                        ? 'border-blue-500 ring-2 ring-blue-500/50'
                        : 'border-border hover:border-blue-400'}
                    `}
                  >
                    <SlideRenderer
                      slide={{
                        id: slide.id,
                        shapes: slide.shapes,
                        background: slide.background
                      }}
                      targetResolution={{ width: 1920, height: 1080 }}
                      className="w-full h-full"
                    />
                    <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white text-xs px-1 py-0.5 text-center">
                      {index + 1}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </Panel>

        {/* Right Panel - Settings & Metadata */}
        {panelVisibility.rightPanel && (
          <>
            <PanelResizeHandle className="w-1 bg-border hover:bg-blue-500 transition-colors" />
            <Panel defaultSize={25} minSize={20} maxSize={35}>
              <div className="h-full bg-card border-l border-border">
                <div className="flex items-center justify-between px-3 py-2 border-b border-border bg-secondary/50">
                  <div className="text-sm font-medium flex items-center gap-2">
                    <SettingsIcon className="w-4 h-4" />
                    Settings
                  </div>
                  <button
                    onClick={() => togglePanel('rightPanel')}
                    className="p-1 rounded hover:bg-muted transition-colors"
                    title="Collapse panel"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>

                <div className="p-3 overflow-y-auto space-y-4" style={{ height: 'calc(100vh - 160px)' }}>
                  <SongSlideSettingsPanel
                    settings={slideSettings}
                    onChange={setSlideSettings}
                  />

                  {/* Metadata at bottom */}
                  <SongMetadataEditor
                    metadata={metadata}
                    onChange={setMetadata}
                  />
                </div>
              </div>
            </Panel>
          </>
        )}
      </PanelGroup>
    </div>
  );
};

export default SongDetailsPage;
