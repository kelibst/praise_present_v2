import React, { useState, useEffect } from 'react';
import { Monitor } from 'lucide-react';

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