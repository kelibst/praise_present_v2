import React, { useState } from 'react';

interface DateTimePickerProps {
  value?: Date;
  onChange: (date: Date | undefined) => void;
  label?: string;
  showTime?: boolean;
  required?: boolean;
}

export const DateTimePicker: React.FC<DateTimePickerProps> = ({
  value,
  onChange,
  label = 'Date & Time',
  showTime = true,
  required = false
}) => {
  const [enabled, setEnabled] = useState(!!value);

  const formatDateForInput = (date: Date | undefined): string => {
    if (!date) return '';
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const formatTimeForInput = (date: Date | undefined): string => {
    if (!date) return '';
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  const handleDateChange = (dateStr: string) => {
    if (!dateStr) {
      onChange(undefined);
      return;
    }

    const currentTime = value || new Date();
    const [year, month, day] = dateStr.split('-').map(Number);
    const newDate = new Date(
      year,
      month - 1,
      day,
      currentTime.getHours(),
      currentTime.getMinutes()
    );
    onChange(newDate);
  };

  const handleTimeChange = (timeStr: string) => {
    if (!timeStr) return;

    const currentDate = value || new Date();
    const [hours, minutes] = timeStr.split(':').map(Number);
    const newDate = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth(),
      currentDate.getDate(),
      hours,
      minutes
    );
    onChange(newDate);
  };

  const handleToggle = (checked: boolean) => {
    setEnabled(checked);
    if (!checked) {
      onChange(undefined);
    } else {
      onChange(new Date());
    }
  };

  // Quick date presets
  const getQuickDate = (daysFromNow: number, hour: number = 10, minute: number = 0): Date => {
    const date = new Date();
    date.setDate(date.getDate() + daysFromNow);
    date.setHours(hour, minute, 0, 0);
    return date;
  };

  const quickDates = [
    { label: 'Tomorrow 10 AM', date: getQuickDate(1, 10, 0) },
    { label: 'This Sunday 9 AM', date: (() => {
      const d = new Date();
      const today = d.getDay();
      const daysUntilSunday = today === 0 ? 7 : 7 - today;
      return getQuickDate(daysUntilSunday, 9, 0);
    })() },
    { label: 'This Sunday 11 AM', date: (() => {
      const d = new Date();
      const today = d.getDay();
      const daysUntilSunday = today === 0 ? 7 : 7 - today;
      return getQuickDate(daysUntilSunday, 11, 0);
    })() },
    { label: 'Next Wednesday 7 PM', date: (() => {
      const d = new Date();
      const today = d.getDay();
      const daysUntilWed = today <= 3 ? 3 - today : 10 - today;
      return getQuickDate(daysUntilWed, 19, 0);
    })() },
    { label: 'Next Week', date: getQuickDate(7, 10, 0) }
  ];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-gray-300">
          {label} {required && <span className="text-red-400">*</span>}
        </label>
        {!required && (
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={enabled}
              onChange={(e) => handleToggle(e.target.checked)}
              className="w-4 h-4 rounded bg-gray-800 border-gray-700"
            />
            <span className="text-xs text-gray-400">Enable</span>
          </label>
        )}
      </div>

      {(enabled || required) && (
        <>
          <div className="grid grid-cols-2 gap-2">
            {/* Date Input */}
            <div>
              <label className="block text-xs text-gray-400 mb-1">Date</label>
              <input
                type="date"
                value={formatDateForInput(value)}
                onChange={(e) => handleDateChange(e.target.value)}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded focus:border-blue-500 focus:outline-none text-sm"
              />
            </div>

            {/* Time Input */}
            {showTime && (
              <div>
                <label className="block text-xs text-gray-400 mb-1">Time</label>
                <input
                  type="time"
                  value={formatTimeForInput(value)}
                  onChange={(e) => handleTimeChange(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded focus:border-blue-500 focus:outline-none text-sm"
                />
              </div>
            )}
          </div>

          {/* Quick Dates */}
          <div>
            <label className="block text-xs text-gray-400 mb-1">Quick Select</label>
            <div className="flex flex-wrap gap-1">
              {quickDates.map((quick, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => onChange(quick.date)}
                  className="px-2 py-1 bg-gray-800 hover:bg-gray-700 rounded text-xs transition-colors"
                >
                  {quick.label}
                </button>
              ))}
            </div>
          </div>

          {/* Display formatted date */}
          {value && (
            <div className="text-xs text-gray-400 italic">
              {value.toLocaleString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: showTime ? 'numeric' : undefined,
                minute: showTime ? '2-digit' : undefined
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
};
