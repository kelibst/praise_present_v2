import React, { useState, useEffect } from 'react';
import { BaseEditorProps } from './BaseEditor';
import { SongContentType, SongData, SongSlideSettings } from '../../rendering/content/SongContent';
import { GeneratedSlide } from '../../rendering/content/ContentType';
import { SongContentPanel } from './song/SongContentPanel';
import { ArrangementEditor } from './song/ArrangementEditor';

export const SongEditor: React.FC<BaseEditorProps<SongData, SongSlideSettings>> = ({
  content,
  onContentChange,
  onSlidesGenerated,
  readOnly,
  onSave,
  onCancel
}) => {
  const [song, setSong] = useState<SongContentType>(content);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [slides, setSlides] = useState<GeneratedSlide[]>([]);
  const [activeTab, setActiveTab] = useState<'metadata' | 'sections' | 'arrangement'>('metadata');

  // Generate slides when content or settings change
  useEffect(() => {
    try {
      const generated = song.generateSlides();
      setSlides(generated);
      onSlidesGenerated?.(generated);

      if (currentSlideIndex >= generated.length) {
        setCurrentSlideIndex(Math.max(0, generated.length - 1));
      }
    } catch (err) {
      console.error('Error generating song slides:', err);
      setSlides([]);
    }
  }, [song, onSlidesGenerated]);

  const handleContentChange = (updates: Partial<SongData>) => {
    const updated = song.clone();
    updated.content = { ...updated.content, ...updates };
    setSong(updated);
    onContentChange(updated);
  };

  const handleSettingsChange = (settingsUpdate: Partial<SongSlideSettings>) => {
    song.updateSettings(settingsUpdate);
    const updated = song.clone();
    setSong(updated);
    onContentChange(updated);
  };

  return (
    <div className="flex flex-col h-full bg-gray-950">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-6 py-4 bg-gray-900 border-b border-gray-800">
        <div>
          <h2 className="text-xl font-semibold text-white">Song Editor</h2>
          <p className="text-sm text-gray-400 mt-1">
            {song.content.metadata.title || 'Untitled Song'}
            {song.content.metadata.artist && ` - ${song.content.metadata.artist}`}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {onCancel && (
            <button
              onClick={onCancel}
              className="px-4 py-2 bg-gray-800 text-gray-300 rounded hover:bg-gray-700 transition-colors font-medium"
            >
              Cancel
            </button>
          )}
          {onSave && (
            <button
              onClick={onSave}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors font-medium flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Save
            </button>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Panel: Song Content */}
        <div className="w-96 bg-gray-900 border-r border-gray-800 flex flex-col">
          {/* Tabs */}
          <div className="flex border-b border-gray-800">
            {(['metadata', 'sections', 'arrangement'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`
                  flex-1 px-4 py-3 text-sm font-medium transition-colors
                  ${activeTab === tab
                    ? 'text-blue-400 border-b-2 border-blue-400 bg-gray-800'
                    : 'text-gray-400 hover:text-gray-300 hover:bg-gray-850'
                  }
                `}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="flex-1 overflow-y-auto p-4">
            {activeTab === 'metadata' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Title *</label>
                  <input
                    type="text"
                    value={song.content.metadata.title}
                    onChange={(e) => handleContentChange({
                      metadata: { ...song.content.metadata, title: e.target.value }
                    })}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded focus:border-blue-500 focus:outline-none"
                    placeholder="Song title"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Artist</label>
                  <input
                    type="text"
                    value={song.content.metadata.artist || ''}
                    onChange={(e) => handleContentChange({
                      metadata: { ...song.content.metadata, artist: e.target.value }
                    })}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded focus:border-blue-500 focus:outline-none"
                    placeholder="Artist name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Author</label>
                  <input
                    type="text"
                    value={song.content.metadata.author || ''}
                    onChange={(e) => handleContentChange({
                      metadata: { ...song.content.metadata, author: e.target.value }
                    })}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded focus:border-blue-500 focus:outline-none"
                    placeholder="Songwriter/composer"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium mb-1">Key</label>
                    <input
                      type="text"
                      value={song.content.metadata.key || ''}
                      onChange={(e) => handleContentChange({
                        metadata: { ...song.content.metadata, key: e.target.value }
                      })}
                      className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded focus:border-blue-500 focus:outline-none"
                      placeholder="C, D, Em"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Tempo</label>
                    <input
                      type="number"
                      value={song.content.metadata.tempo || ''}
                      onChange={(e) => handleContentChange({
                        metadata: { ...song.content.metadata, tempo: parseInt(e.target.value) || undefined }
                      })}
                      className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded focus:border-blue-500 focus:outline-none"
                      placeholder="120"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">CCLI #</label>
                  <input
                    type="text"
                    value={song.content.metadata.ccliNumber || ''}
                    onChange={(e) => handleContentChange({
                      metadata: { ...song.content.metadata, ccliNumber: e.target.value }
                    })}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded focus:border-blue-500 focus:outline-none"
                    placeholder="1234567"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Copyright</label>
                  <textarea
                    value={song.content.metadata.copyright || ''}
                    onChange={(e) => handleContentChange({
                      metadata: { ...song.content.metadata, copyright: e.target.value }
                    })}
                    rows={3}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded focus:border-blue-500 focus:outline-none resize-none"
                    placeholder="© 2024 Publisher Name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Notes</label>
                  <textarea
                    value={song.content.metadata.notes || ''}
                    onChange={(e) => handleContentChange({
                      metadata: { ...song.content.metadata, notes: e.target.value }
                    })}
                    rows={4}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded focus:border-blue-500 focus:outline-none resize-none"
                    placeholder="Internal notes..."
                  />
                </div>
              </div>
            )}

            {activeTab === 'sections' && (
              <SongContentPanel
                song={song.content}
                onChange={handleContentChange}
                readOnly={readOnly}
                showChords={song.settings.showChords}
              />
            )}

            {activeTab === 'arrangement' && (
              <ArrangementEditor
                song={song.content}
                onChange={handleContentChange}
                readOnly={readOnly}
              />
            )}
          </div>
        </div>

        {/* Center Panel: Live Preview */}
        <div className="flex-1 p-6 overflow-hidden">
          <div className="h-full flex flex-col">
            {slides.length > 0 ? (
              <>
                <div className="flex-1 bg-gray-900 rounded overflow-hidden relative">
                  <div className="w-full h-full flex items-center justify-center p-4">
                    <div className="relative w-full" style={{ maxHeight: '100%', aspectRatio: '16/9' }}>
                      <div className="absolute inset-0 flex items-center justify-center text-gray-500">
                        <p>Preview will be available once SlideRenderer is fixed</p>
                      </div>
                    </div>
                  </div>
                </div>

                {slides.length > 1 && (
                  <div className="mt-4 flex items-center justify-between">
                    <button
                      onClick={() => setCurrentSlideIndex(Math.max(0, currentSlideIndex - 1))}
                      disabled={currentSlideIndex === 0}
                      className={`px-4 py-2 rounded transition-colors ${
                        currentSlideIndex === 0
                          ? 'bg-gray-800 text-gray-600 cursor-not-allowed'
                          : 'bg-gray-700 text-white hover:bg-gray-600'
                      }`}
                    >
                      Previous
                    </button>

                    <span className="text-sm text-gray-400">
                      Slide {currentSlideIndex + 1} of {slides.length}
                    </span>

                    <button
                      onClick={() => setCurrentSlideIndex(Math.min(slides.length - 1, currentSlideIndex + 1))}
                      disabled={currentSlideIndex === slides.length - 1}
                      className={`px-4 py-2 rounded transition-colors ${
                        currentSlideIndex === slides.length - 1
                          ? 'bg-gray-800 text-gray-600 cursor-not-allowed'
                          : 'bg-gray-700 text-white hover:bg-gray-600'
                      }`}
                    >
                      Next
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="flex items-center justify-center h-full bg-gray-900 rounded">
                <div className="text-center text-gray-400">
                  <p className="text-lg">No slides generated</p>
                  <p className="text-sm mt-2">Add song sections to generate slides</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Panel: Settings */}
        <div className="w-80 bg-gray-900 border-l border-gray-800 overflow-y-auto p-4">
          <h3 className="text-lg font-semibold mb-4">Settings</h3>

          <div className="space-y-4">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={song.settings.showSectionLabels}
                onChange={(e) => handleSettingsChange({ showSectionLabels: e.target.checked })}
                className="w-4 h-4 rounded bg-gray-800 border-gray-700"
              />
              <span className="text-sm">Show section labels</span>
            </label>

            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={song.settings.showCopyright}
                onChange={(e) => handleSettingsChange({ showCopyright: e.target.checked })}
                className="w-4 h-4 rounded bg-gray-800 border-gray-700"
              />
              <span className="text-sm">Show copyright</span>
            </label>

            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={song.settings.showChords}
                onChange={(e) => handleSettingsChange({ showChords: e.target.checked })}
                className="w-4 h-4 rounded bg-gray-800 border-gray-700"
              />
              <span className="text-sm">Show chords</span>
            </label>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Max lines per slide: {song.settings.maxLinesPerSlide}
              </label>
              <input
                type="range"
                min="2"
                max="12"
                step="1"
                value={song.settings.maxLinesPerSlide}
                onChange={(e) => handleSettingsChange({ maxLinesPerSlide: parseInt(e.target.value) })}
                className="w-full"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Status Bar */}
      <div className="px-6 py-3 bg-gray-900 border-t border-gray-800 flex items-center justify-between text-sm text-gray-400">
        <div className="flex items-center gap-4">
          <span>{slides.length} slide{slides.length !== 1 ? 's' : ''} generated</span>
          <span className="text-gray-600">|</span>
          <span>{song.content.sections.length} section{song.content.sections.length !== 1 ? 's' : ''}</span>
        </div>

        {song.validate().errors.length > 0 && (
          <div className="flex items-center gap-2 text-red-400">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {song.validate().errors.length} error{song.validate().errors.length !== 1 ? 's' : ''}
          </div>
        )}
      </div>
    </div>
  );
};

export default SongEditor;
