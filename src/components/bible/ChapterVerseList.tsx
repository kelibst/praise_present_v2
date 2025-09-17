/**
 * ChapterVerseList Component
 *
 * Displays all verses for a chapter with version selection and multi-select functionality
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ChevronDown, Loader2, AlertCircle, RefreshCw, BookOpen } from 'lucide-react';
import { ChapterVerseListProps, VerseDisplayItem, SelectionState, VerseSelectionEvent } from './ChapterVerseList/types';
import { useChapterVerses } from './ChapterVerseList/hooks/useChapterVerses';

export const ChapterVerseList: React.FC<ChapterVerseListProps> = ({
  book,
  chapter,
  selectedVerses = [],
  versionId,
  versions,
  onVerseSelection,
  onVersionChange,
  className = '',
  loading: externalLoading = false,
  error: externalError = null,
  hideVersionSelector = false
}) => {
  // Hooks
  const {
    verses,
    loading: versesLoading,
    error: versesError,
    refetch
  } = useChapterVerses({ book, chapter, versionId });

  // State
  const [selectionState, setSelectionState] = useState<SelectionState>({
    selectedVerses: new Set(selectedVerses),
    lastSelectedVerse: null,
    isRangeSelecting: false
  });

  const [focusedVerse, setFocusedVerse] = useState<number | null>(null);
  const verseListRef = useRef<HTMLDivElement>(null);

  // Update selection state when props change
  useEffect(() => {
    setSelectionState(prev => ({
      ...prev,
      selectedVerses: new Set(selectedVerses)
    }));
  }, [selectedVerses]);

  // Auto-scroll to first selected verse
  useEffect(() => {
    if (selectedVerses.length > 0 && verseListRef.current) {
      const firstSelected = Math.min(...selectedVerses);
      const verseElement = verseListRef.current.querySelector(`[data-verse="${firstSelected}"]`);
      if (verseElement) {
        verseElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [selectedVerses, verses]);

  // Handle verse selection
  const handleVerseSelection = useCallback((event: VerseSelectionEvent) => {
    const { verseNumber, isShiftClick, isCtrlClick } = event;

    setSelectionState(prev => {
      const newSelectedVerses = new Set(prev.selectedVerses);

      if (isShiftClick && prev.lastSelectedVerse !== null) {
        // Range selection
        const start = Math.min(prev.lastSelectedVerse, verseNumber);
        const end = Math.max(prev.lastSelectedVerse, verseNumber);

        for (let i = start; i <= end; i++) {
          newSelectedVerses.add(i);
        }
      } else if (isCtrlClick) {
        // Toggle selection
        if (newSelectedVerses.has(verseNumber)) {
          newSelectedVerses.delete(verseNumber);
        } else {
          newSelectedVerses.add(verseNumber);
        }
      } else {
        // Single selection
        newSelectedVerses.clear();
        newSelectedVerses.add(verseNumber);
      }

      return {
        ...prev,
        selectedVerses: newSelectedVerses,
        lastSelectedVerse: verseNumber
      };
    });
  }, []);

  // Effect to call parent handler when selection changes (avoiding setState during render)
  useEffect(() => {
    const selectedArray = Array.from(selectionState.selectedVerses).sort((a, b) => a - b);
    if (selectedArray.length > 0) {
      // Use setTimeout to ensure this runs after render
      const timeoutId = setTimeout(() => {
        onVerseSelection(selectedArray);
      }, 0);
      return () => clearTimeout(timeoutId);
    }
  }, [selectionState.selectedVerses, onVerseSelection]);

  // Handle keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!verses.length || !focusedVerse) return;

    let newFocusedVerse = focusedVerse;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        newFocusedVerse = Math.min(focusedVerse + 1, verses[verses.length - 1].verse);
        break;
      case 'ArrowUp':
        e.preventDefault();
        newFocusedVerse = Math.max(focusedVerse - 1, verses[0].verse);
        break;
      case 'Enter':
      case ' ':
        e.preventDefault();
        handleVerseSelection({
          verseNumber: focusedVerse,
          isShiftClick: e.shiftKey,
          isCtrlClick: e.ctrlKey || e.metaKey,
          isKeyboardSelection: true
        });
        break;
      case 'Home':
        e.preventDefault();
        newFocusedVerse = verses[0].verse;
        break;
      case 'End':
        e.preventDefault();
        newFocusedVerse = verses[verses.length - 1].verse;
        break;
    }

    if (newFocusedVerse !== focusedVerse) {
      setFocusedVerse(newFocusedVerse);

      // Scroll to focused verse
      const verseElement = verseListRef.current?.querySelector(`[data-verse="${newFocusedVerse}"]`);
      if (verseElement) {
        verseElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }
  }, [verses, focusedVerse, handleVerseSelection]);

  // Prepare verse display items
  const verseDisplayItems: VerseDisplayItem[] = verses.map(verse => {
    const isSelected = selectionState.selectedVerses.has(verse.verse);
    const sortedSelected = Array.from(selectionState.selectedVerses).sort((a, b) => a - b);
    const isInRange = sortedSelected.length > 1 &&
      verse.verse >= sortedSelected[0] &&
      verse.verse <= sortedSelected[sortedSelected.length - 1];
    const isRangeStart = isSelected && verse.verse === sortedSelected[0];
    const isRangeEnd = isSelected && verse.verse === sortedSelected[sortedSelected.length - 1];

    return {
      verse,
      isSelected,
      isInRange,
      isRangeStart,
      isRangeEnd
    };
  });

  // Determine loading and error states
  const isLoading = externalLoading || versesLoading;
  const error = externalError || versesError;

  // Get current version name
  const currentVersion = versions.find(v => v.id === versionId);

  if (!book || !chapter) {
    return (
      <div className={`p-4 text-center text-gray-400 ${className}`}>
        <BookOpen className="w-8 h-8 mx-auto mb-2 opacity-50" />
        <p className="text-sm">Enter a scripture reference to view verses</p>
      </div>
    );
  }

  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-gray-700 bg-gray-800/50">
        <div className="flex items-center space-x-2">
          <BookOpen className="w-4 h-4 text-blue-400" />
          <span className="text-sm font-medium text-white">
            {book.name} {chapter}
          </span>
          <span className="text-xs text-gray-400">
            ({verses.length} verses)
          </span>
        </div>

        {/* Version Selector - only show if not hidden */}
        {!hideVersionSelector && (
          <div className="relative">
            <select
              value={versionId}
              onChange={(e) => onVersionChange(e.target.value)}
              className="appearance-none bg-gray-700 border border-gray-600 rounded px-3 py-1 pr-8 text-sm text-white focus:border-blue-500 focus:outline-none"
              disabled={isLoading}
            >
              {versions.map((version) => (
                <option key={version.id} value={version.id}>
                  {version.name}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 w-3 h-3 text-gray-400 pointer-events-none" />
          </div>
        )}
      </div>

      {/* Content Area */}
      <div className="flex-1 min-h-0">
        {isLoading && (
          <div className="flex items-center justify-center p-8">
            <Loader2 className="w-6 h-6 animate-spin text-blue-400 mr-2" />
            <span className="text-sm text-gray-300">Loading verses...</span>
          </div>
        )}

        {error && (
          <div className="p-4">
            <div className="flex items-center text-red-400 mb-2">
              <AlertCircle className="w-4 h-4 mr-2" />
              <span className="text-sm">Failed to load verses</span>
            </div>
            <p className="text-xs text-gray-400 mb-3">{error}</p>
            <button
              onClick={refetch}
              className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 flex items-center gap-2"
            >
              <RefreshCw className="w-3 h-3" />
              Retry
            </button>
          </div>
        )}

        {!isLoading && !error && verses.length > 0 && (
          <div
            ref={verseListRef}
            className="overflow-y-auto h-full"
            onKeyDown={handleKeyDown}
            tabIndex={0}
          >
            <div className="p-2 space-y-1">
              {verseDisplayItems.map(({ verse, isSelected, isInRange, isRangeStart, isRangeEnd }) => (
                <div
                  key={verse.id}
                  data-verse={verse.verse}
                  onClick={(e) => handleVerseSelection({
                    verseNumber: verse.verse,
                    isShiftClick: e.shiftKey,
                    isCtrlClick: e.ctrlKey || e.metaKey,
                    isKeyboardSelection: false
                  })}
                  onMouseEnter={() => setFocusedVerse(verse.verse)}
                  className={`
                    p-2 rounded cursor-pointer transition-colors
                    ${isSelected
                      ? 'bg-blue-600 text-white'
                      : isInRange
                        ? 'bg-blue-600/30 text-blue-100'
                        : 'hover:bg-gray-700 text-gray-300'
                    }
                    ${focusedVerse === verse.verse ? 'ring-2 ring-blue-400' : ''}
                    ${isRangeStart ? 'rounded-t-lg' : ''}
                    ${isRangeEnd ? 'rounded-b-lg' : ''}
                  `}
                >
                  <div className="flex items-start space-x-2">
                    <span className={`
                      text-xs font-mono min-w-[2rem] text-center py-0.5 px-1 rounded
                      ${isSelected
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-600 text-gray-300'
                      }
                    `}>
                      {verse.verse}
                    </span>
                    <span className="text-sm leading-relaxed flex-1">
                      {verse.text}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {!isLoading && !error && verses.length === 0 && (
          <div className="p-4 text-center text-gray-400">
            <p className="text-sm">No verses found for {book.name} {chapter}</p>
          </div>
        )}
      </div>

      {/* Footer with selection info */}
      {selectedVerses.length > 0 && (
        <div className="p-2 border-t border-gray-700 bg-gray-800/50">
          <div className="flex items-center justify-between text-xs text-gray-400">
            <span>
              Selected: {selectedVerses.length} verse{selectedVerses.length !== 1 ? 's' : ''}
            </span>
            <span>
              {book.name} {chapter}:{selectedVerses.length === 1
                ? selectedVerses[0]
                : `${Math.min(...selectedVerses)}-${Math.max(...selectedVerses)}`
              }
            </span>
          </div>
        </div>
      )}
    </div>
  );
};