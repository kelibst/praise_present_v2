import React, { useState, useEffect } from 'react';
import {
  GripVertical,
  Trash2,
  Edit3,
  Music,
  BookOpen,
  Film,
  MessageCircle,
  Clock,
  ChevronDown,
  ChevronUp,
  ExternalLink
} from 'lucide-react';
import { PlanItemWithContent, PlanItemType } from '../../types/plan';
import { planService } from '../../lib/services/planService';

interface PlanItemEditorProps {
  item: PlanItemWithContent;
  index: number;
  onUpdate: (index: number, field: keyof PlanItemWithContent, value: any) => Promise<void>;
  onDelete: (index: number) => Promise<void>;
  onDragStart: (e: React.DragEvent, index: number) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent, index: number) => void;
  onDragEnd: () => void;
  isDragging: boolean;
}

const ITEM_TYPE_ICONS: Record<PlanItemType, React.ComponentType<any>> = {
  song: Music,
  scripture: BookOpen,
  presentation: Film,
  announcement: MessageCircle,
  media: Film,
  transition: ChevronDown
};

const ITEM_TYPE_COLORS: Record<PlanItemType, string> = {
  song: 'text-blue-400 bg-blue-900/20 border-blue-500',
  scripture: 'text-green-400 bg-green-900/20 border-green-500',
  presentation: 'text-purple-400 bg-purple-900/20 border-purple-500',
  announcement: 'text-yellow-400 bg-yellow-900/20 border-yellow-500',
  media: 'text-red-400 bg-red-900/20 border-red-500',
  transition: 'text-gray-400 bg-gray-900/20 border-gray-500'
};

