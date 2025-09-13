import React, { useState, useEffect } from 'react';
import { templateManager } from '../rendering/templates/TemplateManager';
import { slideGenerator } from '../rendering/SlideGenerator';

interface ContentItem {
  id: string;
  type: 'song' | 'scripture' | 'announcement';
  title: string;
  data: any;
}

interface ContentLibraryLiveDisplayProps {
  items: ContentItem[];
  className?: string;
}

export const ContentLibraryLiveDisplay: React.FC<ContentLibraryLiveDisplayProps> = ({
  items,
  className = ''
}) => {
  const [liveDisplayActive, setLiveDisplayActive] = useState(false);
  const [liveDisplayStatus, setLiveDisplayStatus] = useState('Disconnected');
  const [selectedItem, setSelectedItem] = useState<ContentItem | null>(null);
  const [generatingSlide, setGeneratingSlide] = useState<string | null>(null);
  const [generatedSlides, setGeneratedSlides] = useState<Map<string, any[]>>(new Map());

  // Live Display Functions (from standardized pattern in CLAUDE.md)
  const createLiveDisplay = async () => {
    try {
      console.log('Creating live display...');
      const result = await window.electronAPI?.invoke('live-display:create', {});
      if (result?.success) {
        setLiveDisplayActive(true);
        setLiveDisplayStatus('Active');
        console.log('Live display created successfully');
      }
    } catch (error) {
      console.error('Failed to create live display:', error);
      setLiveDisplayStatus('Error');
    }
  };

  const closeLiveDisplay = async () => {
    try {
      console.log('Closing live display...');
      await window.electronAPI?.invoke('live-display:close');
      setLiveDisplayActive(false);
      setLiveDisplayStatus('Disconnected');
      console.log('Live display closed');
    } catch (error) {
      console.error('Failed to close live display:', error);
    }
  };

  const clearLiveDisplay = async () => {
    if (!liveDisplayActive) return;
    try {
      console.log('Clearing live display...');
      await window.electronAPI?.invoke('live-display:clearContent');
    } catch (error) {
      console.error('Failed to clear live display:', error);
    }
  };

  const showBlackScreen = async () => {
    if (!liveDisplayActive) return;
    try {
      console.log('Showing black screen...');
      await window.electronAPI?.invoke('live-display:showBlack');
    } catch (error) {
      console.error('Failed to show black screen:', error);
    }
  };

  // Phase 3: Template-to-Live Generation Pipeline
  const generateAndSendToLive = async (item: ContentItem) => {
    if (!liveDisplayActive) {
      console.warn('Live display not active');
      return;
    }

    setGeneratingSlide(item.id);
    try {
      // Check if we already have generated slides for this item
      let slides = generatedSlides.get(item.id);

      if (!slides) {
        console.log(`Generating slides for ${item.type}: ${item.title}`);

        // Initialize template system if needed
        templateManager.initialize();

        // Generate slides using template system
        slides = await slideGenerator.generateSlidesFromContent(item, {
          slideSize: { width: 1920, height: 1080 },
          onProgress: (progress) => {
            console.log(`Generating ${item.title}: ${progress.phase} (${progress.percentage}%)`);
          }
        });

        if (!slides || slides.length === 0) {
          throw new Error(`No slides generated for ${item.type}: ${item.title}`);
        }

        // Cache the generated slides
        setGeneratedSlides(prev => new Map(prev).set(item.id, slides!));
        console.log(`Generated ${slides.length} slides for ${item.title}`);
      }

      // Send first slide to live display (Phase 3: Pre-generated shapes for optimal performance)
      const firstSlide = slides[0];
      const content = {
        type: 'template-generated' as const,
        title: `${item.title} - ${firstSlide.title || 'Slide 1'}`,
        templateId: firstSlide.templateId,
        slideData: {
          shapes: firstSlide.shapes,
          slideSize: { width: 1920, height: 1080 },
          slideIndex: 0,
          totalSlides: slides.length
        },
        content: {
          originalContent: item.data,
          contentType: item.type,
          generatedAt: new Date().toISOString()
        }
      };

      console.log(`Sending ${item.type} to live display: ${firstSlide.shapes.length} shapes`);
      await window.electronAPI?.invoke('live-display:sendContent', content);
      setSelectedItem(item);

    } catch (error) {
      console.error(`Failed to generate/send ${item.type} to live display:`, error);
    } finally {
      setGeneratingSlide(null);
    }
  };

  // Check live display status on component mount
  useEffect(() => {
    const checkLiveDisplayStatus = async () => {
      try {
        const status = await window.electronAPI?.invoke('live-display:getStatus');
        if (status?.hasWindow && status?.isVisible) {
          setLiveDisplayActive(true);
          setLiveDisplayStatus('Active');
        } else {
          setLiveDisplayActive(false);
          setLiveDisplayStatus('Disconnected');
        }
      } catch (error) {
        console.error('Failed to get live display status:', error);
        setLiveDisplayStatus('Error');
      }
    };

    if (window.electronAPI) {
      checkLiveDisplayStatus();
    }
  }, []);

  const getItemIcon = (type: string) => {
    switch (type) {
      case 'song': return '🎵';
      case 'scripture': return '📖';
      case 'announcement': return '📢';
      default: return '📄';
    }
  };

  const getItemColor = (type: string) => {
    switch (type) {
      case 'song': return 'border-blue-200 bg-blue-50';
      case 'scripture': return 'border-green-200 bg-green-50';
      case 'announcement': return 'border-orange-200 bg-orange-50';
      default: return 'border-gray-200 bg-gray-50';
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Content Library - Live Display</h3>
        <div className="text-sm text-gray-500">
          Phase 3: Template-to-Live Pipeline
        </div>
      </div>

      {/* Live Display Controls */}
      {window.electronAPI && (
        <div className="p-3 bg-gray-100 rounded-lg border">
          <div className="flex flex-wrap gap-2 items-center justify-center">
            <div className="text-sm text-gray-600 mr-4">
              Live Display: <span className={
                liveDisplayStatus === 'Active' ? 'text-green-600' :
                liveDisplayStatus === 'Error' ? 'text-red-600' : 'text-yellow-600'
              }>{liveDisplayStatus}</span>
            </div>

            <div className="flex gap-2">
              {!liveDisplayActive ? (
                <button
                  onClick={createLiveDisplay}
                  className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                >
                  Create Live Display
                </button>
              ) : (
                <>
                  <button
                    onClick={clearLiveDisplay}
                    className="px-3 py-1 bg-yellow-600 text-white rounded text-sm hover:bg-yellow-700"
                  >
                    Clear Live
                  </button>

                  <button
                    onClick={showBlackScreen}
                    className="px-3 py-1 bg-gray-700 text-white rounded text-sm hover:bg-gray-600"
                  >
                    Black Screen
                  </button>

                  <button
                    onClick={closeLiveDisplay}
                    className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
                  >
                    Close Live
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Content Items */}
      <div className="grid gap-3">
        {items.map((item) => (
          <div
            key={item.id}
            className={`p-4 border rounded-lg ${getItemColor(item.type)} ${
              selectedItem?.id === item.id ? 'ring-2 ring-blue-500' : ''
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <span className="text-xl">{getItemIcon(item.type)}</span>
                <div>
                  <div className="font-medium text-gray-900">{item.title}</div>
                  <div className="text-sm text-gray-500 capitalize">{item.type}</div>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => generateAndSendToLive(item)}
                  disabled={!liveDisplayActive || generatingSlide === item.id}
                  className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {generatingSlide === item.id ? 'Generating...' : 'Send to Live'}
                </button>

                {generatedSlides.has(item.id) && (
                  <div className="text-xs text-gray-500 px-2 py-1 bg-white rounded border">
                    {generatedSlides.get(item.id)?.length} slides cached
                  </div>
                )}
              </div>
            </div>

            {/* Preview of content data */}
            <div className="mt-2 text-xs text-gray-600 bg-white p-2 rounded border">
              {item.type === 'song' && (
                <div>Key: {item.data.key} | Tempo: {item.data.tempo} BPM | CCLI: {item.data.ccli}</div>
              )}
              {item.type === 'scripture' && (
                <div>{item.data.reference} ({item.data.translation})</div>
              )}
              {item.type === 'announcement' && (
                <div>{item.data.date} | {item.data.location}</div>
              )}
            </div>
          </div>
        ))}
      </div>

      {selectedItem && (
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="text-sm font-medium text-blue-900">Currently Live:</div>
          <div className="text-sm text-blue-700">{selectedItem.title}</div>
        </div>
      )}
    </div>
  );
};