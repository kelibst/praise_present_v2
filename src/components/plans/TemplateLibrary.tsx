import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Calendar,
  Clock,
  Sun,
  Moon,
  Star,
  Heart,
  Gift,
  TreePine,
  Search,
  Filter,
  Plus,
  Copy,
  Edit3,
  Trash2,
  Eye,
  Check
} from 'lucide-react';

/**
 * TemplateLibrary Component
 *
 * Browse, preview, and apply service plan templates.
 * Includes seasonal templates, service type templates, and custom templates.
 */

export interface PlanTemplate {
  id: string;
  name: string;
  description?: string;
  category: 'seasonal' | 'service-type' | 'custom';
  subcategory?: string; // "Christmas", "Sunday Morning", etc.
  items: TemplateItem[];
  tags?: string[];
  isDefault?: boolean;
  createdAt: Date;
  updatedAt: Date;
  usageCount?: number;
}

export interface TemplateItem {
  type: 'song' | 'scripture' | 'presentation' | 'announcement' | 'media' | 'transition';
  title: string;
  duration?: number;
  notes?: string;
  order: number;
  // Template variables: {SONG_1}, {SERMON_TITLE}, etc.
  variables?: Record<string, string>;
}

interface TemplateLibraryProps {
  onApplyTemplate: (template: PlanTemplate) => void;
  onEditTemplate?: (template: PlanTemplate) => void;
  onDeleteTemplate?: (templateId: string) => void;
  className?: string;
}

// Predefined seasonal templates
const SEASONAL_TEMPLATES: PlanTemplate[] = [
  {
    id: 'christmas-service',
    name: 'Christmas Service',
    description: 'Traditional Christmas celebration service',
    category: 'seasonal',
    subcategory: 'Christmas',
    tags: ['christmas', 'holiday', 'celebration'],
    isDefault: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    items: [
      { type: 'announcement', title: 'Welcome & Christmas Greeting', duration: 3, order: 0 },
      { type: 'song', title: '{OPENING_CAROL}', duration: 5, order: 1, variables: { OPENING_CAROL: 'O Come All Ye Faithful' } },
      { type: 'song', title: '{WORSHIP_SONG_1}', duration: 5, order: 2 },
      { type: 'scripture', title: 'Christmas Reading - Luke 2:1-20', duration: 5, order: 3 },
      { type: 'song', title: '{CHRISTMAS_HYMN}', duration: 5, order: 4, variables: { CHRISTMAS_HYMN: 'Silent Night' } },
      { type: 'presentation', title: '{SERMON_TITLE}', duration: 30, order: 5, variables: { SERMON_TITLE: 'The Gift of Jesus' } },
      { type: 'song', title: '{CLOSING_SONG}', duration: 5, order: 6 },
      { type: 'announcement', title: 'Closing Prayer & Benediction', duration: 3, order: 7 }
    ]
  },
  {
    id: 'easter-service',
    name: 'Easter Celebration',
    description: 'Resurrection Sunday service',
    category: 'seasonal',
    subcategory: 'Easter',
    tags: ['easter', 'resurrection', 'celebration'],
    isDefault: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    items: [
      { type: 'announcement', title: 'Easter Welcome', duration: 3, order: 0 },
      { type: 'song', title: '{RESURRECTION_SONG}', duration: 5, order: 1, variables: { RESURRECTION_SONG: 'Christ the Lord is Risen Today' } },
      { type: 'song', title: '{WORSHIP_SONG_1}', duration: 5, order: 2 },
      { type: 'scripture', title: 'Resurrection Account', duration: 5, order: 3 },
      { type: 'presentation', title: '{SERMON_TITLE}', duration: 30, order: 4, variables: { SERMON_TITLE: 'He Is Risen!' } },
      { type: 'song', title: '{CLOSING_SONG}', duration: 5, order: 5 },
      { type: 'announcement', title: 'Closing & Benediction', duration: 3, order: 6 }
    ]
  },
  {
    id: 'thanksgiving-service',
    name: 'Thanksgiving Service',
    description: 'Service of gratitude and thanksgiving',
    category: 'seasonal',
    subcategory: 'Thanksgiving',
    tags: ['thanksgiving', 'gratitude', 'harvest'],
    isDefault: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    items: [
      { type: 'announcement', title: 'Thanksgiving Welcome', duration: 3, order: 0 },
      { type: 'song', title: '{THANKSGIVING_SONG}', duration: 5, order: 1, variables: { THANKSGIVING_SONG: 'Come Ye Thankful People Come' } },
      { type: 'scripture', title: 'Psalm of Thanksgiving', duration: 5, order: 2 },
      { type: 'song', title: '{WORSHIP_SONG}', duration: 5, order: 3 },
      { type: 'presentation', title: '{SERMON_TITLE}', duration: 25, order: 4, variables: { SERMON_TITLE: 'A Heart of Gratitude' } },
      { type: 'song', title: '{CLOSING_SONG}', duration: 5, order: 5 },
      { type: 'announcement', title: 'Closing Prayer', duration: 3, order: 6 }
    ]
  }
];