export const PlanItemEditor: React.FC<PlanItemEditorProps> = ({
  item,
  index,
  onUpdate,
  onDelete,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
  isDragging
}) => {
  const [expanded, setExpanded] = useState(false);
  const [contentData, setContentData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const Icon = ITEM_TYPE_ICONS[item.type as PlanItemType];
  const colorClasses = ITEM_TYPE_COLORS[item.type as PlanItemType];

  // Load content data when item is expanded
  useEffect(() => {
    if (expanded && !contentData && (item.songId || item.presentationId || item.scriptureRef)) {
      loadContentData();
    }
  }, [expanded, item]);

  const loadContentData = async () => {
    setLoading(true);
    try {
      const content = await planService.getPlanItemContent(item);
      setContentData(content);
    } catch (err) {
      console.error('Error loading content data:', err);
    } finally {
      setLoading(false);
    }
  };

  const renderContentPreview = () => {
    if (!contentData) return null;

    switch (item.type) {
      case 'song':
        return (
          <div className="bg-gray-800 rounded-lg p-3 mt-2">
            <div className="text-sm font-medium text-blue-400">Song Details</div>
            <div className="mt-1 text-sm text-gray-300">
              <div><strong>Title:</strong> {contentData.title}</div>
              {contentData.artist && <div><strong>Artist:</strong> {contentData.artist}</div>}
              {contentData.author && <div><strong>Author:</strong> {contentData.author}</div>}
              {contentData.key && <div><strong>Key:</strong> {contentData.key}</div>}
              {contentData.tempo && <div><strong>Tempo:</strong> {contentData.tempo} BPM</div>}
              {contentData.ccliNumber && <div><strong>CCLI:</strong> {contentData.ccliNumber}</div>}
            </div>
            {contentData.lyrics && (
              <div className="mt-2 text-xs text-gray-400 max-h-16 overflow-hidden">
                {contentData.lyrics.split('\n').slice(0, 3).join('\n')}
                {contentData.lyrics.split('\n').length > 3 && '...'}
              </div>
            )}
          </div>
        );

      case 'scripture':
        return (
          <div className="bg-gray-800 rounded-lg p-3 mt-2">
            <div className="text-sm font-medium text-green-400">Scripture Details</div>
            <div className="mt-1 text-sm text-gray-300">
              <div><strong>Reference:</strong> {contentData.book?.name} {contentData.chapter}:{contentData.verse}</div>
              {contentData.version && <div><strong>Version:</strong> {contentData.version.name}</div>}
            </div>
            <div className="mt-2 text-sm text-gray-300 italic">
              "{contentData.text}"
            </div>
          </div>
        );

      case 'presentation':
        return (
          <div className="bg-gray-800 rounded-lg p-3 mt-2">
            <div className="text-sm font-medium text-purple-400">Presentation Details</div>
            <div className="mt-1 text-sm text-gray-300">
              <div><strong>Title:</strong> {contentData.title}</div>
              {contentData.description && <div><strong>Description:</strong> {contentData.description}</div>}
              <div><strong>Slides:</strong> {contentData.totalSlides || 0}</div>
              {contentData.category && <div><strong>Category:</strong> {contentData.category}</div>}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, index)}
      onDragOver={onDragOver}
      onDrop={(e) => onDrop(e, index)}
      onDragEnd={onDragEnd}
      className={`bg-gray-700 border border-gray-600 rounded-lg transition-all ${
        isDragging ? 'opacity-50 scale-95' : ''
      } hover:border-gray-500`}
    >
      {/* Main Item Content */}
      <div className="p-4">
        <div className="flex items-center gap-3">
          <GripVertical className="w-4 h-4 text-gray-400 flex-shrink-0 cursor-move" />

          <div className={`p-2 rounded border ${colorClasses} flex-shrink-0`}>
            <Icon className="w-4 h-4" />
          </div>

          <div className="flex-1 min-w-0">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              {/* Type Selection */}
              <div>
                <select
                  value={item.type}
                  onChange={(e) => onUpdate(index, 'type', e.target.value)}
                  className="w-full px-2 py-1 bg-gray-800 border border-gray-600 rounded text-white text-sm focus:outline-none focus:border-blue-500"
                >
                  <option value="song">Song</option>
                  <option value="scripture">Scripture</option>
                  <option value="presentation">Presentation</option>
                  <option value="announcement">Announcement</option>
                  <option value="media">Media</option>
                  <option value="transition">Transition</option>
                </select>
              </div>

              {/* Title */}
              <div className="md:col-span-2">
                <input
                  type="text"
                  value={item.title}
                  onChange={(e) => onUpdate(index, 'title', e.target.value)}
                  placeholder="Item title..."
                  className="w-full px-2 py-1 bg-gray-800 border border-gray-600 rounded text-white text-sm focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Duration and Actions */}
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1">
                  <Clock className="w-3 h-3 text-gray-400" />
                  <input
                    type="number"
                    value={item.duration || ''}
                    onChange={(e) => onUpdate(index, 'duration', parseInt(e.target.value) || 0)}
                    placeholder="0"
                    min="0"
                    className="w-14 px-1 py-1 bg-gray-800 border border-gray-600 rounded text-white text-xs focus:outline-none focus:border-blue-500"
                  />
                  <span className="text-xs text-gray-400">min</span>
                </div>

                <div className="flex items-center gap-1 ml-auto">
                  {(item.songId || item.presentationId || item.scriptureRef) && (
                    <button
                      onClick={() => setExpanded(!expanded)}
                      className="p-1 text-gray-400 hover:text-white rounded transition-colors"
                      title={expanded ? 'Collapse details' : 'Show details'}
                    >
                      {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  )}

                  <button
                    onClick={() => setExpanded(!expanded)}
                    className="p-1 text-gray-400 hover:text-white rounded transition-colors"
                    title="Edit item"
                  >
                    <Edit3 className="w-3 h-3" />
                  </button>

                  <button
                    onClick={() => onDelete(index)}
                    className="p-1 text-red-400 hover:text-red-300 rounded transition-colors"
                    title="Remove item"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Notes */}
        {expanded && (
          <div className="mt-3 pl-7">
            <textarea
              value={item.notes || ''}
              onChange={(e) => onUpdate(index, 'notes', e.target.value)}
              placeholder="Add notes or instructions for this item..."
              rows={2}
              className="w-full px-2 py-1 bg-gray-800 border border-gray-600 rounded text-white text-sm focus:outline-none focus:border-blue-500 resize-none"
            />
          </div>
        )}
      </div>

      {/* Content Preview */}
      {expanded && (
        <div className="px-4 pb-4">
          <div className="pl-7">
            {loading ? (
              <div className="bg-gray-800 rounded-lg p-3 text-center text-gray-400">
                Loading content...
              </div>
            ) : (
              renderContentPreview()
            )}

            {!contentData && !loading && (item.songId || item.presentationId || item.scriptureRef) && (
              <div className="bg-gray-800 rounded-lg p-3 text-center text-gray-400">
                <div className="text-sm">Content not found</div>
                <div className="text-xs mt-1">
                  {item.type === 'song' && item.songId && `Song ID: ${item.songId}`}
                  {item.type === 'presentation' && item.presentationId && `Presentation ID: ${item.presentationId}`}
                  {item.type === 'scripture' && item.scriptureRef && `Scripture Ref: ${item.scriptureRef}`}
                </div>
              </div>
            )}

            {!item.songId && !item.presentationId && !item.scriptureRef && item.type !== 'announcement' && item.type !== 'transition' && (
              <div className="bg-yellow-900/20 border border-yellow-600 rounded-lg p-3">
                <div className="text-sm text-yellow-400">No content linked</div>
                <div className="text-xs text-yellow-300 mt-1">
                  This {item.type} item is not linked to any specific content.
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default PlanItemEditor;