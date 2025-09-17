import React, { useState, useEffect } from 'react';
import { Monitor, RefreshCw } from 'lucide-react';

interface DisplayPreviewProps {
  displayId: number;
  className?: string;
}

const DisplayPreview: React.FC<DisplayPreviewProps> = ({
  displayId,
  className = "w-16 h-10"
}) => {
  const [screenshot, setScreenshot] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(false);

  const captureScreenshot = async () => {
    try {
      setIsLoading(true);
      setError(false);

      if (window.electronAPI) {
        const result = await window.electronAPI.invoke('display:captureDisplay', displayId);
        if (result) {
          setScreenshot(result);
        } else {
          setError(true);
        }
      } else {
        setError(true);
      }
    } catch (err) {
      console.error('Failed to capture display preview:', err);
      setError(true);
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-capture on mount
  useEffect(() => {
    captureScreenshot();
  }, [displayId]);

  const handleRefresh = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent parent click handlers
    captureScreenshot();
  };

  return (
    <div className={`relative ${className} bg-gray-100 dark:bg-gray-800 rounded border border-border overflow-hidden group`}>
      {isLoading ? (
        <div className="flex items-center justify-center w-full h-full">
          <RefreshCw className="w-4 h-4 animate-spin text-muted-foreground" />
        </div>
      ) : error || !screenshot ? (
        <div className="flex items-center justify-center w-full h-full">
          <Monitor className="w-6 h-6 text-muted-foreground opacity-50" />
        </div>
      ) : (
        <>
          <img
            src={screenshot}
            alt={`Display ${displayId} preview`}
            className="w-full h-full object-cover"
          />
          {/* Refresh button on hover */}
          <button
            onClick={handleRefresh}
            className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
            title="Refresh preview"
          >
            <RefreshCw className="w-4 h-4 text-white" />
          </button>
        </>
      )}
    </div>
  );
};

export default DisplayPreview;