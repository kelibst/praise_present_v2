import React from 'react';
import { AlertTriangle, X, Video } from 'lucide-react';

interface VideoDurationWarningProps {
  /**
   * Video duration in seconds
   */
  duration: number;

  /**
   * Type of warning: 'warning' (5-10min) or 'error' (>10min)
   */
  type: 'warning' | 'error';

  /**
   * Callback when user confirms upload (only for warnings)
   */
  onConfirm?: () => void;

  /**
   * Callback when user cancels
   */
  onCancel: () => void;

  /**
   * Whether the modal is open
   */
  open: boolean;
}

/**
 * Format seconds to MM:SS or HH:MM:SS format
 */
const formatDuration = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
};

/**
 * VideoDurationWarning - Modal for warning about long videos
 *
 * Shows different messages based on duration:
 * - Warning (5-10 minutes): Suggests VLC but allows upload
 * - Error (>10 minutes): Blocks upload and recommends VLC
 */
const VideoDurationWarning: React.FC<VideoDurationWarningProps> = ({
  duration,
  type,
  onConfirm,
  onCancel,
  open
}) => {
  if (!open) return null;

  const formattedDuration = formatDuration(duration);
  const minutes = Math.floor(duration / 60);
  const seconds = Math.floor(duration % 60);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-card border border-border rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
        {/* Header */}
        <div className="flex items-start gap-3 mb-4">
          <div className={`p-2 rounded-lg ${
            type === 'error'
              ? 'bg-red-100 dark:bg-red-900/20'
              : 'bg-yellow-100 dark:bg-yellow-900/20'
          }`}>
            {type === 'error' ? (
              <X className="w-6 h-6 text-red-600 dark:text-red-400" />
            ) : (
              <AlertTriangle className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
            )}
          </div>
          <div className="flex-1">
            <h3 className={`text-lg font-semibold ${
              type === 'error' ? 'text-red-600 dark:text-red-400' : 'text-yellow-600 dark:text-yellow-400'
            }`}>
              {type === 'error' ? 'Video Too Long' : 'Long Video Detected'}
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              This video is {minutes} minutes and {seconds} seconds long ({formattedDuration})
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="mb-6">
          {type === 'error' ? (
            <>
              <p className="text-sm text-foreground mb-3">
                PraisePresent is designed for presentation content, not full-length videos.
                Please use one of these alternatives for long videos:
              </p>
              <div className="bg-secondary rounded-lg p-4 space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Video className="w-4 h-4 text-primary" />
                  <span className="font-medium text-foreground">VLC Media Player</span>
                  <span className="text-xs text-muted-foreground">(Recommended, Free)</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Video className="w-4 h-4 text-primary" />
                  <span className="font-medium text-foreground">Windows Media Player</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Video className="w-4 h-4 text-primary" />
                  <span className="font-medium text-foreground">OBS Studio</span>
                  <span className="text-xs text-muted-foreground">(For streaming)</span>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-3 text-center">
                Maximum video length: 10 minutes
              </p>
            </>
          ) : (
            <>
              <p className="text-sm text-foreground mb-3">
                PraisePresent is optimized for short presentation clips (under 5 minutes).
                For longer videos like full sermons or worship sets, we recommend using:
              </p>
              <div className="bg-secondary rounded-lg p-4 space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Video className="w-4 h-4 text-primary" />
                  <span className="font-medium text-foreground">VLC Media Player</span>
                  <span className="text-xs text-muted-foreground">(Free)</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Video className="w-4 h-4 text-primary" />
                  <span className="font-medium text-foreground">Windows Media Player</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Video className="w-4 h-4 text-primary" />
                  <span className="font-medium text-foreground">Other dedicated video players</span>
                </div>
              </div>
              <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-3 text-center">
                You can still upload, but performance may be affected
              </p>
            </>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3">
          {type === 'error' ? (
            <button
              onClick={onCancel}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors font-medium"
            >
              OK, I'll Use VLC
            </button>
          ) : (
            <>
              <button
                onClick={onCancel}
                className="px-4 py-2 bg-secondary text-foreground rounded-md hover:bg-accent transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={onConfirm}
                className="px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 transition-colors font-medium"
              >
                Upload Anyway
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default VideoDurationWarning;
