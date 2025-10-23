import React, { useState } from 'react';
import {
  CheckCircle,
  XCircle,
  Clock,
  User,
  MessageSquare,
  AlertCircle,
  Send,
  FileText,
  Eye,
  Edit3
} from 'lucide-react';

/**
 * ApprovalControls Component
 *
 * Plan approval workflow management:
 * - Draft/Review/Approved states
 * - Approval requests
 * - Reviewer assignment
 * - Approval comments
 * - Status transitions
 * - Approval history
 */

export type ApprovalStatus = 'draft' | 'pending_review' | 'approved' | 'rejected' | 'changes_requested';

export interface ApprovalRequest {
  id: string;
  planId: string;
  requestedBy: string;
  requestedAt: Date;
  reviewers: string[];
  status: ApprovalStatus;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  deadline?: Date;
  notes?: string;
}

export interface ApprovalResponse {
  id: string;
  requestId: string;
  reviewer: string;
  status: 'approved' | 'rejected' | 'changes_requested';
  respondedAt: Date;
  comments?: string;
  suggestedChanges?: string[];
}

interface ApprovalControlsProps {
  planId: string;
  planTitle: string;
  currentStatus: ApprovalStatus;
  currentUser: string;
  isOwner: boolean;
  isReviewer: boolean;
  approvalRequest?: ApprovalRequest;
  approvalResponses?: ApprovalResponse[];
  onStatusChange: (status: ApprovalStatus, notes?: string) => void;
  onRequestApproval: (reviewers: string[], notes?: string) => void;
  onRespondToRequest: (status: 'approved' | 'rejected' | 'changes_requested', comments?: string) => void;
  className?: string;
}

const STATUS_CONFIG: Record<
  ApprovalStatus,
  { label: string; icon: React.ComponentType<any>; color: string; bgColor: string }
> = {
  draft: {
    label: 'Draft',
    icon: Edit3,
    color: 'text-gray-400',
    bgColor: 'bg-gray-900/20'
  },
  pending_review: {
    label: 'Pending Review',
    icon: Clock,
    color: 'text-yellow-400',
    bgColor: 'bg-yellow-900/20'
  },
  approved: {
    label: 'Approved',
    icon: CheckCircle,
    color: 'text-green-400',
    bgColor: 'bg-green-900/20'
  },
  rejected: {
    label: 'Rejected',
    icon: XCircle,
    color: 'text-red-400',
    bgColor: 'bg-red-900/20'
  },
  changes_requested: {
    label: 'Changes Requested',
    icon: AlertCircle,
    color: 'text-orange-400',
    bgColor: 'bg-orange-900/20'
  }
};

