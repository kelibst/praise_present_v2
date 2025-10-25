import React, { useState } from 'react';
import { AnnouncementData, AnnouncementSlideSettings } from '../../../rendering/content/AnnouncementContent';

export interface AnnouncementTemplate {
  id: string;
  name: string;
  description: string;
  category: 'event' | 'ministry' | 'general' | 'special';
  preview: string;
  data: Partial<AnnouncementData>;
  settings: Partial<AnnouncementSlideSettings>;
}

interface AnnouncementTemplateLibraryProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTemplate: (template: AnnouncementTemplate) => void;
}

const templates: AnnouncementTemplate[] = [
  {
    id: 'event-modern',
    name: 'Modern Event',
    description: 'Clean, modern design for general events',
    category: 'event',
    preview: '📅',
    data: {
      metadata: {
        title: 'Join Us This Weekend',
        type: 'event',
        urgency: 'medium'
      },
      message: 'Community Event - Come and be part of something amazing!'
    },
    settings: {
      typography: {
        titleFontSize: 72,
        messageFontSize: 48,
        detailsFontSize: 36,
        fontFamily: 'Helvetica',
        titleColor: '#ffffff',
        messageColor: '#60a5fa',
        detailsColor: '#d1d5db'
      },
      background: {
        type: 'color',
        color: { r: 17, g: 24, b: 39, a: 1 }
      },
      layout: 'centered',
      showBorder: false
    }
  },
  {
    id: 'ministry-spotlight',
    name: 'Ministry Spotlight',
    description: 'Highlight a ministry or program',
    category: 'ministry',
    preview: '⭐',
    data: {
      metadata: {
        title: 'Ministry Spotlight',
        type: 'announcement',
        urgency: 'medium'
      },
      message: 'Making a Difference - Learn how you can get involved in serving our community'
    },
    settings: {
      typography: {
        titleFontSize: 64,
        messageFontSize: 44,
        detailsFontSize: 32,
        fontFamily: 'Georgia',
        titleColor: '#fbbf24',
        messageColor: '#ffffff',
        detailsColor: '#e5e7eb'
      },
      background: {
        type: 'color',
        color: { r: 55, g: 65, b: 81, a: 1 }
      },
      layout: 'left-aligned',
      showBorder: false
    }
  },
  {
    id: 'urgent-announcement',
    name: 'Urgent Notice',
    description: 'High-visibility for important notices',
    category: 'special',
    preview: '⚠️',
    data: {
      metadata: {
        title: 'Important Announcement',
        type: 'announcement',
        urgency: 'high'
      },
      message: 'This is an important update for our community'
    },
    settings: {
      typography: {
        titleFontSize: 76,
        messageFontSize: 48,
        detailsFontSize: 38,
        fontFamily: 'Arial',
        titleColor: '#ef4444',
        messageColor: '#ffffff',
        detailsColor: '#fca5a5'
      },
      background: {
        type: 'color',
        color: { r: 127, g: 29, b: 29, a: 1 }
      },
      layout: 'centered',
      showBorder: true,
      borderColor: '#fca5a5'
    }
  },
  {
    id: 'simple-text',
    name: 'Simple Text',
    description: 'Minimal design, focus on content',
    category: 'general',
    preview: '📝',
    data: {
      metadata: {
        title: 'Announcement',
        type: 'announcement',
        urgency: 'medium'
      },
      message: 'Important information for our community'
    },
    settings: {
      typography: {
        titleFontSize: 60,
        messageFontSize: 40,
        detailsFontSize: 36,
        fontFamily: 'Arial',
        titleColor: '#ffffff',
        messageColor: '#9ca3af',
        detailsColor: '#d1d5db'
      },
      background: {
        type: 'color',
        color: { r: 31, g: 41, b: 55, a: 1 }
      },
      layout: 'left-aligned',
      showBorder: false
    }
  }
];

export const AnnouncementTemplateLibrary: React.FC<AnnouncementTemplateLibraryProps> = ({
  isOpen,
  onClose,
  onSelectTemplate
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  if (!isOpen) return null;

  const categories = [
    { id: 'all', label: 'All Templates' },
    { id: 'event', label: 'Events' },
    { id: 'ministry', label: 'Ministry' },
    { id: 'general', label: 'General' },
    { id: 'special', label: 'Special' }
  ];

  const filteredTemplates = templates.filter(template => {
    const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory;
    const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
          <div>
            <h3 className="text-lg font-semibold">Announcement Templates</h3>
            <p className="text-sm text-gray-400 mt-1">Choose a template to get started</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-300"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Filters */}
        <div className="px-6 py-4 border-b border-gray-800 space-y-3">
          {/* Search */}
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search templates..."
            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded focus:border-blue-500 focus:outline-none text-sm"
          />

          {/* Category Tabs */}
          <div className="flex gap-2">
            {categories.map(category => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                  selectedCategory === category.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                }`}
              >
                {category.label}
              </button>
            ))}
          </div>
        </div>

        {/* Template Grid */}
        <div className="flex-1 overflow-y-auto p-6">
          {filteredTemplates.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <p>No templates found</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredTemplates.map(template => (
                <button
                  key={template.id}
                  onClick={() => {
                    onSelectTemplate(template);
                    onClose();
                  }}
                  className="bg-gray-800 rounded-lg p-4 hover:bg-gray-750 transition-colors border-2 border-gray-700 hover:border-blue-500 text-left group"
                >
                  {/* Preview Icon */}
                  <div className="text-4xl mb-3">{template.preview}</div>

                  {/* Name */}
                  <h4 className="font-semibold text-white group-hover:text-blue-400 transition-colors">
                    {template.name}
                  </h4>

                  {/* Description */}
                  <p className="text-sm text-gray-400 mt-1">
                    {template.description}
                  </p>

                  {/* Category Badge */}
                  <div className="mt-3">
                    <span className="inline-block px-2 py-0.5 bg-gray-700 rounded text-xs text-gray-300">
                      {template.category}
                    </span>
                  </div>

                  {/* Preview Colors */}
                  <div className="flex gap-1 mt-3">
                    <div
                      className="w-6 h-6 rounded border border-gray-600"
                      style={{ backgroundColor: template.settings.typography?.titleColor }}
                      title="Title color"
                    />
                    <div
                      className="w-6 h-6 rounded border border-gray-600"
                      style={{ backgroundColor: template.settings.typography?.messageColor }}
                      title="Message color"
                    />
                    {template.settings.background?.type === 'color' && template.settings.background.color && (
                      <div
                        className="w-6 h-6 rounded border border-gray-600"
                        style={{
                          backgroundColor: `rgb(${template.settings.background.color.r}, ${template.settings.background.color.g}, ${template.settings.background.color.b})`
                        }}
                        title="Background color"
                      />
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-800 flex items-center justify-between">
          <p className="text-sm text-gray-400">
            {filteredTemplates.length} template{filteredTemplates.length !== 1 ? 's' : ''} available
          </p>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-800 text-gray-300 rounded hover:bg-gray-700 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