// Service type templates
const SERVICE_TYPE_TEMPLATES: PlanTemplate[] = [
  {
    id: 'sunday-morning',
    name: 'Sunday Morning Service',
    description: 'Standard Sunday morning worship service',
    category: 'service-type',
    subcategory: 'Sunday Morning',
    tags: ['sunday', 'morning', 'worship'],
    isDefault: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    items: [
      { type: 'announcement', title: 'Welcome & Announcements', duration: 5, order: 0 },
      { type: 'song', title: '{WORSHIP_SONG_1}', duration: 5, order: 1 },
      { type: 'song', title: '{WORSHIP_SONG_2}', duration: 5, order: 2 },
      { type: 'announcement', title: 'Opening Prayer', duration: 2, order: 3 },
      { type: 'scripture', title: '{SCRIPTURE_READING}', duration: 3, order: 4 },
      { type: 'presentation', title: '{SERMON_TITLE}', duration: 30, order: 5 },
      { type: 'song', title: '{RESPONSE_SONG}', duration: 5, order: 6 },
      { type: 'announcement', title: 'Closing & Benediction', duration: 3, order: 7 }
    ]
  },
  {
    id: 'worship-night',
    name: 'Worship Night',
    description: 'Extended worship and prayer evening',
    category: 'service-type',
    subcategory: 'Evening Worship',
    tags: ['worship', 'evening', 'prayer'],
    isDefault: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    items: [
      { type: 'announcement', title: 'Welcome', duration: 2, order: 0 },
      { type: 'song', title: '{WORSHIP_SET_1}', duration: 15, order: 1 },
      { type: 'announcement', title: 'Prayer Time', duration: 10, order: 2 },
      { type: 'song', title: '{WORSHIP_SET_2}', duration: 15, order: 3 },
      { type: 'announcement', title: 'Testimony/Sharing', duration: 10, order: 4 },
      { type: 'song', title: '{CLOSING_WORSHIP}', duration: 10, order: 5 },
      { type: 'announcement', title: 'Benediction', duration: 2, order: 6 }
    ]
  },
  {
    id: 'bible-study',
    name: 'Bible Study',
    description: 'Midweek Bible study format',
    category: 'service-type',
    subcategory: 'Bible Study',
    tags: ['bible-study', 'midweek', 'teaching'],
    isDefault: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    items: [
      { type: 'announcement', title: 'Welcome & Opening Prayer', duration: 3, order: 0 },
      { type: 'song', title: '{WORSHIP_SONG}', duration: 5, order: 1 },
      { type: 'scripture', title: '{STUDY_PASSAGE}', duration: 5, order: 2 },
      { type: 'presentation', title: '{TEACHING_TOPIC}', duration: 30, order: 3 },
      { type: 'announcement', title: 'Discussion/Q&A', duration: 15, order: 4 },
      { type: 'announcement', title: 'Closing Prayer', duration: 2, order: 5 }
    ]
  }
];

const CATEGORY_ICONS: Record<string, React.ComponentType<any>> = {
  'Christmas': TreePine,
  'Easter': Star,
  'Thanksgiving': Gift,
  'Sunday Morning': Sun,
  'Evening Worship': Moon,
  'Bible Study': Heart,
  'default': Calendar
};

