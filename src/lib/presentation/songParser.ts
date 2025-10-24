/**
 * Song lyrics parser - extracts structured sections from song lyrics
 * Supports both marked sections [Verse 1], [Chorus] and unmarked lyrics
 */

export interface SongSection {
  type: 'verse' | 'chorus' | 'bridge' | 'pre-chorus' | 'outro' | 'intro';
  number?: number;
  lyrics: string;
}

/**
 * Parse song lyrics into structured sections (verse, chorus, bridge, etc.)
 * Supports both marked sections [Verse 1], [Chorus] and unmarked lyrics
 */
export const parseSongLyrics = (lyrics: string): SongSection[] => {
  const sections: SongSection[] = [];

  // Ensure lyrics is a string and not empty
  if (!lyrics || typeof lyrics !== 'string') {
    return [{
      type: 'verse',
      number: 1,
      lyrics: 'No lyrics available'
    }];
  }

  // Section marker patterns: [Verse 1], [Chorus], [Bridge], etc.
  const sectionMarkerRegex = /\[(Verse|Chorus|Bridge|Pre-Chorus|Outro|Intro)(\s+\d+)?\]/gi;

  // Split by section markers
  const parts = lyrics.split(sectionMarkerRegex);

  if (parts.length > 1) {
    // Has section markers
    for (let i = 1; i < parts.length; i += 3) {
      const sectionType = parts[i].toLowerCase().replace('-', '-') as SongSection['type'];
      const sectionNumber = parts[i + 1] ? parseInt(parts[i + 1].trim()) : undefined;
      const sectionLyrics = parts[i + 2]?.trim() || '';

      if (sectionLyrics) {
        sections.push({
          type: sectionType,
          number: sectionNumber,
          lyrics: sectionLyrics
        });
      }
    }
  } else {
    // No markers - split by double newlines (paragraph breaks)
    const paragraphs = lyrics.split(/\n\s*\n/).filter(p => p.trim());

    if (paragraphs.length === 0) {
      // Single block of lyrics - treat as one verse
      sections.push({
        type: 'verse',
        number: 1,
        lyrics: lyrics.trim()
      });
    } else {
      // Multiple paragraphs - alternate verse/chorus pattern
      paragraphs.forEach((paragraph, index) => {
        sections.push({
          type: index === 0 ? 'verse' : (index % 2 === 0 ? 'verse' : 'chorus'),
          number: index === 0 ? 1 : (index % 2 === 0 ? Math.ceil(index / 2) + 1 : undefined),
          lyrics: paragraph.trim()
        });
      });
    }
  }

  return sections;
};
