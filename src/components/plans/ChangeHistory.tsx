import React, { useState } from 'react';
import {
  History,
  User,
  Clock,
  Plus,
  Trash2,
  Edit3,
  Eye,
  ChevronRight,
  ChevronDown,
  RotateCcw,
  FileText,
  Tag
} from 'lucide-react';

/**
 * ChangeHistory Component
 *
 * Track and display all changes to a service plan:
 * - Version history with timestamps
 * - Change descriptions (added/removed/modified items)
 * - User attribution
 * - Revert to previous versions
 * - Compare versions
 * - Detailed change logs
 */

export type ChangeType = 'created' | 'added' | 'removed' | 'modified' | 'reordered' | 'status_change';

export interface PlanChange {
  id: string;
  planId: string;
  changeType: ChangeType;
  user: string;
  timestamp: Date;
  description: string;
  details?: ChangeDetails;
  versionNumber?: number;
}

export interface ChangeDetails {
  itemId?: string;
  itemType?: string;
  itemTitle?: string;
  field?: string;
  oldValue?: any;
  newValue?: any;
  oldOrder?: number;
  newOrder?: number;
  sectionId?: string;
  sectionName?: string;
}

interface ChangeHistoryProps {
  planId: string;
  changes: PlanChange[];
  currentUser: string;
  onRevertToVersion?: (versionNumber: number) => void;
  onCompareVersions?: (version1: number, version2: number) => void;
  className?: string;
}

const CHANGE_TYPE_CONFIG: Record<
  ChangeType,
  { label: string; icon: React.ComponentType<any>; color: string }
> = {
  created: { label: 'Created', icon: Plus, color: 'text-blue-400' },
  added: { label: 'Added', icon: Plus, color: 'text-green-400' },
  removed: { label: 'Removed', icon: Trash2, color: 'text-red-400' },
  modified: { label: 'Modified', icon: Edit3, color: 'text-yellow-400' },
  reordered: { label: 'Reordered', icon: Tag, color: 'text-purple-400' },
  status_change: { label: 'Status Changed', icon: FileText, color: 'text-orange-400' }
};

