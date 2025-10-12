import React, { useEffect, useState } from 'react';
import { SlideViewer, Slide } from './slides';

interface LiveDisplayRendererProps {
  width?: number;
  height?: number;
}

interface LiveContent {
  type: 'template-slide' | 'black' | 'logo' | 'placeholder';
  title?: string;
  slide?: Slide;
  metadata?: {
    itemType?: string;
    slideIndex?: number;
    totalSlides?: number;
    renderingMode?: string;
    timestamp?: number;
  };
}

/**
 * LiveDisplayRenderer - PowerPoint Pattern for Live Display
 * 
 * This component handles the live display window rendering using our new
 * SlideViewer component. It maintains the same IPC interface but uses
 * the simplified rendering architecture.
 */
export const LiveDisplayRenderer: React.FC<LiveDisplayRendererProps> = ({
  width = 1920,
  height = 1080
}) => {
  const [currentContent, setCurrentContent] = useState<LiveContent | null>(null);
  const [connectionStatus, setConnectionStatus] = useState('Initializing...');

  // Handle content updates from main process
  useEffect(() => {
    const handleContentUpdate = (content: LiveContent) => {
      console.log('🎬 LiveDisplayRenderer: Content updated', {
        type: content.type,
        hasSlide: !!content.slide,
        slideId: content.slide?.id,
        shapeCount: content.slide?.shapes?.length
      });
      
      setCurrentContent(content);
      setConnectionStatus('Connected');
    };

    const handleContentClear = () => {
      console.log('🧹 LiveDisplayRenderer: Content cleared');
      setCurrentContent(null);
    };

    const handleShowBlack = () => {
      console.log('⚫ LiveDisplayRenderer: Show black screen');
      setCurrentContent({ type: 'black' });
    };

    const handleShowLogo = () => {
      console.log('🏢 LiveDisplayRenderer: Show logo');
      setCurrentContent({ type: 'logo' });
    };

    // Set up IPC listeners if in Electron environment
    if (window.electronAPI) {
      const cleanupFunctions: Array<() => void> = [];

      cleanupFunctions.push(
        window.electronAPI.onLiveContentUpdate?.(handleContentUpdate) || (() => {})
      );
      cleanupFunctions.push(
        window.electronAPI.onLiveContentClear?.(handleContentClear) || (() => {})
      );
      cleanupFunctions.push(
        window.electronAPI.onLiveShowBlack?.(handleShowBlack) || (() => {})
      );
      cleanupFunctions.push(
        window.electronAPI.onLiveShowLogo?.(handleShowLogo) || (() => {})
      );

      setConnectionStatus('Connected');

      return () => {
        cleanupFunctions.forEach(cleanup => {
          try {
            cleanup();
          } catch (error) {
            console.warn('Error cleaning up listener:', error);
          }
        });
      };
    } else {
      setConnectionStatus('Not in Electron environment');
    }
  }, []);

  // Detect live display mode
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const mode = urlParams.get('mode');

    if (mode === 'live-display') {
      console.log('🎭 LiveDisplayRenderer: Live display mode detected');
      setConnectionStatus('Live Display Mode');
    }
  }, []);

  // Render content based on type
  const renderContent = () => {
    if (!currentContent) {
      return (
        <div className="w-full h-full flex items-center justify-center bg-black text-white">
          <div className="text-center">
            <div className="text-6xl mb-4">🎭</div>
            <div className="text-2xl">Ready for Presentation</div>
            <div className="text-lg mt-2 opacity-70">Waiting for content...</div>
          </div>
        </div>
      );
    }

    switch (currentContent.type) {
      case 'template-slide':
        if (currentContent.slide) {
          return (
            <SlideViewer
              slide={currentContent.slide}
              className="w-full h-full"
            />
          );
        }
        break;

      case 'black':
        return <div className="w-full h-full bg-black" />;

      case 'logo':
        return (
          <div className="w-full h-full flex items-center justify-center bg-black text-white">
            <div className="text-center">
              <div className="text-8xl mb-6">🏢</div>
              <div className="text-4xl font-bold">PraisePresent</div>
              <div className="text-xl mt-2 opacity-70">Presentation Software</div>
            </div>
          </div>
        );

      default:
        return (
          <div className="w-full h-full flex items-center justify-center bg-gray-900 text-white">
            <div className="text-center">
              <div className="text-4xl mb-4">❓</div>
              <div className="text-xl">Unknown Content Type</div>
              <div className="text-sm mt-2 opacity-70">{currentContent.type}</div>
            </div>
          </div>
        );
    }

    return null;
  };

  return (
    <div 
      className="relative overflow-hidden bg-black"
      style={{
        width: '100vw',
        height: '100vh',
        position: 'fixed',
        top: 0,
        left: 0,
        zIndex: 9999
      }}
    >
      {renderContent()}

      {/* Development info overlay */}
      {process.env.NODE_ENV === 'development' && (
        <div className="absolute bottom-4 left-4 z-10 bg-black bg-opacity-70 text-white text-xs px-3 py-2 rounded">
          <div>Status: {connectionStatus}</div>
          {currentContent && (
            <>
              <div>Type: {currentContent.type}</div>
              {currentContent.title && <div>Title: {currentContent.title}</div>}
              {currentContent.slide && (
                <div>Shapes: {currentContent.slide.shapes?.length || 0}</div>
              )}
              {currentContent.metadata && (
                <div>Mode: {currentContent.metadata.renderingMode}</div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default LiveDisplayRenderer;
