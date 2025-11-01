import React, { useState, useEffect } from 'react';
import { Mic, Send, Edit, Eye, Plus, Trash2 } from 'lucide-react';
import { ServiceItem } from '../service/ServiceItem';
import { buildSermonContent } from '../../lib/contentBuilders';
import { usePresentation } from '../../hooks/usePresentation';
import { useLiveDisplay } from '../live/LiveDisplayManager';
import { SlideRenderer } from '../slides/SlideRenderer';

interface SermonPreviewProps {
  /**
   * Service item containing sermon data
   */
  item: ServiceItem;

  /**
   * Callback when user wants to open full sermon editor
   */
  onOpenDetails?: () => void;

  /**
   * CSS class name
   */
  className?: string;
}

/**
 * SermonPreview - Preview for sermon items from plan
 *
 * Features:
 * - Shows sermon title, speaker, date, scripture reference
 * - Outline editor (add/remove/edit points)
 * - Preview of generated slides
 * - Navigation through slides
 * - Send to Live button
 * - "Open Details" button for full editing
 *
 * Usage:
 * ```typescript
 * <SermonPreview
 *   item={sermonServiceItem}
 *   onOpenDetails={() => navigate(`/sermons/${item.id}`)}
 * />
 * ```
 */
export const SermonPreview: React.FC<SermonPreviewProps> = ({
  item,
  onOpenDetails,
  className = ''
}) => {
  const presentation = usePresentation();
  const { liveDisplayActive, createLiveDisplay } = useLiveDisplay();

  const [title, setTitle] = useState(item.title || 'New Sermon');
  const [speaker, setSpeaker] = useState(item.content?.speaker || '');
  const [date, setDate] = useState(item.content?.date || '');
  const [scriptureReference, setScriptureReference] = useState(item.content?.scriptureReference || '');
  const [outlinePoints, setOutlinePoints] = useState<string[]>(item.content?.outlinePoints || []);
  const [hasGenerated, setHasGenerated] = useState(false);

  // Generate slides when content changes
  useEffect(() => {
    handleGenerateSlides();
  }, [title, speaker, date, scriptureReference, outlinePoints]);

  /**
   * Generate slides from sermon content
   */
  const handleGenerateSlides = async () => {
    try {
      // Create updated service item
      const updatedItem: ServiceItem = {
        ...item,
        title,
        content: {
          ...item.content,
          speaker,
          date,
          scriptureReference,
          outlinePoints
        }
      };

      // Build presentation content
      const sermonContent = buildSermonContent(updatedItem);

      // Switch presentation to this content
      await presentation.switchTo(sermonContent);

      setHasGenerated(true);
      console.log('[SermonPreview] Generated slides:', sermonContent.slides.length);
    } catch (error) {
      console.error('[SermonPreview] Error generating slides:', error);
    }
  };

  /**
   * Send to live display
   */
  const handleSendToLive = async () => {
    if (!hasGenerated) {
      console.warn('[SermonPreview] Cannot send to live: no slides generated');
      return;
    }

    // Create live display if not active
    if (!liveDisplayActive) {
      await createLiveDisplay();
      await new Promise(resolve => setTimeout(resolve, 300));
    }

    // Start live presentation
    await presentation.startLive();

    console.log('[SermonPreview] Sent to live display');
  };

  /**
   * Add new outline point
   */
  const handleAddPoint = () => {
    setOutlinePoints([...outlinePoints, 'New Point']);
  };

  /**
   * Update outline point
   */
  const handleUpdatePoint = (index: number, value: string) => {
    const newPoints = [...outlinePoints];
    newPoints[index] = value;
    setOutlinePoints(newPoints);
  };

  /**
   * Delete outline point
   */
  const handleDeletePoint = (index: number) => {
    const newPoints = outlinePoints.filter((_, i) => i !== index);
    setOutlinePoints(newPoints);
  };

  const currentSlide = presentation.current.content?.slides?.[presentation.current.slideIndex];

  return (
    <div className={`flex flex-col h-full bg-background ${className}`}>
      {/* Header */}
      <div className="flex-shrink-0 border-b border-border bg-card px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Mic className="w-5 h-5 text-green-400" />
            <div>
              <h2 className="text-lg font-semibold text-foreground">Sermon Preview</h2>
              <p className="text-sm text-muted-foreground">
                {presentation.slideCount > 0 ? `${presentation.slideCount} slides generated` : 'Edit and preview'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onOpenDetails && (
              <button
                onClick={onOpenDetails}
                className="px-3 py-2 text-sm bg-secondary hover:bg-secondary/70 text-foreground rounded flex items-center gap-2 transition-colors"
                title="Full sermon editor (coming soon)"
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
            <Edit className="w-4 h-4 text-green-400" />
            Edit Sermon
          </h3>

          <div className="space-y-4">
            {/* Title */}
            <div>
              <label className="block text-sm font-medium mb-2 text-muted-foreground">
                Title *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded bg-input text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Sermon title..."
              />
            </div>

            {/* Speaker */}
            <div>
              <label className="block text-sm font-medium mb-2 text-muted-foreground">
                Speaker
              </label>
              <input
                type="text"
                value={speaker}
                onChange={(e) => setSpeaker(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded bg-input text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Speaker name..."
              />
            </div>

            {/* Date */}
            <div>
              <label className="block text-sm font-medium mb-2 text-muted-foreground">
                Date
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded bg-input text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Scripture Reference */}
            <div>
              <label className="block text-sm font-medium mb-2 text-muted-foreground">
                Scripture Reference
              </label>
              <input
                type="text"
                value={scriptureReference}
                onChange={(e) => setScriptureReference(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded bg-input text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., John 3:16-17"
              />
            </div>

            {/* Outline Points */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-muted-foreground">
                  Sermon Outline
                </label>
                <button
                  onClick={handleAddPoint}
                  className="px-2 py-1 text-xs bg-green-600 hover:bg-green-700 text-white rounded flex items-center gap-1 transition-colors"
                >
                  <Plus className="w-3 h-3" />
                  Add Point
                </button>
              </div>

              {outlinePoints.length === 0 ? (
                <div className="p-4 border border-dashed border-border rounded text-center text-sm text-muted-foreground">
                  No outline points yet. Click "Add Point" to start.
                </div>
              ) : (
                <div className="space-y-2">
                  {outlinePoints.map((point, index) => (
                    <div key={index} className="flex items-start gap-2">
                      <span className="text-sm font-medium text-muted-foreground mt-2 min-w-[24px]">
                        {index + 1}.
                      </span>
                      <input
                        type="text"
                        value={point}
                        onChange={(e) => handleUpdatePoint(index, e.target.value)}
                        className="flex-1 px-2 py-1 text-sm border border-border rounded bg-input text-foreground focus:outline-none focus:ring-1 focus:ring-blue-500"
                        placeholder={`Point ${index + 1}`}
                      />
                      <button
                        onClick={() => handleDeletePoint(index)}
                        className="p-1 text-red-400 hover:bg-red-500/20 rounded transition-colors"
                        title="Delete point"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* TODO Note */}
            <div className="p-3 bg-green-500/10 border border-green-500/20 rounded text-sm text-green-400">
              <div className="font-medium mb-1">🚧 Coming Soon</div>
              <div className="text-xs space-y-1">
                <div>• Scripture passage integration</div>
                <div>• Sub-points and notes per point</div>
                <div>• Media attachments</div>
                <div>• Timer and duration tracking</div>
                <div>• Series and topic management</div>
              </div>
            </div>
          </div>
        </div>

        {/* Right side - Preview */}
        <div className="flex-1 bg-card border border-border rounded-lg overflow-hidden flex flex-col">
          <div className="flex-shrink-0 p-4 border-b border-border bg-secondary/50">
            <h3 className="font-medium text-foreground flex items-center gap-2">
              <Eye className="w-4 h-4 text-green-400" />
              Slide Preview
            </h3>
            <p className="text-xs text-muted-foreground mt-1">
              {presentation.slideCount > 0 && (
                <>Slide {presentation.current.slideIndex + 1} of {presentation.slideCount}</>
              )}
            </p>
          </div>

          <div className="flex-1 p-4 flex items-center justify-center bg-background overflow-hidden">
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
                <Mic className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <div>Add sermon details to generate slides</div>
              </div>
            )}
          </div>

          {/* Slide Navigation */}
          {presentation.slideCount > 1 && (
            <div className="flex-shrink-0 border-t border-border p-3">
              <div className="flex items-center justify-between">
                <button
                  onClick={() => presentation.previous()}
                  disabled={presentation.current.slideIndex === 0}
                  className="px-3 py-1 bg-secondary hover:bg-secondary/70 text-foreground rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  ← Previous
                </button>
                <span className="text-sm text-muted-foreground">
                  {presentation.current.slideIndex + 1} / {presentation.slideCount}
                </span>
                <button
                  onClick={() => presentation.next()}
                  disabled={presentation.current.slideIndex === presentation.slideCount - 1}
                  className="px-3 py-1 bg-secondary hover:bg-secondary/70 text-foreground rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next →
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Status Bar */}
      <div className="flex-shrink-0 border-t border-border bg-card px-4 py-2">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-4 text-muted-foreground">
            <span>Sermon</span>
            {outlinePoints.length > 0 && (
              <>
                <span>•</span>
                <span>{outlinePoints.length} point{outlinePoints.length !== 1 ? 's' : ''}</span>
              </>
            )}
            {hasGenerated && presentation.slideCount > 0 && (
              <>
                <span>•</span>
                <span>{presentation.slideCount} slides</span>
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

export default SermonPreview;
