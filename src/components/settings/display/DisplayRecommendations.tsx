import React from 'react';
import { Lightbulb, ArrowRight, Monitor } from 'lucide-react';

interface DisplayRecommendationsProps {
  hasMultipleDisplays: boolean;
  selectedLiveDisplayId: number | null;
  secondaryDisplay: any;
  onSelectDisplay: (displayId: number | null) => void;
}

const DisplayRecommendations: React.FC<DisplayRecommendationsProps> = ({
  hasMultipleDisplays,
  selectedLiveDisplayId,
  secondaryDisplay,
  onSelectDisplay,
}) => {
  // Don't show recommendations if we only have one display or if user has already selected
  if (!hasMultipleDisplays) {
    return null;
  }

  const recommendations = [];

  // Recommend using secondary display for live output
  if (secondaryDisplay && selectedLiveDisplayId !== secondaryDisplay.id) {
    recommendations.push({
      id: 'use-secondary',
      title: 'Use Secondary Display for Live Output',
      description: 'For best results, use your secondary display for live presentation while keeping your primary display for controls.',
      action: 'Select Secondary Display',
      displayId: secondaryDisplay.id,
      icon: <Monitor className="w-5 h-5 text-blue-600" />,
      priority: 'high' as const,
    });
  }

  // Recommend optimal setup if no display is selected
  if (!selectedLiveDisplayId && secondaryDisplay) {
    recommendations.push({
      id: 'optimal-setup',
      title: 'Optimal Multi-Display Setup',
      description: 'Connect your projector or external display to the secondary output for the best presentation experience.',
      action: 'Use Recommended Setup',
      displayId: secondaryDisplay.id,
      icon: <Lightbulb className="w-5 h-5 text-yellow-600" />,
      priority: 'medium' as const,
    });
  }

  if (recommendations.length === 0) {
    return null;
  }

  return (
    <div className="bg-card border border-border rounded-lg">
      <div className="p-6 border-b border-border">
        <h4 className="text-lg font-semibold text-foreground flex items-center gap-2">
          <Lightbulb className="w-5 h-5 text-yellow-600" />
          Recommendations
        </h4>
        <p className="text-sm text-muted-foreground">
          Suggestions to optimize your display setup for presentations
        </p>
      </div>
      <div className="p-6 space-y-4">
        {recommendations.map((rec) => (
          <div
            key={rec.id}
            className={`p-4 rounded-lg border ${
              rec.priority === 'high'
                ? 'border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950'
                : 'border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950'
            }`}
          >
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 mt-0.5">{rec.icon}</div>
              <div className="flex-1">
                <h5 className="font-medium text-foreground mb-1">{rec.title}</h5>
                <p className="text-sm text-muted-foreground mb-3">
                  {rec.description}
                </p>
                <button
                  onClick={() => onSelectDisplay(rec.displayId)}
                  className={`flex items-center gap-2 px-4 py-2 rounded text-sm font-medium transition-colors ${
                    rec.priority === 'high'
                      ? 'bg-blue-600 text-white hover:bg-blue-700'
                      : 'bg-yellow-600 text-white hover:bg-yellow-700'
                  }`}
                >
                  {rec.action}
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DisplayRecommendations;