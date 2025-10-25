import React from 'react';
import { Book } from '../../lib/bibleSlice';
import { BookOpen, Scroll } from 'lucide-react';

interface BookGridProps {
  books: Book[];
  onBookSelect: (book: Book) => void;
  className?: string;
}

const BookGrid: React.FC<BookGridProps> = ({ books, onBookSelect, className = '' }) => {
  // Separate books by testament
  const oldTestamentBooks = books.filter(b => b.testament === 'OT').sort((a, b) => a.order - b.order);
  const newTestamentBooks = books.filter(b => b.testament === 'NT').sort((a, b) => a.order - b.order);

  // Category colors for visual distinction
  const getCategoryColor = (category: string): string => {
    const colors: Record<string, string> = {
      'Law': 'bg-blue-600/20 border-blue-500/50 hover:bg-blue-600/30 hover:border-blue-500',
      'History': 'bg-green-600/20 border-green-500/50 hover:bg-green-600/30 hover:border-green-500',
      'Poetry': 'bg-purple-600/20 border-purple-500/50 hover:bg-purple-600/30 hover:border-purple-500',
      'Prophecy': 'bg-orange-600/20 border-orange-500/50 hover:bg-orange-600/30 hover:border-orange-500',
      'Gospel': 'bg-emerald-600/20 border-emerald-500/50 hover:bg-emerald-600/30 hover:border-emerald-500',
      'Epistle': 'bg-indigo-600/20 border-indigo-500/50 hover:bg-indigo-600/30 hover:border-indigo-500',
      'Apocalyptic': 'bg-red-600/20 border-red-500/50 hover:bg-red-600/30 hover:border-red-500',
    };
    return colors[category] || 'bg-gray-600/20 border-gray-500/50 hover:bg-gray-600/30 hover:border-gray-500';
  };

  const BookCard: React.FC<{ book: Book }> = ({ book }) => (
    <button
      onClick={() => onBookSelect(book)}
      className={`
        relative p-4 rounded-lg border-2 transition-all duration-200
        ${getCategoryColor(book.category)}
        group cursor-pointer
        flex flex-col items-center justify-center
        min-h-[100px]
      `}
      title={`${book.name} - ${book.chapters} chapters`}
    >
      {/* Short name */}
      <div className="text-sm font-semibold text-white mb-2 text-center">
        {book.shortName}
      </div>

      {/* Chapter count badge */}
      <div className="flex items-center gap-1 text-xs text-gray-300">
        <BookOpen className="w-3 h-3" />
        <span>{book.chapters} {book.chapters === 1 ? 'ch' : 'chs'}</span>
      </div>

      {/* Category badge (visible on hover) */}
      <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <span className="text-[10px] px-1.5 py-0.5 rounded bg-black/50 text-gray-300">
          {book.category}
        </span>
      </div>
    </button>
  );

  return (
    <div className={`space-y-8 ${className}`}>
      {/* Old Testament Section */}
      <div>
        <div className="flex items-center gap-2 mb-4 pb-2 border-b border-gray-700">
          <Scroll className="w-5 h-5 text-blue-400" />
          <h2 className="text-xl font-bold text-white">Old Testament</h2>
          <span className="text-sm text-gray-400">({oldTestamentBooks.length} books)</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
          {oldTestamentBooks.map(book => (
            <BookCard key={book.id} book={book} />
          ))}
        </div>
      </div>

      {/* New Testament Section */}
      <div>
        <div className="flex items-center gap-2 mb-4 pb-2 border-b border-gray-700">
          <BookOpen className="w-5 h-5 text-emerald-400" />
          <h2 className="text-xl font-bold text-white">New Testament</h2>
          <span className="text-sm text-gray-400">({newTestamentBooks.length} books)</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
          {newTestamentBooks.map(book => (
            <BookCard key={book.id} book={book} />
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="mt-6 p-4 bg-gray-800/50 rounded-lg border border-gray-700">
        <div className="text-xs text-gray-400 mb-2 font-medium">Categories:</div>
        <div className="flex flex-wrap gap-2">
          {['Law', 'History', 'Poetry', 'Prophecy', 'Gospel', 'Epistle', 'Apocalyptic'].map(category => (
            <div key={category} className="flex items-center gap-1">
              <div className={`w-3 h-3 rounded border-2 ${getCategoryColor(category)}`} />
              <span className="text-xs text-gray-300">{category}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default BookGrid;
