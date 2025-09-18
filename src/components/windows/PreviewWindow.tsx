import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Monitor, Maximize2, Minimize2, RotateCcw, Settings, Eye, EyeOff } from 'lucide-react';

interface PreviewWindowProps {
  /** Window title */
  title: string;
  /** Window type affects styling and behavior */
  type: 'preview' | 'live-display';
  /** Content to render inside the window */
  children: React.ReactNode;
  /** Show window controls */
  showControls?: boolean;
  /** Current content resolution info */
  contentResolution?: { width: number; height: number };
  /** Actual rendering resolution */
  renderResolution?: { width: number; height: number };
  /** Live display status for live-display type */
  isLiveActive?: boolean;
  /** Edit mode status for preview type */
  isEditable?: boolean;
  /** Connection status */
  connectionStatus?: 'connected' | 'disconnected' | 'error';
  /** Optional controls */
  onZoomIn?: () => void;
  onZoomOut?: () => void;
  onZoomReset?: () => void;
  onToggleControls?: () => void;
  /** Container sizing */
  className?: string;
}

interface WindowDimensions {
  width: number;
  height: number;
  scale: number;
  aspectRatio: number;
}

/**
 * PreviewWindow provides a window-like container for preview and live display content
 * Handles responsive sizing while maintaining proper aspect ratios
 */
