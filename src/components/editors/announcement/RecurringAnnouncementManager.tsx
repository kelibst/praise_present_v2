import React, { useState } from 'react';

export interface RecurrenceRule {
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
  interval: number; // every N days/weeks/months/years
  daysOfWeek?: number[]; // 0 = Sunday, 1 = Monday, etc.
  dayOfMonth?: number; // 1-31
  endDate?: Date;
  count?: number; // number of occurrences
}

interface RecurringAnnouncementManagerProps {
  recurrence?: RecurrenceRule;
  onChange: (recurrence: RecurrenceRule | undefined) => void;
  startDate?: Date;
}

export const RecurringAnnouncementManager: React.FC<RecurringAnnouncementManagerProps> = ({
  recurrence,
  onChange,
  startDate
}) => {
  const [enabled, setEnabled] = useState(!!recurrence);
  const [rule, setRule] = useState<RecurrenceRule>(
    recurrence || {
      frequency: 'weekly',
      interval: 1,
      daysOfWeek: [0] // Sunday
    }
  );

  const handleToggle = (checked: boolean) => {
    setEnabled(checked);
    if (checked) {
      onChange(rule);
    } else {
      onChange(undefined);
    }
  };

  const updateRule = (updates: Partial<RecurrenceRule>) => {
    const newRule = { ...rule, ...updates };
    setRule(newRule);
    if (enabled) {
      onChange(newRule);
    }
  };

  const weekdays = [
    { value: 0, label: 'Sun' },
    { value: 1, label: 'Mon' },
    { value: 2, label: 'Tue' },
    { value: 3, label: 'Wed' },
    { value: 4, label: 'Thu' },
    { value: 5, label: 'Fri' },
    { value: 6, label: 'Sat' }
  ];

  const toggleDayOfWeek = (day: number) => {
    const daysOfWeek = rule.daysOfWeek || [];
    const newDays = daysOfWeek.includes(day)
      ? daysOfWeek.filter(d => d !== day)
      : [...daysOfWeek, day].sort();

    updateRule({ daysOfWeek: newDays.length > 0 ? newDays : [0] });
  };

  const generatePreviewDates = (): Date[] => {
    if (!startDate || !enabled) return [];

    const dates: Date[] = [];
    const start = new Date(startDate);
    let current = new Date(start);

    for (let i = 0; i < 5; i++) {
      if (rule.frequency === 'daily') {
        current = new Date(start);
        current.setDate(start.getDate() + (i * rule.interval));
      } else if (rule.frequency === 'weekly') {
        if (rule.daysOfWeek && rule.daysOfWeek.length > 0) {
          const occurrences = rule.daysOfWeek.length;
          const weekNumber = Math.floor(i / occurrences);
          const dayIndex = i % occurrences;
          const targetDay = rule.daysOfWeek[dayIndex];

          current = new Date(start);
          current.setDate(start.getDate() + (weekNumber * 7 * rule.interval));

          const currentDay = current.getDay();
          const daysToAdd = (targetDay - currentDay + 7) % 7;
          current.setDate(current.getDate() + daysToAdd);
        }
      } else if (rule.frequency === 'monthly') {
        current = new Date(start);
        current.setMonth(start.getMonth() + (i * rule.interval));
        if (rule.dayOfMonth) {
          current.setDate(rule.dayOfMonth);
        }
      } else if (rule.frequency === 'yearly') {
        current = new Date(start);
        current.setFullYear(start.getFullYear() + (i * rule.interval));
      }

      if (rule.endDate && current > rule.endDate) break;
      if (rule.count && i >= rule.count) break;

      dates.push(new Date(current));
    }

    return dates;
  };

  const previewDates = generatePreviewDates();

  return (
    <div className="space-y-4 p-4 bg-gray-850 rounded-lg border border-gray-700">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium">Recurring Announcement</h4>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={enabled}
            onChange={(e) => handleToggle(e.target.checked)}
            className="w-4 h-4 rounded bg-gray-800 border-gray-700"
          />
          <span className="text-xs text-gray-400">Enable</span>
        </label>
      </div>

      {enabled && (
        <div className="space-y-4">
          {/* Frequency */}
          <div>
            <label className="block text-xs text-gray-400 mb-1">Repeats</label>
            <select
              value={rule.frequency}
              onChange={(e) => updateRule({ frequency: e.target.value as RecurrenceRule['frequency'] })}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-sm focus:border-blue-500 focus:outline-none"
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="yearly">Yearly</option>
            </select>
          </div>

          {/* Interval */}
          <div>
            <label className="block text-xs text-gray-400 mb-1">
              Every {rule.interval} {rule.frequency === 'daily' ? 'day(s)' : rule.frequency === 'weekly' ? 'week(s)' : rule.frequency === 'monthly' ? 'month(s)' : 'year(s)'}
            </label>
            <input
              type="number"
              min="1"
              max="52"
              value={rule.interval}
              onChange={(e) => updateRule({ interval: parseInt(e.target.value) || 1 })}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-sm focus:border-blue-500 focus:outline-none"
            />
          </div>

          {/* Days of Week (for weekly) */}
          {rule.frequency === 'weekly' && (
            <div>
              <label className="block text-xs text-gray-400 mb-2">Repeat on</label>
              <div className="flex gap-1">
                {weekdays.map(day => (
                  <button
                    key={day.value}
                    type="button"
                    onClick={() => toggleDayOfWeek(day.value)}
                    className={`flex-1 px-2 py-2 rounded text-xs font-medium transition-colors ${
                      rule.daysOfWeek?.includes(day.value)
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                    }`}
                  >
                    {day.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Day of Month (for monthly) */}
          {rule.frequency === 'monthly' && (
            <div>
              <label className="block text-xs text-gray-400 mb-1">Day of month (1-31)</label>
              <input
                type="number"
                min="1"
                max="31"
                value={rule.dayOfMonth || 1}
                onChange={(e) => updateRule({ dayOfMonth: parseInt(e.target.value) || 1 })}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-sm focus:border-blue-500 focus:outline-none"
              />
            </div>
          )}

          {/* End Condition */}
          <div>
            <label className="block text-xs text-gray-400 mb-2">Ends</label>
            <div className="space-y-2">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="endCondition"
                  checked={!rule.endDate && !rule.count}
                  onChange={() => updateRule({ endDate: undefined, count: undefined })}
                  className="w-4 h-4"
                />
                <span className="text-sm">Never</span>
              </label>

              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="endCondition"
                  checked={!!rule.endDate}
                  onChange={() => {
                    const futureDate = new Date();
                    futureDate.setMonth(futureDate.getMonth() + 3);
                    updateRule({ endDate: futureDate, count: undefined });
                  }}
                  className="w-4 h-4"
                />
                <span className="text-sm">On date</span>
                {rule.endDate && (
                  <input
                    type="date"
                    value={rule.endDate.toISOString().split('T')[0]}
                    onChange={(e) => updateRule({ endDate: new Date(e.target.value) })}
                    className="flex-1 px-2 py-1 bg-gray-800 border border-gray-700 rounded text-xs focus:border-blue-500 focus:outline-none"
                  />
                )}
              </label>

              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="endCondition"
                  checked={!!rule.count}
                  onChange={() => updateRule({ count: 10, endDate: undefined })}
                  className="w-4 h-4"
                />
                <span className="text-sm">After</span>
                {rule.count !== undefined && (
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={rule.count}
                    onChange={(e) => updateRule({ count: parseInt(e.target.value) || 1 })}
                    className="w-20 px-2 py-1 bg-gray-800 border border-gray-700 rounded text-xs focus:border-blue-500 focus:outline-none"
                  />
                )}
                <span className="text-sm">occurrences</span>
              </label>
            </div>
          </div>

          {/* Preview */}
          {previewDates.length > 0 && (
            <div className="mt-4 p-3 bg-gray-800 rounded border border-gray-700">
              <p className="text-xs font-medium text-gray-400 mb-2">Next occurrences:</p>
              <div className="space-y-1">
                {previewDates.map((date, i) => (
                  <div key={i} className="text-xs text-gray-300">
                    {i + 1}. {date.toLocaleDateString('en-US', {
                      weekday: 'short',
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric'
                    })}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {enabled && (
        <div className="p-2 bg-blue-900 bg-opacity-20 border border-blue-700 rounded text-xs text-blue-300">
          <p className="font-medium mb-1">Note:</p>
          <p className="text-blue-400">
            This announcement will automatically appear on the specified dates. You can edit or delete individual occurrences later.
          </p>
        </div>
      )}
    </div>
  );
};
