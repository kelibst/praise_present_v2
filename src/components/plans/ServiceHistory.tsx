import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Clock,
  Copy,
  Eye,
  Search,
  Filter,
  TrendingUp,
  BarChart3,
  CheckCircle,
  XCircle,
  AlertTriangle,
  ChevronDown,
  ChevronRight
} from 'lucide-react';

/**
 * ServiceHistory Component
 *
 * Historical service tracking and analytics:
 * - Past service records
 * - Execution statistics (on-time, duration variance)
 * - Popular songs/content tracking
 * - Copy from history
 * - Compare services
 * - Trend analysis
 */

export interface ServiceHistoryRecord {
  id: string;
  planId: string;
  planTitle: string;
  serviceDate: Date;
  executedAt?: Date;
  completedAt?: Date;
  plannedDuration: number; // minutes
  actualDuration?: number; // minutes
  status: 'planned' | 'completed' | 'cancelled';
  itemCount: number;
  completionRate?: number; // percentage of items completed
  deviationMinutes?: number; // actual - planned duration
  attendees?: number;
  notes?: string;
  items?: ServiceHistoryItem[];
}

export interface ServiceHistoryItem {
  id: string;
  type: string;
  title: string;
  duration: number;
  actualDuration?: number;
  completed: boolean;
  notes?: string;
}

interface ServiceHistoryProps {
  onCopyService?: (serviceId: string) => void;
  onViewService?: (serviceId: string) => void;
  onCompareServices?: (serviceIds: string[]) => void;
  className?: string;
}

