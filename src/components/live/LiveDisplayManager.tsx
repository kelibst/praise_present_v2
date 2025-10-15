import React, { useState, useEffect } from 'react';
import { Monitor } from 'lucide-react';
import { CoordinateNormalizer, COORDINATE_SYSTEMS, Point, Bounds } from '../../rendering/utils/CoordinateTransform';
import { ShapeSerializer, SerializedSlide } from '../../rendering/serialization/ShapeSerializer';

// Types
interface Slide {
  id: string;
  shapes: any[];
  background?: {
    type: 'color' | 'image' | 'gradient';
    value: string;
  };
}

interface ServiceItem {
  id: string;
  type: 'scripture' | 'song' | 'announcement' | 'media' | 'sermon';
  title: string;
  content: any;
  slides?: Slide[];
}

// Hook for managing live display state and functions
export const useLiveDisplay = () => {
  const [liveDisplayActive, setLiveDisplayActive] = useState(false);
  const [liveDisplayStatus, setLiveDisplayStatus] = useState('Disconnected');

  // Check live display status on mount
  useEffect(() => {
    const checkStatus = async () => {
      if (window.electronAPI) {
        console.log('🔍 LiveDisplayManager: Checking initial live display status...');
        try {
          const status = await window.electronAPI.invoke('live-display:getStatus');
          console.log('🔍 LiveDisplayManager: Status received:', status);
          if (status?.hasWindow && status?.isVisible) {
            setLiveDisplayActive(true);
            setLiveDisplayStatus('Active');
            console.log('✅ LiveDisplayManager: Live display is active');
          } else {
            console.log('ℹ️ LiveDisplayManager: Live display is not active');
            setLiveDisplayActive(false);
            setLiveDisplayStatus('Disconnected');
          }
        } catch (error) {
          console.error('❌ LiveDisplayManager: Error checking status:', error);
          setLiveDisplayActive(false);
          setLiveDisplayStatus('Disconnected');
        }
      } else {
        console.warn('⚠️ LiveDisplayManager: No electronAPI available');
      }
    };
    checkStatus();
  }, []);

  const createLiveDisplay = async () => {
    try {
      console.log('🚀 LiveDisplayManager: Creating live display...');
      const result = await window.electronAPI?.invoke('live-display:create', {});
      console.log('🚀 LiveDisplayManager: Create result:', result);
      if (result?.success) {
        setLiveDisplayActive(true);
        setLiveDisplayStatus('Active');
        console.log('✅ LiveDisplayManager: Live display created successfully');
      } else {
        console.error('❌ LiveDisplayManager: Failed to create - result:', result);
        setLiveDisplayStatus('Error');
      }
    } catch (error) {
      console.error('❌ LiveDisplayManager: Failed to create live display:', error);
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

  const sendSlideToLive = async (slide: Slide, item: ServiceItem, slideIndex?: number, currentSlideIndex?: number) => {
    if (!liveDisplayActive) return;

    try {
      // Determine the slide index - either passed in or find it in the slides array
      let actualSlideIndex = slideIndex ?? 0;
      if (slideIndex === undefined && item.slides) {
        actualSlideIndex = item.slides.findIndex((s: Slide) => s.id === slide.id);
        if (actualSlideIndex === -1) actualSlideIndex = currentSlideIndex || 0;
      }

      // CRITICAL FIX: Send raw slide data to maintain rendering consistency
      // Instead of serializing, send the slide directly and let the live display
      // use the same rendering engine as preview
      const content = {
        type: 'template-slide',
        title: `${item.title} - Slide ${actualSlideIndex + 1}`,
        slide: {
          id: slide.id,
          shapes: slide.shapes, // Send raw shape objects
          background: slide.background
        },
        metadata: {
          itemType: item.type,
          slideIndex: actualSlideIndex,
          totalSlides: item.slides?.length || 1,
          renderingMode: 'unified', // Flag to indicate unified rendering path
          timestamp: Date.now()
        }
      };

      // Minimal logging to prevent console spam during presentations
      if (Math.random() < 0.1) { // Log only 10% of the time
        console.log(`📤 LiveDisplayManager: Sending slide ${actualSlideIndex + 1} with ${slide.shapes?.length || 0} shapes`);
      }

      await window.electronAPI?.invoke('live-display:sendContent', content);
    } catch (error) {
      console.error('Failed to send slide to live display:', error);
      // Try fallback serialization approach if direct sending fails
      try {
        const serializedSlide: SerializedSlide = ShapeSerializer.serializeSlide({
          id: slide.id,
          shapes: slide.shapes,
          background: slide.background
        });

        const fallbackContent = {
          type: 'template-slide',
          title: `${item.title} - Slide ${actualSlideIndex + 1}`,
          slide: serializedSlide,
          metadata: {
            itemType: item.type,
            slideIndex: actualSlideIndex,
            totalSlides: item.slides?.length || 1,
            renderingMode: 'fallback'
          }
        };

        await window.electronAPI?.invoke('live-display:sendContent', fallbackContent);
        console.warn('LiveDisplayManager: Used fallback serialization due to initial failure');
      } catch (fallbackError) {
        console.error('LiveDisplayManager: Both unified and fallback rendering failed:', fallbackError);
      }
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

  const sendMediaToLive = async (mediaItem: any, options: {
    fit?: 'contain' | 'cover' | 'fill';
    autoPlay?: boolean;
    loop?: boolean;
  } = {}) => {
    if (!liveDisplayActive) return;

    try {
      const content = {
        type: 'media',
        mediaType: mediaItem.type,
        mediaItem: {
          id: mediaItem.id,
          path: mediaItem.path,
          originalName: mediaItem.originalName,
          width: mediaItem.width,
          height: mediaItem.height,
          duration: mediaItem.duration,
        },
        displayOptions: {
          fit: options.fit || 'contain',
          autoPlay: options.autoPlay !== false, // Default to true
          loop: options.loop || false,
        },
        metadata: {
          timestamp: Date.now(),
        },
      };

      console.log('📤 LiveDisplayManager: Sending media to live display:', mediaItem.originalName);
      await window.electronAPI?.invoke('live-display:sendContent', content);
    } catch (error) {
      console.error('Failed to send media to live display:', error);
    }
  };

  return {
    liveDisplayActive,
    liveDisplayStatus,
    createLiveDisplay,
    closeLiveDisplay,
    sendSlideToLive,
    clearLiveDisplay,
    showBlackScreen,
    sendMediaToLive,
  };
};

// Live Display Controls Component
interface LiveDisplayControlsProps {
  liveDisplayActive: boolean;
  liveDisplayStatus: string;
  onCreateDisplay: () => void;
  onCloseDisplay: () => void;
  onClearDisplay: () => void;
  onShowBlack: () => void;
}

export const LiveDisplayControls: React.FC<LiveDisplayControlsProps> = ({
  liveDisplayActive,
  liveDisplayStatus,
  onCreateDisplay,
  onCloseDisplay,
  onClearDisplay,
  onShowBlack,
}) => {
  return (
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
            onClick={onCreateDisplay}
            className="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90 flex items-center gap-2"
          >
            <Monitor className="w-4 h-4" />
            Create Live Display
          </button>
        ) : (
          <>
            <button
              onClick={onClearDisplay}
              className="px-3 py-1 bg-orange-500 text-white rounded text-sm hover:bg-orange-600 border border-orange-600 hover:border-orange-700"
            >
              Clear
            </button>
            <button
              onClick={onShowBlack}
              className="px-3 py-1 bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900 rounded text-sm hover:bg-gray-800 dark:hover:bg-gray-200 border border-gray-900 dark:border-gray-100"
            >
              Black
            </button>
            <button
              onClick={onCloseDisplay}
              className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700 border border-red-600 hover:border-red-700"
            >
              Close
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default LiveDisplayControls;