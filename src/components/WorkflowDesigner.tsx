import { useState, useCallback, useRef, useEffect } from 'react';
import { useWorkflowStore } from '../store/workflowStore';
import type { ApprovalNode, NodeType, ConditionConfig } from '../types';
import WorkflowNode from './WorkflowNode';
import NodeConfigModal from './NodeConfigModal';

interface WorkflowDesignerProps {
  workflowId?: string;
  initialNodes?: ApprovalNode[];
  onSave?: (nodes: ApprovalNode[]) => void;
  onClose?: () => void;
}

export default function WorkflowDesigner({ workflowId, initialNodes, onSave, onClose }: WorkflowDesignerProps) {
  const { users, workflows } = useWorkflowStore();
  const [nodes, setNodes] = useState<ApprovalNode[]>(initialNodes || []);
  const [selectedNode, setSelectedNode] = useState<ApprovalNode | null>(null);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [zoom, setZoom] = useState(100);
  const canvasRef = useRef<HTMLDivElement>(null);

  // 从现有流程加载节点
  useEffect(() => {
    if (workflowId) {
      const workflow = workflows.find((w) => w.id === workflowId);
      if (workflow && workflow.nodes.length > 0) {
        // 转换现有节点格式
        const convertedNodes: ApprovalNode[] = workflow.nodes.map((node, idx) => ({
          ...node,
          type: node.type as NodeType || 'approver',
          position: node.position || { x: 400, y: 50 + idx * 150 },
        }));
        // 添加发起人节点
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
  }, [workflowId, workflows]);

  // 初始化发起人节点
  const initInitiatorNode = useCallback(() => {
    if (nodes.length === 0) {
      const initiatorNode: ApprovalNode = {
        id: 'initiator',
        name: '发起人',
        type: 'initiator',
        position: { x: 400, y: 50 },
      };
      setNodes([initiatorNode]);
    }
  }, [nodes.length]);

  // 添加节点
  const addNode = useCallback((parentNodeId: string, nodeType: NodeType) => {
    const parentNode = nodes.find((n) => n.id === parentNodeId);
    if (!parentNode) return;

    const newNode: ApprovalNode = {
      id: `node_${Date.now()}`,
      name: nodeType === 'approver' ? '审批人' : nodeType === 'condition' ? '条件' : '抄送人',
      type: nodeType,
      position: {
        x: (parentNode.position?.x || 400) + (nodeType === 'condition' ? 0 : 0),
        y: (parentNode.position?.y || 50) + 150,
      },
      parentNodeId: nodeType === 'condition' ? parentNodeId : undefined,
    };

    // 更新父节点的nextNodeIds
    const updatedNodes = nodes.map((node) => {
      if (node.id === parentNodeId) {
        return {
          ...node,
          nextNodeIds: [...(node.nextNodeIds || []), newNode.id],
        };
      }
      return node;
    });

    setNodes([...updatedNodes, newNode]);
  }, [nodes]);

  // 更新节点
  const updateNode = useCallback((nodeId: string, updates: Partial<ApprovalNode>) => {
    setNodes((prevNodes) =>
      prevNodes.map((node) => (node.id === nodeId ? { ...node, ...updates } : node))
    );
  }, []);

  // 删除节点
  const deleteNode = useCallback((nodeId: string) => {
    const node = nodes.find((n) => n.id === nodeId);
    if (!node) return;

    // 删除节点及其所有子节点
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

    // 从父节点的nextNodeIds中移除
    setNodes((prevNodes) =>
      prevNodes
        .filter((node) => !idsToDelete.includes(node.id))
        .map((node) => ({
          ...node,
          nextNodeIds: node.nextNodeIds?.filter((id) => !idsToDelete.includes(id)),
        }))
    );
  }, [nodes]);

  // 打开节点配置
  const handleNodeClick = useCallback((node: ApprovalNode) => {
    setSelectedNode(node);
    setShowConfigModal(true);
  }, []);

  // 添加条件分支
  const addCondition = useCallback((parentNodeId: string) => {
    const parentNode = nodes.find((n) => n.id === parentNodeId);
    if (!parentNode) return;

    // 查找已有的条件数量
    const existingConditions = nodes.filter(
      (n) => n.parentNodeId === parentNodeId && n.type === 'condition'
    );
    const priority = existingConditions.length + 1;

    const conditionNode: ApprovalNode = {
      id: `condition_${Date.now()}`,
      name: `条件${priority}`,
      type: 'condition',
      priority,
      position: {
        x: (parentNode.position?.x || 400) + (priority - 1) * 200 - (existingConditions.length * 100),
        y: (parentNode.position?.y || 50) + 150,
      },
      parentNodeId,
    };

    // 更新父节点的nextNodeIds
    const updatedNodes = nodes.map((node) => {
      if (node.id === parentNodeId) {
        return {
          ...node,
          nextNodeIds: [...(node.nextNodeIds || []), conditionNode.id],
        };
      }
      return node;
    });

    setNodes([...updatedNodes, conditionNode]);
  }, [nodes]);

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

  // 保存流程
  const handleSave = useCallback(() => {
    if (validateWorkflow()) {
      onSave?.(nodes);
      onClose?.();
    }
  }, [nodes, validateWorkflow, onSave, onClose]);

  // 初始化（如果没有从现有流程加载）
  useEffect(() => {
    if (nodes.length === 0 && !workflowId && !initialNodes?.length) {
      initInitiatorNode();
    }
  }, [workflowId, initialNodes]);

  // 计算节点位置（自动布局）
  const layoutNodes = useCallback(() => {
    const initiator = nodes.find((n) => n.type === 'initiator');
    if (!initiator) return;

    const layoutedNodes: ApprovalNode[] = [];
    const visited = new Set<string>();

    const layoutNode = (node: ApprovalNode, level: number, index: number, total: number) => {
      if (visited.has(node.id)) return;
      visited.add(node.id);

      const x = 400 + (index - total / 2) * 250;
      const y = 50 + level * 150;

      layoutedNodes.push({
        ...node,
        position: { x, y },
      });

      const children = nodes.filter((n) => node.nextNodeIds?.includes(n.id));
      children.forEach((child, idx) => {
        layoutNode(child, level + 1, idx, children.length);
      });
    };

    layoutNode(initiator, 0, 0, 1);
    setNodes((prevNodes) =>
      prevNodes.map((node) => {
        const layouted = layoutedNodes.find((n) => n.id === node.id);
        return layouted || node;
      })
    );
  }, [nodes]);

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* 顶部工具栏 */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <h2 className="text-xl font-semibold text-gray-900">流程设计器</h2>
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
            {onSave && (
              <button
                onClick={handleSave}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                保存
              </button>
            )}
            {onClose && (
              <button
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                关闭
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 画布区域 */}
      <div className="flex-1 overflow-auto relative" ref={canvasRef}>
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
              <button
                onClick={initInitiatorNode}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                开始设计流程
              </button>
            </div>
          ) : (
            <div className="relative">
              {nodes.map((node) => (
                <WorkflowNode
                  key={node.id}
                  node={node}
                  nodes={nodes}
                  onClick={() => handleNodeClick(node)}
                  onAddNode={(nodeType) => addNode(node.id, nodeType)}
                  onAddCondition={() => addCondition(node.id)}
                  onDelete={() => deleteNode(node.id)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 节点配置弹窗 */}
      {showConfigModal && selectedNode && (
        <NodeConfigModal
          node={selectedNode}
          nodes={nodes}
          users={users}
          onSave={(updates) => {
            updateNode(selectedNode.id, updates);
            setShowConfigModal(false);
          }}
          onClose={() => setShowConfigModal(false)}
        />
      )}
    </div>
  );
}
