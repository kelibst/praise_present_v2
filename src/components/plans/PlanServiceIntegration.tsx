import React from 'react';
import { ServiceItem } from '../service/ServiceItem';
import { PlanWithItems } from '../../types/plan';

// Types for plan integration
export interface PlanIntegrationProps {
  onPlanLoaded: (serviceItems: ServiceItem[], plan: PlanWithItems) => void;
  onPlanCreated?: (plan: PlanWithItems) => void;
}

// Enhanced utility function to convert plan items to service items with real content
export const convertPlanToServiceItems = async (plan: PlanWithItems): Promise<ServiceItem[]> => {
  const serviceItems: ServiceItem[] = [];

  for (const planItem of plan.planItems) {
    let content: any = {};

    try {
      // Fetch real content based on item type
      if (planItem.type === 'song' && planItem.songId) {
        // Fetch actual song content
        if (window.electronAPI) {
          const song = await window.electronAPI.invoke('db:getSong', planItem.songId);
          if (song) {
            content = {
              title: song.title,
              artist: song.artist || song.author,
              lyrics: song.lyrics || 'Lyrics not available',
              ccli: song.ccli,
              copyright: song.copyright,
              key: song.key,
              tempo: song.tempo
            };
          } else {
            // Fallback if song not found
            content = {
              title: planItem.title,
              lyrics: 'Song content not found',
              artist: 'Unknown'
            };
          }
        }
      } else if (planItem.type === 'scripture' && planItem.scriptureRef) {
        // Fetch actual scripture content
        if (window.electronAPI) {
          try {
            // Try to search for the scripture reference
            const searchResults = await window.electronAPI.invoke('db:searchVerses', {
              query: planItem.scriptureRef,
              limit: 20
            });

            if (searchResults && searchResults.length > 0) {
              content = {
                scriptureRef: planItem.scriptureRef,
                verses: searchResults.map((verse: any) => ({
                  id: verse.id,
                  text: verse.text,
                  book: verse.book,
                  chapter: verse.chapter,
                  verse: verse.verse,
                  translation: verse.translation || 'KJV'
                }))
              };
            } else {
              // Fallback for scripture not found
              content = {
                scriptureRef: planItem.scriptureRef,
                verses: [{
                  id: planItem.id,
                  text: `Scripture not found: ${planItem.scriptureRef}`,
                  book: 'Unknown',
                  chapter: 0,
                  verse: 0,
                  translation: 'KJV'
                }]
              };
            }
          } catch (error) {
            console.warn('Error fetching scripture:', error);
            // Fallback content
            content = {
              scriptureRef: planItem.scriptureRef,
              verses: [{
                id: planItem.id,
                text: `Error loading scripture: ${planItem.scriptureRef}`,
                book: 'Error',
                chapter: 0,
                verse: 0,
                translation: 'KJV'
              }]
            };
          }
        }
      } else if (planItem.type === 'announcement') {
        // Announcement content is straightforward
        content = {
          text: planItem.title,
          description: planItem.notes || ''
        };
      } else {
        // Default content for any other types or missing references
        content = {
          text: planItem.title,
          description: planItem.notes || 'Content not available'
        };
      }

      // Create service item with real content
      const serviceItem: ServiceItem = {
        id: planItem.id,
        type: planItem.type as 'scripture' | 'song' | 'announcement',
        title: planItem.title,
        content,
        duration: planItem.duration,
        order: planItem.order,
        notes: planItem.notes,
        planId: plan.id,
        planItemId: planItem.id
      };

      serviceItems.push(serviceItem);

    } catch (error) {
      console.error(`Error processing plan item ${planItem.id}:`, error);

      // Add fallback service item for failed items
      const fallbackItem: ServiceItem = {
        id: planItem.id,
        type: planItem.type as 'scripture' | 'song' | 'announcement',
        title: `Error: ${planItem.title}`,
        content: {
          text: 'Failed to load content',
          description: `Error loading content for ${planItem.type}: ${planItem.title}`
        },
        duration: planItem.duration,
        order: planItem.order,
        notes: planItem.notes,
        planId: plan.id,
        planItemId: planItem.id
      };

      serviceItems.push(fallbackItem);
    }
  }

  return serviceItems;
};

