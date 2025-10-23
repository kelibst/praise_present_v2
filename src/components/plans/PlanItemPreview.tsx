import React, { useState, useEffect } from 'react';
import {
  Music,
  BookOpen,
  Film,
  MessageCircle,
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Eye,
  X
} from 'lucide-react';
import { PlanItemWithContent, PlanItemType } from '../../types/plan';

/**
 * PlanItemPreview Component
 *
 * Displays thumbnail preview and content status for plan items.
 * Shows hover tooltips with detailed content information.
 */

export type ContentStatus = 'ready' | 'missing' | 'loading' | 'error';

interface PlanItemPreviewProps {
  item: PlanItemWithContent;
  showThumbnail?: boolean;
  showStatus?: boolean;
  onClick?: () => void;
  className?: string;
}

const ITEM_TYPE_ICONS: Record<PlanItemType, React.ComponentType<any>> = {
  song: Music,
  scripture: BookOpen,
  presentation: Film,
  announcement: MessageCircle,
  media: ImageIcon,
  transition: Film
};

const ITEM_TYPE_COLORS: Record<PlanItemType, string> = {
  song: 'text-blue-400 bg-blue-900/20',
  scripture: 'text-green-400 bg-green-900/20',
  presentation: 'text-purple-400 bg-purple-900/20',
  announcement: 'text-yellow-400 bg-yellow-900/20',
  media: 'text-red-400 bg-red-900/20',
  transition: 'text-gray-400 bg-gray-900/20'
};

