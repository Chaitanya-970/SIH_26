import React, { useState } from 'react';
import TopNav from './components/TopNav';
import { OPERATORS } from './components/OperatorDropdown';
import Dashboard from './pages/Dashboard';
import Workspace from './pages/Workspace';
import KnowledgeBase from './pages/KnowledgeBase';

/**
 * App - Root Application Shell
 * Manages 3 primary engineering pages: Dashboard (launchpad), Workspace (flagship 3-pane),
 * and Knowledge Base (PageIndex repository), plus Air-Gap persistent telemetry and operator persona state.
 */
export default function App() {
  const [activePage, setActivePage] = useState('dashboard'); // 'dashboard' | 'workspace' | 'kb'
  const [activeWorkItem, setActiveWorkItem] = useState(null);
  const [currentUser, setCurrentUser] = useState(OPERATORS[0]);
  const [sessionId] = useState(() => `session-${Math.random().toString(36).substring(2, 9)}`);

  const handleNewQuery = () => {
    setActiveWorkItem(null);
    setActivePage('workspace');
  };

  const handleOpenWorkspace = () => {
    setActivePage('workspace');
  };

  const handleOpenKnowledge = () => {
    setActivePage('kb');
  };

  const handleSelectRecentWork = (item) => {
    setActiveWorkItem(item);
    setActivePage('workspace');
  };

  const handleOpenDocumentFromKB = (doc) => {
    setActiveWorkItem({
      query: `Reviewing technical document: ${doc.name}`,
      title: doc.name,
      documentName: doc.name,
      page: 1,
      meta: 'Document inspection',
      sources: [{ documentName: doc.name, page: 1, section: 'Overview' }]
    });
    setActivePage('workspace');
  };

  const handleAskAboutDocumentFromKB = (doc) => {
    setActiveWorkItem({
      query: `Summarize key engineering operating limits, inspection findings, and standards from ${doc.name}.`,
      title: doc.name,
      documentName: doc.name,
      page: 1,
      meta: 'PageIndex query launch',
      sources: [{ documentName: doc.name, page: 1, section: 'Section 1' }]
    });
    setActivePage('workspace');
  };

  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      background: 'var(--bg-dark)',
      overflow: 'hidden'
    }}>
      {/* Persistent Sovereign Top Navigation */}
      <TopNav
        activePage={activePage}
        onNavigate={setActivePage}
        user={currentUser}
        onSelectOperator={setCurrentUser}
      />

      {/* Main Page Routing with Silky Page Transition */}
      <main style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
        <div key={activePage} className="page-enter" style={{ width: '100%', height: '100%' }}>
          {activePage === 'dashboard' && (
            <Dashboard
              user={currentUser}
              onNavigate={setActivePage}
              onNewQuery={handleNewQuery}
              onOpenWorkspace={handleOpenWorkspace}
              onOpenKnowledge={handleOpenKnowledge}
              onSelectRecentWork={handleSelectRecentWork}
            />
          )}

          {activePage === 'workspace' && (
            <Workspace
              sessionId={sessionId}
              initialWorkItem={activeWorkItem}
              onOpenKnowledgeBaseUpload={() => setActivePage('kb')}
            />
          )}

          {activePage === 'kb' && (
            <KnowledgeBase
              onOpenDocument={handleOpenDocumentFromKB}
              onAskAboutDocument={handleAskAboutDocumentFromKB}
            />
          )}
        </div>
      </main>
    </div>
  );
}
