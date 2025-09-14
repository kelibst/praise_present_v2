import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Copy, Play, Clock, ListOrdered, Search, Filter } from 'lucide-react';
import { PlanWithItems, PlanManagerProps, CreatePlanFormData } from '../../types/plan';
import { planService, ServicePlanWithItems } from '../../lib/services/planService';

export const PlanManager: React.FC<PlanManagerProps> = ({
  serviceId,
  onPlanSelect,
  onPlanCreate,
  onPlanUpdate,
  onPlanDelete,
  className = ''
}) => {
  const [plans, setPlans] = useState<ServicePlanWithItems[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showTemplates, setShowTemplates] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newPlanName, setNewPlanName] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<ServicePlanWithItems | null>(null);

  // Load plans
  const loadPlans = async () => {
    try {
      setIsLoading(true);
      const loadedPlans = await planService.getServicePlans(serviceId, showTemplates);
      setPlans(loadedPlans);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load plans');
      console.error('Failed to load plans:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPlans();
  }, [serviceId, showTemplates]);

  // Filter plans based on search query
  const filteredPlans = plans.filter(plan =>
    plan.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (plan.description?.toLowerCase() || '').includes(searchQuery.toLowerCase())
  );

  // Create new plan
  const handleCreatePlan = async () => {
    if (!serviceId || !newPlanName.trim()) return;

    try {
      const planData: CreatePlanFormData = {
        name: newPlanName.trim(),
        serviceId,
        description: '',
        order: plans.length
      };

      const newPlan = await planService.createServicePlan(planData);
      const fullPlan = await planService.getServicePlan(newPlan.id);

      if (fullPlan) {
        setPlans(prev => [...prev, fullPlan]);
        onPlanCreate?.(fullPlan);
        setSelectedPlanId(fullPlan.id);
        onPlanSelect?.(fullPlan);
      }

      // Reset form
      setNewPlanName('');
      setShowCreateForm(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create plan');
      console.error('Failed to create plan:', err);
    }
  };

  // Show create form
  const handleShowCreateForm = () => {
    setShowCreateForm(true);
    setNewPlanName('');
  };

  // Cancel create form
  const handleCancelCreate = () => {
    setShowCreateForm(false);
    setNewPlanName('');
  };

  // Duplicate plan (simplified - just adds " (Copy)" to the name)
  const handleDuplicatePlan = async (plan: ServicePlanWithItems) => {
    try {
      const newName = `${plan.name} (Copy)`;
      const duplicatedPlan = await planService.duplicateServicePlan(plan.id, newName, serviceId);
      setPlans(prev => [...prev, duplicatedPlan]);
      onPlanCreate?.(duplicatedPlan);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to duplicate plan');
      console.error('Failed to duplicate plan:', err);
    }
  };

  // Delete plan
  const handleDeletePlan = async (plan: ServicePlanWithItems) => {
    setDeleteConfirm(plan);
  };

  // Confirm delete plan
  const confirmDeletePlan = async () => {
    if (!deleteConfirm) return;

    try {
      await planService.deleteServicePlan(deleteConfirm.id);
      setPlans(prev => prev.filter(p => p.id !== deleteConfirm.id));
      onPlanDelete?.(deleteConfirm.id);

      if (selectedPlanId === deleteConfirm.id) {
        setSelectedPlanId(null);
      }

      setDeleteConfirm(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete plan');
      console.error('Failed to delete plan:', err);
    }
  };

  // Cancel delete
  const cancelDeletePlan = () => {
    setDeleteConfirm(null);
  };

  // Select plan
  const handlePlanSelect = (plan: ServicePlanWithItems) => {
    setSelectedPlanId(plan.id);
    onPlanSelect?.(plan);
  };

  // Calculate plan duration
  const getPlanDuration = (plan: ServicePlanWithItems): number => {
    return plan.planItems.reduce((total, item) => total + (item.duration || 0), 0);
  };

  // Format duration
  const formatDuration = (minutes: number): string => {
    if (minutes === 0) return '0 min';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;

    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  if (isLoading) {
    return (
      <div className={`flex items-center justify-center p-8 ${className}`}>
        <div className="text-gray-400">Loading plans...</div>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white">Service Plans</h3>
        <button
          onClick={handleShowCreateForm}
          disabled={!serviceId}
          className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
        >
          <Plus className="w-4 h-4" />
          New Plan
        </button>
      </div>

      {/* Search and Filter */}
      <div className="space-y-2">
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search plans..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-400 text-sm focus:outline-none focus:border-blue-500"
            />
          </div>
          <button
            onClick={() => setShowTemplates(!showTemplates)}
            className={`px-3 py-2 rounded text-sm border flex items-center gap-2 ${
              showTemplates
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-gray-700 text-gray-300 border-gray-600 hover:bg-gray-600'
            }`}
          >
            <Filter className="w-4 h-4" />
            Templates
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-3 bg-red-900/50 border border-red-600 rounded text-red-300 text-sm">
          {error}
          <button
            onClick={loadPlans}
            className="ml-2 underline hover:no-underline"
          >
            Retry
          </button>
        </div>
      )}

      {/* Plans List */}
      <div className="space-y-2">
        {filteredPlans.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            {searchQuery ? (
              <>
                <Search className="w-8 h-8 mx-auto mb-2 opacity-50" />
                No plans match your search
              </>
            ) : (
              <>
                <ListOrdered className="w-8 h-8 mx-auto mb-2 opacity-50" />
                {serviceId ? 'No plans created yet' : 'Select a service to view plans'}
              </>
            )}
          </div>
        ) : (
          filteredPlans.map((plan) => {
            const isSelected = selectedPlanId === plan.id;
            const duration = getPlanDuration(plan);

            return (
              <div
                key={plan.id}
                onClick={() => handlePlanSelect(plan)}
                className={`p-4 rounded-lg border cursor-pointer transition-all duration-200 ${
                  isSelected
                    ? 'border-blue-500 bg-blue-900/30 shadow-lg'
                    : 'border-gray-600 bg-gray-700 hover:bg-gray-600 hover:border-gray-500'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium text-white truncate">
                        {plan.name}
                      </h4>
                      {plan.isTemplate && (
                        <span className="px-2 py-1 bg-purple-600 text-white text-xs rounded-full">
                          Template
                        </span>
                      )}
                    </div>

                    {plan.description && (
                      <p className="text-sm text-gray-400 mt-1 line-clamp-2">
                        {plan.description}
                      </p>
                    )}

                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                      <div className="flex items-center gap-1">
                        <ListOrdered className="w-3 h-3" />
                        {plan.planItems.length} items
                      </div>
                      {duration > 0 && (
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatDuration(duration)}
                        </div>
                      )}
                      <div>
                        Updated {new Date(plan.updatedAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 ml-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePlanSelect(plan);
                      }}
                      className="p-2 text-green-400 hover:text-green-300 hover:bg-gray-600 rounded transition-colors"
                      title="Present this plan"
                    >
                      <Play className="w-4 h-4" />
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDuplicatePlan(plan);
                      }}
                      className="p-2 text-blue-400 hover:text-blue-300 hover:bg-gray-600 rounded transition-colors"
                      title="Duplicate plan"
                    >
                      <Copy className="w-4 h-4" />
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        // TODO: Implement edit functionality
                        console.log('Edit plan:', plan.id);
                      }}
                      className="p-2 text-gray-400 hover:text-gray-300 hover:bg-gray-600 rounded transition-colors"
                      title="Edit plan"
                    >
                      <Edit className="w-4 h-4" />
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeletePlan(plan);
                      }}
                      className="p-2 text-red-400 hover:text-red-300 hover:bg-gray-600 rounded transition-colors"
                      title="Delete plan"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Plan Templates */}
      {showTemplates && (
        <div className="border-t border-gray-700 pt-4">
          <h4 className="text-sm font-medium text-gray-300 mb-2">Quick Templates</h4>
          <div className="grid grid-cols-2 gap-2">
            {[
              { name: 'Sunday Service', items: ['Opening Prayer', 'Worship Songs', 'Scripture Reading', 'Sermon', 'Closing Prayer'] },
              { name: 'Worship Night', items: ['Opening Worship', 'Prayer Time', 'Testimony', 'Extended Worship', 'Benediction'] },
              { name: 'Bible Study', items: ['Welcome', 'Opening Prayer', 'Scripture Study', 'Discussion', 'Closing Prayer'] }
            ].map((template) => (
              <button
                key={template.name}
                onClick={async () => {
                  if (!serviceId) return;
                  try {
                    const planData: CreatePlanFormData = {
                      name: template.name,
                      serviceId,
                      description: `Template with ${template.items.length} items`,
                      order: plans.length,
                      isTemplate: false
                    };

                    const newPlan = await planService.createServicePlan(planData);

                    // Add template items
                    const items = template.items.map((title, index) => ({
                      type: 'announcement' as const,
                      title,
                      order: index,
                      duration: 5
                    }));

                    await planService.addMultipleItems(newPlan.id, items);

                    // Refresh plans
                    await loadPlans();
                  } catch (err) {
                    console.error('Failed to create template plan:', err);
                  }
                }}
                className="p-2 text-left bg-gray-800 border border-gray-700 rounded hover:bg-gray-700 transition-colors"
              >
                <div className="font-medium text-white text-sm">{template.name}</div>
                <div className="text-xs text-gray-400">{template.items.length} items</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Create Plan Form Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg border border-gray-700 w-full max-w-md p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Create New Plan</h3>
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Plan name"
                value={newPlanName}
                onChange={(e) => setNewPlanName(e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleCreatePlan();
                  } else if (e.key === 'Escape') {
                    handleCancelCreate();
                  }
                }}
              />
              <div className="flex justify-end gap-2">
                <button
                  onClick={handleCancelCreate}
                  className="px-4 py-2 text-gray-300 border border-gray-600 rounded hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreatePlan}
                  disabled={!newPlanName.trim()}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Create
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg border border-gray-700 w-full max-w-md p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Delete Plan</h3>
            <p className="text-gray-300 mb-6">
              Are you sure you want to delete <strong>"{deleteConfirm.name}"</strong>?
              This action cannot be undone.
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={cancelDeletePlan}
                className="px-4 py-2 text-gray-300 border border-gray-600 rounded hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeletePlan}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PlanManager;