import React from 'react';
import { Play, SkipBack, SkipForward, ChevronUp, ChevronDown } from 'lucide-react';
import { ServiceItem } from '../../service/ServiceItem';

interface NavigationControlsProps {
  selectedItem: ServiceItem | null;
  currentSlideIndex: number;
  totalSlides: number;
  presentationMode: 'preview' | 'live';
  liveDisplayActive: boolean;
  canNavigatePrevious: boolean;
  canNavigateNext: boolean;
  canNavigatePreviousChapter?: boolean;
  canNavigateNextChapter?: boolean;
  isNavigating?: boolean;
  isScriptureSingleVerse?: boolean;
  onPrevious: () => void;
  onNext: () => void;
  onPresentCurrent: () => void;
  onPreviousChapter?: () => void;
  onNextChapter?: () => void;
}

/**
 * Navigation controls for slides with prev/next buttons and chapter navigation for scripture
 */
export const NavigationControls: React.FC<NavigationControlsProps> = ({
  selectedItem,
  currentSlideIndex,
  totalSlides,
  presentationMode,
  liveDisplayActive,
  canNavigatePrevious,
  canNavigateNext,
  canNavigatePreviousChapter,
  canNavigateNextChapter,
  isNavigating,
  isScriptureSingleVerse,
  onPrevious,
  onNext,
  onPresentCurrent,
  onPreviousChapter,
  onNextChapter
}) => {
  return (
    <>
      <div className="flex items-center justify-center gap-4 mb-2">
        <button
          onClick={onPrevious}
          disabled={!canNavigatePrevious}
          className="px-4 py-2 bg-secondary text-secondary-foreground rounded hover:bg-secondary/80 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          title={
            isScriptureSingleVerse
              ? 'Previous verse in Bible'
              : `Slide ${currentSlideIndex + 1} of ${totalSlides}`
          }
        >
          <SkipBack className="w-4 h-4" />
          Previous
        </button>

        <button
          onClick={onPresentCurrent}
          disabled={!liveDisplayActive}
          className={`px-6 py-2 rounded flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed ${
            presentationMode === 'live'
              ? 'bg-green-600 text-white hover:bg-green-700'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          <Play className="w-4 h-4" />
          {presentationMode === 'live' ? 'Update Live' : 'Present Live'}
        </button>

        <button
          onClick={onNext}
          disabled={!canNavigateNext}
          className="px-4 py-2 bg-secondary text-secondary-foreground rounded hover:bg-secondary/80 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          title={
            isScriptureSingleVerse
              ? 'Next verse in Bible'
              : `Slide ${currentSlideIndex + 1} of ${totalSlides}`
          }
        >
          Next
          <SkipForward className="w-4 h-4" />
        </button>
      </div>

      {/* Chapter Navigation for Scripture (optional) */}
      {isScriptureSingleVerse && onPreviousChapter && onNextChapter && (
        <div className="flex items-center justify-center gap-2 mt-2">
          <button
            onClick={onPreviousChapter}
            disabled={!canNavigatePreviousChapter || isNavigating}
            className="px-2 py-1 text-xs bg-secondary text-secondary-foreground rounded hover:bg-secondary/80 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
            title="Previous Chapter"
          >
            <ChevronUp className="w-3 h-3" />
            Prev Chapter
          </button>

          <button
            onClick={onNextChapter}
            disabled={!canNavigateNextChapter || isNavigating}
            className="px-2 py-1 text-xs bg-secondary text-secondary-foreground rounded hover:bg-secondary/80 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
            title="Next Chapter"
          >
            Next Chapter
            <ChevronDown className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* Status Indicators */}
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <div className={`flex items-center gap-2 ${
          presentationMode === 'live' ? 'text-green-400' : 'text-blue-400'
        }`}>
          <div className={`w-2 h-2 rounded-full ${
            presentationMode === 'live' ? 'bg-green-400' : 'bg-blue-400'
          } animate-pulse`} />
          {presentationMode === 'live' ? 'LIVE MODE' : 'PREVIEW MODE'}
        </div>
      </div>
    </>
  );
};
