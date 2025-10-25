# Content Type System

The Content Type System provides a unified, type-safe architecture for managing different presentation content types in PraisePresent. It separates content data from rendering logic and provides a flexible foundation for editing and displaying songs, media, announcements, and more.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    ContentTypeRegistry                       │
│  - Manages all content type factories                       │
│  - Creates content instances                                │
│  - Deserializes JSON to content                             │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ registers
                            ▼
┌──────────────────┬──────────────────┬──────────────────────┐
│  SongContentType │ MediaContentType │ AnnouncementContent  │
│                  │                  │                      │
│  - Lyrics        │  - Image/Video   │  - Event details     │
│  - Sections      │  - Overlays      │  - Call-to-action    │
│  - Chords        │  - Filters       │  - Urgency levels    │
└──────────────────┴──────────────────┴──────────────────────┘
                            │
                            │ generates
                            ▼
                    ┌───────────────┐
                    │ GeneratedSlide│
                    │  - Shapes     │
                    │  - Background │
                    │  - Metadata   │
                    └───────────────┘
```

## Key Concepts

### 1. Content vs. Rendering Separation

**Content** represents the data (lyrics, images, text), while **Rendering** handles how it appears on screen.

- **Content Layer**: `SongData`, `MediaData`, `AnnouncementData`
- **Rendering Layer**: `Shape[]`, `BackgroundStyle`, `GeneratedSlide`

This separation allows:
- Content to be edited without affecting rendering
- Templates to be changed without modifying content
- Same content rendered differently across services

### 2. Type Safety

Every content type is strongly typed:

```typescript
// ✅ Type-safe content creation
const song: SongContentType = ContentTypeHelpers.createSong({
  metadata: { title: 'Amazing Grace' },
  sections: [
    { id: 'v1', type: 'verse', number: 1, lyrics: '...' }
  ]
});

// ✅ Compile-time validation
song.content.metadata.title; // string
song.content.sections[0].lyrics; // string

// ❌ TypeScript error - invalid property
song.content.metadata.invalidProp; // Error!
```

### 3. Content Type Capabilities

Each content type declares its capabilities:

```typescript
{
  supportsTextEditing: boolean;      // Can edit text?
  supportsMedia: boolean;             // Can embed media?
  supportsBackgrounds: boolean;       // Custom backgrounds?
  supportsMultipleSlides: boolean;   // Generate multiple slides?
  fullyEditable: boolean;             // All shapes editable?
  hasViewOnlyElements: boolean;       // Has non-editable elements?
}
```

This drives UI behavior - showing/hiding editing tools based on content type.

## Content Types

### SongContentType

**Purpose**: Worship songs with lyrics, sections, and chords.

**Data Structure**:
```typescript
{
  metadata: {
    title: string;
    artist?: string;
    author?: string;
    copyright?: string;
    ccliNumber?: string;
    key?: string;
    tempo?: number;
  },
  sections: Array<{
    id: string;
    type: 'verse' | 'chorus' | 'bridge' | ...;
    number?: number;
    lyrics: string;
    chords?: string;
  }>,
  arrangement?: string[];  // Section IDs in order
}
```

**Slide Generation**:
- Title slide (optional)
- One slide per section (or split if too long)
- End slide (optional)
- Applies `maxLinesPerSlide` setting

**Editability**: Fully editable - all text shapes can be modified

**Example**:
```typescript
const song = ContentTypeHelpers.createSong({
  metadata: {
    title: 'Amazing Grace',
    author: 'John Newton',
    key: 'G',
    ccliNumber: '22025'
  },
  sections: [
    {
      id: 'v1',
      type: 'verse',
      number: 1,
      lyrics: 'Amazing grace how sweet the sound\nThat saved a wretch like me'
    },
    {
      id: 'chorus',
      type: 'chorus',
      lyrics: 'My chains are gone\nI\'ve been set free'
    }
  ]
});

const slides = song.generateSlides(); // 3 slides: title, verse, chorus
```

### MediaContentType

**Purpose**: Images and videos with optional text overlays.

**Data Structure**:
```typescript
{
  metadata: {
    title: string;
    description?: string;
    duration?: number;     // For videos
  },
  settings: {
    mediaType: 'image' | 'video';
    mediaUrl: string;
    transform: {
      crop?: { x, y, width, height };  // Crop region
      position?: { x, y };
      size?: { width, height };
      objectFit?: 'cover' | 'contain' | ...;
    },
    videoSettings?: {
      startTime?: number;
      endTime?: number;
      loop?: boolean;
      playbackRate?: number;
    },
    overlays?: Array<{
      id: string;
      text: string;
      position: { x, y };
      style: { fontSize, color, ... };
    }>,
    filters?: {
      brightness?: number;  // 0-200
      contrast?: number;
      saturation?: number;
      blur?: number;
    }
  }
}
```

**Slide Generation**:
- Single slide with media as background
- Overlays rendered as TextShapes on top
- Filters applied to media shape

**Editability**:
- Media itself is NOT editable (it's a binary file)
- Overlay text IS editable
- Transform/filters are adjustable (position, crop, filters)

**Example**:
```typescript
const media = ContentTypeHelpers.createMedia({
  metadata: {
    title: 'Church Building',
    description: 'Main sanctuary photo'
  },
  settings: {
    mediaType: 'image',
    mediaUrl: '/media/church.jpg',
    transform: {
      objectFit: 'cover'
    },
    overlays: [
      {
        id: 'title',
        text: 'Welcome Home',
        position: { x: 960, y: 200 },
        size: { width: 800, height: 100 },
        style: {
          fontSize: 72,
          fontFamily: 'Arial',
          color: '#ffffff',
          shadow: true
        }
      }
    ],
    filters: {
      brightness: 90,  // Slightly darker for text readability
      contrast: 110
    }
  }
});
```

### AnnouncementContentType

**Purpose**: Church events, reminders, and announcements.

**Data Structure**:
```typescript
{
  metadata: {
    title: string;
    type: 'event' | 'announcement' | 'reminder' | 'welcome' | 'celebration';
    urgency: 'low' | 'medium' | 'high';
    validUntil?: Date;  // Expiration date
  },
  message: string;
  details?: string;
  eventDetails?: {
    date?: string;
    time?: string;
    location?: string;
    contact?: string;
  },
  callToAction?: string;
}
```

**Slide Generation**:
- Single slide with all information
- Uses `AnnouncementTemplate` for layout
- Urgency affects colors (high = red, medium = orange)

**Editability**: Fully editable - all text shapes can be modified

**Example**:
```typescript
const announcement = AnnouncementContentType.createEventAnnouncement(
  'Youth Group Meeting',
  'Join us for games, worship, and fellowship!',
  {
    date: 'Friday, March 15th',
    time: '7:00 PM - 9:00 PM',
    location: 'Youth Center',
    contact: 'Pastor John (555-1234)'
  },
  {
    background: { type: 'color', value: '#1a1a2e' },
    typography: {
      titleFontSize: 72,
      messageFontSize: 48,
      detailsFontSize: 36,
      fontFamily: 'Arial',
      titleColor: '#f39c12',
      messageColor: '#ffffff',
      detailsColor: '#cbd5e0'
    }
  }
);
```

## Content Type Registry

The `ContentTypeRegistry` is the central hub for all content types.

### Registration

```typescript
import { contentTypeRegistry } from '@/rendering/content';

// Get all registered types
const types = contentTypeRegistry.getAllRegistrations();
// [{ typeId: 'song', ... }, { typeId: 'media', ... }, ...]

// Check if type exists
contentTypeRegistry.has('song'); // true

// Get capabilities
const caps = contentTypeRegistry.getCapabilities('song');
// { supportsTextEditing: true, ... }
```

### Creating Content

```typescript
// Method 1: Using helpers (recommended)
import { ContentTypeHelpers } from '@/rendering/content';

const song = ContentTypeHelpers.createSong({ ... });
const media = ContentTypeHelpers.createMedia({ ... });

// Method 2: Using registry directly
const announcement = contentTypeRegistry.create('announcement', {
  metadata: { title: 'Test', type: 'event', urgency: 'low' },
  message: 'Hello'
});

// Method 3: Using factory
const factory = contentTypeRegistry.getFactory('song');
const emptySong = factory.createEmpty();
```

### Deserialization

```typescript
// From JSON string
const json = '{"typeId":"song","content":{...},"settings":{...}}';
const song = contentTypeRegistry.fromJSON(json);

// From object
const data = { typeId: 'media', content: {...}, settings: {...} };
const media = contentTypeRegistry.fromJSON(data);

// Using helpers
const content = ContentTypeHelpers.loadFromJSON(json);
```

## Slide Metadata

Every generated slide includes metadata:

```typescript
{
  contentType: 'song' | 'media' | 'announcement' | ...;
  templateId?: string;
  editability: {
    locked: boolean;
    editableShapes: string[];     // Shape IDs that can be edited
    nonEditableShapes: string[];  // Shape IDs that are view-only
  };
  customOverrides?: Array<{
    placeholderId: string;
    position?: { x, y };
    size?: { width, height };
    style?: any;
  }>;
}
```

This metadata:
- **Identifies content type** - UI knows how to handle the slide
- **Controls editability** - Which shapes can be edited
- **Tracks customizations** - User-specific template overrides
- **Enables regeneration** - Can recreate slides from template

## Usage Patterns

### Pattern 1: Create and Render

```typescript
// 1. Create content
const song = ContentTypeHelpers.createSong({
  metadata: { title: 'My Song' },
  sections: [...]
});

// 2. Validate
const validation = song.validate();
if (!validation.valid) {
  console.error(validation.errors);
}

// 3. Generate slides
const slides = song.generateSlides();

// 4. Render slides
slides.forEach(slide => {
  // Pass to SlideRenderer component
  <SlideRenderer slide={slide} />
});
```

### Pattern 2: Store and Retrieve

```typescript
// Serialize for database
const json = song.toJSON();
await db.serviceItem.create({
  type: 'song',
  content: JSON.stringify(json),
  slides: JSON.stringify(slides)
});

// Deserialize from database
const item = await db.serviceItem.findUnique({ where: { id } });
const song = ContentTypeHelpers.loadFromJSON(item.content);
const slides = song.generateSlides();
```

### Pattern 3: Dynamic Content Type UI

```typescript
// Get available types for "Add Content" menu
const availableTypes = ContentTypeHelpers.getAvailableTypes();

availableTypes.forEach(type => {
  console.log(type.typeName);  // "Song", "Media", "Announcement"
  console.log(type.icon);      // "music", "image", "megaphone"

  // Show/hide features based on capabilities
  if (type.capabilities.supportsTextEditing) {
    showTextEditor();
  }
  if (type.capabilities.supportsMedia) {
    showMediaUploader();
  }
});
```

### Pattern 4: Capability-Based Features

```typescript
// Check if content type supports a feature
if (ContentTypeHelpers.supportsFeature('media', 'supportsMedia')) {
  // Show media cropping tools
}

// Get all types that support multiple slides
const multiSlideTypes = contentTypeRegistry.getTypesByCapability('supportsMultipleSlides');
// Returns: [SongContentType registration]
```

## Extending the System

### Adding a New Content Type

1. **Create content interface**:
```typescript
// ScriptureContent.ts
export interface ScriptureData {
  metadata: { book: string; chapter: number; verses: string };
  text: string;
  translation: string;
}
```

2. **Implement ContentType**:
```typescript
export class ScriptureContentType extends BaseContentType<ScriptureData, ScriptureSettings> {
  readonly typeId = 'scripture';
  readonly typeName = 'Scripture';
  // ... implement required methods
}
```

3. **Create factory**:
```typescript
class ScriptureFactory implements ContentTypeFactory<ScriptureData, ScriptureSettings> {
  create(data) { return new ScriptureContentType(data); }
  // ... implement factory methods
}
```

4. **Register**:
```typescript
contentTypeRegistry.register({
  typeId: 'scripture',
  typeName: 'Scripture',
  description: 'Bible verses and passages',
  icon: 'book-open',
  factory: new ScriptureFactory(),
  capabilities: ScriptureContentType.getCapabilities()
});
```

## Best Practices

1. **Always use ContentTypeHelpers** for common operations
2. **Validate content** before generating slides
3. **Store both content AND slides** in database for performance
4. **Use metadata** to track editability and customizations
5. **Respect capabilities** when building UI features
6. **Clone before modifying** to avoid mutations

## Integration with Existing Systems

### With Database (Prisma)

```typescript
// ServiceItem.slides stores GeneratedSlide[]
// ServiceItem.content stores ContentType.toJSON()

const item = await prisma.serviceItem.create({
  data: {
    type: 'song',
    title: song.content.metadata.title,
    content: JSON.stringify(song.toJSON()),
    slides: JSON.stringify(song.generateSlides())
  }
});
```

### With Templates

Content types use templates for slide generation:

```typescript
const template = new SongTemplate({ width: 1920, height: 1080 });
const song = new SongContentType(data, settings, template);

// Template generates shapes, content provides data
const slides = song.generateSlides();
```

### With Editors

Editors receive content type and generate UI accordingly:

```typescript
<ContentEditor
  contentType={song}
  onUpdate={(updated) => {
    song.content = updated.content;
    song.settings = updated.settings;
    regenerateSlides();
  }}
/>
```

## Future Enhancements

- [ ] Scripture content type
- [ ] Custom content type (freeform slides)
- [ ] Content type plugins/extensions
- [ ] Template override UI
- [ ] Content versioning and history
- [ ] AI-assisted content generation

## Summary

The Content Type System provides:
- **Type safety** for all presentation content
- **Separation** between data and rendering
- **Extensibility** for new content types
- **Flexibility** with capabilities and settings
- **Consistency** through centralized registry

This foundation enables powerful editing features while maintaining code quality and developer experience.
