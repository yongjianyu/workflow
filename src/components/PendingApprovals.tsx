import { useWorkflowStore } from '../store/workflowStore';
import ApprovalCard from './ApprovalCard';

export default function PendingApprovals() {
  const { instances, currentUser } = useWorkflowStore();

  const pendingInstances = instances.filter((inst) => {
    if (inst.status !== 'pending') return false;
    if (!inst.currentNodeId) return false;
    
    // 找到当前节点对应的审批人
    const workflow = useWorkflowStore.getState().workflows.find(
      (w) => w.id === inst.workflowId
    );
    if (!workflow) return false;
    
    const currentNode = workflow.nodes.find((n) => n.id === inst.currentNodeId);
    return currentNode?.approverId === currentUser?.id;
  });

  if (pendingInstances.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">📭</div>
        <p className="text-gray-500 text-lg">暂无待审批事项</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-gray-800">
          待我审批 ({pendingInstances.length})
        </h2>
      </div>
      <div className="grid gap-4">
        {pendingInstances.map((instance) => (
          <ApprovalCard key={instance.id} instance={instance} showActions />
        ))}
      </div>
    </div>
  );
}
