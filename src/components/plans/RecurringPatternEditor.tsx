import React, { useState } from 'react';
import {
  Calendar,
  Repeat,
  Clock,
  AlertCircle,
  Check,
  X,
  ChevronDown,
  ChevronRight
} from 'lucide-react';

/**
 * RecurringPatternEditor Component
 *
 * Configure recurring service patterns:
 * - Daily/Weekly/Monthly/Yearly patterns
 * - Custom repeat intervals
 * - End date or occurrence count
 * - Day of week selection
 * - Exception dates
 * - Auto-generation of service plans
 */

export interface RecurringPattern {
  id?: string;
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly' | 'custom';
  interval: number; // e.g., every 2 weeks
  daysOfWeek?: number[]; // 0-6 (Sunday-Saturday) for weekly
  dayOfMonth?: number; // 1-31 for monthly
  monthOfYear?: number; // 1-12 for yearly
  endType: 'never' | 'date' | 'count';
  endDate?: Date;
  occurrenceCount?: number;
  exceptionDates?: Date[]; // Dates to skip
  enabled: boolean;
}

interface RecurringPatternEditorProps {
  pattern?: RecurringPattern;
  onSave: (pattern: RecurringPattern) => void;
  onCancel: () => void;
  className?: string;
}

const FREQUENCY_OPTIONS = [
  { value: 'daily', label: 'Daily', description: 'Repeat every day' },
  { value: 'weekly', label: 'Weekly', description: 'Repeat on specific days of the week' },
  { value: 'monthly', label: 'Monthly', description: 'Repeat on a specific day each month' },
  { value: 'yearly', label: 'Yearly', description: 'Repeat on a specific date each year' },
  { value: 'custom', label: 'Custom', description: 'Custom repeat pattern' }
] as const;

const DAYS_OF_WEEK = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday'
];

