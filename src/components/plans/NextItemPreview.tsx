import React from 'react';
import { useSelector } from 'react-redux';
import {
  Clock,
  User,
  AlertCircle,
  ChevronRight,
  Music,
  BookOpen,
  Film,
  MessageSquare,
  ArrowRight,
  FileText
} from 'lucide-react';
import { RootState } from '../../lib/store';
import { PlanItemType } from '../../types/plan';

/**
 * NextItemPreview Component
 *
 * Preview of upcoming items during live execution:
 * - Next 3-5 items preview
 * - Preparation countdown
 * - Assignee alerts
 * - Technical cue highlights
 * - Duration warnings
 */

interface NextItemPreviewProps {
  previewCount?: number;
  showCountdown?: boolean;
  onJumpToItem?: (itemId: string) => void;
  className?: string;
}

const ITEM_TYPE_CONFIG: Record<
  PlanItemType,
  { label: string; icon: React.ComponentType<any>; color: string }
> = {
  song: { label: 'Song', icon: Music, color: 'text-blue-400 bg-blue-900/20' },
  scripture: { label: 'Scripture', icon: BookOpen, color: 'text-green-400 bg-green-900/20' },
  presentation: {
    label: 'Presentation',
    icon: Film,
    color: 'text-purple-400 bg-purple-900/20'
  },
  announcement: {
    label: 'Announcement',
    icon: MessageSquare,
    color: 'text-orange-400 bg-orange-900/20'
  },
  transition: { label: 'Transition', icon: ArrowRight, color: 'text-gray-400 bg-gray-900/20' }
};

