import { useState, useEffect, useCallback } from 'react';
import { useWorkflowStore } from '../store/workflowStore';
import type { ApprovalNode, NodeType } from '../types';
import WorkflowCanvas from './WorkflowCanvas';
import ApproverConfigPanel from './ApproverConfigPanel';

interface WorkflowDesignPageProps {
  workflowId?: string;
  onBack?: () => void;
}

export default function WorkflowDesignPage({ workflowId, onBack }: WorkflowDesignPageProps) {
  const { workflows, currentUser } = useWorkflowStore();
  const [nodes, setNodes] = useState<ApprovalNode[]>([]);
  const [selectedNode, setSelectedNode] = useState<ApprovalNode | null>(null);
  const [activeStep, setActiveStep] = useState<'basic' | 'form' | 'process' | 'advanced'>('process');
  const [zoom, setZoom] = useState(100);
  const [workflowName, setWorkflowName] = useState('');

  // 从现有流程加载
  useEffect(() => {
    if (workflowId) {
      const workflow = workflows.find((w) => w.id === workflowId);
      if (workflow) {
        setWorkflowName(workflow.name);
        if (workflow.nodes.length > 0) {
          const convertedNodes: ApprovalNode[] = workflow.nodes.map((node, idx) => ({
            ...node,
            type: node.type as NodeType || 'approver',
            position: node.position || { x: 400, y: 50 + idx * 150 },
          }));
          const initiatorNode: ApprovalNode = {
            id: 'initiator',
            name: '发起人',
            type: 'initiator',
            position: { x: 400, y: 50 },
            nextNodeIds: convertedNodes.length > 0 ? [convertedNodes[0].id] : undefined,
          };
          setNodes([initiatorNode, ...convertedNodes]);
        }
      }
    } else {
      // 初始化发起人节点
      const initiatorNode: ApprovalNode = {
        id: 'initiator',
        name: '发起人',
        type: 'initiator',
        position: { x: 400, y: 50 },
      };
      setNodes([initiatorNode]);
    }
  }, [workflowId, workflows]);

  // 添加节点
  const addNode = useCallback((parentNodeId: string, nodeType: NodeType) => {
    setNodes((prevNodes) => {
      const parentNode = prevNodes.find((n) => n.id === parentNodeId);
      if (!parentNode) return prevNodes;

      const newNode: ApprovalNode = {
        id: `node_${Date.now()}`,
        name: nodeType === 'approver' ? '审批人' : nodeType === 'condition' ? '条件' : '抄送人',
        type: nodeType,
        position: {
          x: (parentNode.position?.x || 400),
          y: (parentNode.position?.y || 50) + 150,
        },
        parentNodeId: nodeType === 'condition' ? parentNodeId : undefined,
      };

      const updatedNodes = prevNodes.map((node) => {
        if (node.id === parentNodeId) {
          return {
            ...node,
            nextNodeIds: [...(node.nextNodeIds || []), newNode.id],
          };
        }
        return node;
      });

      return [...updatedNodes, newNode];
    });
  }, []);

  // 添加条件分支
  const addCondition = useCallback((parentNodeId: string) => {
    setNodes((prevNodes) => {
      const parentNode = prevNodes.find((n) => n.id === parentNodeId);
      if (!parentNode) return prevNodes;

      const existingConditions = prevNodes.filter(
        (n) => n.parentNodeId === parentNodeId && n.type === 'condition'
      );
      const priority = existingConditions.length + 1;

      const conditionNode: ApprovalNode = {
        id: `condition_${Date.now()}`,
        name: `条件${priority}`,
        type: 'condition',
        priority,
        position: {
          x: (parentNode.position?.x || 400) + (priority - 1) * 250 - (existingConditions.length * 125),
          y: (parentNode.position?.y || 50) + 150,
        },
        parentNodeId,
      };

      const updatedNodes = prevNodes.map((node) => {
        if (node.id === parentNodeId) {
          return {
            ...node,
            nextNodeIds: [...(node.nextNodeIds || []), conditionNode.id],
          };
        }
        return node;
      });

      return [...updatedNodes, conditionNode];
    });
  }, []);

  // 更新节点
  const updateNode = useCallback((nodeId: string, updates: Partial<ApprovalNode>) => {
    setNodes((prevNodes) =>
      prevNodes.map((node) => (node.id === nodeId ? { ...node, ...updates } : node))
    );
    // 更新选中节点
    if (selectedNode?.id === nodeId) {
      setSelectedNode({ ...selectedNode, ...updates });
    }
  }, [selectedNode]);

  // 删除节点
  const deleteNode = useCallback((nodeId: string) => {
    const node = nodes.find((n) => n.id === nodeId);
    if (!node || node.type === 'initiator') return;

    const deleteNodeAndChildren = (id: string): string[] => {
      const nodeToDelete = nodes.find((n) => n.id === id);
      if (!nodeToDelete) return [id];
      const children = nodeToDelete.nextNodeIds || [];
      const allIds = [id];
      children.forEach((childId) => {
        allIds.push(...deleteNodeAndChildren(childId));
      });
      return allIds;
    };

    const idsToDelete = deleteNodeAndChildren(nodeId);
    setNodes((prevNodes) =>
      prevNodes
        .filter((node) => !idsToDelete.includes(node.id))
        .map((node) => ({
          ...node,
          nextNodeIds: node.nextNodeIds?.filter((id) => !idsToDelete.includes(id)),
        }))
    );
    if (selectedNode?.id === nodeId) {
      setSelectedNode(null);
    }
  }, [nodes, selectedNode]);

  // 处理节点点击
  const handleNodeClick = useCallback((node: ApprovalNode) => {
    setSelectedNode(node);
  }, []);

  // 校验流程
  const validateWorkflow = useCallback(() => {
    const errors: string[] = [];
    nodes.forEach((node) => {
      if (node.type === 'approver' && !node.approverId && !node.approverIds?.length) {
        errors.push(`节点 "${node.name}" 未设置审批人`);
      }
      if (node.type === 'condition' && !node.condition) {
        errors.push(`条件节点 "${node.name}" 未设置条件`);
      }
      if (node.type === 'cc' && !node.approverIds?.length) {
        errors.push(`抄送节点 "${node.name}" 未设置抄送人`);
      }
    });

    if (errors.length > 0) {
      alert('流程校验失败：\n' + errors.join('\n'));
      return false;
    }
    alert('流程校验通过！');
    return true;
  }, [nodes]);

  const steps = [
    { id: 'basic' as const, label: '①基础信息', icon: '📋' },
    { id: 'form' as const, label: '②审批表单', icon: '📝' },
    { id: 'process' as const, label: '③审批流程', icon: '⚙️' },
    { id: 'advanced' as const, label: '④扩展设置', icon: '🔧' },
  ];

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* 顶部导航栏 */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-4">
            {onBack && (
              <button
                onClick={onBack}
                className="text-gray-600 hover:text-gray-900 text-xl"
              >
                ←
              </button>
            )}
            <div className="flex items-center space-x-2">
              <span className="text-green-600 text-xl">●</span>
              <h1 className="text-xl font-semibold text-gray-900">
                {workflowName || '新建流程'}
              </h1>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
              预览
            </button>
            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2">
              <span>发布</span>
              <span>✈️</span>
            </button>
          </div>
        </div>

        {/* 步骤导航 */}
        <div className="mt-4">
          <div className="flex space-x-6">
            {steps.map((step) => (
              <button
                key={step.id}
                onClick={() => setActiveStep(step.id)}
                className={`
                  flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors
                  ${
                    activeStep === step.id
                      ? 'bg-blue-50 text-blue-600 font-medium'
                      : 'text-gray-600 hover:text-gray-900'
                  }
                `}
              >
                <span>{step.icon}</span>
                <span>{step.label}</span>
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* 主内容区 */}
      <div className="flex-1 flex overflow-hidden">
        {/* 左侧流程图设计器 */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* 工具栏 */}
          <div className="bg-white border-b border-gray-200 px-4 py-2 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <h2 className="text-lg font-semibold text-gray-900">流程设计器</h2>
              <span className="text-sm text-gray-500">
                任意条件层级审批流程设计，审批节点支持多种业务类型设置，支持流程校验
              </span>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setZoom(Math.max(50, zoom - 10))}
                className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50"
              >
                -
              </button>
              <span className="text-sm text-gray-600 w-16 text-center">{zoom}%</span>
              <button
                onClick={() => setZoom(Math.min(150, zoom + 10))}
                className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50"
              >
                +
              </button>
              <button
                onClick={validateWorkflow}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                校验流程
              </button>
            </div>
          </div>

          {/* 画布区域 */}
          <div className="flex-1 overflow-auto relative bg-gray-100">
            <div
              className="relative"
              style={{
                transform: `scale(${zoom / 100})`,
                transformOrigin: 'top left',
                minHeight: '100%',
                padding: '40px',
              }}
            >
              {nodes.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <p className="text-gray-500 mb-4">开始设计流程</p>
                    <button
                      onClick={() => {
                        const initiatorNode: ApprovalNode = {
                          id: 'initiator',
                          name: '发起人',
                          type: 'initiator',
                          position: { x: 400, y: 50 },
                        };
                        setNodes([initiatorNode]);
                      }}
                      className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      添加发起人节点
                    </button>
                  </div>
                </div>
              ) : (
                <WorkflowCanvas
                  nodes={nodes}
                  onNodeClick={handleNodeClick}
                  onAddNode={addNode}
                  onAddCondition={addCondition}
                  onDelete={deleteNode}
                />
              )}
            </div>
          </div>
        </div>

        {/* 右侧配置面板 */}
        <div className="w-96 bg-white border-l border-gray-200 overflow-y-auto">
          {selectedNode ? (
            selectedNode.type === 'approver' ? (
              <ApproverConfigPanel
                node={selectedNode}
                onSave={(updates) => updateNode(selectedNode.id, updates)}
                onClose={() => setSelectedNode(null)}
              />
            ) : (
              <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">节点配置</h3>
                  <button
                    onClick={() => setSelectedNode(null)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    ×
                  </button>
                </div>
                <p className="text-gray-500">配置面板开发中...</p>
              </div>
            )
          ) : (
            <div className="p-6">
              <div className="text-center text-gray-500 mt-20">
                <div className="text-4xl mb-4">👈</div>
                <p>点击节点进行配置</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
