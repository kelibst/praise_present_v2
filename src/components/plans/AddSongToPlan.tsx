import React, { useState, useEffect } from 'react';
import { Music, Plus, Loader2, AlertCircle, CheckCircle } from 'lucide-react';

interface Song {
  id: string;
  title: string;
  artist?: string;
  author?: string;
}

interface AddSongToPlanProps {
  planId: string;
  onSongAdded?: (planItem: any) => void;
  onError?: (error: string) => void;
}

export const AddSongToPlan: React.FC<AddSongToPlanProps> = ({
  planId,
  onSongAdded,
  onError
}) => {
  const [songs, setSongs] = useState<Song[]>([]);
  const [selectedSongId, setSelectedSongId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingSongs, setIsLoadingSongs] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);

  // Load available songs
  useEffect(() => {
    loadSongs();
  }, []);

  const loadSongs = async () => {
    try {
      setIsLoadingSongs(true);
      if (window.electronAPI) {
        const songsData = await window.electronAPI.invoke('db:loadSongs', { limit: 100 });
        setSongs(songsData || []);
      }
    } catch (error) {
      console.error('Failed to load songs:', error);
      setError('Failed to load songs');
    } finally {
      setIsLoadingSongs(false);
    }
  };

  const handleAddSong = async () => {
    if (!selectedSongId) {
      setError('Please select a song');
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const selectedSong = songs.find(s => s.id === selectedSongId);
      if (!selectedSong) {
        throw new Error('Selected song not found');
      }

      // Get current plan to determine next order
      const plan = await window.electronAPI?.invoke('db:getPlan', planId);
      const nextOrder = plan?.planItems?.length || 0;

      const planItemData = {
        planId,
        type: 'song',
        title: selectedSong.title,
        order: nextOrder,
        duration: 240, // 4 minutes default
        songId: selectedSongId,
        notes: `Song: ${selectedSong.title}${selectedSong.artist ? ` by ${selectedSong.artist}` : ''}`
      };

      console.log('🎵 Adding song to plan:', planItemData);

      const planItem = await window.electronAPI?.invoke('db:createPlanItem', planItemData);

      console.log('✅ Song added successfully:', planItem);

      setSuccess(true);
      setSelectedSongId('');

      if (onSongAdded) {
        onSongAdded(planItem);
      }

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(false), 3000);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to add song';
      console.error('❌ Failed to add song to plan:', error);
      setError(errorMessage);

      if (onError) {
        onError(errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoadingSongs) {
    return (
      <div className="p-4 border rounded-lg bg-gray-50 dark:bg-gray-800">
        <div className="flex items-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span className="text-sm text-gray-600 dark:text-gray-300">Loading songs...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 border rounded-lg bg-gray-50 dark:bg-gray-800">
      <div className="flex items-center gap-2 mb-3">
        <Music className="w-4 h-4" />
        <h4 className="font-medium text-gray-900 dark:text-gray-100">Add Song to Plan</h4>
      </div>

      {error && (
        <div className="mb-3 p-2 bg-red-100 dark:bg-red-900/50 border border-red-300 dark:border-red-600 rounded text-red-700 dark:text-red-300 text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />
          {error}
          <button
            onClick={() => setError(null)}
            className="ml-auto text-red-500 hover:text-red-700"
          >
            ✕
          </button>
        </div>
      )}

      {success && (
        <div className="mb-3 p-2 bg-green-100 dark:bg-green-900/50 border border-green-300 dark:border-green-600 rounded text-green-700 dark:text-green-300 text-sm flex items-center gap-2">
          <CheckCircle className="w-4 h-4" />
          Song added successfully!
        </div>
      )}

      <div className="space-y-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Select Song
          </label>
          <select
            value={selectedSongId}
            onChange={(e) => setSelectedSongId(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm"
            disabled={isLoading}
          >
            <option value="">Choose a song...</option>
            {songs.map((song) => (
              <option key={song.id} value={song.id}>
                {song.title}{song.artist ? ` - ${song.artist}` : ''}
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={handleAddSong}
          disabled={!selectedSongId || isLoading}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
        >
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Plus className="w-4 h-4" />
          )}
          {isLoading ? 'Adding...' : 'Add Song to Plan'}
        </button>
      </div>

      {songs.length === 0 && !isLoadingSongs && (
        <div className="mt-3 p-2 text-sm text-gray-500 dark:text-gray-400 text-center">
          No songs available. Please add songs to your database first.
        </div>
      )}
    </div>
  );
};

export default AddSongToPlan;