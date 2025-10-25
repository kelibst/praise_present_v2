import React from 'react';
import { ContentType, GeneratedSlide } from '../../rendering/content';

/**
 * Editor toolbar action
 */
export interface EditorAction {
  id: string;
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  variant?: 'primary' | 'secondary' | 'danger';
  disabled?: boolean;
}

/**
 * Editor panel configuration
 */
export interface EditorPanel {
  id: string;
  title: string;
  icon?: React.ReactNode;
  component: React.ReactNode;
  defaultOpen?: boolean;
  collapsible?: boolean;
}

/**
 * Base editor props that all content editors receive
 */
export interface BaseEditorProps<TContent = any, TSettings = any> {
  /**
   * The content instance being edited
   */
  content: ContentType<TContent, TSettings>;

  /**
   * Callback when content is modified
   */
  onContentChange: (content: ContentType<TContent, TSettings>) => void;

  /**
   * Callback when slides need to be regenerated
   */
  onSlidesGenerated?: (slides: GeneratedSlide[]) => void;

  /**
   * Current slide index being previewed
   */
  currentSlideIndex?: number;

  /**
   * Callback when slide index changes
   */
  onSlideIndexChange?: (index: number) => void;

  /**
   * Whether the editor is in read-only mode
   */
  readOnly?: boolean;

  /**
   * Optional CSS class
   */
  className?: string;

  /**
   * Callback when user requests save
   */
  onSave?: () => void;

  /**
   * Callback when user requests cancel/close
   */
  onCancel?: () => void;
}

/**
 * Editor component interface
 *
 * All content-specific editors should implement this interface.
 * The EditorFactory uses this to render the appropriate editor.
 */
export interface EditorComponent<TContent = any, TSettings = any> {
  /**
   * Render the editor
   */
  (props: BaseEditorProps<TContent, TSettings>): JSX.Element;
}

/**
 * Editor configuration for registration
 */
export interface EditorConfig {
  /**
   * Content type this editor handles
   */
  contentTypeId: string;

  /**
   * Display name for the editor
   */
  name: string;

  /**
   * Editor component
   */
  component: EditorComponent;

  /**
   * Optional icon component
   */
  icon?: React.ComponentType;

  /**
   * Whether this editor supports live preview
   */
  supportsLivePreview: boolean;

  /**
   * Whether this editor has a settings panel
   */
  hasSettingsPanel: boolean;

  /**
   * Custom toolbar actions
   */
  toolbarActions?: EditorAction[];
}

/**
 * Editor layout configuration
 */
export interface EditorLayout {
  /**
   * Whether to show left panel (content editing)
   */
  showLeftPanel: boolean;

  /**
   * Whether to show right panel (settings/properties)
   */
  showRightPanel: boolean;

  /**
   * Whether to show bottom panel (slide previews)
   */
  showBottomPanel: boolean;

  /**
   * Whether to show live preview in center
   */
  showLivePreview: boolean;
}

/**
 * Default editor layout
 */
export const DEFAULT_EDITOR_LAYOUT: EditorLayout = {
  showLeftPanel: true,
  showRightPanel: true,
  showBottomPanel: true,
  showLivePreview: true
};

/**
 * Editor context for sharing state between editor components
 */
export interface EditorContextValue<TContent = any, TSettings = any> {
  content: ContentType<TContent, TSettings>;
  slides: GeneratedSlide[];
  currentSlideIndex: number;
  layout: EditorLayout;
  readOnly: boolean;

  updateContent: (content: ContentType<TContent, TSettings>) => void;
  updateSettings: (settings: Partial<TSettings>) => void;
  regenerateSlides: () => void;
  setCurrentSlideIndex: (index: number) => void;
  setLayout: (layout: Partial<EditorLayout>) => void;
}

/**
 * Create editor context
 */
export const EditorContext = React.createContext<EditorContextValue | null>(null);

/**
 * Hook to use editor context
 */
export function useEditorContext<TContent = any, TSettings = any>(): EditorContextValue<TContent, TSettings> {
  const context = React.useContext(EditorContext);
  if (!context) {
    throw new Error('useEditorContext must be used within an EditorProvider');
  }
  return context as EditorContextValue<TContent, TSettings>;
}

/**
 * Editor provider props
 */
export interface EditorProviderProps<TContent = any, TSettings = any> {
  content: ContentType<TContent, TSettings>;
  onContentChange: (content: ContentType<TContent, TSettings>) => void;
  children: React.ReactNode;
  initialLayout?: Partial<EditorLayout>;
}

/**
 * Editor provider component
 *
 * Provides editor state to all child components via context.
 */
