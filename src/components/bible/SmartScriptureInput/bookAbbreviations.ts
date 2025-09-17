/**
 * Book abbreviations mapping for smart scripture reference input
 * Supports common abbreviations used in various Bible software
 */

import { Book } from '../../../lib/bibleSlice';

export interface BookAbbreviation {
  book: string;
  abbreviations: string[];
  order: number;
  testament: 'OT' | 'NT';
}

// Common book abbreviations mapping
export const BOOK_ABBREVIATIONS: BookAbbreviation[] = [
  // Old Testament
  { book: 'Genesis', abbreviations: ['gen', 'ge', 'gn'], order: 1, testament: 'OT' },
  { book: 'Exodus', abbreviations: ['exo', 'ex', 'exod'], order: 2, testament: 'OT' },
  { book: 'Leviticus', abbreviations: ['lev', 'le', 'lv'], order: 3, testament: 'OT' },
  { book: 'Numbers', abbreviations: ['num', 'nu', 'nm', 'nb'], order: 4, testament: 'OT' },
  { book: 'Deuteronomy', abbreviations: ['deut', 'de', 'dt'], order: 5, testament: 'OT' },
  { book: 'Joshua', abbreviations: ['josh', 'jos', 'jsh'], order: 6, testament: 'OT' },
  { book: 'Judges', abbreviations: ['judg', 'jdg', 'jg', 'jud'], order: 7, testament: 'OT' },
  { book: 'Ruth', abbreviations: ['ruth', 'rut', 'ru'], order: 8, testament: 'OT' },
  { book: '1 Samuel', abbreviations: ['1sam', '1 sam', '1s', '1sa', 'i sam'], order: 9, testament: 'OT' },
  { book: '2 Samuel', abbreviations: ['2sam', '2 sam', '2s', '2sa', 'ii sam'], order: 10, testament: 'OT' },
  { book: '1 Kings', abbreviations: ['1kgs', '1 kgs', '1k', '1ki', 'i kgs'], order: 11, testament: 'OT' },
  { book: '2 Kings', abbreviations: ['2kgs', '2 kgs', '2k', '2ki', 'ii kgs'], order: 12, testament: 'OT' },
  { book: '1 Chronicles', abbreviations: ['1chr', '1 chr', '1ch', '1chron', 'i chr'], order: 13, testament: 'OT' },
  { book: '2 Chronicles', abbreviations: ['2chr', '2 chr', '2ch', '2chron', 'ii chr'], order: 14, testament: 'OT' },
  { book: 'Ezra', abbreviations: ['ezra', 'ezr', 'ez'], order: 15, testament: 'OT' },
  { book: 'Nehemiah', abbreviations: ['neh', 'ne'], order: 16, testament: 'OT' },
  { book: 'Esther', abbreviations: ['esth', 'est', 'es'], order: 17, testament: 'OT' },
  { book: 'Job', abbreviations: ['job', 'jb'], order: 18, testament: 'OT' },
  { book: 'Psalms', abbreviations: ['ps', 'psa', 'psalm', 'psalms'], order: 19, testament: 'OT' },
  { book: 'Proverbs', abbreviations: ['prov', 'pro', 'prv', 'pr'], order: 20, testament: 'OT' },
  { book: 'Ecclesiastes', abbreviations: ['eccl', 'ecc', 'ec', 'qoh'], order: 21, testament: 'OT' },
  { book: 'Song of Songs', abbreviations: ['song', 'sos', 'so', 'ss', 'cant'], order: 22, testament: 'OT' },
  { book: 'Isaiah', abbreviations: ['isa', 'is'], order: 23, testament: 'OT' },
  { book: 'Jeremiah', abbreviations: ['jer', 'je', 'jr'], order: 24, testament: 'OT' },
  { book: 'Lamentations', abbreviations: ['lam', 'la'], order: 25, testament: 'OT' },
  { book: 'Ezekiel', abbreviations: ['ezek', 'eze', 'ez'], order: 26, testament: 'OT' },
  { book: 'Daniel', abbreviations: ['dan', 'da', 'dn'], order: 27, testament: 'OT' },
  { book: 'Hosea', abbreviations: ['hos', 'ho'], order: 28, testament: 'OT' },
  { book: 'Joel', abbreviations: ['joel', 'joe', 'jl'], order: 29, testament: 'OT' },
  { book: 'Amos', abbreviations: ['amos', 'amo', 'am'], order: 30, testament: 'OT' },
  { book: 'Obadiah', abbreviations: ['obad', 'oba', 'ob'], order: 31, testament: 'OT' },
  { book: 'Jonah', abbreviations: ['jonah', 'jon', 'jnh'], order: 32, testament: 'OT' },
  { book: 'Micah', abbreviations: ['mic', 'mi'], order: 33, testament: 'OT' },
  { book: 'Nahum', abbreviations: ['nah', 'na'], order: 34, testament: 'OT' },
  { book: 'Habakkuk', abbreviations: ['hab', 'hb'], order: 35, testament: 'OT' },
  { book: 'Zephaniah', abbreviations: ['zeph', 'zep', 'zp'], order: 36, testament: 'OT' },
  { book: 'Haggai', abbreviations: ['hag', 'hg'], order: 37, testament: 'OT' },
  { book: 'Zechariah', abbreviations: ['zech', 'zec', 'zc'], order: 38, testament: 'OT' },
  { book: 'Malachi', abbreviations: ['mal', 'ml'], order: 39, testament: 'OT' },

  // New Testament
  { book: 'Matthew', abbreviations: ['matt', 'mat', 'mt'], order: 40, testament: 'NT' },
  { book: 'Mark', abbreviations: ['mark', 'mar', 'mk', 'mr'], order: 41, testament: 'NT' },
  { book: 'Luke', abbreviations: ['luke', 'luk', 'lk'], order: 42, testament: 'NT' },
  { book: 'John', abbreviations: ['john', 'joh', 'jn'], order: 43, testament: 'NT' },
  { book: 'Acts', abbreviations: ['acts', 'act', 'ac'], order: 44, testament: 'NT' },
  { book: 'Romans', abbreviations: ['rom', 'ro', 'rm'], order: 45, testament: 'NT' },
  { book: '1 Corinthians', abbreviations: ['1cor', '1 cor', '1co', '1c', 'i cor'], order: 46, testament: 'NT' },
  { book: '2 Corinthians', abbreviations: ['2cor', '2 cor', '2co', '2c', 'ii cor'], order: 47, testament: 'NT' },
  { book: 'Galatians', abbreviations: ['gal', 'ga'], order: 48, testament: 'NT' },
  { book: 'Ephesians', abbreviations: ['eph', 'ep'], order: 49, testament: 'NT' },
  { book: 'Philippians', abbreviations: ['phil', 'php', 'pp'], order: 50, testament: 'NT' },
  { book: 'Colossians', abbreviations: ['col', 'co'], order: 51, testament: 'NT' },
  { book: '1 Thessalonians', abbreviations: ['1thess', '1 thess', '1th', '1 th', 'i thess'], order: 52, testament: 'NT' },
  { book: '2 Thessalonians', abbreviations: ['2thess', '2 thess', '2th', '2 th', 'ii thess'], order: 53, testament: 'NT' },
  { book: '1 Timothy', abbreviations: ['1tim', '1 tim', '1ti', '1t', 'i tim'], order: 54, testament: 'NT' },
  { book: '2 Timothy', abbreviations: ['2tim', '2 tim', '2ti', '2t', 'ii tim'], order: 55, testament: 'NT' },
  { book: 'Titus', abbreviations: ['titus', 'tit', 'ti'], order: 56, testament: 'NT' },
  { book: 'Philemon', abbreviations: ['phlm', 'phm', 'pm'], order: 57, testament: 'NT' },
  { book: 'Hebrews', abbreviations: ['heb', 'he'], order: 58, testament: 'NT' },
  { book: 'James', abbreviations: ['jas', 'jam', 'jm'], order: 59, testament: 'NT' },
  { book: '1 Peter', abbreviations: ['1pet', '1 pet', '1pe', '1p', 'i pet'], order: 60, testament: 'NT' },
  { book: '2 Peter', abbreviations: ['2pet', '2 pet', '2pe', '2p', 'ii pet'], order: 61, testament: 'NT' },
  { book: '1 John', abbreviations: ['1john', '1 john', '1jn', '1j', 'i john'], order: 62, testament: 'NT' },
  { book: '2 John', abbreviations: ['2john', '2 john', '2jn', '2j', 'ii john'], order: 63, testament: 'NT' },
  { book: '3 John', abbreviations: ['3john', '3 john', '3jn', '3j', 'iii john'], order: 64, testament: 'NT' },
  { book: 'Jude', abbreviations: ['jude', 'jud', 'jd'], order: 65, testament: 'NT' },
  { book: 'Revelation', abbreviations: ['rev', 're', 'rv'], order: 66, testament: 'NT' }
];

// Create reverse mapping for quick lookup
export const createAbbreviationMap = (): Map<string, string> => {
  const map = new Map<string, string>();

  BOOK_ABBREVIATIONS.forEach(({ book, abbreviations }) => {
    // Add the full book name
    map.set(book.toLowerCase(), book);

    // Add all abbreviations
    abbreviations.forEach(abbrev => {
      map.set(abbrev.toLowerCase(), book);
    });
  });

  return map;
};

// Get book order for sorting
export const getBookOrder = (bookName: string): number => {
  const abbrev = BOOK_ABBREVIATIONS.find(b =>
    b.book.toLowerCase() === bookName.toLowerCase()
  );
  return abbrev?.order || 999;
};

// Check if book is Old Testament or New Testament
export const getTestament = (bookName: string): 'OT' | 'NT' | null => {
  const abbrev = BOOK_ABBREVIATIONS.find(b =>
    b.book.toLowerCase() === bookName.toLowerCase()
  );
  return abbrev?.testament || null;
};