import React, { useEffect, useState, useRef } from 'react';
import { SlideRenderer, Slide } from './slides/SlideRenderer';

/**
 * LiveDisplayRenderer - Full-screen slide renderer for live display window
 *
 * This component runs in the live display window (opened via mode=live-display)
 * and listens for content updates from the main window via IPC.
 *
 * Features:
 * - Full-screen slide rendering at 1920x1080
 * - Listens for content updates via IPC
 * - Supports black screen, clear content, and show logo commands
 * - Auto-scales to fit any display resolution
 */
interface LiveDisplayRendererProps {
  width?: number;
  height?: number;
}

const LiveDisplayRenderer: React.FC<LiveDisplayRendererProps> = ({
  width = 1920,
  height = 1080
}) => {
  const [currentSlide, setCurrentSlide] = useState<Slide | null>(null);
  const [isBlackScreen, setIsBlackScreen] = useState(false);
  const [showLogo, setShowLogo] = useState(false);

  useEffect(() => {
    console.log('LiveDisplayRenderer: Initializing live display renderer');

    // Set up IPC event listeners for live display commands

    // Listen for content updates
    let removeContentListener: (() => void) | undefined;
    if (window.electronAPI?.onLiveContentUpdate) {
      removeContentListener = window.electronAPI.onLiveContentUpdate((content: any) => {
        console.log('LiveDisplayRenderer: Received content update', content);
        setIsBlackScreen(false);
        setShowLogo(false);

        if (content && content.slide) {
          setCurrentSlide(content.slide);
        } else if (content) {
          // If content is sent directly as a slide
          setCurrentSlide(content);
        }
      });
    }

    // Listen for clear content command
    let removeClearListener: (() => void) | undefined;
    if (window.electronAPI?.onLiveContentClear) {
      removeClearListener = window.electronAPI.onLiveContentClear(() => {
        console.log('LiveDisplayRenderer: Clearing content');
        setCurrentSlide(null);
        setIsBlackScreen(false);
        setShowLogo(false);
      });
    }

    // Listen for black screen command
    let removeBlackListener: (() => void) | undefined;
    if (window.electronAPI?.onLiveShowBlack) {
      removeBlackListener = window.electronAPI.onLiveShowBlack(() => {
        console.log('LiveDisplayRenderer: Showing black screen');
        setIsBlackScreen(true);
        setShowLogo(false);
      });
    }

    // Listen for show logo command
    let removeLogoListener: (() => void) | undefined;
    if (window.electronAPI?.onLiveShowLogo) {
      removeLogoListener = window.electronAPI.onLiveShowLogo(() => {
        console.log('LiveDisplayRenderer: Showing logo');
        setShowLogo(true);
        setIsBlackScreen(false);
      });
    }

    // Initialize with placeholder/default content
    setCurrentSlide({
      id: 'placeholder',
      shapes: [],
      background: {
        type: 'color',
        value: '#000000'
      }
    });

    // Cleanup listeners on unmount
    return () => {
      console.log('LiveDisplayRenderer: Cleaning up listeners');
      removeContentListener?.();
      removeClearListener?.();
      removeBlackListener?.();
      removeLogoListener?.();
    };
  }, []);

  // Render black screen
  if (isBlackScreen) {
    return (
      <div
        style={{
          width: '100vw',
          height: '100vh',
          backgroundColor: '#000000',
          margin: 0,
          padding: 0,
          overflow: 'hidden'
        }}
      />
    );
  }

  // Render logo screen
  if (showLogo) {
    return (
      <div
        style={{
          width: '100vw',
          height: '100vh',
          backgroundColor: '#1a1a2e',
          margin: 0,
          padding: 0,
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
          gap: '2rem'
        }}
      >
        <div
          style={{
            fontSize: '6rem',
            fontWeight: 'bold',
            color: '#ffffff',
            textAlign: 'center',
            fontFamily: 'Arial, sans-serif'
          }}
        >
          PraisePresent
        </div>
        <div
          style={{
            fontSize: '2rem',
            color: '#cbd5e0',
            textAlign: 'center',
            fontFamily: 'Arial, sans-serif'
          }}
        >
          Live Display Ready
        </div>
      </div>
    );
  }

  // Render current slide or placeholder
  return (
    <div
      style={{
        width: '100vw',
        height: '100vh',
        margin: 0,
        padding: 0,
        overflow: 'hidden',
        backgroundColor: '#000000'
      }}
    >
      {currentSlide ? (
        <SlideRenderer
          slide={currentSlide}
          targetResolution={{ width, height }}
          className="live-display-slide"
        />
      ) : (
        <div
          style={{
            width: '100%',
            height: '100%',
            backgroundColor: '#000000',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ffffff',
            fontSize: '2rem',
            fontFamily: 'Arial, sans-serif'
          }}
        >
          Waiting for content...
        </div>
      )}
    </div>
  );
};

export default LiveDisplayRenderer;
