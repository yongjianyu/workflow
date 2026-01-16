import { useState } from 'react';
import { useWorkflowStore } from '../store/workflowStore';
import type { WorkflowInstance } from '../types';

interface ApprovalModalProps {
  instance: WorkflowInstance;
  onClose: () => void;
}

export default function ApprovalModal({ instance, onClose }: ApprovalModalProps) {
  const { approveInstance, currentUser } = useWorkflowStore();
  const [action, setAction] = useState<'approve' | 'reject'>('approve');
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = () => {
    if (!instance.currentNodeId) return;

    setLoading(true);
    
    // 模拟API调用延迟
    setTimeout(() => {
      approveInstance({
        instanceId: instance.id,
        nodeId: instance.currentNodeId!,
        action,
        comment: comment.trim() || undefined,
      });
      
      setLoading(false);
      onClose();
    }, 300);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-900">审批操作</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl"
          >
            ×
          </button>
        </div>

        <div className="mb-4">
          <p className="text-sm text-gray-600 mb-2">
            <span className="font-medium">申请标题：</span>
            {instance.title}
          </p>
          <p className="text-sm text-gray-600 mb-2">
            <span className="font-medium">申请人：</span>
            {instance.applicantName}
          </p>
          <p className="text-sm text-gray-600">
            <span className="font-medium">申请描述：</span>
            {instance.description}
          </p>
        </div>

        <div className="mb-4">
          <div className="flex space-x-4 mb-4">
            <button
              onClick={() => setAction('approve')}
              className={`flex-1 py-2 px-4 rounded-lg border-2 transition-colors ${
                action === 'approve'
                  ? 'border-green-500 bg-green-50 text-green-700'
                  : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
              }`}
            >
              ✓ 通过
            </button>
            <button
              onClick={() => setAction('reject')}
              className={`flex-1 py-2 px-4 rounded-lg border-2 transition-colors ${
                action === 'reject'
                  ? 'border-red-500 bg-red-50 text-red-700'
                  : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
              }`}
            >
              ✗ 拒绝
            </button>
          </div>

          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder={action === 'approve' ? '审批意见（可选）' : '请填写拒绝原因'}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            rows={4}
          />
        </div>

        <div className="flex space-x-3">
          <button
            onClick={onClose}
            className="flex-1 py-2 px-4 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
          >
            取消
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading || (action === 'reject' && !comment.trim())}
            className={`flex-1 py-2 px-4 rounded-lg text-white transition-colors ${
              action === 'approve'
                ? 'bg-green-600 hover:bg-green-700'
                : 'bg-red-600 hover:bg-red-700'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {loading ? '提交中...' : '确认提交'}
          </button>
        </div>
      </div>
    </div>
  );
}