export function EditorProvider<TContent = any, TSettings = any>({
  content,
  onContentChange,
  children,
  initialLayout = {}
}: EditorProviderProps<TContent, TSettings>) {
  const [currentContent, setCurrentContent] = React.useState(content);
  const [slides, setSlides] = React.useState<GeneratedSlide[]>([]);
  const [currentSlideIndex, setCurrentSlideIndex] = React.useState(0);
  const [layout, setLayoutState] = React.useState<EditorLayout>({
    ...DEFAULT_EDITOR_LAYOUT,
    ...initialLayout
  });

  // Generate slides when content changes
  React.useEffect(() => {
    const generatedSlides = currentContent.generateSlides();
    setSlides(generatedSlides);
  }, [currentContent]);

  // Update parent when content changes
  React.useEffect(() => {
    onContentChange(currentContent);
  }, [currentContent, onContentChange]);

  const updateContent = React.useCallback((newContent: ContentType<TContent, TSettings>) => {
    setCurrentContent(newContent);
  }, []);

  const updateSettings = React.useCallback((settings: Partial<TSettings>) => {
    currentContent.updateSettings(settings);
    setCurrentContent(currentContent.clone());
  }, [currentContent]);

  const regenerateSlides = React.useCallback(() => {
    const generatedSlides = currentContent.generateSlides();
    setSlides(generatedSlides);
  }, [currentContent]);

  const setLayout = React.useCallback((layoutUpdates: Partial<EditorLayout>) => {
    setLayoutState(prev => ({ ...prev, ...layoutUpdates }));
  }, []);

  const contextValue: EditorContextValue<TContent, TSettings> = {
    content: currentContent,
    slides,
    currentSlideIndex,
    layout,
    readOnly: false,
    updateContent,
    updateSettings,
    regenerateSlides,
    setCurrentSlideIndex,
    setLayout
  };

  return (
    <EditorContext.Provider value={contextValue}>
      {children}
    </EditorContext.Provider>
  );
}

/**
 * Common editor toolbar component
 */
export interface EditorToolbarProps {
  title: string;
  subtitle?: string;
  actions: EditorAction[];
  onBack?: () => void;
}

export const EditorToolbar: React.FC<EditorToolbarProps> = ({
  title,
  subtitle,
  actions,
  onBack
}) => {
  return (
    <div className="border-b border-border bg-card">
      <div className="px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {onBack && (
            <button
              onClick={onBack}
              className="p-2 hover:bg-secondary rounded-lg transition-colors"
              title="Go back"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          )}
          <div>
            <h1 className="text-lg font-bold">{title}</h1>
            {subtitle && (
              <p className="text-xs text-muted-foreground">{subtitle}</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {actions.map(action => (
            <button
              key={action.id}
              onClick={action.onClick}
              disabled={action.disabled}
              className={`
                px-3 py-1.5 rounded text-sm flex items-center gap-1.5 transition-colors
                ${action.variant === 'primary' ? 'bg-blue-600 text-white hover:bg-blue-700' : ''}
                ${action.variant === 'danger' ? 'bg-red-600 text-white hover:bg-red-700' : ''}
                ${action.variant === 'secondary' || !action.variant ? 'bg-gray-600 text-white hover:bg-gray-700' : ''}
                ${action.disabled ? 'opacity-50 cursor-not-allowed' : ''}
              `}
            >
              {action.icon}
              {action.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

/**
 * Common editor panel component
 */
export interface EditorPanelContainerProps {
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  onClose?: () => void;
  collapsible?: boolean;
  defaultOpen?: boolean;
}

export const EditorPanelContainer: React.FC<EditorPanelContainerProps> = ({
  title,
  icon,
  children,
  onClose,
  collapsible = true,
  defaultOpen = true
}) => {
  const [isOpen, setIsOpen] = React.useState(defaultOpen);

  return (
    <div className="h-full bg-card border-r border-border">
      <div className="flex items-center justify-between px-3 py-2 border-b border-border bg-secondary/50">
        <div className="text-sm font-medium flex items-center gap-2">
          {icon}
          {title}
        </div>
        {(collapsible || onClose) && (
          <button
            onClick={() => {
              if (onClose) {
                onClose();
              } else if (collapsible) {
                setIsOpen(!isOpen);
              }
            }}
            className="p-1 rounded hover:bg-muted transition-colors"
            title={collapsible ? (isOpen ? 'Collapse' : 'Expand') : 'Close'}
          >
            {collapsible ? (
              <svg className={`w-4 h-4 transition-transform ${isOpen ? '' : 'rotate-180'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            )}
          </button>
        )}
      </div>

      {isOpen && (
        <div className="p-3 overflow-y-auto" style={{ height: 'calc(100vh - 160px)' }}>
          {children}
        </div>
      )}
    </div>
  );
};
