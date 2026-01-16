import { useState, useEffect } from 'react';
import { useWorkflowStore } from '../store/workflowStore';
import type { Workflow, ApprovalNode } from '../types';
import WorkflowDesigner from './WorkflowDesigner';

interface CreateWorkflowModalProps {
  workflow?: Workflow | null;
  onClose: () => void;
}

export default function CreateWorkflowModal({ workflow, onClose }: CreateWorkflowModalProps) {
  const { addWorkflow, updateWorkflow } = useWorkflowStore();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [nodes, setNodes] = useState<ApprovalNode[]>([]);
  const [showDesigner, setShowDesigner] = useState(false);
  const [loading, setLoading] = useState(false);

  const isEditMode = !!workflow;

  useEffect(() => {
    if (workflow) {
      setName(workflow.name);
      setDescription(workflow.description);
      setCategory(workflow.category);
      setNodes(workflow.nodes);
    }
  }, [workflow]);

  const handleDesignerSave = (designedNodes: ApprovalNode[]) => {
    setNodes(designedNodes);
    setShowDesigner(false);
  };

  const handleSubmit = () => {
    if (!name.trim() || !category.trim() || nodes.length === 0) {
      alert('请填写完整信息并设计流程');
      return;
    }

    // 验证节点配置
    const hasUnconfiguredNodes = nodes.some((node) => {
      if (node.type === 'approver' && !node.approverId && !node.approverIds?.length) {
        return true;
      }
      if (node.type === 'condition' && !node.condition) {
        return true;
      }
      if (node.type === 'cc' && !node.approverIds?.length) {
        return true;
      }
      return false;
    });

    if (hasUnconfiguredNodes) {
      alert('请配置所有节点的信息');
      return;
    }

    setLoading(true);

    const workflowData: Workflow = {
      id: workflow?.id || `wf${Date.now()}`,
      name: name.trim(),
      description: description.trim(),
      category: category.trim(),
      nodes,
      createdAt: workflow?.createdAt || new Date().toISOString(),
      createdBy: workflow?.createdBy || useWorkflowStore.getState().currentUser!.id,
      status: workflow?.status || 'active',
    };

    setTimeout(() => {
      if (isEditMode) {
        updateWorkflow(workflow.id, workflowData);
      } else {
        addWorkflow(workflowData);
      }
      setLoading(false);
      onClose();
    }, 300);
  };

  if (showDesigner) {
    return (
      <div className="fixed inset-0 bg-white z-50 flex flex-col">
        <WorkflowDesigner
          workflowId={workflow?.id}
          initialNodes={nodes}
          onSave={handleDesignerSave}
          onClose={() => setShowDesigner(false)}
        />
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-900">
            {isEditMode ? '编辑流程' : '新建流程'}
          </h2>
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
              流程名称 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="例如：请假申请"
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              流程分类 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="例如：人事、财务、采购"
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              流程描述
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="描述这个流程的用途"
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              rows={3}
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-medium text-gray-700">
                流程设计 <span className="text-red-500">*</span>
              </label>
              <button
                onClick={() => setShowDesigner(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
              >
                {nodes.length > 0 ? '编辑流程' : '设计流程'}
              </button>
            </div>

            {nodes.length === 0 ? (
              <div className="text-center py-8 border border-gray-300 border-dashed rounded-lg">
                <p className="text-gray-500 text-sm mb-4">请设计审批流程</p>
                <button
                  onClick={() => setShowDesigner(true)}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  开始设计
                </button>
              </div>
            ) : (
              <div className="border border-gray-300 rounded-lg p-4 bg-gray-50">
                <div className="text-sm text-gray-700 mb-2">
                  已设计 {nodes.length} 个节点
                </div>
                <div className="text-xs text-gray-500">
                  发起人节点：{nodes.filter((n) => n.type === 'initiator').length} 个
                  <br />
                  审批节点：{nodes.filter((n) => n.type === 'approver').length} 个
                  <br />
                  条件节点：{nodes.filter((n) => n.type === 'condition').length} 个
                  <br />
                  抄送节点：{nodes.filter((n) => n.type === 'cc').length} 个
                </div>
              </div>
            )}
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
            disabled={loading || !name.trim() || !category.trim() || nodes.length === 0}
            className="flex-1 py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? '保存中...' : isEditMode ? '保存修改' : '创建流程'}
          </button>
        </div>
      </div>
    </div>
  );
}
