import { useState } from 'react';
import { useWorkflowStore } from '../store/workflowStore';
import ApprovalCard from './ApprovalCard';
import CreateRequestModal from './CreateRequestModal';

export default function MyRequests() {
  const { instances, currentUser } = useWorkflowStore();
  const [showCreateModal, setShowCreateModal] = useState(false);

  const myInstances = instances.filter(
    (inst) => inst.applicantId === currentUser?.id
  );

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-gray-800">
          我的申请 ({myInstances.length})
        </h2>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
        >
          + 新建申请
        </button>
      </div>

      {myInstances.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <div className="text-6xl mb-4">📝</div>
          <p className="text-gray-500 text-lg mb-4">您还没有提交任何申请</p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            创建第一个申请
          </button>
        </div>
      ) : (
        <div className="grid gap-4">
          {myInstances.map((instance) => (
            <ApprovalCard key={instance.id} instance={instance} />
          ))}
        </div>
      )}

      {showCreateModal && (
        <CreateRequestModal onClose={() => setShowCreateModal(false)} />
      )}
    </div>
  );
}