export const PlanItemPreview: React.FC<PlanItemPreviewProps> = ({
  item,
  showThumbnail = true,
  showStatus = true,
  onClick,
  className = ''
}) => {
  const [contentStatus, setContentStatus] = useState<ContentStatus>('loading');
  const [contentData, setContentData] = useState<any>(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  const Icon = ITEM_TYPE_ICONS[item.type as PlanItemType] || MessageCircle;
  const colorClasses = ITEM_TYPE_COLORS[item.type as PlanItemType] || ITEM_TYPE_COLORS.announcement;

  // Load content data and determine status
  useEffect(() => {
    const loadContent = async () => {
      setContentStatus('loading');

      try {
        // Check if content exists
        if (item.type === 'song' && !item.songId) {
          setContentStatus('missing');
          return;
        }
        if (item.type === 'scripture' && !item.scriptureRef) {
          setContentStatus('missing');
          return;
        }
        if (item.type === 'presentation' && !item.presentationId) {
          setContentStatus('missing');
          return;
        }

        // For announcements and transitions, always ready
        if (item.type === 'announcement' || item.type === 'transition') {
          setContentStatus('ready');
          setContentData({ title: item.title, notes: item.notes });
          return;
        }

        // Load actual content via IPC
        if (window.electronAPI?.invoke) {
          let data = null;

          if (item.type === 'song' && item.songId) {
            data = await window.electronAPI.invoke('db:getSong', item.songId);
          } else if (item.type === 'scripture' && item.scriptureRef) {
            const verses = await window.electronAPI.invoke('db:searchVerses', {
              query: item.scriptureRef,
              limit: 10
            });
            data = verses && verses.length > 0 ? { verses } : null;
          } else if (item.type === 'presentation' && item.presentationId) {
            data = await window.electronAPI.invoke('db:getPresentation', item.presentationId);
          }

          if (data) {
            setContentData(data);
            setContentStatus('ready');
          } else {
            setContentStatus('missing');
          }
        } else {
          setContentStatus('error');
        }
      } catch (error) {
        console.error('Error loading content:', error);
        setContentStatus('error');
      }
    };

    loadContent();
  }, [item.type, item.songId, item.scriptureRef, item.presentationId]);

  // Get status icon and color
  const getStatusIcon = () => {
    switch (contentStatus) {
      case 'ready':
        return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      case 'missing':
        return <AlertCircle className="w-4 h-4 text-yellow-500" />;
      case 'loading':
        return <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
    }
  };

  const getStatusText = () => {
    switch (contentStatus) {
      case 'ready':
        return 'Ready';
      case 'missing':
        return 'Content Missing';
      case 'loading':
        return 'Loading...';
      case 'error':
        return 'Error';
    }
  };

  // Generate thumbnail
  const renderThumbnail = () => {
    if (!showThumbnail) return null;

    return (
      <div className={`
        relative w-24 h-16 rounded-lg flex items-center justify-center
        ${colorClasses} border border-gray-600
      `}>
        <Icon className="w-8 h-8" />

        {/* Status Badge */}
        {showStatus && (
          <div className="absolute -top-1 -right-1">
            {getStatusIcon()}
          </div>
        )}
      </div>
    );
  };

  // Render content preview in modal
  const renderContentPreview = () => {
    if (!contentData) return null;

    switch (item.type) {
      case 'song':
        return (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3 text-sm">
              {contentData.artist && (
                <div>
                  <span className="text-gray-400">Artist:</span>{' '}
                  <span className="text-white">{contentData.artist}</span>
                </div>
              )}
              {contentData.author && (
                <div>
                  <span className="text-gray-400">Author:</span>{' '}
                  <span className="text-white">{contentData.author}</span>
                </div>
              )}
              {contentData.key && (
                <div>
                  <span className="text-gray-400">Key:</span>{' '}
                  <span className="text-white">{contentData.key}</span>
                </div>
              )}
              {contentData.tempo && (
                <div>
                  <span className="text-gray-400">Tempo:</span>{' '}
                  <span className="text-white">{contentData.tempo} BPM</span>
                </div>
              )}
              {contentData.ccliNumber && (
                <div className="col-span-2">
                  <span className="text-gray-400">CCLI:</span>{' '}
                  <span className="text-white">{contentData.ccliNumber}</span>
                </div>
              )}
            </div>
            {contentData.lyrics && (
              <div>
                <div className="text-sm font-medium text-gray-300 mb-2">Lyrics Preview:</div>
                <div className="bg-gray-900 rounded-lg p-3 text-sm text-gray-300 max-h-64 overflow-y-auto whitespace-pre-wrap">
                  {contentData.lyrics.split('\n').slice(0, 20).join('\n')}
                  {contentData.lyrics.split('\n').length > 20 && '\n...'}
                </div>
              </div>
            )}
          </div>
        );

      case 'scripture':
        return (
          <div className="space-y-3">
            {contentData.verses && contentData.verses.length > 0 && (
              <div>
                <div className="text-sm font-medium text-gray-300 mb-2">
                  {contentData.verses.length} verse{contentData.verses.length > 1 ? 's' : ''}
                </div>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {contentData.verses.map((verse: any, index: number) => (
                    <div key={index} className="bg-gray-900 rounded-lg p-3">
                      <div className="text-xs font-medium text-blue-400 mb-1">
                        {verse.book} {verse.chapter}:{verse.verse}
                      </div>
                      <div className="text-sm text-gray-300">{verse.text}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );

      case 'presentation':
        return (
          <div className="space-y-3">
            {contentData.description && (
              <div>
                <span className="text-gray-400">Description:</span>{' '}
                <span className="text-white">{contentData.description}</span>
              </div>
            )}
            <div className="text-sm text-gray-400">
              Total slides: {contentData.slides?.length || 0}
            </div>
          </div>
        );

      case 'announcement':
      case 'transition':
        return (
          <div className="space-y-3">
            <div className="text-sm text-gray-300">{item.notes || 'No additional details'}</div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <>
      <div
        onClick={onClick}
        className={`
          flex items-center gap-3 p-3 rounded-lg border border-gray-600 bg-gray-700
          hover:bg-gray-600 hover:border-gray-500 transition-all cursor-pointer
          ${className}
        `}
      >
        {/* Thumbnail */}
        {renderThumbnail()}

        {/* Content Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-medium text-white truncate">{item.title}</h4>
            {showStatus && (
              <span className="text-xs text-gray-400">{getStatusText()}</span>
            )}
          </div>
          <div className="text-xs text-gray-400 truncate">
            {item.type.charAt(0).toUpperCase() + item.type.slice(1)}
            {item.duration && ` • ${item.duration} min`}
          </div>
        </div>

        {/* Preview Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            setShowPreviewModal(true);
          }}
          className="p-2 text-blue-400 hover:text-blue-300 hover:bg-gray-600 rounded transition-colors"
          title="Preview content"
        >
          <Eye className="w-4 h-4" />
        </button>
      </div>

      {/* Preview Modal */}
      {showPreviewModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg border border-gray-700 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-700 sticky top-0 bg-gray-800 z-10">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded ${colorClasses}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">{item.title}</h3>
                  <div className="text-sm text-gray-400">
                    {item.type.charAt(0).toUpperCase() + item.type.slice(1)}
                  </div>
                </div>
              </div>
              <button
                onClick={() => setShowPreviewModal(false)}
                className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6">
              {contentStatus === 'loading' && (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                  <span className="ml-3 text-gray-400">Loading content...</span>
                </div>
              )}

              {contentStatus === 'missing' && (
                <div className="flex items-center justify-center py-12 text-yellow-500">
                  <AlertCircle className="w-8 h-8 mr-3" />
                  <span>Content not found or not linked</span>
                </div>
              )}

              {contentStatus === 'error' && (
                <div className="flex items-center justify-center py-12 text-red-500">
                  <AlertCircle className="w-8 h-8 mr-3" />
                  <span>Error loading content</span>
                </div>
              )}

              {contentStatus === 'ready' && renderContentPreview()}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-700 bg-gray-800">
              <button
                onClick={() => setShowPreviewModal(false)}
                className="px-4 py-2 text-gray-300 border border-gray-600 rounded hover:bg-gray-700 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default PlanItemPreview;
