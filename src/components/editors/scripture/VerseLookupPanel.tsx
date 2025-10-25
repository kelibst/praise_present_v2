import React, { useState, useEffect } from 'react';
import { useBibleLookup } from '../../../hooks/useBibleLookup';
import { ScriptureHelpers } from '../../../rendering/content/ScriptureContent';

export interface VerseLookupState {
  book: string;
  chapter: number;
  verseStart: number;
  verseEnd?: number;
  translation: string;
}

interface VerseLookupPanelProps {
  value: VerseLookupState;
  onChange: (state: VerseLookupState) => void;
  onFetch: (verses: string[]) => void;
}

export const VerseLookupPanel: React.FC<VerseLookupPanelProps> = ({
  value,
  onChange,
  onFetch
}) => {
  const {
    fetchVerses,
    getChapterVerseCount,
    loading,
    error,
    BIBLE_BOOKS,
    BIBLE_TRANSLATIONS
  } = useBibleLookup();

  const [maxVerses, setMaxVerses] = useState<number>(0);
  const [recentScriptures, setRecentScriptures] = useState<VerseLookupState[]>([]);

  // Load recent scriptures from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('recentScriptures');
    if (stored) {
      try {
        setRecentScriptures(JSON.parse(stored));
      } catch (err) {
        console.error('Error loading recent scriptures:', err);
      }
    }
  }, []);

  // Get verse count when book/chapter changes
  useEffect(() => {
    if (value.book && value.chapter > 0) {
      getChapterVerseCount(value.book, value.chapter, value.translation).then(count => {
        setMaxVerses(count);
      });
    }
  }, [value.book, value.chapter, value.translation, getChapterVerseCount]);

  const handleFetchVerses = async () => {
    try {
      const verses = await fetchVerses(
        value.book,
        value.chapter,
        value.verseStart,
        value.verseEnd,
        value.translation
      );

      if (verses.length > 0) {
        onFetch(verses);

        // Add to recent scriptures
        const newRecent = [
          value,
          ...recentScriptures.filter(r =>
            !(r.book === value.book && r.chapter === value.chapter && r.verseStart === value.verseStart)
          )
        ].slice(0, 10);
        setRecentScriptures(newRecent);
        localStorage.setItem('recentScriptures', JSON.stringify(newRecent));
      }
    } catch (err) {
      console.error('Error fetching verses:', err);
    }
  };

  const handleQuickSelect = (scripture: VerseLookupState) => {
    onChange(scripture);
  };

  return (
    <div className="space-y-4 p-4">
      <h3 className="text-lg font-semibold">Verse Lookup</h3>

      {/* Book Selector */}
      <div>
        <label className="block text-sm font-medium mb-1">Book</label>
        <select
          value={value.book}
          onChange={(e) => onChange({ ...value, book: e.target.value })}
          className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded focus:border-blue-500 focus:outline-none"
        >
          <option value="">Select a book...</option>
          {BIBLE_BOOKS.map(book => (
            <option key={book} value={book}>{book}</option>
          ))}
        </select>
      </div>

      {/* Chapter Input */}
      <div>
        <label className="block text-sm font-medium mb-1">Chapter</label>
        <input
          type="number"
          min="1"
          value={value.chapter || ''}
          onChange={(e) => onChange({ ...value, chapter: parseInt(e.target.value) || 1 })}
          className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded focus:border-blue-500 focus:outline-none"
          placeholder="1"
        />
      </div>

      {/* Verse Range */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-sm font-medium mb-1">Start Verse</label>
          <input
            type="number"
            min="1"
            max={maxVerses || undefined}
            value={value.verseStart || ''}
            onChange={(e) => onChange({ ...value, verseStart: parseInt(e.target.value) || 1 })}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded focus:border-blue-500 focus:outline-none"
            placeholder="1"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">End Verse (optional)</label>
          <input
            type="number"
            min={value.verseStart || 1}
            max={maxVerses || undefined}
            value={value.verseEnd || ''}
            onChange={(e) => onChange({ ...value, verseEnd: e.target.value ? parseInt(e.target.value) : undefined })}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded focus:border-blue-500 focus:outline-none"
            placeholder="Same as start"
          />
        </div>
      </div>

      {maxVerses > 0 && (
        <p className="text-xs text-gray-400">
          This chapter has {maxVerses} verses
        </p>
      )}

      {/* Translation Selector */}
      <div>
        <label className="block text-sm font-medium mb-1">Translation</label>
        <select
          value={value.translation}
          onChange={(e) => onChange({ ...value, translation: e.target.value })}
          className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded focus:border-blue-500 focus:outline-none"
        >
          {BIBLE_TRANSLATIONS.map(trans => (
            <option key={trans.value} value={trans.value}>{trans.label}</option>
          ))}
        </select>
      </div>

      {/* Fetch Button */}
      <button
        onClick={handleFetchVerses}
        disabled={!value.book || !value.chapter || !value.verseStart || loading}
        className={`
          w-full px-4 py-2 rounded font-medium transition-colors
          ${!value.book || !value.chapter || !value.verseStart || loading
            ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
            : 'bg-blue-600 text-white hover:bg-blue-700'
          }
        `}
      >
        {loading ? 'Fetching Verses...' : 'Fetch Verses'}
      </button>

      {/* Error Display */}
      {error && (
        <div className="p-3 bg-red-900 bg-opacity-20 border border-red-700 rounded text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Recent Scriptures */}
      {recentScriptures.length > 0 && (
        <div className="mt-6">
          <h4 className="text-sm font-medium mb-2">Recently Used</h4>
          <div className="space-y-1">
            {recentScriptures.map((scripture, index) => {
              const ref = ScriptureHelpers.formatReference(
                scripture.book,
                scripture.chapter,
                scripture.verseStart,
                scripture.verseEnd
              );
              return (
                <button
                  key={index}
                  onClick={() => handleQuickSelect(scripture)}
                  className="w-full text-left px-3 py-2 bg-gray-800 hover:bg-gray-700 rounded text-sm transition-colors"
                >
                  {ref} ({scripture.translation.toUpperCase()})
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Quick Access */}
      <div className="mt-6">
        <h4 className="text-sm font-medium mb-2">Quick Access</h4>
        <div className="grid grid-cols-2 gap-2">
          {[
            { book: 'John', chapter: 3, verse: 16, label: 'John 3:16' },
            { book: 'Psalm', chapter: 23, verse: 1, label: 'Psalm 23' },
            { book: 'Romans', chapter: 8, verse: 28, label: 'Romans 8:28' },
            { book: '1 Corinthians', chapter: 13, verse: 4, verseEnd: 8, label: '1 Cor 13:4-8' }
          ].map((quick) => (
            <button
              key={quick.label}
              onClick={() => onChange({
                book: quick.book,
                chapter: quick.chapter,
                verseStart: quick.verse,
                verseEnd: quick.verseEnd,
                translation: value.translation
              })}
              className="px-2 py-1.5 bg-gray-800 hover:bg-gray-700 rounded text-xs transition-colors"
            >
              {quick.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
