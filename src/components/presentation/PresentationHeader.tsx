import React from 'react';
import { MonitorSpeaker, Settings } from 'lucide-react';
import { LiveDisplayControls } from '../live/LiveDisplayManager';

interface PresentationHeaderProps {
  liveDisplayActive: boolean;
  liveDisplayStatus: string;
  onCreateDisplay: () => void;
  onCloseDisplay: () => void;
  onClearDisplay: () => void;
  onShowBlack: () => void;
  onOpenSettings: () => void;
}

/**
 * Header for Live Presentation page with title, settings, and live display controls
 */
export const PresentationHeader: React.FC<PresentationHeaderProps> = ({
  liveDisplayActive,
  liveDisplayStatus,
  onCreateDisplay,
  onCloseDisplay,
  onClearDisplay,
  onShowBlack,
  onOpenSettings
}) => {
  return (
    <div className="bg-card border-b border-border p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <MonitorSpeaker className="w-8 h-8 text-blue-400" />
          <h1 className="text-2xl font-bold">Live Presentation</h1>
        </div>

        <div className="flex items-center gap-3">
          {/* Settings Button */}
          <button
            onClick={onOpenSettings}
            className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg border border-gray-600 transition-colors"
            title="Feature Settings"
          >
            <Settings className="w-4 h-4" />
            <span className="text-sm font-medium">Settings</span>
          </button>

          {/* Live Display Controls */}
          {window.electronAPI && (
            <LiveDisplayControls
              liveDisplayActive={liveDisplayActive}
              liveDisplayStatus={liveDisplayStatus}
              onCreateDisplay={onCreateDisplay}
              onCloseDisplay={onCloseDisplay}
              onClearDisplay={onClearDisplay}
              onShowBlack={onShowBlack}
            />
          )}
        </div>
      </div>
    </div>
  );
};
