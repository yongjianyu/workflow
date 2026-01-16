import { useState } from 'react';
import { useWorkflowStore } from '../store/workflowStore';
import CreateWorkflowModal from './CreateWorkflowModal';
import type { Workflow } from '../types';

export default function WorkflowManagement() {
  const { workflows, deleteWorkflow, setActiveTab, setDesignWorkflowId } = useWorkflowStore();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingWorkflow, setEditingWorkflow] = useState<Workflow | null>(null);

  const handleDelete = (id: string) => {
    if (confirm('确定要删除这个流程吗？')) {
      deleteWorkflow(id);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-gray-800">
          流程管理 ({workflows.length})
        </h2>
        <button
          onClick={() => {
            setEditingWorkflow(null);
            setShowCreateModal(true);
          }}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
        >
          + 新建流程
        </button>
      </div>

      {workflows.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <div className="text-6xl mb-4">⚙️</div>
          <p className="text-gray-500 text-lg mb-4">还没有创建任何流程</p>
          <button
            onClick={() => {
              setEditingWorkflow(null);
              setShowCreateModal(true);
            }}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            创建第一个流程
          </button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {workflows.map((workflow) => (
            <div
              key={workflow.id}
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {workflow.name}
                  </h3>
                  <p className="text-sm text-gray-500 mb-2">{workflow.description}</p>
                  <span className="inline-block px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                    {workflow.category}
                  </span>
                </div>
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium ${
                    workflow.status === 'active'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {workflow.status === 'active' ? '启用' : '禁用'}
                </span>
              </div>

              <div className="mb-4">
                <p className="text-xs font-medium text-gray-700 mb-2">审批节点：</p>
                <div className="space-y-1">
                  {workflow.nodes.map((node, idx) => (
                    <div key={node.id} className="text-xs text-gray-600">
                      {idx + 1}. {node.name} ({node.approverName})
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex space-x-2 pt-4 border-t border-gray-200">
                <button
                  onClick={() => {
                    setDesignWorkflowId(workflow.id);
                    setActiveTab('workflow-design');
                  }}
                  className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  设计流程
                </button>
                <button
                  onClick={() => {
                    setEditingWorkflow(workflow);
                    setShowCreateModal(true);
                  }}
                  className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  编辑
                </button>
                <button
                  onClick={() => handleDelete(workflow.id)}
                  className="flex-1 px-3 py-2 text-sm border border-red-300 rounded-lg text-red-700 hover:bg-red-50 transition-colors"
                >
                  删除
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showCreateModal && (
        <CreateWorkflowModal
          workflow={editingWorkflow}
          onClose={() => {
            setShowCreateModal(false);
            setEditingWorkflow(null);
          }}
        />
      )}
    </div>
  );
}