export const NextItemPreview: React.FC<NextItemPreviewProps> = ({
  previewCount = 3,
  showCountdown = true,
  onJumpToItem,
  className = ''
}) => {
  const executionState = useSelector((state: RootState) => state.planExecution);

  const isExecuting = executionState.isExecuting;
  const currentIndex = executionState.currentItemIndex;
  const allItems = executionState.activePlan?.items || [];

  // Get upcoming items
  const upcomingItems = allItems.slice(currentIndex + 1, currentIndex + 1 + previewCount);

  if (!isExecuting || upcomingItems.length === 0) {
    return null;
  }

  // Calculate time until next item (current item remaining time)
  const getCurrentItemRemainingTime = (): number => {
    const currentItem = allItems[currentIndex];
    if (!currentItem) return 0;

    const itemTiming = executionState.itemTimings[currentItem.id];
    if (!itemTiming || !itemTiming.startedAt) return (currentItem.duration || 0) * 60;

    const elapsed = (Date.now() - itemTiming.startedAt) / 1000;
    const planned = (currentItem.duration || 0) * 60;
    return Math.max(0, planned - elapsed);
  };

  const remainingTime = getCurrentItemRemainingTime();

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const getUrgencyColor = (seconds: number): string => {
    if (seconds <= 30) return 'text-red-400 animate-pulse';
    if (seconds <= 60) return 'text-yellow-400';
    return 'text-green-400';
  };

  return (
    <div className={`${className}`}>
      {/* Header with Countdown */}
      <div className="bg-gray-900 border border-gray-700 rounded-lg p-4 mb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ChevronRight className="w-5 h-5 text-gray-400" />
            <h3 className="font-medium text-white">Coming Up</h3>
          </div>

          {showCountdown && (
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-400">Next in</span>
              <span className={`text-lg font-mono font-medium ${getUrgencyColor(remainingTime)}`}>
                {formatTime(remainingTime)}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Upcoming Items List */}
      <div className="space-y-2">
        {upcomingItems.map((item, index) => {
          const config = ITEM_TYPE_CONFIG[item.type];
          const Icon = config.icon;
          const isNext = index === 0;

          // Parse settings for cues
          let hasCues = false;
          let cueCount = 0;
          try {
            if (item.settings) {
              const settings = JSON.parse(item.settings);
              if (settings.cues && settings.cues.length > 0) {
                hasCues = true;
                cueCount = settings.cues.length;
              }
            }
          } catch (e) {
            // Ignore parse errors
          }

          return (
            <div
              key={item.id}
              onClick={() => onJumpToItem && onJumpToItem(item.id)}
              className={`
                bg-gray-900 border-2 rounded-lg p-3 transition-all
                ${
                  isNext
                    ? 'border-blue-500 bg-blue-900/10'
                    : 'border-gray-700 hover:border-gray-600'
                }
                ${onJumpToItem ? 'cursor-pointer hover:bg-gray-800/50' : ''}
              `}
            >
              {/* Header */}
              <div className="flex items-center gap-3 mb-2">
                {/* Position Badge */}
                <div
                  className={`
                  flex items-center justify-center w-8 h-8 rounded-full font-medium text-sm
                  ${isNext ? 'bg-blue-500 text-white' : 'bg-gray-700 text-gray-300'}
                `}
                >
                  {index + 1}
                </div>

                {/* Type Icon */}
                <div className={`p-2 rounded ${config.color}`}>
                  <Icon className="w-4 h-4" />
                </div>

                {/* Title */}
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-white truncate">{item.title}</div>
                  <div className="flex items-center gap-3 text-xs text-gray-400 mt-1">
                    <span>{config.label}</span>
                    {item.duration && (
                      <>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {item.duration} min
                        </span>
                      </>
                    )}
                  </div>
                </div>

                {/* Next Badge */}
                {isNext && (
                  <div className="px-2 py-1 bg-blue-500 text-white text-xs font-medium rounded">
                    NEXT
                  </div>
                )}
              </div>

              {/* Additional Info */}
              <div className="flex items-center gap-3 text-sm">
                {/* Assignee */}
                {item.assignee && (
                  <div className="flex items-center gap-1.5 text-purple-400">
                    <User className="w-4 h-4" />
                    <span>{item.assignee}</span>
                  </div>
                )}

                {/* Technical Cues */}
                {hasCues && (
                  <div className="flex items-center gap-1.5 text-yellow-400">
                    <AlertCircle className="w-4 h-4" />
                    <span>{cueCount} cue{cueCount !== 1 ? 's' : ''}</span>
                  </div>
                )}

                {/* Notes Indicator */}
                {item.notes && (
                  <div className="flex items-center gap-1.5 text-gray-400" title={item.notes}>
                    <FileText className="w-4 h-4" />
                    <span className="truncate max-w-xs">{item.notes}</span>
                  </div>
                )}
              </div>

              {/* Scripture Reference */}
              {item.type === 'scripture' && item.scriptureRef && (
                <div className="mt-2 text-xs text-green-400 bg-green-900/20 px-2 py-1 rounded inline-block">
                  {item.scriptureRef}
                </div>
              )}

              {/* Warnings */}
              {isNext && (
                <div className="mt-3 space-y-1">
                  {/* Long Duration Warning */}
                  {item.duration && item.duration > 15 && (
                    <div className="flex items-center gap-2 text-xs text-yellow-400 bg-yellow-900/20 px-2 py-1 rounded">
                      <AlertCircle className="w-3 h-3" />
                      <span>Long duration ({item.duration} min) - prepare accordingly</span>
                    </div>
                  )}

                  {/* Missing Content Warning */}
                  {item.type === 'song' && !item.songId && (
                    <div className="flex items-center gap-2 text-xs text-red-400 bg-red-900/20 px-2 py-1 rounded">
                      <AlertCircle className="w-3 h-3" />
                      <span>Song not linked - content may be missing</span>
                    </div>
                  )}

                  {item.type === 'scripture' && !item.scriptureRef && (
                    <div className="flex items-center gap-2 text-xs text-red-400 bg-red-900/20 px-2 py-1 rounded">
                      <AlertCircle className="w-3 h-3" />
                      <span>Scripture reference not set</span>
                    </div>
                  )}

                  {item.type === 'presentation' && !item.presentationId && (
                    <div className="flex items-center gap-2 text-xs text-red-400 bg-red-900/20 px-2 py-1 rounded">
                      <AlertCircle className="w-3 h-3" />
                      <span>Presentation not linked</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* End of Service Indicator */}
      {upcomingItems.length < previewCount &&
        currentIndex + upcomingItems.length + 1 >= allItems.length && (
          <div className="mt-3 p-4 bg-gray-900 border border-gray-700 rounded-lg text-center">
            <div className="text-gray-400 text-sm">
              {upcomingItems.length === 0 ? (
                <>This is the last item in the plan</>
              ) : (
                <>End of service after these items</>
              )}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              Total items: {allItems.length}
            </div>
          </div>
        )}
    </div>
  );
};

export default NextItemPreview;
