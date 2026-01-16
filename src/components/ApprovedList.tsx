import { useWorkflowStore } from '../store/workflowStore';
import ApprovalCard from './ApprovalCard';

export default function ApprovedList() {
  const { instances, currentUser } = useWorkflowStore();

  const approvedInstances = instances.filter((inst) => {
    // 已审批的：状态为approved或rejected，且当前用户参与过审批
    if (inst.status === 'pending') return false;
    return inst.records.some((record) => record.approverId === currentUser?.id);
  });

  if (approvedInstances.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">📋</div>
        <p className="text-gray-500 text-lg">暂无已审批记录</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-gray-800">
          已审批 ({approvedInstances.length})
        </h2>
      </div>
      <div className="grid gap-4">
        {approvedInstances.map((instance) => (
          <ApprovalCard key={instance.id} instance={instance} />
        ))}
      </div>
    </div>
  );
}
