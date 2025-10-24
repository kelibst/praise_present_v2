import React, { useRef, useEffect } from 'react';
import { Slide } from '../../slides';

interface ThumbnailStripProps {
  slides: Slide[];
  currentSlideIndex: number;
  onSlideClick: (index: number) => void;
}

/**
 * Horizontal strip of slide thumbnails with auto-scroll to active slide
 */
export const ThumbnailStrip: React.FC<ThumbnailStripProps> = ({
  slides,
  currentSlideIndex,
  onSlideClick
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const thumbnailRefs = useRef<(HTMLButtonElement | null)[]>([]);

  // Reset thumbnail refs when slides change
  useEffect(() => {
    thumbnailRefs.current = [];
  }, [slides]);

  // Auto-scroll thumbnails to keep active slide in view
  useEffect(() => {
    if (thumbnailRefs.current[currentSlideIndex] && containerRef.current) {
      const thumbnail = thumbnailRefs.current[currentSlideIndex];
      const container = containerRef.current;

      if (thumbnail && container) {
        // Calculate the thumbnail's position relative to the container
        const thumbnailRect = thumbnail.getBoundingClientRect();
        const containerRect = container.getBoundingClientRect();

        // Check if thumbnail is out of view
        if (thumbnailRect.left < containerRect.left || thumbnailRect.right > containerRect.right) {
          // Scroll the thumbnail into view
          thumbnail.scrollIntoView({
            behavior: 'smooth',
            block: 'nearest',
            inline: 'center'
          });
        }
      }
    }
  }, [currentSlideIndex]);

  if (slides.length <= 1) {
    return null;
  }

  return (
    <div className="mb-3">
      <div className="text-xs text-muted-foreground mb-1 font-medium">Slides</div>
      <div
        ref={containerRef}
        className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-primary/20 scrollbar-track-transparent"
      >
        {slides.map((slide, index) => (
          <button
            key={slide.id}
            ref={(el) => { thumbnailRefs.current[index] = el; }}
            onClick={() => onSlideClick(index)}
            className={`flex-shrink-0 border-2 rounded transition-all ${
              index === currentSlideIndex
                ? 'border-primary ring-2 ring-primary/50 scale-105'
                : 'border-border hover:border-primary/50'
            }`}
            title={`Slide ${index + 1}`}
          >
            <div className="relative w-24 h-16 bg-background overflow-hidden rounded">
              {/* Mini slide preview */}
              <div className="absolute inset-0 p-1 text-xs">
                <div className={`w-full h-full flex items-center justify-center ${
                  slide.background?.type === 'color' ? '' : 'bg-secondary'
                }`}
                  style={{
                    backgroundColor: slide.background?.type === 'color' ? slide.background.value : undefined,
                    backgroundImage: slide.background?.type === 'image' ? `url(${slide.background.value})` :
                                     slide.background?.type === 'gradient' ? slide.background.value : undefined,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center'
                  }}
                >
                  {/* Show text content preview if available */}
                  {slide.shapes && slide.shapes.length > 0 && (
                    <div className="text-[6px] text-center text-foreground/70 line-clamp-3 px-1">
                      {slide.shapes
                        .filter(shape => shape.type === 'text' && (shape as any).text)
                        .map(shape => (shape as any).text)
                        .join(' ')
                        .slice(0, 50)}
                    </div>
                  )}
                </div>
              </div>
              {/* Slide number badge */}
              <div className={`absolute bottom-0 right-0 px-1 text-[10px] font-semibold rounded-tl ${
                index === currentSlideIndex
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary text-secondary-foreground'
              }`}>
                {index + 1}
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};