export const ServiceHistory: React.FC<ServiceHistoryProps> = ({
  onCopyService,
  onViewService,
  onCompareServices,
  className = ''
}) => {
  const [history, setHistory] = useState<ServiceHistoryRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'completed' | 'cancelled'>('all');
  const [sortBy, setSortBy] = useState<'date' | 'duration' | 'deviation'>('date');
  const [showStats, setShowStats] = useState(true);
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [expandedServiceId, setExpandedServiceId] = useState<string | null>(null);

  // Load service history
  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    setLoading(true);
    try {
      // Fetch from database via IPC
      if (window.electronAPI?.invoke) {
        const records = await window.electronAPI.invoke('db:getServiceHistory', {
          limit: 50,
          includeItems: true
        });
        setHistory(records || []);
      }
    } catch (error) {
      console.error('Error loading service history:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filter and sort
  const filteredHistory = history
    .filter((record) => {
      // Filter by status
      if (filterStatus !== 'all' && record.status !== filterStatus) {
        return false;
      }

      // Filter by search query
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          record.planTitle.toLowerCase().includes(query) ||
          record.notes?.toLowerCase().includes(query)
        );
      }

      return true;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'date':
          return new Date(b.serviceDate).getTime() - new Date(a.serviceDate).getTime();
        case 'duration':
          return (b.actualDuration || b.plannedDuration) - (a.actualDuration || a.plannedDuration);
        case 'deviation':
          return Math.abs(b.deviationMinutes || 0) - Math.abs(a.deviationMinutes || 0);
        default:
          return 0;
      }
    });

  // Calculate statistics
  const stats = {
    total: history.length,
    completed: history.filter((r) => r.status === 'completed').length,
    cancelled: history.filter((r) => r.status === 'cancelled').length,
    avgDuration:
      history.length > 0
        ? Math.round(
            history.reduce((sum, r) => sum + (r.actualDuration || r.plannedDuration), 0) /
              history.length
          )
        : 0,
    avgDeviation:
      history.filter((r) => r.deviationMinutes !== undefined).length > 0
        ? Math.round(
            history
              .filter((r) => r.deviationMinutes !== undefined)
              .reduce((sum, r) => sum + Math.abs(r.deviationMinutes!), 0) /
              history.filter((r) => r.deviationMinutes !== undefined).length
          )
        : 0,
    onTimeRate:
      history.filter((r) => r.status === 'completed').length > 0
        ? Math.round(
            (history.filter(
              (r) => r.status === 'completed' && Math.abs(r.deviationMinutes || 0) <= 5
            ).length /
              history.filter((r) => r.status === 'completed').length) *
              100
          )
        : 0
  };

  const handleToggleService = (serviceId: string) => {
    setSelectedServices((prev) =>
      prev.includes(serviceId) ? prev.filter((id) => id !== serviceId) : [...prev, serviceId]
    );
  };

  const handleCompare = () => {
    if (selectedServices.length >= 2 && onCompareServices) {
      onCompareServices(selectedServices);
    }
  };

  const formatDate = (date: Date): string => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatDuration = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-400" />;
      case 'cancelled':
        return <XCircle className="w-4 h-4 text-red-400" />;
      default:
        return <AlertTriangle className="w-4 h-4 text-yellow-400" />;
    }
  };

  const getDeviationColor = (deviation?: number): string => {
    if (!deviation) return 'text-gray-400';
    if (Math.abs(deviation) <= 5) return 'text-green-400';
    if (Math.abs(deviation) <= 15) return 'text-yellow-400';
    return 'text-red-400';
  };

  const renderServiceRecord = (record: ServiceHistoryRecord) => {
    const isExpanded = expandedServiceId === record.id;
    const isSelected = selectedServices.includes(record.id);

    return (
      <div
        key={record.id}
        className={`
          bg-gray-900 border-2 rounded-lg transition-all
          ${isSelected ? 'border-blue-500' : 'border-gray-700'}
        `}
      >
        {/* Header */}
        <div className="p-4">
          <div className="flex items-center gap-3">
            {/* Selection Checkbox */}
            <input
              type="checkbox"
              checked={isSelected}
              onChange={() => handleToggleService(record.id)}
              className="w-5 h-5 rounded border-gray-600 bg-gray-800 text-blue-600 focus:ring-blue-500"
            />

            {/* Status Icon */}
            {getStatusIcon(record.status)}

            {/* Title and Date */}
            <div className="flex-1">
              <div className="font-medium text-white">{record.planTitle}</div>
              <div className="flex items-center gap-3 text-sm text-gray-400 mt-1">
                <div className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  <span>{formatDate(record.serviceDate)}</span>
                </div>
                {record.actualDuration && (
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>{formatDuration(record.actualDuration)}</span>
                  </div>
                )}
                {record.completionRate !== undefined && (
                  <div>
                    <span>{record.completionRate}% complete</span>
                  </div>
                )}
              </div>
            </div>

            {/* Deviation Badge */}
            {record.deviationMinutes !== undefined && (
              <div
                className={`px-2 py-1 rounded text-sm font-medium ${getDeviationColor(record.deviationMinutes)}`}
              >
                {record.deviationMinutes > 0 ? '+' : ''}
                {record.deviationMinutes}m
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center gap-1">
              {onViewService && (
                <button
                  onClick={() => onViewService(record.id)}
                  className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded transition-colors"
                  title="View details"
                >
                  <Eye className="w-4 h-4" />
                </button>
              )}
              {onCopyService && (
                <button
                  onClick={() => onCopyService(record.id)}
                  className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded transition-colors"
                  title="Copy service"
                >
                  <Copy className="w-4 h-4" />
                </button>
              )}
              <button
                onClick={() => setExpandedServiceId(isExpanded ? null : record.id)}
                className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded transition-colors"
                title={isExpanded ? 'Collapse' : 'Expand'}
              >
                {isExpanded ? (
                  <ChevronDown className="w-4 h-4" />
                ) : (
                  <ChevronRight className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          {/* Notes */}
          {record.notes && (
            <div className="mt-3 text-sm text-gray-400 bg-gray-800 rounded p-2">
              {record.notes}
            </div>
          )}
        </div>

        {/* Expanded Details */}
        {isExpanded && record.items && (
          <div className="border-t border-gray-700 p-4 bg-gray-900/50">
            <div className="text-sm font-medium text-gray-400 mb-3">Service Items</div>
            <div className="space-y-2">
              {record.items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-2 bg-gray-800 rounded text-sm"
                >
                  <div className="flex items-center gap-2 flex-1">
                    {item.completed ? (
                      <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
                    ) : (
                      <XCircle className="w-4 h-4 text-gray-600 flex-shrink-0" />
                    )}
                    <span className="text-white">{item.title}</span>
                  </div>
                  <div className="flex items-center gap-3 text-gray-400">
                    <span>{formatDuration(item.duration)}</span>
                    {item.actualDuration && (
                      <span
                        className={
                          Math.abs(item.actualDuration - item.duration) > 2
                            ? 'text-yellow-400'
                            : 'text-gray-400'
                        }
                      >
                        (actual: {formatDuration(item.actualDuration)})
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={`${className}`}>
      {/* Statistics Panel */}
      {showStats && (
        <div className="bg-gray-900 border border-gray-700 rounded-lg p-4 mb-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-blue-400" />
              <h3 className="font-medium text-white">Service Statistics</h3>
            </div>
            <button
              onClick={() => setShowStats(false)}
              className="text-gray-400 hover:text-white text-sm"
            >
              Hide
            </button>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="bg-gray-800 rounded p-3">
              <div className="text-2xl font-bold text-white mb-1">{stats.completed}</div>
              <div className="text-sm text-gray-400">Completed Services</div>
              <div className="text-xs text-gray-500 mt-1">
                {stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0}% of total
              </div>
            </div>

            <div className="bg-gray-800 rounded p-3">
              <div className="text-2xl font-bold text-white mb-1">{formatDuration(stats.avgDuration)}</div>
              <div className="text-sm text-gray-400">Avg Duration</div>
              <div className="text-xs text-gray-500 mt-1">Across all services</div>
            </div>

            <div className="bg-gray-800 rounded p-3">
              <div className="text-2xl font-bold text-white mb-1">{stats.onTimeRate}%</div>
              <div className="text-sm text-gray-400">On-Time Rate</div>
              <div className="text-xs text-gray-500 mt-1">Within 5 min of schedule</div>
            </div>

            <div className="bg-gray-800 rounded p-3">
              <div className="text-2xl font-bold text-white mb-1">{stats.total}</div>
              <div className="text-sm text-gray-400">Total Services</div>
              <div className="text-xs text-gray-500 mt-1">All time</div>
            </div>

            <div className="bg-gray-800 rounded p-3">
              <div className="text-2xl font-bold text-white mb-1">±{stats.avgDeviation}m</div>
              <div className="text-sm text-gray-400">Avg Deviation</div>
              <div className="text-xs text-gray-500 mt-1">From planned time</div>
            </div>

            <div className="bg-gray-800 rounded p-3">
              <div className="text-2xl font-bold text-red-400 mb-1">{stats.cancelled}</div>
              <div className="text-sm text-gray-400">Cancelled</div>
              <div className="text-xs text-gray-500 mt-1">
                {stats.total > 0 ? Math.round((stats.cancelled / stats.total) * 100) : 0}% of total
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="bg-gray-900 border border-gray-700 rounded-lg p-4 mb-4">
        <div className="flex items-center gap-3">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search services..."
              className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Filter */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as any)}
            className="px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white focus:outline-none focus:border-blue-500"
          >
            <option value="all">All Status</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>

          {/* Sort */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white focus:outline-none focus:border-blue-500"
          >
            <option value="date">Sort by Date</option>
            <option value="duration">Sort by Duration</option>
            <option value="deviation">Sort by Deviation</option>
          </select>

          {/* Compare Button */}
          {selectedServices.length >= 2 && onCompareServices && (
            <button
              onClick={handleCompare}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            >
              <TrendingUp className="w-4 h-4" />
              Compare ({selectedServices.length})
            </button>
          )}
        </div>
      </div>

      {/* History List */}
      <div className="space-y-3">
        {loading ? (
          <div className="p-8 text-center text-gray-400">Loading history...</div>
        ) : filteredHistory.length === 0 ? (
          <div className="p-8 bg-gray-900/30 rounded-lg border border-gray-700 text-center">
            <Calendar className="w-12 h-12 mx-auto mb-3 text-gray-600" />
            <div className="text-lg font-medium text-gray-400 mb-2">No services found</div>
            <div className="text-sm text-gray-500">
              {searchQuery
                ? 'Try adjusting your search or filters'
                : 'Service history will appear here after executing plans'}
            </div>
          </div>
        ) : (
          filteredHistory.map((record) => renderServiceRecord(record))
        )}
      </div>
    </div>
  );
};

export default ServiceHistory;
