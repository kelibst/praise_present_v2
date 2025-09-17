/**
 * SmartScriptureInput Component
 *
 * Intelligent scripture reference input with auto-completion,
 * validation, and EasyWorship-style features
 */

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Book, Loader2, AlertCircle, BookOpen, Check, ChevronDown } from 'lucide-react';
import { Book as BibleBook } from '../../../lib/bibleSlice';
import {
  SmartScriptureInputProps,
  ParsedReference,
  ReferenceInputState,
  ReferenceSuggestion
} from './types';
import { useReferenceParser } from './hooks/useReferenceParser';
import { useValidation } from './hooks/useValidation';
import { useBookMatcher } from './hooks/useBookMatcher';
import { formatReference, getDisplayText } from './referenceFormatter';

export const SmartScriptureInput: React.FC<SmartScriptureInputProps> = ({
  onReferenceSelect,
  onReferenceChange,
  defaultReference = 'Genesis 1:1',
  placeholder = 'Enter scripture reference (e.g., John 3:16)',
  disabled = false,
  showValidation = true,
  autoComplete = true,
  className = '',
  books = [],
  selectedVersionId = null
}) => {
  // Refs
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // State
  const [inputState, setInputState] = useState<ReferenceInputState>({
    value: defaultReference,
    parsedReference: {
      book: null,
      chapter: null,
      verseStart: null,
      verseEnd: null,
      isValid: false,
      isComplete: false,
      rawInput: defaultReference
    },
    isValidating: false,
    showSuggestions: false,
    selectedSuggestionIndex: -1,
    hasInteracted: false
  });

  // Use books and version from props instead of state
  const [validationResult, setValidationResult] = useState<any>(null);

  // Hooks
  const { parseReference } = useReferenceParser(books);
  const { validateReference, getMaxChapter, getMaxVerse, isLoadingBook } = useValidation(selectedVersionId);
  const {
    generateSuggestions,
    getCompletionSuggestions,
    clearSuggestions,
    suggestions
  } = useBookMatcher(books);

  // Parse reference when input changes
  const updateParsedReference = useCallback((value: string) => {
    const parsed = parseReference(value);

    setInputState(prev => ({
      ...prev,
      value,
      parsedReference: parsed,
      hasInteracted: true
    }));

    // Trigger change callback
    if (onReferenceChange) {
      onReferenceChange(parsed);
    }

    // Generate suggestions for autocomplete
    if (autoComplete && value.trim()) {
      const newSuggestions = generateSuggestions(value, parsed);
      setInputState(prev => ({
        ...prev,
        showSuggestions: newSuggestions.length > 0,
        selectedSuggestionIndex: -1
      }));
    } else {
      setInputState(prev => ({
        ...prev,
        showSuggestions: false,
        selectedSuggestionIndex: -1
      }));
    }
  }, [parseReference, onReferenceChange, autoComplete, generateSuggestions]);

  // Initialize with default reference
  useEffect(() => {
    if (defaultReference && books.length > 0) {
      updateParsedReference(defaultReference);
    }
  }, [books, defaultReference, updateParsedReference]);

  // Validate reference when it changes
  useEffect(() => {
    const validateCurrentReference = async () => {
      if (!inputState.parsedReference.isValid || !selectedVersionId || !inputState.hasInteracted) {
        setValidationResult(null);
        return;
      }

      setInputState(prev => ({ ...prev, isValidating: true }));

      try {
        const result = await validateReference(inputState.parsedReference, selectedVersionId);
        setValidationResult(result);
      } catch (error) {
        console.error('Validation failed:', error);
        setValidationResult({ isValid: false, error: 'Validation failed' });
      } finally {
        setInputState(prev => ({ ...prev, isValidating: false }));
      }
    };

    const debounceTimeout = setTimeout(validateCurrentReference, 300);
    return () => clearTimeout(debounceTimeout);
  }, [inputState.parsedReference, selectedVersionId, validateReference, inputState.hasInteracted]);

  // Handle input change
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    updateParsedReference(value);
  }, [updateParsedReference]);

  // Handle suggestion selection
  const handleSuggestionSelect = useCallback((suggestion: ReferenceSuggestion) => {
    setInputState(prev => ({
      ...prev,
      value: suggestion.text,
      parsedReference: suggestion.reference,
      showSuggestions: false,
      selectedSuggestionIndex: -1
    }));

    if (onReferenceSelect && suggestion.reference.isComplete) {
      onReferenceSelect(suggestion.reference);
    }

    if (onReferenceChange) {
      onReferenceChange(suggestion.reference);
    }

    inputRef.current?.focus();
  }, [onReferenceSelect, onReferenceChange]);

  // Handle keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!inputState.showSuggestions || suggestions.length === 0) {
      if (e.key === 'Enter' && inputState.parsedReference.isValid) {
        // Submit current reference
        if (onReferenceSelect) {
          onReferenceSelect(inputState.parsedReference);
        }
        setInputState(prev => ({ ...prev, showSuggestions: false }));
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setInputState(prev => ({
          ...prev,
          selectedSuggestionIndex: Math.min(prev.selectedSuggestionIndex + 1, suggestions.length - 1)
        }));
        break;

      case 'ArrowUp':
        e.preventDefault();
        setInputState(prev => ({
          ...prev,
          selectedSuggestionIndex: Math.max(prev.selectedSuggestionIndex - 1, -1)
        }));
        break;

      case 'Enter':
        e.preventDefault();
        if (inputState.selectedSuggestionIndex >= 0) {
          handleSuggestionSelect(suggestions[inputState.selectedSuggestionIndex]);
        } else if (inputState.parsedReference.isValid && onReferenceSelect) {
          onReferenceSelect(inputState.parsedReference);
          setInputState(prev => ({ ...prev, showSuggestions: false }));
        }
        break;

      case 'Escape':
        setInputState(prev => ({
          ...prev,
          showSuggestions: false,
          selectedSuggestionIndex: -1
        }));
        break;

      case 'Tab':
        if (inputState.selectedSuggestionIndex >= 0) {
          e.preventDefault();
          handleSuggestionSelect(suggestions[inputState.selectedSuggestionIndex]);
        }
        break;
    }
  }, [
    inputState.showSuggestions,
    inputState.selectedSuggestionIndex,
    inputState.parsedReference,
    suggestions,
    handleSuggestionSelect,
    onReferenceSelect
  ]);

  // Handle input focus
  const handleFocus = useCallback(() => {
    if (autoComplete && inputState.value.trim() && suggestions.length > 0) {
      setInputState(prev => ({ ...prev, showSuggestions: true }));
    }
  }, [autoComplete, inputState.value, suggestions.length]);

  // Handle input blur
  const handleBlur = useCallback((e: React.FocusEvent<HTMLInputElement>) => {
    // Don't hide suggestions if clicking on them
    const relatedTarget = e.relatedTarget as Element;
    if (suggestionsRef.current?.contains(relatedTarget)) {
      return;
    }

    setInputState(prev => ({
      ...prev,
      showSuggestions: false,
      selectedSuggestionIndex: -1
    }));
  }, []);

  // Get input styling based on validation state
  const getInputStyling = useMemo(() => {
    const baseClasses = 'w-full px-3 py-2 border rounded-md transition-colors focus:outline-none focus:ring-2';

    if (disabled) {
      return `${baseClasses} bg-gray-100 border-gray-300 text-gray-500 cursor-not-allowed`;
    }

    if (!inputState.hasInteracted) {
      return `${baseClasses} bg-gray-800 border-gray-600 text-white focus:border-blue-500 focus:ring-blue-500/20`;
    }

    if (inputState.isValidating) {
      return `${baseClasses} bg-gray-800 border-yellow-500 text-white focus:border-yellow-500 focus:ring-yellow-500/20`;
    }

    if (validationResult?.isValid || inputState.parsedReference.isValid) {
      return `${baseClasses} bg-gray-800 border-green-500 text-white focus:border-green-500 focus:ring-green-500/20`;
    }

    if (validationResult?.isValid === false || (inputState.parsedReference.isValid === false && inputState.hasInteracted)) {
      return `${baseClasses} bg-gray-800 border-red-500 text-white focus:border-red-500 focus:ring-red-500/20`;
    }

    return `${baseClasses} bg-gray-800 border-gray-600 text-white focus:border-blue-500 focus:ring-blue-500/20`;
  }, [disabled, inputState.hasInteracted, inputState.isValidating, validationResult, inputState.parsedReference.isValid]);

  return (
    <div className={`relative ${className}`}>
      {/* Input Field */}
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={inputState.value}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={placeholder}
          disabled={disabled}
          className={getInputStyling}
          autoComplete="off"
          spellCheck="false"
        />

        {/* Status Indicators */}
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center space-x-2">
          {inputState.isValidating && (
            <Loader2 className="w-4 h-4 animate-spin text-yellow-400" />
          )}

          {!inputState.isValidating && validationResult?.isValid && (
            <Check className="w-4 h-4 text-green-400" />
          )}

          {!inputState.isValidating && validationResult?.isValid === false && showValidation && (
            <AlertCircle className="w-4 h-4 text-red-400" />
          )}

          {inputState.showSuggestions && suggestions.length > 0 && (
            <ChevronDown className="w-4 h-4 text-gray-400" />
          )}
        </div>
      </div>

      {/* Suggestions Dropdown */}
      {inputState.showSuggestions && suggestions.length > 0 && (
        <div
          ref={suggestionsRef}
          className="absolute z-50 w-full mt-1 bg-gray-800 border border-gray-600 rounded-md shadow-lg max-h-60 overflow-y-auto"
        >
          {suggestions.map((suggestion, index) => (
            <button
              key={`${suggestion.text}-${index}`}
              onClick={() => handleSuggestionSelect(suggestion)}
              className={`w-full px-3 py-2 text-left hover:bg-gray-700 focus:bg-gray-700 focus:outline-none ${
                index === inputState.selectedSuggestionIndex ? 'bg-gray-700' : ''
              }`}
            >
              <div className="flex items-center space-x-2">
                <BookOpen className="w-4 h-4 text-gray-400" />
                <span className="text-white">{suggestion.text}</span>
                <span className="text-xs text-gray-400 ml-auto">
                  {suggestion.type === 'complete' ? '✓' : '→'}
                </span>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Validation Message */}
      {showValidation && validationResult?.error && inputState.hasInteracted && (
        <div className="mt-1 text-sm text-red-400 flex items-center space-x-1">
          <AlertCircle className="w-3 h-3" />
          <span>{validationResult.error}</span>
        </div>
      )}

      {/* Auto-correction Suggestion */}
      {validationResult?.autoCorrection && (
        <div className="mt-1 text-sm text-blue-400">
          <span>Did you mean: </span>
          <button
            onClick={() => {
              const corrected = validationResult.autoCorrection;
              const formattedRef = formatReference(corrected);
              updateParsedReference(formattedRef);
            }}
            className="underline hover:text-blue-300"
          >
            {formatReference(validationResult.autoCorrection)}
          </button>
          ?
        </div>
      )}
    </div>
  );
};