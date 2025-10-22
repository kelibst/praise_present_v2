import React, { useState, useEffect, useCallback } from 'react';
import { Book as BibleBook, Version } from '../../lib/bibleSlice';
import { ScriptureVerse, bibleService } from '../../lib/services/bibleService';
import { ArrowLeft, Loader2, AlertCircle, RefreshCw, Check } from 'lucide-react';
import BookGrid from './BookGrid';
import ChapterGrid from './ChapterGrid';
import { ChapterVerseList } from './ChapterVerseList';

interface BibleBrowseSelectorProps {
  onVerseSelect?: (verses: ScriptureVerse[]) => void;
  defaultVersion?: string;
  className?: string;
}

type BrowseStage = 'books' | 'chapters' | 'verses';

const BibleBrowseSelector: React.FC<BibleBrowseSelectorProps> = ({
  onVerseSelect,
  defaultVersion,
  className = ''
}) => {
  // State management
  const [stage, setStage] = useState<BrowseStage>('books');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);

  // Data state
  const [versions, setVersions] = useState<Version[]>([]);
  const [books, setBooks] = useState<BibleBook[]>([]);
  const [selectedVersion, setSelectedVersion] = useState<string>('');

  // Selection state
  const [selectedBook, setSelectedBook] = useState<BibleBook | null>(null);
  const [selectedChapter, setSelectedChapter] = useState<number | null>(null);
  const [selectedVerses, setSelectedVerses] = useState<number[]>([]);
  const [currentVerses, setCurrentVerses] = useState<ScriptureVerse[]>([]);

  // Initialize component
  useEffect(() => {
    initializeData();
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Escape to go back
      if (event.key === 'Escape') {
        handleBack();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [stage, selectedBook, selectedChapter]);

  const initializeData = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('🔧 BibleBrowseSelector: Initializing...');

      // Load basic data
      const [versionsData, booksData] = await Promise.all([
        bibleService.getVersions(),
        bibleService.getBooks()
      ]);

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
      }

      setInitialized(true);
      console.log('✅ BibleBrowseSelector: Initialized successfully');
    } catch (err) {
      console.error('❌ BibleBrowseSelector: Failed to initialize:', err);
      setError(err instanceof Error ? err.message : 'Failed to initialize Bible data');
    } finally {
      setLoading(false);
    }
  };

  // Handle version change
  const handleVersionChange = (newVersionId: string) => {
    setSelectedVersion(newVersionId);

    // If we're viewing verses, reload them with the new version
    if (stage === 'verses' && selectedBook && selectedChapter) {
      loadVerses(selectedBook, selectedChapter, newVersionId);
    }
  };

  // Handle book selection
  const handleBookSelect = (book: BibleBook) => {
    console.log('📖 BibleBrowseSelector: Book selected:', book.name);
    setSelectedBook(book);
    setSelectedChapter(null);
    setSelectedVerses([]);
    setCurrentVerses([]);
    setStage('chapters');
  };

  // Handle chapter selection
  const handleChapterSelect = useCallback(async (chapter: number) => {
    if (!selectedBook) return;

    console.log('📖 BibleBrowseSelector: Chapter selected:', chapter);
    setSelectedChapter(chapter);
    setSelectedVerses([]);
    setStage('verses');

    // Load verses for this chapter
    await loadVerses(selectedBook, chapter, selectedVersion);
  }, [selectedBook, selectedVersion]);

  // Load verses for a chapter
  const loadVerses = async (book: BibleBook, chapter: number, versionId: string) => {
    try {
      setLoading(true);
      setError(null);

      console.log('📖 BibleBrowseSelector: Loading verses', { book: book.name, chapter, versionId });

      const verses = await bibleService.getVerses(versionId, book.id, chapter);
      setCurrentVerses(verses);

      console.log('✅ BibleBrowseSelector: Verses loaded', verses.length);
    } catch (err) {
      console.error('❌ BibleBrowseSelector: Failed to load verses:', err);
      setError(err instanceof Error ? err.message : 'Failed to load verses');
      setCurrentVerses([]);
    } finally {
      setLoading(false);
    }
  };

  // Handle verse selection from chapter list
  const handleVerseSelection = useCallback(async (verseNumbers: number[]) => {
    if (!selectedBook || !selectedChapter || !selectedVersion) return;

    console.log('📖 BibleBrowseSelector: Verses selected:', verseNumbers);
    setSelectedVerses(verseNumbers);

    // Auto-load and preview the selected verses
    try {
      const verses = await bibleService.getVerses(
        selectedVersion,
        selectedBook.id,
        selectedChapter,
        verseNumbers
      );

      // Auto-send to preview
      if (onVerseSelect && verses.length > 0) {
        onVerseSelect(verses);
      }
    } catch (err) {
      console.error('❌ BibleBrowseSelector: Error loading selected verses:', err);
      setError(err instanceof Error ? err.message : 'Failed to load verses');
    }
  }, [selectedBook, selectedChapter, selectedVersion, onVerseSelect]);

  // Handle back navigation
  const handleBack = () => {
    if (stage === 'verses') {
      setStage('chapters');
      setSelectedChapter(null);
      setSelectedVerses([]);
      setCurrentVerses([]);
    } else if (stage === 'chapters') {
      setStage('books');
      setSelectedBook(null);
      setSelectedChapter(null);
      setSelectedVerses([]);
      setCurrentVerses([]);
    }
  };

  // Handle add to service
  const handleAddToService = async () => {
    if (!selectedBook || !selectedChapter || selectedVerses.length === 0) return;

    try {
      const verses = await bibleService.getVerses(
        selectedVersion,
        selectedBook.id,
        selectedChapter,
        selectedVerses
      );

      if (onVerseSelect && verses.length > 0) {
        onVerseSelect(verses);
        // Show feedback
        alert(`${selectedVerses.length} verse${selectedVerses.length !== 1 ? 's' : ''} added to preview!`);
      }
    } catch (err) {
      console.error('❌ BibleBrowseSelector: Error adding to service:', err);
      setError(err instanceof Error ? err.message : 'Failed to add verses');
    }
  };

  // Breadcrumb component
  const Breadcrumb: React.FC = () => {
    const crumbs = [];

    crumbs.push({ label: 'Books', onClick: () => setStage('books') });

    if (selectedBook) {
      crumbs.push({ label: selectedBook.name, onClick: () => setStage('chapters') });
    }

    if (selectedChapter) {
      crumbs.push({ label: `Chapter ${selectedChapter}`, onClick: null });
    }

    return (
      <div className="flex items-center gap-2 text-sm mb-4">
        {crumbs.map((crumb, index) => (
          <React.Fragment key={index}>
            {index > 0 && <span className="text-gray-600">›</span>}
            {crumb.onClick ? (
              <button
                onClick={crumb.onClick}
                className="text-blue-400 hover:text-blue-300 hover:underline"
              >
                {crumb.label}
              </button>
            ) : (
              <span className="text-gray-300 font-medium">{crumb.label}</span>
            )}
          </React.Fragment>
        ))}
      </div>
    );
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
      {/* Version Selector - Always visible at top */}
      <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-700">
        <div className="flex items-center gap-4">
          {/* Back button (visible when not on books stage) */}
          {stage !== 'books' && (
            <button
              onClick={handleBack}
              className="p-2 rounded-lg bg-gray-800 border border-gray-700 hover:bg-gray-700 transition-colors"
              title="Go back"
            >
              <ArrowLeft className="w-5 h-5 text-gray-300" />
            </button>
          )}

          {/* Breadcrumb */}
          <Breadcrumb />
        </div>

        {/* Version selector */}
        <div className="flex items-center space-x-2 bg-gray-800 px-4 py-2 rounded-lg border border-gray-700">
          <label className="text-sm font-medium text-gray-300">Version:</label>
          <select
            value={selectedVersion}
            onChange={(e) => handleVersionChange(e.target.value)}
            className="px-3 py-2 border border-gray-600 rounded-md bg-gray-700 text-white text-sm focus:border-blue-500 focus:outline-none min-w-[120px]"
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

      {/* Stage-specific content */}
      <div className="min-h-[500px]">
        {/* Books Stage */}
        {stage === 'books' && (
          <div>
            <div className="mb-4">
              <h2 className="text-2xl font-bold text-white mb-2">Select a Book</h2>
              <p className="text-sm text-gray-400">
                Choose from {books.length} books of the Bible
              </p>
            </div>
            <BookGrid books={books} onBookSelect={handleBookSelect} />
          </div>
        )}

        {/* Chapters Stage */}
        {stage === 'chapters' && selectedBook && (
          <div>
            <ChapterGrid
              book={selectedBook}
              onChapterSelect={handleChapterSelect}
              selectedChapter={selectedChapter}
            />
          </div>
        )}

        {/* Verses Stage */}
        {stage === 'verses' && selectedBook && selectedChapter && (
          <div className="flex flex-col h-[700px]">
            {/* Sticky Header with Book/Chapter Info and Action Buttons */}
            <div className="flex-shrink-0 bg-gray-900/95 backdrop-blur-sm border-b border-gray-700 mb-4">
              {/* Book and Chapter Title */}
              <div className="p-4 pb-3">
                <h3 className="text-lg font-bold text-white mb-1">
                  {selectedBook.name} Chapter {selectedChapter}
                </h3>
                <p className="text-sm text-gray-400">
                  {currentVerses.length} verses • {selectedBook.testament === 'OT' ? 'Old Testament' : 'New Testament'}
                </p>
              </div>

              {/* Action Bar */}
              <div className="flex items-center justify-between px-4 pb-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-400">
                    {selectedVerses.length > 0 ? (
                      <>
                        <Check className="w-4 h-4 inline text-green-400 mr-1" />
                        {selectedVerses.length} verse{selectedVerses.length !== 1 ? 's' : ''} selected
                      </>
                    ) : (
                      'Click verses to select'
                    )}
                  </span>
                </div>

                {selectedVerses.length > 0 && (
                  <button
                    onClick={handleAddToService}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors flex items-center gap-2"
                  >
                    <Check className="w-4 h-4" />
                    Add to Service
                  </button>
                )}
              </div>
            </div>

            {/* Scrollable Verse List */}
            <div className="flex-1 min-h-0 overflow-y-auto bg-gray-800/30 rounded-lg border border-gray-700">
              {loading ? (
                <div className="flex items-center justify-center p-8">
                  <Loader2 className="w-6 h-6 animate-spin text-blue-400" />
                  <span className="ml-2 text-gray-300">Loading verses...</span>
                </div>
              ) : error ? (
                <div className="text-center py-8">
                  <AlertCircle className="w-12 h-12 mx-auto mb-4 text-red-400" />
                  <p className="text-red-400 mb-4">{error}</p>
                  <button
                    onClick={() => selectedBook && selectedChapter && loadVerses(selectedBook, selectedChapter, selectedVersion)}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    Retry
                  </button>
                </div>
              ) : (
                <ChapterVerseList
                  book={selectedBook}
                  chapter={selectedChapter}
                  selectedVerses={selectedVerses}
                  versionId={selectedVersion}
                  versions={versions}
                  onVerseSelection={handleVerseSelection}
                  onVerseDoubleClick={(verses) => {
                    // On double-click, immediately add to service
                    handleVerseSelection(verses);
                    handleAddToService();
                  }}
                  onVersionChange={() => {}} // Disabled - version controlled at top level
                  className="h-full"
                  loading={loading}
                  error={error}
                  hideVersionSelector={true}
                  hideHeader={true}
                />
              )}
            </div>
          </div>
        )}
      </div>

      {/* Error Display */}
      {error && initialized && (
        <div className="bg-red-900/20 border border-red-600/30 rounded-lg p-3">
          <div className="flex items-center text-red-400">
            <AlertCircle className="w-4 h-4 mr-2" />
            <span className="text-sm">{error}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default BibleBrowseSelector;