export const RecurringPatternEditor: React.FC<RecurringPatternEditorProps> = ({
  pattern,
  onSave,
  onCancel,
  className = ''
}) => {
  const [formData, setFormData] = useState<RecurringPattern>(
    pattern || {
      frequency: 'weekly',
      interval: 1,
      daysOfWeek: [0], // Default to Sunday
      endType: 'never',
      enabled: true
    }
  );

  const [showAdvanced, setShowAdvanced] = useState(false);
  const [exceptionDateInput, setExceptionDateInput] = useState('');
  const [errors, setErrors] = useState<string[]>([]);

  const handleSave = () => {
    const newErrors: string[] = [];

    // Validation
    if (formData.interval < 1) {
      newErrors.push('Interval must be at least 1');
    }

    if (formData.frequency === 'weekly' && (!formData.daysOfWeek || formData.daysOfWeek.length === 0)) {
      newErrors.push('Select at least one day of the week');
    }

    if (formData.frequency === 'monthly' && (!formData.dayOfMonth || formData.dayOfMonth < 1 || formData.dayOfMonth > 31)) {
      newErrors.push('Day of month must be between 1 and 31');
    }

    if (formData.frequency === 'yearly') {
      if (!formData.monthOfYear || formData.monthOfYear < 1 || formData.monthOfYear > 12) {
        newErrors.push('Month must be between 1 and 12');
      }
      if (!formData.dayOfMonth || formData.dayOfMonth < 1 || formData.dayOfMonth > 31) {
        newErrors.push('Day must be between 1 and 31');
      }
    }

    if (formData.endType === 'date' && !formData.endDate) {
      newErrors.push('End date is required');
    }

    if (formData.endType === 'count' && (!formData.occurrenceCount || formData.occurrenceCount < 1)) {
      newErrors.push('Occurrence count must be at least 1');
    }

    if (newErrors.length > 0) {
      setErrors(newErrors);
      return;
    }

    onSave(formData);
  };

  const toggleDayOfWeek = (day: number) => {
    const current = formData.daysOfWeek || [];
    const updated = current.includes(day)
      ? current.filter((d) => d !== day)
      : [...current, day].sort();
    setFormData({ ...formData, daysOfWeek: updated });
  };

  const addExceptionDate = () => {
    if (!exceptionDateInput) return;

    const date = new Date(exceptionDateInput);
    if (isNaN(date.getTime())) return;

    const current = formData.exceptionDates || [];
    setFormData({
      ...formData,
      exceptionDates: [...current, date]
    });
    setExceptionDateInput('');
  };

  const removeExceptionDate = (index: number) => {
    const current = formData.exceptionDates || [];
    setFormData({
      ...formData,
      exceptionDates: current.filter((_, i) => i !== index)
    });
  };

  const getPatternSummary = (): string => {
    const parts: string[] = [];

    // Frequency
    if (formData.interval === 1) {
      parts.push(`Every ${formData.frequency.toLowerCase()}`);
    } else {
      parts.push(`Every ${formData.interval} ${formData.frequency.toLowerCase()}s`);
    }

    // Days/Date details
    if (formData.frequency === 'weekly' && formData.daysOfWeek && formData.daysOfWeek.length > 0) {
      const dayNames = formData.daysOfWeek.map((d) => DAYS_OF_WEEK[d]).join(', ');
      parts.push(`on ${dayNames}`);
    }

    if (formData.frequency === 'monthly' && formData.dayOfMonth) {
      parts.push(`on day ${formData.dayOfMonth}`);
    }

    if (formData.frequency === 'yearly' && formData.monthOfYear && formData.dayOfMonth) {
      const date = new Date(2000, formData.monthOfYear - 1, formData.dayOfMonth);
      parts.push(`on ${date.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}`);
    }

    // End condition
    if (formData.endType === 'date' && formData.endDate) {
      parts.push(`until ${new Date(formData.endDate).toLocaleDateString()}`);
    } else if (formData.endType === 'count' && formData.occurrenceCount) {
      parts.push(`for ${formData.occurrenceCount} occurrence${formData.occurrenceCount !== 1 ? 's' : ''}`);
    }

    return parts.join(' ');
  };

  return (
    <div className={`bg-gray-900 border border-gray-700 rounded-lg p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Repeat className="w-6 h-6 text-blue-400" />
          <div>
            <h3 className="text-lg font-medium text-white">Recurring Pattern</h3>
            <div className="text-sm text-gray-400">Configure automatic service scheduling</div>
          </div>
        </div>

        {/* Enable/Disable Toggle */}
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={formData.enabled}
            onChange={(e) => setFormData({ ...formData, enabled: e.target.checked })}
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          <span className="ml-3 text-sm font-medium text-gray-300">
            {formData.enabled ? 'Enabled' : 'Disabled'}
          </span>
        </label>
      </div>

      {/* Errors */}
      {errors.length > 0 && (
        <div className="mb-4 p-3 bg-red-900/20 border border-red-500/50 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle className="w-5 h-5 text-red-400" />
            <span className="font-medium text-red-400">Validation Errors</span>
          </div>
          <ul className="list-disc list-inside space-y-1 text-sm text-red-300">
            {errors.map((error, index) => (
              <li key={index}>{error}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Frequency Selection */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-300 mb-3">Repeat Pattern</label>
        <div className="grid grid-cols-2 gap-3">
          {FREQUENCY_OPTIONS.map((option) => (
            <button
              key={option.value}
              onClick={() =>
                setFormData({
                  ...formData,
                  frequency: option.value,
                  daysOfWeek: option.value === 'weekly' ? [0] : undefined,
                  dayOfMonth: option.value === 'monthly' || option.value === 'yearly' ? 1 : undefined,
                  monthOfYear: option.value === 'yearly' ? 1 : undefined
                })
              }
              className={`
                p-3 rounded-lg border-2 text-left transition-all
                ${
                  formData.frequency === option.value
                    ? 'border-blue-500 bg-blue-900/30'
                    : 'border-gray-700 bg-gray-800 hover:border-gray-600'
                }
              `}
            >
              <div className="font-medium text-white">{option.label}</div>
              <div className="text-xs text-gray-400 mt-1">{option.description}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Interval */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Repeat Every {formData.frequency === 'custom' ? 'N' : ''} {formData.frequency === 'custom' ? 'Days' : ''}
        </label>
        <div className="flex items-center gap-3">
          <input
            type="number"
            min="1"
            value={formData.interval}
            onChange={(e) => setFormData({ ...formData, interval: parseInt(e.target.value) || 1 })}
            className="w-24 px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white focus:outline-none focus:border-blue-500"
          />
          <span className="text-gray-400">
            {formData.frequency === 'custom' ? 'days' : formData.frequency + (formData.interval !== 1 ? 's' : '')}
          </span>
        </div>
      </div>

      {/* Weekly: Days of Week */}
      {formData.frequency === 'weekly' && (
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-300 mb-3">Repeat On</label>
          <div className="flex gap-2 flex-wrap">
            {DAYS_OF_WEEK.map((day, index) => {
              const isSelected = formData.daysOfWeek?.includes(index);
              return (
                <button
                  key={index}
                  onClick={() => toggleDayOfWeek(index)}
                  className={`
                    px-4 py-2 rounded-lg border-2 transition-all
                    ${
                      isSelected
                        ? 'border-blue-500 bg-blue-900/30 text-white'
                        : 'border-gray-700 bg-gray-800 text-gray-400 hover:border-gray-600'
                    }
                  `}
                >
                  {day.slice(0, 3)}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Monthly: Day of Month */}
      {formData.frequency === 'monthly' && (
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-300 mb-2">Day of Month</label>
          <input
            type="number"
            min="1"
            max="31"
            value={formData.dayOfMonth || 1}
            onChange={(e) => setFormData({ ...formData, dayOfMonth: parseInt(e.target.value) || 1 })}
            className="w-24 px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white focus:outline-none focus:border-blue-500"
          />
        </div>
      )}

      {/* Yearly: Month and Day */}
      {formData.frequency === 'yearly' && (
        <div className="mb-6 grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Month</label>
            <select
              value={formData.monthOfYear || 1}
              onChange={(e) => setFormData({ ...formData, monthOfYear: parseInt(e.target.value) })}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white focus:outline-none focus:border-blue-500"
            >
              {Array.from({ length: 12 }, (_, i) => {
                const date = new Date(2000, i, 1);
                return (
                  <option key={i + 1} value={i + 1}>
                    {date.toLocaleDateString('en-US', { month: 'long' })}
                  </option>
                );
              })}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Day</label>
            <input
              type="number"
              min="1"
              max="31"
              value={formData.dayOfMonth || 1}
              onChange={(e) => setFormData({ ...formData, dayOfMonth: parseInt(e.target.value) || 1 })}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>
      )}

      {/* End Condition */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-300 mb-3">Ends</label>
        <div className="space-y-3">
          {/* Never */}
          <label className="flex items-center gap-3 p-3 bg-gray-800 rounded-lg border-2 border-transparent hover:border-gray-700 cursor-pointer">
            <input
              type="radio"
              name="endType"
              checked={formData.endType === 'never'}
              onChange={() => setFormData({ ...formData, endType: 'never' })}
              className="w-4 h-4"
            />
            <div>
              <div className="text-white font-medium">Never</div>
              <div className="text-xs text-gray-400">Continue indefinitely</div>
            </div>
          </label>

          {/* On Date */}
          <label className="flex items-center gap-3 p-3 bg-gray-800 rounded-lg border-2 border-transparent hover:border-gray-700 cursor-pointer">
            <input
              type="radio"
              name="endType"
              checked={formData.endType === 'date'}
              onChange={() => setFormData({ ...formData, endType: 'date' })}
              className="w-4 h-4"
            />
            <div className="flex-1">
              <div className="text-white font-medium mb-2">On Date</div>
              {formData.endType === 'date' && (
                <input
                  type="date"
                  value={
                    formData.endDate
                      ? new Date(formData.endDate).toISOString().split('T')[0]
                      : ''
                  }
                  onChange={(e) =>
                    setFormData({ ...formData, endDate: new Date(e.target.value) })
                  }
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:border-blue-500"
                />
              )}
            </div>
          </label>

          {/* After N Occurrences */}
          <label className="flex items-center gap-3 p-3 bg-gray-800 rounded-lg border-2 border-transparent hover:border-gray-700 cursor-pointer">
            <input
              type="radio"
              name="endType"
              checked={formData.endType === 'count'}
              onChange={() => setFormData({ ...formData, endType: 'count' })}
              className="w-4 h-4"
            />
            <div className="flex-1">
              <div className="text-white font-medium mb-2">After Occurrences</div>
              {formData.endType === 'count' && (
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="1"
                    value={formData.occurrenceCount || 1}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        occurrenceCount: parseInt(e.target.value) || 1
                      })
                    }
                    className="w-24 px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:border-blue-500"
                  />
                  <span className="text-gray-400">occurrences</span>
                </div>
              )}
            </div>
          </label>
        </div>
      </div>

      {/* Advanced Options */}
      <div className="mb-6">
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors"
        >
          {showAdvanced ? (
            <ChevronDown className="w-4 h-4" />
          ) : (
            <ChevronRight className="w-4 h-4" />
          )}
          Advanced Options
        </button>

        {showAdvanced && (
          <div className="mt-3 p-4 bg-gray-800 rounded-lg border border-gray-700">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Exception Dates
            </label>
            <div className="text-xs text-gray-400 mb-3">
              Skip occurrences on specific dates (holidays, special events, etc.)
            </div>

            {/* Exception Date List */}
            {formData.exceptionDates && formData.exceptionDates.length > 0 && (
              <div className="space-y-2 mb-3">
                {formData.exceptionDates.map((date, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-2 bg-gray-900 rounded"
                  >
                    <span className="text-white text-sm">
                      {new Date(date).toLocaleDateString()}
                    </span>
                    <button
                      onClick={() => removeExceptionDate(index)}
                      className="p-1 text-red-400 hover:text-red-300"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Add Exception Date */}
            <div className="flex gap-2">
              <input
                type="date"
                value={exceptionDateInput}
                onChange={(e) => setExceptionDateInput(e.target.value)}
                className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:border-blue-500"
              />
              <button
                onClick={addExceptionDate}
                disabled={!exceptionDateInput}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Add
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Summary */}
      <div className="mb-6 p-4 bg-blue-900/20 border border-blue-500/30 rounded-lg">
        <div className="flex items-center gap-2 mb-2">
          <Calendar className="w-4 h-4 text-blue-400" />
          <span className="text-sm font-medium text-blue-300">Pattern Summary</span>
        </div>
        <div className="text-white">{getPatternSummary()}</div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3">
        <button
          onClick={onCancel}
          className="px-4 py-2 text-gray-300 border border-gray-600 rounded hover:bg-gray-700 transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
        >
          <Check className="w-4 h-4" />
          Save Pattern
        </button>
      </div>
    </div>
  );
};

export default RecurringPatternEditor;