export const ChangeHistory: React.FC<ChangeHistoryProps> = ({
  planId,
  changes,
  currentUser,
  onRevertToVersion,
  onCompareVersions,
  className = ''
}) => {
  const [expandedChangeIds, setExpandedChangeIds] = useState<Set<string>>(new Set());
  const [filterUser, setFilterUser] = useState<string>('all');
  const [filterType, setFilterType] = useState<ChangeType | 'all'>('all');
  const [showRevertConfirm, setShowRevertConfirm] = useState<number | null>(null);

  // Get unique users from changes
  const uniqueUsers = Array.from(new Set(changes.map((c) => c.user)));

  // Filter changes
  const filteredChanges = changes.filter((change) => {
    if (filterUser !== 'all' && change.user !== filterUser) return false;
    if (filterType !== 'all' && change.changeType !== filterType) return false;
    return true;
  });

  // Group changes by date
  const changesByDate = filteredChanges.reduce((acc, change) => {
    const dateKey = new Date(change.timestamp).toLocaleDateString();
    if (!acc[dateKey]) {
      acc[dateKey] = [];
    }
    acc[dateKey].push(change);
    return acc;
  }, {} as Record<string, PlanChange[]>);

  const toggleExpanded = (changeId: string) => {
    const newExpanded = new Set(expandedChangeIds);
    if (newExpanded.has(changeId)) {
      newExpanded.delete(changeId);
    } else {
      newExpanded.add(changeId);
    }
    setExpandedChangeIds(newExpanded);
  };

  const handleRevert = (versionNumber: number) => {
    if (onRevertToVersion) {
      onRevertToVersion(versionNumber);
    }
    setShowRevertConfirm(null);
  };

  const formatTime = (date: Date): string => {
    return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatRelativeTime = (date: Date): string => {
    const now = new Date();
    const diffMs = now.getTime() - new Date(date).getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return new Date(date).toLocaleDateString();
  };

  const renderChangeDetails = (change: PlanChange) => {
    if (!change.details) return null;

    const { details } = change;

    return (
      <div className="mt-3 p-3 bg-gray-900 rounded border border-gray-700 text-sm">
        <div className="text-xs text-gray-400 mb-2">Change Details</div>

        {/* Item Info */}
        {details.itemTitle && (
          <div className="flex items-center gap-2 mb-2">
            <FileText className="w-4 h-4 text-gray-400" />
            <span className="text-white font-medium">{details.itemTitle}</span>
            {details.itemType && (
              <span className="text-xs text-gray-500 px-2 py-0.5 bg-gray-800 rounded">
                {details.itemType}
              </span>
            )}
          </div>
        )}

        {/* Section Info */}
        {details.sectionName && (
          <div className="flex items-center gap-2 mb-2">
            <Tag className="w-4 h-4 text-gray-400" />
            <span className="text-gray-300">Section: {details.sectionName}</span>
          </div>
        )}

        {/* Field Changes */}
        {details.field && (
          <div className="space-y-1">
            <div className="text-xs text-gray-500">Field: {details.field}</div>
            {details.oldValue !== undefined && (
              <div className="flex items-start gap-2">
                <span className="text-xs text-gray-500">From:</span>
                <span className="text-red-400 font-mono text-xs line-through">
                  {String(details.oldValue)}
                </span>
              </div>
            )}
            {details.newValue !== undefined && (
              <div className="flex items-start gap-2">
                <span className="text-xs text-gray-500">To:</span>
                <span className="text-green-400 font-mono text-xs">
                  {String(details.newValue)}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Order Changes */}
        {details.oldOrder !== undefined && details.newOrder !== undefined && (
          <div className="flex items-center gap-2 text-xs">
            <span className="text-gray-500">Position:</span>
            <span className="text-red-400">#{details.oldOrder + 1}</span>
            <ChevronRight className="w-3 h-3 text-gray-500" />
            <span className="text-green-400">#{details.newOrder + 1}</span>
          </div>
        )}
      </div>
    );
  };

  const renderChange = (change: PlanChange) => {
    const config = CHANGE_TYPE_CONFIG[change.changeType];
    const Icon = config.icon;
    const isExpanded = expandedChangeIds.has(change.id);
    const hasDetails = change.details && Object.keys(change.details).length > 0;

    return (
      <div
        key={change.id}
        className="bg-gray-900 border border-gray-700 rounded-lg overflow-hidden"
      >
        {/* Change Header */}
        <div
          onClick={() => hasDetails && toggleExpanded(change.id)}
          className={`
            flex items-center gap-3 p-3
            ${hasDetails ? 'cursor-pointer hover:bg-gray-800/50' : ''}
            transition-colors
          `}
        >
          {/* Type Icon */}
          <div className={`p-2 rounded bg-gray-800 ${config.color}`}>
            <Icon className="w-4 h-4" />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className={`font-medium ${config.color}`}>{config.label}</span>
              {change.versionNumber !== undefined && (
                <span className="text-xs px-2 py-0.5 bg-gray-800 text-gray-400 rounded">
                  v{change.versionNumber}
                </span>
              )}
            </div>
            <div className="text-sm text-gray-300 mt-1">{change.description}</div>
            <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
              <div className="flex items-center gap-1">
                <User className="w-3 h-3" />
                <span>{change.user}</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                <span>{formatTime(change.timestamp)}</span>
                <span className="text-gray-600">({formatRelativeTime(change.timestamp)})</span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1">
            {change.versionNumber !== undefined && onRevertToVersion && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowRevertConfirm(change.versionNumber!);
                }}
                className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded transition-colors"
                title="Revert to this version"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            )}
            {hasDetails && (
              <button className="p-2 text-gray-400">
                {isExpanded ? (
                  <ChevronDown className="w-4 h-4" />
                ) : (
                  <ChevronRight className="w-4 h-4" />
                )}
              </button>
            )}
          </div>
        </div>

        {/* Expanded Details */}
        {isExpanded && hasDetails && (
          <div className="px-3 pb-3">
            {renderChangeDetails(change)}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={`${className}`}>
      {/* Header */}
      <div className="bg-gray-900 border border-gray-700 rounded-lg p-4 mb-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <History className="w-5 h-5 text-blue-400" />
            <div>
              <h3 className="font-medium text-white">Change History</h3>
              <div className="text-sm text-gray-400">{changes.length} changes recorded</div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-3">
          {/* User Filter */}
          <select
            value={filterUser}
            onChange={(e) => setFilterUser(e.target.value)}
            className="flex-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white focus:outline-none focus:border-blue-500"
          >
            <option value="all">All Users</option>
            {uniqueUsers.map((user) => (
              <option key={user} value={user}>
                {user}
              </option>
            ))}
          </select>

          {/* Type Filter */}
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as any)}
            className="flex-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white focus:outline-none focus:border-blue-500"
          >
            <option value="all">All Changes</option>
            {(Object.keys(CHANGE_TYPE_CONFIG) as ChangeType[]).map((type) => (
              <option key={type} value={type}>
                {CHANGE_TYPE_CONFIG[type].label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Changes List */}
      {Object.keys(changesByDate).length === 0 ? (
        <div className="p-8 bg-gray-900/30 rounded-lg border border-gray-700 text-center">
          <History className="w-12 h-12 mx-auto mb-3 text-gray-600" />
          <div className="text-lg font-medium text-gray-400 mb-2">No changes found</div>
          <div className="text-sm text-gray-500">
            {filterUser !== 'all' || filterType !== 'all'
              ? 'Try adjusting your filters'
              : 'Changes will appear here as you edit the plan'}
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {Object.entries(changesByDate)
            .sort(([dateA], [dateB]) => new Date(dateB).getTime() - new Date(dateA).getTime())
            .map(([date, dateChanges]) => (
              <div key={date}>
                {/* Date Header */}
                <div className="flex items-center gap-2 mb-3 sticky top-0 bg-gray-950 py-2 z-10">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <span className="text-sm font-medium text-gray-300">{date}</span>
                  <div className="flex-1 h-px bg-gray-700" />
                </div>

                {/* Changes for this date */}
                <div className="space-y-2">
                  {dateChanges
                    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                    .map((change) => renderChange(change))}
                </div>
              </div>
            ))}
        </div>
      )}

      {/* Revert Confirmation Modal */}
      {showRevertConfirm !== null && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg border border-gray-700 p-6 max-w-md mx-4">
            <div className="flex items-center gap-3 mb-4">
              <RotateCcw className="w-6 h-6 text-orange-400" />
              <h3 className="text-lg font-medium text-white">Revert to Version?</h3>
            </div>
            <p className="text-gray-300 mb-6">
              Are you sure you want to revert to version {showRevertConfirm}? This will restore
              the plan to its state at that time. Your current state will be preserved in the
              history.
            </p>
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setShowRevertConfirm(null)}
                className="px-4 py-2 text-gray-300 border border-gray-600 rounded hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleRevert(showRevertConfirm)}
                className="px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700 transition-colors"
              >
                Revert
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Helper component for import
const Calendar: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    className={className}
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
    <line x1="16" y1="2" x2="16" y2="6"></line>
    <line x1="8" y1="2" x2="8" y2="6"></line>
    <line x1="3" y1="10" x2="21" y2="10"></line>
  </svg>
);

export default ChangeHistory;
