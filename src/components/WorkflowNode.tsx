import { useState } from 'react';
import type { ApprovalNode, NodeType } from '../types';

interface WorkflowNodeProps {
  node: ApprovalNode;
  nodes: ApprovalNode[];
  renderedNodes?: Set<string>;
  onClick: () => void;
  onAddNode: (nodeType: NodeType) => void;
  onAddCondition: () => void;
  onDelete: () => void;
}

export default function WorkflowNode({
  node,
  nodes,
  renderedNodes,
  onClick,
  onAddNode,
  onAddCondition,
  onDelete,
}: WorkflowNodeProps) {
  const [showMenu, setShowMenu] = useState(false);
  const position = node.position || { x: 0, y: 0 };
  
  // 如果节点已经渲染过，直接返回 null
  if (renderedNodes && renderedNodes.has(node.id)) {
    return null;
  }
  
  // 标记当前节点为已渲染
  if (renderedNodes) {
    renderedNodes.add(node.id);
  }

  // 获取节点样式
  const getNodeStyle = () => {
    const baseStyle = 'w-48 rounded-lg shadow-md cursor-pointer transition-all hover:shadow-lg';
    
    switch (node.type) {
      case 'initiator':
        return `${baseStyle} bg-blue-500 text-white`;
      case 'approver':
        return `${baseStyle} bg-orange-500 text-white`;
      case 'condition':
        return `${baseStyle} border-2 border-red-500 bg-white text-gray-900`;
      case 'cc':
        return `${baseStyle} bg-blue-400 text-white`;
      default:
        return `${baseStyle} bg-gray-500 text-white`;
    }
  };

  // 获取节点图标
  const getNodeIcon = () => {
    switch (node.type) {
      case 'initiator':
        return '👤';
      case 'approver':
        return '✓';
      case 'condition':
        return '🔀';
      case 'cc':
        return '📧';
      default:
        return '●';
    }
  };

  // 获取节点显示文本
  const getNodeText = () => {
    if (node.type === 'initiator') {
      return node.approverName || '所有人';
    }
    if (node.type === 'condition') {
      if (node.condition) {
        return `${node.condition.field} ${getOperatorText(node.condition.operator)} ${node.condition.value}`;
      }
      return '请设置条件';
    }
    if (node.type === 'approver') {
      if (node.approverNames?.length) {
        return node.approverNames.join(', ');
      }
      return node.approverName || '请设置审批人';
    }
    if (node.type === 'cc') {
      return node.approverNames?.join(', ') || '请设置抄送人';
    }
    return node.name;
  };

  const getOperatorText = (op: string) => {
    const map: Record<string, string> = {
      eq: '=',
      ne: '≠',
      gt: '>',
      lt: '<',
      gte: '≥',
      lte: '≤',
      contains: '包含',
    };
    return map[op] || op;
  };

  // 检查节点是否配置完整
  const isConfigured = () => {
    if (node.type === 'approver') {
      return !!(node.approverId || node.approverIds?.length);
    }
    if (node.type === 'condition') {
      return !!node.condition;
    }
    if (node.type === 'cc') {
      return !!node.approverIds?.length;
    }
    return true;
  };

  // 获取子节点（只获取直接子节点，避免重复渲染）
  const childNodes = nodes.filter((n) => {
    // 只获取直接子节点（通过 nextNodeIds 连接）
    const isDirectChild = node.nextNodeIds?.includes(n.id);
    // 对于条件节点，还要检查 parentNodeId
    if (n.type === 'condition' && n.parentNodeId === node.id) {
      return isDirectChild;
    }
    // 对于普通节点，只检查 nextNodeIds
    return isDirectChild && n.type !== 'condition';
  });
  const conditionNodes = nodes.filter((n) => 
    n.parentNodeId === node.id && n.type === 'condition'
  );
  const normalChildNodes = childNodes.filter((n) => n.type !== 'condition');

  return (
    <div className="absolute" style={{ left: position.x, top: position.y }}>
      {/* 节点主体 */}
      <div
        className={getNodeStyle()}
        onClick={onClick}
        onContextMenu={(e) => {
          e.preventDefault();
          setShowMenu(!showMenu);
        }}
      >
        <div className="p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-2xl">{getNodeIcon()}</span>
            {!isConfigured() && (
              <span className="text-red-500 text-lg">⚠️</span>
            )}
          </div>
          <div className="font-semibold text-sm mb-1">{node.name}</div>
          <div className="text-xs opacity-90 break-words">{getNodeText()}</div>
          {node.type === 'condition' && node.priority && (
            <div className="text-xs mt-1">优先级{node.priority}</div>
          )}
        </div>
      </div>

      {/* 操作菜单 */}
      {showMenu && (
        <div className="absolute top-full left-0 mt-2 bg-white border border-gray-300 rounded-lg shadow-lg z-50 min-w-40">
          {node.type !== 'condition' && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onAddNode('approver');
                  setShowMenu(false);
                }}
                className="w-full text-left px-4 py-2 hover:bg-gray-100 text-sm"
              >
                + 添加审批人
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onAddCondition();
                  setShowMenu(false);
                }}
                className="w-full text-left px-4 py-2 hover:bg-gray-100 text-sm"
              >
                + 添加条件
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onAddNode('cc');
                  setShowMenu(false);
                }}
                className="w-full text-left px-4 py-2 hover:bg-gray-100 text-sm"
              >
                + 添加抄送人
              </button>
            </>
          )}
          {node.type === 'condition' && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onAddNode('approver');
                setShowMenu(false);
              }}
              className="w-full text-left px-4 py-2 hover:bg-gray-100 text-sm"
            >
              + 添加审批人
            </button>
          )}
          <div className="border-t border-gray-200"></div>
          {node.type !== 'initiator' && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
                setShowMenu(false);
              }}
              className="w-full text-left px-4 py-2 hover:bg-red-50 text-red-600 text-sm"
            >
              删除节点
            </button>
          )}
        </div>
      )}

      {/* 连接线和添加按钮 */}
      {childNodes.length === 0 && (
        <div className="flex flex-col items-center mt-2">
          <div className="w-0.5 h-8 bg-gray-400"></div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowMenu(true);
            }}
            className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center hover:bg-blue-700 text-xl font-bold z-10"
          >
            +
          </button>
        </div>
      )}

      {/* 条件分支的连接 */}
      {conditionNodes.length > 0 && (
        <div className="mt-2">
          <div className="w-0.5 h-8 bg-gray-400 mx-auto"></div>
          <div className="flex items-start justify-center space-x-4 mt-2">
            {conditionNodes.map((conditionNode, idx) => {
              const conditionPos = conditionNode.position || { x: 0, y: 0 };
              // 对于条件节点，使用绝对位置
              return (
                <div key={conditionNode.id} className="flex flex-col items-center">
                  <div className="w-24 h-0.5 bg-gray-400"></div>
                  <div
                    className="absolute"
                    style={{
                      left: conditionPos.x,
                      top: conditionPos.y,
                    }}
                  >
                    <WorkflowNode
                      node={conditionNode}
                      nodes={nodes}
                      renderedNodes={renderedNodes}
                      onClick={onClick}
                      onAddNode={onAddNode}
                      onAddCondition={onAddCondition}
                      onDelete={onDelete}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 普通子节点 */}
      {normalChildNodes.length > 0 && (
        <div className="mt-2">
          <div className="w-0.5 h-8 bg-gray-400 mx-auto"></div>
          {normalChildNodes.map((childNode, idx) => {
            const childPos = childNode.position || { x: 0, y: 0 };
            // 对于普通子节点，使用绝对位置，不计算偏移
            return (
              <div
                key={childNode.id}
                className="absolute"
                style={{
                  left: childPos.x,
                  top: childPos.y,
                }}
              >
                <WorkflowNode
                  node={childNode}
                  nodes={nodes}
                  renderedNodes={renderedNodes}
                  onClick={onClick}
                  onAddNode={onAddNode}
                  onAddCondition={onAddCondition}
                  onDelete={onDelete}
                />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
