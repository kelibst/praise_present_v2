import React, { useState, useEffect } from 'react';
import { BookOpen, Send, Eye, ChevronRight } from 'lucide-react';
import BibleSelector from './BibleSelector';
import { ScriptureVerse } from '../../lib/services/bibleService';
import { NavigatedVerse } from '../../lib/services/scriptureNavigationService';
import { useFeatureSettings } from '../../hooks/useFeatureSettings';
import { buildScriptureContent } from '../../lib/contentBuilders';
import { usePresentation } from '../../hooks/usePresentation';
import { useLiveDisplay } from '../live/LiveDisplayManager';
import { ServiceItem } from '../service/ServiceItem';

interface ScripturePreviewProps {
  /**
   * Service item containing scripture reference
   */
  item: ServiceItem;

  /**
   * Callback when user wants to open full scripture editor
   */
  onOpenDetails?: () => void;

  /**
   * CSS class name
   */
  className?: string;
}

/**
 * ScripturePreview - Rich preview for scripture items from plan
 *
 * Features:
 * - Reuses BibleSelector for verse selection and navigation
 * - Shows "whole thing" like Scripture Tab
 * - Verse-by-verse navigation
 * - Group management
 * - Send to Live button
 * - Integration with existing presentation system
 *
 * Usage:
 * ```typescript
 * <ScripturePreview
 *   item={scriptureServiceItem}
 *   onOpenDetails={() => navigate('/scripture')}
 * />
 * ```
 */
export const ScripturePreview: React.FC<ScripturePreviewProps> = ({
  item,
  onOpenDetails,
  className = ''
}) => {
  const { scriptureSettings } = useFeatureSettings();
  const presentation = usePresentation();
  const { liveDisplayActive, createLiveDisplay } = useLiveDisplay();

  const [selectedVerses, setSelectedVerses] = useState<ScriptureVerse[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasGenerated, setHasGenerated] = useState(false);

  // Extract initial verse references from service item
  useEffect(() => {
    // If item has pre-loaded verse data, use it
    if (item.content.verseData && Array.isArray(item.content.verseData)) {
      setSelectedVerses(item.content.verseData);
      handleGenerateSlides(item.content.verseData);
    }
    // Otherwise, try to parse from reference string or verse references array
    else if (item.content.verseReferences || item.content.reference) {
      // For now, user will need to use BibleSelector to select verses
      // TODO: Auto-parse references like "John 3:16-17" and fetch verses
      console.log('[ScripturePreview] Item has references but no verse data:', item.content);
    }
  }, [item]);

  /**
   * Handle verse selection from BibleSelector
   */
  const handleVerseSelect = async (verses: ScriptureVerse[]) => {
    setSelectedVerses(verses);
    await handleGenerateSlides(verses);
  };

  /**
   * Generate slides from selected verses
   */
  const handleGenerateSlides = async (verses: ScriptureVerse[]) => {
    if (verses.length === 0) return;

    setIsLoading(true);

    try {
      // Convert to NavigatedVerse format
      const navigatedVerses = verses.map(v => ({ ...v })) as NavigatedVerse[];

      // Create individual groups (one slide per verse, like Scripture Tab does)
      const individualGroups = navigatedVerses.map(verse => ({
        verses: [verse],
        reference: `${verse.book} ${verse.chapter}:${verse.verse}`,
        isConsecutive: false
      }));

      // Build presentation content
      const scriptureContent = await buildScriptureContent(
        navigatedVerses,
        scriptureSettings,
        individualGroups
      );

      // Switch presentation to this content
      await presentation.switchTo(scriptureContent);

      setHasGenerated(true);
      console.log('[ScripturePreview] Generated slides:', scriptureContent.slides.length);
    } catch (error) {
      console.error('[ScripturePreview] Error generating slides:', error);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Send to live display
   */
  const handleSendToLive = async () => {
    if (!hasGenerated) {
      console.warn('[ScripturePreview] Cannot send to live: no slides generated');
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

    console.log('[ScripturePreview] Sent to live display');
  };

  return (
    <div className={`flex flex-col h-full bg-background ${className}`}>
      {/* Header */}
      <div className="flex-shrink-0 border-b border-border bg-card px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BookOpen className="w-5 h-5 text-purple-400" />
            <div>
              <h2 className="text-lg font-semibold text-foreground">{item.title}</h2>
              <p className="text-sm text-muted-foreground">
                {selectedVerses.length > 0
                  ? `${selectedVerses.length} verse${selectedVerses.length !== 1 ? 's' : ''} selected`
                  : 'Select verses to preview'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onOpenDetails && (
              <button
                onClick={onOpenDetails}
                className="px-3 py-2 text-sm bg-secondary hover:bg-secondary/70 text-foreground rounded flex items-center gap-2 transition-colors"
              >
                <Eye className="w-4 h-4" />
                Open Scripture Tab
              </button>
            )}

            <button
              onClick={handleSendToLive}
              disabled={!hasGenerated || isLoading}
              className={`px-4 py-2 text-sm rounded flex items-center gap-2 transition-colors ${
                hasGenerated && !isLoading
                  ? 'bg-green-600 hover:bg-green-700 text-white'
                  : 'bg-secondary text-muted-foreground cursor-not-allowed opacity-50'
              }`}
              title={!hasGenerated ? 'Select verses first' : 'Send to live display'}
            >
              <Send className="w-4 h-4" />
              Send to Live
            </button>
          </div>
        </div>
      </div>

      {/* Content - Bible Selector */}
      <div className="flex-1 min-h-0 overflow-hidden">
        <div className="h-full p-4">
          <div className="bg-card border border-border rounded-lg h-full overflow-hidden">
            <div className="p-4 border-b border-border bg-secondary/50">
              <h3 className="font-medium text-foreground flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-purple-400" />
                Select Verses
              </h3>
              <p className="text-xs text-muted-foreground mt-1">
                Use the verse selector below to choose scripture passages. Slides will be generated automatically.
              </p>
            </div>

            <div className="p-4 overflow-y-auto" style={{ height: 'calc(100% - 80px)' }}>
              <BibleSelector
                onVerseSelect={handleVerseSelect}
                defaultVersion="kjv"
                activeVerses={selectedVerses.map(v => v.verse)}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Status Bar */}
      <div className="flex-shrink-0 border-t border-border bg-card px-4 py-2">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-4 text-muted-foreground">
            <span>
              {selectedVerses.length > 0
                ? `${selectedVerses.length} verse${selectedVerses.length !== 1 ? 's' : ''}`
                : 'No verses selected'}
            </span>
            {hasGenerated && presentation.slideCount > 0 && (
              <>
                <span>•</span>
                <span>{presentation.slideCount} slides generated</span>
              </>
            )}
            {isLoading && (
              <>
                <span>•</span>
                <span className="text-blue-400">Generating slides...</span>
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

export default ScripturePreview;
