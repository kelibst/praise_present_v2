import { Service } from '@prisma/client';

interface CreateServiceData {
  name: string;
  date: string;
  type: string;
  description?: string;
  notes?: string;
}

interface UpdateServiceData {
  name?: string;
  date?: string;
  type?: string;
  description?: string;
  notes?: string;
}

export class ServiceService {
  constructor() {
    // No longer need direct database access - using IPC
  }

  async createService(data: CreateServiceData): Promise<Service> {
    try {
      if (!window.electronAPI?.invoke) {
        throw new Error('Electron API not available');
      }

      const service = await window.electronAPI.invoke('db:createService', data);
      return service;
    } catch (error) {
      console.error('Failed to create service:', error);
      throw error;
    }
  }

  async getServices(): Promise<Service[]> {
    try {
      if (!window.electronAPI?.invoke) {
        throw new Error('Electron API not available');
      }

      const services = await window.electronAPI.invoke('db:getServices');
      return services || [];
    } catch (error) {
      console.error('Failed to get services:', error);
      // Return empty array as fallback
      return [];
    }
  }

  async getServiceById(id: string): Promise<Service | null> {
    try {
      if (!window.electronAPI?.invoke) {
        throw new Error('Electron API not available');
      }

      const service = await window.electronAPI.invoke('db:getServiceById', id);
      return service;
    } catch (error) {
      console.error('Failed to get service:', error);
      return null;
    }
  }

  async updateService(id: string, data: UpdateServiceData): Promise<Service> {
    try {
      if (!window.electronAPI?.invoke) {
        throw new Error('Electron API not available');
      }

      const service = await window.electronAPI.invoke('db:updateService', { id, data });
      return service;
    } catch (error) {
      console.error('Failed to update service:', error);
      throw error;
    }
  }

  async deleteService(id: string): Promise<void> {
    try {
      if (!window.electronAPI?.invoke) {
        throw new Error('Electron API not available');
      }

      await window.electronAPI.invoke('db:deleteService', id);
    } catch (error) {
      console.error('Failed to delete service:', error);
      throw error;
    }
  }

  async createDefaultService(): Promise<Service> {
    try {
      if (!window.electronAPI?.invoke) {
        throw new Error('Electron API not available');
      }

      // Check if default service already exists
      let service = await window.electronAPI.invoke('db:findServiceByName', 'Default Service');

      if (!service) {
        service = await this.createService({
          name: 'Default Service',
          date: new Date().toISOString(),
          type: 'Sunday Morning',
          description: 'Default service for planning',
          notes: 'This is the default service created for planning purposes'
        });
      }

      return service;
    } catch (error) {
      console.error('Failed to create default service:', error);
      throw error;
    }
  }

  async getOrCreateDefaultService(): Promise<Service> {
    return await this.createDefaultService();
  }

  // Service templates
  getServiceTemplates() {
    return [
      {
        id: 'sunday-morning',
        name: 'Sunday Morning Service',
        type: 'Sunday Morning',
        description: 'Traditional Sunday morning worship service',
        estimatedDuration: 75, // minutes
        defaultItems: [
          { type: 'song', title: 'Welcome Song', duration: 4, order: 1 },
          { type: 'announcement', title: 'Welcome & Announcements', duration: 5, order: 2 },
          { type: 'song', title: 'Opening Worship', duration: 15, order: 3 },
          { type: 'song', title: 'Worship Set', duration: 20, order: 4 },
          { type: 'scripture', title: 'Scripture Reading', duration: 3, order: 5 },
          { type: 'sermon', title: 'Sermon', duration: 25, order: 6 },
          { type: 'song', title: 'Response Song', duration: 5, order: 7 },
          { type: 'announcement', title: 'Closing & Benediction', duration: 3, order: 8 }
        ]
      },
      {
        id: 'evening-service',
        name: 'Evening Service',
        type: 'Evening Service',
        description: 'Sunday evening service',
        estimatedDuration: 60,
        defaultItems: [
          { type: 'song', title: 'Opening Song', duration: 4, order: 1 },
          { type: 'song', title: 'Worship Set', duration: 15, order: 2 },
          { type: 'scripture', title: 'Scripture Reading', duration: 3, order: 3 },
          { type: 'sermon', title: 'Teaching', duration: 30, order: 4 },
          { type: 'song', title: 'Closing Song', duration: 5, order: 5 },
          { type: 'announcement', title: 'Dismissal', duration: 3, order: 6 }
        ]
      },
      {
        id: 'midweek',
        name: 'Midweek Service',
        type: 'Midweek',
        description: 'Wednesday night Bible study and prayer',
        estimatedDuration: 45,
        defaultItems: [
          { type: 'song', title: 'Opening Song', duration: 4, order: 1 },
          { type: 'song', title: 'Worship Song', duration: 6, order: 2 },
          { type: 'scripture', title: 'Scripture Study', duration: 25, order: 3 },
          { type: 'prayer', title: 'Prayer Time', duration: 8, order: 4 },
          { type: 'announcement', title: 'Closing', duration: 2, order: 5 }
        ]
      },
      {
        id: 'special-event',
        name: 'Special Event',
        type: 'Special Events',
        description: 'Special occasions and holiday services',
        estimatedDuration: 90,
        defaultItems: [
          { type: 'song', title: 'Welcome Song', duration: 5, order: 1 },
          { type: 'announcement', title: 'Special Welcome', duration: 5, order: 2 },
          { type: 'song', title: 'Themed Worship', duration: 20, order: 3 },
          { type: 'media', title: 'Special Presentation', duration: 10, order: 4 },
          { type: 'scripture', title: 'Themed Scripture', duration: 5, order: 5 },
          { type: 'sermon', title: 'Special Message', duration: 30, order: 6 },
          { type: 'song', title: 'Response & Dedication', duration: 10, order: 7 },
          { type: 'announcement', title: 'Closing & Fellowship', duration: 5, order: 8 }
        ]
      }
    ];
  }

  async createServiceFromTemplate(templateId: string, customData?: Partial<CreateServiceData>): Promise<Service> {
    const templates = this.getServiceTemplates();
    const template = templates.find(t => t.id === templateId);

    if (!template) {
      throw new Error(`Service template '${templateId}' not found`);
    }

    const serviceData: CreateServiceData = {
      name: customData?.name || `${template.name} - ${new Date().toLocaleDateString()}`,
      date: customData?.date || new Date().toISOString(),
      type: customData?.type || template.type,
      description: customData?.description || template.description,
      notes: customData?.notes || `Created from ${template.name} template`
    };

    return await this.createService(serviceData);
  }
}

export const serviceService = new ServiceService();