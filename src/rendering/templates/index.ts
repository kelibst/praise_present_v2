// Template system exports
export { SlideTemplate, type TemplateTheme, type TemplatePlaceholder, type TemplateContent, type SlideTemplateOptions } from './SlideTemplate';
export { TemplateManager, templateManager, type TemplateRegistration, type SlideGenerationOptions, type SlideGenerationResult } from './TemplateManager';

// Church-specific templates
export { SongTemplate, type SongSlideContent, type SongTemplateStyle } from './SongTemplate';
export { ScriptureTemplate, type ScriptureSlideContent, type ScriptureTemplateStyle } from './ScriptureTemplate';
export { AnnouncementTemplate, type AnnouncementSlideContent, type AnnouncementTemplateStyle } from './AnnouncementTemplate';

// Template utilities and helpers
export * from './templateUtils';