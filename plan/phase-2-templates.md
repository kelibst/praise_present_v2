# Phase 2: Templates - Slide Master System

**Duration**: Weeks 3-4
**Status**: Planning
**Dependencies**: Phase 1 (Foundation)

## Overview

Build a comprehensive template system inspired by PowerPoint's Slide Masters. This phase creates reusable, themeable layouts for different church content types, enabling consistent presentation styling and rapid content generation.

## Goals

- Implement slide master template system
- Create church-specific content templates
- Build template inheritance hierarchy
- Enable dynamic theme switching
- Establish content-template binding

## Architecture Components

### Template System Core

#### `SlideTemplate` (Base Class)
```typescript
abstract class SlideTemplate {
  id: string
  name: string
  theme: Theme
  layout: LayoutDefinition
  placeholders: Map<string, PlaceholderShape>

  abstract generateSlide(content: ContentData): Slide
  abstract validateContent(content: ContentData): ValidationResult
  applyTheme(theme: Theme): void
}
```

#### `TemplateManager`
- Template registration and discovery
- Theme management and switching
- Template inheritance resolution
- Content-template matching

#### `Theme`
- Color schemes and typography
- Background styles and branding
- Animation and transition settings
- Church-specific customizations

### Church Content Templates

#### `SongTemplate`
- Title slide layout
- Verse and chorus layouts
- Bridge and tag variations
- Copyright and CCLI display

#### `ScriptureTemplate`
- Bible reference formatting
- Verse text layouts
- Multiple translation support
- Reference citation styles

#### `AnnouncementTemplate`
- Title and content layouts
- Image and text combinations
- Call-to-action designs
- Event information displays

#### `ServiceTemplate`
- Order of service layouts
- Welcome and dismissal slides
- Offering and prayer slides
- Pastor and staff introductions

## Implementation Tasks

### Week 3: Template Foundation

**Day 1-2: Template System Core**
- [ ] Implement `SlideTemplate` base class
- [ ] Create `TemplateManager` for template registration
- [ ] Build placeholder system for content slots
- [ ] Implement template validation framework

**Day 3-4: Theme System**
- [ ] Create `Theme` class with color and typography
- [ ] Implement theme inheritance and override system
- [ ] Build theme switcher for live theme changes
- [ ] Add church branding customization hooks

**Day 5: Layout Engine**
- [ ] Implement responsive layout system
- [ ] Create alignment and distribution tools
- [ ] Add automatic text sizing and fitting
- [ ] Build shape group management

### Week 4: Church Templates

**Day 1-2: Song Templates**
- [ ] Create `SongTemplate` with title slide layout
- [ ] Implement verse/chorus differentiation
- [ ] Add chord chart overlay support
- [ ] Include copyright and CCLI integration

**Day 3-4: Scripture and Announcement Templates**
- [ ] Build `ScriptureTemplate` with reference formatting
- [ ] Create multiple verse layout options
- [ ] Implement `AnnouncementTemplate` variations
- [ ] Add image placeholder and text flow

**Day 5: Integration and Testing**
- [ ] Connect templates to existing Prisma content models
- [ ] Create template preview and selection interface
- [ ] Implement content-template auto-matching
- [ ] Build comprehensive template test suite

## Template Specifications

### Song Template Layouts

#### Title Slide
- Church logo (top/corner)
- Song title (large, centered)
- Artist/songwriter (smaller, below title)
- CCLI number (bottom corner)
- Background image/gradient

#### Verse/Chorus Slide
- Lyrics (large, centered, auto-sized)
- Slide number indicator
- Optional chord symbols
- Consistent background treatment

#### Copyright Slide
- Song copyright information
- CCLI license number
- Church streaming license info
- Minimal, readable layout

### Scripture Template Layouts

#### Single Verse
- Bible reference (top or bottom)
- Verse text (large, centered)
- Translation identifier
- Optional cross-references

#### Multiple Verses
- Passage reference
- Verse numbers with text
- Automatic line breaking
- Reading emphasis options

#### Verse Comparison
- Side-by-side translation display
- Version labels
- Synchronized scrolling
- Difference highlighting

### Announcement Template Layouts

#### Text-Only
- Title (large, prominent)
- Body text (readable size)
- Date/time information
- Contact details

#### Image + Text
- Featured image (left/right/background)
- Title overlay or adjacent
- Descriptive text
- Call-to-action emphasis

#### Event Information
- Event title and subtitle
- Date, time, location
- Registration/contact info
- Visual hierarchy for scanning

## Success Criteria

- [ ] All church content types have professional templates
- [ ] Themes can be switched dynamically across all templates
- [ ] Content automatically fits within template constraints
- [ ] Templates are extensible for church customization
- [ ] Template rendering performance <50ms per slide

## Technical Requirements

### Template Performance
- Template compilation <100ms
- Content binding <50ms per slide
- Theme switching <200ms globally
- Memory efficient template caching

### Customization Support
- CSS-like theme overrides
- Custom placeholder definitions
- Brand asset integration
- Layout constraint modifications

### Content Integration
- Automatic content type detection
- Prisma model field mapping
- Validation and error handling
- Preview generation

## Deliverables

1. **Template Engine** (`src/rendering/templates/`)
   - `SlideTemplate.tsx`
   - `TemplateManager.tsx`
   - `Theme.tsx`
   - `LayoutEngine.tsx`

2. **Church Templates** (`src/rendering/templates/church/`)
   - `SongTemplate.tsx`
   - `ScriptureTemplate.tsx`
   - `AnnouncementTemplate.tsx`
   - `ServiceTemplate.tsx`

3. **Theme System** (`src/rendering/themes/`)
   - `DefaultTheme.tsx`
   - `ChurchTheme.tsx`
   - `ThemeManager.tsx`
   - `ThemeCustomizer.tsx`

4. **Template Components** (`src/rendering/components/`)
   - `PlaceholderShape.tsx`
   - `TemplatePreview.tsx`
   - `ThemeSwitcher.tsx`
   - `ContentBinder.tsx`

## Phase 2 Exit Criteria

Before proceeding to Phase 3:
- [ ] All core church templates implemented
- [ ] Theme system fully functional
- [ ] Template inheritance working correctly
- [ ] Content-template binding operational
- [ ] Performance benchmarks achieved
- [ ] Template customization interface ready
- [ ] Comprehensive test coverage completed

## Next Phase Preview

Phase 3 will implement the multi-display live presentation system, using the templates created here to render content simultaneously on operator and live displays with synchronized state management and real-time controls.