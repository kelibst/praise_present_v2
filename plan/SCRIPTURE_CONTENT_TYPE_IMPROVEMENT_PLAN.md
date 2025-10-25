# Scripture Content Type Improvement Plan

**Created:** 2025-01-25
**Priority:** HIGH - First presentation type to migrate to new Content Type System
**Goal:** Migrate Scripture presentation from template-based rendering to the new Content Type System with specialized editor

---

## Current State Analysis

### What Exists Today

**ScriptureTemplate.ts**
- Template-based slide generation at 1920x1080
- Support for verse, reference, translation placeholders
- Theme variations (reading, meditation, memory, announcement)
- Feature settings integration for typography and background
- Fixed placeholder positions

**Data Structure:**
```typescript
interface ScriptureSlideContent {
  verse: string;
  reference: string;
  translation?: string;
  book?: string;
  chapter?: number;
  verseNumber?: number;
  verseRange?: string;
  theme?: 'reading' | 'meditation' | 'memory' | 'announcement';
  showTranslation?: boolean;
  emphasizeReference?: boolean;
  featureSettings?: {
    background?: any;
    typography?: { ... };
  };
}
```

### Limitations of Current Approach

1. **Not Type-Safe**: No ContentType wrapper, uses plain objects
2. **No Validation**: Can create invalid scripture references
3. **Template-Locked**: Cannot customize layout without modifying template code
4. **No Editing UI**: Users cannot edit scripture slides after generation
5. **Limited Metadata**: No tracking of editability, overrides, or content type
6. **Hard to Extend**: Adding new scripture features requires template changes

---

## Improvement Plan

### Phase 1: Create ScriptureContentType

**Goal:** Wrap scripture data in a ContentType interface

**New File:** `src/rendering/content/ScriptureContent.ts`

**Data Model:**
```typescript
export interface ScriptureData {
  metadata: {
    book: string;               // "John"
    chapter: number;            // 3
    verseStart: number;         // 16
    verseEnd?: number;          // 17 (optional for ranges)
    translation: string;        // "NIV", "ESV", "KJV"
    theme?: ScriptureTheme;
  };
  content: {
    verses: Array<{
      number: number;
      text: string;
    }>;
    reference: string;          // "John 3:16-17"
    displayReference?: string;  // "John 3:16-17 (NIV)"
  };
}

export type ScriptureTheme = 'reading' | 'meditation' | 'memory' | 'announcement';

export interface ScriptureSlideSettings {
  showTranslation: boolean;
  emphasizeReference: boolean;
  showVerseNumbers: boolean;
  theme: ScriptureTheme;
  maxVersesPerSlide: number;

  // Typography
  typography: {
    verseFontSize: number;
    referenceFontSize: number;
    translationFontSize: number;
    fontFamily: string;
    verseColor: string;
    referenceColor: string;
    translationColor: string;
    textAlign: 'left' | 'center' | 'right';
    bold: boolean;
    italic: boolean;
    lineHeight: number;
  };

  // Background
  background: BackgroundStyle;
}

export class ScriptureContentType extends BaseContentType<ScriptureData, ScriptureSlideSettings> {
  readonly typeId: ContentTypeId = 'scripture';
  readonly typeName: string = 'Scripture';

  static getCapabilities(): ContentTypeCapabilities {
    return {
      supportsTextEditing: true,        // Can edit verse text
      supportsMedia: false,             // No media in scriptures
      supportsBackgrounds: true,        // Custom backgrounds
      supportsMultipleSlides: true,     // Long passages split across slides
      fullyEditable: true,              // All text is editable
      hasViewOnlyElements: false        // No locked elements
    };
  }

  // Validation
  validate(): ValidationResult {
    const errors: string[] = [];

    if (!this.content.metadata.book) errors.push('Book is required');
    if (this.content.metadata.chapter < 1) errors.push('Invalid chapter number');
    if (this.content.metadata.verseStart < 1) errors.push('Invalid verse number');
    if (this.content.content.verses.length === 0) errors.push('No verses provided');

    return {
      valid: errors.length === 0,
      errors
    };
  }

  // Slide generation
  generateSlides(): GeneratedSlide[] {
    const slides: GeneratedSlide[] = [];
    const versesPerSlide = this.settings.maxVersesPerSlide || 4;

    // Split verses into chunks
    for (let i = 0; i < this.content.content.verses.length; i += versesPerSlide) {
      const verseChunk = this.content.content.verses.slice(i, i + versesPerSlide);
      const slide = this.generateSlideForVerses(verseChunk);
      slides.push(slide);
    }

    return slides;
  }

  private generateSlideForVerses(verses: { number: number; text: string }[]): GeneratedSlide {
    const template = new ScriptureTemplate();

    const combinedText = verses
      .map(v => this.settings.showVerseNumbers ? `${v.number} ${v.text}` : v.text)
      .join('\n\n');

    const shapes = template.generateSlide({
      verse: combinedText,
      reference: this.content.content.reference,
      translation: this.settings.showTranslation ? this.content.metadata.translation : undefined,
      theme: this.settings.theme,
      featureSettings: {
        background: this.settings.background,
        typography: this.settings.typography
      }
    });

    return {
      id: `scripture-${Date.now()}-${Math.random()}`,
      contentId: this.generateContentId(),
      templateId: 'scripture-template',
      shapes,
      metadata: {
        contentType: 'scripture',
        templateId: 'scripture-template',
        editability: {
          locked: false,
          editableShapes: shapes.filter(s => s instanceof TextShape).map(s => s.id),
          nonEditableShapes: []
        }
      }
    };
  }
}
```

