import React from 'react';
import { Save, Palette, AlignLeft, AlignCenter, AlignRight } from 'lucide-react';

export interface SlideProperties {
  backgroundColor: string;
  fontSize: number;
  textAlign: 'left' | 'center' | 'right';
  fontFamily: string;
  textColor: string;
}

export interface SlidePropertyPanelProps {
  properties: SlideProperties;
  hasUnsavedChanges: boolean;
  onPropertyChange: (property: string, value: any) => void;
  onSave: () => void;
}

export const SlidePropertyPanel: React.FC<SlidePropertyPanelProps> = ({
  properties,
  hasUnsavedChanges,
  onPropertyChange,
  onSave,
}) => {
  return (
    <div className="bg-card rounded-lg p-4 mb-4 border border-border">
      <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
        <Palette className="w-4 h-4" />
        Slide Properties
      </h4>
      <div className="grid grid-cols-2 gap-4">
        {/* Background Color */}
        <div>
          <label className="block text-xs text-muted-foreground mb-1">Background</label>
          <input
            type="color"
            value={properties.backgroundColor}
            onChange={(e) => onPropertyChange('backgroundColor', e.target.value)}
            className="w-full h-8 rounded border border-border bg-input"
          />
        </div>

        {/* Font Size */}
        <div>
          <label className="block text-xs text-muted-foreground mb-1">Font Size</label>
          <input
            type="range"
            min="16"
            max="120"
            value={properties.fontSize}
            onChange={(e) => onPropertyChange('fontSize', parseInt(e.target.value))}
            className="w-full"
          />
          <div className="text-xs text-muted-foreground text-center">{properties.fontSize}px</div>
        </div>

        {/* Text Alignment */}
        <div>
          <label className="block text-xs text-muted-foreground mb-1">Text Align</label>
          <div className="flex gap-1">
            {(['left', 'center', 'right'] as const).map((align) => (
              <button
                key={align}
                onClick={() => onPropertyChange('textAlign', align)}
                className={`p-2 rounded ${
                  properties.textAlign === align
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                }`}
              >
                {align === 'left' && <AlignLeft className="w-4 h-4" />}
                {align === 'center' && <AlignCenter className="w-4 h-4" />}
                {align === 'right' && <AlignRight className="w-4 h-4" />}
              </button>
            ))}
          </div>
        </div>

        {/* Text Color */}
        <div>
          <label className="block text-xs text-muted-foreground mb-1">Text Color</label>
          <input
            type="color"
            value={properties.textColor}
            onChange={(e) => onPropertyChange('textColor', e.target.value)}
            className="w-full h-8 rounded border border-border bg-input"
          />
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end mt-4">
        <button
          onClick={onSave}
          disabled={!hasUnsavedChanges}
          className={`px-4 py-2 rounded flex items-center gap-2 ${
            hasUnsavedChanges
              ? 'bg-green-600 text-white hover:bg-green-700'
              : 'bg-secondary text-muted-foreground cursor-not-allowed'
          }`}
        >
          <Save className="w-4 h-4" />
          {hasUnsavedChanges ? 'Save Changes' : 'No Changes'}
        </button>
      </div>
    </div>
  );
};

export default SlidePropertyPanel;