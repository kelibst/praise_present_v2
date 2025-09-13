import React, { useState, useEffect } from 'react';
import { Play, Square, Monitor, MonitorSpeaker, SkipBack, SkipForward, Eye, Settings } from 'lucide-react';

// Import data (will be replaced with database queries later)
import { sampleScriptureVerses } from '../../data/sample-scripture';
import { sampleSongs } from '../../data/sample-songs';
import { sampleServices } from '../../data/sample-services';

// Import template system
import { ScriptureTemplate, SongTemplate, SlideGenerator, Shape } from '../rendering';
import { TemplateManager } from '../rendering/templates/TemplateManager';

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

  const sendSlideToLive = async (slide: Slide, item: PresentationItem) => {
    if (!liveDisplayActive) return;

    try {
      const content = {
        type: 'template-slide',
        title: `${item.title} - Slide ${currentSlideIndex + 1}`,
        slide: slide,
        metadata: {
          itemType: item.type,
          slideIndex: currentSlideIndex,
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
  const generateSlidesForItem = async (item: PresentationItem) => {
    try {
      let slides: Slide[] = [];

      if (item.type === 'scripture' && item.content.verses) {
        const scriptureTemplate = new ScriptureTemplate();
        for (const verse of item.content.verses) {
          const slide = await scriptureTemplate.createScriptureSlide(verse, 'reading');
          slides.push(slide);
        }
      } else if (item.type === 'song' && item.content.lyrics) {
        const songTemplate = new SongTemplate();
        slides = await songTemplate.createSongSlides(item.content);
      }

      const updatedItem = { ...item, slides };
      setSelectedItem(updatedItem);
      setCurrentSlideIndex(0);

      // Update the item in presentation items list
      setPresentationItems(prev =>
        prev.map(p => p.id === item.id ? updatedItem : p)
      );

    } catch (error) {
      console.error('Failed to generate slides:', error);
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
      await sendSlideToLive(selectedItem.slides[currentSlideIndex], selectedItem);
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

      <div className="flex h-[calc(100vh-80px)]">
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
                {presentationItems.map((item, index) => (
                  <div
                    key={item.id}
                    onClick={() => generateSlidesForItem(item)}
                    className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                      selectedItem?.id === item.id
                        ? 'border-blue-500 bg-blue-900/30'
                        : 'border-gray-600 bg-gray-700 hover:bg-gray-600'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">{item.title}</div>
                        <div className="text-sm text-gray-400 capitalize">
                          {item.type} {item.slides && `• ${item.slides.length} slides`}
                        </div>
                      </div>
                      <div className="text-xs text-gray-500">
                        {index + 1}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'scriptures' && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold mb-4">Scripture Verses</h3>
                {sampleScriptureVerses.map((verse, index) => (
                  <div
                    key={`verse-${index}`}
                    onClick={() => {
                      const scriptureItem: PresentationItem = {
                        id: `scripture-${index}`,
                        type: 'scripture',
                        title: `${verse.book} ${verse.chapter}:${verse.verse}`,
                        content: { verses: [{ ...verse, id: `verse-${index}`, translation: 'KJV' }] }
                      };
                      generateSlidesForItem(scriptureItem);
                    }}
                    className="p-3 rounded-lg border border-gray-600 bg-gray-700 hover:bg-gray-600 cursor-pointer"
                  >
                    <div className="font-medium">{verse.book} {verse.chapter}:{verse.verse}</div>
                    <div className="text-sm text-gray-400 mt-1 line-clamp-2">
                      {verse.text}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'songs' && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold mb-4">Songs</h3>
                {sampleSongs.map((song) => (
                  <div
                    key={song.id}
                    onClick={() => {
                      const songItem: PresentationItem = {
                        id: `song-${song.id}`,
                        type: 'song',
                        title: song.title,
                        content: song
                      };
                      generateSlidesForItem(songItem);
                    }}
                    className="p-3 rounded-lg border border-gray-600 bg-gray-700 hover:bg-gray-600 cursor-pointer"
                  >
                    <div className="font-medium">{song.title}</div>
                    <div className="text-sm text-gray-400">
                      {song.author} • {song.key} • {song.tempo} BPM
                    </div>
                  </div>
                ))}
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
                            fontSize: `${shape.fontSize || 24}px`,
                            color: shape.color || 'white'
                          }}
                        >
                          {shape.text}
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
              <div className="flex items-center justify-center gap-4 mt-4">
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
                  className="px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <Play className="w-4 h-4" />
                  Present Live
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
                            color: shape.color || 'white'
                          }}
                        >
                          {shape.text}
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
            <div className="mt-4 text-sm text-gray-400 text-center">
              {liveDisplayActive ? (
                isPresenting ? 'Currently presenting' : 'Live display ready'
              ) : (
                'Live display not active'
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LivePresentationPage;