**Factory:**
```typescript
class ScriptureFactory implements ContentTypeFactory<ScriptureData, ScriptureSlideSettings> {
  create(data: ScriptureData, settings?: Partial<ScriptureSlideSettings>): ScriptureContentType {
    return new ScriptureContentType(data, settings);
  }

  createEmpty(): ScriptureContentType {
    return new ScriptureContentType({
      metadata: {
        book: 'John',
        chapter: 3,
        verseStart: 16,
        translation: 'NIV',
        theme: 'reading'
      },
      content: {
        verses: [{ number: 16, text: 'For God so loved the world...' }],
        reference: 'John 3:16',
        displayReference: 'John 3:16 (NIV)'
      }
    });
  }

  createFromJSON(json: string | object): ScriptureContentType {
    const data = typeof json === 'string' ? JSON.parse(json) : json;
    return new ScriptureContentType(data.content, data.settings);
  }
}
```

**Helper Functions:**
```typescript
export const ScriptureHelpers = {
  /**
   * Create scripture content from verse lookup
   */
  createFromVerses(
    book: string,
    chapter: number,
    verseStart: number,
    verseEnd: number | undefined,
    translation: string,
    verseTexts: string[]
  ): ScriptureContentType {
    const verses = verseTexts.map((text, i) => ({
      number: verseStart + i,
      text
    }));

    const reference = verseEnd
      ? `${book} ${chapter}:${verseStart}-${verseEnd}`
      : `${book} ${chapter}:${verseStart}`;

    return new ScriptureContentType({
      metadata: { book, chapter, verseStart, verseEnd, translation, theme: 'reading' },
      content: { verses, reference, displayReference: `${reference} (${translation})` }
    });
  },

  /**
   * Parse scripture reference string (e.g., "John 3:16-17 NIV")
   */
  parseReference(refString: string): { book: string; chapter: number; verseStart: number; verseEnd?: number; translation?: string } {
    // Implementation for parsing "John 3:16-17 NIV" format
    // ...
  }
};
```

---

### Phase 2: Create ScriptureEditor Component

**Goal:** Build a specialized editor for scripture content

**New File:** `src/components/editors/ScriptureEditor.tsx`

**Features:**

1. **Verse Lookup Panel** (Left)
   - Book selector (dropdown)
   - Chapter input
   - Verse range inputs (start/end)
   - Translation selector (NIV, ESV, KJV, etc.)
   - "Fetch Verses" button
   - Recently used scriptures list

2. **Content Preview Panel** (Center)
   - Live preview of scripture slide
   - Shows verse text, reference, translation
   - Updates in real-time as settings change
   - Navigation for multiple slides (if passage is split)

