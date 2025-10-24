import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Music, ArrowLeft, Play, Save } from 'lucide-react';
import { sampleSongs } from '../../data/sample-songs';
import { SongMetadataEditor, SongMetadata } from '../components/songs/SongMetadataEditor';
import { SongSectionEditor, SongSection } from '../components/songs/SongSectionEditor';
import { SongSlidePreview } from '../components/songs/SongSlidePreview';
import { SongSlideSettingsPanel } from '../components/songs/SongSlideSettings';
import {
  Song,
  SongSlide,
  SongSlideGenerator,
  SongSlideSettings
} from '../lib/presentation/songSlideGenerator';
import { parseSongLyrics } from '../lib/presentation/songParser';

const SongDetailsPage: React.FC = () => {
  const { songId } = useParams<{ songId: string }>();
  const navigate = useNavigate();

  // Find the song
  const [song, setSong] = useState<Song | null>(null);
  const [metadata, setMetadata] = useState<SongMetadata | null>(null);
  const [sections, setSections] = useState<SongSection[]>([]);
  const [slideSettings, setSlideSettings] = useState<SongSlideSettings>({
    background: { type: 'color', value: '#1a1a1a' },
    typography: {
      fontSize: 56,
      fontFamily: 'Arial, sans-serif',
      textAlign: 'center',
      textColor: '#ffffff',
      lineSpacing: 1.4
    },
    showSectionLabels: true,
    showChords: false,
    showCopyright: true,
    maxLinesPerSlide: 8
  });

  // Load song data
  useEffect(() => {
    if (!songId) return;

    const foundSong = sampleSongs.find(s => s.id === songId);
    if (foundSong) {
      setSong(foundSong as Song);

      // Initialize metadata
      setMetadata({
        title: foundSong.title,
        author: foundSong.author,
        artist: foundSong.artist,
        key: foundSong.key,
        tempo: foundSong.tempo,
        category: foundSong.category,
        copyright: foundSong.copyright,
        ccliNumber: foundSong.ccliNumber,
        tags: foundSong.tags,
        notes: foundSong.notes
      });

      // Initialize sections
      if (foundSong.verses && foundSong.verses.length > 0) {
        setSections(foundSong.verses.map(v => ({
          id: v.id,
          type: v.type,
          number: v.number,
          lyrics: v.lyrics,
          chords: v.chords
        })));
      } else {
        // Parse lyrics into sections
        const parsed = parseSongLyrics(foundSong.lyrics);
        setSections(parsed.map((section, index) => ({
          id: `section-${index}`,
          ...section
        })));
      }

      // Load existing slide settings if available
      if ((foundSong as Song).slideSettings) {
        setSlideSettings((foundSong as Song).slideSettings!);
      }
    }
  }, [songId]);

  // Generate slides when sections or settings change
  const slides: SongSlide[] = useMemo(() => {
    if (!song || !metadata) return [];

    const songWithSections: Song = {
      ...song,
      ...metadata,
      verses: sections,
      slideSettings
    };

    const generator = new SongSlideGenerator({
      maxLinesPerSlide: slideSettings.maxLinesPerSlide || 8,
      showSectionLabels: slideSettings.showSectionLabels ?? true,
      showChords: slideSettings.showChords ?? false,
      showCopyrightSlide: slideSettings.showCopyright ?? true
    });

    return generator.generateSlides(songWithSections);
  }, [song, metadata, sections, slideSettings]);

  const handleAddToService = () => {
    if (!song || !metadata) return;

    // Create service item with generated slides
    const serviceItem = {
      id: `song-${song.id}-${Date.now()}`,
      type: 'song' as const,
      title: metadata.title,
      content: {
        ...song,
        ...metadata,
        verses: sections,
        slideSettings
      },
      slides: slides.map(slide => ({
        id: slide.id,
        shapes: slide.shapes,
        background: slide.background
      }))
    };

    // Store in localStorage for LivePresentationPage to pick up
    const currentItems = JSON.parse(localStorage.getItem('pendingServiceItems') || '[]');
    currentItems.push(serviceItem);
    localStorage.setItem('pendingServiceItems', JSON.stringify(currentItems));

    // Navigate to live presentation page
    navigate('/live');
  };

  const handleSave = () => {
    // TODO: Implement saving to database
    console.log('Saving song:', {
      ...song,
      ...metadata,
      verses: sections,
      slideSettings
    });
    alert('Song saved successfully!');
  };

  if (!song || !metadata) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <div className="text-center">
          <Music className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
          <div className="text-xl font-medium">Song not found</div>
          <button
            onClick={() => navigate('/songs')}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Back to Songs
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <div className="border-b border-border bg-card sticky top-0 z-10">
        <div className="max-w-[1800px] mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/songs')}
                className="p-2 hover:bg-secondary rounded-lg transition-colors"
                title="Back to songs"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-2xl font-bold flex items-center gap-3">
                  <Music className="w-7 h-7 text-blue-400" />
                  {metadata.title}
                </h1>
                <p className="text-sm text-muted-foreground">
                  {metadata.author}
                  {metadata.artist && metadata.artist !== metadata.author && ` • ${metadata.artist}`}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleSave}
                className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                Save
              </button>
              <button
                onClick={handleAddToService}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center gap-2"
              >
                <Play className="w-4 h-4" />
                Add to Service
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-[1800px] mx-auto px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Panel - Song Info & Lyrics */}
          <div className="space-y-6">
            <SongMetadataEditor
              metadata={metadata}
              onChange={setMetadata}
            />

            <SongSectionEditor
              sections={sections}
              onChange={setSections}
            />
          </div>

          {/* Right Panel - Slide Previews & Settings */}
          <div className="space-y-6">
            <SongSlidePreview slides={slides} />

            <SongSlideSettingsPanel
              settings={slideSettings}
              onChange={setSlideSettings}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default SongDetailsPage;
