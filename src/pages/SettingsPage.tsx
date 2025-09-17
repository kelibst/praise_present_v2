import React, { useState } from 'react';
import { Settings, Monitor, Palette } from 'lucide-react';

// Settings Components
import GeneralSettings from '../components/settings/GeneralSettings';
import DisplaySettings from '../components/settings/DisplaySettings';
import LiveDisplayThemeSettings from '../components/settings/LiveDisplayThemeSettings';

// Tab definitions
type SettingTab = 'general' | 'display' | 'themes';

interface TabConfig {
  id: SettingTab;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  component: React.ComponentType;
}

const tabs: TabConfig[] = [
  {
    id: 'general',
    label: 'General',
    icon: Settings,
    component: GeneralSettings,
  },
  {
    id: 'display',
    label: 'Display',
    icon: Monitor,
    component: DisplaySettings,
  },
  {
    id: 'themes',
    label: 'Live Display Themes',
    icon: Palette,
    component: LiveDisplayThemeSettings,
  },
];

const SettingsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<SettingTab>('general');

  const ActiveComponent = tabs.find(tab => tab.id === activeTab)?.component || GeneralSettings;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Settings</h1>
              <p className="text-sm text-muted-foreground">
                Configure your PraisePresent application
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-8">
          {/* Sidebar Navigation */}
          <div className="w-64 flex-shrink-0">
            <nav className="space-y-2">
              {tabs.map((tab) => {
                const IconComponent = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-left rounded-lg transition-colors ${
                      activeTab === tab.id
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                    }`}
                  >
                    <IconComponent className="w-5 h-5" />
                    <span className="font-medium">{tab.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Main Content */}
          <div className="flex-1 min-w-0">
            <div className="bg-card rounded-lg border border-border">
              <div className="p-6">
                <div className="mb-6">
                  <h2 className="text-xl font-semibold text-foreground">
                    {tabs.find(tab => tab.id === activeTab)?.label}
                  </h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    {activeTab === 'general' && 'General application settings and preferences'}
                    {activeTab === 'display' && 'Configure display settings and monitor setup'}
                    {activeTab === 'themes' && 'Customize live display themes and appearance'}
                  </p>
                </div>

                <div className="space-y-6">
                  <ActiveComponent />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;