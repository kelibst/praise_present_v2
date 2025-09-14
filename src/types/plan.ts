import { ServicePlan, ServicePlanItem, Song, Presentation, Service } from '@prisma/client';

// Plan item types
export type PlanItemType = 'song' | 'scripture' | 'presentation' | 'announcement' | 'media' | 'transition';

// Extended interfaces with related data
export interface PlanWithItems extends Omit<ServicePlan, 'id' | 'name' | 'serviceId' | 'description' | 'notes' | 'order' | 'isTemplate' | 'createdAt' | 'updatedAt'> {
  id: string;
  name: string;
  serviceId: string;
  description?: string | null;
  notes?: string | null;
  order: number;
  isTemplate: boolean;
  createdAt: Date;
  updatedAt: Date;
  planItems: PlanItemWithContent[];
  service?: Service;
  _count?: {
    planItems: number;
  };
}

export interface PlanItemWithContent extends Omit<ServicePlanItem, 'id' | 'planId' | 'type' | 'title' | 'order' | 'duration' | 'notes' | 'settings' | 'songId' | 'presentationId' | 'scriptureRef'> {
  id: string;
  planId: string;
  type: string;
  title: string;
  order: number;
  duration?: number | null;
  notes?: string | null;
  settings?: string | null;
  songId?: string | null;
  presentationId?: string | null;
  scriptureRef?: string | null;
  song?: { id: string; title: string; artist?: string | null } | null;
  presentation?: { id: string; title: string } | null;
}

// Form data interfaces
export interface CreatePlanFormData {
  name: string;
  serviceId: string;
  description?: string;
  notes?: string;
  order?: number;
  isTemplate?: boolean;
}

export interface UpdatePlanFormData {
  name?: string;
  description?: string;
  notes?: string;
  order?: number;
  isTemplate?: boolean;
}

export interface CreatePlanItemFormData {
  type: PlanItemType;
  title: string;
  duration?: number;
  notes?: string;
  settings?: Record<string, any>;

  // Content references
  songId?: string;
  presentationId?: string;
  scriptureRef?: string;
}

export interface UpdatePlanItemFormData {
  type?: PlanItemType;
  title?: string;
  order?: number;
  duration?: number;
  notes?: string;
  settings?: Record<string, any>;

  // Content references
  songId?: string;
  presentationId?: string;
  scriptureRef?: string;
}

// UI component props interfaces
export interface PlanManagerProps {
  serviceId?: string;
  onPlanSelect?: (plan: PlanWithItems | any) => void; // Accept both types for compatibility
  onPlanCreate?: (plan: PlanWithItems | any) => void;
  onPlanUpdate?: (plan: PlanWithItems | any) => void;
  onPlanDelete?: (planId: string) => void;
  className?: string;
}

export interface PlanEditorProps {
  plan?: PlanWithItems | null;
  serviceId: string;
  isOpen: boolean;
  onClose: () => void;
  onSave: (plan: PlanWithItems) => void;
  className?: string;
}

export interface PlanItemSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectItems: (items: CreatePlanItemFormData[]) => void;
  existingItems?: PlanItemWithContent[];
  className?: string;
}

export interface PlanItemCardProps {
  item: PlanItemWithContent;
  index: number;
  isSelected?: boolean;
  isDragging?: boolean;
  onSelect?: (item: PlanItemWithContent) => void;
  onEdit?: (item: PlanItemWithContent) => void;
  onDelete?: (itemId: string) => void;
  onDragStart?: (e: React.DragEvent, item: PlanItemWithContent, index: number) => void;
  onDragEnd?: (e: React.DragEvent) => void;
  className?: string;
}

export interface PlanPreviewProps {
  plan: PlanWithItems;
  currentItemIndex?: number;
  onItemSelect?: (index: number) => void;
  onGoLive?: (item: PlanItemWithContent, index: number) => void;
  showControls?: boolean;
  className?: string;
}

// Plan execution interfaces
export interface PlanExecutionState {
  planId: string;
  currentItemIndex: number;
  isExecuting: boolean;
  isLive: boolean;
  startedAt?: Date;
  pausedAt?: Date;
  completedAt?: Date;
}

export interface PlanExecutionControls {
  start: () => void;
  pause: () => void;
  resume: () => void;
  stop: () => void;
  next: () => void;
  previous: () => void;
  goToItem: (index: number) => void;
  goLive: (itemIndex?: number) => void;
  clearLive: () => void;
}

