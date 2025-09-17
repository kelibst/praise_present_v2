import React from 'react';
import { Monitor } from 'lucide-react';
import { useLiveDisplay } from '../../live/LiveDisplayManager';

interface DisplayStatusCardProps {
  displayCount: number;
  hasMultipleDisplays: boolean;
  currentSelectedDisplay: any;
}

const DisplayStatusCard: React.FC<DisplayStatusCardProps> = ({
  displayCount,
  hasMultipleDisplays,
  currentSelectedDisplay,
}) => {
  const { liveDisplayActive } = useLiveDisplay();

  return (
    <div className="bg-card border border-border rounded-lg">
      <div className="p-6 border-b border-border">
        <h4 className="text-lg font-semibold text-foreground flex items-center gap-2">
          <Monitor className="w-5 h-5" />
          Display Status
        </h4>
        <p className="text-sm text-muted-foreground">
          Current display configuration detected
        </p>
      </div>
      <div className="p-6">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="font-medium">Total Displays:</span>
            <span className="ml-2">{displayCount}</span>
          </div>
          <div>
            <span className="font-medium">Multiple Displays:</span>
            <span className="ml-2">
              {hasMultipleDisplays ? (
                <div className="inline-block text-xs bg-green-600 text-white px-2 py-1 rounded">
                  Available
                </div>
              ) : (
                <div className="inline-block text-xs bg-gray-600 text-white px-2 py-1 rounded">
                  Not Available
                </div>
              )}
            </span>
          </div>
          <div>
            <span className="font-medium">Live Display:</span>
            <span className="ml-2">
              {currentSelectedDisplay ? (
                <div className="inline-block text-xs bg-primary text-primary-foreground px-2 py-1 rounded">
                  {currentSelectedDisplay.friendlyName ||
                    currentSelectedDisplay.label}
                </div>
              ) : (
                <div className="inline-block text-xs bg-gray-600 text-white px-2 py-1 rounded">
                  Not Selected
                </div>
              )}
            </span>
          </div>
          <div>
            <span className="font-medium">Status:</span>
            <span className="ml-2">
              {liveDisplayActive ? (
                <div className="inline-block text-xs bg-green-600 text-white px-2 py-1 rounded">
                  Active
                </div>
              ) : (
                <div className="inline-block text-xs bg-gray-600 text-white px-2 py-1 rounded">
                  Inactive
                </div>
              )}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DisplayStatusCard;