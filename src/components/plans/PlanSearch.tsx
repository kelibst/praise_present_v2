import React, { useState, useEffect, useCallback } from 'react';
import {
  Search,
  X,
  Calendar,
  Filter,
  Music,
  BookOpen,
  Film,
  MessageSquare,
  Clock,
  User,
  Tag,
  ChevronDown,
  ChevronRight,
  Star
} from 'lucide-react';
import { PlanItemWithContent, PlanItemType } from '../../types/plan';

/**
 * PlanSearch Component
 *
 * Comprehensive search functionality for service plans:
 * - Full-text search across all plan content
 * - Filter by date range, type, status
 * - Search within specific fields (titles, notes, content)
 * - Quick filters (my plans, recent, favorites)
 * - Search history
 * - Saved searches
 */

export interface SearchQuery {
  text?: string;
  dateFrom?: Date;
  dateTo?: Date;
  types?: PlanItemType[];
  status?: ('draft' | 'approved' | 'archived')[];
  assignees?: string[];
  tags?: string[];
  hasNotes?: boolean;
  hasCues?: boolean;
  durationMin?: number;
  durationMax?: number;
}

export interface SearchResult {
  planId: string;
  planTitle: string;
  serviceDate?: Date;
  matchType: 'title' | 'content' | 'notes' | 'assignee' | 'tag';
  matchedText?: string;
  item?: PlanItemWithContent;
  relevance: number;
}

interface PlanSearchProps {
  onSearch: (query: SearchQuery) => Promise<SearchResult[]>;
  onSelectResult?: (result: SearchResult) => void;
  recentSearches?: SearchQuery[];
  savedSearches?: Array<{ name: string; query: SearchQuery }>;
  onSaveSearch?: (name: string, query: SearchQuery) => void;
  className?: string;
}

const ITEM_TYPE_CONFIG: Record<PlanItemType, { label: string; icon: React.ComponentType<any>; color: string }> = {
  song: { label: 'Songs', icon: Music, color: 'text-blue-400' },
  scripture: { label: 'Scriptures', icon: BookOpen, color: 'text-green-400' },
  presentation: { label: 'Presentations', icon: Film, color: 'text-purple-400' },
  announcement: { label: 'Announcements', icon: MessageSquare, color: 'text-orange-400' },
  transition: { label: 'Transitions', icon: Clock, color: 'text-gray-400' }
};

