import React, { useState } from 'react';
import {
  Download,
  FileText,
  File,
  FileCode,
  Table,
  Printer,
  X,
  Check,
  Settings,
  ChevronDown,
  ChevronRight
} from 'lucide-react';
import { PlanExportData, ExportOptions, exportPlan } from '../../utils/planExporter';

/**
 * PlanExportModal Component
 *
 * Modal for exporting service plans in various formats:
 * - Format selection (PDF, Text, HTML, JSON, CSV)
 * - Export options (what to include)
 * - Layout preferences
 * - Preview before export
 */

interface PlanExportModalProps {
  planData: PlanExportData;
  onClose: () => void;
  className?: string;
}

const EXPORT_FORMATS: Array<{
  value: ExportOptions['format'];
  label: string;
  description: string;
  icon: React.ComponentType<any>;
}> = [
  {
    value: 'pdf',
    label: 'PDF Document',
    description: 'Print-friendly PDF document (via print-to-PDF)',
    icon: Printer
  },
  {
    value: 'html',
    label: 'HTML',
    description: 'Web page format with styling',
    icon: FileCode
  },
  {
    value: 'text',
    label: 'Plain Text',
    description: 'Simple text file without formatting',
    icon: FileText
  },
  {
    value: 'json',
    label: 'JSON',
    description: 'Structured data format for import/backup',
    icon: File
  },
  {
    value: 'csv',
    label: 'CSV Spreadsheet',
    description: 'Spreadsheet format (Excel, Google Sheets)',
    icon: Table
  }
];

