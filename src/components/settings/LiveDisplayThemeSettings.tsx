import React, { useState, useEffect } from 'react';
import {
  Palette,
  Eye,
  Save,
  Plus,
  Trash2,
  Copy,
  RefreshCw,
  Download,
  Upload
} from 'lucide-react';

// Theme interface
interface LiveDisplayTheme {
  id: string;
  name: string;
  description?: string;
  isDefault?: boolean;
  isCustom?: boolean;
  styles: {
    background: {
      type: 'color' | 'gradient' | 'image';
      color?: string;
      gradient?: {
        type: 'linear' | 'radial';
        colors: string[];
        direction?: string;
      };
      image?: string;
    };
    text: {
      fontFamily: string;
      fontSize: number;
      fontWeight: 'normal' | 'bold' | '300' | '400' | '500' | '600' | '700' | '800' | '900';
      color: string;
      textAlign: 'left' | 'center' | 'right';
      textShadow?: {
        enabled: boolean;
        offsetX: number;
        offsetY: number;
        blur: number;
        color: string;
      };
    };
    scripture: {
      verseSpacing: number;
      referenceStyle: 'inline' | 'bottom' | 'top' | 'hidden';
      highlightColor?: string;
    };
    song: {
      titleSize: number;
      verseSpacing: number;
      chorusStyle: 'bold' | 'italic' | 'highlight' | 'normal';
    };
  };
}

// Default themes
const defaultThemes: LiveDisplayTheme[] = [
  {
    id: 'modern-dark',
    name: 'Modern Dark',
    description: 'Clean dark theme with white text',
    isDefault: true,
    styles: {
      background: {
        type: 'color',
        color: '#1a1a1a',
      },
      text: {
        fontFamily: 'Inter, system-ui, sans-serif',
        fontSize: 48,
        fontWeight: '400',
        color: '#ffffff',
        textAlign: 'center',
        textShadow: {
          enabled: false,
          offsetX: 0,
          offsetY: 0,
          blur: 0,
          color: '#000000',
        },
      },
      scripture: {
        verseSpacing: 1.5,
        referenceStyle: 'bottom',
      },
      song: {
        titleSize: 64,
        verseSpacing: 1.4,
        chorusStyle: 'bold',
      },
    },
  },
  {
    id: 'classic-light',
    name: 'Classic Light',
    description: 'Traditional light theme with dark text',
    isDefault: true,
    styles: {
      background: {
        type: 'color',
        color: '#f8f9fa',
      },
      text: {
        fontFamily: 'Georgia, serif',
        fontSize: 46,
        fontWeight: '400',
        color: '#212529',
        textAlign: 'center',
        textShadow: {
          enabled: false,
          offsetX: 0,
          offsetY: 0,
          blur: 0,
          color: '#000000',
        },
      },
      scripture: {
        verseSpacing: 1.6,
        referenceStyle: 'bottom',
      },
      song: {
        titleSize: 58,
        verseSpacing: 1.5,
        chorusStyle: 'italic',
      },
    },
  },
  {
    id: 'gradient-blue',
    name: 'Ocean Gradient',
    description: 'Blue gradient background with white text',
    isDefault: true,
    styles: {
      background: {
        type: 'gradient',
        gradient: {
          type: 'linear',
          colors: ['#1e3a8a', '#3b82f6', '#06b6d4'],
          direction: '135deg',
        },
      },
      text: {
        fontFamily: 'Roboto, sans-serif',
        fontSize: 50,
        fontWeight: '500',
        color: '#ffffff',
        textAlign: 'center',
        textShadow: {
          enabled: true,
          offsetX: 2,
          offsetY: 2,
          blur: 4,
          color: '#000000',
        },
      },
      scripture: {
        verseSpacing: 1.5,
        referenceStyle: 'bottom',
      },
      song: {
        titleSize: 62,
        verseSpacing: 1.4,
        chorusStyle: 'highlight',
      },
    },
  },
];

const LiveDisplayThemeSettings: React.FC = () => {
  const [themes, setThemes] = useState<LiveDisplayTheme[]>(defaultThemes);
  const [selectedThemeId, setSelectedThemeId] = useState<string>('modern-dark');
  const [editingTheme, setEditingTheme] = useState<LiveDisplayTheme | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    loadThemes();
  }, []);

  const loadThemes = () => {
    try {
      const savedThemes = localStorage.getItem('live-display-themes');
      const savedSelected = localStorage.getItem('selected-live-display-theme');

      if (savedThemes) {
        const parsed = JSON.parse(savedThemes);
        setThemes([...defaultThemes, ...parsed.filter((t: LiveDisplayTheme) => t.isCustom)]);
      }

      if (savedSelected) {
        setSelectedThemeId(savedSelected);
      }
    } catch (error) {
      console.error('Failed to load themes:', error);
    }
  };

  const saveThemes = () => {
    try {
      const customThemes = themes.filter(t => t.isCustom);
      localStorage.setItem('live-display-themes', JSON.stringify(customThemes));
      localStorage.setItem('selected-live-display-theme', selectedThemeId);
      console.log('Themes saved successfully');
    } catch (error) {
      console.error('Failed to save themes:', error);
    }
  };

  const createNewTheme = () => {
    const newTheme: LiveDisplayTheme = {
      id: `custom-${Date.now()}`,
      name: 'New Theme',
      description: 'Custom theme',
      isCustom: true,
      styles: {
        background: {
          type: 'color',
          color: '#000000',
        },
        text: {
          fontFamily: 'Inter, sans-serif',
          fontSize: 48,
          fontWeight: '400',
          color: '#ffffff',
          textAlign: 'center',
          textShadow: {
            enabled: false,
            offsetX: 0,
            offsetY: 0,
            blur: 0,
            color: '#000000',
          },
        },
        scripture: {
          verseSpacing: 1.5,
          referenceStyle: 'bottom',
        },
        song: {
          titleSize: 60,
          verseSpacing: 1.4,
          chorusStyle: 'bold',
        },
      },
    };

    setThemes(prev => [...prev, newTheme]);
    setEditingTheme(newTheme);
    setIsEditing(true);
  };

  const editTheme = (theme: LiveDisplayTheme) => {
    setEditingTheme({ ...theme });
    setIsEditing(true);
  };

  const duplicateTheme = (theme: LiveDisplayTheme) => {
    const duplicatedTheme: LiveDisplayTheme = {
      ...theme,
      id: `custom-${Date.now()}`,
      name: `${theme.name} Copy`,
      isCustom: true,
    };

    setThemes(prev => [...prev, duplicatedTheme]);
  };

  const deleteTheme = (themeId: string) => {
    if (themes.find(t => t.id === themeId)?.isDefault) return;

    setThemes(prev => prev.filter(t => t.id !== themeId));
    if (selectedThemeId === themeId) {
      setSelectedThemeId('modern-dark');
    }
  };

  const saveEditedTheme = () => {
    if (!editingTheme) return;

    setThemes(prev => prev.map(t => t.id === editingTheme.id ? editingTheme : t));
    setIsEditing(false);
    setEditingTheme(null);
  };

  const cancelEdit = () => {
    setIsEditing(false);
    setEditingTheme(null);
  };

  const updateEditingTheme = (updates: Partial<LiveDisplayTheme>) => {
    if (!editingTheme) return;
    setEditingTheme(prev => ({ ...prev!, ...updates }));
  };

  const selectedTheme = themes.find(t => t.id === selectedThemeId);

  const renderThemePreview = (theme: LiveDisplayTheme) => {
    const { background, text } = theme.styles;

    let backgroundStyle: React.CSSProperties = {};

    if (background.type === 'color') {
      backgroundStyle.backgroundColor = background.color;
    } else if (background.type === 'gradient' && background.gradient) {
      const { gradient } = background;
      backgroundStyle.background = `${gradient.type}-gradient(${gradient.direction || '0deg'}, ${gradient.colors.join(', ')})`;
    }

    return (
      <div
        className="w-full h-24 rounded-lg border border-border relative overflow-hidden"
        style={backgroundStyle}
      >
        <div
          className="absolute inset-0 flex items-center justify-center text-xs font-medium"
          style={{
            color: text.color,
            fontFamily: text.fontFamily,
            textShadow: text.textShadow?.enabled
              ? `${text.textShadow.offsetX}px ${text.textShadow.offsetY}px ${text.textShadow.blur}px ${text.textShadow.color}`
              : 'none',
          }}
        >
          Sample Text
        </div>
      </div>
    );
  };

  if (isEditing && editingTheme) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-foreground">
            Edit Theme: {editingTheme.name}
          </h3>
          <div className="flex gap-2">
            <button
              onClick={saveEditedTheme}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              Save
            </button>
            <button
              onClick={cancelEdit}
              className="px-4 py-2 border border-border text-foreground rounded-md hover:bg-accent"
            >
              Cancel
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Theme Settings */}
          <div className="space-y-6">
            {/* Basic Info */}
            <div>
              <h4 className="font-medium text-foreground mb-3">Basic Information</h4>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Theme Name
                  </label>
                  <input
                    type="text"
                    value={editingTheme.name}
                    onChange={(e) => updateEditingTheme({ name: e.target.value })}
                    className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Description
                  </label>
                  <input
                    type="text"
                    value={editingTheme.description || ''}
                    onChange={(e) => updateEditingTheme({ description: e.target.value })}
                    className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            {/* Background Settings */}
            <div>
              <h4 className="font-medium text-foreground mb-3">Background</h4>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Background Type
                  </label>
                  <select
                    value={editingTheme.styles.background.type}
                    onChange={(e) => updateEditingTheme({
                      styles: {
                        ...editingTheme.styles,
                        background: {
                          ...editingTheme.styles.background,
                          type: e.target.value as 'color' | 'gradient' | 'image'
                        }
                      }
                    })}
                    className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  >
                    <option value="color">Solid Color</option>
                    <option value="gradient">Gradient</option>
                    <option value="image">Image</option>
                  </select>
                </div>

                {editingTheme.styles.background.type === 'color' && (
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">
                      Background Color
                    </label>
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        value={editingTheme.styles.background.color || '#000000'}
                        onChange={(e) => updateEditingTheme({
                          styles: {
                            ...editingTheme.styles,
                            background: {
                              ...editingTheme.styles.background,
                              color: e.target.value
                            }
                          }
                        })}
                        className="w-12 h-10 border border-border rounded cursor-pointer"
                      />
                      <input
                        type="text"
                        value={editingTheme.styles.background.color || '#000000'}
                        onChange={(e) => updateEditingTheme({
                          styles: {
                            ...editingTheme.styles,
                            background: {
                              ...editingTheme.styles.background,
                              color: e.target.value
                            }
                          }
                        })}
                        className="flex-1 px-3 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Text Settings */}
            <div>
              <h4 className="font-medium text-foreground mb-3">Text Style</h4>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Font Family
                  </label>
                  <select
                    value={editingTheme.styles.text.fontFamily}
                    onChange={(e) => updateEditingTheme({
                      styles: {
                        ...editingTheme.styles,
                        text: {
                          ...editingTheme.styles.text,
                          fontFamily: e.target.value
                        }
                      }
                    })}
                    className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  >
                    <option value="Inter, system-ui, sans-serif">Inter</option>
                    <option value="Georgia, serif">Georgia</option>
                    <option value="Roboto, sans-serif">Roboto</option>
                    <option value="Arial, sans-serif">Arial</option>
                    <option value="Times New Roman, serif">Times New Roman</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Font Size: {editingTheme.styles.text.fontSize}px
                  </label>
                  <input
                    type="range"
                    min="24"
                    max="120"
                    value={editingTheme.styles.text.fontSize}
                    onChange={(e) => updateEditingTheme({
                      styles: {
                        ...editingTheme.styles,
                        text: {
                          ...editingTheme.styles.text,
                          fontSize: parseInt(e.target.value)
                        }
                      }
                    })}
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Text Color
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={editingTheme.styles.text.color}
                      onChange={(e) => updateEditingTheme({
                        styles: {
                          ...editingTheme.styles,
                          text: {
                            ...editingTheme.styles.text,
                            color: e.target.value
                          }
                        }
                      })}
                      className="w-12 h-10 border border-border rounded cursor-pointer"
                    />
                    <input
                      type="text"
                      value={editingTheme.styles.text.color}
                      onChange={(e) => updateEditingTheme({
                        styles: {
                          ...editingTheme.styles,
                          text: {
                            ...editingTheme.styles.text,
                            color: e.target.value
                          }
                        }
                      })}
                      className="flex-1 px-3 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Live Preview */}
          <div>
            <h4 className="font-medium text-foreground mb-3">Preview</h4>
            <div className="space-y-4">
              {renderThemePreview(editingTheme)}

              <div className="p-4 border border-border rounded-lg bg-card">
                <h5 className="font-medium text-foreground mb-2">Sample Content</h5>
                <div
                  className="p-6 rounded-lg"
                  style={{
                    backgroundColor: editingTheme.styles.background.color,
                    color: editingTheme.styles.text.color,
                    fontFamily: editingTheme.styles.text.fontFamily,
                    fontSize: Math.max(14, editingTheme.styles.text.fontSize / 3),
                    textAlign: editingTheme.styles.text.textAlign,
                    textShadow: editingTheme.styles.text.textShadow?.enabled
                      ? `${editingTheme.styles.text.textShadow.offsetX}px ${editingTheme.styles.text.textShadow.offsetY}px ${editingTheme.styles.text.textShadow.blur}px ${editingTheme.styles.text.textShadow.color}`
                      : 'none',
                  }}
                >
                  <div className="mb-4 font-semibold">Amazing Grace</div>
                  <div className="mb-2">Amazing grace, how sweet the sound</div>
                  <div className="mb-2">That saved a wretch like me</div>
                  <div className="mb-2">I once was lost, but now am found</div>
                  <div>Was blind, but now I see</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
          <Palette className="w-5 h-5" />
          Live Display Themes
        </h3>
        <div className="flex gap-2">
          <button
            onClick={createNewTheme}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            New Theme
          </button>
          <button
            onClick={saveThemes}
            className="px-4 py-2 border border-border text-foreground rounded-md hover:bg-accent flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            Save
          </button>
        </div>
      </div>

      {/* Current Selection */}
      {selectedTheme && (
        <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
          <div className="flex items-center gap-3 mb-3">
            <Eye className="w-5 h-5 text-primary" />
            <h4 className="font-medium text-foreground">Currently Active Theme</h4>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-16 h-10">
              {renderThemePreview(selectedTheme)}
            </div>
            <div>
              <div className="font-medium text-foreground">{selectedTheme.name}</div>
              <div className="text-sm text-muted-foreground">{selectedTheme.description}</div>
            </div>
          </div>
        </div>
      )}

      {/* Theme List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {themes.map((theme) => (
          <div
            key={theme.id}
            className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
              selectedThemeId === theme.id
                ? 'border-primary bg-primary/5'
                : 'border-border hover:border-primary/50'
            }`}
            onClick={() => setSelectedThemeId(theme.id)}
          >
            <div className="mb-3">
              {renderThemePreview(theme)}
            </div>

            <div className="mb-3">
              <h4 className="font-medium text-foreground flex items-center gap-2">
                {theme.name}
                {theme.isDefault && (
                  <span className="text-xs bg-secondary text-secondary-foreground px-2 py-1 rounded">
                    Default
                  </span>
                )}
              </h4>
              {theme.description && (
                <p className="text-sm text-muted-foreground">{theme.description}</p>
              )}
            </div>

            <div className="flex gap-2">
              {theme.isCustom && (
                <>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      editTheme(theme);
                    }}
                    className="flex-1 px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    Edit
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteTheme(theme.id);
                    }}
                    className="px-2 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </>
              )}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  duplicateTheme(theme);
                }}
                className="px-2 py-1 text-xs bg-gray-600 text-white rounded hover:bg-gray-700"
              >
                <Copy className="w-3 h-3" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default LiveDisplayThemeSettings;