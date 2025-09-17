import React, { useState, useEffect } from 'react';
import {
  Monitor,
  Eye,
  Settings as SettingsIcon,
  RefreshCw,
  Save,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import { useLiveDisplay } from '../live/LiveDisplayManager';

// Import display sub-components
import DisplayListItem from './display/DisplayListItem';
import DisplayStatusCard from './display/DisplayStatusCard';
import LiveDisplayStatusPanel from './display/LiveDisplayStatusPanel';
import DisplayRecommendations from './display/DisplayRecommendations';

// Display interface (matching the backend DisplayInfo)
interface DisplayInfo {
  id: number;
  label: string;
  manufacturer?: string;
  model?: string;
  friendlyName: string;
  bounds: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  workArea: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  scaleFactor: number;
  rotation: number;
  touchSupport: 'available' | 'unavailable' | 'unknown';
  isPrimary: boolean;
  colorSpace?: string;
  colorDepth?: number;
  accelerometerSupport?: 'available' | 'unavailable' | 'unknown';
  nativeInfo?: any;
}

// Display settings state
interface DisplaySettingsState {
  selectedDisplayId: number | null;
  fullscreenMode: boolean;
  maintainAspectRatio: boolean;
  backgroundStyle: 'black' | 'blur' | 'custom';
  customBackgroundColor: string;
  borderless: boolean;
  alwaysOnTop: boolean;
  testMode: boolean;
}

const DisplaySettings: React.FC = () => {
  // State management
  const [displays, setDisplays] = useState<DisplayInfo[]>([]);
  const [primaryDisplay, setPrimaryDisplay] = useState<DisplayInfo | null>(null);
  const [secondaryDisplay, setSecondaryDisplay] = useState<DisplayInfo | null>(null);
  const [selectedLiveDisplayId, setSelectedLiveDisplayId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [settings, setSettings] = useState<DisplaySettingsState>({
    selectedDisplayId: null,
    fullscreenMode: true,
    maintainAspectRatio: true,
    backgroundStyle: 'black',
    customBackgroundColor: '#000000',
    borderless: true,
    alwaysOnTop: false,
    testMode: false,
  });

  const {
    liveDisplayActive,
    liveDisplayStatus,
    createLiveDisplay,
    closeLiveDisplay,
  } = useLiveDisplay();

  // Initialize displays on component mount
  useEffect(() => {
    refreshDisplays();
    loadSettings();
  }, []);

  // Sync settings when displays change
  useEffect(() => {
    if (selectedLiveDisplayId && displays.length > 0) {
      const display = displays.find((d) => d.id === selectedLiveDisplayId);
      if (display) {
        setSettings(prev => ({ ...prev, selectedDisplayId: selectedLiveDisplayId }));
      }
    }
  }, [selectedLiveDisplayId, displays]);

  const refreshDisplays = async () => {
    try {
      setIsLoading(true);
      setError(null);

      console.log('Refreshing displays...');

      // Get displays from Electron API using the existing IPC handler
      if (window.electronAPI) {
        const result = await window.electronAPI.invoke('display:getDisplays');
        console.log('Display result:', result);

        if (result && result.displays) {
          setDisplays(result.displays);
          setPrimaryDisplay(result.primaryDisplay);
          setSecondaryDisplay(result.secondaryDisplay);

          // Set default selection to secondary display if available, otherwise primary
          if (result.displays.length > 0 && !selectedLiveDisplayId) {
            const defaultDisplay = result.secondaryDisplay || result.primaryDisplay || result.displays[0];
            if (defaultDisplay) {
              setSelectedLiveDisplayId(defaultDisplay.id);
            }
          }
        }
      } else {
        console.warn('Electron API not available');
        setError('Electron API not available');
      }
    } catch (err) {
      console.error('Failed to refresh displays:', err);
      setError(err instanceof Error ? err.message : 'Failed to get displays');
    } finally {
      setIsLoading(false);
    }
  };

  const loadSettings = () => {
    try {
      const savedSettings = localStorage.getItem('display-settings');
      const savedSelectedId = localStorage.getItem('selected-live-display-id');

      if (savedSettings) {
        const parsed = JSON.parse(savedSettings);
        setSettings(prev => ({ ...prev, ...parsed }));
      }

      if (savedSelectedId) {
        setSelectedLiveDisplayId(parseInt(savedSelectedId));
      }
    } catch (error) {
      console.error('Failed to load display settings:', error);
    }
  };

  const saveSettings = async () => {
    try {
      localStorage.setItem('display-settings', JSON.stringify(settings));
      if (selectedLiveDisplayId) {
        localStorage.setItem('selected-live-display-id', selectedLiveDisplayId.toString());
      }

      // Also save to the backend via IPC
      if (window.electronAPI) {
        await window.electronAPI.invoke('display:saveSettings', {
          selectedLiveDisplayId,
          ...settings
        });
      }

      console.log('Display settings saved successfully');
    } catch (error) {
      console.error('Failed to save display settings:', error);
    }
  };

  // Event handlers
  const handleSelectDisplay = (displayId: number | null) => {
    setSelectedLiveDisplayId(displayId);
    setSettings(prev => ({ ...prev, selectedDisplayId: displayId }));
    console.log('Selected display for live output:', displayId);
  };

  const handleTestDisplay = async (displayId: number) => {
    try {
      setSettings(prev => ({ ...prev, testMode: true }));
      if (window.electronAPI) {
        await window.electronAPI.invoke('display:testDisplay', displayId);
      }
    } catch (error) {
      console.error('Failed to test display:', error);
      setError('Failed to test display');
    } finally {
      setSettings(prev => ({ ...prev, testMode: false }));
    }
  };

  const handleCaptureDisplay = async (displayId: number) => {
    try {
      if (window.electronAPI) {
        await window.electronAPI.invoke('display:captureDisplay', displayId);
      }
    } catch (error) {
      console.error('Failed to capture display:', error);
      setError('Failed to capture display');
    }
  };

  const clearError = () => {
    setError(null);
  };

  const updateSetting = <K extends keyof DisplaySettingsState>(
    key: K,
    value: DisplaySettingsState[K]
  ) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  // Get the currently selected display
  const currentSelectedDisplay = displays.find((d) => d.id === selectedLiveDisplayId);
  const hasMultipleDisplays = displays.length > 1;
  const displayCount = displays.length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">Display Configuration</h3>
          <p className="text-sm text-muted-foreground">
            Configure multiple monitors for live presentation output
          </p>
        </div>
        <button
          onClick={refreshDisplays}
          disabled={isLoading}
          className="flex items-center gap-2 px-4 py-2 border border-border text-foreground rounded-md hover:bg-accent transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="flex items-center gap-2 p-4 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive">
          <AlertCircle className="w-5 h-5" />
          <span className="flex-1">{error}</span>
          <button
            onClick={clearError}
            className="px-3 py-1 bg-destructive text-destructive-foreground rounded text-sm hover:bg-destructive/90"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Display Status */}
      <DisplayStatusCard
        displayCount={displayCount}
        hasMultipleDisplays={hasMultipleDisplays}
        currentSelectedDisplay={currentSelectedDisplay}
      />

      {/* Available Displays */}
      <div className="bg-card border border-border rounded-lg">
        <div className="p-6 border-b border-border">
          <h4 className="text-lg font-semibold text-foreground">Available Displays</h4>
          <p className="text-sm text-muted-foreground">
            Select which display to use for live presentation output
          </p>
        </div>
        <div className="p-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="w-6 h-6 animate-spin mr-2" />
              <span>Detecting displays...</span>
            </div>
          ) : displays.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Monitor className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No displays detected</p>
              <button
                onClick={refreshDisplays}
                className="mt-2 px-4 py-2 border border-border text-foreground rounded-md hover:bg-accent transition-colors"
              >
                Refresh Displays
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {displays.map((display) => (
                <DisplayListItem
                  key={display.id}
                  displayId={display.id}
                  display={display}
                  isSelected={selectedLiveDisplayId === display.id}
                  isTestMode={settings.testMode}
                  onSelect={handleSelectDisplay}
                  onTest={handleTestDisplay}
                  onCapture={handleCaptureDisplay}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recommendations */}
      {displays.length > 0 && (
        <DisplayRecommendations
          hasMultipleDisplays={hasMultipleDisplays}
          selectedLiveDisplayId={selectedLiveDisplayId}
          secondaryDisplay={secondaryDisplay}
          onSelectDisplay={handleSelectDisplay}
        />
      )}

      {/* Live Display Status Panel */}
      <LiveDisplayStatusPanel currentSelectedDisplay={currentSelectedDisplay} />

      {/* Display Configuration */}
      <div className="bg-card border border-border rounded-lg">
        <div className="p-6 border-b border-border">
          <h4 className="text-lg font-semibold text-foreground">Display Configuration</h4>
          <p className="text-sm text-muted-foreground">
            Configure how content is displayed on the live output
          </p>
        </div>
        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-foreground">Fullscreen Mode</label>
              <p className="text-xs text-muted-foreground">
                Display content in fullscreen mode
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.fullscreenMode}
                onChange={(e) => updateSetting('fullscreenMode', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/25 dark:peer-focus:ring-primary/25 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary"></div>
            </label>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-foreground">Borderless Window</label>
              <p className="text-xs text-muted-foreground">
                Remove window borders and title bar
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.borderless}
                onChange={(e) => updateSetting('borderless', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/25 dark:peer-focus:ring-primary/25 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary"></div>
            </label>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-foreground">Always on Top</label>
              <p className="text-xs text-muted-foreground">
                Keep live display above other windows
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.alwaysOnTop}
                onChange={(e) => updateSetting('alwaysOnTop', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/25 dark:peer-focus:ring-primary/25 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary"></div>
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Background Style
            </label>
            <select
              value={settings.backgroundStyle}
              onChange={(e) => updateSetting('backgroundStyle', e.target.value as any)}
              className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="black">Solid Black</option>
              <option value="blur">Blurred Background</option>
              <option value="custom">Custom Color</option>
            </select>
          </div>

          {settings.backgroundStyle === 'custom' && (
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Custom Background Color
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={settings.customBackgroundColor}
                  onChange={(e) => updateSetting('customBackgroundColor', e.target.value)}
                  className="w-12 h-10 border border-border rounded cursor-pointer"
                />
                <input
                  type="text"
                  value={settings.customBackgroundColor}
                  onChange={(e) => updateSetting('customBackgroundColor', e.target.value)}
                  className="flex-1 px-3 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
            </div>
          )}
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
          onClick={refreshDisplays}
          className="flex items-center gap-2 px-4 py-2 border border-border text-foreground rounded-md hover:bg-accent transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh Displays
        </button>
      </div>
    </div>
  );
};

export default DisplaySettings;