import React, { useState, useEffect, useCallback } from 'react';
import { ChevronDown, Loader2, BookOpen, Clock, RefreshCw, AlertCircle } from 'lucide-react';
import { bibleService, ScriptureVerse } from '../../lib/services/bibleService';
import { Translation, Version, Book as BibleBook } from '../../lib/bibleSlice';
import { SmartScriptureInput } from './SmartScriptureInput';
import { ParsedReference } from './SmartScriptureInput/types';
import { ChapterVerseList } from './ChapterVerseList';
import { scriptureContext } from '../../lib/services/scriptureContext';

interface BibleSelectorProps {
  onVerseSelect?: (verses: ScriptureVerse[]) => void;
  className?: string;
  defaultVersion?: string;
  activeVerses?: number[]; // External control of which verses are shown as selected
}

const BibleSelector: React.FC<BibleSelectorProps> = ({
  onVerseSelect,
  className = '',
  defaultVersion,
  activeVerses
}) => {
  // State management
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

  // State for chapter verse list
  const [currentParsedReference, setCurrentParsedReference] = useState<ParsedReference | null>(null);
  const [selectedVersesFromList, setSelectedVersesFromList] = useState<number[]>([]);

  // Results state
  const [currentVerses, setCurrentVerses] = useState<ScriptureVerse[]>([]);
  const [showVerseList, setShowVerseList] = useState<boolean>(true);
  const [recentReferences, setRecentReferences] = useState<string[]>([]);


  // Initialize component
  useEffect(() => {
    initializeData();
  }, []);

  // Sync external activeVerses with internal state
  useEffect(() => {
    if (activeVerses && activeVerses.length > 0) {
      console.log('🔄 BibleSelector: Syncing with external activeVerses:', activeVerses);
      setSelectedVersesFromList(activeVerses);
    }
  }, [activeVerses]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Escape to clear current selection
      if (event.key === 'Escape') {
        setCurrentVerses([]);
        setSelectedVersesFromList([]);
        setCurrentParsedReference(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

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
      }

      setInitialized(true);
      console.log('✅ BibleSelector: Initialized successfully');
    } catch (err) {
      console.error('❌ BibleSelector: Failed to initialize:', err);
      setError(err instanceof Error ? err.message : 'Failed to initialize Bible data');
    } finally {
      setLoading(false);
    }
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


  // Handle version change
  const handleVersionChange = (newVersionId: string) => {
    setSelectedVersion(newVersionId);
    setCurrentVerses([]);

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

      // Save to context for EasyWorship-style behavior
      scriptureContext.setLastBook(reference.book, formattedReference);

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

  // Handle verse selection from chapter list (auto-preview)
  const handleVerseSelectionFromList = useCallback(async (verseNumbers: number[]) => {
    // console.log('🟣 BibleSelector: handleVerseSelectionFromList called', {
    //   verseNumbers,
    //   hasReference: !!currentParsedReference,
    //   hasVersion: !!selectedVersion
    // });

    if (!currentParsedReference?.book || !currentParsedReference.chapter || !selectedVersion || verseNumbers.length === 0) {
      // console.log('🟣 BibleSelector: Missing requirements, skipping');
      return;
    }

    // Check if selection actually changed to prevent unnecessary updates
    const currentSelection = Array.from(selectedVersesFromList).sort((a, b) => a - b).join(',');
    const newSelection = Array.from(verseNumbers).sort((a, b) => a - b).join(',');

    if (currentSelection === newSelection) {
      // console.log('🟣 BibleSelector: Selection unchanged, skipping');
      return;
    }

    // console.log('🟣 BibleSelector: Setting selectedVersesFromList', verseNumbers);
    setSelectedVersesFromList(verseNumbers);

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

    // Auto-load and preview the selected verses
    // Note: Don't set loading state here - ChapterVerseList already has the verses loaded
    try {
      // console.log('🟣 BibleSelector: Loading verses from API');
      const scriptureVerses = await bibleService.getVerses(
        selectedVersion,
        currentParsedReference.book.id,
        currentParsedReference.chapter,
        verseNumbers
      );

      // console.log('🟣 BibleSelector: Verses loaded, count:', scriptureVerses.length);
      setCurrentVerses(scriptureVerses);

      // Auto-send to preview
      if (onVerseSelect && scriptureVerses.length > 0) {
        // console.log('🟣 BibleSelector: Calling onVerseSelect to send to preview');
        onVerseSelect(scriptureVerses);
      }
    } catch (err) {
      console.error('🟣 BibleSelector: Error loading verses:', err);
      setError(err instanceof Error ? err.message : 'Failed to load verses');
      setCurrentVerses([]);
    }
  }, [currentParsedReference, selectedVersion, onVerseSelect, selectedVersesFromList]);

  // Handle verse double-click from chapter list (send to live)
  const handleVerseDoubleClickFromList = useCallback(async (verseNumbers: number[]) => {
    if (!currentParsedReference?.book || !currentParsedReference.chapter || !selectedVersion || verseNumbers.length === 0) {
      return;
    }

    try {
      // Don't set loading state - verses are already loaded in ChapterVerseList
      const scriptureVerses = await bibleService.getVerses(
        selectedVersion,
        currentParsedReference.book.id,
        currentParsedReference.chapter,
        verseNumbers
      );

      // Send directly to live presentation (this will be handled by parent)
      if (onVerseSelect && scriptureVerses.length > 0) {
        // We'll add a special flag or separate callback for immediate presentation
        // For now, just send the verses - parent will handle the presentation
        onVerseSelect(scriptureVerses);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load verses');
    }
  }, [currentParsedReference, selectedVersion, onVerseSelect]);

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
    <div className={`space-y-4 max-w-4xl mx-auto ${className}`}>
      {/* Version Selector - More Prominent */}
      <div className="flex items-center justify-end mb-3">
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

      {/* Scripture Reference Content */}
      <div className="space-y-4">
            {/* Scripture Input Section */}
            <div className="space-y-3">
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

            </div>

            {/* Chapter Verse List Section */}
            <div className="space-y-2">
              {currentParsedReference?.book && currentParsedReference?.chapter ? (
                <>
                  {/* Collapsible Header */}
                  <div className="flex items-center justify-between p-3 bg-gray-800 rounded-t-lg border border-gray-700 border-b-0">
                    <div className="flex items-center space-x-2">
                      <BookOpen className="w-4 h-4 text-blue-400" />
                      <span className="text-sm font-medium text-white">
                        {currentParsedReference.book.name} Chapter {currentParsedReference.chapter}
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

                  {/* Collapsible Content with Fixed Height */}
                  {showVerseList ? (
                    <div className="h-[400px] overflow-y-auto bg-gray-800 rounded-b-lg border border-gray-700 border-t-0">
                      <ChapterVerseList
                        book={currentParsedReference.book}
                        chapter={currentParsedReference.chapter}
                        selectedVerses={selectedVersesFromList}
                        versionId={selectedVersion || ''}
                        versions={versions}
                        onVerseSelection={handleVerseSelectionFromList}
                        onVerseDoubleClick={handleVerseDoubleClickFromList}
                        onVersionChange={() => {}} // Disabled - version controlled at top level
                        className="h-full"
                        loading={loading}
                        error={error}
                        hideVersionSelector={true}
                        hideHeader={true}
                      />
                    </div>
                  ) : (
                    <div className="bg-gray-800 rounded-b-lg border border-gray-700 border-t-0 flex items-center justify-center py-4">
                      <div className="text-center text-gray-400">
                        <span className="text-sm">Verse list collapsed</span>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="bg-gray-800/30 rounded-lg border border-gray-700 flex items-center justify-center py-8">
                  <div className="text-center text-gray-500">
                    <BookOpen className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Enter a scripture reference above</p>
                  </div>
                </div>
              )}
            </div>
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