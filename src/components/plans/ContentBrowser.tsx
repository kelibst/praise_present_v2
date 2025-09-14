import React, { useState, useEffect } from 'react';
import {
  Search,
  Filter,
  Music,
  BookOpen,
  Film,
  MessageCircle,
  Plus,
  Check,
  X,
  ChevronDown,
  Star,
  Clock,
  User,
  Tag
} from 'lucide-react';
import { PlanItemType } from '../../types/plan';

interface ContentItem {
  id: string;
  type: PlanItemType;
  title: string;
  subtitle?: string;
  description?: string;
  duration?: number;
  category?: string;
  tags?: string[];
  author?: string;
  artist?: string;
  metadata?: any;
}

interface ContentBrowserProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectItems: (items: any[]) => void;
  initialType?: PlanItemType;
}

const CONTENT_TYPE_CONFIG = {
  song: {
    icon: Music,
    color: 'text-blue-400 bg-blue-900/20 border-blue-500',
    label: 'Songs',
    apiCall: 'db:loadSongs'
  },
  scripture: {
    icon: BookOpen,
    color: 'text-green-400 bg-green-900/20 border-green-500',
    label: 'Scripture',
    apiCall: null // Custom loading
  },
  presentation: {
    icon: Film,
    color: 'text-purple-400 bg-purple-900/20 border-purple-500',
    label: 'Presentations',
    apiCall: 'db:loadPresentations'
  },
  announcement: {
    icon: MessageCircle,
    color: 'text-yellow-400 bg-yellow-900/20 border-yellow-500',
    label: 'Announcements',
    apiCall: null // Predefined items
  }
};

export const ContentBrowser: React.FC<ContentBrowserProps> = ({
  isOpen,
  onClose,
  onSelectItems,
  initialType = 'song'
}) => {
  const [activeTab, setActiveTab] = useState<PlanItemType>(initialType);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [availableItems, setAvailableItems] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    category: '',
    author: '',
    tags: [] as string[]
  });

  // Load items when tab changes or component mounts
  useEffect(() => {
    if (isOpen) {
      loadItemsForTab(activeTab);
    }
  }, [activeTab, isOpen]);

  const loadItemsForTab = async (type: PlanItemType) => {
    setLoading(true);
    try {
      let items: ContentItem[] = [];

      switch (type) {
        case 'song':
          const songs = await window.electronAPI?.invoke('db:loadSongs', {
            limit: 100,
            filters: {}
          });
          if (songs) {
            items = songs.map((song: any) => ({
              id: song.id,
              type: 'song' as const,
              title: song.title,
              subtitle: song.artist || song.author,
              duration: 4,
              category: song.category,
              tags: song.tags || [],
              author: song.author,
              artist: song.artist,
              metadata: song
            }));
          }
          break;

        case 'scripture':
          // Load popular verses
          const popularVerses = [
            { book: 'John', chapter: 3, verse: 16 },
            { book: 'John', chapter: 3, verse: 17 },
            { book: 'Romans', chapter: 3, verse: 23 },
            { book: 'Romans', chapter: 6, verse: 23 },
            { book: 'Ephesians', chapter: 2, verse: 8 },
            { book: 'Ephesians', chapter: 2, verse: 9 },
            { book: 'Psalm', chapter: 23, verse: 1 },
            { book: '1 John', chapter: 1, verse: 9 }
          ];

          const books = await window.electronAPI?.invoke('db:loadBooks');
          const versions = await window.electronAPI?.invoke('db:loadVersions');
          const defaultVersion = versions?.find((v: any) => v.isDefault) || versions?.[0];

          if (books && defaultVersion) {
            for (const ref of popularVerses) {
              const book = books.find((b: any) => b.name === ref.book);
              if (book) {
                try {
                  const verses = await window.electronAPI?.invoke('db:loadVerses', {
                    versionId: defaultVersion.id,
                    bookId: book.id,
                    chapter: ref.chapter
                  });
                  const verse = verses?.find((v: any) => v.verse === ref.verse);
                  if (verse) {
                    items.push({
                      id: verse.id,
                      type: 'scripture' as const,
                      title: `${ref.book} ${ref.chapter}:${ref.verse}`,
                      subtitle: verse.text.length > 60 ? verse.text.substring(0, 57) + '...' : verse.text,
                      description: verse.text,
                      duration: 2,
                      category: 'popular',
                      metadata: verse
                    });
                  }
                } catch (err) {
                  console.error('Error loading verse:', err);
                }
              }
            }
          }
          break;

        case 'presentation':
          const presentations = await window.electronAPI?.invoke('db:loadPresentations', {
            limit: 50,
            filters: {}
          });
          if (presentations) {
            items = presentations.map((presentation: any) => ({
              id: presentation.id,
              type: 'presentation' as const,
              title: presentation.title,
              subtitle: `${presentation.totalSlides || 0} slides`,
              description: presentation.description,
              duration: Math.max(1, Math.floor((presentation.totalSlides || 1) * 0.5)),
              category: presentation.category || 'general',
              metadata: presentation
            }));
          }
          break;

        case 'announcement':
          items = [
            {
              id: 'welcome',
              type: 'announcement' as const,
              title: 'Welcome & Greeting',
              subtitle: 'Church welcome message',
              duration: 3,
              category: 'service'
            },
            {
              id: 'prayer',
              type: 'announcement' as const,
              title: 'Opening Prayer',
              subtitle: 'Service opening prayer',
              duration: 2,
              category: 'prayer'
            },
            {
              id: 'offering',
              type: 'announcement' as const,
              title: 'Offering Time',
              subtitle: 'Collection and giving',
              duration: 5,
              category: 'service'
            },
            {
              id: 'communion',
              type: 'announcement' as const,
              title: 'Communion',
              subtitle: 'Lord\'s Supper',
              duration: 10,
              category: 'sacrament'
            },
            {
              id: 'benediction',
              type: 'announcement' as const,
              title: 'Benediction',
              subtitle: 'Closing blessing',
              duration: 1,
              category: 'service'
            }
          ];
          break;

        default:
          items = [];
      }

      setAvailableItems(items);
    } catch (error) {
      console.error('Error loading content items:', error);
      setAvailableItems([]);
    } finally {
      setLoading(false);
    }
  };

  // Filter items based on search and filters
  const filteredItems = availableItems.filter(item => {
    const matchesSearch = !searchQuery ||
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.subtitle?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory = !filters.category || item.category === filters.category;
    const matchesAuthor = !filters.author ||
      item.author?.toLowerCase().includes(filters.author.toLowerCase()) ||
      item.artist?.toLowerCase().includes(filters.author.toLowerCase());

    return matchesSearch && matchesCategory && matchesAuthor;
  });

  const handleItemToggle = (itemId: string) => {
    const newSelection = new Set(selectedItems);
    if (newSelection.has(itemId)) {
      newSelection.delete(itemId);
    } else {
      newSelection.add(itemId);
    }
    setSelectedItems(newSelection);
  };

  const handleConfirmSelection = () => {
    const selectedItemsData = filteredItems.filter(item => selectedItems.has(item.id));
    onSelectItems(selectedItemsData.map(item => ({
      type: item.type,
      title: item.title,
      duration: item.duration || 0,
      songId: item.type === 'song' ? item.id : undefined,
      presentationId: item.type === 'presentation' ? item.id : undefined,
      scriptureRef: item.type === 'scripture' ? item.id : undefined
    })));
  };

  const getUniqueValues = (key: keyof ContentItem): string[] => {
    const values = availableItems
      .map(item => item[key])
      .filter(Boolean)
      .filter((value, index, array) => array.indexOf(value) === index);
    return values as string[];
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg border border-gray-700 w-full max-w-6xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <h2 className="text-xl font-bold text-white">Browse Content</h2>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`p-2 rounded transition-colors ${
                showFilters ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-700'
              }`}
            >
              <Filter className="w-5 h-5" />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="p-4 bg-gray-750 border-b border-gray-700">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Category</label>
                <select
                  value={filters.category}
                  onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded text-white text-sm focus:outline-none focus:border-blue-500"
                >
                  <option value="">All Categories</option>
                  {getUniqueValues('category').map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Author/Artist</label>
                <input
                  type="text"
                  value={filters.author}
                  onChange={(e) => setFilters(prev => ({ ...prev, author: e.target.value }))}
                  placeholder="Search by author or artist..."
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded text-white text-sm focus:outline-none focus:border-blue-500"
                />
              </div>
              <div className="flex items-end">
                <button
                  onClick={() => setFilters({ category: '', author: '', tags: [] })}
                  className="px-4 py-2 text-gray-400 hover:text-white border border-gray-600 rounded hover:border-gray-500 transition-colors text-sm"
                >
                  Clear Filters
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-hidden flex">
          {/* Tab Navigation */}
          <div className="w-48 bg-gray-750 border-r border-gray-700 flex flex-col">
            {Object.entries(CONTENT_TYPE_CONFIG).map(([type, config]) => {
              const Icon = config.icon;
              return (
                <button
                  key={type}
                  onClick={() => setActiveTab(type as PlanItemType)}
                  className={`flex items-center gap-3 px-4 py-3 text-left transition-colors ${
                    activeTab === type
                      ? 'bg-blue-900/30 border-r-2 border-blue-500 text-blue-400'
                      : 'text-gray-400 hover:text-white hover:bg-gray-700'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {config.label}
                </button>
              );
            })}
          </div>

          {/* Items List */}
          <div className="flex-1 flex flex-col">
            {/* Search */}
            <div className="p-4 border-b border-gray-700">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={`Search ${CONTENT_TYPE_CONFIG[activeTab].label.toLowerCase()}...`}
                  className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            {/* Items */}
            <div className="flex-1 overflow-y-auto p-4">
              {loading ? (
                <div className="flex items-center justify-center h-32">
                  <div className="text-gray-400">Loading {CONTENT_TYPE_CONFIG[activeTab].label.toLowerCase()}...</div>
                </div>
              ) : filteredItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-32 text-gray-400">
                  <div className="w-8 h-8 mb-2 opacity-50">📭</div>
                  <div>No {CONTENT_TYPE_CONFIG[activeTab].label.toLowerCase()} found</div>
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="mt-2 text-blue-400 hover:text-blue-300 underline text-sm"
                    >
                      Clear search
                    </button>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                  {filteredItems.map((item) => {
                    const isSelected = selectedItems.has(item.id);
                    const config = CONTENT_TYPE_CONFIG[item.type];
                    const Icon = config.icon;

                    return (
                      <div
                        key={item.id}
                        onClick={() => handleItemToggle(item.id)}
                        className={`p-4 border rounded-lg cursor-pointer transition-all ${
                          isSelected
                            ? 'border-blue-500 bg-blue-900/20'
                            : 'border-gray-600 bg-gray-700 hover:border-gray-500 hover:bg-gray-650'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`p-2 rounded border ${config.color} flex-shrink-0`}>
                            <Icon className="w-4 h-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between">
                              <div>
                                <h4 className="font-medium text-white truncate">{item.title}</h4>
                                {item.subtitle && (
                                  <p className="text-sm text-gray-400 mt-1">{item.subtitle}</p>
                                )}
                                {item.description && item.description !== item.subtitle && (
                                  <p className="text-xs text-gray-500 mt-1 line-clamp-2">{item.description}</p>
                                )}
                              </div>
                              <div className="flex items-center gap-2 ml-2">
                                {item.duration && (
                                  <div className="flex items-center gap-1 text-xs text-gray-400">
                                    <Clock className="w-3 h-3" />
                                    {item.duration}m
                                  </div>
                                )}
                                <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                                  isSelected
                                    ? 'border-blue-500 bg-blue-500'
                                    : 'border-gray-400'
                                }`}>
                                  {isSelected && <Check className="w-3 h-3 text-white" />}
                                </div>
                              </div>
                            </div>
                            {item.category && (
                              <div className="mt-2">
                                <span className="inline-block px-2 py-1 text-xs bg-gray-600 text-gray-300 rounded">
                                  {item.category}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-700">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-400">
              {selectedItems.size} item{selectedItems.size !== 1 ? 's' : ''} selected
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={onClose}
                className="px-4 py-2 text-gray-300 border border-gray-600 rounded hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmSelection}
                disabled={selectedItems.size === 0}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Plus className="w-4 h-4" />
                Add {selectedItems.size} Item{selectedItems.size !== 1 ? 's' : ''}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContentBrowser;