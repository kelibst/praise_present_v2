import React from 'react';
import { Book } from '../../lib/bibleSlice';

interface ChapterGridProps {
  book: Book;
  onChapterSelect: (chapter: number) => void;
  selectedChapter?: number | null;
  className?: string;
}

const ChapterGrid: React.FC<ChapterGridProps> = ({
  book,
  onChapterSelect,
  selectedChapter = null,
  className = ''
}) => {
  // Generate array of chapter numbers
  const chapters = Array.from({ length: book.chapters }, (_, i) => i + 1);

  return (
    <div className={`${className}`}>
      {/* Book header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white mb-1">{book.name}</h2>
        <p className="text-sm text-gray-400">
          {book.testament === 'OT' ? 'Old Testament' : 'New Testament'} • {book.category} • {book.chapters} chapters
        </p>
      </div>

      {/* Chapter grid */}
      <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-12 xl:grid-cols-15 gap-2">
        {chapters.map(chapter => (
          <button
            key={chapter}
            onClick={() => onChapterSelect(chapter)}
            className={`
              relative p-3 rounded-lg border-2 transition-all duration-200
              font-semibold text-center
              ${selectedChapter === chapter
                ? 'bg-blue-600 border-blue-500 text-white scale-105 shadow-lg'
                : 'bg-gray-800/50 border-gray-700 text-gray-300 hover:bg-gray-700 hover:border-gray-600 hover:scale-105'
              }
              focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900
            `}
            title={`${book.name} Chapter ${chapter}`}
          >
            {chapter}
          </button>
        ))}
      </div>

      {/* Helper text */}
      <div className="mt-6 text-center text-sm text-gray-400">
        Click a chapter number to view verses
      </div>
    </div>
  );
};

export default ChapterGrid;
