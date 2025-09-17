import React from 'react';
import { ServiceItem } from '../service/ServiceItem';
import { PlanWithItems } from '../../types/plan';

// Types for plan integration
export interface PlanIntegrationProps {
  onPlanLoaded: (serviceItems: ServiceItem[], plan: PlanWithItems) => void;
  onPlanCreated?: (plan: PlanWithItems) => void;
}

// Utility function to convert plan items to service items
export const convertPlanToServiceItems = (plan: PlanWithItems): ServiceItem[] => {
  return plan.planItems.map((planItem: any) => ({
    id: planItem.id,
    type: planItem.type as 'scripture' | 'song' | 'announcement',
    title: planItem.title,
    content: {
      // Map content based on type
      ...(planItem.type === 'song' && planItem.song ? {
        title: planItem.song.title,
        artist: planItem.song.artist || planItem.song.artist,
        lyrics: planItem.song.lyrics || 'Lyrics not available'
      } : {}),
      ...(planItem.type === 'scripture' && planItem.scriptureRef ? {
        scriptureRef: planItem.scriptureRef,
        verses: [{
          id: planItem.id,
          text: 'Sample verse text',
          book: 'Sample Book',
          chapter: 1,
          verse: 1,
          translation: 'KJV'
        }]
      } : {}),
      ...(planItem.type === 'announcement' ? {
        text: planItem.title,
        description: planItem.notes || ''
      } : {})
    },
    duration: planItem.duration,
    order: planItem.order,
    notes: planItem.notes,
    planId: plan.id,
    planItemId: planItem.id
  }));
};

// Hook for plan integration logic
export const usePlanIntegration = ({ onPlanLoaded, onPlanCreated }: PlanIntegrationProps) => {
  const handlePlanSelect = (plan: PlanWithItems) => {
    console.log('🔄 Converting plan to service items:', plan.name);

    // Convert plan items to service items
    const serviceItems = convertPlanToServiceItems(plan);

    console.log('✅ Plan converted:', {
      planName: plan.name,
      itemCount: serviceItems.length,
      items: serviceItems.map(item => ({ id: item.id, title: item.title, type: item.type }))
    });

    // Notify parent component
    onPlanLoaded(serviceItems, plan);
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