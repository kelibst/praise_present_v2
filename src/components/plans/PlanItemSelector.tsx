import React, { useState, useEffect } from 'react';
import { X, Search, Music, BookOpen, Film, MessageCircle, Plus, Check, ChevronRight } from 'lucide-react';
import { PlanItemSelectorProps, CreatePlanItemFormData, PlanItemType } from '../../types/plan';
// Import sample data (will be replaced with database queries)
import { sampleSongs } from '../../../data/sample-songs';
// Import Bible service for rigid scripture browser
import { bibleService, ScriptureVerse } from '../../lib/services/bibleService';
import { Book as BibleBook, Version } from '../../lib/bibleSlice';

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

// Rigid Scripture Browser Component (EasyWorship style)
interface RigidScriptureBrowserProps {
  onVerseSelect: (verse: ScriptureVerse, isSelected: boolean) => void;
  selectedVerses: Set<string>;
  onVersePreview?: (verse: ScriptureVerse) => void;
}

const RigidScriptureBrowser: React.FC<RigidScriptureBrowserProps> = ({
  onVerseSelect,
  selectedVerses,
  onVersePreview
}) => {
  // State for the three panels
  const [books, setBooks] = useState<BibleBook[]>([]);
  const [selectedBookId, setSelectedBookId] = useState<number | null>(null);
  const [selectedChapter, setSelectedChapter] = useState<number>(1);
  const [chapters, setChapters] = useState<number[]>([]);
  const [verses, setVerses] = useState<ScriptureVerse[]>([]);

  // Loading states
  const [loading, setLoading] = useState(true);
  const [versesLoading, setVersesLoading] = useState(false);

  // Bible version
  const [currentVersion, setCurrentVersion] = useState<Version | null>(null);

  // Initialize - Load books and default to Genesis 1
  useEffect(() => {
    initializeBrowser();
  }, []);

  const initializeBrowser = async () => {
    try {
      setLoading(true);

      // Load books and default version
      const [booksData, defaultVersion] = await Promise.all([
        bibleService.getBooks(),
        bibleService.getDefaultVersion()
      ]);

      setBooks(booksData);
      setCurrentVersion(defaultVersion);

      // Default to Genesis (first book)
      if (booksData.length > 0) {
        const genesis = booksData.find(b => b.name.toLowerCase() === 'genesis') || booksData[0];
        setSelectedBookId(genesis.id);
        setSelectedChapter(1);

        // Generate chapter numbers for Genesis
        const chapterNumbers = Array.from({ length: genesis.chapters }, (_, i) => i + 1);
        setChapters(chapterNumbers);

        // Load Genesis 1 verses
        if (defaultVersion) {
          await loadVerses(defaultVersion.id, genesis.id, 1);
        }
      }
    } catch (error) {
      console.error('Failed to initialize scripture browser:', error);
    } finally {
      setLoading(false);
    }
  };

  // Load verses for selected book/chapter
  const loadVerses = async (versionId: string, bookId: number, chapter: number) => {
    try {
      setVersesLoading(true);
      const versesData = await bibleService.getVerses(versionId, bookId, chapter);
      setVerses(versesData);
    } catch (error) {
      console.error('Failed to load verses:', error);
      setVerses([]);
    } finally {
      setVersesLoading(false);
    }
  };

  // Handle book selection
  const handleBookSelect = async (book: BibleBook) => {
    setSelectedBookId(book.id);
    setSelectedChapter(1);

    // Generate chapter numbers
    const chapterNumbers = Array.from({ length: book.chapters }, (_, i) => i + 1);
    setChapters(chapterNumbers);

    // Load first chapter verses
    if (currentVersion) {
      await loadVerses(currentVersion.id, book.id, 1);
    }
  };

  // Handle chapter selection
  const handleChapterSelect = async (chapter: number) => {
    setSelectedChapter(chapter);

    // Load chapter verses
    if (currentVersion && selectedBookId) {
      await loadVerses(currentVersion.id, selectedBookId, chapter);
    }
  };

  // Handle verse selection (single click = select, double click could be preview)
  const handleVerseClick = (verse: ScriptureVerse, event: React.MouseEvent) => {
    const isCurrentlySelected = selectedVerses.has(verse.id);
    onVerseSelect(verse, !isCurrentlySelected);

    // Optional: Single click preview
    if (onVersePreview && !isCurrentlySelected) {
      onVersePreview(verse);
    }
  };

  // Handle verse double click for immediate preview
  const handleVerseDoubleClick = (verse: ScriptureVerse) => {
    if (onVersePreview) {
      onVersePreview(verse);
    }
  };

  // Get current book name for display
  const getCurrentBookName = () => {
    return books.find(b => b.id === selectedBookId)?.name || '';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96 text-gray-400">
        <div className="text-center">
          <div className="animate-spin w-6 h-6 border-2 border-green-400 border-t-transparent rounded-full mx-auto mb-2"></div>
          <p>Loading Scripture Browser...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-96 border border-gray-600 rounded-lg overflow-hidden bg-gray-900">
      {/* Books Panel */}
      <div className="w-48 border-r border-gray-600 bg-gray-800">
        <div className="p-3 border-b border-gray-600 bg-gray-750">
          <h3 className="text-sm font-medium text-green-400">Books</h3>
        </div>
        <div className="overflow-y-auto h-full">
          {/* Old Testament */}
          <div className="p-2">
            <div className="text-xs text-gray-500 mb-2 font-semibold">Old Testament</div>
            {books.filter(b => b.testament === 'OT').map((book) => (
              <button
                key={book.id}
                onClick={() => handleBookSelect(book)}
                className={`w-full text-left text-xs px-2 py-1 rounded hover:bg-gray-700 transition-colors ${
                  selectedBookId === book.id
                    ? 'bg-green-600 text-white'
                    : 'text-gray-300'
                }`}
              >
                {book.name}
              </button>
            ))}
          </div>

          {/* New Testament */}
          <div className="p-2 border-t border-gray-600">
            <div className="text-xs text-gray-500 mb-2 font-semibold">New Testament</div>
            {books.filter(b => b.testament === 'NT').map((book) => (
              <button
                key={book.id}
                onClick={() => handleBookSelect(book)}
                className={`w-full text-left text-xs px-2 py-1 rounded hover:bg-gray-700 transition-colors ${
                  selectedBookId === book.id
                    ? 'bg-green-600 text-white'
                    : 'text-gray-300'
                }`}
              >
                {book.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Chapters Panel */}
      <div className="w-32 border-r border-gray-600 bg-gray-800">
        <div className="p-3 border-b border-gray-600 bg-gray-750">
          <h3 className="text-sm font-medium text-green-400">Chapters</h3>
        </div>
        <div className="overflow-y-auto h-full p-2">
          <div className="grid grid-cols-2 gap-1">
            {chapters.map((chapter) => (
              <button
                key={chapter}
                onClick={() => handleChapterSelect(chapter)}
                className={`text-xs px-2 py-1 rounded hover:bg-gray-700 transition-colors ${
                  selectedChapter === chapter
                    ? 'bg-green-600 text-white'
                    : 'text-gray-300'
                }`}
              >
                {chapter}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Verses Panel */}
      <div className="flex-1 bg-gray-800">
        <div className="p-3 border-b border-gray-600 bg-gray-750">
          <h3 className="text-sm font-medium text-green-400">
            {getCurrentBookName()} {selectedChapter} ({currentVersion?.name})
          </h3>
        </div>
        <div className="overflow-y-auto h-full">
          {versesLoading ? (
            <div className="flex items-center justify-center h-full text-gray-400">
              <div className="text-center">
                <div className="animate-spin w-5 h-5 border-2 border-green-400 border-t-transparent rounded-full mx-auto mb-2"></div>
                <p className="text-sm">Loading verses...</p>
              </div>
            </div>
          ) : (
            <div className="p-2 space-y-1">
              {verses.map((verse) => (
                <div
                  key={verse.id}
                  onClick={(e) => handleVerseClick(verse, e)}
                  onDoubleClick={() => handleVerseDoubleClick(verse)}
                  className={`p-2 rounded cursor-pointer transition-colors border ${
                    selectedVerses.has(verse.id)
                      ? 'bg-green-600 text-white border-green-500'
                      : 'bg-gray-700 hover:bg-gray-600 text-gray-200 border-gray-600'
                  }`}
                >
                  <div className="flex items-start gap-2">
                    <span className="text-xs font-mono text-green-400 flex-shrink-0">
                      {verse.verse}
                    </span>
                    <span className="text-sm flex-1 leading-relaxed">
                      {verse.text}
                    </span>
                  </div>
                </div>
              ))}

              {verses.length === 0 && !versesLoading && (
                <div className="text-center py-8 text-gray-500">
                  <BookOpen className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No verses available</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

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

  // State for rigid scripture browser
  const [selectedScriptureVerses, setSelectedScriptureVerses] = useState<Set<string>>(new Set());
  const [previewVerse, setPreviewVerse] = useState<ScriptureVerse | null>(null);

  // Load items based on active tab
  useEffect(() => {
    loadItemsForTab(activeTab);
  }, [activeTab]);

  // Handle scripture verse selection
  const handleScriptureVerseSelect = (verse: ScriptureVerse, isSelected: boolean) => {
    setSelectedScriptureVerses(prev => {
      const newSet = new Set(prev);
      if (isSelected) {
        newSet.add(verse.id);
      } else {
        newSet.delete(verse.id);
      }
      return newSet;
    });
  };

  // Handle verse preview
  const handleVersePreview = (verse: ScriptureVerse) => {
    setPreviewVerse(verse);
  };

  // Clear scripture selections when tab changes
  useEffect(() => {
    if (activeTab !== 'scripture') {
      setSelectedScriptureVerses(new Set());
      setPreviewVerse(null);
    }
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
        // For scripture, we don't load items in the traditional way
        // The RigidScriptureBrowser handles all the data loading
        items = [];
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

    // Handle scripture verses from RigidScriptureBrowser
    if (activeTab === 'scripture' && selectedScriptureVerses.size > 0) {
      // Add selected scripture verses to the plan items
      selectedScriptureVerses.forEach(verseId => {
        const planItemData: CreatePlanItemFormData = {
          type: 'scripture',
          title: `Scripture Verse`, // This will be updated when the plan item is created
          duration: 3, // Default scripture reading time
          scriptureRef: verseId
        };
        selectedItemsData.push(planItemData);
      });
    }

    onSelectItems(selectedItemsData);
    setSelectedItems(new Set());
    setSelectedScriptureVerses(new Set());
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
            <div className="flex-1 overflow-y-auto">
              {activeTab === 'scripture' ? (
                <div className="p-4">
                  <RigidScriptureBrowser
                    onVerseSelect={handleScriptureVerseSelect}
                    selectedVerses={selectedScriptureVerses}
                    onVersePreview={handleVersePreview}
                  />

                  {/* Scripture Selection Preview */}
                  {previewVerse && (
                    <div className="mt-4 p-4 bg-gray-800 rounded-lg border border-gray-600">
                      <h4 className="text-sm font-medium text-green-400 mb-2">Preview</h4>
                      <div className="text-sm text-white">
                        <span className="font-medium">{previewVerse.book} {previewVerse.chapter}:{previewVerse.verse}</span>
                      </div>
                      <div className="text-sm text-gray-300 mt-1">
                        {previewVerse.text}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-4">
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
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-700">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-400">
              {activeTab === 'scripture'
                ? `${selectedScriptureVerses.size} verses selected`
                : `${selectedItems.size} items selected${totalDuration > 0 ? ` • ${totalDuration} minutes total` : ''}`
              }
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
                disabled={activeTab === 'scripture' ? selectedScriptureVerses.size === 0 : selectedItems.size === 0}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Plus className="w-4 h-4" />
                Add {activeTab === 'scripture' ? selectedScriptureVerses.size : selectedItems.size} {activeTab === 'scripture' ? 'Verses' : 'Items'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlanItemSelector;