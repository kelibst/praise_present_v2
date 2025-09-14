import React, { useState, useEffect } from 'react';
import { X, Search, Music, BookOpen, Film, MessageCircle, Plus, Check } from 'lucide-react';
import { PlanItemSelectorProps, CreatePlanItemFormData, PlanItemType } from '../../types/plan';
// Import sample data (will be replaced with database queries)
import { sampleSongs } from '../../../data/sample-songs';

interface SelectableItem {
  id: string;
  type: PlanItemType;
  title: string;
  subtitle?: string;
  duration?: number;
  category?: string;
}

const ITEM_TYPES: { key: PlanItemType; label: string; icon: React.ComponentType<any>; color: string }[] = [
  { key: 'song', label: 'Songs', icon: Music, color: 'text-blue-400' },
  { key: 'scripture', label: 'Scriptures', icon: BookOpen, color: 'text-green-400' },
  { key: 'presentation', label: 'Presentations', icon: Film, color: 'text-purple-400' },
  { key: 'announcement', label: 'Announcements', icon: MessageCircle, color: 'text-yellow-400' }
];

export const PlanItemSelector: React.FC<PlanItemSelectorProps> = ({
  isOpen,
  onClose,
  onSelectItems,
  existingItems = [],
  className = ''
}) => {
  const [activeTab, setActiveTab] = useState<PlanItemType>('song');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [availableItems, setAvailableItems] = useState<SelectableItem[]>([]);

  // Load items based on active tab
  useEffect(() => {
    loadItemsForTab(activeTab);
  }, [activeTab]);

  const loadItemsForTab = async (type: PlanItemType) => {
    let items: SelectableItem[] = [];

    switch (type) {
      case 'song':
        try {
          // Load songs from database
          const dbSongs = await window.electronAPI?.invoke('db:loadSongs', {
            limit: 50,
            filters: {}
          });

          if (dbSongs && dbSongs.length > 0) {
            items = dbSongs.map((song: any) => ({
              id: song.id,
              type: 'song' as const,
              title: song.title,
              subtitle: song.artist ? `by ${song.artist}` : (song.author ? `by ${song.author}` : undefined),
              duration: 4, // Default song duration
              category: song.category
            }));
          } else {
            // Fallback to sample songs if database is empty
            items = sampleSongs.map(song => ({
              id: song.id,
              type: 'song' as const,
              title: song.title,
              subtitle: song.artist ? `by ${song.artist}` : undefined,
              duration: 4,
              category: song.category
            }));
          }
        } catch (error) {
          console.error('Error loading songs:', error);
          // Fallback to sample songs
          items = sampleSongs.map(song => ({
            id: song.id,
            type: 'song' as const,
            title: song.title,
            subtitle: song.artist ? `by ${song.artist}` : undefined,
            duration: 4,
            category: song.category
          }));
        }
        break;

      case 'scripture':
        try {
          // Load popular verses from database
          const popularVerses = [
            { book: 'John', chapter: 3, verse: 16 },
            { book: 'John', chapter: 3, verse: 17 },
            { book: 'Romans', chapter: 3, verse: 23 },
            { book: 'Romans', chapter: 6, verse: 23 },
            { book: 'Romans', chapter: 10, verse: 9 },
            { book: 'Romans', chapter: 10, verse: 10 },
            { book: 'Ephesians', chapter: 2, verse: 8 },
            { book: 'Ephesians', chapter: 2, verse: 9 },
            { book: '1 John', chapter: 1, verse: 9 },
            { book: 'Psalm', chapter: 23, verse: 1 },
            { book: 'Psalm', chapter: 23, verse: 2 },
            { book: 'Psalm', chapter: 23, verse: 3 },
            { book: 'Psalm', chapter: 23, verse: 4 }
          ];

          // Load books first to get book IDs
          const books = await window.electronAPI?.invoke('db:loadBooks');

          if (books && books.length > 0) {
            // Load verses for popular scripture references
            const scriptureItems = [];

            for (const ref of popularVerses) {
              const book = books.find((b: any) => b.name === ref.book);
              if (book) {
                try {
                  // Get default version first
                  const versions = await window.electronAPI?.invoke('db:loadVersions');
                  const defaultVersion = versions?.find((v: any) => v.isDefault) || versions?.[0];

                  if (defaultVersion) {
                    const verses = await window.electronAPI?.invoke('db:loadVerses', {
                      versionId: defaultVersion.id,
                      bookId: book.id,
                      chapter: ref.chapter
                    });

                    const verse = verses?.find((v: any) => v.verse === ref.verse);
                    if (verse) {
                      scriptureItems.push({
                        id: verse.id,
                        type: 'scripture' as const,
                        title: `${ref.book} ${ref.chapter}:${ref.verse}`,
                        subtitle: verse.text.length > 50 ? verse.text.substring(0, 47) + '...' : verse.text,
                        duration: 2,
                        category: 'popular'
                      });
                    }
                  }
                } catch (err) {
                  console.error('Error loading verse:', err);
                }
              }
            }

            items = scriptureItems;
          } else {
            // Fallback to sample data if database query fails
            items = [
              { id: 'john-3-16', type: 'scripture', title: 'John 3:16', subtitle: 'For God so loved the world...', duration: 2 },
              { id: 'psalm-23', type: 'scripture', title: 'Psalm 23:1', subtitle: 'The Lord is my shepherd...', duration: 2 },
              { id: 'romans-3-23', type: 'scripture', title: 'Romans 3:23', subtitle: 'For all have sinned...', duration: 2 }
            ];
          }
        } catch (error) {
          console.error('Error loading scriptures:', error);
          // Fallback to sample data
          items = [
            { id: 'john-3-16', type: 'scripture', title: 'John 3:16', subtitle: 'For God so loved the world...', duration: 2 },
            { id: 'psalm-23', type: 'scripture', title: 'Psalm 23:1', subtitle: 'The Lord is my shepherd...', duration: 2 },
            { id: 'romans-3-23', type: 'scripture', title: 'Romans 3:23', subtitle: 'For all have sinned...', duration: 2 }
          ];
        }
        break;

      case 'presentation':
        try {
          // Load presentations from database
          const dbPresentations = await window.electronAPI?.invoke('db:loadPresentations', {
            limit: 50,
            filters: {}
          });

          if (dbPresentations && dbPresentations.length > 0) {
            items = dbPresentations.map((presentation: any) => ({
              id: presentation.id,
              type: 'presentation' as const,
              title: presentation.title,
              subtitle: presentation.description || `${presentation.totalSlides || 0} slides`,
              duration: Math.max(1, Math.floor((presentation.totalSlides || 1) * 0.5)), // Estimate duration
              category: presentation.category || 'general'
            }));
          } else {
            // Fallback to sample presentations if database is empty
            items = [
              { id: 'welcome-slide', type: 'presentation', title: 'Welcome Slides', subtitle: 'Church welcome presentation', duration: 3 },
              { id: 'announcements', type: 'presentation', title: 'Announcements', subtitle: 'Weekly announcements', duration: 5 },
              { id: 'offering', type: 'presentation', title: 'Offering Message', subtitle: 'Giving presentation', duration: 2 },
              { id: 'gospel', type: 'presentation', title: 'Gospel Message', subtitle: 'Salvation presentation', duration: 10 }
            ];
          }
        } catch (error) {
          console.error('Error loading presentations:', error);
          // Fallback to sample presentations
          items = [
            { id: 'welcome-slide', type: 'presentation', title: 'Welcome Slides', subtitle: 'Church welcome presentation', duration: 3 },
            { id: 'announcements', type: 'presentation', title: 'Announcements', subtitle: 'Weekly announcements', duration: 5 },
            { id: 'offering', type: 'presentation', title: 'Offering Message', subtitle: 'Giving presentation', duration: 2 },
            { id: 'gospel', type: 'presentation', title: 'Gospel Message', subtitle: 'Salvation presentation', duration: 10 }
          ];
        }
        break;

      case 'announcement':
        // Sample announcements
        items = [
          { id: 'welcome', type: 'announcement', title: 'Welcome & Greeting', duration: 3 },
          { id: 'prayer', type: 'announcement', title: 'Opening Prayer', duration: 2 },
          { id: 'offering', type: 'announcement', title: 'Offering Time', duration: 5 },
          { id: 'closing', type: 'announcement', title: 'Closing Remarks', duration: 2 },
          { id: 'benediction', type: 'announcement', title: 'Benediction', duration: 1 }
        ];
        break;

      default:
        items = [];
    }

    setAvailableItems(items);
  };

  // Filter items based on search query
  const filteredItems = availableItems.filter(item =>
    item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (item.subtitle?.toLowerCase() || '').includes(searchQuery.toLowerCase())
  );

  // Toggle item selection
  const toggleItemSelection = (itemId: string) => {
    const newSelection = new Set(selectedItems);
    if (newSelection.has(itemId)) {
      newSelection.delete(itemId);
    } else {
      newSelection.add(itemId);
    }
    setSelectedItems(newSelection);
  };

  // Select all filtered items
  const selectAllFiltered = () => {
    const newSelection = new Set(selectedItems);
    filteredItems.forEach(item => newSelection.add(item.id));
    setSelectedItems(newSelection);
  };

  // Clear selection
  const clearSelection = () => {
    setSelectedItems(new Set());
  };

  // Handle confirm selection
  const handleConfirmSelection = () => {
    const selectedItemsData: CreatePlanItemFormData[] = [];

    availableItems.forEach(item => {
      if (selectedItems.has(item.id)) {
        const planItemData: CreatePlanItemFormData = {
          type: item.type,
          title: item.title,
          duration: item.duration
        };

        // Add specific references based on type
        if (item.type === 'song') {
          planItemData.songId = item.id;
        } else if (item.type === 'scripture') {
          // Store the verse ID for proper database relationship
          planItemData.scriptureRef = item.id;
        } else if (item.type === 'presentation') {
          planItemData.presentationId = item.id;
        }

        selectedItemsData.push(planItemData);
      }
    });

    onSelectItems(selectedItemsData);
    setSelectedItems(new Set());
    onClose();
  };

  // Calculate total duration
  const totalDuration = Array.from(selectedItems).reduce((sum, itemId) => {
    const item = availableItems.find(i => i.id === itemId);
    return sum + (item?.duration || 0);
  }, 0);

  if (!isOpen) return null;

  return (
    <div className={`fixed inset-0 bg-black/50 flex items-center justify-center z-50 ${className}`}>
      <div className="bg-gray-800 rounded-lg border border-gray-700 w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <h2 className="text-xl font-bold text-white">Add Items to Plan</h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden flex">
          {/* Left Panel - Item Types */}
          <div className="w-64 border-r border-gray-700 flex flex-col">
            <div className="p-4 border-b border-gray-700">
              <h3 className="text-sm font-medium text-gray-300 mb-3">Content Types</h3>
              <div className="space-y-1">
                {ITEM_TYPES.map(({ key, label, icon: Icon, color }) => (
                  <button
                    key={key}
                    onClick={() => setActiveTab(key)}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded text-left transition-colors ${
                      activeTab === key
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-300 hover:bg-gray-700'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${activeTab === key ? 'text-white' : color}`} />
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Selection Summary */}
            <div className="p-4">
              <div className="text-sm text-gray-400 mb-2">Selected Items</div>
              <div className="text-lg font-medium text-white">{selectedItems.size}</div>
              <div className="text-sm text-gray-400">
                {totalDuration > 0 && `${totalDuration} min total`}
              </div>

              {selectedItems.size > 0 && (
                <div className="mt-3 space-y-2">
                  <button
                    onClick={clearSelection}
                    className="w-full px-3 py-2 text-sm bg-gray-700 text-gray-300 rounded hover:bg-gray-600 transition-colors"
                  >
                    Clear Selection
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Right Panel - Items List */}
          <div className="flex-1 flex flex-col">
            {/* Search and Controls */}
            <div className="p-4 border-b border-gray-700">
              <div className="flex gap-3 mb-3">
                <div className="flex-1 relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search items..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <button
                  onClick={selectAllFiltered}
                  className="px-4 py-2 bg-gray-700 text-gray-300 rounded hover:bg-gray-600 transition-colors"
                >
                  Select All
                </button>
              </div>

              <div className="text-sm text-gray-400">
                {filteredItems.length} {ITEM_TYPES.find(t => t.key === activeTab)?.label.toLowerCase()} available
              </div>
            </div>

            {/* Items List */}
            <div className="flex-1 overflow-y-auto p-4">
              {filteredItems.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <div className="w-8 h-8 mx-auto mb-2 opacity-50">
                    {React.createElement(ITEM_TYPES.find(t => t.key === activeTab)?.icon || Music)}
                  </div>
                  {searchQuery ? 'No items match your search' : 'No items available'}
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredItems.map((item) => {
                    const isSelected = selectedItems.has(item.id);
                    const Icon = ITEM_TYPES.find(t => t.key === item.type)?.icon || Music;

                    return (
                      <div
                        key={item.id}
                        onClick={() => toggleItemSelection(item.id)}
                        className={`p-3 rounded-lg border cursor-pointer transition-all ${
                          isSelected
                            ? 'border-blue-500 bg-blue-900/30'
                            : 'border-gray-600 bg-gray-700 hover:bg-gray-600 hover:border-gray-500'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex-shrink-0">
                            {isSelected ? (
                              <div className="w-5 h-5 bg-blue-600 text-white rounded flex items-center justify-center">
                                <Check className="w-3 h-3" />
                              </div>
                            ) : (
                              <div className="w-5 h-5 border border-gray-500 rounded"></div>
                            )}
                          </div>

                          <Icon className={`w-4 h-4 flex-shrink-0 ${ITEM_TYPES.find(t => t.key === item.type)?.color || 'text-gray-400'}`} />

                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-white truncate">
                              {item.title}
                            </div>
                            {item.subtitle && (
                              <div className="text-sm text-gray-400 truncate">
                                {item.subtitle}
                              </div>
                            )}
                          </div>

                          {item.duration && (
                            <div className="text-sm text-gray-400 flex-shrink-0">
                              {item.duration}m
                            </div>
                          )}
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
        <div className="p-6 border-t border-gray-700">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-400">
              {selectedItems.size} items selected
              {totalDuration > 0 && ` • ${totalDuration} minutes total`}
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
                Add {selectedItems.size} Items
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlanItemSelector;