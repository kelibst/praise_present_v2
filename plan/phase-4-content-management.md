# Phase 4: Content Management - Database Integration

**Duration**: Weeks 7-8
**Status**: Planning
**Dependencies**: Phase 1 (Foundation), Phase 2 (Templates), Phase 3 (Live Display)

## Overview

Integrate the rendering engine with the existing Prisma database models to create a seamless bridge between content management and live presentation. This phase enables dynamic content transformation, real-time updates, and intelligent content preparation for church services.

## Goals

- Connect rendering engine to Prisma database models
- Implement dynamic content-to-slide transformation
- Enable real-time content updates during presentations
- Build intelligent content preparation and caching
- Create service planning integration

## Architecture Components

### Content Integration

#### `ContentAdapter`
```typescript
class ContentAdapter {
  private prisma: PrismaClient
  private templateManager: TemplateManager

  async generateSlides(content: ContentModel): Promise<Slide[]>
  async updateSlideContent(slideId: string, content: ContentModel): Promise<void>
  subscribeToContentChanges(callback: ContentChangeCallback): void
}
```

#### `SlideGenerator`
- Automatic slide creation from database content
- Template selection and application
- Content validation and formatting
- Batch processing optimization

#### `ContentTransformer`
- Database model to presentation data conversion
- Rich text processing and formatting
- Media asset resolution and loading
- Metadata extraction and organization

### Database Integration

#### `SongAdapter`
- Convert Song models to presentation slides
- Handle verse/chorus/bridge structures
- Process chord charts and formatting
- Manage copyright and CCLI information

#### `ScriptureAdapter`
- Transform Bible verses to presentation slides
- Handle multiple translations and versions
- Process passage ranges and formatting
- Integrate cross-references and notes

#### `ServiceAdapter`
- Convert Service models to presentation sequences
- Handle service item ordering and timing
- Process announcements and media
- Manage service flow and transitions

### Real-Time Updates

#### `ContentWatcher`
- Monitor database changes
- Trigger slide regeneration
- Handle live content updates
- Manage update queuing and priorities

#### `LiveContentManager`
- Real-time slide content updates
- Emergency content injection
- Dynamic service modifications
- Content rollback capabilities

## Implementation Tasks

### Week 7: Database Integration Foundation

**Day 1-2: Content Adapters**
- [ ] Implement base `ContentAdapter` class
- [ ] Create `SongAdapter` for song content transformation
- [ ] Build `ScriptureAdapter` for Bible verse processing
- [ ] Set up content validation framework

**Day 3-4: Slide Generation**
- [ ] Create `SlideGenerator` with template integration
- [ ] Implement batch slide generation
- [ ] Build content-template matching logic
- [ ] Add slide caching and optimization

**Day 5: Content Transformation**
- [ ] Implement rich text processing
- [ ] Create media asset resolution
- [ ] Build metadata extraction
- [ ] Add content format validation

### Week 8: Real-Time Features

**Day 1-2: Live Updates**
- [ ] Implement `ContentWatcher` with database monitoring
- [ ] Create real-time slide regeneration
- [ ] Build update queuing system
- [ ] Add change notification pipeline

**Day 3-4: Service Integration**
- [ ] Create `ServiceAdapter` for service planning
- [ ] Implement service flow management
- [ ] Build announcement and media integration
- [ ] Add service timing and scheduling

**Day 5: Advanced Features**
- [ ] Implement emergency content injection
- [ ] Create content rollback system
- [ ] Build service modification tools
- [ ] Add comprehensive integration testing

## Content Model Integration

### Song Content Processing

#### Database Schema Integration
```typescript
// Existing Prisma Song model
model Song {
  id: string
  title: string
  artist: string
  lyrics: string
  chords: string?
  ccliNumber: string?
  // ... other fields
}

// Generated slide content
interface SongSlideContent {
  titleSlide: SlideData
  verseSlides: SlideData[]
  chorusSlides: SlideData[]
  copyrightSlide: SlideData
}
```

#### Processing Pipeline
1. Parse lyrics structure (verses, chorus, bridge)
2. Apply song template based on content type
3. Generate individual slides with proper formatting
4. Include chord overlays if present
5. Add copyright and CCLI information