export const ApprovalControls: React.FC<ApprovalControlsProps> = ({
  planId,
  planTitle,
  currentStatus,
  currentUser,
  isOwner,
  isReviewer,
  approvalRequest,
  approvalResponses = [],
  onStatusChange,
  onRequestApproval,
  onRespondToRequest,
  className = ''
}) => {
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [showResponseModal, setShowResponseModal] = useState(false);
  const [reviewerInput, setReviewerInput] = useState('');
  const [reviewers, setReviewers] = useState<string[]>([]);
  const [requestNotes, setRequestNotes] = useState('');
  const [responseStatus, setResponseStatus] = useState<'approved' | 'rejected' | 'changes_requested'>('approved');
  const [responseComments, setResponseComments] = useState('');

  const config = STATUS_CONFIG[currentStatus];
  const Icon = config.icon;

  const canRequestApproval = isOwner && (currentStatus === 'draft' || currentStatus === 'changes_requested');
  const canRespond = isReviewer && currentStatus === 'pending_review';
  const canReturnToDraft = isOwner && currentStatus !== 'draft';

  const handleAddReviewer = () => {
    if (reviewerInput.trim() && !reviewers.includes(reviewerInput.trim())) {
      setReviewers([...reviewers, reviewerInput.trim()]);
      setReviewerInput('');
    }
  };

  const handleRemoveReviewer = (reviewer: string) => {
    setReviewers(reviewers.filter((r) => r !== reviewer));
  };

  const handleSubmitRequest = () => {
    if (reviewers.length === 0) {
      alert('Please add at least one reviewer');
      return;
    }
    onRequestApproval(reviewers, requestNotes);
    setShowRequestModal(false);
    setReviewers([]);
    setRequestNotes('');
  };

  const handleSubmitResponse = () => {
    onRespondToRequest(responseStatus, responseComments);
    setShowResponseModal(false);
    setResponseComments('');
  };

  // Calculate approval progress
  const approvalProgress = approvalResponses.length > 0 && approvalRequest
    ? {
        total: approvalRequest.reviewers.length,
        approved: approvalResponses.filter((r) => r.status === 'approved').length,
        rejected: approvalResponses.filter((r) => r.status === 'rejected').length,
        changesRequested: approvalResponses.filter((r) => r.status === 'changes_requested').length,
        pending: approvalRequest.reviewers.length - approvalResponses.length
      }
    : null;

  return (
    <div className={`${className}`}>
      {/* Status Display */}
      <div className="bg-gray-900 border border-gray-700 rounded-lg p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded ${config.bgColor}`}>
              <Icon className={`w-5 h-5 ${config.color}`} />
            </div>
            <div>
              <div className="text-sm text-gray-400">Plan Status</div>
              <div className={`text-lg font-medium ${config.color}`}>{config.label}</div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            {canRequestApproval && (
              <button
                onClick={() => setShowRequestModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
              >
                <Send className="w-4 h-4" />
                Request Approval
              </button>
            )}

            {canRespond && (
              <button
                onClick={() => setShowResponseModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
              >
                <CheckCircle className="w-4 h-4" />
                Review
              </button>
            )}

            {canReturnToDraft && (
              <button
                onClick={() => onStatusChange('draft')}
                className="flex items-center gap-2 px-3 py-2 text-gray-300 border border-gray-600 rounded hover:bg-gray-700 transition-colors"
              >
                <Edit3 className="w-4 h-4" />
                Return to Draft
              </button>
            )}
          </div>
        </div>

        {/* Approval Request Info */}
        {approvalRequest && currentStatus === 'pending_review' && (
          <div className="bg-gray-800 rounded-lg border border-gray-700 p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="text-sm font-medium text-white">Approval Request</div>
              {approvalRequest.deadline && (
                <div className="flex items-center gap-1 text-xs text-gray-400">
                  <Clock className="w-3 h-3" />
                  <span>Due: {new Date(approvalRequest.deadline).toLocaleDateString()}</span>
                </div>
              )}
            </div>

            {/* Reviewers */}
            <div className="mb-3">
              <div className="text-xs text-gray-400 mb-2">Reviewers</div>
              <div className="flex flex-wrap gap-2">
                {approvalRequest.reviewers.map((reviewer) => {
                  const response = approvalResponses.find((r) => r.reviewer === reviewer);
                  return (
                    <div
                      key={reviewer}
                      className={`
                        flex items-center gap-2 px-3 py-1.5 rounded text-sm
                        ${
                          response
                            ? response.status === 'approved'
                              ? 'bg-green-900/30 text-green-400 border border-green-500/30'
                              : response.status === 'rejected'
                              ? 'bg-red-900/30 text-red-400 border border-red-500/30'
                              : 'bg-orange-900/30 text-orange-400 border border-orange-500/30'
                            : 'bg-gray-800 text-gray-300'
                        }
                      `}
                    >
                      <User className="w-3 h-3" />
                      <span>{reviewer}</span>
                      {response && (
                        response.status === 'approved' ? (
                          <CheckCircle className="w-3 h-3" />
                        ) : response.status === 'rejected' ? (
                          <XCircle className="w-3 h-3" />
                        ) : (
                          <AlertCircle className="w-3 h-3" />
                        )
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Progress */}
            {approvalProgress && (
              <div className="mb-3">
                <div className="flex items-center justify-between text-xs text-gray-400 mb-2">
                  <span>Review Progress</span>
                  <span>
                    {approvalProgress.total - approvalProgress.pending} / {approvalProgress.total}
                  </span>
                </div>
                <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-green-500"
                    style={{
                      width: `${((approvalProgress.total - approvalProgress.pending) / approvalProgress.total) * 100}%`
                    }}
                  />
                </div>
                <div className="flex items-center gap-4 mt-2 text-xs">
                  {approvalProgress.approved > 0 && (
                    <div className="flex items-center gap-1 text-green-400">
                      <CheckCircle className="w-3 h-3" />
                      <span>{approvalProgress.approved} Approved</span>
                    </div>
                  )}
                  {approvalProgress.rejected > 0 && (
                    <div className="flex items-center gap-1 text-red-400">
                      <XCircle className="w-3 h-3" />
                      <span>{approvalProgress.rejected} Rejected</span>
                    </div>
                  )}
                  {approvalProgress.changesRequested > 0 && (
                    <div className="flex items-center gap-1 text-orange-400">
                      <AlertCircle className="w-3 h-3" />
                      <span>{approvalProgress.changesRequested} Changes Requested</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Request Notes */}
            {approvalRequest.notes && (
              <div className="text-sm text-gray-300 bg-gray-900 rounded p-2">
                <div className="text-xs text-gray-500 mb-1">Notes from {approvalRequest.requestedBy}</div>
                {approvalRequest.notes}
              </div>
            )}
          </div>
        )}

        {/* Approval Responses */}
        {approvalResponses.length > 0 && (
          <div className="mt-4 space-y-2">
            <div className="text-sm font-medium text-gray-300 mb-2">Review Responses</div>
            {approvalResponses.map((response) => (
              <div key={response.id} className="bg-gray-800 rounded border border-gray-700 p-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-gray-400" />
                    <span className="text-sm font-medium text-white">{response.reviewer}</span>
                  </div>
                  <div
                    className={`
                      flex items-center gap-1 px-2 py-1 rounded text-xs font-medium
                      ${
                        response.status === 'approved'
                          ? 'bg-green-900/30 text-green-400'
                          : response.status === 'rejected'
                          ? 'bg-red-900/30 text-red-400'
                          : 'bg-orange-900/30 text-orange-400'
                      }
                    `}
                  >
                    {response.status === 'approved' ? (
                      <CheckCircle className="w-3 h-3" />
                    ) : response.status === 'rejected' ? (
                      <XCircle className="w-3 h-3" />
                    ) : (
                      <AlertCircle className="w-3 h-3" />
                    )}
                    <span>
                      {response.status === 'approved'
                        ? 'Approved'
                        : response.status === 'rejected'
                        ? 'Rejected'
                        : 'Changes Requested'}
                    </span>
                  </div>
                </div>
                {response.comments && (
                  <div className="text-sm text-gray-300">{response.comments}</div>
                )}
                <div className="text-xs text-gray-500 mt-2">
                  {new Date(response.respondedAt).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Request Approval Modal */}
      {showRequestModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg border border-gray-700 p-6 max-w-lg w-full mx-4">
            <div className="flex items-center gap-3 mb-6">
              <Send className="w-6 h-6 text-blue-400" />
              <h3 className="text-lg font-medium text-white">Request Approval</h3>
            </div>

            {/* Plan Title */}
            <div className="mb-4 p-3 bg-gray-900 rounded">
              <div className="text-xs text-gray-400 mb-1">Plan</div>
              <div className="text-white font-medium">{planTitle}</div>
            </div>

            {/* Reviewers */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Reviewers *
              </label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={reviewerInput}
                  onChange={(e) => setReviewerInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddReviewer()}
                  placeholder="Enter name or email..."
                  className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                />
                <button
                  onClick={handleAddReviewer}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                >
                  Add
                </button>
              </div>
              {reviewers.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {reviewers.map((reviewer) => (
                    <div
                      key={reviewer}
                      className="flex items-center gap-2 px-3 py-1.5 bg-gray-700 rounded text-sm text-white"
                    >
                      <User className="w-3 h-3" />
                      <span>{reviewer}</span>
                      <button
                        onClick={() => handleRemoveReviewer(reviewer)}
                        className="text-red-400 hover:text-red-300"
                      >
                        <XCircle className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Notes */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Notes (optional)
              </label>
              <textarea
                value={requestNotes}
                onChange={(e) => setRequestNotes(e.target.value)}
                placeholder="Add any context or special instructions for reviewers..."
                rows={3}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 resize-none"
              />
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setShowRequestModal(false)}
                className="px-4 py-2 text-gray-300 border border-gray-600 rounded hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitRequest}
                disabled={reviewers.length === 0}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Send Request
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Response Modal */}
      {showResponseModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg border border-gray-700 p-6 max-w-lg w-full mx-4">
            <div className="flex items-center gap-3 mb-6">
              <Eye className="w-6 h-6 text-green-400" />
              <h3 className="text-lg font-medium text-white">Review Plan</h3>
            </div>

            {/* Plan Title */}
            <div className="mb-4 p-3 bg-gray-900 rounded">
              <div className="text-xs text-gray-400 mb-1">Plan</div>
              <div className="text-white font-medium">{planTitle}</div>
            </div>

            {/* Response Status */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-300 mb-3">
                Your Decision *
              </label>
              <div className="space-y-2">
                <label className="flex items-center gap-3 p-3 bg-gray-700 rounded cursor-pointer hover:bg-gray-600 transition-colors">
                  <input
                    type="radio"
                    name="responseStatus"
                    checked={responseStatus === 'approved'}
                    onChange={() => setResponseStatus('approved')}
                    className="w-4 h-4"
                  />
                  <CheckCircle className="w-5 h-5 text-green-400" />
                  <div>
                    <div className="text-white font-medium">Approve</div>
                    <div className="text-xs text-gray-400">Plan is ready to proceed</div>
                  </div>
                </label>

                <label className="flex items-center gap-3 p-3 bg-gray-700 rounded cursor-pointer hover:bg-gray-600 transition-colors">
                  <input
                    type="radio"
                    name="responseStatus"
                    checked={responseStatus === 'changes_requested'}
                    onChange={() => setResponseStatus('changes_requested')}
                    className="w-4 h-4"
                  />
                  <AlertCircle className="w-5 h-5 text-orange-400" />
                  <div>
                    <div className="text-white font-medium">Request Changes</div>
                    <div className="text-xs text-gray-400">Plan needs modifications</div>
                  </div>
                </label>

                <label className="flex items-center gap-3 p-3 bg-gray-700 rounded cursor-pointer hover:bg-gray-600 transition-colors">
                  <input
                    type="radio"
                    name="responseStatus"
                    checked={responseStatus === 'rejected'}
                    onChange={() => setResponseStatus('rejected')}
                    className="w-4 h-4"
                  />
                  <XCircle className="w-5 h-5 text-red-400" />
                  <div>
                    <div className="text-white font-medium">Reject</div>
                    <div className="text-xs text-gray-400">Plan cannot proceed as-is</div>
                  </div>
                </label>
              </div>
            </div>

            {/* Comments */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Comments {responseStatus !== 'approved' && '*'}
              </label>
              <textarea
                value={responseComments}
                onChange={(e) => setResponseComments(e.target.value)}
                placeholder={
                  responseStatus === 'approved'
                    ? 'Add optional feedback...'
                    : 'Please explain what needs to be changed...'
                }
                rows={4}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 resize-none"
              />
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setShowResponseModal(false)}
                className="px-4 py-2 text-gray-300 border border-gray-600 rounded hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitResponse}
                disabled={responseStatus !== 'approved' && !responseComments.trim()}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Submit Review
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ApprovalControls;
