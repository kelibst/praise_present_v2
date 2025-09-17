/**
 * TypeScript interfaces for SmartScriptureInput component
 */

import { Book } from '../../../lib/bibleSlice';

export interface ParsedReference {
  book: Book | null;
  chapter: number | null;
  verseStart: number | null;
  verseEnd: number | null;
  isValid: boolean;
  isComplete: boolean;
  error?: string;
  rawInput: string;
}

export interface ValidationResult {
  isValid: boolean;
  error?: string;
  suggestions?: string[];
  autoCorrection?: ParsedReference;
}

export interface ReferenceInputState {
  value: string;
  parsedReference: ParsedReference;
  isValidating: boolean;
  showSuggestions: boolean;
  selectedSuggestionIndex: number;
  hasInteracted: boolean;
}

export interface ChapterVerseInfo {
  maxChapter: number;
  maxVerse: number;
  chapterVerseCounts: Record<number, number>;
}

export interface SmartScriptureInputProps {
  onReferenceSelect?: (reference: ParsedReference) => void;
  onReferenceChange?: (reference: ParsedReference) => void;
  defaultReference?: string;
  placeholder?: string;
  disabled?: boolean;
  showValidation?: boolean;
  autoComplete?: boolean;
  className?: string;
  books?: Book[];
  selectedVersionId?: string | null;
}

export interface ReferenceSuggestion {
  text: string;
  reference: ParsedReference;
  score: number;
  type: 'book' | 'complete' | 'chapter' | 'verse';
}