export const PreviewWindow: React.FC<PreviewWindowProps> = ({
  title,
  type,
  children,
  showControls = true,
  contentResolution = { width: 1920, height: 1080 },
  renderResolution,
  isLiveActive = false,
  isEditable = false,
  connectionStatus = 'disconnected',
  onZoomIn,
  onZoomOut,
  onZoomReset,
  onToggleControls,
  className = ''
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState<WindowDimensions>({
    width: 400,
    height: 225,
    scale: 1,
    aspectRatio: 16/9
  });
  const [isExpanded, setIsExpanded] = useState(false);

  // Calculate optimal window dimensions based on container size
  const calculateDimensions = useCallback(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    const containerRect = container.getBoundingClientRect();

    // Account for window chrome (headers, borders, controls)
    const chromeHeight = showControls ? 80 : 40; // Header + controls
    const chromeBorder = 8; // Border padding

    const availableWidth = containerRect.width - (chromeBorder * 2);
    const availableHeight = containerRect.height - chromeHeight - (chromeBorder * 2);

    // Target aspect ratio (16:9 for presentation content)
    const targetAspectRatio = contentResolution.width / contentResolution.height;

    // Calculate dimensions that fit within available space while maintaining aspect ratio
    let optimalWidth = availableWidth;
    let optimalHeight = optimalWidth / targetAspectRatio;

    // If height exceeds available space, constrain by height instead
    if (optimalHeight > availableHeight) {
      optimalHeight = availableHeight;
      optimalWidth = optimalHeight * targetAspectRatio;
    }

    // Ensure minimum size for usability
    const minWidth = 200;
    const minHeight = minWidth / targetAspectRatio;

    if (optimalWidth < minWidth) {
      optimalWidth = minWidth;
      optimalHeight = minHeight;
    }

    // Calculate scale factor
    const scale = optimalWidth / contentResolution.width;

    setDimensions({
      width: Math.round(optimalWidth),
      height: Math.round(optimalHeight),
      scale,
      aspectRatio: targetAspectRatio
    });

    console.log('📐 PreviewWindow: Calculated dimensions', {
      type,
      container: { width: containerRect.width, height: containerRect.height },
      available: { width: availableWidth, height: availableHeight },
      optimal: { width: optimalWidth, height: optimalHeight },
      scale,
      targetAspectRatio
    });
  }, [contentResolution, showControls, type]);

  // Responsive dimension calculation
  useEffect(() => {
    calculateDimensions();

    // Set up resize observer for dynamic resizing
    const resizeObserver = new ResizeObserver(() => {
      calculateDimensions();
    });

    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    return () => {
      resizeObserver.disconnect();
    };
  }, [calculateDimensions]);

  // Window styling based on type
  const getWindowStyling = () => {
    if (type === 'live-display') {
      return {
        borderColor: isLiveActive ? '#10b981' : '#6b7280', // Green when live, gray when off
        headerBg: isLiveActive ? 'bg-green-900/20' : 'bg-gray-900/20',
        headerBorder: isLiveActive ? 'border-green-500/30' : 'border-gray-500/30',
        statusColor: isLiveActive ? 'text-green-400' : 'text-gray-400',
        bezelStyle: isLiveActive ? 'shadow-green-500/20' : 'shadow-gray-500/20'
      };
    } else {
      return {
        borderColor: isEditable ? '#3b82f6' : '#6b7280', // Blue when editable, gray when read-only
        headerBg: isEditable ? 'bg-blue-900/20' : 'bg-gray-900/20',
        headerBorder: isEditable ? 'border-blue-500/30' : 'border-gray-500/30',
        statusColor: isEditable ? 'text-blue-400' : 'text-gray-400',
        bezelStyle: isEditable ? 'shadow-blue-500/20' : 'shadow-gray-500/20'
      };
    }
  };

  const styling = getWindowStyling();

  // Connection status indicator
  const getConnectionIcon = () => {
    switch (connectionStatus) {
      case 'connected':
        return <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />;
      case 'error':
        return <div className="w-2 h-2 bg-red-400 rounded-full animate-pulse" />;
      default:
        return <div className="w-2 h-2 bg-gray-400 rounded-full" />;
    }
  };

  // Format resolution display
  const formatResolution = (res: { width: number; height: number }) => {
    return `${res.width}×${res.height}`;
  };

  return (
    <div
      ref={containerRef}
      className={`h-full flex flex-col ${className}`}
    >
      {/* Window Header */}
      <div
        className={`${styling.headerBg} ${styling.headerBorder} border-b px-3 py-2 flex items-center justify-between`}
        style={{ borderColor: styling.borderColor }}
      >
        <div className="flex items-center gap-2">
          {type === 'live-display' ? (
            <Monitor className={`w-4 h-4 ${styling.statusColor}`} />
          ) : (
            <Eye className={`w-4 h-4 ${styling.statusColor}`} />
          )}
          <span className="text-sm font-medium text-white">{title}</span>
          {getConnectionIcon()}
        </div>

        <div className="flex items-center gap-3 text-xs text-gray-400">
          {/* Resolution Info */}
          <div className="flex items-center gap-2">
            <span>Content: {formatResolution(contentResolution)}</span>
            {renderResolution && (
              <span>• Render: {formatResolution(renderResolution)}</span>
            )}
            <span>• Scale: {Math.round(dimensions.scale * 100)}%</span>
          </div>

          {/* Window Controls */}
          {showControls && (
            <div className="flex items-center gap-1">
              {onZoomReset && (
                <button
                  onClick={onZoomReset}
                  className="p-1 hover:bg-gray-700 rounded transition-colors"
                  title="Reset zoom"
                >
                  <RotateCcw className="w-3 h-3" />
                </button>
              )}
              {onToggleControls && (
                <button
                  onClick={onToggleControls}
                  className="p-1 hover:bg-gray-700 rounded transition-colors"
                  title="Toggle controls"
                >
                  <Settings className="w-3 h-3" />
                </button>
              )}
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="p-1 hover:bg-gray-700 rounded transition-colors"
                title={isExpanded ? "Minimize" : "Maximize"}
              >
                {isExpanded ? <Minimize2 className="w-3 h-3" /> : <Maximize2 className="w-3 h-3" />}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Window Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Monitor Bezel for Live Display */}
        {type === 'live-display' && (
          <div
            className={`flex-1 p-2 bg-gray-900 ${styling.bezelStyle} shadow-inner`}
            style={{ borderColor: styling.borderColor }}
          >
            <div
              className="w-full h-full bg-black rounded border-2 border-gray-800 relative overflow-hidden flex items-center justify-center"
              style={{
                aspectRatio: dimensions.aspectRatio
              }}
            >
              {/* Live Display Status LED */}
              <div className="absolute top-2 right-2 z-10">
                <div className={`w-3 h-3 rounded-full ${
                  isLiveActive ? 'bg-green-400 shadow-green-400/50' : 'bg-gray-600'
                } shadow-lg`} />
              </div>

              {/* Content */}
              <div
                style={{
                  width: `${dimensions.width}px`,
                  height: `${dimensions.height}px`,
                  transform: isExpanded ? 'scale(1.2)' : 'scale(1)',
                  transition: 'transform 0.3s ease'
                }}
              >
                {children}
              </div>

              {/* Live Display Status Overlay */}
              {!isLiveActive && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <div className="text-center text-gray-400">
                    <EyeOff className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Live Display Off</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Preview Window Content */}
        {type === 'preview' && (
          <div className="flex-1 p-3 bg-gray-950 flex items-center justify-center">
            <div
              className="bg-black rounded border border-gray-700 relative overflow-hidden shadow-lg"
              style={{
                width: `${dimensions.width}px`,
                height: `${dimensions.height}px`,
                transform: isExpanded ? 'scale(1.1)' : 'scale(1)',
                transition: 'transform 0.3s ease'
              }}
            >
              {children}

              {/* Edit Mode Indicator */}
              {isEditable && (
                <div className="absolute top-2 left-2 z-10">
                  <div className="bg-blue-600 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
                    <div className="w-2 h-2 bg-blue-300 rounded-full animate-pulse" />
                    EDIT
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Status Bar */}
        {showControls && (
          <div className={`${styling.headerBg} ${styling.headerBorder} border-t px-3 py-1.5 flex items-center justify-between text-xs`}>
            <div className="flex items-center gap-3 text-gray-400">
              <span>Window: {dimensions.width}×{dimensions.height}</span>
              <span>•</span>
              <span>Aspect: {dimensions.aspectRatio.toFixed(2)}:1</span>
              {type === 'live-display' && (
                <>
                  <span>•</span>
                  <span className={isLiveActive ? 'text-green-400' : 'text-gray-400'}>
                    {isLiveActive ? 'LIVE' : 'STANDBY'}
                  </span>
                </>
              )}
              {type === 'preview' && (
                <>
                  <span>•</span>
                  <span className={isEditable ? 'text-blue-400' : 'text-gray-400'}>
                    {isEditable ? 'EDITABLE' : 'READ ONLY'}
                  </span>
                </>
              )}
            </div>

            {/* Zoom Controls */}
            {(onZoomIn || onZoomOut) && (
              <div className="flex items-center gap-1">
                {onZoomOut && (
                  <button
                    onClick={onZoomOut}
                    className="px-2 py-1 hover:bg-gray-700 rounded text-gray-400 hover:text-white transition-colors"
                    title="Zoom out"
                  >
                    -
                  </button>
                )}
                <span className="text-gray-500 mx-1">{Math.round(dimensions.scale * 100)}%</span>
                {onZoomIn && (
                  <button
                    onClick={onZoomIn}
                    className="px-2 py-1 hover:bg-gray-700 rounded text-gray-400 hover:text-white transition-colors"
                    title="Zoom in"
                  >
                    +
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default PreviewWindow;