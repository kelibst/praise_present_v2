import React, { useState, useEffect } from 'react';
import { X, Save, Plus, Type, Clock } from 'lucide-react';
import { PlanWithItems, PlanItemWithContent, PlanEditorProps, CreatePlanItemFormData } from '../../types/plan';
import { planService } from '../../lib/services/planService';
import PlanItemEditor from './PlanItemEditor';


export const PlanEditor: React.FC<PlanEditorProps> = ({
  plan,
  serviceId,
  isOpen,
  onClose,
  onSave,
  className = ''
}) => {
  const [planName, setPlanName] = useState('');
  const [planDescription, setPlanDescription] = useState('');
  const [planNotes, setPlanNotes] = useState('');
  const [planItems, setPlanItems] = useState<PlanItemWithContent[]>([]);
  const [draggedItemIndex, setDraggedItemIndex] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize form with plan data
  useEffect(() => {
    if (plan) {
      setPlanName(plan.name);
      setPlanDescription(plan.description || '');
      setPlanNotes(plan.notes || '');
      setPlanItems([...plan.planItems]);
    } else {
      // Reset for new plan
      setPlanName('');
      setPlanDescription('');
      setPlanNotes('');
      setPlanItems([]);
    }
    setError(null);
  }, [plan]);

  // Handle form submission
  const handleSave = async () => {
    if (!planName.trim()) {
      setError('Plan name is required');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      let savedPlan: PlanWithItems;

      if (plan) {
        // Update existing plan
        await planService.updateServicePlan(plan.id, {
          name: planName.trim(),
          description: planDescription.trim() || undefined,
          notes: planNotes.trim() || undefined
        });

        // Update plan items order
        const itemOrders = planItems.map((item, index) => ({
          id: item.id,
          order: index
        }));

        await planService.reorderServicePlanItems(plan.id, itemOrders);

        // Get updated plan with items
        savedPlan = await planService.getServicePlan(plan.id) as PlanWithItems;
      } else {
        // Create new plan
        const newPlan = await planService.createServicePlan({
          name: planName.trim(),
          serviceId,
          description: planDescription.trim() || undefined,
          notes: planNotes.trim() || undefined,
          order: 0
        });

        savedPlan = await planService.getServicePlan(newPlan.id) as PlanWithItems;
      }

      onSave(savedPlan);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save plan');
      console.error('Failed to save plan:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Add new item
  const handleAddItem = async () => {
    if (!plan?.id) {
      setError('Cannot add items to unsaved plan. Please save the plan first.');
      return;
    }

    setIsLoading(true);
    try {
      const newItemData: CreatePlanItemFormData = {
        type: 'announcement',
        title: 'New Item',
        duration: 5
      };

      // Create item in database immediately
      const createdItem = await planService.createServicePlanItem({
        planId: plan.id,
        type: newItemData.type,
        title: newItemData.title,
        order: planItems.length,
        duration: newItemData.duration || null,
        notes: null,
        settings: null,
        songId: null,
        presentationId: null,
        scriptureRef: null
      });

      // Add to UI state
      setPlanItems([...planItems, createdItem as PlanItemWithContent]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add item');
      console.error('Failed to add item:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Remove item
  const handleRemoveItem = async (index: number) => {
    const item = planItems[index];
    if (!item) return;

    setIsLoading(true);
    try {
      // Delete from database if it's not a temporary item
      if (!item.id.startsWith('temp-')) {
        await planService.deleteServicePlanItem(item.id);
      }

      // Remove from UI state
      setPlanItems(planItems.filter((_, i) => i !== index));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove item');
      console.error('Failed to remove item:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Update item
  const handleUpdateItem = async (index: number, field: keyof PlanItemWithContent, value: any) => {
    const item = planItems[index];
    if (!item) return;

    // Update UI state immediately for responsive feel
    const updatedItems = [...planItems];
    (updatedItems[index] as any)[field] = value;
    setPlanItems(updatedItems);

    // Persist to database if not a temporary item
    if (!item.id.startsWith('temp-')) {
      try {
        const updateData: any = {};
        updateData[field] = value;

        await planService.updateServicePlanItem(item.id, updateData);
      } catch (err) {
        console.error('Failed to update item:', err);
        // Revert the UI change on error
        setPlanItems(planItems);
        setError(err instanceof Error ? err.message : 'Failed to update item');
      }
    }
  };

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedItemIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = async (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();

    if (draggedItemIndex === null || draggedItemIndex === dropIndex) {
      setDraggedItemIndex(null);
      return;
    }

    const updatedItems = [...planItems];
    const draggedItem = updatedItems[draggedItemIndex];

    // Remove dragged item
    updatedItems.splice(draggedItemIndex, 1);

    // Insert at new position
    const adjustedDropIndex = draggedItemIndex < dropIndex ? dropIndex - 1 : dropIndex;
    updatedItems.splice(adjustedDropIndex, 0, draggedItem);

    // Update UI state immediately
    setPlanItems(updatedItems);
    setDraggedItemIndex(null);

    // Persist order changes to database
    if (plan?.id) {
      try {
        const itemOrders = updatedItems.map((item, index) => ({
          id: item.id,
          order: index
        })).filter(item => !item.id.startsWith('temp-')); // Only update real items

        if (itemOrders.length > 0) {
          await planService.reorderServicePlanItems(plan.id, itemOrders);
        }
      } catch (err) {
        console.error('Failed to reorder items:', err);
        setError(err instanceof Error ? err.message : 'Failed to reorder items');
        // Revert to original order on error
        setPlanItems(planItems);
      }
    }
  };

  const handleDragEnd = () => {
    setDraggedItemIndex(null);
  };

  // Calculate total duration
  const totalDuration = planItems.reduce((sum, item) => sum + (item.duration || 0), 0);

  // Format duration
  const formatDuration = (minutes: number): string => {
    if (minutes === 0) return '0 min';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  if (!isOpen) return null;

  return (
    <div className={`fixed inset-0 bg-black/50 flex items-center justify-center z-50 ${className}`}>
      <div className="bg-gray-800 rounded-lg border border-gray-700 w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <h2 className="text-xl font-bold text-white">
            {plan ? 'Edit Plan' : 'Create New Plan'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden flex flex-col">
          {/* Plan Details Form */}
          <div className="p-6 border-b border-gray-700">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Plan Name *
                </label>
                <input
                  type="text"
                  value={planName}
                  onChange={(e) => setPlanName(e.target.value)}
                  placeholder="Enter plan name..."
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Duration
                </label>
                <div className="flex items-center gap-2 px-3 py-2 bg-gray-700 border border-gray-600 rounded text-gray-300">
                  <Clock className="w-4 h-4" />
                  {formatDuration(totalDuration)}
                </div>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Description
                </label>
                <input
                  type="text"
                  value={planDescription}
                  onChange={(e) => setPlanDescription(e.target.value)}
                  placeholder="Brief description of the plan..."
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Notes
                </label>
                <textarea
                  value={planNotes}
                  onChange={(e) => setPlanNotes(e.target.value)}
                  placeholder="Additional notes or instructions..."
                  rows={2}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 resize-none"
                />
              </div>
            </div>
          </div>

          {/* Plan Items */}
          <div className="flex-1 overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-6 border-b border-gray-700">
              <h3 className="text-lg font-semibold text-white">Plan Items ({planItems.length})</h3>
              <button
                onClick={handleAddItem}
                className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
              >
                <Plus className="w-4 h-4" />
                Add Item
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {planItems.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <Type className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  No items in this plan yet. Click "Add Item" to get started.
                </div>
              ) : (
                <div className="space-y-3">
                  {planItems.map((item, index) => (
                    <PlanItemEditor
                      key={item.id}
                      item={item}
                      index={index}
                      onUpdate={handleUpdateItem}
                      onDelete={handleRemoveItem}
                      onDragStart={handleDragStart}
                      onDragOver={handleDragOver}
                      onDrop={handleDrop}
                      onDragEnd={handleDragEnd}
                      isDragging={draggedItemIndex === index}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-700">
          {error && (
            <div className="mb-4 p-3 bg-red-900/50 border border-red-600 rounded text-red-300 text-sm">
              {error}
            </div>
          )}

          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-400">
              {planItems.length} items • {formatDuration(totalDuration)} total
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={onClose}
                disabled={isLoading}
                className="px-4 py-2 text-gray-300 border border-gray-600 rounded hover:bg-gray-700 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                onClick={handleSave}
                disabled={isLoading || !planName.trim()}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save className="w-4 h-4" />
                {isLoading ? 'Saving...' : 'Save Plan'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlanEditor;