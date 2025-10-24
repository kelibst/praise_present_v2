import React from 'react';
import { PreviewWindow } from '../../windows/PreviewWindow';
import { SlideViewer, Slide } from '../../slides';

interface LiveMonitorProps {
  liveDisplayActive: boolean;
  isPresenting: boolean;
  currentSlide?: Slide;
}

/**
 * Right panel component showing live display monitor
 */
export const LiveMonitor: React.FC<LiveMonitorProps> = ({
  liveDisplayActive,
  isPresenting,
  currentSlide
}) => {
  return (
    <div className="bg-background h-full transition-all duration-300 ease-in-out animate-in slide-in-from-right-5">
      <PreviewWindow
        title="Live Display Monitor"
        type="live-display"
        showControls={true}
        contentResolution={{ width: 1920, height: 1080 }}
        renderResolution={{ width: 1920, height: 1080 }}
        isLiveActive={liveDisplayActive}
        connectionStatus={liveDisplayActive ? "connected" : "disconnected"}
        className="h-full"
      >
        {liveDisplayActive && isPresenting && currentSlide ? (
          <SlideViewer
            slide={currentSlide}
            className="w-full h-full"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            <div className="text-center">
              {liveDisplayActive ? (
                <>
                  <div className="text-4xl mb-2">📺</div>
                  <div className="text-sm">Ready for presentation</div>
                  <div className="text-xs mt-1 text-gray-500">Click "Present Live" to display content</div>
                </>
              ) : (
                <>
                  <div className="text-4xl mb-2 opacity-50">📺</div>
                  <div className="text-sm">Live Display Off</div>
                  <div className="text-xs mt-1 text-gray-500">Create live display to see preview</div>
                </>
              )}
            </div>
          </div>
        )}
      </PreviewWindow>
    </div>
  );
};
