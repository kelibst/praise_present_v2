import React from 'react';
import {
  InlineSongSelector,
  InlineScriptureSelector,
  InlinePresentationSelector,
  InlineAnnouncementEditor
} from '../plans/InlineMediaSelectors';

interface InlineMediaModalsProps {
  showModal: boolean;
  mediaType: 'song' | 'scripture' | 'presentation' | 'announcement' | null;
  onSongSelect: (song: any) => void;
  onScriptureSelect: (scripture: any) => void;
  onPresentationSelect: (presentation: any) => void;
  onAnnouncementSave: (announcement: { title: string; content: string; duration?: number }) => void;
  onClose: () => void;
}

/**
 * Modal container for inline media addition (song, scripture, presentation, announcement)
 */
export const InlineMediaModals: React.FC<InlineMediaModalsProps> = ({
  showModal,
  mediaType,
  onSongSelect,
  onScriptureSelect,
  onPresentationSelect,
  onAnnouncementSave,
  onClose
}) => {
  if (!showModal) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
      <div className="bg-background rounded-lg shadow-2xl w-full max-w-3xl max-h-[80vh] border border-border overflow-hidden">
        {mediaType === 'song' && (
          <InlineSongSelector
            onSelect={onSongSelect}
            onCancel={onClose}
          />
        )}
        {mediaType === 'scripture' && (
          <InlineScriptureSelector
            onSelect={onScriptureSelect}
            onCancel={onClose}
          />
        )}
        {mediaType === 'presentation' && (
          <InlinePresentationSelector
            onSelect={onPresentationSelect}
            onCancel={onClose}
          />
        )}
        {mediaType === 'announcement' && (
          <InlineAnnouncementEditor
            onSave={onAnnouncementSave}
            onCancel={onClose}
          />
        )}
      </div>
    </div>
  );
};
