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
        const status = await window.electronAPI.invoke('live-display:getStatus');
        if (status?.hasWindow && status?.isVisible) {
          setLiveDisplayActive(true);
          setLiveDisplayStatus('Active');
        }
      }
    };
    checkStatus();
  }, []);

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

  const sendSlideToLive = async (slide: Slide, item: ServiceItem, slideIndex?: number, currentSlideIndex?: number) => {
    if (!liveDisplayActive) return;

    try {
      // Determine the slide index - either passed in or find it in the slides array
      let actualSlideIndex = slideIndex ?? 0;
      if (slideIndex === undefined && item.slides) {
        actualSlideIndex = item.slides.findIndex((s: Slide) => s.id === slide.id);
        if (actualSlideIndex === -1) actualSlideIndex = currentSlideIndex || 0;
      }

      // Use simplified serializer with standardized coordinates
      const serializedSlide: SerializedSlide = ShapeSerializer.serializeSlide({
        id: slide.id,
        shapes: slide.shapes,
        background: slide.background
      });

      // Log serialization summary for debugging
      const summary = ShapeSerializer.createSerializationSummary(slide.shapes);
      console.log(`📤 LiveDisplayManager: Serializing slide with ${summary.totalShapes} shapes (${summary.totalSize} bytes)`, summary);

      const content = {
        type: 'template-slide',
        title: `${item.title} - Slide ${actualSlideIndex + 1}`,
        slide: serializedSlide,
        metadata: {
          ...serializedSlide.metadata,
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

  return {
    liveDisplayActive,
    liveDisplayStatus,
    createLiveDisplay,
    closeLiveDisplay,
    sendSlideToLive,
    clearLiveDisplay,
    showBlackScreen,
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