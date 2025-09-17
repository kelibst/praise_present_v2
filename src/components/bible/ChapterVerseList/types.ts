/**
 * Types for ChapterVerseList component
 */

import { Book, Version } from '../../../lib/bibleSlice';
import { ScriptureVerse } from '../../../lib/services/bibleService';

export interface ChapterVerseListProps {
  book: Book | null;
  chapter: number | null;
  selectedVerses: number[];
  versionId: string;
  versions: Version[];
  onVerseSelection: (verses: number[]) => void;
  onVersionChange: (versionId: string) => void;
  className?: string;
  loading?: boolean;
  error?: string | null;
  hideVersionSelector?: boolean;
}

export interface VerseDisplayItem {
  verse: ScriptureVerse;
  isSelected: boolean;
  isInRange: boolean;
  isRangeStart: boolean;
  isRangeEnd: boolean;
}

export interface ChapterData {
  book: Book;
  chapter: number;
  versionId: string;
  verses: ScriptureVerse[];
  loadedAt: number;
}

export interface SelectionState {
  selectedVerses: Set<number>;
  lastSelectedVerse: number | null;
  isRangeSelecting: boolean;
}

export interface VerseSelectionEvent {
  verseNumber: number;
  isShiftClick: boolean;
  isCtrlClick: boolean;
  isKeyboardSelection: boolean;
}

export interface ChapterVerseCache {
  [key: string]: ChapterData; // key format: "bookId-chapter-versionId"
}

export interface LoadingState {
  isLoading: boolean;
  error: string | null;
  retryCount: number;
}

export interface VerseNavigationState {
  focusedVerse: number | null;
  scrollToVerse: number | null;
}

export interface ChapterVerseListState {
  verses: ScriptureVerse[];
  loading: LoadingState;
  selection: SelectionState;
  navigation: VerseNavigationState;
  cache: ChapterVerseCache;
}