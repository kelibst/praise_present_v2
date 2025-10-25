/**
 * Content Type System
 *
 * This module provides a unified type-safe system for managing different
 * presentation content types (songs, media, announcements, etc.)
 *
 * Key concepts:
 * - ContentType: Base interface for all content types
 * - ContentTypeFactory: Factory pattern for creating content instances
 * - ContentTypeRegistry: Central registry for all content types
 * - Specialized content types: SongContentType, MediaContentType, AnnouncementContentType
 *
 * Usage:
 * ```typescript
 * import { contentTypeRegistry, ContentTypeHelpers } from '@/rendering/content';
 *
 * // Create a song
 * const song = ContentTypeHelpers.createSong({
 *   metadata: { title: 'Amazing Grace' },
 *   sections: [...]
 * });
 *
 * // Generate slides
 * const slides = song.generateSlides();
 *
 * // Serialize for storage
 * const json = song.toJSON();
 * ```
 */

// Base types and interfaces
export type {
  ContentType,
  ContentTypeFactory,
  ContentTypeId,
  ValidationResult,
  SlideMetadata,
  GeneratedSlide,
  ContentTypeCapabilities
} from './ContentType';

export { BaseContentType } from './ContentType';

// Scripture content
export type {
  ScriptureTheme,
  ScriptureMetadata,
  VerseData,
  ScriptureContent,
  ScriptureData,
  ScriptureSlideSettings
} from './ScriptureContent';

export { ScriptureContentType, ScriptureFactory, ScriptureHelpers } from './ScriptureContent';

// Song content
export type {
  SongSection,
  SongMetadata,
  SongSlideSettings,
  SongData
} from './SongContent';

export { SongContentType } from './SongContent';

// Media content
export type {
  MediaType,
  MediaTransform,
  VideoPlaybackSettings,
  MediaOverlay,
  MediaMetadata,
  MediaSlideSettings,
  MediaData
} from './MediaContent';

export { MediaContentType } from './MediaContent';

// Announcement content
export type {
  AnnouncementType,
  AnnouncementUrgency,
  EventDetails,
  AnnouncementMetadata,
  AnnouncementSlideSettings,
  AnnouncementData
} from './AnnouncementContent';

export { AnnouncementContentType } from './AnnouncementContent';

// Registry
export { ContentTypeRegistry, contentTypeRegistry, ContentTypeHelpers } from './ContentTypeRegistry';
