# Songs Content Type Improvement Plan

**Created:** 2025-01-25
**Priority:** HIGH - Second presentation type to enhance with new Content Type System
**Goal:** Create SongEditor component and enhance existing SongContentType implementation

---

## Current State Analysis

### What Already Exists

**SongContentType** (`src/rendering/content/SongContent.ts`)
✅ Already implemented as part of the Content Type System
- Type-safe song data model with metadata and sections
- Validation for title, sections, and lyrics
- Slide generation with section splitting
- Template-based rendering
- Support for chords, section labels, copyright

**Data Structure:**
```typescript
interface SongData {
  metadata: {
    title: string;
    artist?: string;
    author?: string;
    copyright?: string;
    ccliNumber?: string;
    key?: string;
    tempo?: number;
    category?: string;
    tags?: string[];
    notes?: string;
  };
  sections: Array<{
    id: string;
    type: 'verse' | 'chorus' | 'bridge' | 'pre-chorus' | 'tag' | 'intro' | 'outro' | 'instrumental';
    number?: number;
    lyrics: string;
    chords?: string;
  }>;
  arrangement?: string[]; // Section order for service
}
```

**SongSlideGenerator** (`src/lib/presentation/songSlideGenerator.ts`)
- Legacy slide generation system
- Lyric parsing and section detection
- Intelligent line splitting
- Title and copyright slides

### What's Missing

1. **No SongEditor Component**: Users cannot edit songs using the new Content Type System UI
2. **Limited Integration**: SongContentType not integrated with existing SongsPage
3. **No Live Preview**: Cannot preview song slides while editing
4. **Arrangement UI**: No drag-and-drop for section arrangement
5. **Chord Support**: Chord editing UI not implemented
6. **Section Management**: Add/edit/delete sections UI missing

---

## Improvement Plan

### Phase 1: Create SongEditor Component

**Goal:** Build a comprehensive song editor with 3-panel layout

**New File:** `src/components/editors/SongEditor.tsx`

**Component Architecture:**

```typescript
const SongEditor: React.FC<BaseEditorProps<SongData, SongSlideSettings>> = ({
  content,
  onContentChange,
  onSlidesGenerated,
  readOnly,
  onSave,
  onCancel
}) => {
  const [song, setSong] = useState(content);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [slides, setSlides] = useState<GeneratedSlide[]>([]);

  // Generate slides when content or settings change
  useEffect(() => {
    const generated = song.generateSlides();
    setSlides(generated);
    onSlidesGenerated?.(generated);
  }, [song]);

  return (
    <EditorProvider content={song} onContentChange={onContentChange}>
      <EditorToolbar
        title="Song Editor"
        subtitle={song.content.metadata.title || 'Untitled Song'}
        actions={[
          { id: 'save', label: 'Save', icon: <SaveIcon />, onClick: onSave, variant: 'primary' },
          { id: 'cancel', label: 'Cancel', icon: <XIcon />, onClick: onCancel, variant: 'secondary' }
        ]}
      />

      <div className="flex h-full">
        {/* Left Panel: Song Content */}
        <div className="w-96 border-r border-border">
          <SongContentPanel song={song} onChange={setSong} readOnly={readOnly} />
        </div>

        {/* Center Panel: Live Preview */}
        <div className="flex-1 p-4 bg-gray-900">
          <SongLivePreview
            slides={slides}
            currentIndex={currentSlideIndex}
            onIndexChange={setCurrentSlideIndex}
          />
        </div>

        {/* Right Panel: Settings */}
        <div className="w-80 border-l border-border">
          <SongSettingsPanel
            settings={song.settings}
            onSettingsChange={(newSettings) => {
              song.updateSettings(newSettings);
              setSong(song.clone());
            }}
          />
        </div>
      </div>
    </EditorProvider>
  );
};
```

---

### Phase 2: Build Sub-Components

#### 2.1 SongContentPanel (Left Panel)

**File:** `src/components/editors/song/SongContentPanel.tsx`

**Features:**

