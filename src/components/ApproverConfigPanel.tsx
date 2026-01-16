import { useState, useEffect } from 'react';
import { useWorkflowStore } from '../store/workflowStore';
import type { ApprovalNode } from '../types';

interface ApproverConfigPanelProps {
  node: ApprovalNode;
  onSave: (updates: Partial<ApprovalNode>) => void;
  onClose: () => void;
}

type ApproverType = 
  | 'designated' 
  | 'self-select' 
  | 'multi-level-supervisor' 
  | 'supervisor' 
  | 'role' 
  | 'self' 
  | 'form-contact';

type EmptyAction = 'auto-pass' | 'auto-reject' | 'transfer-admin' | 'transfer-person';
type RejectAction = 'end' | 'reject-to-parent' | 'reject-to-node';

export default function ApproverConfigPanel({
  node,
  onSave,
  onClose,
}: ApproverConfigPanelProps) {
  const { users } = useWorkflowStore();
  const [activeTab, setActiveTab] = useState<'approver' | 'permission'>('approver');
  const [approverType, setApproverType] = useState<ApproverType>('supervisor');
  const [supervisorLevel, setSupervisorLevel] = useState(1);
  const [emptyAction, setEmptyAction] = useState<EmptyAction>('auto-pass');
  const [needSignature, setNeedSignature] = useState(false);
  const [deadline, setDeadline] = useState(0);
  const [deadlineUnit, setDeadlineUnit] = useState<'hour' | 'day'>('hour');
  const [rejectAction, setRejectAction] = useState<RejectAction>('end');

  useEffect(() => {
    // 根据节点数据初始化状态
    if (node.approverId) {
      setApproverType('designated');
    } else if (node.approverIds?.length) {
      setApproverType('designated');
    }
  }, [node]);

  const handleSave = () => {
    const updates: Partial<ApprovalNode> = {};

    // 根据审批人类型设置
    if (approverType === 'supervisor') {
      updates.approverName = `发起人的第${supervisorLevel}级主管`;
    } else if (approverType === 'self') {
      updates.approverName = '发起人自己';
    } else if (approverType === 'designated') {
      // 这里可以设置指定的审批人
    }

    // 保存其他配置
    onSave(updates);
  };

  return (
    <div className="h-full flex flex-col">
      {/* 头部 */}
      <div className="border-b border-gray-200 px-6 py-4 flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-900">审批人</h3>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 text-xl"
        >
          ×
        </button>
      </div>

      {/* 标签页 */}
      <div className="border-b border-gray-200 px-6">
        <div className="flex space-x-4">
          <button
            onClick={() => setActiveTab('approver')}
            className={`
              py-3 px-4 border-b-2 font-medium text-sm transition-colors
              ${
                activeTab === 'approver'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }
            `}
          >
            设置审批人
          </button>
          <button
            onClick={() => setActiveTab('permission')}
            className={`
              py-3 px-4 border-b-2 font-medium text-sm transition-colors
              ${
                activeTab === 'permission'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }
            `}
          >
            表单权限设置
          </button>
        </div>
      </div>

      {/* 内容区 */}
      <div className="flex-1 overflow-y-auto p-6">
        {activeTab === 'approver' ? (
          <div className="space-y-6">
            {/* 选择审批对象 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                选择审批对象
              </label>
              <div className="space-y-2">
                {[
                  { value: 'designated', label: '指定人员' },
                  { value: 'self-select', label: '发起人自选' },
                  { value: 'multi-level-supervisor', label: '连续多级主管' },
                  { value: 'supervisor', label: '主管', selected: true },
                  { value: 'role', label: '角色' },
                  { value: 'self', label: '发起人自己' },
                  { value: 'form-contact', label: '表单内联系人' },
                ].map((option) => (
                  <label
                    key={option.value}
                    className="flex items-center space-x-2 p-2 hover:bg-gray-50 rounded cursor-pointer"
                  >
                    <input
                      type="radio"
                      name="approverType"
                      value={option.value}
                      checked={approverType === option.value}
                      onChange={(e) => setApproverType(e.target.value as ApproverType)}
                      className="text-blue-600"
                    />
                    <span className="text-sm text-gray-700">{option.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* 指定主管 */}
            {approverType === 'supervisor' && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-3">
                  <span className="text-yellow-600">💡</span>
                  <span className="text-sm font-medium text-gray-700">指定主管</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-700">发起人的第</span>
                  <div className="flex items-center space-x-1 border border-gray-300 rounded">
                    <button
                      onClick={() => setSupervisorLevel(Math.max(1, supervisorLevel - 1))}
                      className="px-2 py-1 hover:bg-gray-100"
                    >
                      -
                    </button>
                    <input
                      type="number"
                      value={supervisorLevel}
                      onChange={(e) => setSupervisorLevel(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-12 text-center border-0 focus:ring-0"
                      min="1"
                    />
                    <button
                      onClick={() => setSupervisorLevel(supervisorLevel + 1)}
                      className="px-2 py-1 hover:bg-gray-100"
                    >
                      +
                    </button>
                  </div>
                  <span className="text-sm text-gray-700">级主管</span>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  直接主管为第1级主管
                </p>
              </div>
            )}

            {/* 审批人为空时 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                审批人为空时
              </label>
              <div className="space-y-2">
                {[
                  { value: 'auto-pass', label: '自动通过', selected: true },
                  { value: 'auto-reject', label: '自动驳回' },
                  { value: 'transfer-admin', label: '转交审批管理员' },
                  { value: 'transfer-person', label: '转交到指定人员' },
                ].map((option) => (
                  <label
                    key={option.value}
                    className="flex items-center space-x-2 p-2 hover:bg-gray-50 rounded cursor-pointer"
                  >
                    <input
                      type="radio"
                      name="emptyAction"
                      value={option.value}
                      checked={emptyAction === option.value}
                      onChange={(e) => setEmptyAction(e.target.value as EmptyAction)}
                      className="text-blue-600"
                    />
                    <span className="text-sm text-gray-700">{option.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* 高级设置 */}
            <div className="border-t border-gray-200 pt-4">
              <h4 className="text-sm font-medium text-gray-700 mb-3">高级设置</h4>
              
              {/* 审批同意时是否需要签字 */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm text-gray-700">
                    审批同意时是否需要签字
                    <span className="text-gray-400 ml-1">?</span>
                  </label>
                  <div className="flex items-center space-x-2">
                    <span className={`text-sm ${!needSignature ? 'font-medium text-blue-600' : 'text-gray-500'}`}>
                      不用
                    </span>
                    <button
                      onClick={() => setNeedSignature(!needSignature)}
                      className={`
                        relative inline-flex h-6 w-11 items-center rounded-full transition-colors
                        ${needSignature ? 'bg-blue-600' : 'bg-gray-300'}
                      `}
                    >
                      <span
                        className={`
                          inline-block h-4 w-4 transform rounded-full bg-white transition-transform
                          ${needSignature ? 'translate-x-6' : 'translate-x-1'}
                        `}
                      />
                    </button>
                    <span className={`text-sm ${needSignature ? 'font-medium text-blue-600' : 'text-gray-500'}`}>
                      需要
                    </span>
                  </div>
                </div>
              </div>

              {/* 审批期限 */}
              <div className="mb-4">
                <label className="block text-sm text-gray-700 mb-2">
                  审批期限 (为0则不生效)
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="number"
                    value={deadline}
                    onChange={(e) => setDeadline(parseInt(e.target.value) || 0)}
                    className="flex-1 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    min="0"
                  />
                  <select
                    value={deadlineUnit}
                    onChange={(e) => setDeadlineUnit(e.target.value as 'hour' | 'day')}
                    className="p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="hour">小时</option>
                    <option value="day">天</option>
                  </select>
                </div>
              </div>
            </div>

            {/* 如果审批被驳回 */}
            <div className="border-t border-gray-200 pt-4">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                如果审批被驳回
              </label>
              <div className="space-y-2">
                {[
                  { value: 'end', label: '直接结束流程', selected: true },
                  { value: 'reject-to-parent', label: '驳回到上级审批节点' },
                  { value: 'reject-to-node', label: '驳回到指定节点' },
                ].map((option) => (
                  <label
                    key={option.value}
                    className="flex items-center space-x-2 p-2 hover:bg-gray-50 rounded cursor-pointer"
                  >
                    <input
                      type="radio"
                      name="rejectAction"
                      value={option.value}
                      checked={rejectAction === option.value}
                      onChange={(e) => setRejectAction(e.target.value as RejectAction)}
                      className="text-blue-600"
                    />
                    <span className="text-sm text-gray-700">{option.label}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center text-gray-500 py-12">
            <p>表单权限设置功能开发中...</p>
          </div>
        )}
      </div>

      {/* 底部操作按钮 */}
      <div className="border-t border-gray-200 px-6 py-4">
        <div className="flex space-x-3">
          <button
            onClick={onClose}
            className="flex-1 py-2 px-4 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
          >
            取消
          </button>
          <button
            onClick={handleSave}
            className="flex-1 py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            保存
          </button>
        </div>
      </div>
    </div>
  );
}
