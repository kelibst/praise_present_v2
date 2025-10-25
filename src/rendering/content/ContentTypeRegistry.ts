import {
  ContentType,
  ContentTypeFactory,
  ContentTypeId,
  ContentTypeCapabilities
} from './ContentType';
import { SongContentType, SongData, SongSlideSettings } from './SongContent';
import { MediaContentType, MediaData, MediaSlideSettings } from './MediaContent';
import {
  AnnouncementContentType,
  AnnouncementData,
  AnnouncementSlideSettings
} from './AnnouncementContent';
import {
  ScriptureContentType,
  ScriptureData,
  ScriptureSlideSettings,
  ScriptureFactory
} from './ScriptureContent';

/**
 * Content type registration information
 */
interface ContentTypeRegistration<TContent = any, TSettings = any> {
  typeId: ContentTypeId;
  typeName: string;
  description: string;
  icon: string;
  factory: ContentTypeFactory<TContent, TSettings>;
  capabilities: ContentTypeCapabilities;
}

/**
 * Song content factory
 */
class SongContentFactory implements ContentTypeFactory<SongData, SongSlideSettings> {
  readonly typeId: ContentTypeId = 'song';

  create(data: SongData, settings?: Partial<SongSlideSettings>): SongContentType {
    return new SongContentType(data, settings);
  }

  fromJSON(json: string | object): SongContentType {
    const data = typeof json === 'string' ? JSON.parse(json) : json;
    return new SongContentType(data.content, data.settings);
  }

  createEmpty(): SongContentType {
    return new SongContentType({
      metadata: {
        title: 'Untitled Song'
      },
      sections: []
    });
  }
}

/**
 * Media content factory
 */
class MediaContentFactory implements ContentTypeFactory<MediaData, MediaSlideSettings> {
  readonly typeId: ContentTypeId = 'media';

  create(data: MediaData, settings?: Partial<MediaSlideSettings>): MediaContentType {
    return new MediaContentType(data, settings);
  }

  fromJSON(json: string | object): MediaContentType {
    const data = typeof json === 'string' ? JSON.parse(json) : json;
    return new MediaContentType(data.content, data.settings);
  }

  createEmpty(): MediaContentType {
    return new MediaContentType({
      metadata: {
        title: 'Untitled Media'
      },
      settings: MediaContentType.getDefaultSettings()
    });
  }
}

/**
 * Announcement content factory
 */
class AnnouncementContentFactory implements ContentTypeFactory<AnnouncementData, AnnouncementSlideSettings> {
  readonly typeId: ContentTypeId = 'announcement';

  create(data: AnnouncementData, settings?: Partial<AnnouncementSlideSettings>): AnnouncementContentType {
    return new AnnouncementContentType(data, settings);
  }

  fromJSON(json: string | object): AnnouncementContentType {
    const data = typeof json === 'string' ? JSON.parse(json) : json;
    return new AnnouncementContentType(data.content, data.settings);
  }

  createEmpty(): AnnouncementContentType {
    return new AnnouncementContentType({
      metadata: {
        title: 'Untitled Announcement',
        type: 'announcement',
        urgency: 'medium'
      },
      message: ''
    });
  }
}

/**
 * Central registry for all content types
 *
 * This is the single source of truth for:
 * - Registering content type factories
 * - Creating content instances
 * - Getting content type metadata and capabilities
 * - Deserializing content from JSON
 */
export class ContentTypeRegistry {
  private registrations = new Map<ContentTypeId, ContentTypeRegistration>();

  constructor() {
    this.registerBuiltInTypes();
  }

  /**
   * Register all built-in content types
   */
  private registerBuiltInTypes(): void {
    // Register Scripture
    this.register({
      typeId: 'scripture',
      typeName: 'Scripture',
      description: 'Bible verses and passages',
      icon: 'book-open',
      factory: new ScriptureFactory(),
      capabilities: ScriptureContentType.getCapabilities()
    });

    // Register Song
    this.register({
      typeId: 'song',
      typeName: 'Song',
      description: 'Worship songs with lyrics, sections, and chords',
      icon: 'music',
      factory: new SongContentFactory(),
      capabilities: SongContentType.getCapabilities()
    });

    // Register Media
    this.register({
      typeId: 'media',
      typeName: 'Media',
      description: 'Images and videos with optional overlays',
      icon: 'image',
      factory: new MediaContentFactory(),
      capabilities: MediaContentType.getCapabilities()
    });

    // Register Announcement
    this.register({
      typeId: 'announcement',
      typeName: 'Announcement',
      description: 'Events, reminders, and church announcements',
      icon: 'megaphone',
      factory: new AnnouncementContentFactory(),
      capabilities: AnnouncementContentType.getCapabilities()
    });
  }

  /**
   * Register a new content type
   */
  register<TContent = any, TSettings = any>(
    registration: ContentTypeRegistration<TContent, TSettings>
  ): void {
    if (this.registrations.has(registration.typeId)) {
      console.warn(`Content type '${registration.typeId}' is already registered. Overwriting.`);
    }

    this.registrations.set(registration.typeId, registration);
    console.log(`✅ Registered content type: ${registration.typeName} (${registration.typeId})`);
  }

  /**
   * Unregister a content type
   */
  unregister(typeId: ContentTypeId): boolean {
    return this.registrations.delete(typeId);
  }

  /**
   * Check if a content type is registered
   */
  has(typeId: ContentTypeId): boolean {
    return this.registrations.has(typeId);
  }

  /**
   * Get a content type registration
   */
  getRegistration(typeId: ContentTypeId): ContentTypeRegistration | undefined {
    return this.registrations.get(typeId);
  }

  /**
   * Get all registered content types
   */
  getAllRegistrations(): ContentTypeRegistration[] {
    return Array.from(this.registrations.values());
  }

  /**
   * Get content type IDs
   */
  getContentTypeIds(): ContentTypeId[] {
    return Array.from(this.registrations.keys());
  }

  /**
   * Get content type capabilities
   */
  getCapabilities(typeId: ContentTypeId): ContentTypeCapabilities | undefined {
    return this.registrations.get(typeId)?.capabilities;
  }

  /**
   * Create a new content instance
   */
  create<TContent = any, TSettings = any>(
    typeId: ContentTypeId,
    data: TContent,
    settings?: Partial<TSettings>
  ): ContentType<TContent, TSettings> | null {
    const registration = this.registrations.get(typeId);
    if (!registration) {
      console.error(`Content type '${typeId}' not found in registry`);
      return null;
    }

    return registration.factory.create(data, settings);
  }

  /**
   * Create empty content instance
   */
  createEmpty(typeId: ContentTypeId): ContentType | null {
    const registration = this.registrations.get(typeId);
    if (!registration) {
      console.error(`Content type '${typeId}' not found in registry`);
      return null;
    }

    return registration.factory.createEmpty();
  }

  /**
   * Deserialize content from JSON
   */
  fromJSON(json: string | object): ContentType | null {
    const data = typeof json === 'string' ? JSON.parse(json) : json;

    if (!data.typeId) {
      console.error('Content JSON missing typeId field');
      return null;
    }

    const registration = this.registrations.get(data.typeId);
    if (!registration) {
      console.error(`Content type '${data.typeId}' not found in registry`);
      return null;
    }

    return registration.factory.fromJSON(data);
  }

  /**
   * Get factory for a content type
   */
  getFactory(typeId: ContentTypeId): ContentTypeFactory | null {
    return this.registrations.get(typeId)?.factory || null;
  }

  /**
   * Validate content type ID
   */
  isValidTypeId(typeId: string): typeId is ContentTypeId {
    return this.registrations.has(typeId as ContentTypeId);
  }

  /**
   * Get content types that support a specific capability
   */
  getTypesByCapability(capabilityKey: keyof ContentTypeCapabilities): ContentTypeRegistration[] {
    return Array.from(this.registrations.values()).filter(
      registration => registration.capabilities[capabilityKey] === true
    );
  }

  /**
   * Get content type metadata for UI display
   */
  getTypeMetadata(typeId: ContentTypeId): {
    typeName: string;
    description: string;
    icon: string;
  } | null {
    const registration = this.registrations.get(typeId);
    if (!registration) return null;

    return {
      typeName: registration.typeName,
      description: registration.description,
      icon: registration.icon
    };
  }

  /**
   * Get registry statistics
   */
  getStats(): {
    totalTypes: number;
    typeIds: ContentTypeId[];
    fullyEditableTypes: number;
    mediaTypes: number;
    multiSlideTypes: number;
  } {
    const registrations = Array.from(this.registrations.values());

    return {
      totalTypes: registrations.length,
      typeIds: Array.from(this.registrations.keys()),
      fullyEditableTypes: registrations.filter(r => r.capabilities.fullyEditable).length,
      mediaTypes: registrations.filter(r => r.capabilities.supportsMedia).length,
      multiSlideTypes: registrations.filter(r => r.capabilities.supportsMultipleSlides).length
    };
  }

  /**
   * Clear all registrations (useful for testing)
   */
  clear(): void {
    this.registrations.clear();
  }

  /**
   * Reset to default registrations
   */
  reset(): void {
    this.clear();
    this.registerBuiltInTypes();
  }
}

/**
 * Global singleton instance of the registry
 */
export const contentTypeRegistry = new ContentTypeRegistry();

/**
 * Convenience functions for common operations
 */
export const ContentTypeHelpers = {
  /**
   * Create a scripture content instance
   */
  createScripture(data: ScriptureData, settings?: Partial<ScriptureSlideSettings>): ScriptureContentType | null {
    return contentTypeRegistry.create('scripture', data, settings) as ScriptureContentType;
  },

  /**
   * Create a song content instance
   */
  createSong(data: SongData, settings?: Partial<SongSlideSettings>): SongContentType | null {
    return contentTypeRegistry.create('song', data, settings) as SongContentType;
  },

  /**
   * Create a media content instance
   */
  createMedia(data: MediaData, settings?: Partial<MediaSlideSettings>): MediaContentType | null {
    return contentTypeRegistry.create('media', data, settings) as MediaContentType;
  },

  /**
   * Create an announcement content instance
   */
  createAnnouncement(
    data: AnnouncementData,
    settings?: Partial<AnnouncementSlideSettings>
  ): AnnouncementContentType | null {
    return contentTypeRegistry.create('announcement', data, settings) as AnnouncementContentType;
  },

  /**
   * Load content from JSON
   */
  loadFromJSON(json: string | object): ContentType | null {
    return contentTypeRegistry.fromJSON(json);
  },

  /**
   * Get all available content types for UI display
   */
  getAvailableTypes(): Array<{
    typeId: ContentTypeId;
    typeName: string;
    description: string;
    icon: string;
    capabilities: ContentTypeCapabilities;
  }> {
    return contentTypeRegistry.getAllRegistrations().map(reg => ({
      typeId: reg.typeId,
      typeName: reg.typeName,
      description: reg.description,
      icon: reg.icon,
      capabilities: reg.capabilities
    }));
  },

  /**
   * Check if a type supports a specific feature
   */
  supportsFeature(typeId: ContentTypeId, feature: keyof ContentTypeCapabilities): boolean {
    const caps = contentTypeRegistry.getCapabilities(typeId);
    return caps ? caps[feature] : false;
  }
};
