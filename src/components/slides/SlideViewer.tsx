import React from 'react';
import { SlideRenderer, Slide } from './SlideRenderer';

interface SlideViewerProps {
  /**
   * The slide to display
   */
  slide: Slide;

  /**
   * Target resolution for rendering
   * Default: 1920x1080 (Full HD presentation standard)
   */
  targetResolution?: { width: number; height: number };

  /**
   * Optional CSS class for the container
   */
  className?: string;
}

/**
 * SlideViewer - Display-only slide viewer
 *
 * This component wraps SlideRenderer to provide a simple
 * display-only view of a slide. It has no editing capabilities.
 *
 * Use this for:
 * - Live display monitors
 * - Thumbnails
 * - Read-only previews
 * - Presentation windows
 *
 * For editing capabilities, use SlideEditor instead.
 */
export const SlideViewer: React.FC<SlideViewerProps> = ({
  slide,
  targetResolution,
  className = ''
}) => {
  return (
    <div
      className={`relative w-full h-full ${className}`}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}
    >
      <div style={{
        width: '100%',
        height: '100%',
        aspectRatio: '16/9',
        maxWidth: '100%',
        maxHeight: '100%'
      }}>
        <SlideRenderer
          slide={slide}
          targetResolution={targetResolution}
        />
      </div>
    </div>
  );
};

export default SlideViewer;
