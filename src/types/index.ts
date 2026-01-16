// 用户类型
export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: 'admin' | 'manager' | 'employee';
}

// 节点类型
export type NodeType = 'initiator' | 'approver' | 'condition' | 'cc' | 'end';

// 条件配置
export interface ConditionConfig {
  field: string; // 字段名
  operator: 'eq' | 'ne' | 'gt' | 'lt' | 'gte' | 'lte' | 'contains'; // 操作符
  value: string | number; // 值
}

// 审批节点类型
export interface ApprovalNode {
  id: string;
  name: string;
  type: NodeType;
  // 审批人相关
  approverId?: string;
  approverName?: string;
  approverIds?: string[]; // 多人审批
  approverNames?: string[];
  // 条件相关
  condition?: ConditionConfig;
  priority?: number; // 条件优先级
  // 其他配置
  required?: number; // 并行审批时需要的通过数量
  // 位置信息（用于可视化）
  position?: { x: number; y: number };
  // 连接信息
  nextNodeIds?: string[]; // 下一个节点ID列表（支持分支）
  parentNodeId?: string; // 父节点ID（用于条件分支）
}

// 流程定义
export interface Workflow {
  id: string;
  name: string;
  description: string;
  category: string; // 流程分类
  nodes: ApprovalNode[];
  createdAt: string;
  createdBy: string;
  status: 'active' | 'inactive';
}

// 审批实例状态
export type ApprovalStatus = 'pending' | 'approved' | 'rejected' | 'cancelled';

// 审批记录
export interface ApprovalRecord {
  id: string;
  nodeId: string;
  nodeName: string;
  approverId: string;
  approverName: string;
  status: ApprovalStatus;
  comment?: string;
  timestamp: string;
}

// 流程实例
export interface WorkflowInstance {
  id: string;
  workflowId: string;
  workflowName: string;
  title: string;
  description: string;
  applicantId: string;
  applicantName: string;
  currentNodeId?: string;
  status: ApprovalStatus;
  records: ApprovalRecord[];
  attachments?: string[];
  createdAt: string;
  updatedAt: string;
}

// 审批操作
export interface ApprovalAction {
  instanceId: string;
  nodeId: string;
  action: 'approve' | 'reject' | 'transfer';
  comment?: string;
  transferToId?: string;
}