1. **Metadata Tab**
   ```tsx
   <MetadataEditor>
     <TextInput label="Title" value={title} onChange={setTitle} required />
     <TextInput label="Artist" value={artist} onChange={setArtist} />
     <TextInput label="Author" value={author} onChange={setAuthor} />
     <TextInput label="Key" value={key} onChange={setKey} placeholder="C, D, Em, etc." />
     <NumberInput label="Tempo" value={tempo} onChange={setTempo} placeholder="120" />
     <TextInput label="CCLI #" value={ccliNumber} onChange={setCcliNumber} />
     <TextArea label="Copyright" value={copyright} onChange={setCopyright} />
     <TagInput label="Tags" value={tags} onChange={setTags} />
     <TextArea label="Notes" value={notes} onChange={setNotes} />
   </MetadataEditor>
   ```

2. **Sections Tab**
   ```tsx
   <SectionList>
     {sections.map((section, index) => (
       <SectionCard
         key={section.id}
         section={section}
         onEdit={() => editSection(section)}
         onDelete={() => deleteSection(section.id)}
         onMoveUp={() => moveSection(index, -1)}
         onMoveDown={() => moveSection(index, 1)}
       />
     ))}
     <Button onClick={addSection} icon={<PlusIcon />}>
       Add Section
     </Button>
   </SectionList>
   ```

3. **Arrangement Tab**
   ```tsx
   <ArrangementEditor>
     {/* Drag-and-drop list of section IDs */}
     <DragDropList
       items={arrangement}
       renderItem={(sectionId) => (
         <ArrangementItem sectionId={sectionId} label={getSectionLabel(sectionId)} />
       )}
       onReorder={setArrangement}
     />
     <p className="text-sm text-muted-foreground mt-2">
       Drag sections to arrange the order for this service.
       Sections can be repeated (e.g., Chorus appears multiple times).
     </p>
   </ArrangementEditor>
   ```

#### 2.2 SectionEditor Modal

**File:** `src/components/editors/song/SectionEditor.tsx`

```tsx
<Dialog open={isOpen} onClose={onClose}>
  <DialogTitle>
    {section ? 'Edit Section' : 'Add Section'}
  </DialogTitle>
  <DialogContent>
    <Select label="Type" value={type} onChange={setType} options={[
      { value: 'verse', label: 'Verse' },
      { value: 'chorus', label: 'Chorus' },
      { value: 'bridge', label: 'Bridge' },
      { value: 'pre-chorus', label: 'Pre-Chorus' },
      { value: 'tag', label: 'Tag' },
      { value: 'intro', label: 'Intro' },
      { value: 'outro', label: 'Outro' },
      { value: 'instrumental', label: 'Instrumental' }
    ]} />

    {type === 'verse' && (
      <NumberInput label="Verse Number" value={number} onChange={setNumber} />
    )}

    <TextArea
      label="Lyrics"
      value={lyrics}
      onChange={setLyrics}
      rows={10}
      placeholder="Enter lyrics here... (one line per text line)"
    />

    {settings.showChords && (
      <TextArea
        label="Chords (optional)"
        value={chords}
        onChange={setChords}
        rows={10}
        placeholder="Enter chords here... (align with lyrics)"
      />
    )}
  </DialogContent>
  <DialogActions>
    <Button onClick={onClose} variant="secondary">Cancel</Button>
    <Button onClick={handleSave} variant="primary">Save</Button>
  </DialogActions>
</Dialog>
```

#### 2.3 SongSettingsPanel (Right Panel)

**File:** `src/components/editors/song/SongSettingsPanel.tsx`

