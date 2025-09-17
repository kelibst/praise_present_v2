import React from 'react';
import { Eye, Monitor } from 'lucide-react';
import { useLiveDisplay } from '../../live/LiveDisplayManager';

interface LiveDisplayStatusPanelProps {
  currentSelectedDisplay: any;
}

const LiveDisplayStatusPanel: React.FC<LiveDisplayStatusPanelProps> = ({
  currentSelectedDisplay,
}) => {
  const {
    liveDisplayActive,
    liveDisplayStatus,
    createLiveDisplay,
    closeLiveDisplay,
    clearLiveDisplay,
    showBlackScreen
  } = useLiveDisplay();

  return (
    <div className="bg-card border border-border rounded-lg">
      <div className="p-6 border-b border-border">
        <h4 className="text-lg font-semibold text-foreground flex items-center gap-2">
          <Eye className="w-5 h-5" />
          Live Display Status
        </h4>
        <p className="text-sm text-muted-foreground">
          Real-time status and controls for the live display window
        </p>
      </div>
      <div className="p-6 space-y-4">
        {/* Status Information */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="font-medium">Window Created:</span>
            <span className="ml-2">
              {liveDisplayActive ? (
                <div className="inline-block text-xs bg-green-600 text-white px-2 py-1 rounded">
                  Yes
                </div>
              ) : (
                <div className="inline-block text-xs bg-gray-600 text-white px-2 py-1 rounded">
                  No
                </div>
              )}
            </span>
          </div>
          <div>
            <span className="font-medium">Window Visible:</span>
            <span className="ml-2">
              {liveDisplayActive ? (
                <div className="inline-block text-xs bg-green-600 text-white px-2 py-1 rounded">
                  Yes
                </div>
              ) : (
                <div className="inline-block text-xs bg-gray-600 text-white px-2 py-1 rounded">
                  No
                </div>
              )}
            </span>
          </div>
          <div>
            <span className="font-medium">Target Display:</span>
            <span className="ml-2">
              {currentSelectedDisplay ? (
                <div className="inline-block text-xs bg-primary text-primary-foreground px-2 py-1 rounded">
                  Display {currentSelectedDisplay.id}
                </div>
              ) : (
                <div className="inline-block text-xs bg-gray-600 text-white px-2 py-1 rounded">
                  None
                </div>
              )}
            </span>
          </div>
          <div>
            <span className="font-medium">Status:</span>
            <span className="ml-2">
              <div className={`inline-block text-xs px-2 py-1 rounded ${
                liveDisplayActive
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-600 text-white'
              }`}>
                {liveDisplayActive ? 'Active' : 'Inactive'}
              </div>
            </span>
          </div>
        </div>

        {/* Selected Display Info */}
        {currentSelectedDisplay && (
          <div className="mt-4 p-3 bg-accent/50 rounded-lg">
            <h5 className="font-medium text-sm mb-2">
              Selected Display Info
            </h5>
            <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
              <div>Display ID: {currentSelectedDisplay.id}</div>
              <div>
                Name:{' '}
                {currentSelectedDisplay.friendlyName ||
                  currentSelectedDisplay.label}
              </div>
              <div>Target X: {currentSelectedDisplay.bounds.x}</div>
              <div>Target Y: {currentSelectedDisplay.bounds.y}</div>
              <div>
                Resolution: {currentSelectedDisplay.bounds.width} ×{' '}
                {currentSelectedDisplay.bounds.height}
              </div>
              <div>
                Primary: {currentSelectedDisplay.isPrimary ? 'Yes' : 'No'}
              </div>
            </div>
          </div>
        )}

        {/* Live Display Controls */}
        <div className="border-t border-border pt-4">
          <h5 className="font-medium text-sm mb-3">Quick Controls</h5>
          <div className="flex gap-2 flex-wrap">
            {!liveDisplayActive ? (
              <button
                onClick={createLiveDisplay}
                disabled={!currentSelectedDisplay}
                className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Monitor className="w-4 h-4" />
                Create Live Display
              </button>
            ) : (
              <>
                <button
                  onClick={clearLiveDisplay}
                  className="px-3 py-1 bg-orange-500 text-white rounded text-sm hover:bg-orange-600 border border-orange-600 hover:border-orange-700"
                >
                  Clear
                </button>
                <button
                  onClick={showBlackScreen}
                  className="px-3 py-1 bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900 rounded text-sm hover:bg-gray-800 dark:hover:bg-gray-200 border border-gray-900 dark:border-gray-100"
                >
                  Black
                </button>
                <button
                  onClick={closeLiveDisplay}
                  className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700 border border-red-600 hover:border-red-700"
                >
                  Close
                </button>
              </>
            )}
          </div>
        </div>

        {/* Status Messages */}
        {!currentSelectedDisplay && (
          <div className="p-3 bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-lg">
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              Select a display above to enable live display controls.
            </p>
          </div>
        )}

        {currentSelectedDisplay && !liveDisplayActive && (
          <div className="p-3 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              Ready to create live display on {currentSelectedDisplay.friendlyName || currentSelectedDisplay.label}.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default LiveDisplayStatusPanel;