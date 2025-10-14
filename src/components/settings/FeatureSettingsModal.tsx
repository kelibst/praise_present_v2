import React, { useState } from 'react';
import { X, BookOpen, Music, Megaphone, Save, Check } from 'lucide-react';
import { useFeatureSettings } from '../../hooks/useFeatureSettings';
import { ScriptureSettingsPanel } from './ScriptureSettingsPanel';
import { SongSettingsPanel } from './SongSettingsPanel';
import { ScriptureSettings, SongSettings, AnnouncementSettings } from '../../lib/featureSettingsSlice';

interface FeatureSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'scriptures' | 'songs' | 'announcements';
}

type TabType = 'scriptures' | 'songs' | 'announcements';

/**
 * FeatureSettingsModal - Modal for configuring feature-specific presentation settings
 *
 * Provides tabbed interface for:
 * - Scripture Settings (backgrounds, typography for verses)
 * - Song Settings (backgrounds, typography for lyrics)
 * - Announcement Settings (backgrounds, typography for announcements)
 *
 * All changes auto-save to localStorage and persist across sessions.
 * Settings apply to all future slides of each type.
 */
export const FeatureSettingsModal: React.FC<FeatureSettingsModalProps> = ({
  isOpen,
  onClose,
  initialTab = 'scriptures'
}) => {
  const [activeTab, setActiveTab] = useState<TabType>(initialTab);
  const [saved, setSaved] = useState(false);

  const {
    scriptureSettings,
    songSettings,
    announcementSettings,
    updateSettings,
    saveScripture,
    saveSong,
    saveAnnouncement,
    resetScripture,
    resetSong,
    resetAnnouncement,
    isLoading
  } = useFeatureSettings();

  if (!isOpen) return null;

  const handleScriptureUpdate = (updates: Partial<ScriptureSettings>) => {
    updateSettings('scriptures', updates);
    showSavedIndicator();
  };

  const handleSongUpdate = (updates: Partial<SongSettings>) => {
    updateSettings('songs', updates);
    showSavedIndicator();
  };

  const handleAnnouncementUpdate = (updates: Partial<AnnouncementSettings>) => {
    updateSettings('announcements', updates);
    showSavedIndicator();
  };

  const handleReset = async () => {
    if (activeTab === 'scriptures') {
      await resetScripture();
    } else if (activeTab === 'songs') {
      await resetSong();
    } else if (activeTab === 'announcements') {
      await resetAnnouncement();
    }
    showSavedIndicator();
  };

  const showSavedIndicator = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const tabs = [
    { id: 'scriptures' as TabType, label: 'Scriptures', icon: BookOpen, color: 'blue' },
    { id: 'songs' as TabType, label: 'Songs', icon: Music, color: 'purple' },
    { id: 'announcements' as TabType, label: 'Announcements', icon: Megaphone, color: 'green' }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="bg-gray-950 rounded-lg shadow-2xl border border-gray-700 w-full max-w-5xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-600 rounded-lg">
              <Save className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Feature Settings</h2>
              <p className="text-sm text-gray-400">Configure default appearance for each feature</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Saved Indicator */}
            {saved && (
              <div className="flex items-center gap-2 text-green-400 text-sm animate-fade-in">
                <Check className="w-4 h-4" />
                <span>Saved</span>
              </div>
            )}

            {/* Close Button */}
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
              title="Close"
            >
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-2 px-6 py-3 bg-gray-900/50 border-b border-gray-700 overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-all ${
                  isActive
                    ? `bg-${tab.color}-600 border-${tab.color}-500 text-white shadow-lg`
                    : 'bg-gray-800 border-gray-600 text-gray-300 hover:bg-gray-700'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="font-medium">{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'scriptures' && (
            <ScriptureSettingsPanel
              settings={scriptureSettings}
              onUpdate={handleScriptureUpdate}
              onReset={handleReset}
            />
          )}

          {activeTab === 'songs' && (
            <SongSettingsPanel
              settings={songSettings}
              onUpdate={handleSongUpdate}
              onReset={handleReset}
            />
          )}

          {activeTab === 'announcements' && (
            <div className="flex items-center justify-center h-full">
              <div className="text-center text-gray-400">
                <Megaphone className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p className="text-lg">Announcement settings coming soon</p>
                <p className="text-sm mt-2">This feature is under development</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 bg-gray-900/50 border-t border-gray-700">
          <p className="text-xs text-gray-500">
            Changes are saved automatically • Settings apply to all future slides
          </p>
          <button
            onClick={onClose}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg border border-blue-500 transition-colors font-medium"
          >
            Done
          </button>
        </div>
      </div>

      <style>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

export default FeatureSettingsModal;
