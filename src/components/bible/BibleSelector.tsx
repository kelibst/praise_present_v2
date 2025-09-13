import React, { useState, useEffect } from 'react';
import { Book, Search, ChevronDown } from 'lucide-react';

// For now, we'll create a simplified version that works with our existing data
// Later we'll integrate with the full database system

interface ScriptureVerse {
  id?: string;
  book: string;
  chapter: number;
  verse: number;
  text: string;
  translation?: string;
}

interface BibleSelectorProps {
  onVerseSelect?: (verses: ScriptureVerse[]) => void;
  className?: string;
}

// Simplified bible books list
const BIBLE_BOOKS = [
  // Old Testament
  { name: 'Genesis', testament: 'Old', chapters: 50 },
  { name: 'Exodus', testament: 'Old', chapters: 40 },
  { name: 'Leviticus', testament: 'Old', chapters: 27 },
  { name: 'Numbers', testament: 'Old', chapters: 36 },
  { name: 'Deuteronomy', testament: 'Old', chapters: 34 },
  { name: 'Joshua', testament: 'Old', chapters: 24 },
  { name: 'Judges', testament: 'Old', chapters: 21 },
  { name: 'Ruth', testament: 'Old', chapters: 4 },
  { name: '1 Samuel', testament: 'Old', chapters: 31 },
  { name: '2 Samuel', testament: 'Old', chapters: 24 },
  { name: '1 Kings', testament: 'Old', chapters: 22 },
  { name: '2 Kings', testament: 'Old', chapters: 25 },
  { name: '1 Chronicles', testament: 'Old', chapters: 29 },
  { name: '2 Chronicles', testament: 'Old', chapters: 36 },
  { name: 'Ezra', testament: 'Old', chapters: 10 },
  { name: 'Nehemiah', testament: 'Old', chapters: 13 },
  { name: 'Esther', testament: 'Old', chapters: 10 },
  { name: 'Job', testament: 'Old', chapters: 42 },
  { name: 'Psalms', testament: 'Old', chapters: 150 },
  { name: 'Proverbs', testament: 'Old', chapters: 31 },
  { name: 'Ecclesiastes', testament: 'Old', chapters: 12 },
  { name: 'Song of Solomon', testament: 'Old', chapters: 8 },
  { name: 'Isaiah', testament: 'Old', chapters: 66 },
  { name: 'Jeremiah', testament: 'Old', chapters: 52 },
  { name: 'Lamentations', testament: 'Old', chapters: 5 },
  { name: 'Ezekiel', testament: 'Old', chapters: 48 },
  { name: 'Daniel', testament: 'Old', chapters: 12 },
  { name: 'Hosea', testament: 'Old', chapters: 14 },
  { name: 'Joel', testament: 'Old', chapters: 3 },
  { name: 'Amos', testament: 'Old', chapters: 9 },
  { name: 'Obadiah', testament: 'Old', chapters: 1 },
  { name: 'Jonah', testament: 'Old', chapters: 4 },
  { name: 'Micah', testament: 'Old', chapters: 7 },
  { name: 'Nahum', testament: 'Old', chapters: 3 },
  { name: 'Habakkuk', testament: 'Old', chapters: 3 },
  { name: 'Zephaniah', testament: 'Old', chapters: 3 },
  { name: 'Haggai', testament: 'Old', chapters: 2 },
  { name: 'Zechariah', testament: 'Old', chapters: 14 },
  { name: 'Malachi', testament: 'Old', chapters: 4 },

  // New Testament
  { name: 'Matthew', testament: 'New', chapters: 28 },
  { name: 'Mark', testament: 'New', chapters: 16 },
  { name: 'Luke', testament: 'New', chapters: 24 },
  { name: 'John', testament: 'New', chapters: 21 },
  { name: 'Acts', testament: 'New', chapters: 28 },
  { name: 'Romans', testament: 'New', chapters: 16 },
  { name: '1 Corinthians', testament: 'New', chapters: 16 },
  { name: '2 Corinthians', testament: 'New', chapters: 13 },
  { name: 'Galatians', testament: 'New', chapters: 6 },
  { name: 'Ephesians', testament: 'New', chapters: 6 },
  { name: 'Philippians', testament: 'New', chapters: 4 },
  { name: 'Colossians', testament: 'New', chapters: 4 },
  { name: '1 Thessalonians', testament: 'New', chapters: 5 },
  { name: '2 Thessalonians', testament: 'New', chapters: 3 },
  { name: '1 Timothy', testament: 'New', chapters: 6 },
  { name: '2 Timothy', testament: 'New', chapters: 4 },
  { name: 'Titus', testament: 'New', chapters: 3 },
  { name: 'Philemon', testament: 'New', chapters: 1 },
  { name: 'Hebrews', testament: 'New', chapters: 13 },
  { name: 'James', testament: 'New', chapters: 5 },
  { name: '1 Peter', testament: 'New', chapters: 5 },
  { name: '2 Peter', testament: 'New', chapters: 3 },
  { name: '1 John', testament: 'New', chapters: 5 },
  { name: '2 John', testament: 'New', chapters: 1 },
  { name: '3 John', testament: 'New', chapters: 1 },
  { name: 'Jude', testament: 'New', chapters: 1 },
  { name: 'Revelation', testament: 'New', chapters: 22 },
];

