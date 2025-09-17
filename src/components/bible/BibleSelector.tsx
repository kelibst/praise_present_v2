import React, { useState, useEffect, useCallback } from 'react';
import { Book, Search, ChevronDown, Loader2, BookOpen, Star, Clock, RefreshCw, AlertCircle, Bookmark, Heart, Lightbulb } from 'lucide-react';
import { bibleService, ScriptureVerse, ScriptureSelection } from '../../lib/services/bibleService';
import { Translation, Version, Book as BibleBook } from '../../lib/bibleSlice';
import { SmartScriptureInput } from './SmartScriptureInput';
import { ParsedReference } from './SmartScriptureInput/types';
import { ChapterVerseList } from './ChapterVerseList';

interface BibleSelectorProps {
  onVerseSelect?: (verses: ScriptureVerse[]) => void;
  className?: string;
  defaultVersion?: string;
}

type TabType = 'reference' | 'search' | 'saved';

const BibleSelector: React.FC<BibleSelectorProps> = ({
  onVerseSelect,
  className = '',
  defaultVersion
}) => {
  // State management
  const [activeTab, setActiveTab] = useState<TabType>('reference');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);

  // Data state
  const [translations, setTranslations] = useState<Translation[]>([]);
  const [versions, setVersions] = useState<Version[]>([]);
  const [books, setBooks] = useState<BibleBook[]>([]);

  // Selection state
  const [selectedVersion, setSelectedVersion] = useState<string>('');
  const [selectedBook, setSelectedBook] = useState<number | null>(null);
  const [selectedChapter, setSelectedChapter] = useState<number | null>(null);
  const [verseStart, setVerseStart] = useState<number>(1);
  const [verseEnd, setVerseEnd] = useState<number | null>(null);

  // Input state
  const [referenceInput, setReferenceInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // State for chapter verse list
  const [currentParsedReference, setCurrentParsedReference] = useState<ParsedReference | null>(null);
  const [selectedVersesFromList, setSelectedVersesFromList] = useState<number[]>([]);

  // Results state
  const [currentVerses, setCurrentVerses] = useState<ScriptureVerse[]>([]);
  const [searchResults, setSearchResults] = useState<ScriptureVerse[]>([]);
  const [popularVerses, setPopularVerses] = useState<ScriptureVerse[]>([]);
  const [themeVerses, setThemeVerses] = useState<ScriptureVerse[]>([]);
  const [bookmarks, setBookmarks] = useState<Array<{id: string; verse: ScriptureVerse; note?: string; createdAt: string}>>([]);
  const [selectedTheme, setSelectedTheme] = useState<string>('popular');
  const [savedSubTab, setSavedSubTab] = useState<'popular' | 'themes' | 'bookmarks'>('popular');
  const [showVerseList, setShowVerseList] = useState<boolean>(true);
  const [recentReferences, setRecentReferences] = useState<string[]>([]);

  // Load verses on demand (used when clicking "Use This Scripture" with selections from ChapterVerseList)
  const loadSelectedVerses = useCallback(async () => {
    if (!currentParsedReference?.book || !currentParsedReference.chapter || !selectedVersion || selectedVersesFromList.length === 0) {
      return [];
    }

    try {
      setLoading(true);
      setError(null);

      const scriptureVerses = await bibleService.getVerses(
        selectedVersion,
        currentParsedReference.book.id,
        currentParsedReference.chapter,
        selectedVersesFromList
      );

      setCurrentVerses(scriptureVerses);
      return scriptureVerses;

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load selected verses');
      return [];
    } finally {
      setLoading(false);
    }
  }, [currentParsedReference, selectedVersion, selectedVersesFromList]);

  // Handle verse selection for presentation (defined early for use in useEffect)
  const handleUseVerses = useCallback(async (verses: ScriptureVerse[]) => {
    let versesToUse = verses;

    // If we don't have verses but have selections from the list, load them
    if (verses.length === 0 && selectedVersesFromList.length > 0) {
      versesToUse = await loadSelectedVerses();
    }

    if (onVerseSelect && versesToUse.length > 0) {
      onVerseSelect(versesToUse);
    }
  }, [onVerseSelect, selectedVersesFromList, loadSelectedVerses]);

  // Initialize component
  useEffect(() => {
    initializeData();
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Escape to clear current selection
      if (event.key === 'Escape') {
        setCurrentVerses([]);
        setSelectedVersesFromList([]);
        setCurrentParsedReference(null);
      }
      // Ctrl/Cmd + Enter to use current verses
      if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
        if (currentVerses.length > 0) {
          handleUseVerses(currentVerses);
        } else if (selectedVersesFromList.length > 0) {
          handleUseVerses([]);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentVerses, selectedVersesFromList, handleUseVerses]);

  const initializeData = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('🔧 BibleSelector: Initializing...');

      // Load basic data
      const [translationsData, versionsData, booksData] = await Promise.all([
        bibleService.getTranslations(),
        bibleService.getVersions(),
        bibleService.getBooks()
      ]);

      setTranslations(translationsData);
      setVersions(versionsData);
      setBooks(booksData);

      // Set default version
      let defaultVer = null;
      if (defaultVersion) {
        defaultVer = versionsData.find(v => v.id === defaultVersion);
      }
      if (!defaultVer) {
        defaultVer = await bibleService.getDefaultVersion();
      }

      if (defaultVer) {
        setSelectedVersion(defaultVer.id);
        // Load popular verses for default version
        loadPopularVerses(defaultVer.id);
      }

      // Load bookmarks
      loadBookmarks();

      setInitialized(true);
      console.log('✅ BibleSelector: Initialized successfully');
    } catch (err) {
      console.error('❌ BibleSelector: Failed to initialize:', err);
      setError(err instanceof Error ? err.message : 'Failed to initialize Bible data');
    } finally {
      setLoading(false);
    }
  };

  // Load popular verses
  const loadPopularVerses = async (versionId: string) => {
    try {
      const verses = await bibleService.getPopularVerses(versionId);
      setPopularVerses(verses);
    } catch (err) {
      console.warn('Failed to load popular verses:', err);
    }
  };

  // Load theme verses
  const loadThemeVerses = async (theme: string, versionId: string) => {
    try {
      setLoading(true);
      const verses = await bibleService.getVersesByTheme(theme, versionId);
      setThemeVerses(verses);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load theme verses');
      setThemeVerses([]);
    } finally {
      setLoading(false);
    }
  };

  // Load bookmarks
  const loadBookmarks = () => {
    try {
      const bookmarksList = bibleService.getBookmarks();
      setBookmarks(bookmarksList);
    } catch (err) {
      console.warn('Failed to load bookmarks:', err);
    }
  };

  // Add bookmark
  const addBookmark = (verse: ScriptureVerse, note?: string) => {
    bibleService.saveBookmark(verse, note);
    loadBookmarks();
  };

  // Remove bookmark
  const removeBookmark = (bookmarkId: string) => {
    bibleService.removeBookmark(bookmarkId);
    loadBookmarks();
  };

  // Handle reference input
  const handleReferenceInput = useCallback(async (input: string) => {
    setReferenceInput(input);
    setError(null);

    if (!input.trim() || !selectedVersion) return;

    try {
      setLoading(true);
      const scripture = await bibleService.getScriptureByReference(input, selectedVersion);
      setCurrentVerses(scripture.verses);

      // Update the manual selectors to match the reference
      if (scripture.verses.length > 0) {
        const firstVerse = scripture.verses[0];
        const book = books.find(b => b.name === firstVerse.book);
        if (book) {
          setSelectedBook(book.id);
          setSelectedChapter(firstVerse.chapter);
          setVerseStart(Math.min(...scripture.verses.map(v => v.verse)));
          const maxVerse = Math.max(...scripture.verses.map(v => v.verse));
          setVerseEnd(maxVerse > verseStart ? maxVerse : null);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid reference');
      setCurrentVerses([]);
    } finally {
      setLoading(false);
    }
  }, [selectedVersion, books, verseStart]);

  // Handle manual selection (book/chapter/verse dropdowns)
  const handleManualSelection = useCallback(async () => {
    if (!selectedVersion || !selectedBook || !selectedChapter) return;

    try {
      setLoading(true);
      setError(null);

      const verses: number[] = [];
      if (verseEnd && verseEnd > verseStart) {
        for (let i = verseStart; i <= verseEnd; i++) {
          verses.push(i);
        }
      } else {
        verses.push(verseStart);
      }

      const scriptureVerses = await bibleService.getVerses(
        selectedVersion,
        selectedBook,
        selectedChapter,
        verses
      );

      setCurrentVerses(scriptureVerses);

      // Update reference input to match
      const book = books.find(b => b.id === selectedBook);
      if (book) {
        const reference = bibleService.formatReference(book.name, selectedChapter, verses);
        setReferenceInput(reference);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load verses');
      setCurrentVerses([]);
    } finally {
      setLoading(false);
    }
  }, [selectedVersion, selectedBook, selectedChapter, verseStart, verseEnd, books]);

  // Handle search
  const handleSearch = useCallback(async (query: string) => {
    if (!query.trim() || !selectedVersion) {
      setSearchResults([]);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const results = await bibleService.searchVerses(query, selectedVersion);
      setSearchResults(results);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed');
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  }, [selectedVersion]);

  // Handle version change
  const handleVersionChange = (newVersionId: string) => {
    setSelectedVersion(newVersionId);
    setCurrentVerses([]);
    setSearchResults([]);
    loadPopularVerses(newVersionId);

    // Re-run current selection if we have one
    if (referenceInput) {
      handleReferenceInput(referenceInput);
    } else if (selectedBook && selectedChapter) {
      handleManualSelection();
    }
  };

  // Add to recent references
  const addToRecentReferences = useCallback((reference: string) => {
    setRecentReferences(prev => {
      const filtered = prev.filter(ref => ref !== reference);
      return [reference, ...filtered].slice(0, 5); // Keep only 5 most recent
    });
  }, []);

  // Handle smart reference selection
  const handleSmartReferenceSelect = useCallback(async (reference: ParsedReference) => {
    if (!reference.isValid || !reference.book || !selectedVersion) return;

    try {
      setLoading(true);
      setError(null);

      const verses: number[] = [];
      if (reference.verseEnd && reference.verseStart && reference.verseEnd > reference.verseStart) {
        for (let i = reference.verseStart; i <= reference.verseEnd; i++) {
          verses.push(i);
        }
      } else if (reference.verseStart) {
        verses.push(reference.verseStart);
      } else {
        // If no verse specified, default to verse 1
        verses.push(1);
      }

      const chapter = reference.chapter || 1;
      const scriptureVerses = await bibleService.getVerses(
        selectedVersion,
        reference.book.id,
        chapter,
        verses
      );

      setCurrentVerses(scriptureVerses);

      // Update manual selectors to match
      setSelectedBook(reference.book.id);
      setSelectedChapter(chapter);
      setVerseStart(verses[0]);
      setVerseEnd(verses.length > 1 ? verses[verses.length - 1] : null);

      // Update reference input to match formatted version
      const formattedReference = bibleService.formatReference(reference.book.name, chapter, verses);
      setReferenceInput(formattedReference);

      // Add to recent references
      addToRecentReferences(formattedReference);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load verses');
      setCurrentVerses([]);
    } finally {
      setLoading(false);
    }
  }, [selectedVersion, addToRecentReferences]);

  // Handle reference change from smart input (for chapter verse list)
  const handleReferenceChange = useCallback((reference: ParsedReference) => {
    setCurrentParsedReference(reference);

    // Auto-expand verse list when a valid reference is entered
    if (reference.book && reference.chapter) {
      setShowVerseList(true);
    }

    // Update selected verses if the reference includes specific verses
    if (reference.isValid && reference.verseStart) {
      const verses: number[] = [];
      if (reference.verseEnd && reference.verseEnd > reference.verseStart) {
        for (let i = reference.verseStart; i <= reference.verseEnd; i++) {
          verses.push(i);
        }
      } else {
        verses.push(reference.verseStart);
      }
      setSelectedVersesFromList(verses);
    } else {
      setSelectedVersesFromList([]);
    }
  }, []);

  // Handle verse selection from chapter list
  const handleVerseSelectionFromList = useCallback((verseNumbers: number[]) => {
    if (!currentParsedReference?.book || !currentParsedReference.chapter || !selectedVersion) {
      return;
    }

    setSelectedVersesFromList(verseNumbers);

    // The ChapterVerseList already has all the verses loaded, we just need to filter them
    // based on the selected verse numbers. We'll get the actual verse data when the user
    // clicks "Use This Scripture". This avoids redundant API calls.

    // Update the smart input to reflect the selection
    const formattedReference = bibleService.formatReference(
      currentParsedReference.book.name,
      currentParsedReference.chapter,
      verseNumbers
    );
    setReferenceInput(formattedReference);

    // Update manual selectors to match
    setSelectedBook(currentParsedReference.book.id);
    setSelectedChapter(currentParsedReference.chapter);
    setVerseStart(verseNumbers[0]);
    setVerseEnd(verseNumbers.length > 1 ? verseNumbers[verseNumbers.length - 1] : null);

    // Clear current verses since we're now in selection mode
    setCurrentVerses([]);
  }, [currentParsedReference]);

  // Get current version name
  const getCurrentVersion = () => {
    return versions.find(v => v.id === selectedVersion);
  };

  // Get current book
  const getCurrentBook = () => {
    return books.find(b => b.id === selectedBook);
  };

  if (loading && !initialized) {
    return (
      <div className={`flex items-center justify-center p-8 ${className}`}>
        <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
        <span className="ml-2 text-gray-300">Loading Bible data...</span>
      </div>
    );
  }

  if (error && !initialized) {
    return (
      <div className={`p-4 ${className}`}>
        <div className="flex items-center text-red-400 mb-4">
          <AlertCircle className="w-5 h-5 mr-2" />
          <span>Failed to load Bible data</span>
        </div>
        <p className="text-sm text-gray-400 mb-4">{error}</p>
        <button
          onClick={initializeData}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header with Version Selector */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-white">Scripture Selector</h2>
        <div className="flex items-center space-x-2">
          <label className="text-sm text-gray-400">Version:</label>
          <select
            value={selectedVersion}
            onChange={(e) => handleVersionChange(e.target.value)}
            className="px-3 py-1 border border-gray-600 rounded-md bg-gray-800 text-white text-sm focus:border-blue-500 focus:outline-none"
          >
            <option value="">Select Version</option>
            {versions.map((version) => (
              <option key={version.id} value={version.id}>
                {version.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex border-b border-gray-700">
        {[
          { key: 'reference', label: 'Scripture', icon: BookOpen },
          { key: 'search', label: 'Search', icon: Search },
          { key: 'saved', label: 'Saved', icon: Heart }
        ].map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key as TabType)}
            className={`flex-1 px-4 py-2 text-sm font-medium flex items-center justify-center gap-2 ${
              activeTab === key
                ? 'border-b-2 border-blue-500 text-blue-400'
                : 'text-gray-400 hover:text-gray-300'
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="min-h-[300px]">
        {/* Scripture Reference Tab */}
        {activeTab === 'reference' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full">
            {/* Left Panel - Scripture Input */}
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-300">
                    Scripture Reference
                  </label>
                  {recentReferences.length > 0 && (
                    <div className="relative">
                      <select
                        onChange={(e) => {
                          if (e.target.value) {
                            // Parse and handle recent reference selection
                            handleReferenceInput(e.target.value);
                            e.target.value = ''; // Reset dropdown
                          }
                        }}
                        className="text-xs bg-gray-700 border border-gray-600 rounded px-2 py-1 text-gray-300 focus:border-blue-500 focus:outline-none"
                      >
                        <option value="">Recent</option>
                        {recentReferences.map((ref, index) => (
                          <option key={index} value={ref}>
                            {ref}
                          </option>
                        ))}
                      </select>
                      <Clock className="absolute right-1 top-1/2 transform -translate-y-1/2 w-3 h-3 text-gray-400 pointer-events-none" />
                    </div>
                  )}
                </div>
                <SmartScriptureInput
                  defaultReference="Genesis 1:1"
                  onReferenceSelect={handleSmartReferenceSelect}
                  onReferenceChange={handleReferenceChange}
                  placeholder="Type scripture reference (e.g., John 3:16, gen 1:1)"
                  showValidation={true}
                  autoComplete={true}
                  className="w-full"
                  books={books}
                  selectedVersionId={selectedVersion}
                />
              </div>

              {/* Scripture Preview/Selection */}
              {(currentVerses.length > 0 || selectedVersesFromList.length > 0) && (
                <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
                  {currentVerses.length > 0 ? (
                    <>
                      <div className="flex items-center justify-between mb-3">
                        <div className="text-sm font-medium text-white">
                          {bibleService.formatReference(
                            currentVerses[0].book,
                            currentVerses[0].chapter,
                            currentVerses.map(v => v.verse)
                          )} ({getCurrentVersion()?.name})
                        </div>
                        <BookOpen className="w-4 h-4 text-gray-400" />
                      </div>
                      <div className="space-y-2 mb-4 max-h-48 overflow-y-auto">
                        {currentVerses.map((verse) => (
                          <div key={verse.id} className="text-gray-300">
                            <span className="text-xs text-gray-500 mr-2 font-mono">
                              {verse.verse}
                            </span>
                            {verse.text}
                          </div>
                        ))}
                      </div>
                      <button
                        onClick={() => handleUseVerses(currentVerses)}
                        className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium flex items-center justify-center gap-2"
                      >
                        Add to Presentation
                        <span className="text-xs opacity-70">(Ctrl+Enter)</span>
                      </button>
                    </>
                  ) : selectedVersesFromList.length > 0 && currentParsedReference?.book && (
                    <>
                      <div className="flex items-center justify-between mb-3">
                        <div className="text-sm font-medium text-white">
                          {bibleService.formatReference(
                            currentParsedReference.book.name,
                            currentParsedReference.chapter || 1,
                            selectedVersesFromList
                          )} ({getCurrentVersion()?.name})
                        </div>
                        <BookOpen className="w-4 h-4 text-gray-400" />
                      </div>
                      <div className="text-gray-400 text-sm mb-4 text-center py-4">
                        {selectedVersesFromList.length} verse{selectedVersesFromList.length !== 1 ? 's' : ''} selected
                      </div>
                      <button
                        onClick={() => handleUseVerses([])}
                        disabled={loading}
                        className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 text-sm font-medium flex items-center justify-center gap-2"
                      >
                        {loading ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Loading Verses...
                          </>
                        ) : (
                          <>
                            Add Selected Verses
                            <span className="text-xs opacity-70">(Ctrl+Enter)</span>
                          </>
                        )}
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Right Panel - Chapter Verse List */}
            <div className="flex flex-col min-h-0">
              {currentParsedReference?.book && currentParsedReference?.chapter ? (
                <>
                  {/* Collapsible Header */}
                  <div className="flex items-center justify-between p-3 bg-gray-800/50 rounded-t-lg border border-gray-700 border-b-0">
                    <div className="flex items-center space-x-2">
                      <BookOpen className="w-4 h-4 text-blue-400" />
                      <span className="text-sm font-medium text-white">
                        {currentParsedReference.book.name} {currentParsedReference.chapter}
                      </span>
                      {selectedVersesFromList.length > 0 && (
                        <span className="text-xs text-blue-400 bg-blue-400/20 px-2 py-1 rounded">
                          {selectedVersesFromList.length} selected
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => setShowVerseList(!showVerseList)}
                      className="p-1 rounded hover:bg-gray-700 transition-colors"
                      title={showVerseList ? 'Hide verses' : 'Show verses'}
                    >
                      <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${showVerseList ? 'rotate-180' : ''}`} />
                    </button>
                  </div>

                  {/* Collapsible Content */}
                  {showVerseList ? (
                    <ChapterVerseList
                      book={currentParsedReference.book}
                      chapter={currentParsedReference.chapter}
                      selectedVerses={selectedVersesFromList}
                      versionId={selectedVersion || ''}
                      versions={versions}
                      onVerseSelection={handleVerseSelectionFromList}
                      onVersionChange={() => {}} // Disabled - version controlled at top level
                      className="flex-1 rounded-t-none border-t-0"
                      loading={loading}
                      error={error}
                      hideVersionSelector={true}
                    />
                  ) : (
                    <div className="flex-1 bg-gray-800/50 rounded-b-lg border border-gray-700 border-t-0 flex items-center justify-center py-8">
                      <div className="text-center text-gray-400">
                        <span className="text-sm">Verse list collapsed</span>
                        <p className="text-xs text-gray-500 mt-1">Click to expand</p>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center bg-gray-800/50 rounded-lg border border-gray-700">
                  <div className="text-center text-gray-400">
                    <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p className="text-sm">Enter a scripture reference</p>
                    <p className="text-xs text-gray-500 mt-1">Chapter verses will appear here</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}


        {/* Search Tab */}
        {activeTab === 'search' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Search Scripture
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search for words or phrases..."
                  className="flex-1 px-3 py-2 border border-gray-600 rounded-md bg-gray-800 text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none"
                />
                <button
                  onClick={() => handleSearch(searchQuery)}
                  disabled={loading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                  Search
                </button>
              </div>
            </div>

            {/* Search Results */}
            {searchResults.length > 0 && (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {searchResults.map((verse) => (
                  <div
                    key={verse.id}
                    className="bg-gray-800 p-3 rounded-lg border border-gray-700 hover:border-gray-600 cursor-pointer transition-colors"
                    onClick={() => handleUseVerses([verse])}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-sm font-medium text-blue-400">
                        {verse.book} {verse.chapter}:{verse.verse}
                      </div>
                    </div>
                    <div className="text-gray-300 text-sm">
                      {verse.text}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {searchQuery && searchResults.length === 0 && !loading && (
              <div className="text-center py-8 text-gray-400">
                <Search className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No verses found matching your search.</p>
                <p className="text-sm mt-2">Try different keywords or check your spelling.</p>
              </div>
            )}
          </div>
        )}

        {/* Saved Tab - Combined Popular, Themes, and Bookmarks */}
        {activeTab === 'saved' && (
          <div className="space-y-6">
            {/* Sub-tab navigation */}
            <div className="flex space-x-1 bg-gray-700 p-1 rounded-lg">
              {[
                { key: 'popular', label: 'Popular', icon: Star },
                { key: 'themes', label: 'Themes', icon: Lightbulb },
                { key: 'bookmarks', label: 'Bookmarks', icon: Bookmark }
              ].map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  onClick={() => setSavedSubTab(key as 'popular' | 'themes' | 'bookmarks')}
                  className={`flex-1 px-3 py-2 text-sm font-medium rounded-md flex items-center justify-center gap-2 transition-colors ${
                    savedSubTab === key
                      ? 'bg-gray-600 text-white'
                      : 'text-gray-300 hover:text-white hover:bg-gray-600'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </button>
              ))}
            </div>

            {/* Popular Verses */}
            {savedSubTab === 'popular' && (
              <div className="space-y-2">
                {popularVerses.length > 0 ? (
                  popularVerses.map((verse) => (
                    <div
                      key={verse.id}
                      className="bg-gray-800 p-3 rounded-lg border border-gray-700 hover:border-gray-600 cursor-pointer transition-colors"
                      onClick={() => handleUseVerses([verse])}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="text-sm font-medium text-yellow-400">
                          {verse.book} {verse.chapter}:{verse.verse}
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              addBookmark(verse);
                            }}
                            className="p-1 rounded hover:bg-gray-700 transition-colors"
                            title="Add bookmark"
                          >
                            <Bookmark className="w-3 h-3 text-gray-400 hover:text-yellow-400" />
                          </button>
                          <Star className="w-4 h-4 text-yellow-400" />
                        </div>
                      </div>
                      <div className="text-gray-300 text-sm">
                        {verse.text}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-400">
                    <Star className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>Loading popular verses...</p>
                  </div>
                )}
              </div>
            )}

            {/* Themes */}
            {savedSubTab === 'themes' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Select Theme
                  </label>
                  <select
                    value={savedSubTab === 'themes' ? selectedTheme : ''}
                    onChange={(e) => {
                      const theme = e.target.value;
                      setSelectedTheme(theme);
                      if (theme && selectedVersion) {
                        loadThemeVerses(theme, selectedVersion);
                      }
                    }}
                    className="w-full px-3 py-2 border border-gray-600 rounded-md bg-gray-800 text-white focus:border-blue-500 focus:outline-none"
                  >
                    <option value="">Select a theme</option>
                    {bibleService.getAvailableThemes().map((theme) => (
                      <option key={theme} value={theme}>
                        {theme.charAt(0).toUpperCase() + theme.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>

                {themeVerses.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-blue-300 capitalize">
                      {selectedTheme} Verses
                    </h4>
                    {themeVerses.map((verse) => (
                      <div
                        key={verse.id}
                        className="bg-gray-800 p-3 rounded-lg border border-gray-700 hover:border-gray-600 cursor-pointer transition-colors"
                        onClick={() => handleUseVerses([verse])}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="text-sm font-medium text-blue-400">
                            {verse.book} {verse.chapter}:{verse.verse}
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                addBookmark(verse);
                              }}
                              className="p-1 rounded hover:bg-gray-700 transition-colors"
                              title="Add bookmark"
                            >
                              <Bookmark className="w-3 h-3 text-gray-400 hover:text-yellow-400" />
                            </button>
                            <Lightbulb className="w-4 h-4 text-blue-400" />
                          </div>
                        </div>
                        <div className="text-gray-300 text-sm">
                          {verse.text}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {selectedTheme && savedSubTab === 'themes' && themeVerses.length === 0 && !loading && (
                  <div className="text-center py-8 text-gray-400">
                    <Lightbulb className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No verses found for this theme.</p>
                  </div>
                )}
              </div>
            )}

            {/* Bookmarks */}
            {savedSubTab === 'bookmarks' && (
              <div className="space-y-2">
                {bookmarks.length > 0 ? (
                  bookmarks.map((bookmark) => (
                    <div
                      key={bookmark.id}
                      className="bg-gray-800 p-3 rounded-lg border border-gray-700 hover:border-gray-600 cursor-pointer transition-colors"
                      onClick={() => handleUseVerses([bookmark.verse])}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="text-sm font-medium text-purple-400">
                          {bookmark.verse.book} {bookmark.verse.chapter}:{bookmark.verse.verse}
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              removeBookmark(bookmark.id);
                            }}
                            className="p-1 rounded hover:bg-gray-700 transition-colors"
                            title="Remove bookmark"
                          >
                            <Bookmark className="w-3 h-3 text-purple-400 hover:text-red-400 fill-current" />
                          </button>
                        </div>
                      </div>
                      <div className="text-gray-300 text-sm mb-2">
                        {bookmark.verse.text}
                      </div>
                      {bookmark.note && (
                        <div className="text-xs text-gray-500 italic">
                          Note: {bookmark.note}
                        </div>
                      )}
                      <div className="text-xs text-gray-600 mt-2">
                        Saved: {new Date(bookmark.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-400">
                    <Bookmark className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No bookmarks yet.</p>
                    <p className="text-sm mt-2">Click the bookmark icon on any verse to save it.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-900/20 border border-red-600/30 rounded-lg p-3">
          <div className="flex items-center text-red-400">
            <AlertCircle className="w-4 h-4 mr-2" />
            <span className="text-sm">{error}</span>
          </div>
        </div>
      )}

      {/* Loading Indicator */}
      {loading && (
        <div className="flex items-center justify-center py-4">
          <Loader2 className="w-5 h-5 animate-spin text-blue-400 mr-2" />
          <span className="text-sm text-gray-300">Loading...</span>
        </div>
      )}

    </div>
  );
};

export default BibleSelector;