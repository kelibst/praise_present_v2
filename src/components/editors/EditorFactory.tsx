import React from 'react';
import { ContentType, ContentTypeId } from '../../rendering/content';
import { EditorComponent, EditorConfig, BaseEditorProps } from './BaseEditor';

/**
 * Editor registry for managing content-specific editors
 */
class EditorRegistry {
  private editors = new Map<ContentTypeId, EditorConfig>();

  /**
   * Register an editor for a content type
   */
  register(config: EditorConfig): void {
    if (this.editors.has(config.contentTypeId as ContentTypeId)) {
      console.warn(`Editor for '${config.contentTypeId}' is already registered. Overwriting.`);
    }

    this.editors.set(config.contentTypeId as ContentTypeId, config);
    console.log(`✅ Registered editor: ${config.name} for ${config.contentTypeId}`);
  }

  /**
   * Unregister an editor
   */
  unregister(contentTypeId: ContentTypeId): boolean {
    return this.editors.delete(contentTypeId);
  }

  /**
   * Get editor config for a content type
   */
  get(contentTypeId: ContentTypeId): EditorConfig | undefined {
    return this.editors.get(contentTypeId);
  }

  /**
   * Check if editor exists for content type
   */
  has(contentTypeId: ContentTypeId): boolean {
    return this.editors.has(contentTypeId);
  }

  /**
   * Get all registered editors
   */
  getAll(): EditorConfig[] {
    return Array.from(this.editors.values());
  }

  /**
   * Clear all registrations
   */
  clear(): void {
    this.editors.clear();
  }
}

/**
 * Global editor registry
 */
export const editorRegistry = new EditorRegistry();

/**
 * EditorFactory component
 *
 * Dynamically renders the appropriate editor based on content type.
 * This is the main entry point for editing any content type.
 */
export interface EditorFactoryProps<TContent = any, TSettings = any> extends BaseEditorProps<TContent, TSettings> {
  /**
   * Fallback component if no editor is registered
   */
  fallback?: React.ReactNode;
}

export function EditorFactory<TContent = any, TSettings = any>({
  content,
  fallback,
  ...editorProps
}: EditorFactoryProps<TContent, TSettings>): JSX.Element {
  const contentTypeId = content.typeId;
  const editorConfig = editorRegistry.get(contentTypeId);

  if (!editorConfig) {
    console.warn(`No editor registered for content type: ${contentTypeId}`);

    if (fallback) {
      return <>{fallback}</>;
    }

    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">⚠️</div>
          <div className="text-xl font-medium mb-2">No Editor Available</div>
          <div className="text-sm text-muted-foreground max-w-md">
            No editor is registered for content type "{contentTypeId}".
            <br />
            Please register an editor using <code className="bg-secondary px-1 py-0.5 rounded">editorRegistry.register()</code>.
          </div>
        </div>
      </div>
    );
  }

  const EditorComponent = editorConfig.component;

  return (
    <EditorComponent
      content={content}
      {...editorProps}
    />
  );
}

/**
 * Hook to get editor config for a content type
 */
export function useEditorConfig(contentTypeId: ContentTypeId): EditorConfig | undefined {
  return React.useMemo(() => editorRegistry.get(contentTypeId), [contentTypeId]);
}

/**
 * Hook to check if editor exists for content type
 */
export function useHasEditor(contentTypeId: ContentTypeId): boolean {
  return React.useMemo(() => editorRegistry.has(contentTypeId), [contentTypeId]);
}

/**
 * Hook to get all available editors
 */
export function useAvailableEditors(): EditorConfig[] {
  const [editors, setEditors] = React.useState<EditorConfig[]>([]);

  React.useEffect(() => {
    setEditors(editorRegistry.getAll());
  }, []);

  return editors;
}

/**
 * Helper component to render an editor with error boundary
 */
interface EditorWithErrorBoundaryProps<TContent = any, TSettings = any> extends EditorFactoryProps<TContent, TSettings> {
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

class EditorErrorBoundary extends React.Component<
  { children: React.ReactNode; onError?: (error: Error, errorInfo: React.ErrorInfo) => void },
  ErrorBoundaryState
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Editor error:', error, errorInfo);
    this.props.onError?.(error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
          <div className="text-center max-w-2xl">
            <div className="text-6xl mb-4">💥</div>
            <div className="text-xl font-medium mb-2">Editor Error</div>
            <div className="text-sm text-muted-foreground mb-4">
              The editor encountered an error and cannot be displayed.
            </div>
            {this.state.error && (
              <div className="bg-secondary p-4 rounded text-left text-xs font-mono overflow-auto max-h-64">
                <div className="font-bold mb-2">{this.state.error.name}</div>
                <div className="text-muted-foreground">{this.state.error.message}</div>
                {this.state.error.stack && (
                  <pre className="mt-2 text-muted-foreground/70">{this.state.error.stack}</pre>
                )}
              </div>
            )}
            <button
              onClick={() => this.setState({ hasError: false, error: undefined })}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Try Again
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * EditorFactory with error boundary
 */
export function EditorFactoryWithErrorBoundary<TContent = any, TSettings = any>(
  props: EditorWithErrorBoundaryProps<TContent, TSettings>
): JSX.Element {
  const { onError, ...editorProps } = props;

  return (
    <EditorErrorBoundary onError={onError}>
      <EditorFactory {...editorProps} />
    </EditorErrorBoundary>
  );
}

/**
 * Utility function to create an editor registration
 */
export function createEditorConfig(config: EditorConfig): EditorConfig {
  return config;
}

/**
 * Helper to register multiple editors at once
 */
export function registerEditors(configs: EditorConfig[]): void {
  configs.forEach(config => editorRegistry.register(config));
}