```tsx
<SettingsPanelContainer>
  {/* Display Settings */}
  <SettingsGroup label="Display">
    <Checkbox
      label="Show section labels"
      checked={settings.showSectionLabels}
      onChange={(v) => updateSettings({ showSectionLabels: v })}
    />
    <Checkbox
      label="Show chords"
      checked={settings.showChords}
      onChange={(v) => updateSettings({ showChords: v })}
    />
    <Checkbox
      label="Show copyright"
      checked={settings.showCopyright}
      onChange={(v) => updateSettings({ showCopyright: v })}
    />
    <Checkbox
      label="Title slide"
      checked={settings.titleSlide}
      onChange={(v) => updateSettings({ titleSlide: v })}
    />
    <Checkbox
      label="End slide"
      checked={settings.endSlide}
      onChange={(v) => updateSettings({ endSlide: v })}
    />
  </SettingsGroup>

  {/* Slide Settings */}
  <SettingsGroup label="Slides">
    <Slider
      label="Max lines per slide"
      value={settings.maxLinesPerSlide}
      onChange={(v) => updateSettings({ maxLinesPerSlide: v })}
      min={2}
      max={12}
      step={1}
    />
  </SettingsGroup>

  {/* Typography Settings */}
  <SettingsGroup label="Typography">
    <Slider
      label="Font size"
      value={settings.typography.fontSize}
      onChange={(v) => updateSettings({ typography: { ...typography, fontSize: v } })}
      min={24}
      max={96}
      step={2}
    />
    <Select
      label="Font family"
      value={settings.typography.fontFamily}
      onChange={(v) => updateSettings({ typography: { ...typography, fontFamily: v } })}
      options={fontFamilyOptions}
    />
    <Select
      label="Text align"
      value={settings.typography.textAlign}
      onChange={(v) => updateSettings({ typography: { ...typography, textAlign: v } })}
      options={[
        { value: 'left', label: 'Left' },
        { value: 'center', label: 'Center' },
        { value: 'right', label: 'Right' }
      ]}
    />
    <ColorPicker
      label="Text color"
      value={settings.typography.textColor}
      onChange={(v) => updateSettings({ typography: { ...typography, textColor: v } })}
    />
    <Slider
      label="Line spacing"
      value={settings.typography.lineSpacing}
      onChange={(v) => updateSettings({ typography: { ...typography, lineSpacing: v } })}
      min={1.0}
      max={2.5}
      step={0.1}
    />
  </SettingsGroup>

  {/* Background Settings */}
  <SettingsGroup label="Background">
    <BackgroundStyleEditor
      background={settings.background}
      onChange={(v) => updateSettings({ background: v })}
    />
  </SettingsGroup>
</SettingsPanelContainer>
```

#### 2.4 SongLivePreview (Center Panel)

**File:** `src/components/editors/song/SongLivePreview.tsx`

```tsx
<PreviewContainer>
  {/* Slide Preview */}
  <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
    <div className="absolute inset-0">
      <SlideRenderer
        slide={slides[currentIndex]}
        targetResolution={{ width: 1920, height: 1080 }}
      />
    </div>
  </div>

  {/* Slide Navigation */}
  <div className="mt-4 flex items-center justify-between">
    <Button
      onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))}
      disabled={currentIndex === 0}
      icon={<ChevronLeftIcon />}
    >
      Previous
    </Button>

    <span className="text-sm text-muted-foreground">
      Slide {currentIndex + 1} of {slides.length}
    </span>

    <Button
      onClick={() => setCurrentIndex(Math.min(slides.length - 1, currentIndex + 1))}
      disabled={currentIndex === slides.length - 1}
      icon={<ChevronRightIcon />}
    >
      Next
    </Button>
  </div>

  {/* Thumbnail Strip */}
  <div className="mt-4 flex gap-2 overflow-x-auto">
    {slides.map((slide, index) => (
      <button
        key={slide.id}
        onClick={() => setCurrentIndex(index)}
        className={`
          flex-shrink-0 w-32 h-18 border-2 rounded overflow-hidden
          ${index === currentIndex ? 'border-blue-500' : 'border-gray-700'}
        `}
      >
        <SlideRenderer
          slide={slide}
          targetResolution={{ width: 1920, height: 1080 }}
        />
      </button>
    ))}
  </div>
</PreviewContainer>
```

---

### Phase 3: Register SongEditor

**File:** `src/components/editors/index.tsx`

```typescript
import { SongEditor } from './SongEditor';
import { editorRegistry } from './EditorFactory';

// Register song editor
editorRegistry.register({
  contentTypeId: 'song',
  name: 'Song Editor',
  component: SongEditor,
  supportsLivePreview: true,
  hasSettingsPanel: true,
  toolbarActions: [
    {
      id: 'import-lyrics',
      label: 'Import Lyrics',
      icon: <UploadIcon />,
      onClick: () => { /* Show import dialog */ }
    },
    {
      id: 'preview',
      label: 'Preview',
      icon: <EyeIcon />,
      onClick: () => { /* Open preview window */ }
    }
  ]
});
```

