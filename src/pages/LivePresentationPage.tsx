import React, { useState, useEffect } from 'react';
import { Play, Square, Monitor, MonitorSpeaker, SkipBack, SkipForward, Eye, Settings } from 'lucide-react';

// Import data (will be replaced with database queries later)
import { sampleSongs } from '../../data/sample-songs';
import { sampleServices } from '../../data/sample-services';

// Import template system
import { ScriptureTemplate, SongTemplate, SlideGenerator, Shape } from '../rendering';
import { TemplateManager } from '../rendering/templates/TemplateManager';
import { DEFAULT_SLIDE_SIZE } from '../rendering/templates/templateUtils';
import BibleSelector from '../components/bible/BibleSelector';
import SongLibrary from '../components/songs/SongLibrary';

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

interface PresentationItem {
  id: string;
  type: 'scripture' | 'song' | 'announcement' | 'media';
  title: string;
  content: any;
  slides?: Slide[];
  duration?: number;
}

interface LivePresentationPageProps {}

export const LivePresentationPage: React.FC<LivePresentationPageProps> = () => {
  // State management
  const [activeTab, setActiveTab] = useState<'plan' | 'scriptures' | 'songs'>('plan');
  const [presentationItems, setPresentationItems] = useState<PresentationItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<PresentationItem | null>(null);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [isPresenting, setIsPresenting] = useState(false);
  const [isGeneratingSlides, setIsGeneratingSlides] = useState(false);
  const [presentationMode, setPresentationMode] = useState<'preview' | 'live'>('preview');

  // Live display state (using standardized pattern)
  const [liveDisplayActive, setLiveDisplayActive] = useState(false);
  const [liveDisplayStatus, setLiveDisplayStatus] = useState('Disconnected');

  // Template system
  const [templateManager] = useState(() => new TemplateManager());
  const [slideGenerator] = useState(() => new SlideGenerator());

  // Initialize with sample service data
  useEffect(() => {
    if (sampleServices.length > 0) {
      const serviceItems = sampleServices[0].items.map(item => ({
        id: item.id,
        type: item.type as 'scripture' | 'song' | 'announcement',
        title: item.title,
        content: item.content,
        duration: item.duration
      }));
      setPresentationItems(serviceItems);
    }
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

      // Serialize shapes to plain objects for IPC
      const serializeShape = (shape: any) => {
        return {
          id: shape.id,
          type: shape.type,
          position: shape.position,
          size: shape.size,
          rotation: shape.rotation,
          opacity: shape.opacity,
          zIndex: shape.zIndex,
          visible: shape.visible,
          transform: shape.transform,
          style: shape.style,
          // Text-specific properties
          ...(shape.type === 'text' && {
            text: shape.text,
            textStyle: shape.textStyle,
            autoSize: shape.autoSize,
            wordWrap: shape.wordWrap,
            maxLines: shape.maxLines
          }),
          // Background-specific properties
          ...(shape.type === 'background' && {
            backgroundStyle: shape.backgroundStyle
          }),
          // Rectangle-specific properties
          ...(shape.type === 'rectangle' && {
            fillColor: shape.fillColor,
            strokeColor: shape.strokeColor,
            strokeWidth: shape.strokeWidth,
            borderRadius: shape.borderRadius
          })
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
  const generateSlidesForItem = async (item: PresentationItem, autoPresent = false) => {
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

      // Update the item in presentation items list
      setPresentationItems(prev =>
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
  const handleServiceItemSelect = (item: PresentationItem, event: React.MouseEvent) => {
    event.stopPropagation();
    generateSlidesForItem(item, false);
  };

  // Handle service item presentation (double click)
  const handleServiceItemPresent = async (item: PresentationItem, event: React.MouseEvent) => {
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

  const currentSlide = selectedItem?.slides?.[currentSlideIndex];

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <MonitorSpeaker className="w-8 h-8 text-blue-400" />
            <h1 className="text-2xl font-bold">Live Presentation</h1>
          </div>

          {/* Live Display Controls */}
          {window.electronAPI && (
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-400">
                Live Display: <span className={
                  liveDisplayStatus === 'Active' ? 'text-green-400' :
                  liveDisplayStatus === 'Error' ? 'text-red-400' : 'text-yellow-400'
                }>{liveDisplayStatus}</span>
              </div>
              <div className="flex gap-2">
                {!liveDisplayActive ? (
                  <button
                    onClick={createLiveDisplay}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center gap-2"
                  >
                    <Monitor className="w-4 h-4" />
                    Create Live Display
                  </button>
                ) : (
                  <>
                    <button
                      onClick={clearLiveDisplay}
                      className="px-3 py-1 bg-yellow-600 text-white rounded text-sm hover:bg-yellow-700"
                    >
                      Clear
                    </button>
                    <button
                      onClick={showBlackScreen}
                      className="px-3 py-1 bg-gray-700 text-white rounded text-sm hover:bg-gray-600"
                    >
                      Black
                    </button>
                    <button
                      onClick={closeLiveDisplay}
                      className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
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
      <div className="bg-gray-800 border-b border-gray-700 px-4 py-2">
        <div className="text-xs text-gray-400 text-center">
          <span className="font-medium text-gray-300">Keyboard Shortcuts:</span>
          <span className="mx-2">Space/Enter/→ Next</span>
          <span className="mx-2">Backspace/← Prev</span>
          <span className="mx-2">F Present</span>
          <span className="mx-2">B Black</span>
          <span className="mx-2">Esc Clear</span>
        </div>
      </div>

      <div className="flex h-[calc(100vh-120px)]">
        {/* Left Panel - Tabs and Content */}
        <div className="w-1/3 bg-gray-800 border-r border-gray-700">
          {/* Tab Navigation */}
          <div className="flex border-b border-gray-700">
            {[
              { key: 'plan', label: 'Presentation Plan', icon: Settings },
              { key: 'scriptures', label: 'Scriptures', icon: Eye },
              { key: 'songs', label: 'Songs', icon: Play }
            ].map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key as any)}
                className={`flex-1 px-4 py-3 text-sm font-medium border-r border-gray-700 last:border-r-0 flex items-center justify-center gap-2 ${
                  activeTab === key
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
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
                <h3 className="text-lg font-semibold mb-4">Service Items</h3>
                {presentationItems.map((item, index) => {
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
                            ? 'border-green-500 bg-green-900/30 shadow-lg'
                            : 'border-blue-500 bg-blue-900/30 shadow-md'
                          : 'border-gray-600 bg-gray-700 hover:bg-gray-600 hover:border-gray-500'
                      } ${isLoading ? 'animate-pulse' : ''}`}
                      title={`Single click to preview • Double click to present live`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <div className="font-medium">{item.title}</div>
                            {isLoading && (
                              <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                            )}
                            {isPresentingThis && (
                              <div className="px-2 py-1 bg-green-600 text-white text-xs rounded-full font-medium">
                                LIVE
                              </div>
                            )}
                          </div>
                          <div className="text-sm text-gray-400 capitalize">
                            {item.type} {item.slides && `• ${item.slides.length} slides`}
                            {item.duration && ` • ${item.duration}s`}
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <div className="text-xs text-gray-500">
                            #{index + 1}
                          </div>
                          {isSelected && (
                            <div className="text-xs text-blue-400">
                              {presentationMode === 'live' ? 'Live' : 'Preview'}
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

                      const scriptureItem: PresentationItem = {
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
                <div className="border-t border-gray-700 pt-4">
                  <h4 className="text-sm font-medium text-gray-300 mb-2">Popular Verses</h4>
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

                          const scriptureItem: PresentationItem = {
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
                        className="w-full text-left p-2 rounded border border-gray-700 bg-gray-800 hover:bg-gray-700 text-sm"
                      >
                        <div className="font-medium text-blue-400">{verse.ref}</div>
                        <div className="text-gray-400 text-xs">{verse.text}</div>
                      </button>
                    ))}
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
                    const songItem: PresentationItem = {
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

        {/* Center Panel - Preview */}
        <div className="flex-1 bg-gray-900 p-4">
          <div className="h-full flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Preview</h3>
              {selectedItem && (
                <div className="text-sm text-gray-400">
                  {selectedItem.title} - Slide {currentSlideIndex + 1} of {selectedItem.slides?.length || 0}
                </div>
              )}
            </div>

            {/* Preview Screen */}
            <div className="flex-1 bg-black rounded-lg border border-gray-700 flex items-center justify-center">
              {currentSlide ? (
                <div className="w-full h-full p-8 flex flex-col justify-center">
                  {currentSlide.shapes.map((shape, index) => (
                    <div key={index} className="mb-4">
                      {shape.type === 'text' && (
                        <div
                          className="text-white text-center"
                          style={{
                            fontSize: `${(shape as any).textStyle?.fontSize || 24}px`,
                            color: (shape as any).textStyle?.color ?
                              `rgba(${(shape as any).textStyle.color.r}, ${(shape as any).textStyle.color.g}, ${(shape as any).textStyle.color.b}, ${(shape as any).textStyle.color.a})` :
                              'white'
                          }}
                        >
                          {(shape as any).text}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-gray-500">
                  Select an item to preview slides
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
                    className="px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
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
                    className="px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    Next
                    <SkipForward className="w-4 h-4" />
                  </button>
                </div>

                {/* Presentation Mode Indicator */}
                <div className="text-center">
                  <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm ${
                    presentationMode === 'live'
                      ? 'bg-green-900/50 text-green-300 border border-green-600'
                      : 'bg-blue-900/50 text-blue-300 border border-blue-600'
                  }`}>
                    {presentationMode === 'live' ? (
                      <>Live Mode - Changes go directly to display</>
                    ) : (
                      <>Preview Mode - Click 'Present Live' to display</>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Panel - Live Display Preview */}
        <div className="w-1/3 bg-gray-800 border-l border-gray-700 p-4">
          <div className="h-full flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Live Display</h3>
              <div className={`px-2 py-1 rounded text-xs ${
                liveDisplayActive ? 'bg-green-900 text-green-300' : 'bg-red-900 text-red-300'
              }`}>
                {liveDisplayActive ? 'LIVE' : 'OFF'}
              </div>
            </div>

            {/* Live Display Preview */}
            <div className="flex-1 bg-black rounded-lg border border-gray-700 flex items-center justify-center">
              {liveDisplayActive && isPresenting ? (
                <div className="w-full h-full p-4 flex flex-col justify-center">
                  {currentSlide?.shapes.map((shape, index) => (
                    <div key={index} className="mb-2">
                      {shape.type === 'text' && (
                        <div
                          className="text-white text-center text-sm"
                          style={{
                            color: (shape as any).textStyle?.color ?
                              `rgba(${(shape as any).textStyle.color.r}, ${(shape as any).textStyle.color.g}, ${(shape as any).textStyle.color.b}, ${(shape as any).textStyle.color.a})` :
                              'white'
                          }}
                        >
                          {(shape as any).text}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-gray-500 text-center">
                  {liveDisplayActive ? 'Ready for presentation' : 'Create live display to see preview'}
                </div>
              )}
            </div>

            {/* Live Status */}
            <div className="mt-4 text-sm text-gray-400 text-center space-y-2">
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
                <div className="text-xs text-gray-500">
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