import { useWorkflowStore } from './store/workflowStore';
import Layout from './components/Layout';
import PendingApprovals from './components/PendingApprovals';
import ApprovedList from './components/ApprovedList';
import MyRequests from './components/MyRequests';
import WorkflowManagement from './components/WorkflowManagement';
import WorkflowDesignPage from './components/WorkflowDesignPage';
import './App.css';

function App() {
  const { activeTab, designWorkflowId, setActiveTab } = useWorkflowStore();

  // 如果是流程设计页面，直接显示设计页面
  if (activeTab === 'workflow-design') {
    return (
      <WorkflowDesignPage
        workflowId={designWorkflowId}
        onBack={() => setActiveTab('workflows')}
      />
    );
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'pending':
        return <PendingApprovals />;
      case 'approved':
        return <ApprovedList />;
      case 'my-requests':
        return <MyRequests />;
      case 'workflows':
        return <WorkflowManagement />;
      default:
        return <PendingApprovals />;
    }
  };

  return (
    <Layout>
      {renderContent()}
    </Layout>
  );
}

export default App;
