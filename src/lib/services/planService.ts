import { ServicePlan, ServicePlanItem, Service } from '@prisma/client';

export type ServicePlanWithItems = ServicePlan & {
  planItems: (ServicePlanItem & {
    song?: { id: string; title: string; artist?: string } | null;
    presentation?: { id: string; title: string } | null;
  })[];
  service?: Service;
};

export type ServicePlanItemWithContent = ServicePlanItem & {
  song?: { id: string; title: string; artist?: string | null } | null;
  presentation?: { id: string; title: string } | null;
};

export interface CreateServicePlanData {
  name: string;
  serviceId: string;
  description?: string;
  notes?: string;
  order?: number;
  isTemplate?: boolean;
}

export interface UpdateServicePlanData {
  name?: string;
  description?: string;
  notes?: string;
  order?: number;
  isTemplate?: boolean;
}

export interface CreateServicePlanItemData {
  planId: string;
  type: string;
  title: string;
  order: number;
  duration?: number;
  notes?: string;
  settings?: string;
  songId?: string;
  presentationId?: string;
  scriptureRef?: string;
}

export interface UpdateServicePlanItemData {
  type?: string;
  title?: string;
  order?: number;
  duration?: number;
  notes?: string;
  settings?: string;
  songId?: string;
  presentationId?: string;
  scriptureRef?: string;
}

export class PlanService {
  constructor() {
    // No longer need direct database access - using IPC
  }

  // Service Plan CRUD Operations

  async createServicePlan(data: CreateServicePlanData): Promise<ServicePlan> {
    if (!window.electronAPI?.invoke) {
      throw new Error('Electron API not available');
    }

    return await window.electronAPI.invoke('db:createPlan', {
      ...data,
      order: data.order ?? 0,
      isTemplate: data.isTemplate ?? false
    });
  }

  async getServicePlan(id: string): Promise<ServicePlanWithItems | null> {
    if (!window.electronAPI?.invoke) {
      throw new Error('Electron API not available');
    }

    return await window.electronAPI.invoke('db:getPlan', id);
  }

  async getServicePlans(serviceId?: string, includeTemplates = false): Promise<ServicePlanWithItems[]> {
    if (!window.electronAPI?.invoke) {
      throw new Error('Electron API not available');
    }

    const filters: any = {};

    if (!includeTemplates) {
      filters.isTemplate = false;
    }

    return await window.electronAPI.invoke('db:loadPlans', {
      serviceId,
      filters
    });
  }

  async getServicePlanTemplates(): Promise<ServicePlanWithItems[]> {
    if (!window.electronAPI?.invoke) {
      throw new Error('Electron API not available');
    }

    return await window.electronAPI.invoke('db:loadPlans', {
      filters: { isTemplate: true }
    });
  }

  async updateServicePlan(id: string, data: UpdateServicePlanData): Promise<ServicePlan> {
    if (!window.electronAPI?.invoke) {
      throw new Error('Electron API not available');
    }

    return await window.electronAPI.invoke('db:updatePlan', { id, ...data });
  }

  async deleteServicePlan(id: string): Promise<void> {
    if (!window.electronAPI?.invoke) {
      throw new Error('Electron API not available');
    }

    await window.electronAPI.invoke('db:deletePlan', id);
  }

  async duplicateServicePlan(id: string, newName: string, serviceId?: string): Promise<ServicePlanWithItems> {
    if (!window.electronAPI?.invoke) {
      throw new Error('Electron API not available');
    }

    return await window.electronAPI.invoke('db:duplicatePlan', {
      planId: id,
      newName,
      serviceId
    });
  }

  // Service Plan Item CRUD Operations

  async createServicePlanItem(data: CreateServicePlanItemData): Promise<ServicePlanItem> {
    if (!window.electronAPI?.invoke) {
      throw new Error('Electron API not available');
    }

    // Validate content references before creating plan item
    await this.validateContentReferences(data);

    return await window.electronAPI.invoke('db:createPlanItem', data);
  }

