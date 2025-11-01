import React, { useState, useEffect } from 'react';
import { Megaphone, Send, Edit, Eye } from 'lucide-react';
import { ServiceItem } from '../service/ServiceItem';
import { useFeatureSettings } from '../../hooks/useFeatureSettings';
import { buildAnnouncementContent } from '../../lib/contentBuilders';
import { usePresentation } from '../../hooks/usePresentation';
import { useLiveDisplay } from '../live/LiveDisplayManager';
import { SlideRenderer } from '../slides/SlideRenderer';

interface AnnouncementPreviewProps {
  /**
   * Service item containing announcement data
   */
  item: ServiceItem;

  /**
   * Callback when user wants to open full announcement editor
   */
  onOpenDetails?: () => void;

  /**
   * CSS class name
   */
  className?: string;
}

/**
 * AnnouncementPreview - Preview for announcement items from plan
 *
 * Features:
 * - Shows announcement content
 * - Basic inline editing (title, message)
 * - Preview of generated slide
 * - Send to Live button
 * - "Open Details" button for full editing (to be implemented)
 *
 * Usage:
 * ```typescript
 * <AnnouncementPreview
 *   item={announcementServiceItem}
 *   onOpenDetails={() => navigate(`/announcements/${item.id}`)}
 * />
 * ```
 */
