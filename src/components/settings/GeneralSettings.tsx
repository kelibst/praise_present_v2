import React, { useState, useEffect } from 'react';
import {
  Save,
  RefreshCw,
  Globe,
  Palette,
  Monitor,
  Sun,
  Moon,
  Settings as SettingsIcon
} from 'lucide-react';

// Theme management hook
const useTheme = () => {
  const [theme, setThemeState] = useState<'light' | 'dark' | 'system'>('system');

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | 'system' | null;
    if (savedTheme) {
      setThemeState(savedTheme);
    }
  }, []);

  const setTheme = (newTheme: 'light' | 'dark' | 'system') => {
    setThemeState(newTheme);
    localStorage.setItem('theme', newTheme);

    // Apply theme to document
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');

    if (newTheme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      root.classList.add(systemTheme);
    } else {
      root.classList.add(newTheme);
    }
  };

  return { theme, setTheme };
};

// Settings interface
interface GeneralSettingsState {
  autoSave: boolean;
  autoSaveInterval: number;
  language: string;
  theme: 'light' | 'dark' | 'system';
  notifications: boolean;
  startupAction: 'none' | 'lastSession' | 'newPresentation';
  confirmOnExit: boolean;
  checkForUpdates: boolean;
}

const GeneralSettings: React.FC = () => {
  const { theme, setTheme } = useTheme();
  const [settings, setSettings] = useState<GeneralSettingsState>({
    autoSave: true,
    autoSaveInterval: 5,
    language: 'en',
    theme: theme,
    notifications: true,
    startupAction: 'lastSession',
    confirmOnExit: true,
    checkForUpdates: true,
  });

  // Load settings from localStorage on mount
  useEffect(() => {
    const savedSettings = localStorage.getItem('general-settings');
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        setSettings(prev => ({ ...prev, ...parsed, theme }));
      } catch (error) {
        console.error('Failed to parse saved settings:', error);
      }
    }
  }, [theme]);

  // Save settings to localStorage
  const saveSettings = () => {
    try {
      localStorage.setItem('general-settings', JSON.stringify(settings));
      // Show success notification (you can implement a toast system later)
      console.log('Settings saved successfully');
    } catch (error) {
      console.error('Failed to save settings:', error);
    }
  };

  const resetSettings = () => {
    const defaultSettings: GeneralSettingsState = {
      autoSave: true,
      autoSaveInterval: 5,
      language: 'en',
      theme: 'system',
      notifications: true,
      startupAction: 'lastSession',
      confirmOnExit: true,
      checkForUpdates: true,
    };
    setSettings(defaultSettings);
    setTheme('system');
  };

  const updateSetting = <K extends keyof GeneralSettingsState>(
    key: K,
    value: GeneralSettingsState[K]
  ) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    if (key === 'theme') {
      setTheme(value as 'light' | 'dark' | 'system');
    }
  };

  return (
    <div className="space-y-8">
      {/* Theme Settings */}
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
          <Palette className="w-5 h-5" />
          Appearance
        </h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-3">
              Theme
            </label>
            <div className="grid grid-cols-3 gap-3">
              <button
                onClick={() => updateSetting('theme', 'light')}
                className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all ${
                  settings.theme === 'light'
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/50'
                }`}
              >
                <Sun className="w-6 h-6" />
                <span className="text-sm font-medium">Light</span>
                {settings.theme === 'light' && (
                  <div className="text-xs bg-primary text-primary-foreground px-2 py-1 rounded">
                    Active
                  </div>
                )}
              </button>

              <button
                onClick={() => updateSetting('theme', 'dark')}
                className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all ${
                  settings.theme === 'dark'
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/50'
                }`}
              >
                <Moon className="w-6 h-6" />
                <span className="text-sm font-medium">Dark</span>
                {settings.theme === 'dark' && (
                  <div className="text-xs bg-primary text-primary-foreground px-2 py-1 rounded">
                    Active
                  </div>
                )}
              </button>

              <button
                onClick={() => updateSetting('theme', 'system')}
                className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all ${
                  settings.theme === 'system'
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/50'
                }`}
              >
                <Monitor className="w-6 h-6" />
                <span className="text-sm font-medium">System</span>
                {settings.theme === 'system' && (
                  <div className="text-xs bg-primary text-primary-foreground px-2 py-1 rounded">
                    Active
                  </div>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Auto-Save Settings */}
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
          <Save className="w-5 h-5" />
          Auto-Save
        </h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-foreground">Enable Auto-Save</label>
              <p className="text-xs text-muted-foreground">
                Automatically save your work at regular intervals
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.autoSave}
                onChange={(e) => updateSetting('autoSave', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/25 dark:peer-focus:ring-primary/25 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary"></div>
            </label>
          </div>

          {settings.autoSave && (
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Auto-Save Interval (minutes)
              </label>
              <select
                value={settings.autoSaveInterval}
                onChange={(e) => updateSetting('autoSaveInterval', parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value={1}>1 minute</option>
                <option value={2}>2 minutes</option>
                <option value={5}>5 minutes</option>
                <option value={10}>10 minutes</option>
                <option value={15}>15 minutes</option>
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Application Settings */}
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
          <SettingsIcon className="w-5 h-5" />
          Application
        </h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Language
            </label>
            <select
              value={settings.language}
              onChange={(e) => updateSetting('language', e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="en">English</option>
              <option value="es">Español</option>
              <option value="fr">Français</option>
              <option value="de">Deutsch</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Startup Action
            </label>
            <select
              value={settings.startupAction}
              onChange={(e) => updateSetting('startupAction', e.target.value as any)}
              className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="none">Start with blank page</option>
              <option value="lastSession">Restore last session</option>
              <option value="newPresentation">Create new presentation</option>
            </select>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-foreground">Show Notifications</label>
              <p className="text-xs text-muted-foreground">
                Display notifications for important events
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.notifications}
                onChange={(e) => updateSetting('notifications', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/25 dark:peer-focus:ring-primary/25 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary"></div>
            </label>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-foreground">Confirm on Exit</label>
              <p className="text-xs text-muted-foreground">
                Ask for confirmation before closing the application
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.confirmOnExit}
                onChange={(e) => updateSetting('confirmOnExit', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/25 dark:peer-focus:ring-primary/25 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary"></div>
            </label>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-foreground">Check for Updates</label>
              <p className="text-xs text-muted-foreground">
                Automatically check for application updates
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.checkForUpdates}
                onChange={(e) => updateSetting('checkForUpdates', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/25 dark:peer-focus:ring-primary/25 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary"></div>
            </label>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4 pt-6 border-t border-border">
        <button
          onClick={saveSettings}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
        >
          <Save className="w-4 h-4" />
          Save Settings
        </button>
        <button
          onClick={resetSettings}
          className="flex items-center gap-2 px-4 py-2 border border-border text-foreground rounded-md hover:bg-accent transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Reset to Defaults
        </button>
      </div>
    </div>
  );
};

export default GeneralSettings;