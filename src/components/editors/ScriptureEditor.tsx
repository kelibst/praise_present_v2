import React, { useState, useEffect } from 'react';
import { BaseEditorProps } from './BaseEditor';
import { ScriptureContentType, ScriptureData, ScriptureSlideSettings, ScriptureHelpers } from '../../rendering/content/ScriptureContent';
import { VerseLookupPanel, VerseLookupState } from './scripture/VerseLookupPanel';
import { ScriptureSettingsPanel } from './scripture/ScriptureSettingsPanel';
import { ScriptureLivePreview } from './scripture/ScriptureLivePreview';
import { GeneratedSlide } from '../../rendering/content/ContentType';

export const ScriptureEditor: React.FC<BaseEditorProps<ScriptureData, ScriptureSlideSettings>> = ({
  content,
  onContentChange,
  onSlidesGenerated,
  readOnly,
  onSave,
  onCancel
}) => {
  const [scripture, setScripture] = useState<ScriptureContentType>(content);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [slides, setSlides] = useState<GeneratedSlide[]>([]);

  const [lookupState, setLookupState] = useState<VerseLookupState>({
    book: scripture.content.metadata.book,
    chapter: scripture.content.metadata.chapter,
    verseStart: scripture.content.metadata.verseStart,
    verseEnd: scripture.content.metadata.verseEnd,
    translation: scripture.content.metadata.translation
  });

  // Generate slides when content or settings change
  useEffect(() => {
    try {
      const generated = scripture.generateSlides();
      setSlides(generated);
      onSlidesGenerated?.(generated);

      // Reset slide index if out of bounds
      if (currentSlideIndex >= generated.length) {
        setCurrentSlideIndex(Math.max(0, generated.length - 1));
      }
    } catch (err) {
      console.error('Error generating scripture slides:', err);
      setSlides([]);
    }
  }, [scripture, onSlidesGenerated]);

  const handleFetchVerses = (verses: string[]) => {
    // Create new scripture content with fetched verses
    const newScripture = ScriptureHelpers.createFromVerses(
      lookupState.book,
      lookupState.chapter,
      lookupState.verseStart,
      lookupState.verseEnd,
      lookupState.translation,
      verses
    );

    // Preserve current settings
    newScripture.updateSettings(scripture.settings);

    setScripture(newScripture);
    onContentChange(newScripture);
  };

  const handleSettingsChange = (settingsUpdate: Partial<ScriptureSlideSettings>) => {
    scripture.updateSettings(settingsUpdate);
    const updated = scripture.clone();
    setScripture(updated);
    onContentChange(updated);
  };

  return (
    <div className="flex flex-col h-full bg-gray-950">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-6 py-4 bg-gray-900 border-b border-gray-800">
        <div>
          <h2 className="text-xl font-semibold text-white">Scripture Editor</h2>
          <p className="text-sm text-gray-400 mt-1">
            {scripture.content.content.displayReference || 'No scripture selected'}
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
        {/* Left Panel: Verse Lookup */}
        <div className="w-96 bg-gray-900 border-r border-gray-800 overflow-y-auto">
          <VerseLookupPanel
            value={lookupState}
            onChange={setLookupState}
            onFetch={handleFetchVerses}
          />
        </div>

        {/* Center Panel: Live Preview */}
        <div className="flex-1 p-6 overflow-hidden">
          <ScriptureLivePreview
            slides={slides}
            currentIndex={currentSlideIndex}
            onIndexChange={setCurrentSlideIndex}
          />
        </div>

        {/* Right Panel: Settings */}
        <div className="w-80 bg-gray-900 border-l border-gray-800 overflow-y-auto">
          <ScriptureSettingsPanel
            settings={scripture.settings}
            onSettingsChange={handleSettingsChange}
          />
        </div>
      </div>

      {/* Status Bar */}
      <div className="px-6 py-3 bg-gray-900 border-t border-gray-800 flex items-center justify-between text-sm text-gray-400">
        <div className="flex items-center gap-4">
          <span>{slides.length} slide{slides.length !== 1 ? 's' : ''} generated</span>
          <span className="text-gray-600">|</span>
          <span>{scripture.content.content.verses.length} verse{scripture.content.content.verses.length !== 1 ? 's' : ''}</span>
        </div>

        {scripture.validate().errors.length > 0 && (
          <div className="flex items-center gap-2 text-red-400">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {scripture.validate().errors.length} error{scripture.validate().errors.length !== 1 ? 's' : ''}
          </div>
        )}
      </div>
    </div>
  );
};

export default ScriptureEditor;
