import { create } from 'zustand';
import type { 
  Workflow, 
  WorkflowInstance, 
  User, 
  ApprovalAction,
  ApprovalStatus 
} from '../types';

interface WorkflowStore {
  // 当前用户
  currentUser: User | null;
  setCurrentUser: (user: User) => void;
  
  // 用户列表
  users: User[];
  setUsers: (users: User[]) => void;
  
  // 流程定义
  workflows: Workflow[];
  addWorkflow: (workflow: Workflow) => void;
  updateWorkflow: (id: string, workflow: Partial<Workflow>) => void;
  deleteWorkflow: (id: string) => void;
  
  // 流程实例
  instances: WorkflowInstance[];
  addInstance: (instance: WorkflowInstance) => void;
  updateInstance: (id: string, instance: Partial<WorkflowInstance>) => void;
  approveInstance: (action: ApprovalAction) => void;
  
  // UI状态
  activeTab: 'pending' | 'approved' | 'my-requests' | 'workflows' | 'workflow-design';
  setActiveTab: (tab: 'pending' | 'approved' | 'my-requests' | 'workflows' | 'workflow-design') => void;
  designWorkflowId?: string;
  setDesignWorkflowId: (id?: string) => void;
}

// 初始化示例数据
const initialUsers: User[] = [
  { id: '1', name: '张三', email: 'zhangsan@example.com', role: 'admin' },
  { id: '2', name: '李四', email: 'lisi@example.com', role: 'manager' },
  { id: '3', name: '王五', email: 'wangwu@example.com', role: 'employee' },
  { id: '4', name: '赵六', email: 'zhaoliu@example.com', role: 'manager' },
];

const initialWorkflows: Workflow[] = [
  {
    id: 'wf1',
    name: '请假申请',
    description: '员工请假审批流程',
    category: '人事',
    nodes: [
      { id: 'n1', name: '部门经理审批', approverId: '2', approverName: '李四', type: 'single' },
      { id: 'n2', name: 'HR审批', approverId: '4', approverName: '赵六', type: 'single' },
    ],
    createdAt: new Date().toISOString(),
    createdBy: '1',
    status: 'active',
  },
  {
    id: 'wf2',
    name: '采购申请',
    description: '采购物品审批流程',
    category: '财务',
    nodes: [
      { id: 'n3', name: '部门经理审批', approverId: '2', approverName: '李四', type: 'single' },
      { id: 'n4', name: '财务审批', approverId: '4', approverName: '赵六', type: 'single' },
    ],
    createdAt: new Date().toISOString(),
    createdBy: '1',
    status: 'active',
  },
];

const initialInstances: WorkflowInstance[] = [
  {
    id: 'inst1',
    workflowId: 'wf1',
    workflowName: '请假申请',
    title: '年假申请',
    description: '申请年假5天，从2024年1月1日到1月5日',
    applicantId: '3',
    applicantName: '王五',
    currentNodeId: 'n1',
    status: 'pending',
    records: [],
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 86400000).toISOString(),
  },
];

export const useWorkflowStore = create<WorkflowStore>((set) => ({
  currentUser: initialUsers[0],
  users: initialUsers,
  workflows: initialWorkflows,
  instances: initialInstances,
  activeTab: 'pending',
  designWorkflowId: undefined,
  
  setCurrentUser: (user) => set({ currentUser: user }),
  setUsers: (users) => set({ users }),
  
  addWorkflow: (workflow) => 
    set((state) => ({ workflows: [...state.workflows, workflow] })),
  
  updateWorkflow: (id, updates) =>
    set((state) => ({
      workflows: state.workflows.map((w) => 
        w.id === id ? { ...w, ...updates } : w
      ),
    })),
  
  deleteWorkflow: (id) =>
    set((state) => ({
      workflows: state.workflows.filter((w) => w.id !== id),
    })),
  
  addInstance: (instance) =>
    set((state) => ({ instances: [...state.instances, instance] })),
  
  updateInstance: (id, updates) =>
    set((state) => ({
      instances: state.instances.map((inst) =>
        inst.id === id ? { ...inst, ...updates } : inst
      ),
    })),
  
  approveInstance: (action) =>
    set((state) => {
      const instance = state.instances.find((inst) => inst.id === action.instanceId);
      if (!instance) return state;
      
      const workflow = state.workflows.find((w) => w.id === instance.workflowId);
      if (!workflow) return state;
      
      const currentNode = workflow.nodes.find((n) => n.id === action.nodeId);
      if (!currentNode) return state;
      
      const currentUser = state.currentUser!;
      const newRecord = {
        id: `rec${Date.now()}`,
        nodeId: action.nodeId,
        nodeName: currentNode.name,
        approverId: currentUser.id,
        approverName: currentUser.name,
        status: action.action === 'approve' ? 'approved' : 'rejected' as ApprovalStatus,
        comment: action.comment,
        timestamp: new Date().toISOString(),
      };
      
      const updatedRecords = [...instance.records, newRecord];
      
      // 找到当前节点在流程中的位置
      const currentNodeIndex = workflow.nodes.findIndex((n) => n.id === action.nodeId);
      const nextNode = workflow.nodes[currentNodeIndex + 1];
      
      let newStatus: ApprovalStatus = instance.status;
      let newCurrentNodeId = instance.currentNodeId;
      
      if (action.action === 'approve') {
        if (nextNode) {
          newCurrentNodeId = nextNode.id;
        } else {
          newStatus = 'approved';
          newCurrentNodeId = undefined;
        }
      } else {
        newStatus = 'rejected';
        newCurrentNodeId = undefined;
      }
      
      return {
        instances: state.instances.map((inst) =>
          inst.id === action.instanceId
            ? {
                ...inst,
                records: updatedRecords,
                status: newStatus,
                currentNodeId: newCurrentNodeId,
                updatedAt: new Date().toISOString(),
              }
            : inst
        ),
      };
    }),
  
  setActiveTab: (tab) => set({ activeTab: tab }),
  setDesignWorkflowId: (id) => set({ designWorkflowId: id }),
}));