export const TemplateLibrary: React.FC<TemplateLibraryProps> = ({
  onApplyTemplate,
  onEditTemplate,
  onDeleteTemplate,
  className = ''
}) => {
  const [templates, setTemplates] = useState<PlanTemplate[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [previewTemplate, setPreviewTemplate] = useState<PlanTemplate | null>(null);

  // Load templates
  useEffect(() => {
    const allTemplates = [
      ...SEASONAL_TEMPLATES,
      ...SERVICE_TYPE_TEMPLATES
    ];
    setTemplates(allTemplates);
  }, []);

  // Filter templates
  const filteredTemplates = templates.filter(template => {
    const matchesSearch =
      template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesCategory =
      selectedCategory === 'all' ||
      template.category === selectedCategory ||
      template.subcategory === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  // Get unique categories
  const categories = [
    { value: 'all', label: 'All Templates', count: templates.length },
    { value: 'seasonal', label: 'Seasonal', count: templates.filter(t => t.category === 'seasonal').length },
    { value: 'service-type', label: 'Service Types', count: templates.filter(t => t.category === 'service-type').length },
    { value: 'custom', label: 'Custom', count: templates.filter(t => t.category === 'custom').length }
  ];

  // Render template card
  const renderTemplateCard = (template: PlanTemplate) => {
    const Icon = CATEGORY_ICONS[template.subcategory || 'default'] || CATEGORY_ICONS.default;

    return (
      <div
        key={template.id}
        className="bg-gray-800 rounded-lg border-2 border-gray-700 hover:border-blue-500 transition-all cursor-pointer overflow-hidden"
      >
        {/* Header */}
        <div className="p-4 border-b border-gray-700">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-blue-900/30 rounded-lg">
              <Icon className="w-6 h-6 text-blue-400" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-white mb-1">{template.name}</h3>
              {template.description && (
                <p className="text-sm text-gray-400 line-clamp-2">{template.description}</p>
              )}
              <div className="flex items-center gap-2 mt-2">
                <span className="text-xs px-2 py-1 bg-gray-700 rounded-full text-gray-300">
                  {template.subcategory}
                </span>
                <span className="text-xs text-gray-500">
                  {template.items.length} items
                </span>
                <span className="text-xs text-gray-500">
                  ~{template.items.reduce((sum, item) => sum + (item.duration || 0), 0)} min
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="p-3 bg-gray-900/50 flex items-center gap-2">
          <button
            onClick={() => setPreviewTemplate(template)}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-gray-700 text-white rounded hover:bg-gray-600 transition-colors text-sm"
          >
            <Eye className="w-4 h-4" />
            Preview
          </button>
          <button
            onClick={() => onApplyTemplate(template)}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-sm"
          >
            <Check className="w-4 h-4" />
            Use Template
          </button>
          {!template.isDefault && (
            <>
              {onEditTemplate && (
                <button
                  onClick={() => onEditTemplate(template)}
                  className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded transition-colors"
                  title="Edit template"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
              )}
              {onDeleteTemplate && (
                <button
                  onClick={() => onDeleteTemplate(template.id)}
                  className="p-2 text-red-400 hover:text-red-300 hover:bg-gray-700 rounded transition-colors"
                  title="Delete template"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className={`${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Sparkles className="w-6 h-6 text-blue-400" />
          <h2 className="text-2xl font-bold text-white">Template Library</h2>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="flex gap-3 mb-6">
        {/* Search */}
        <div className="flex-1 relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search templates..."
            className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
          />
        </div>

        {/* Category Filter */}
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="px-4 py-2 bg-gray-800 border border-gray-700 rounded text-white focus:outline-none focus:border-blue-500"
        >
          {categories.map(cat => (
            <option key={cat.value} value={cat.value}>
              {cat.label} ({cat.count})
            </option>
          ))}
        </select>
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredTemplates.length === 0 ? (
          <div className="col-span-full p-12 bg-gray-900/30 rounded-lg border border-gray-700 text-center">
            <Sparkles className="w-12 h-12 mx-auto mb-3 text-gray-600" />
            <p className="text-gray-400">No templates found matching your criteria</p>
          </div>
        ) : (
          filteredTemplates.map(template => renderTemplateCard(template))
        )}
      </div>

      {/* Preview Modal */}
      {previewTemplate && (
        <TemplatePreviewModal
          template={previewTemplate}
          onClose={() => setPreviewTemplate(null)}
          onApply={() => {
            onApplyTemplate(previewTemplate);
            setPreviewTemplate(null);
          }}
        />
      )}
    </div>
  );
};

// Template Preview Modal
interface TemplatePreviewModalProps {
  template: PlanTemplate;
  onClose: () => void;
  onApply: () => void;
}

const TemplatePreviewModal: React.FC<TemplatePreviewModalProps> = ({
  template,
  onClose,
  onApply
}) => {
  const Icon = CATEGORY_ICONS[template.subcategory || 'default'] || CATEGORY_ICONS.default;
  const totalDuration = template.items.reduce((sum, item) => sum + (item.duration || 0), 0);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-lg border border-gray-700 w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-700">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-blue-900/30 rounded-lg">
              <Icon className="w-8 h-8 text-blue-400" />
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold text-white mb-1">{template.name}</h2>
              {template.description && (
                <p className="text-gray-400">{template.description}</p>
              )}
              <div className="flex items-center gap-3 mt-3 text-sm">
                <span className="text-gray-400">
                  <Clock className="w-4 h-4 inline mr-1" />
                  {totalDuration} minutes
                </span>
                <span className="text-gray-400">
                  {template.items.length} items
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Items List */}
        <div className="flex-1 overflow-y-auto p-6">
          <h3 className="text-sm font-medium text-gray-400 uppercase mb-3">Template Items</h3>
          <div className="space-y-2">
            {template.items.map((item, index) => (
              <div key={index} className="flex items-center gap-3 p-3 bg-gray-900/50 rounded-lg">
                <span className="text-sm font-mono text-gray-500 w-6">{index + 1}</span>
                <div className="flex-1">
                  <div className="text-white font-medium">{item.title}</div>
                  <div className="text-xs text-gray-400 mt-1">
                    {item.type} {item.duration && `• ${item.duration} min`}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-700 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-300 border border-gray-600 rounded hover:bg-gray-700 transition-colors"
          >
            Close
          </button>
          <button
            onClick={onApply}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <Check className="w-4 h-4" />
            Use This Template
          </button>
        </div>
      </div>
    </div>
  );
};

export default TemplateLibrary;
