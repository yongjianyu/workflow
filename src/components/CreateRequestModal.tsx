import { useState } from 'react';
import { useWorkflowStore } from '../store/workflowStore';
import type { WorkflowInstance } from '../types';

interface CreateRequestModalProps {
  onClose: () => void;
}

export default function CreateRequestModal({ onClose }: CreateRequestModalProps) {
  const { workflows, addInstance, currentUser } = useWorkflowStore();
  const [selectedWorkflowId, setSelectedWorkflowId] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  const selectedWorkflow = workflows.find((w) => w.id === selectedWorkflowId);

  const handleSubmit = () => {
    if (!selectedWorkflowId || !title.trim()) return;

    setLoading(true);

    // 创建新的流程实例
    const newInstance: WorkflowInstance = {
      id: `inst${Date.now()}`,
      workflowId: selectedWorkflowId,
      workflowName: selectedWorkflow!.name,
      title: title.trim(),
      description: description.trim() || '',
      applicantId: currentUser!.id,
      applicantName: currentUser!.name,
      currentNodeId: selectedWorkflow!.nodes[0]?.id,
      status: 'pending',
      records: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setTimeout(() => {
      addInstance(newInstance);
      setLoading(false);
      onClose();
      // 重置表单
      setSelectedWorkflowId('');
      setTitle('');
      setDescription('');
    }, 300);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-900">新建申请</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl"
          >
            ×
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              选择流程类型 <span className="text-red-500">*</span>
            </label>
            <select
              value={selectedWorkflowId}
              onChange={(e) => setSelectedWorkflowId(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">请选择流程类型</option>
              {workflows
                .filter((w) => w.status === 'active')
                .map((workflow) => (
                  <option key={workflow.id} value={workflow.id}>
                    {workflow.name} - {workflow.description}
                  </option>
                ))}
            </select>
          </div>

          {selectedWorkflow && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-sm text-blue-800">
                <span className="font-medium">审批流程：</span>
                {selectedWorkflow.nodes.map((node, idx) => (
                  <span key={node.id}>
                    {idx > 0 && ' → '}
                    {node.name}
                  </span>
                ))}
              </p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              申请标题 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="请输入申请标题"
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              申请描述
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="请输入申请描述（可选）"
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              rows={4}
            />
          </div>
        </div>

        <div className="flex space-x-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 py-2 px-4 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
          >
            取消
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading || !selectedWorkflowId || !title.trim()}
            className="flex-1 py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? '提交中...' : '提交申请'}
          </button>
        </div>
      </div>
    </div>
  );
}