---

### Phase 4: Integration with SongsPage

**Update:** `src/pages/SongsPage.tsx`

Add "Edit with New Editor" button to existing song management:

```tsx
const handleEditWithNewEditor = (song: Song) => {
  // Convert old song format to SongContentType
  const songContent = ContentTypeHelpers.createSong({
    metadata: {
      title: song.title,
      artist: song.artist,
      author: song.author,
      copyright: song.copyright,
      ccliNumber: song.ccliNumber,
      key: song.key,
      tempo: song.tempo ? parseInt(song.tempo) : undefined,
      category: song.category,
      tags: song.tags,
      notes: song.notes
    },
    sections: song.verses?.map(v => ({
      id: v.id,
      type: v.type,
      number: v.number,
      lyrics: v.lyrics,
      chords: undefined
    })) || [],
    arrangement: undefined
  });

  // Open editor modal or navigate to editor page
  openSongEditor(songContent);
};
```

---

### Phase 5: Enhanced Features

#### 5.1 Lyric Import

**File:** `src/components/editors/song/LyricImporter.tsx`

```tsx
<Dialog open={isOpen} onClose={onClose}>
  <DialogTitle>Import Lyrics</DialogTitle>
  <DialogContent>
    <p className="text-sm text-muted-foreground mb-4">
      Paste song lyrics below. The editor will automatically detect verses, choruses, and other sections.
    </p>

    <TextArea
      value={rawLyrics}
      onChange={setRawLyrics}
      rows={15}
      placeholder={`Verse 1:
Amazing grace how sweet the sound
That saved a wretch like me

Chorus:
My chains are gone
I've been set free`}
    />

    <div className="mt-4">
      <Checkbox
        label="Auto-detect sections"
        checked={autoDetect}
        onChange={setAutoDetect}
      />
      <Checkbox
        label="Split long sections"
        checked={splitLong}
        onChange={setSplitLong}
      />
    </div>
  </DialogContent>
  <DialogActions>
    <Button onClick={onClose} variant="secondary">Cancel</Button>
    <Button onClick={handleImport} variant="primary">Import</Button>
  </DialogActions>
</Dialog>
```

#### 5.2 Chord Editor

**File:** `src/components/editors/song/ChordEditor.tsx`

```tsx
<ChordEditorContainer>
  <div className="grid grid-cols-2 gap-4">
    {/* Left: Lyrics */}
    <div>
      <label className="text-sm font-medium">Lyrics</label>
      <TextArea value={lyrics} readOnly rows={12} />
    </div>

    {/* Right: Chords */}
    <div>
      <label className="text-sm font-medium">Chords</label>
      <TextArea
        value={chords}
        onChange={setChords}
        rows={12}
        placeholder="Align chords above lyrics..."
      />
    </div>
  </div>

  <div className="mt-4">
    <p className="text-xs text-muted-foreground">
      Tip: Use spaces to align chords with lyrics. Example:
    </p>
    <pre className="text-xs bg-secondary p-2 rounded mt-2">
      {`       C           G
Amazing grace how sweet the sound`}
    </pre>
  </div>
