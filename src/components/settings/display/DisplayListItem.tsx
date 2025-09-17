import React from 'react';
import { Check, Play, Camera } from 'lucide-react';
import DisplayPreview from './DisplayPreview';

interface DisplayListItemProps {
  display: any;
  isSelected: boolean;
  isTestMode: boolean;
  displayId: number;
  onSelect: (displayId: number | null) => void;
  onTest: (displayId: number) => void;
  onCapture: (displayId: number) => void;
}

const getDisplayTypeIcon = (display: any) => {
  if (display.manufacturer) {
    const manufacturer = display.manufacturer.toLowerCase();
    if (manufacturer.includes('samsung')) return '📱';
    if (manufacturer.includes('lg')) return '🖥️';
    if (manufacturer.includes('dell')) return '💻';
    if (manufacturer.includes('hp')) return '🖨️';
    if (manufacturer.includes('acer')) return '⚡';
    if (manufacturer.includes('asus')) return '🎮';
  }
  return '🖥️';
};

const formatResolution = (width: number, height: number) => {
  return `${width} × ${height}`;
};

const DisplayListItem: React.FC<DisplayListItemProps> = ({
  display,
  isSelected,
  isTestMode,
  displayId,
  onSelect,
  onTest,
  onCapture,
}) => {
  return (
    <div
      className={`border rounded-lg p-4 transition-colors ${
        isSelected ? 'border-primary bg-primary/5' : 'border-border'
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="text-2xl">{getDisplayTypeIcon(display)}</div>
            {display.isPrimary && (
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-primary rounded-full" />
            )}
          </div>

          {/* Display Preview */}
          <DisplayPreview displayId={displayId} />

          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h4 className="font-medium text-lg">
                {display.friendlyName || display.label}
              </h4>
              {display.isPrimary && (
                <div className="text-xs bg-primary text-primary-foreground px-2 py-1 rounded">
                  Primary
                </div>
              )}
              {isSelected && (
                <div className="text-xs bg-green-600 text-white px-2 py-1 rounded">
                  Live Output
                </div>
              )}
            </div>

            <div className="space-y-1 text-sm text-muted-foreground">
              <div>
                {formatResolution(display.bounds.width, display.bounds.height)}{' '}
                • Scale: {Math.round(display.scaleFactor * 100)}%
              </div>
              {display.manufacturer && (
                <div>Manufacturer: {display.manufacturer}</div>
              )}
              {display.model && <div>Model: {display.model}</div>}
              <div>
                Position: ({display.bounds.x}, {display.bounds.y})
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onCapture(display.id)}
            className="flex items-center gap-1 px-3 py-1 border border-border text-foreground rounded text-sm hover:bg-accent transition-colors"
            title="Capture Screenshot"
          >
            <Camera className="w-4 h-4" />
            Capture
          </button>

          <button
            onClick={() => onTest(display.id)}
            disabled={isTestMode}
            className="flex items-center gap-1 px-3 py-1 border border-border text-foreground rounded text-sm hover:bg-accent transition-colors disabled:opacity-50"
          >
            <Play className="w-4 h-4" />
            Test
          </button>

          {isSelected ? (
            <button
              onClick={() => onSelect(null)}
              className="flex items-center gap-1 px-3 py-1 border border-border text-foreground rounded text-sm hover:bg-accent transition-colors"
            >
              <Check className="w-4 h-4" />
              Selected
            </button>
          ) : (
            <button
              onClick={() => onSelect(display.id)}
              className="px-3 py-1 bg-primary text-primary-foreground rounded text-sm hover:bg-primary/90 transition-colors"
            >
              Select for Live
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default DisplayListItem;