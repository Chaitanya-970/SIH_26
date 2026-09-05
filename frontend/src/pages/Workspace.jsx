import React, { useState, useEffect, useRef } from 'react';
import KnowledgeTreePane from '../components/KnowledgeTreePane';
import WorkspacePane from './WorkspacePane';
import IntelligencePane from '../components/IntelligencePane';
import { streamChat } from '../services/sseClient';
import { fetchKnowledgeBase, registerNewSessionFile } from '../services/api';

/**
 * Workspace - Master 3-Pane Flagship Interface
 * PANE 1: KNOWLEDGE (~20%, collapsible) - "What the system knows"
 * PANE 2: WORKSPACE (~55-60%, flexible) - "What you are doing"
 * PANE 3: INTELLIGENCE (~20-25%, collapsible) - "What the system is doing"
 */
export default function Workspace({
  sessionId = 'demo-session',
  initialWorkItem = null,
  onOpenKnowledgeBaseUpload
}) {
  // Pane collapse states
  const [leftCollapsed, setLeftCollapsed] = useState(false);
  const [rightCollapsed, setRightCollapsed] = useState(false);

  // Dynamic Knowledge Base documents (empty on fresh session)
  const [kbDocuments, setKbDocuments] = useState([]);

  // Center Workspace State
  const [centerView, setCenterView] = useState('empty'); // 'empty' | 'query' | 'document'
  const [activeDocument, setActiveDocument] = useState(null);
  const [activeDocPage, setActiveDocPage] = useState(1);
  const [highlightText, setHighlightText] = useState('');

  // Active Query & Intelligence State
  const [queryData, setQueryData] = useState(null);
  const [isWorking, setIsWorking] = useState(false);
  const [agentSteps, setAgentSteps] = useState([]);
  const [toolCalls, setToolCalls] = useState([]);
  const [sources, setSources] = useState([]);
  const [intelligenceTab, setIntelligenceTab] = useState('agents');
  const [activeModel, setActiveModel] = useState('phi3.5:3.8b');

  // Generated session deliverables (starts empty for fresh user session)
  const [sessionFiles, setSessionFiles] = useState([]);
  const [activeSessionFile, setActiveSessionFile] = useState(null);

  const abortControllerRef = useRef(null);

  useEffect(() => {
    let mounted = true;
    fetchKnowledgeBase()
      .then((docs) => {
        if (mounted) setKbDocuments(docs || []);
      })
      .catch(() => {});
    return () => {
      mounted = false;
    };
  }, []);

  // Handle incoming initialWorkItem from Dashboard
  useEffect(() => {
    if (initialWorkItem) {
      setQueryData({
        userPrompt: initialWorkItem.query || initialWorkItem.title,
        timestamp: initialWorkItem.meta || 'Recent',
        answer: initialWorkItem.answer || '',
        sources: initialWorkItem.sources || []
      });
      setSources(initialWorkItem.sources || []);
      setCenterView('query');
      if (initialWorkItem.documentName) {
        const foundDoc = kbDocuments.find((d) => d.name === initialWorkItem.documentName) || {
          id: `recent-doc-${Date.now()}`,
          name: initialWorkItem.documentName,
          pages: 50,
          type: initialWorkItem.documentName.split('.').pop()
        };
        setActiveDocument(foundDoc);
        setActiveDocPage(initialWorkItem.page || 1);
      }
    }
  }, [initialWorkItem, kbDocuments]);

  // Interaction 1: User selects a document or section from Left Pane (Knowledge)
  const handleSelectDocument = (doc, page = 1) => {
    setActiveDocument(doc);
    setActiveDocPage(page);
    setHighlightText('');
    setCenterView('document');
  };

  // Interaction 2: User executes a query from Center Workspace
  const handleExecuteQuery = async ({ message, model, attachment }) => {
    setIsWorking(true);
    setCenterView('query');
    setActiveModel(model === 'auto' ? 'phi3.5:3.8b' : model);

    const initialQueryData = {
      userPrompt: message,
      timestamp: new Date().toLocaleTimeString(),
      answer: '',
      sources: []
    };
    setQueryData(initialQueryData);
    setSources([]);
    setAgentSteps([]);
    setToolCalls([]);
    setIntelligenceTab('agents');

    abortControllerRef.current = new AbortController();

    try {
      await streamChat({
        sessionId,
        message,
        modelOverride: model,
        attachment,
        abortSignal: abortControllerRef.current.signal,
        onEvent: (eventType, data) => {
          handleSSEEvent(eventType, data);
        }
      });
    } catch (err) {
      console.error('Execution stream error:', err);
      setIsWorking(false);
    }
  };

  const handleSSEEvent = (eventType, data) => {
    switch (eventType) {
      case 'token':
        setQueryData((prev) => {
          if (!prev) return prev;
          const tokenStr = typeof data === 'string' ? data : (data.token || data.text || '');
          return { ...prev, answer: prev.answer + tokenStr };
        });
        break;

      case 'step_start':
        setAgentSteps((prev) => [
          ...prev,
          {
            step: data.step || prev.length + 1,
            title: data.title,
            description: data.description,
            status: 'running'
          }
        ]);
        break;

      case 'tool_call':
        setToolCalls((prev) => [
          ...prev,
          {
            tool: data.tool,
            args: data.args,
            status: 'running',
            result: null
          }
        ]);
        break;

      case 'tool_result':
        setToolCalls((prev) =>
          prev.map((tc, idx) =>
            idx === prev.length - 1
              ? { ...tc, status: 'completed', result: data.result }
              : tc
          )
        );
        break;

      case 'sources_found':
        setSources(data);
        setQueryData((prev) => (prev ? { ...prev, sources: data } : prev));
        break;

      case 'file_created': {
        const newFile = {
          name: data.name,
          type: data.type || data.name.split('.').pop(),
          size: data.size || '36 KB',
          timestamp: 'Just now',
          code_data: data.code_data,
          previewUrl: `/api/sessions/${sessionId}/files/${data.name}/preview`
        };
        setSessionFiles((prev) => [newFile, ...prev.filter((f) => f.name !== newFile.name)]);
        registerNewSessionFile(newFile);
        setActiveSessionFile(newFile);
        break;
      }

      case 'model_switch':
        setActiveModel(data.target_model);
        break;

      case 'done':
        setIsWorking(false);
        break;

      case 'error':
        setIsWorking(false);
        break;

      default:
        break;
    }
  };

  // Interaction 3: User clicks a source citation from Query Result or Intelligence Pane
  const handleViewSourceDocument = (source) => {
    let foundDoc = kbDocuments.find((d) => d.name === source.documentName);

    if (!foundDoc) {
      foundDoc = {
        id: `src-${Date.now()}`,
        name: source.documentName,
        pages: Math.max(source.page || 1, 24),
        type: source.documentName.split('.').pop()
      };
    }

    setActiveDocument(foundDoc);
    setActiveDocPage(source.page || 1);
    setHighlightText(source.snippet || '');
    setCenterView('document');
  };

  // Interaction 4: Select generated session deliverable from assets drawer
  const handleSelectSessionFile = (file) => {
    setActiveSessionFile(file);
    setActiveDocument(file);
    setActiveDocPage(1);
    setHighlightText('');
    setCenterView('document');
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      width: '100%',
      height: 'calc(100vh - 52px)',
      background: 'transparent',
      overflow: 'hidden'
    }}>
      {/* Main 3-Pane Workstation Area */}
      <div style={{
        display: 'flex',
        flex: 1,
        width: '100%',
        overflow: 'hidden'
      }}>
        {/* PANE 1: KNOWLEDGE (~20%, collapsible) */}
        <KnowledgeTreePane
          documents={kbDocuments}
          onSelectDocument={handleSelectDocument}
          activeDocument={activeDocument}
          onOpenAddSource={onOpenKnowledgeBaseUpload}
          isCollapsed={leftCollapsed}
          onToggleCollapse={() => setLeftCollapsed(!leftCollapsed)}
        />

        {/* PANE 2: WORKSPACE (~55-60%, flexible) */}
        <WorkspacePane
          activeView={centerView}
          activeDocument={activeDocument}
          activePage={activeDocPage}
          highlightText={highlightText}
          queryData={queryData}
          isWorking={isWorking}
          onExecuteQuery={handleExecuteQuery}
          onViewSourceDocument={handleViewSourceDocument}
          onBackToQuery={() => setCenterView('query')}
          sessionFiles={sessionFiles}
          activeSessionFile={activeSessionFile}
          onSelectSessionFile={handleSelectSessionFile}
          sessionId={sessionId}
        />

        {/* PANE 3: INTELLIGENCE (~20-25%, collapsible) */}
        <IntelligencePane
          activeTab={intelligenceTab}
          onTabChange={setIntelligenceTab}
          agentSteps={agentSteps}
          toolCalls={toolCalls}
          sources={sources}
          onSelectSource={handleViewSourceDocument}
          isCollapsed={rightCollapsed}
          onToggleCollapse={() => setRightCollapsed(!rightCollapsed)}
          activeModel={activeModel}
          isStreaming={isWorking}
        />
      </div>

      {/* Minimal Bottom Status Bar (Dedicated Application Screen Footer) */}
      <div style={{
        height: '24px',
        background: 'var(--bg-panel)',
        borderTop: '1px solid var(--border-subtle)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 14px',
        fontFamily: 'var(--font-mono)',
        fontSize: '10px',
        color: 'var(--text-dim)',
        userSelect: 'none',
        zIndex: 10
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '5px', color: 'var(--text-secondary)' }}>
            <span className="pulse-dot" style={{ width: '4px', height: '4px' }} />
            <span>SOVEREIGN OPERATIONAL MODE</span>
          </span>
          <span>·</span>
          <span>AIR-GAPPED</span>
          <span>·</span>
          <span>SESSION: {sessionId}</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span>MODEL: {activeModel.toUpperCase()}</span>
          <span>·</span>
          <span>DOCUMENT INDEX: READY</span>
          <span>·</span>
          <span style={{ color: 'var(--accent-lemongrass)', fontWeight: 600 }}>LOCAL BY DESIGN ●</span>
        </div>
      </div>
    </div>
  );
}