</ChordEditorContainer>
```

#### 5.3 Section Templates

**File:** `src/components/editors/song/SectionTemplates.tsx`

Pre-defined section templates for quick song creation:

```tsx
const SECTION_TEMPLATES = {
  verse: {
    type: 'verse',
    lyrics: 'Verse lyrics here...',
    defaultLines: 4
  },
  chorus: {
    type: 'chorus',
    lyrics: 'Chorus lyrics here...',
    defaultLines: 4
  },
  bridge: {
    type: 'bridge',
    lyrics: 'Bridge lyrics here...',
    defaultLines: 4
  }
};
```

---

### Phase 6: Migration from Legacy System

**Create Migration Utility:** `src/utils/songMigration.ts`

```typescript
export const migrateLegacySongToContentType = (
  legacySong: Song
): SongContentType => {
  return ContentTypeHelpers.createSong({
    metadata: {
      title: legacySong.title,
      artist: legacySong.artist,
      author: legacySong.author,
      copyright: legacySong.copyright,
      ccliNumber: legacySong.ccliNumber,
      key: legacySong.key,
      tempo: legacySong.tempo ? parseInt(legacySong.tempo) : undefined,
      category: legacySong.category,
      tags: legacySong.tags,
      notes: legacySong.notes
    },
    sections: legacySong.verses?.map(v => ({
      id: v.id,
      type: v.type,
      number: v.number,
      lyrics: v.lyrics,
      chords: undefined
    })) || parseSongLyrics(legacySong.lyrics),
    arrangement: undefined
  });
};
```

---

## Implementation Checklist

- [ ] Phase 1: Create SongEditor
  - [ ] Create `src/components/editors/SongEditor.tsx`
  - [ ] Set up 3-panel layout (content, preview, settings)
  - [ ] Integrate with EditorProvider

- [ ] Phase 2: Build Sub-Components
  - [ ] Create SongContentPanel with tabs (Metadata, Sections, Arrangement)
  - [ ] Create SectionEditor modal
  - [ ] Create SongSettingsPanel with all controls
  - [ ] Create SongLivePreview with navigation

- [ ] Phase 3: Register Editor
  - [ ] Register SongEditor in editorRegistry
  - [ ] Add toolbar actions (import, preview)
  - [ ] Export from editors/index.tsx

- [ ] Phase 4: Integration
  - [ ] Add "Edit with New Editor" to SongsPage
  - [ ] Migrate song data to SongContentType
  - [ ] Test with existing songs

- [ ] Phase 5: Enhanced Features
  - [ ] Build LyricImporter with auto-detection
  - [ ] Build ChordEditor with alignment
  - [ ] Create section templates library
  - [ ] Add keyboard shortcuts

- [ ] Phase 6: Migration
  - [ ] Create migration utility
  - [ ] Batch migrate existing songs
  - [ ] Deprecate old SongSlideGenerator
  - [ ] Update documentation

---

## Benefits

### For Users

1. **Unified Editing Experience**: Same editor pattern as Media, Announcements, Scripture
2. **Live Preview**: See slides update in real-time as you edit
3. **Drag-and-Drop Arrangement**: Easy section reordering for service planning
4. **Chord Support**: Built-in chord editor with alignment
5. **Import Lyrics**: Quickly import songs from text files or paste
6. **Section Management**: Add/edit/delete sections with modal UI
7. **Visual Customization**: Full control over typography and backgrounds

### For Developers

1. **Type Safety**: Leverage SongContentType validation
2. **Reusable Components**: Editor components follow same pattern
3. **Separation of Concerns**: Content model independent of UI
4. **Extensibility**: Easy to add new features (e.g., transposition)
5. **Testability**: Components can be tested in isolation

---

## Future Enhancements

1. **Transposition**: Change song key on the fly
2. **Chord Charts**: Generate chord diagrams
3. **Multi-Version Support**: Store multiple versions of same song
4. **Setlist Generator**: Create song arrangements for multiple services
5. **Export to PDF**: Print song lyrics and chords
6. **Import from SongSelect**: Direct import from CCLI SongSelect
7. **Version History**: Track changes to songs over time
8. **Collaboration**: Multi-user editing with conflict resolution

---

## Timeline Estimate

- Phase 1: 6-8 hours
- Phase 2: 10-12 hours
- Phase 3: 1-2 hours
- Phase 4: 3-4 hours
- Phase 5: 6-8 hours
- Phase 6: 3-4 hours

**Total:** ~29-38 hours of development time

---

## Success Criteria

1. ✅ SongEditor renders and displays song content
2. ✅ Users can edit metadata, sections, and arrangement
3. ✅ Live preview updates in real-time
4. ✅ Settings panel controls work correctly
5. ✅ Section editor modal allows add/edit/delete
6. ✅ Drag-and-drop arrangement works
7. ✅ Lyric import detects sections automatically
8. ✅ Chord editor aligns chords with lyrics
9. ✅ Integration with SongsPage successful
10. ✅ Migration from legacy songs works
