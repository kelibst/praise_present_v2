import React from 'react';
import { SlideRenderer } from '../../slides/SlideRenderer';
import { GeneratedSlide } from '../../../rendering/content/ContentType';

interface ScriptureLivePreviewProps {
  slides: GeneratedSlide[];
  currentIndex: number;
  onIndexChange: (index: number) => void;
}

export const ScriptureLivePreview: React.FC<ScriptureLivePreviewProps> = ({
  slides,
  currentIndex,
  onIndexChange
}) => {
  if (slides.length === 0) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-900 rounded">
        <div className="text-center text-gray-400">
          <p className="text-lg">No slides generated</p>
          <p className="text-sm mt-2">Fetch verses to generate slides</p>
        </div>
      </div>
    );
  }

  const currentSlide = slides[currentIndex];

  return (
    <div className="flex flex-col h-full">
      {/* Slide Preview */}
      <div className="flex-1 bg-gray-900 rounded overflow-hidden relative">
        <div className="w-full h-full flex items-center justify-center p-4">
          <div className="relative w-full" style={{ maxHeight: '100%', aspectRatio: '16/9' }}>
            <div className="absolute inset-0">
              <SlideRenderer
                slide={currentSlide}
                targetResolution={{ width: 1920, height: 1080 }}
              />
            </div>
          </div>
        </div>

        {/* Slide Counter */}
        {slides.length > 1 && (
          <div className="absolute top-4 right-4 px-3 py-1 bg-black bg-opacity-50 rounded text-white text-sm">
            {currentIndex + 1} / {slides.length}
          </div>
        )}
      </div>

      {/* Navigation Controls */}
      {slides.length > 1 && (
        <div className="mt-4 flex items-center justify-between">
          <button
            onClick={() => onIndexChange(Math.max(0, currentIndex - 1))}
            disabled={currentIndex === 0}
            className={`
              px-4 py-2 rounded font-medium transition-colors flex items-center gap-2
              ${currentIndex === 0
                ? 'bg-gray-800 text-gray-600 cursor-not-allowed'
                : 'bg-gray-700 text-white hover:bg-gray-600'
              }
            `}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Previous
          </button>

          <span className="text-sm text-gray-400">
            Slide {currentIndex + 1} of {slides.length}
          </span>

          <button
            onClick={() => onIndexChange(Math.min(slides.length - 1, currentIndex + 1))}
            disabled={currentIndex === slides.length - 1}
            className={`
              px-4 py-2 rounded font-medium transition-colors flex items-center gap-2
              ${currentIndex === slides.length - 1
                ? 'bg-gray-800 text-gray-600 cursor-not-allowed'
                : 'bg-gray-700 text-white hover:bg-gray-600'
              }
            `}
          >
            Next
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      )}

      {/* Thumbnail Strip */}
      {slides.length > 1 && (
        <div className="mt-4 overflow-x-auto">
          <div className="flex gap-2 pb-2">
            {slides.map((slide, index) => (
              <button
                key={slide.id}
                onClick={() => onIndexChange(index)}
                className={`
                  flex-shrink-0 w-32 rounded overflow-hidden border-2 transition-all
                  ${index === currentIndex
                    ? 'border-blue-500 ring-2 ring-blue-500 ring-opacity-50'
                    : 'border-gray-700 hover:border-gray-600'
                  }
                `}
                style={{ aspectRatio: '16/9' }}
              >
                <SlideRenderer
                  slide={slide}
                  targetResolution={{ width: 1920, height: 1080 }}
                />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