  // Validate that referenced content exists
  private async validateContentReferences(data: CreateServicePlanItemData | UpdateServicePlanItemData): Promise<void> {
    if (!window.electronAPI?.invoke) {
      throw new Error('Electron API not available');
    }

    try {
      // Validate song reference
      if (data.songId) {
        const song = await window.electronAPI.invoke('db:getSong', data.songId);
        if (!song) {
          throw new Error(`Song with ID '${data.songId}' not found`);
        }
      }

      // Validate presentation reference
      if (data.presentationId) {
        const presentation = await window.electronAPI.invoke('db:getPresentation', data.presentationId);
        if (!presentation) {
          throw new Error(`Presentation with ID '${data.presentationId}' not found`);
        }
      }

      // Validate scripture reference (verse ID)
      if (data.scriptureRef) {
        // Try to find the verse by ID if it looks like a verse ID
        if (data.scriptureRef.length > 10) { // Assume verse IDs are longer than simple references
          try {
            // We don't have a direct verse getter, so we'll try to search
            const searchResults = await window.electronAPI.invoke('db:searchVerses', {
              query: data.scriptureRef
            });
            if (!searchResults || searchResults.length === 0) {
              console.warn(`Scripture reference '${data.scriptureRef}' could not be validated`);
            }
          } catch (err) {
            console.warn('Could not validate scripture reference:', err);
          }
        }
      }
    } catch (error) {
      throw new Error(`Content validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getServicePlanItem(id: string): Promise<ServicePlanItemWithContent | null> {
    // Get item by getting the full plan and finding the item
    // Since we don't have individual item IPC handler, we could add one if needed
    // For now, this method is not heavily used, so we'll throw an error
    throw new Error('getServicePlanItem not implemented with IPC - use getServicePlan instead');
  }

  async getServicePlanItems(planId: string): Promise<ServicePlanItemWithContent[]> {
    // Get items by getting the full plan
    const plan = await this.getServicePlan(planId);
    return plan?.planItems || [];
  }

  async updateServicePlanItem(id: string, data: UpdateServicePlanItemData): Promise<ServicePlanItem> {
    if (!window.electronAPI?.invoke) {
      throw new Error('Electron API not available');
    }

    // Validate content references if they're being updated
    if (data.songId || data.presentationId || data.scriptureRef) {
      await this.validateContentReferences(data);
    }

    return await window.electronAPI.invoke('db:updatePlanItem', { id, ...data });
  }

  async deleteServicePlanItem(id: string): Promise<void> {
    if (!window.electronAPI?.invoke) {
      throw new Error('Electron API not available');
    }

    await window.electronAPI.invoke('db:deletePlanItem', id);
  }

  async reorderServicePlanItems(planId: string, itemOrders: { id: string; order: number }[]): Promise<void> {
    if (!window.electronAPI?.invoke) {
      throw new Error('Electron API not available');
    }

    await window.electronAPI.invoke('db:reorderPlanItems', {
      planId,
      itemOrders
    });
  }

  // Bulk operations

  async addMultipleItems(planId: string, items: Omit<CreateServicePlanItemData, 'planId'>[]): Promise<ServicePlanItem[]> {
    if (!window.electronAPI?.invoke) {
      throw new Error('Electron API not available');
    }

    return await window.electronAPI.invoke('db:createPlanItems', {
      planId,
      items
    });
  }

  async deleteMultipleItems(itemIds: string[]): Promise<void> {
    if (!window.electronAPI?.invoke) {
      throw new Error('Electron API not available');
    }

    // Delete items one by one since we don't have bulk delete IPC handler
    for (const itemId of itemIds) {
      await this.deleteServicePlanItem(itemId);
    }
  }

  // Utility functions

  async getNextOrderNumber(planId: string): Promise<number> {
    // Get plan items and calculate next order
    const items = await this.getServicePlanItems(planId);
    if (items.length === 0) return 0;

    const maxOrder = Math.max(...items.map(item => item.order));
    return maxOrder + 1;
  }

  async validatePlanItemOrder(planId: string): Promise<void> {
    if (!window.electronAPI?.invoke) {
      throw new Error('Electron API not available');
    }

    const items = await this.getServicePlanItems(planId);

    // Reorder items to ensure no gaps
    const itemOrders = items.map((item, index) => ({
      id: item.id,
      order: index
    }));

    await this.reorderServicePlanItems(planId, itemOrders);
  }

  async getPlanDuration(planId: string): Promise<number> {
    const items = await this.getServicePlanItems(planId);

    return items.reduce((sum, item) => {
      return sum + (item.duration || 0);
    }, 0);
  }

  async searchPlans(query: string, serviceId?: string): Promise<ServicePlanWithItems[]> {
    if (!window.electronAPI?.invoke) {
      throw new Error('Electron API not available');
    }

    return await window.electronAPI.invoke('db:loadPlans', {
      serviceId,
      query
    });
  }

  // Get the actual content for a plan item (song, scripture, presentation)
  async getPlanItemContent(item: ServicePlanItemWithContent): Promise<any> {
    if (!window.electronAPI?.invoke) {
      throw new Error('Electron API not available');
    }

    try {
      if (item.songId) {
        return await window.electronAPI.invoke('db:getSong', item.songId);
      } else if (item.presentationId) {
        return await window.electronAPI.invoke('db:getPresentation', item.presentationId);
      } else if (item.scriptureRef && item.scriptureRef.length > 10) {
        // Try to find verse by ID or search
        const searchResults = await window.electronAPI.invoke('db:searchVerses', {
          query: item.scriptureRef
        });
        return searchResults?.[0] || null;
      }
      return null;
    } catch (error) {
      console.error('Error loading plan item content:', error);
      return null;
    }
  }
}

// Export a singleton instance
export const planService = new PlanService();