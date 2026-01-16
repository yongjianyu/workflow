import { useMemo, useRef } from 'react';
import type { ApprovalNode, NodeType } from '../types';
import WorkflowNode from './WorkflowNode';

interface WorkflowCanvasProps {
  nodes: ApprovalNode[];
  onNodeClick: (node: ApprovalNode) => void;
  onAddNode: (parentNodeId: string, nodeType: NodeType) => void;
  onAddCondition: (parentNodeId: string) => void;
  onDelete: (nodeId: string) => void;
}

export default function WorkflowCanvas({
  nodes,
  onNodeClick,
  onAddNode,
  onAddCondition,
  onDelete,
}: WorkflowCanvasProps) {
  // 使用 useMemo 计算根节点，避免重复计算
  const rootNodes = useMemo(() => {
    return nodes.filter((node) => {
      // 条件节点总是有父节点，不单独渲染
      if (node.type === 'condition') {
        return false;
      }
      // 检查是否有其他节点指向这个节点作为子节点
      const hasParent = nodes.some((n) => 
        n.nextNodeIds?.includes(node.id)
      );
      return !hasParent;
    });
  }, [nodes]);

  // 使用 ref 来保持渲染跟踪 Set，在每次渲染时清空
  const renderedNodesRef = useRef<Set<string>>(new Set());

  return (
    <div className="relative">
      {rootNodes.map((node) => {
        // 为每个根节点清空 Set，开始新的渲染跟踪
        renderedNodesRef.current.clear();
        return (
          <WorkflowNode
            key={node.id}
            node={node}
            nodes={nodes}
            renderedNodes={renderedNodesRef.current}
            onClick={() => onNodeClick(node)}
            onAddNode={(nodeType) => onAddNode(node.id, nodeType)}
            onAddCondition={() => onAddCondition(node.id)}
            onDelete={() => onDelete(node.id)}
          />
        );
      })}
    </div>
  );
}