export const PlanSearch: React.FC<PlanSearchProps> = ({
  onSearch,
  onSelectResult,
  recentSearches = [],
  savedSearches = [],
  onSaveSearch,
  className = ''
}) => {
  const [searchText, setSearchText] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [savedSearchName, setSavedSearchName] = useState('');

  // Advanced filters
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');
  const [selectedTypes, setSelectedTypes] = useState<PlanItemType[]>([]);
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const [assigneeFilter, setAssigneeFilter] = useState('');
  const [hasNotesFilter, setHasNotesFilter] = useState(false);
  const [hasCuesFilter, setHasCuesFilter] = useState(false);
  const [durationMin, setDurationMin] = useState<number | undefined>();
  const [durationMax, setDurationMax] = useState<number | undefined>();

  // Debounced search
  const debounceTimeout = React.useRef<NodeJS.Timeout>();

  const performSearch = useCallback(async () => {
    const query: SearchQuery = {
      text: searchText || undefined,
      dateFrom: dateFrom ? new Date(dateFrom) : undefined,
      dateTo: dateTo ? new Date(dateTo) : undefined,
      types: selectedTypes.length > 0 ? selectedTypes : undefined,
      status: selectedStatuses.length > 0 ? (selectedStatuses as any) : undefined,
      hasNotes: hasNotesFilter || undefined,
      hasCues: hasCuesFilter || undefined,
      durationMin: durationMin || undefined,
      durationMax: durationMax || undefined
    };

    // Only search if there's at least one criterion
    const hasAnyCriteria = Object.values(query).some((v) => v !== undefined);
    if (!hasAnyCriteria) {
      setResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const searchResults = await onSearch(query);
      setResults(searchResults);
    } catch (error) {
      console.error('Search error:', error);
      setResults([]);
    } finally {
      setIsSearching(false);
    }
  }, [
    searchText,
    dateFrom,
    dateTo,
    selectedTypes,
    selectedStatuses,
    hasNotesFilter,
    hasCuesFilter,
    durationMin,
    durationMax,
    onSearch
  ]);

  // Debounced search on text change
  useEffect(() => {
    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current);
    }

    debounceTimeout.current = setTimeout(() => {
      performSearch();
    }, 300);

    return () => {
      if (debounceTimeout.current) {
        clearTimeout(debounceTimeout.current);
      }
    };
  }, [performSearch]);

  const toggleType = (type: PlanItemType) => {
    setSelectedTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  const toggleStatus = (status: string) => {
    setSelectedStatuses((prev) =>
      prev.includes(status) ? prev.filter((s) => s !== status) : [...prev, status]
    );
  };

  const clearFilters = () => {
    setSearchText('');
    setDateFrom('');
    setDateTo('');
    setSelectedTypes([]);
    setSelectedStatuses([]);
    setAssigneeFilter('');
    setHasNotesFilter(false);
    setHasCuesFilter(false);
    setDurationMin(undefined);
    setDurationMax(undefined);
  };

  const handleSaveSearch = () => {
    if (!savedSearchName.trim() || !onSaveSearch) return;

    const query: SearchQuery = {
      text: searchText || undefined,
      dateFrom: dateFrom ? new Date(dateFrom) : undefined,
      dateTo: dateTo ? new Date(dateTo) : undefined,
      types: selectedTypes.length > 0 ? selectedTypes : undefined,
      hasNotes: hasNotesFilter || undefined,
      hasCues: hasCuesFilter || undefined
    };

    onSaveSearch(savedSearchName.trim(), query);
    setSavedSearchName('');
    setShowSaveDialog(false);
  };

  const applySearch = (query: SearchQuery) => {
    setSearchText(query.text || '');
    setDateFrom(query.dateFrom ? query.dateFrom.toISOString().split('T')[0] : '');
    setDateTo(query.dateTo ? query.dateTo.toISOString().split('T')[0] : '');
    setSelectedTypes(query.types || []);
    setHasNotesFilter(query.hasNotes || false);
    setHasCuesFilter(query.hasCues || false);
    performSearch();
  };

  const getMatchTypeLabel = (matchType: SearchResult['matchType']): string => {
    switch (matchType) {
      case 'title':
        return 'Title';
      case 'content':
        return 'Content';
      case 'notes':
        return 'Notes';
      case 'assignee':
        return 'Assignee';
      case 'tag':
        return 'Tag';
      default:
        return 'Match';
    }
  };

  return (
    <div className={`${className}`}>
      {/* Search Bar */}
      <div className="bg-gray-900 border border-gray-700 rounded-lg p-4">
        <div className="flex gap-3 mb-3">
          {/* Search Input */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              placeholder="Search plans, items, notes..."
              className="w-full pl-11 pr-10 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
            />
            {searchText && (
              <button
                onClick={() => setSearchText('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Filter Toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`
              flex items-center gap-2 px-4 py-3 rounded-lg border-2 transition-colors
              ${
                showFilters
                  ? 'border-blue-500 bg-blue-900/30 text-blue-400'
                  : 'border-gray-700 bg-gray-800 text-gray-300 hover:border-gray-600'
              }
            `}
          >
            <Filter className="w-5 h-5" />
            <span>Filters</span>
            {showFilters ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </button>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="p-4 bg-gray-800 rounded-lg border border-gray-700 space-y-4">
            {/* Date Range */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Date Range</label>
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:border-blue-500"
                />
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            {/* Item Types */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Item Types</label>
              <div className="flex flex-wrap gap-2">
                {(Object.keys(ITEM_TYPE_CONFIG) as PlanItemType[]).map((type) => {
                  const config = ITEM_TYPE_CONFIG[type];
                  const Icon = config.icon;
                  return (
                    <button
                      key={type}
                      onClick={() => toggleType(type)}
                      className={`
                        flex items-center gap-2 px-3 py-1.5 rounded-lg border-2 transition-all text-sm
                        ${
                          selectedTypes.includes(type)
                            ? 'border-blue-500 bg-blue-900/30 text-white'
                            : 'border-gray-700 bg-gray-900 text-gray-400 hover:border-gray-600'
                        }
                      `}
                    >
                      <Icon className="w-4 h-4" />
                      {config.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Status */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Status</label>
              <div className="flex flex-wrap gap-2">
                {['draft', 'approved', 'archived'].map((status) => (
                  <button
                    key={status}
                    onClick={() => toggleStatus(status)}
                    className={`
                      px-3 py-1.5 rounded-lg border-2 transition-all text-sm capitalize
                      ${
                        selectedStatuses.includes(status)
                          ? 'border-blue-500 bg-blue-900/30 text-white'
                          : 'border-gray-700 bg-gray-900 text-gray-400 hover:border-gray-600'
                      }
                    `}
                  >
                    {status}
                  </button>
                ))}
              </div>
            </div>

            {/* Additional Filters */}
            <div className="grid grid-cols-2 gap-3">
              <label className="flex items-center gap-2 p-2 bg-gray-700 rounded cursor-pointer hover:bg-gray-600 transition-colors">
                <input
                  type="checkbox"
                  checked={hasNotesFilter}
                  onChange={(e) => setHasNotesFilter(e.target.checked)}
                  className="w-4 h-4 rounded"
                />
                <span className="text-sm text-white">Has Notes</span>
              </label>

              <label className="flex items-center gap-2 p-2 bg-gray-700 rounded cursor-pointer hover:bg-gray-600 transition-colors">
                <input
                  type="checkbox"
                  checked={hasCuesFilter}
                  onChange={(e) => setHasCuesFilter(e.target.checked)}
                  className="w-4 h-4 rounded"
                />
                <span className="text-sm text-white">Has Cues</span>
              </label>
            </div>

            {/* Duration Range */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Duration (minutes)</label>
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="number"
                  placeholder="Min"
                  value={durationMin || ''}
                  onChange={(e) => setDurationMin(e.target.value ? parseInt(e.target.value) : undefined)}
                  className="px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                />
                <input
                  type="number"
                  placeholder="Max"
                  value={durationMax || ''}
                  onChange={(e) => setDurationMax(e.target.value ? parseInt(e.target.value) : undefined)}
                  className="px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            {/* Filter Actions */}
            <div className="flex items-center justify-between pt-3 border-t border-gray-700">
              <button
                onClick={clearFilters}
                className="text-sm text-gray-400 hover:text-white transition-colors"
              >
                Clear All Filters
              </button>
              {onSaveSearch && (
                <button
                  onClick={() => setShowSaveDialog(true)}
                  className="flex items-center gap-2 px-3 py-1.5 text-sm text-blue-400 hover:text-blue-300 transition-colors"
                >
                  <Star className="w-4 h-4" />
                  Save Search
                </button>
              )}
            </div>
          </div>
        )}

        {/* Saved Searches */}
        {savedSearches.length > 0 && (
          <div className="mt-3">
            <div className="text-xs text-gray-400 mb-2">Saved Searches</div>
            <div className="flex flex-wrap gap-2">
              {savedSearches.map((saved, index) => (
                <button
                  key={index}
                  onClick={() => applySearch(saved.query)}
                  className="flex items-center gap-2 px-3 py-1.5 bg-gray-800 border border-gray-700 rounded hover:bg-gray-700 transition-colors text-sm text-white"
                >
                  <Star className="w-3 h-3 text-yellow-400" />
                  {saved.name}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Results */}
      <div className="mt-4">
        {isSearching ? (
          <div className="flex items-center justify-center p-8">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : results.length > 0 ? (
          <div>
            <div className="text-sm text-gray-400 mb-3">
              {results.length} result{results.length !== 1 ? 's' : ''} found
            </div>
            <div className="space-y-2">
              {results.map((result) => (
                <button
                  key={`${result.planId}-${result.item?.id || 'plan'}`}
                  onClick={() => onSelectResult && onSelectResult(result)}
                  className="w-full text-left p-4 bg-gray-900 border border-gray-700 rounded-lg hover:bg-gray-800 hover:border-gray-600 transition-colors"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-white">{result.planTitle}</div>
                      {result.item && (
                        <div className="text-sm text-gray-300 mt-1">{result.item.title}</div>
                      )}
                      <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                        <span className="px-2 py-0.5 bg-gray-800 rounded">{getMatchTypeLabel(result.matchType)}</span>
                        {result.serviceDate && (
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {new Date(result.serviceDate).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                      {result.matchedText && (
                        <div className="mt-2 text-sm text-gray-400 line-clamp-2">
                          ...{result.matchedText}...
                        </div>
                      )}
                    </div>
                    <div className="text-xs px-2 py-1 bg-blue-900/20 text-blue-400 rounded">
                      {Math.round(result.relevance * 100)}% match
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        ) : searchText || selectedTypes.length > 0 || dateFrom || dateTo ? (
          <div className="p-8 text-center text-gray-400">
            <Search className="w-12 h-12 mx-auto mb-3 text-gray-600" />
            <div>No results found</div>
            <div className="text-sm mt-1">Try adjusting your search criteria</div>
          </div>
        ) : null}
      </div>

      {/* Save Search Dialog */}
      {showSaveDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg border border-gray-700 p-6 max-w-md mx-4">
            <div className="flex items-center gap-3 mb-4">
              <Star className="w-6 h-6 text-yellow-400" />
              <h3 className="text-lg font-medium text-white">Save Search</h3>
            </div>
            <input
              type="text"
              value={savedSearchName}
              onChange={(e) => setSavedSearchName(e.target.value)}
              placeholder="Enter a name for this search..."
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 mb-4"
              autoFocus
            />
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setShowSaveDialog(false)}
                className="px-4 py-2 text-gray-300 border border-gray-600 rounded hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveSearch}
                disabled={!savedSearchName.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PlanSearch;