3. **Settings Panel** (Right)
   - **Display Options**
     - Show translation checkbox
     - Emphasize reference checkbox
     - Show verse numbers checkbox
     - Theme selector (reading, meditation, memory, announcement)
     - Max verses per slide slider (1-10)

   - **Typography Controls**
     - Verse font size
     - Reference font size
     - Translation font size
     - Font family selector
     - Text alignment (left/center/right)
     - Bold/Italic toggles
     - Line height slider
     - Color pickers:
       - Verse color
       - Reference color
       - Translation color

   - **Background Controls**
     - Background type (color, gradient, image)
     - Color picker / gradient editor
     - Image uploader

**Component Structure:**
```typescript
const ScriptureEditor: React.FC<BaseEditorProps<ScriptureData, ScriptureSlideSettings>> = ({
  content,
  onContentChange,
  onSlidesGenerated,
  readOnly
}) => {
  const [scripture, setScripture] = useState(content);
  const [lookupState, setLookupState] = useState({
    book: scripture.content.metadata.book,
    chapter: scripture.content.metadata.chapter,
    verseStart: scripture.content.metadata.verseStart,
    verseEnd: scripture.content.metadata.verseEnd
  });

  const handleFetchVerses = async () => {
    // Call Bible API to fetch verses
    const verses = await fetchVerses(lookupState);

    // Update content
    const updated = ScriptureHelpers.createFromVerses(
      lookupState.book,
      lookupState.chapter,
      lookupState.verseStart,
      lookupState.verseEnd,
      scripture.content.metadata.translation,
      verses
    );

    setScripture(updated);
    onContentChange(updated);
  };

  return (
    <EditorProvider content={scripture} onContentChange={onContentChange}>
      <EditorToolbar
        title="Scripture Editor"
        subtitle={scripture.content.content.reference}
        actions={[
          { id: 'save', label: 'Save', icon: <SaveIcon />, variant: 'primary' },
          { id: 'cancel', label: 'Cancel', icon: <XIcon />, variant: 'secondary' }
        ]}
      />

      <div className="flex h-full">
        {/* Left Panel: Verse Lookup */}
        <EditorPanelContainer title="Verse Lookup" icon={<BookOpenIcon />}>
          <VerseLookupPanel
            book={lookupState.book}
            chapter={lookupState.chapter}
            verseStart={lookupState.verseStart}
            verseEnd={lookupState.verseEnd}
            translation={scripture.content.metadata.translation}
            onLookupChange={setLookupState}
            onFetch={handleFetchVerses}
          />
        </EditorPanelContainer>

        {/* Center Panel: Live Preview */}
        <div className="flex-1 p-4">
          <ScriptureLivePreview content={scripture} />
        </div>

        {/* Right Panel: Settings */}
        <EditorPanelContainer title="Settings" icon={<SettingsIcon />}>
          <ScriptureSettingsPanel
            settings={scripture.settings}
            onSettingsChange={(newSettings) => {
              scripture.updateSettings(newSettings);
              onContentChange(scripture.clone());
            }}
          />
        </EditorPanelContainer>
      </div>
    </EditorProvider>
  );
};
```

---

### Phase 3: Register with Content Type System

**File:** `src/rendering/content/ContentTypeRegistry.ts`

```typescript
import { ScriptureContentType, ScriptureFactory } from './ScriptureContent';

// Register scripture content type
contentTypeRegistry.register({
  typeId: 'scripture',
  typeName: 'Scripture',
  description: 'Bible verses and passages',
  icon: 'book-open',
  factory: new ScriptureFactory(),
  capabilities: ScriptureContentType.getCapabilities()
});
```

**File:** `src/components/editors/index.tsx`

```typescript
import { ScriptureEditor } from './ScriptureEditor';
import { editorRegistry } from './EditorFactory';

// Register scripture editor
editorRegistry.register({
  contentTypeId: 'scripture',
  name: 'Scripture Editor',
  component: ScriptureEditor,
  supportsLivePreview: true,
  hasSettingsPanel: true
});
```

---

### Phase 4: Integration with Existing Features

**Bible Verse Lookup Integration**

The app already has Bible verse data in `src/database/json/*.json`. Integrate this:

```typescript
// src/hooks/useBibleLookup.ts
export const useBibleLookup = () => {
  const fetchVerses = async (
    book: string,
    chapter: number,
    verseStart: number,
    verseEnd: number | undefined,
    translation: string
  ): Promise<string[]> => {
    // Use existing Bible data from database/json
    const bibleData = await loadBibleData(translation);
    const verses = extractVerses(bibleData, book, chapter, verseStart, verseEnd);
    return verses;
  };

  return { fetchVerses };
};
```

**Add to Service Items**

Update service item creation to support scripture content type:

```typescript
// When user adds scripture to service
const scriptureContent = ScriptureHelpers.createFromVerses(...);
const slides = scriptureContent.generateSlides();

await db.serviceItem.create({
  type: 'scripture',
  title: scriptureContent.content.content.reference,
  content: JSON.stringify(scriptureContent.toJSON()),
  slides: JSON.stringify(slides)
});
```

---

### Phase 5: Migration Path

**Option 1: Gradual Migration**
- Keep existing ScriptureTemplate working
- Add new ScriptureContentType alongside
- Let users choose which system to use
- Migrate existing scripture items on-demand

**Option 2: Full Migration**
- Convert all existing scripture slides to new format
- Update all references to use ScriptureContentType
- Remove old ScriptureTemplate (or mark deprecated)

**Recommended:** Option 1 for safety

---

## Benefits of This Approach

### For Users

1. **Easier Editing**: Dedicated scripture editor with live preview
2. **Verse Lookup**: Built-in Bible verse search and fetch
3. **Customization**: Fine-grained control over typography and layout
4. **Consistency**: Same editing experience as songs, media, announcements
5. **Recent Scriptures**: Quick access to recently used verses

### For Developers

1. **Type Safety**: TypeScript ensures valid scripture data
2. **Validation**: Catches errors before rendering
3. **Extensibility**: Easy to add new features (e.g., parallel translations)
4. **Testability**: Content type can be tested independently
5. **Separation of Concerns**: Data model separated from rendering

---

## Implementation Checklist

- [ ] Phase 1: Create ScriptureContentType
  - [ ] Create `src/rendering/content/ScriptureContent.ts`
  - [ ] Implement ScriptureContentType class
  - [ ] Implement ScriptureFactory
  - [ ] Add ScriptureHelpers utility functions
  - [ ] Write unit tests

- [ ] Phase 2: Create ScriptureEditor
  - [ ] Create `src/components/editors/ScriptureEditor.tsx`
  - [ ] Build VerseLookupPanel component
  - [ ] Build ScriptureSettingsPanel component
  - [ ] Build ScriptureLivePreview component
  - [ ] Integrate with EditorProvider

- [ ] Phase 3: Register with System
  - [ ] Register ScriptureContentType in registry
  - [ ] Register ScriptureEditor in editor factory
  - [ ] Add scripture to ContentTypeHelpers
  - [ ] Export from index files

- [ ] Phase 4: Integration
  - [ ] Create useBibleLookup hook
  - [ ] Integrate Bible JSON data
  - [ ] Update service item creation
  - [ ] Add scripture to "Add Content" menu
  - [ ] Update LiveDisplayManager to handle scripture

- [ ] Phase 5: Testing
  - [ ] Test verse lookup functionality
  - [ ] Test slide generation with various verse ranges
  - [ ] Test typography and background customization
  - [ ] Test multi-slide splitting for long passages
  - [ ] Test live display rendering

---

## Future Enhancements

1. **Parallel Translations**: Show multiple translations side-by-side
2. **Cross References**: Link to related verses
3. **Commentary Integration**: Add study notes
4. **Highlighting**: Mark key words or phrases
5. **Memorization Mode**: Progressive reveal for memory verses
6. **Search**: Full-text search across all books
7. **Favorites**: Save frequently used verses
8. **Smart Splitting**: Intelligent verse splitting at sentence boundaries

---

## Timeline Estimate

- Phase 1: 4-6 hours
- Phase 2: 6-8 hours
- Phase 3: 1-2 hours
- Phase 4: 3-4 hours
- Phase 5: 2-3 hours

**Total:** ~16-23 hours of development time

---

## Success Criteria

1. ✅ ScriptureContentType validates and generates slides correctly
2. ✅ ScriptureEditor provides intuitive UI for verse lookup
3. ✅ Live preview updates in real-time
4. ✅ Typography and background settings work as expected
5. ✅ Long passages split across multiple slides correctly
6. ✅ Integration with existing Bible data works
7. ✅ Slides render correctly in live display
8. ✅ Content can be saved and loaded from database
