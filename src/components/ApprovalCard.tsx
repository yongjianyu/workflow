import { useState } from 'react';
import { useWorkflowStore } from '../store/workflowStore';
import type { WorkflowInstance } from '../types';
import ApprovalModal from './ApprovalModal';

interface ApprovalCardProps {
  instance: WorkflowInstance;
  showActions?: boolean;
}

export default function ApprovalCard({ instance, showActions = false }: ApprovalCardProps) {
  const { workflows } = useWorkflowStore();
  const [showModal, setShowModal] = useState(false);
  
  const workflow = workflows.find((w) => w.id === instance.workflowId);
  const currentNode = workflow?.nodes.find((n) => n.id === instance.currentNodeId);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'cancelled':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'approved':
        return '已通过';
      case 'rejected':
        return '已拒绝';
      case 'cancelled':
        return '已取消';
      default:
        return '审批中';
    }
  };

  return (
    <>
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1">
            <div className="flex items-center space-x-3 mb-2">
              <h3 className="text-lg font-semibold text-gray-900">{instance.title}</h3>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(instance.status)}`}>
                {getStatusText(instance.status)}
              </span>
            </div>
            <p className="text-sm text-gray-500 mb-2">
              <span className="font-medium">流程类型：</span>
              {instance.workflowName}
            </p>
            <p className="text-sm text-gray-500 mb-2">
              <span className="font-medium">申请人：</span>
              {instance.applicantName}
            </p>
            {currentNode && (
              <p className="text-sm text-gray-500 mb-2">
                <span className="font-medium">当前节点：</span>
                {currentNode.name}
              </p>
            )}
            <p className="text-sm text-gray-600 mt-3">{instance.description}</p>
          </div>
        </div>

        <div className="flex justify-between items-center pt-4 border-t border-gray-200">
          <div className="text-xs text-gray-400">
            创建时间：{new Date(instance.createdAt).toLocaleString('zh-CN')}
          </div>
          {showActions && (
            <button
              onClick={() => setShowModal(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
            >
              审批
            </button>
          )}
        </div>

        {/* 审批记录 */}
        {instance.records.length > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <h4 className="text-sm font-medium text-gray-700 mb-2">审批记录：</h4>
            <div className="space-y-2">
              {instance.records.map((record) => (
                <div key={record.id} className="text-xs text-gray-600 bg-gray-50 p-2 rounded">
                  <span className="font-medium">{record.approverName}</span>
                  <span className={`ml-2 ${record.status === 'approved' ? 'text-green-600' : 'text-red-600'}`}>
                    {record.status === 'approved' ? '✓ 通过' : '✗ 拒绝'}
                  </span>
                  {record.comment && (
                    <span className="ml-2 text-gray-500">- {record.comment}</span>
                  )}
                  <span className="ml-2 text-gray-400">
                    ({new Date(record.timestamp).toLocaleString('zh-CN')})
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {showModal && (
        <ApprovalModal
          instance={instance}
          onClose={() => setShowModal(false)}
        />
      )}
    </>
  );
}