export const AnnouncementPreview: React.FC<AnnouncementPreviewProps> = ({
  item,
  onOpenDetails,
  className = ''
}) => {
  const { announcementSettings } = useFeatureSettings();
  const presentation = usePresentation();
  const { liveDisplayActive, createLiveDisplay } = useLiveDisplay();

  const [title, setTitle] = useState(item.title || 'New Announcement');
  const [message, setMessage] = useState(item.content?.text || '');
  const [hasGenerated, setHasGenerated] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // Generate slides when component mounts or content changes
  useEffect(() => {
    handleGenerateSlide();
  }, [title, message]);

  /**
   * Generate slide from announcement content
   */
  const handleGenerateSlide = async () => {
    try {
      // Create updated service item with current values
      const updatedItem: ServiceItem = {
        ...item,
        title,
        content: {
          ...item.content,
          text: message
        }
      };

      // Build presentation content
      const announcementContent = buildAnnouncementContent(updatedItem);

      // Switch presentation to this content
      await presentation.switchTo(announcementContent);

      setHasGenerated(true);
      console.log('[AnnouncementPreview] Generated slide');
    } catch (error) {
      console.error('[AnnouncementPreview] Error generating slide:', error);
    }
  };

  /**
   * Send to live display
   */
  const handleSendToLive = async () => {
    if (!hasGenerated) {
      console.warn('[AnnouncementPreview] Cannot send to live: no slide generated');
      return;
    }

    // Create live display if not active
    if (!liveDisplayActive) {
      await createLiveDisplay();
      // Small delay to let display initialize
      await new Promise(resolve => setTimeout(resolve, 300));
    }

    // Start live presentation
    await presentation.startLive();

    console.log('[AnnouncementPreview] Sent to live display');
  };

  const currentSlide = presentation.current.content?.slides?.[0];

  return (
    <div className={`flex flex-col h-full bg-background ${className}`}>
      {/* Header */}
      <div className="flex-shrink-0 border-b border-border bg-card px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Megaphone className="w-5 h-5 text-yellow-400" />
            <div>
              <h2 className="text-lg font-semibold text-foreground">Announcement Preview</h2>
              <p className="text-sm text-muted-foreground">
                {isEditing ? 'Editing announcement' : 'View and send to live'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onOpenDetails && (
              <button
                onClick={onOpenDetails}
                className="px-3 py-2 text-sm bg-secondary hover:bg-secondary/70 text-foreground rounded flex items-center gap-2 transition-colors"
                title="Full announcement editor (coming soon)"
              >
                <Edit className="w-4 h-4" />
                Details
              </button>
            )}

            <button
              onClick={handleSendToLive}
              disabled={!hasGenerated}
              className={`px-4 py-2 text-sm rounded flex items-center gap-2 transition-colors ${
                hasGenerated
                  ? 'bg-green-600 hover:bg-green-700 text-white'
                  : 'bg-secondary text-muted-foreground cursor-not-allowed opacity-50'
              }`}
              title="Send to live display"
            >
              <Send className="w-4 h-4" />
              Send to Live
            </button>
          </div>
        </div>
      </div>

      {/* Content - Split view */}
      <div className="flex-1 min-h-0 flex gap-4 p-4">
        {/* Left side - Editing */}
        <div className="w-1/3 bg-card border border-border rounded-lg p-4 overflow-y-auto">
          <h3 className="font-medium text-foreground mb-4 flex items-center gap-2">
            <Edit className="w-4 h-4 text-yellow-400" />
            Edit Content
          </h3>

          <div className="space-y-4">
            {/* Title */}
            <div>
              <label className="block text-sm font-medium mb-2 text-muted-foreground">
                Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onFocus={() => setIsEditing(true)}
                onBlur={() => setIsEditing(false)}
                className="w-full px-3 py-2 border border-border rounded bg-input text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Announcement title..."
              />
            </div>

            {/* Message */}
            <div>
              <label className="block text-sm font-medium mb-2 text-muted-foreground">
                Message
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onFocus={() => setIsEditing(true)}
                onBlur={() => setIsEditing(false)}
                className="w-full px-3 py-2 border border-border rounded bg-input text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                rows={8}
                placeholder="Enter announcement message..."
              />
              <div className="text-xs text-muted-foreground mt-1">
                {message.length} characters
              </div>
            </div>

            {/* Info */}
            <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded text-sm text-blue-400">
              <div className="font-medium mb-1">ℹ️ Note</div>
              <div className="text-xs">
                For advanced editing (images, dates, formatting), click the "Details" button.
              </div>
            </div>

            {/* TODO Note */}
            <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded text-sm text-yellow-400">
              <div className="font-medium mb-1">🚧 Coming Soon</div>
              <div className="text-xs space-y-1">
                <div>• Rich text editing</div>
                <div>• Image upload</div>
                <div>• Date/time picker</div>
                <div>• Location & contact info</div>
                <div>• Multiple slide support</div>
              </div>
            </div>
          </div>
        </div>

        {/* Right side - Preview */}
        <div className="flex-1 bg-card border border-border rounded-lg overflow-hidden">
          <div className="p-4 border-b border-border bg-secondary/50">
            <h3 className="font-medium text-foreground flex items-center gap-2">
              <Eye className="w-4 h-4 text-yellow-400" />
              Slide Preview
            </h3>
            <p className="text-xs text-muted-foreground mt-1">
              Live preview of how the announcement will appear
            </p>
          </div>

          <div className="p-4 flex items-center justify-center bg-background" style={{ height: 'calc(100% - 80px)' }}>
            {currentSlide ? (
              <div className="w-full max-w-3xl aspect-video bg-black rounded-lg overflow-hidden shadow-2xl">
                <SlideRenderer
                  slide={currentSlide}
                  targetResolution={{ width: 1920, height: 1080 }}
                  className="w-full h-full"
                />
              </div>
            ) : (
              <div className="text-center text-muted-foreground">
                <Megaphone className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <div>Generating preview...</div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Status Bar */}
      <div className="flex-shrink-0 border-t border-border bg-card px-4 py-2">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-4 text-muted-foreground">
            <span>Announcement</span>
            {hasGenerated && (
              <>
                <span>•</span>
                <span>1 slide ready</span>
              </>
            )}
          </div>

          {hasGenerated && (
            <div className="flex items-center gap-2 text-green-600">
              <div className="w-2 h-2 bg-green-600 rounded-full animate-pulse" />
              <span>Ready to present</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AnnouncementPreview;
