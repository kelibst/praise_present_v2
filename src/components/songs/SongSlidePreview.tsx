import React, { useState } from 'react';
import { MonitorSpeaker, Maximize2, X } from 'lucide-react';
import { SlideRenderer, Slide } from '../slides/SlideRenderer';
import { SongSlide } from '../../lib/presentation/songSlideGenerator';

interface SongSlidePreviewProps {
  slides: SongSlide[];
  className?: string;
}

const SECTION_LABELS = {
  title: 'Title',
  verse: 'Verse',
  chorus: 'Chorus',
  bridge: 'Bridge',
  intro: 'Intro',
  outro: 'Outro',
  copyright: 'Copyright'
};

const SECTION_COLORS = {
  title: 'bg-blue-600',
  verse: 'bg-blue-500',
  chorus: 'bg-green-500',
  bridge: 'bg-purple-500',
  intro: 'bg-cyan-500',
  outro: 'bg-red-500',
  copyright: 'bg-gray-500'
};

export const SongSlidePreview: React.FC<SongSlidePreviewProps> = ({
  slides,
  className = ''
}) => {
  const [selectedSlideIndex, setSelectedSlideIndex] = useState<number | null>(null);

  const handleSlideClick = (index: number) => {
    setSelectedSlideIndex(index);
  };

  const closeFullscreen = () => {
    setSelectedSlideIndex(null);
  };

  const convertToSlide = (songSlide: SongSlide): Slide => {
    return {
      id: songSlide.id,
      shapes: songSlide.shapes,
      background: songSlide.background
    };
  };

  return (
    <div className={`bg-card rounded-lg border border-border p-4 ${className}`}>
      <h3 className="font-semibold text-foreground flex items-center gap-2 mb-4">
        <MonitorSpeaker className="w-4 h-4 text-green-400" />
        Slide Previews
        <span className="text-sm font-normal text-muted-foreground ml-auto">
          {slides.length} slide{slides.length !== 1 ? 's' : ''}
        </span>
      </h3>

      {slides.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <MonitorSpeaker className="w-16 h-16 mx-auto mb-4 opacity-50" />
          <div>No slides generated yet</div>
          <div className="text-sm mt-1">Add lyrics to generate slide previews</div>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {slides.map((songSlide, index) => {
            const sectionLabel = songSlide.sectionType ? SECTION_LABELS[songSlide.sectionType] : 'Slide';
            const sectionNumber = songSlide.sectionNumber ? ` ${songSlide.sectionNumber}` : '';
            const sectionColor = songSlide.sectionType ? SECTION_COLORS[songSlide.sectionType] : 'bg-gray-500';

            return (
              <div
                key={songSlide.id}
                className="group relative cursor-pointer"
                onClick={() => handleSlideClick(index)}
              >
                {/* Slide Number & Label */}
                <div className="absolute top-2 left-2 z-10 flex items-center gap-2">
                  <div className="bg-black/60 backdrop-blur-sm px-2 py-1 rounded text-xs font-medium text-white">
                    #{index + 1}
                  </div>
                  <div className={`${sectionColor} px-2 py-1 rounded text-xs font-medium text-white`}>
                    {sectionLabel}{sectionNumber}
                  </div>
                </div>

                {/* Expand Icon */}
                <div className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="bg-black/60 backdrop-blur-sm p-1.5 rounded">
                    <Maximize2 className="w-4 h-4 text-white" />
                  </div>
                </div>

                {/* Slide Preview */}
                <div className="aspect-video border-2 border-border rounded-lg overflow-hidden hover:border-blue-500 transition-colors bg-background">
                  <SlideRenderer
                    slide={convertToSlide(songSlide)}
                    targetResolution={{ width: 1920, height: 1080 }}
                    className="w-full h-full"
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Fullscreen Preview Modal */}
      {selectedSlideIndex !== null && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-8">
          <button
            onClick={closeFullscreen}
            className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
          >
            <X className="w-6 h-6 text-white" />
          </button>

          <div className="flex items-center justify-between absolute top-4 left-4 right-20 text-white">
            <div>
              <div className="text-sm text-white/60">Slide {selectedSlideIndex + 1} of {slides.length}</div>
              <div className="text-lg font-semibold">
                {slides[selectedSlideIndex].sectionType && SECTION_LABELS[slides[selectedSlideIndex].sectionType!]}
                {slides[selectedSlideIndex].sectionNumber && ` ${slides[selectedSlideIndex].sectionNumber}`}
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedSlideIndex(Math.max(0, selectedSlideIndex - 1));
                }}
                disabled={selectedSlideIndex === 0}
                className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedSlideIndex(Math.min(slides.length - 1, selectedSlideIndex + 1));
                }}
                disabled={selectedSlideIndex === slides.length - 1}
                className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>

          <div className="max-w-6xl w-full aspect-video">
            <SlideRenderer
              slide={convertToSlide(slides[selectedSlideIndex])}
              targetResolution={{ width: 1920, height: 1080 }}
              className="w-full h-full rounded-lg shadow-2xl"
            />
          </div>
        </div>
      )}
    </div>
  );
};
