import { useState, useEffect } from 'react';
import type { ApprovalNode, ConditionConfig } from '../types';
import type { User } from '../types';

interface NodeConfigModalProps {
  node: ApprovalNode;
  nodes: ApprovalNode[];
  users: User[];
  onSave: (updates: Partial<ApprovalNode>) => void;
  onClose: () => void;
}

export default function NodeConfigModal({
  node,
  users,
  onSave,
  onClose,
}: NodeConfigModalProps) {
  const [name, setName] = useState(node.name);
  const [approverId, setApproverId] = useState(node.approverId || '');
  const [approverIds, setApproverIds] = useState<string[]>(node.approverIds || []);
  const [condition, setCondition] = useState<ConditionConfig | undefined>(node.condition);
  const [conditionField, setConditionField] = useState(condition?.field || '');
  const [conditionOperator, setConditionOperator] = useState(condition?.operator || 'eq');
  const [conditionValue, setConditionValue] = useState(condition?.value?.toString() || '');

  useEffect(() => {
    setName(node.name);
    setApproverId(node.approverId || '');
    setApproverIds(node.approverIds || []);
    setCondition(node.condition);
    setConditionField(condition?.field || '');
    setConditionOperator(condition?.operator || 'eq');
    setConditionValue(condition?.value?.toString() || '');
  }, [node]);

  const handleSave = () => {
    const updates: Partial<ApprovalNode> = { name };

    if (node.type === 'approver') {
      if (approverId) {
        updates.approverId = approverId;
        updates.approverName = users.find((u) => u.id === approverId)?.name || '';
      } else if (approverIds.length > 0) {
        updates.approverIds = approverIds;
        updates.approverNames = approverIds.map(
          (id) => users.find((u) => u.id === id)?.name || ''
        );
      }
    }

    if (node.type === 'cc') {
      updates.approverIds = approverIds;
      updates.approverNames = approverIds.map(
        (id) => users.find((u) => u.id === id)?.name || ''
      );
    }

    if (node.type === 'condition') {
      if (conditionField && conditionValue) {
        updates.condition = {
          field: conditionField,
          operator: conditionOperator as ConditionConfig['operator'],
          value: isNaN(Number(conditionValue)) ? conditionValue : Number(conditionValue),
        };
      }
    }

    if (node.type === 'initiator') {
      if (approverId) {
        updates.approverId = approverId;
        updates.approverName = users.find((u) => u.id === approverId)?.name || '所有人';
      }
    }

    onSave(updates);
  };

  const toggleApprover = (userId: string) => {
    if (approverIds.includes(userId)) {
      setApproverIds(approverIds.filter((id) => id !== userId));
    } else {
      setApproverIds([...approverIds, userId]);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-900">配置节点</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl"
          >
            ×
          </button>
        </div>

        <div className="space-y-4">
          {/* 节点名称 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              节点名称
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* 发起人配置 */}
          {node.type === 'initiator' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                发起人范围
              </label>
              <select
                value={approverId}
                onChange={(e) => setApproverId(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">所有人</option>
                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* 审批人配置 */}
          {node.type === 'approver' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                审批人
              </label>
              <div className="space-y-2">
                <select
                  value={approverId}
                  onChange={(e) => {
                    setApproverId(e.target.value);
                    setApproverIds([]);
                  }}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">请选择审批人</option>
                  {users.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.name} ({user.role})
                    </option>
                  ))}
                </select>
                <div className="text-sm text-gray-500 text-center">或</div>
                <div className="border border-gray-300 rounded-lg p-3 max-h-48 overflow-y-auto">
                  <div className="text-xs font-medium text-gray-700 mb-2">多选审批人：</div>
                  {users.map((user) => (
                    <label key={user.id} className="flex items-center space-x-2 py-1">
                      <input
                        type="checkbox"
                        checked={approverIds.includes(user.id)}
                        onChange={() => {
                          toggleApprover(user.id);
                          if (approverIds.includes(user.id) || approverIds.length > 0) {
                            setApproverId('');
                          }
                        }}
                        className="rounded"
                      />
                      <span className="text-sm">{user.name} ({user.role})</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* 条件配置 */}
          {node.type === 'condition' && (
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  条件字段
                </label>
                <input
                  type="text"
                  value={conditionField}
                  onChange={(e) => setConditionField(e.target.value)}
                  placeholder="例如：金额、部门、优先级"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  操作符
                </label>
                <select
                  value={conditionOperator}
                  onChange={(e) => setConditionOperator(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="eq">等于 (=)</option>
                  <option value="ne">不等于 (≠)</option>
                  <option value="gt">大于 (&gt;)</option>
                  <option value="lt">小于 (&lt;)</option>
                  <option value="gte">大于等于 (≥)</option>
                  <option value="lte">小于等于 (≤)</option>
                  <option value="contains">包含</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  值
                </label>
                <input
                  type="text"
                  value={conditionValue}
                  onChange={(e) => setConditionValue(e.target.value)}
                  placeholder="请输入条件值"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          )}

          {/* 抄送人配置 */}
          {node.type === 'cc' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                抄送人
              </label>
              <div className="border border-gray-300 rounded-lg p-3 max-h-48 overflow-y-auto">
                {users.map((user) => (
                  <label key={user.id} className="flex items-center space-x-2 py-1">
                    <input
                      type="checkbox"
                      checked={approverIds.includes(user.id)}
                      onChange={() => toggleApprover(user.id)}
                      className="rounded"
                    />
                    <span className="text-sm">{user.name} ({user.role})</span>
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex space-x-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 py-2 px-4 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
          >
            取消
          </button>
          <button
            onClick={handleSave}
            className="flex-1 py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            保存
          </button>
        </div>
      </div>
    </div>
  );
}
