import React from 'react';
import { Music, User, Tag, Clock, Hash } from 'lucide-react';

export interface SongMetadata {
  title: string;
  author: string;
  artist?: string;
  key: string;
  tempo: string;
  category: string;
  copyright: string;
  ccliNumber?: string;
  tags: string[];
  notes?: string;
}

interface SongMetadataEditorProps {
  metadata: SongMetadata;
  onChange: (metadata: SongMetadata) => void;
  readOnly?: boolean;
  className?: string;
}

export const SongMetadataEditor: React.FC<SongMetadataEditorProps> = ({
  metadata,
  onChange,
  readOnly = false,
  className = ''
}) => {
  const handleChange = (field: keyof SongMetadata, value: any) => {
    onChange({ ...metadata, [field]: value });
  };

  return (
    <div className={`bg-card rounded-lg border border-border p-4 space-y-4 ${className}`}>
      <h3 className="font-semibold text-foreground flex items-center gap-2">
        <Music className="w-4 h-4 text-blue-400" />
        Song Information
      </h3>

      {/* Title */}
      <div>
        <label className="block text-sm font-medium mb-2 text-muted-foreground">Title *</label>
        <input
          type="text"
          value={metadata.title}
          onChange={(e) => handleChange('title', e.target.value)}
          disabled={readOnly}
          className="w-full px-3 py-2 border border-border rounded bg-input text-foreground disabled:opacity-50"
          placeholder="Song title"
        />
      </div>

      {/* Author & Artist */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-2 text-muted-foreground flex items-center gap-1">
            <User className="w-3 h-3" />
            Author *
          </label>
          <input
            type="text"
            value={metadata.author}
            onChange={(e) => handleChange('author', e.target.value)}
            disabled={readOnly}
            className="w-full px-3 py-2 border border-border rounded bg-input text-foreground disabled:opacity-50"
            placeholder="Composer/Author"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2 text-muted-foreground">Artist</label>
          <input
            type="text"
            value={metadata.artist || ''}
            onChange={(e) => handleChange('artist', e.target.value)}
            disabled={readOnly}
            className="w-full px-3 py-2 border border-border rounded bg-input text-foreground disabled:opacity-50"
            placeholder="Performing artist"
          />
        </div>
      </div>

      {/* Key & Tempo */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-2 text-muted-foreground flex items-center gap-1">
            <Music className="w-3 h-3" />
            Key
          </label>
          <select
            value={metadata.key}
            onChange={(e) => handleChange('key', e.target.value)}
            disabled={readOnly}
            className="w-full px-3 py-2 border border-border rounded bg-input text-foreground disabled:opacity-50"
          >
            {['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'].map(key => (
              <option key={key} value={key}>{key}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-2 text-muted-foreground flex items-center gap-1">
            <Clock className="w-3 h-3" />
            Tempo
          </label>
          <input
            type="text"
            value={metadata.tempo}
            onChange={(e) => handleChange('tempo', e.target.value)}
            disabled={readOnly}
            className="w-full px-3 py-2 border border-border rounded bg-input text-foreground disabled:opacity-50"
            placeholder="e.g., 120 BPM"
          />
        </div>
      </div>

      {/* Category */}
      <div>
        <label className="block text-sm font-medium mb-2 text-muted-foreground flex items-center gap-1">
          <Tag className="w-3 h-3" />
          Category
        </label>
        <select
          value={metadata.category}
          onChange={(e) => handleChange('category', e.target.value)}
          disabled={readOnly}
          className="w-full px-3 py-2 border border-border rounded bg-input text-foreground disabled:opacity-50"
        >
          <option value="Contemporary">Contemporary</option>
          <option value="Hymn">Hymn</option>
          <option value="Gospel">Gospel</option>
          <option value="Worship">Worship</option>
          <option value="Christmas">Christmas</option>
          <option value="Easter">Easter</option>
        </select>
      </div>

      {/* Copyright */}
      <div>
        <label className="block text-sm font-medium mb-2 text-muted-foreground">Copyright</label>
        <input
          type="text"
          value={metadata.copyright}
          onChange={(e) => handleChange('copyright', e.target.value)}
          disabled={readOnly}
          className="w-full px-3 py-2 border border-border rounded bg-input text-foreground disabled:opacity-50"
          placeholder="Copyright information"
        />
      </div>

      {/* CCLI Number */}
      <div>
        <label className="block text-sm font-medium mb-2 text-muted-foreground flex items-center gap-1">
          <Hash className="w-3 h-3" />
          CCLI Number
        </label>
        <input
          type="text"
          value={metadata.ccliNumber || ''}
          onChange={(e) => handleChange('ccliNumber', e.target.value)}
          disabled={readOnly}
          className="w-full px-3 py-2 border border-border rounded bg-input text-foreground disabled:opacity-50"
          placeholder="CCLI license number"
        />
      </div>

      {/* Tags */}
      <div>
        <label className="block text-sm font-medium mb-2 text-muted-foreground">Tags</label>
        <input
          type="text"
          value={metadata.tags.join(', ')}
          onChange={(e) => handleChange('tags', e.target.value.split(',').map(tag => tag.trim()).filter(Boolean))}
          disabled={readOnly}
          className="w-full px-3 py-2 border border-border rounded bg-input text-foreground disabled:opacity-50"
          placeholder="worship, contemporary, upbeat (comma-separated)"
        />
        {metadata.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {metadata.tags.map((tag, index) => (
              <span
                key={index}
                className="px-2 py-1 bg-secondary text-muted-foreground text-xs rounded"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Notes */}
      <div>
        <label className="block text-sm font-medium mb-2 text-muted-foreground">Notes</label>
        <textarea
          value={metadata.notes || ''}
          onChange={(e) => handleChange('notes', e.target.value)}
          disabled={readOnly}
          className="w-full px-3 py-2 border border-border rounded bg-input text-foreground disabled:opacity-50"
          rows={3}
          placeholder="Add any notes about this song..."
        />
      </div>
    </div>
  );
};