### Scripture Content Processing

#### Bible Verse Integration
```typescript
// Existing Prisma models
model Book { /* ... */ }
model Verse { /* ... */ }
model Translation { /* ... */ }

// Generated scripture slides
interface ScriptureSlideContent {
  referenceSlide?: SlideData
  verseSlides: SlideData[]
  translationInfo: SlideData
}
```

#### Processing Features
- Automatic verse splitting for readability
- Multiple translation support
- Reference formatting and citation
- Cross-reference link handling

### Service Content Integration

#### Service Planning
```typescript
// Service model integration
model Service {
  id: string
  name: string
  date: DateTime
  serviceItems: ServiceItem[]
  // ... other fields
}

// Generated service presentation
interface ServicePresentation {
  welcomeSlides: SlideData[]
  serviceItemSlides: Map<string, SlideData[]>
  announcementSlides: SlideData[]
  dismissalSlides: SlideData[]
}
```

## Content Update Mechanisms

### Real-Time Content Changes

#### Live Update Pipeline
1. Database change detection
2. Affected slide identification
3. Background slide regeneration
4. Live display synchronization
5. Operator notification

#### Update Types
- **Content Updates**: Text, media, formatting changes
- **Structure Updates**: Service order, item additions/removals
- **Emergency Updates**: Last-minute announcements, changes

### Caching Strategy

#### Multi-Level Caching
1. **Database Query Cache**: Frequently accessed content
2. **Generated Slide Cache**: Rendered slide data
3. **Template Cache**: Compiled template instances
4. **Asset Cache**: Images, media, and resources

#### Cache Invalidation
- Content-based cache keys
- Selective invalidation on updates
- Background cache warming
- Memory management and cleanup

## Performance Requirements

### Content Processing
- Song-to-slides generation: <500ms for typical song
- Scripture passage processing: <200ms per passage
- Service presentation generation: <2s for full service
- Real-time content updates: <100ms propagation

### Database Integration
- Efficient query optimization
- Connection pooling and management
- Background processing for non-critical updates
- Graceful degradation on database issues

### Memory Management
- Efficient content caching
- Automatic cleanup of unused slides
- Memory usage monitoring
- Resource limit enforcement

## Success Criteria

- [ ] Seamless integration with all existing Prisma models
- [ ] Real-time content updates without presentation interruption
- [ ] Efficient content processing meeting performance targets
- [ ] Robust error handling for database and content issues
- [ ] Comprehensive content validation and formatting
- [ ] Smooth service planning to presentation workflow

## Error Handling

### Content Issues
- Malformed content graceful handling
- Missing asset fallback mechanisms
- Content validation error reporting
- Automatic content correction suggestions

### Database Issues
- Connection loss recovery
- Query timeout handling
- Data consistency validation
- Offline mode capabilities

## Deliverables

1. **Content Adapters** (`src/rendering/content/`)
   - `ContentAdapter.tsx`
   - `SongAdapter.tsx`
   - `ScriptureAdapter.tsx`
   - `ServiceAdapter.tsx`

2. **Content Processing** (`src/rendering/processing/`)
   - `SlideGenerator.tsx`
   - `ContentTransformer.tsx`
   - `ContentValidator.tsx`
   - `AssetResolver.tsx`

3. **Real-Time System** (`src/rendering/realtime/`)
   - `ContentWatcher.tsx`
   - `LiveContentManager.tsx`
   - `UpdateQueue.tsx`
   - `ChangeNotifier.tsx`

4. **Cache Management** (`src/rendering/cache/`)
   - `ContentCache.tsx`
   - `SlideCache.tsx`
   - `AssetCache.tsx`
   - `CacheManager.tsx`

## Phase 4 Exit Criteria

Before proceeding to Phase 5:
- [ ] All database models integrated with rendering engine
- [ ] Real-time content updates functional and tested
- [ ] Content processing performance meets requirements
- [ ] Comprehensive error handling implemented
- [ ] Service planning workflow complete
- [ ] Cache system optimized and validated
- [ ] Integration testing passed with real church data

## Next Phase Preview

Phase 5 will focus on performance optimization, advanced caching strategies, and visual effects to create a production-ready system that can handle the demands of live church presentations with professional polish and reliability.