export const PlanExportModal: React.FC<PlanExportModalProps> = ({
  planData,
  onClose,
  className = ''
}) => {
  const [selectedFormat, setSelectedFormat] = useState<ExportOptions['format']>('html');
  const [exportOptions, setExportOptions] = useState<ExportOptions>({
    format: 'html',
    includeNotes: true,
    includeOperatorNotes: false,
    includeSpeakerNotes: false,
    includeCues: false,
    includeTimestamps: true,
    includeAssignees: true,
    layout: 'detailed',
    fontSize: 'medium'
  });
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);

  const handleExport = async () => {
    setExporting(true);
    setExportSuccess(false);

    try {
      const options = { ...exportOptions, format: selectedFormat };
      const success = await exportPlan(planData, options);

      if (success) {
        setExportSuccess(true);
        setTimeout(() => {
          onClose();
        }, 1500);
      }
    } catch (error) {
      console.error('Export failed:', error);
      alert('Export failed. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  const handleFormatChange = (format: ExportOptions['format']) => {
    setSelectedFormat(format);
    setExportOptions({ ...exportOptions, format });
  };

  const toggleOption = (key: keyof ExportOptions) => {
    setExportOptions({
      ...exportOptions,
      [key]: !exportOptions[key]
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className={`bg-gray-800 rounded-lg border border-gray-700 w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col ${className}`}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <div className="flex items-center gap-3">
            <Download className="w-6 h-6 text-blue-400" />
            <div>
              <h2 className="text-xl font-medium text-white">Export Plan</h2>
              <div className="text-sm text-gray-400 mt-1">{planData.planTitle}</div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Format Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-300 mb-3">
              Export Format
            </label>
            <div className="grid grid-cols-1 gap-2">
              {EXPORT_FORMATS.map((format) => {
                const Icon = format.icon;
                return (
                  <button
                    key={format.value}
                    onClick={() => handleFormatChange(format.value)}
                    className={`
                      flex items-center gap-3 p-4 rounded-lg border-2 text-left transition-all
                      ${
                        selectedFormat === format.value
                          ? 'border-blue-500 bg-blue-900/30'
                          : 'border-gray-700 bg-gray-900 hover:border-gray-600'
                      }
                    `}
                  >
                    <Icon className="w-5 h-5 text-gray-400" />
                    <div className="flex-1">
                      <div className="font-medium text-white">{format.label}</div>
                      <div className="text-xs text-gray-400 mt-1">{format.description}</div>
                    </div>
                    {selectedFormat === format.value && (
                      <Check className="w-5 h-5 text-blue-400" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Export Options */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-300 mb-3">
              Include in Export
            </label>
            <div className="space-y-2">
              <label className="flex items-center gap-3 p-3 bg-gray-900 rounded cursor-pointer hover:bg-gray-800 transition-colors">
                <input
                  type="checkbox"
                  checked={exportOptions.includeNotes}
                  onChange={() => toggleOption('includeNotes')}
                  className="w-4 h-4 rounded"
                />
                <div className="flex-1">
                  <div className="text-white">General Notes</div>
                  <div className="text-xs text-gray-400">Include item notes and descriptions</div>
                </div>
              </label>

              <label className="flex items-center gap-3 p-3 bg-gray-900 rounded cursor-pointer hover:bg-gray-800 transition-colors">
                <input
                  type="checkbox"
                  checked={exportOptions.includeOperatorNotes}
                  onChange={() => toggleOption('includeOperatorNotes')}
                  className="w-4 h-4 rounded"
                />
                <div className="flex-1">
                  <div className="text-white">Operator Notes</div>
                  <div className="text-xs text-gray-400">
                    Include technical notes for booth operators
                  </div>
                </div>
              </label>

              <label className="flex items-center gap-3 p-3 bg-gray-900 rounded cursor-pointer hover:bg-gray-800 transition-colors">
                <input
                  type="checkbox"
                  checked={exportOptions.includeSpeakerNotes}
                  onChange={() => toggleOption('includeSpeakerNotes')}
                  className="w-4 h-4 rounded"
                />
                <div className="flex-1">
                  <div className="text-white">Speaker Notes</div>
                  <div className="text-xs text-gray-400">
                    Include notes for presenters and speakers
                  </div>
                </div>
              </label>

              <label className="flex items-center gap-3 p-3 bg-gray-900 rounded cursor-pointer hover:bg-gray-800 transition-colors">
                <input
                  type="checkbox"
                  checked={exportOptions.includeCues}
                  onChange={() => toggleOption('includeCues')}
                  className="w-4 h-4 rounded"
                />
                <div className="flex-1">
                  <div className="text-white">Technical Cues</div>
                  <div className="text-xs text-gray-400">
                    Include lighting, sound, and media cues
                  </div>
                </div>
              </label>

              <label className="flex items-center gap-3 p-3 bg-gray-900 rounded cursor-pointer hover:bg-gray-800 transition-colors">
                <input
                  type="checkbox"
                  checked={exportOptions.includeAssignees}
                  onChange={() => toggleOption('includeAssignees')}
                  className="w-4 h-4 rounded"
                />
                <div className="flex-1">
                  <div className="text-white">Assignees</div>
                  <div className="text-xs text-gray-400">
                    Include who is responsible for each item
                  </div>
                </div>
              </label>

              <label className="flex items-center gap-3 p-3 bg-gray-900 rounded cursor-pointer hover:bg-gray-800 transition-colors">
                <input
                  type="checkbox"
                  checked={exportOptions.includeTimestamps}
                  onChange={() => toggleOption('includeTimestamps')}
                  className="w-4 h-4 rounded"
                />
                <div className="flex-1">
                  <div className="text-white">Timestamps</div>
                  <div className="text-xs text-gray-400">Include creation and modification times</div>
                </div>
              </label>
            </div>
          </div>

          {/* Advanced Options */}
          {(selectedFormat === 'html' || selectedFormat === 'pdf') && (
            <div className="mb-6">
              <button
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="flex items-center gap-2 text-sm font-medium text-gray-300 hover:text-white transition-colors mb-3"
              >
                {showAdvanced ? (
                  <ChevronDown className="w-4 h-4" />
                ) : (
                  <ChevronRight className="w-4 h-4" />
                )}
                Advanced Options
              </button>

              {showAdvanced && (
                <div className="space-y-4 p-4 bg-gray-900 rounded-lg border border-gray-700">
                  {/* Layout */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Layout Style
                    </label>
                    <select
                      value={exportOptions.layout}
                      onChange={(e) =>
                        setExportOptions({
                          ...exportOptions,
                          layout: e.target.value as any
                        })
                      }
                      className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white focus:outline-none focus:border-blue-500"
                    >
                      <option value="compact">Compact</option>
                      <option value="detailed">Detailed</option>
                      <option value="printable">Printable</option>
                    </select>
                  </div>

                  {/* Font Size */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Font Size
                    </label>
                    <select
                      value={exportOptions.fontSize}
                      onChange={(e) =>
                        setExportOptions({
                          ...exportOptions,
                          fontSize: e.target.value as any
                        })
                      }
                      className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white focus:outline-none focus:border-blue-500"
                    >
                      <option value="small">Small</option>
                      <option value="medium">Medium</option>
                      <option value="large">Large</option>
                    </select>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Export Summary */}
          <div className="p-4 bg-blue-900/20 border border-blue-500/30 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Settings className="w-4 h-4 text-blue-400" />
              <span className="text-sm font-medium text-blue-300">Export Summary</span>
            </div>
            <div className="text-sm text-gray-300 space-y-1">
              <div>Format: <span className="text-white font-medium">{EXPORT_FORMATS.find(f => f.value === selectedFormat)?.label}</span></div>
              <div>Items: <span className="text-white font-medium">{planData.itemCount}</span></div>
              <div>Duration: <span className="text-white font-medium">{planData.totalDuration} minutes</span></div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-3 p-6 border-t border-gray-700 bg-gray-900">
          <div className="text-sm text-gray-400">
            {exportSuccess ? (
              <div className="flex items-center gap-2 text-green-400">
                <Check className="w-4 h-4" />
                <span>Export successful!</span>
              </div>
            ) : (
              <span>Export will download to your device</span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              disabled={exporting}
              className="px-4 py-2 text-gray-300 border border-gray-600 rounded hover:bg-gray-700 disabled:opacity-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleExport}
              disabled={exporting || exportSuccess}
              className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {exporting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Exporting...</span>
                </>
              ) : exportSuccess ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>Exported</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>Export</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlanExportModal;