const TRANSLATIONS = [
  { id: 'KJV', name: 'King James Version', description: 'Traditional English translation' },
  { id: 'NIV', name: 'New International Version', description: 'Modern English translation' },
  { id: 'ESV', name: 'English Standard Version', description: 'Literary English translation' },
  { id: 'NLT', name: 'New Living Translation', description: 'Easy-to-read modern translation' },
];

// Utility function to parse scripture references like "John 3:16" or "John 3:16-17"
const parseScriptureReference = (input: string): { book: string; chapter: number; verses: number[] } | null => {
  const cleaned = input.trim();

  // Pattern for "Book Chapter:Verse" or "Book Chapter:Verse-Verse"
  const pattern = /^(\d?\s*[A-Za-z]+(?:\s+[A-Za-z]+)*)\s+(\d+):(\d+)(?:-(\d+))?$/;
  const match = cleaned.match(pattern);

  if (match) {
    const bookName = match[1].trim();
    const chapter = parseInt(match[2]);
    const startVerse = parseInt(match[3]);
    const endVerse = match[4] ? parseInt(match[4]) : startVerse;

    const verses = [];
    for (let i = startVerse; i <= endVerse; i++) {
      verses.push(i);
    }

    return { book: bookName, chapter, verses };
  }

  return null;
};

