/**
 * Editor Component System
 *
 * This module provides content-specific editors for different presentation types.
 * Editors are automatically selected based on content type using the EditorFactory.
 *
 * Usage:
 * ```typescript
 * import { EditorFactory } from '@/components/editors';
 *
 * <EditorFactory
 *   content={contentInstance}
 *   onContentChange={handleChange}
 *   onSave={handleSave}
 * />
 * ```
 */

// Base editor infrastructure
export * from './BaseEditor';
export * from './EditorFactory';

// Content-specific editors
export { ScriptureEditor } from './ScriptureEditor';
export { SongEditor } from './SongEditor';
export { MediaEditor } from './MediaEditor';
export { AnnouncementEditor } from './AnnouncementEditor';

// Register all built-in editors
import { editorRegistry, createEditorConfig } from './EditorFactory';
import { ScriptureEditor } from './ScriptureEditor';
import { SongEditor } from './SongEditor';
import { MediaEditor } from './MediaEditor';
import { AnnouncementEditor } from './AnnouncementEditor';
import { Music, Image, Megaphone, BookOpen } from 'lucide-react';

/**
 * Initialize and register all built-in editors
 */
export function registerBuiltInEditors(): void {
  // Register Scripture Editor
  editorRegistry.register(
    createEditorConfig({
      contentTypeId: 'scripture',
      name: 'Scripture Editor',
      component: ScriptureEditor,
      supportsLivePreview: true,
      hasSettingsPanel: true,
      toolbarActions: []
    })
  );

  // Register Song Editor
  editorRegistry.register(
    createEditorConfig({
      contentTypeId: 'song',
      name: 'Song Editor',
      component: SongEditor,
      supportsLivePreview: true,
      hasSettingsPanel: true,
      toolbarActions: []
    })
  );

  // Register Media Editor
  editorRegistry.register(
    createEditorConfig({
      contentTypeId: 'media',
      name: 'Media Editor',
      component: MediaEditor,
      supportsLivePreview: true,
      hasSettingsPanel: true,
      toolbarActions: []
    })
  );

  // Register Announcement Editor
  editorRegistry.register(
    createEditorConfig({
      contentTypeId: 'announcement',
      name: 'Announcement Editor',
      component: AnnouncementEditor,
      supportsLivePreview: true,
      hasSettingsPanel: true,
      toolbarActions: []
    })
  );

  console.log('✅ Built-in editors registered (Scripture, Song, Media, Announcement)');
}

// Auto-register on module load
registerBuiltInEditors();