// Hook for plan integration logic
export const usePlanIntegration = ({ onPlanLoaded, onPlanCreated }: PlanIntegrationProps) => {
  const handlePlanSelect = async (plan: PlanWithItems) => {
    console.log('🔄 Converting plan to service items:', plan.name);

    try {
      // Convert plan items to service items with real content
      const serviceItems = await convertPlanToServiceItems(plan);

      console.log('✅ Plan converted:', {
        planName: plan.name,
        itemCount: serviceItems.length,
        items: serviceItems.map(item => ({ id: item.id, title: item.title, type: item.type }))
      });

      // Notify parent component
      onPlanLoaded(serviceItems, plan);

    } catch (error) {
      console.error('Failed to convert plan to service items:', error);

      // Create fallback service items for the plan
      const fallbackItems: ServiceItem[] = plan.planItems.map((planItem: any) => ({
        id: planItem.id,
        type: planItem.type as 'scripture' | 'song' | 'announcement',
        title: `Error: ${planItem.title}`,
        content: {
          text: 'Failed to load content',
          description: `Error loading ${planItem.type} content`
        },
        duration: planItem.duration,
        order: planItem.order,
        notes: planItem.notes,
        planId: plan.id,
        planItemId: planItem.id
      }));

      // Notify with fallback items
      onPlanLoaded(fallbackItems, plan);
    }
  };

  const handlePlanCreate = (plan: PlanWithItems) => {
    console.log('📝 Plan created:', plan.name);

    if (onPlanCreated) {
      onPlanCreated(plan);
    }
  };

  return {
    handlePlanSelect,
    handlePlanCreate
  };
};

// Enhanced plan statistics component
export interface PlanStatsProps {
  plan: PlanWithItems | null;
  serviceItems: ServiceItem[];
}

export const PlanStats: React.FC<PlanStatsProps> = ({ plan, serviceItems }) => {
  if (!plan) return null;

  const totalDuration = serviceItems.reduce((sum, item) => sum + (item.duration || 0), 0);
  const itemsByType = serviceItems.reduce((acc, item) => {
    acc[item.type] = (acc[item.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="bg-card rounded-lg border border-border p-4 mb-4">
      <h4 className="text-sm font-semibold mb-3 text-foreground">Plan Statistics</h4>
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <div className="text-muted-foreground">Plan: <span className="text-foreground font-medium">{plan.name}</span></div>
          <div className="text-muted-foreground">Items: <span className="text-foreground">{serviceItems.length}</span></div>
          <div className="text-muted-foreground">Duration: <span className="text-foreground">{totalDuration}s</span></div>
        </div>
        <div>
          <div className="text-muted-foreground">Songs: <span className="text-foreground">{itemsByType.song || 0}</span></div>
          <div className="text-muted-foreground">Scriptures: <span className="text-foreground">{itemsByType.scripture || 0}</span></div>
          <div className="text-muted-foreground">Announcements: <span className="text-foreground">{itemsByType.announcement || 0}</span></div>
        </div>
      </div>
    </div>
  );
};

// Plan quick actions component
export interface PlanQuickActionsProps {
  plan: PlanWithItems | null;
  onReloadPlan?: () => void;
  onClearPlan?: () => void;
  onEditPlan?: () => void;
}

export const PlanQuickActions: React.FC<PlanQuickActionsProps> = ({
  plan,
  onReloadPlan,
  onClearPlan,
  onEditPlan
}) => {
  if (!plan) return null;

  return (
    <div className="flex gap-2 mb-4">
      {onReloadPlan && (
        <button
          onClick={onReloadPlan}
          className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
        >
          Reload Plan
        </button>
      )}
      {onEditPlan && (
        <button
          onClick={onEditPlan}
          className="px-3 py-1 bg-gray-600 text-white rounded text-sm hover:bg-gray-700"
        >
          Edit Plan
        </button>
      )}
      {onClearPlan && (
        <button
          onClick={onClearPlan}
          className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
        >
          Clear Plan
        </button>
      )}
    </div>
  );
};

export default {
  usePlanIntegration,
  convertPlanToServiceItems,
  PlanStats,
  PlanQuickActions
};