const BibleSelector: React.FC<BibleSelectorProps> = ({ onVerseSelect, className = '' }) => {
  const [selectedTranslation, setSelectedTranslation] = useState('KJV');
  const [selectedBook, setSelectedBook] = useState('');
  const [selectedChapter, setSelectedChapter] = useState<number | null>(null);
  const [selectedVerses, setSelectedVerses] = useState<number[]>([1]);
  const [scriptureReference, setScriptureReference] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [searchResults, setSearchResults] = useState<ScriptureVerse[]>([]);

  const currentBook = BIBLE_BOOKS.find(book => book.name === selectedBook);
  const currentTranslation = TRANSLATIONS.find(t => t.id === selectedTranslation);

  // Handle scripture reference input
  const handleReferenceInput = (input: string) => {
    setScriptureReference(input);

    const parsed = parseScriptureReference(input);
    if (parsed) {
      setSelectedBook(parsed.book);
      setSelectedChapter(parsed.chapter);
      setSelectedVerses(parsed.verses);
    }
  };

  // Generate sample verses (in production, this would come from database)
  const generateSampleVerses = (): ScriptureVerse[] => {
    if (!selectedBook || !selectedChapter || selectedVerses.length === 0) return [];

    // This is mock data - in production it would come from the database
    const mockVerses: ScriptureVerse[] = selectedVerses.map(verseNum => ({
      id: `${selectedBook}-${selectedChapter}-${verseNum}`,
      book: selectedBook,
      chapter: selectedChapter!,
      verse: verseNum,
      text: `This is sample text for ${selectedBook} ${selectedChapter}:${verseNum}. In a production system, this would be the actual biblical text from the ${selectedTranslation} translation.`,
      translation: selectedTranslation
    }));

    return mockVerses;
  };

  const currentVerses = generateSampleVerses();

  const formatReference = () => {
    if (!selectedBook || !selectedChapter || selectedVerses.length === 0) return '';

    if (selectedVerses.length === 1) {
      return `${selectedBook} ${selectedChapter}:${selectedVerses[0]}`;
    } else {
      const sortedVerses = [...selectedVerses].sort((a, b) => a - b);
      const first = sortedVerses[0];
      const last = sortedVerses[sortedVerses.length - 1];
      return `${selectedBook} ${selectedChapter}:${first}-${last}`;
    }
  };

  const handleUseScripture = () => {
    if (onVerseSelect && currentVerses.length > 0) {
      onVerseSelect(currentVerses);
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Quick Reference Input */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Scripture Reference
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={scriptureReference}
            onChange={(e) => handleReferenceInput(e.target.value)}
            placeholder="e.g., John 3:16 or Psalm 23:1-4"
            className="flex-1 px-3 py-2 border border-gray-600 rounded-md bg-gray-800 text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none"
          />
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="px-3 py-2 bg-gray-700 text-white rounded-md hover:bg-gray-600 flex items-center gap-2"
          >
            <Search className="w-4 h-4" />
            {showAdvanced ? 'Simple' : 'Advanced'}
          </button>
        </div>
      </div>

      {/* Advanced Selection */}
      {showAdvanced && (
        <div className="space-y-4 p-4 bg-gray-800 rounded-lg border border-gray-700">
          {/* Translation Selector */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Translation
            </label>
            <select
              value={selectedTranslation}
              onChange={(e) => setSelectedTranslation(e.target.value)}
              className="w-full px-3 py-2 border border-gray-600 rounded-md bg-gray-800 text-white"
            >
              {TRANSLATIONS.map((translation) => (
                <option key={translation.id} value={translation.id}>
                  {translation.name} ({translation.id})
                </option>
              ))}
            </select>
          </div>

          {/* Book Selector */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Book
            </label>
            <select
              value={selectedBook}
              onChange={(e) => setSelectedBook(e.target.value)}
              className="w-full px-3 py-2 border border-gray-600 rounded-md bg-gray-800 text-white"
            >
              <option value="">Select Book</option>
              <optgroup label="Old Testament">
                {BIBLE_BOOKS.filter(book => book.testament === 'Old').map((book) => (
                  <option key={book.name} value={book.name}>
                    {book.name}
                  </option>
                ))}
              </optgroup>
              <optgroup label="New Testament">
                {BIBLE_BOOKS.filter(book => book.testament === 'New').map((book) => (
                  <option key={book.name} value={book.name}>
                    {book.name}
                  </option>
                ))}
              </optgroup>
            </select>
          </div>

          {/* Chapter Selector */}
          {currentBook && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Chapter
              </label>
              <select
                value={selectedChapter || ''}
                onChange={(e) => setSelectedChapter(parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-600 rounded-md bg-gray-800 text-white"
              >
                <option value="">Select Chapter</option>
                {Array.from({ length: currentBook.chapters }, (_, i) => i + 1).map((chapter) => (
                  <option key={chapter} value={chapter}>
                    Chapter {chapter}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Verse Selector */}
          {selectedChapter && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Verses (typical ranges available)
              </label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="number"
                  min="1"
                  max="176"
                  value={selectedVerses[0] || 1}
                  onChange={(e) => setSelectedVerses([parseInt(e.target.value)])}
                  placeholder="Start verse"
                  className="px-3 py-2 border border-gray-600 rounded-md bg-gray-800 text-white"
                />
                <input
                  type="number"
                  min={selectedVerses[0] || 1}
                  max="176"
                  value={selectedVerses[selectedVerses.length - 1] || ''}
                  onChange={(e) => {
                    if (e.target.value) {
                      const start = selectedVerses[0] || 1;
                      const end = parseInt(e.target.value);
                      const range = [];
                      for (let i = start; i <= end; i++) {
                        range.push(i);
                      }
                      setSelectedVerses(range);
                    }
                  }}
                  placeholder="End verse (optional)"
                  className="px-3 py-2 border border-gray-600 rounded-md bg-gray-800 text-white"
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Selected Translation Display */}
      {currentTranslation && (
        <div className="bg-blue-900/30 p-3 rounded-lg border border-blue-600">
          <div className="text-sm font-medium text-blue-300">
            Translation: {currentTranslation.name}
          </div>
          <div className="text-xs text-blue-400">
            {currentTranslation.description}
          </div>
        </div>
      )}

      {/* Scripture Display */}
      {currentVerses.length > 0 && (
        <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
          <div className="flex items-center justify-between mb-3">
            <div className="text-sm font-medium text-white">
              {formatReference()} ({currentTranslation?.id})
            </div>
            <Book className="w-4 h-4 text-gray-400" />
          </div>
          <div className="space-y-2 mb-4">
            {currentVerses.map((verse) => (
              <div key={verse.id} className="text-gray-300">
                <span className="text-xs text-gray-500 mr-2">
                  {verse.verse}
                </span>
                {verse.text}
              </div>
            ))}
          </div>
          {onVerseSelect && (
            <button
              onClick={handleUseScripture}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium"
            >
              Use This Scripture
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default BibleSelector;