// Plan template interfaces
export interface PlanTemplate {
  id: string;
  name: string;
  description?: string;
  category: string;
  items: PlanTemplateItem[];
  isDefault?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface PlanTemplateItem {
  type: PlanItemType;
  title: string;
  duration?: number;
  notes?: string;
  settings?: Record<string, any>;
  order: number;
}

// Plan statistics and analytics
export interface PlanStats {
  totalDuration: number;
  itemCount: number;
  typeBreakdown: Record<PlanItemType, number>;
  averageItemDuration: number;
  estimatedEndTime?: Date;
}

// Plan validation and errors
export interface PlanValidationResult {
  isValid: boolean;
  errors: PlanValidationError[];
  warnings: PlanValidationWarning[];
}

export interface PlanValidationError {
  type: 'missing_content' | 'invalid_order' | 'duplicate_item' | 'missing_required_field';
  message: string;
  itemId?: string;
  field?: string;
}

export interface PlanValidationWarning {
  type: 'long_duration' | 'no_duration' | 'missing_notes' | 'suggested_order';
  message: string;
  itemId?: string;
  suggestion?: string;
}

// Plan import/export interfaces
export interface PlanExportData {
  plan: Omit<ServicePlan, 'id' | 'serviceId' | 'createdAt' | 'updatedAt'>;
  items: Omit<ServicePlanItem, 'id' | 'planId'>[];
  metadata: {
    exportedAt: Date;
    version: string;
    serviceName?: string;
  };
}

export interface PlanImportResult {
  success: boolean;
  plan?: PlanWithItems;
  errors: string[];
  warnings: string[];
}

// Live presentation integration interfaces
export interface PlanPresentationItem {
  id: string;
  type: PlanItemType;
  title: string;
  content: any;
  slides?: any[];
  duration?: number;
  settings?: Record<string, any>;
}

// Drag and drop interfaces
export interface DragDropItem {
  id: string;
  type: PlanItemType;
  index: number;
  item: PlanItemWithContent;
}

export interface DropResult {
  sourceIndex: number;
  destinationIndex: number;
  item: PlanItemWithContent;
}

// Hook return types
export interface UsePlanReturn {
  plans: PlanWithItems[];
  isLoading: boolean;
  error: string | null;
  createPlan: (data: CreatePlanFormData) => Promise<PlanWithItems>;
  updatePlan: (id: string, data: UpdatePlanFormData) => Promise<PlanWithItems>;
  deletePlan: (id: string) => Promise<void>;
  duplicatePlan: (id: string, newName: string, serviceId?: string) => Promise<PlanWithItems>;
  refreshPlans: () => Promise<void>;
}

export interface UsePlanItemsReturn {
  items: PlanItemWithContent[];
  isLoading: boolean;
  error: string | null;
  createItem: (data: CreatePlanItemFormData) => Promise<PlanItemWithContent>;
  updateItem: (id: string, data: UpdatePlanItemFormData) => Promise<PlanItemWithContent>;
  deleteItem: (id: string) => Promise<void>;
  reorderItems: (sourceIndex: number, destinationIndex: number) => Promise<void>;
  addMultipleItems: (items: CreatePlanItemFormData[]) => Promise<PlanItemWithContent[]>;
  refreshItems: () => Promise<void>;
}

export interface UsePlanExecutionReturn {
  state: PlanExecutionState;
  controls: PlanExecutionControls;
  currentItem: PlanItemWithContent | null;
  nextItem: PlanItemWithContent | null;
  previousItem: PlanItemWithContent | null;
  progress: number;
}

// Event interfaces for plan system
export interface PlanEvent {
  type: 'plan:created' | 'plan:updated' | 'plan:deleted' | 'plan:duplicated';
  planId: string;
  plan?: PlanWithItems;
  timestamp: Date;
}

export interface PlanItemEvent {
  type: 'item:created' | 'item:updated' | 'item:deleted' | 'item:reordered';
  itemId: string;
  planId: string;
  item?: PlanItemWithContent;
  timestamp: Date;
}

export interface PlanExecutionEvent {
  type: 'execution:started' | 'execution:paused' | 'execution:resumed' | 'execution:stopped' | 'execution:item_changed' | 'execution:went_live';
  planId: string;
  itemIndex?: number;
  item?: PlanItemWithContent;
  timestamp: Date;
}