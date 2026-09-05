import React, { useState, useRef } from 'react';
import DocumentViewer from '../components/DocumentViewer';
import MarkdownRenderer from '../components/MarkdownRenderer';
import WorkspaceAssets from './WorkspaceAssets';
import {
  Send,
  Paperclip,
  X,
  CheckCircle2,
  FileText,
  ArrowRight,
  ArrowUpRight
} from 'lucide-react';

/**
 * WorkspacePane - PANE 2 (CENTER): WORKSPACE
 * "Where I work"
 * Technical execution terminal with ergonomic query input and authoritative grounding
 */
export default function WorkspacePane({
  activeView = 'empty', // 'empty' | 'query' | 'document'
  activeDocument = null,
  activePage = 1,
  highlightText = '',
  queryData = null,
  isWorking = false,
  onExecuteQuery,
  onViewSourceDocument,
  onBackToQuery,
  sessionFiles = [],
  activeSessionFile = null,
  onSelectSessionFile,
  sessionId = 'demo-session'
}) {
  const [inputMessage, setInputMessage] = useState('');
  const [selectedModel, setSelectedModel] = useState('auto');
  const [attachment, setAttachment] = useState(null);
  const [uploadError, setUploadError] = useState('');
  const fileInputRef = useRef(null);

  const availableOperations = [
    {
      id: 'op-1',
      num: '01',
      title: 'Document Query',
      desc: 'Search technical documentation using PageIndex.',
      prompt: 'Search the knowledge base for equipment operating limits, safety protocols, and inspection schedules.'
    },
    {
      id: 'op-2',
      num: '02',
      title: 'Engineering Calculation',
      desc: 'Execute verified calculations in the local sandbox.',
      prompt: 'Write and execute a Python script to calculate thermal expansion and allowable stress per ASME B31.3.'
    },
    {
      id: 'op-3',
      num: '03',
      title: 'Report Draft',
      desc: 'Generate an engineering report from verified sources.',
      prompt: 'Draft an executive turnaround approval note summarizing asset integrity findings for Chief Engineer review.'
    }
  ];

  const handleFileSelect = (file) => {
    setUploadError('');
    if (!file) return;
    if (file.size > 50 * 1024 * 1024) {
      setUploadError(`File rejected: "${file.name}" exceeds 50 MB limit.`);
      return;
    }
    setAttachment(file);
  };

  const handleSend = (overrideText, overrideAttach) => {
    const text = overrideText || inputMessage;
    const attach = overrideAttach || attachment;
    if (!text.trim() && !attach) return;
    if (isWorking) return;

    onExecuteQuery({
      message: text.trim(),
      model: selectedModel,
      attachment: attach
    });

    setInputMessage('');
    setAttachment(null);
  };

  return (
    <div style={{
      flex: 1,
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      background: 'var(--bg-dark)',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Session Deliverables Strip (If any generated files exist) */}
      {sessionFiles.length > 0 && (
        <WorkspaceAssets
          files={sessionFiles}
          activeFile={activeSessionFile}
          onSelectFile={onSelectSessionFile}
          sessionId={sessionId}
        />
      )}

      {/* Main Center Stage */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative'
      }}>
        {/* STATE 1: INITIAL WORKSPACE STATE */}
        {activeView === 'empty' && (
          <div
            key="empty"
            className="tab-panel-enter"
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '36px 28px',
              textAlign: 'center'
            }}
          >
            <h1 style={{
              fontFamily: 'var(--font-display)',
              fontSize: '22px',
              fontWeight: 700,
              color: 'var(--text-main)',
              letterSpacing: '-0.02em',
              marginBottom: '8px',
              lineHeight: 1.2
            }}>
              Refinery Engineering & Analysis
            </h1>

            <p style={{
              fontSize: '13px',
              color: 'var(--text-secondary)',
              maxWidth: '520px',
              marginBottom: '26px',
              lineHeight: 1.55
            }}>
              Formulate tasks, search equipment limits, and verify incident logs across your indexed repository.
            </p>

            {/* AVAILABLE OPERATIONS */}
            <div style={{
              width: '100%',
              maxWidth: '640px',
              marginBottom: '24px'
            }}>
              <div style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '10.5px',
                fontWeight: 600,
                color: 'var(--text-dim)',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                textAlign: 'left',
                marginBottom: '8px'
              }}>
                AVAILABLE OPERATIONS
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {availableOperations.map((op, opIdx) => (
                  <div
                    key={op.id}
                    onClick={() => handleSend(op.prompt)}
                    className="technical-row anim-stagger-item"
                    style={{
                      padding: '12px 14px',
                      cursor: 'pointer',
                      animationDelay: `${opIdx * 50}ms`
                    }}
                  >
                    <div style={{ textAlign: 'left', flex: 1, display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: '11px',
                        fontWeight: 600,
                        color: 'var(--text-dim)'
                      }}>
                        {op.num}
                      </span>
                      <div>
                        <div style={{
                          fontFamily: 'var(--font-mono)',
                          fontSize: '12px',
                          fontWeight: 600,
                          color: 'var(--text-main)'
                        }}>
                          {op.title}
                        </div>
                        <div style={{
                          fontSize: '11.5px',
                          color: 'var(--text-muted)'
                        }}>
                          {op.desc}
                        </div>
                      </div>
                    </div>

                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                      fontFamily: 'var(--font-mono)',
                      fontSize: '11px',
                      color: 'var(--text-secondary)',
                      fontWeight: 500
                    }}>
                      <span>Run</span>
                      <ArrowRight size={11} style={{ color: 'var(--text-muted)' }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Local Security Footnote */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              fontSize: '10.5px',
              color: 'var(--text-dim)',
              fontFamily: 'var(--font-mono)'
            }}>
              <span>LOCAL MODEL: AUTO</span>
              <span>·</span>
              <span>ROUTER: ACTIVE</span>
              <span>·</span>
              <span>SANDBOX: AVAILABLE</span>
            </div>
          </div>
        )}

        {/* STATE 2: ACTIVE QUERY / RESULTS STATE */}
        {activeView === 'query' && queryData && (
          <div key="query" className="anim-response-enter" style={{ padding: '20px 28px' }}>
            {/* Query Header Strip */}
            <div style={{
              background: 'var(--bg-panel)',
              border: '1px solid var(--border-medium)',
              borderRadius: 'var(--radius-xs)',
              padding: '12px 16px',
              marginBottom: '14px'
            }}>
              <div style={{
                fontSize: '10px',
                color: 'var(--text-dim)',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                fontFamily: 'var(--font-mono)',
                marginBottom: '4px'
              }}>
                QUERY EXECUTION // {queryData.timestamp || 'ACTIVE'}
              </div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '14.5px', fontWeight: 600, color: 'var(--text-main)' }}>
                &ldquo;{queryData.userPrompt}&rdquo;
              </div>
            </div>

            {/* Verified Answer Panel */}
            <div style={{
              background: 'var(--bg-panel)',
              border: '1px solid var(--border-medium)',
              borderRadius: 'var(--radius-xs)',
              padding: '18px 22px',
              marginBottom: '14px'
            }}>
              <div style={{
                fontSize: '11px',
                fontFamily: 'var(--font-mono)',
                color: 'var(--text-secondary)',
                marginBottom: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <CheckCircle2 size={14} className="anim-checkmark-pop" style={{ color: 'var(--accent-lemongrass)' }} />
                  <span>VERIFIED RESULT // ON-PREMISE GROUNDING</span>
                </div>

                {isWorking && (
                  <span style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '10px',
                    color: 'var(--accent-lemongrass)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px'
                  }}>
                    <span>RUNNING LOCAL MODEL</span>
                    <span className="pulse-dot anim-agent-running" style={{ width: '5px', height: '5px' }} />
                  </span>
                )}
              </div>

              <MarkdownRenderer content={queryData.answer} />

              {isWorking && <span className="typing-cursor" />}
            </div>

            {/* Source Citations Box */}
            {queryData.sources && queryData.sources.length > 0 && (
              <div style={{
                background: 'var(--bg-panel)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-xs)',
                padding: '14px 18px'
              }}>
                <div style={{
                  fontSize: '10.5px',
                  fontWeight: 600,
                  color: 'var(--text-dim)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  fontFamily: 'var(--font-mono)',
                  marginBottom: '10px'
                }}>
                  AUTHORITATIVE GROUNDING SOURCES
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {queryData.sources.map((src, sIdx) => (
                    <div
                      key={sIdx}
                      className="anim-evidence-item"
                      style={{
                        padding: '8px 12px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        background: 'var(--bg-surface)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: 'var(--radius-xs)',
                        animationDelay: `${sIdx * 50}ms`
                      }}
                    >
                      <div>
                        <div style={{ fontSize: '12px', color: 'var(--text-main)', fontWeight: 600 }}>
                          {src.documentName}
                        </div>
                        <div style={{ fontSize: '10.5px', color: 'var(--text-muted)', marginTop: '2px', fontFamily: 'var(--font-mono)' }}>
                          Page {src.page} {src.section ? `// ${src.section}` : ''}
                        </div>
                      </div>

                      <button
                        onClick={() => onViewSourceDocument(src)}
                        className="btn-modern"
                        style={{ padding: '3px 8px', fontSize: '11px', color: 'var(--text-main)' }}
                      >
                        <span>View Source</span>
                        <ArrowUpRight size={11} style={{ color: 'var(--text-secondary)' }} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* STATE 3: DOCUMENT VIEWER STATE */}
        {activeView === 'document' && activeDocument && (
          <div key="document" className="tab-panel-enter" style={{ flex: 1, height: '100%', display: 'flex', flexDirection: 'column' }}>
            <DocumentViewer
              document={activeDocument}
              initialPage={activePage}
              highlightText={highlightText}
              hasActiveQuery={!!queryData}
              onBackToQuery={onBackToQuery}
              sessionId={sessionId}
            />
          </div>
        )}
      </div>

      {/* Upload Error Banner */}
      {uploadError && (
        <div style={{
          background: 'rgba(244, 63, 94, 0.1)',
          borderTop: '1px solid var(--status-rose)',
          padding: '6px 18px',
          color: '#fda4af',
          fontSize: '11.5px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <span>{uploadError}</span>
          <button
            onClick={() => setUploadError('')}
            style={{ background: 'transparent', border: 'none', color: '#fda4af', cursor: 'pointer' }}
          >
            <X size={13} />
          </button>
        </div>
      )}

      {/* Prominent, Ergonomic Bottom Query Bar */}
      <div style={{
        padding: '10px 20px 14px 20px',
        borderTop: '1px solid var(--border-subtle)',
        background: 'var(--bg-panel)',
        zIndex: 20
      }}>
        <div className="omnibar-container" style={{ padding: '4px 6px' }}>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            style={{ display: 'flex', gap: '6px', alignItems: 'center' }}
          >
            {/* File Attach Button */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={(e) => {
                if (e.target.files && e.target.files.length > 0) {
                  handleFileSelect(e.target.files[0]);
                }
              }}
              accept=".pdf,.docx,.xlsx,.csv,.png,.jpg,.jpeg"
              style={{ display: 'none' }}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isWorking}
              className="btn-modern"
              title="Attach document (PDF/DOCX/XLSX/PNG ≤ 50MB)"
              style={{ height: '34px', padding: '0 10px' }}
            >
              <Paperclip size={14} />
            </button>

            {/* Input Field */}
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              disabled={isWorking}
              placeholder={
                isWorking
                  ? "Local agents executing query across repository..."
                  : "Formulate engineering query or task..."
              }
              style={{
                flex: 1,
                height: '34px',
                background: 'transparent',
                border: 'none',
                color: 'var(--text-main)',
                padding: '0 10px',
                fontFamily: 'var(--font-ui)',
                fontSize: '12.5px',
                outline: 'none',
                cursor: isWorking ? 'not-allowed' : 'text'
              }}
            />

            {/* Execute Button */}
            <button
              type="submit"
              disabled={isWorking || (!inputMessage.trim() && !attachment)}
              className="btn-modern btn-modern-accent"
              style={{ height: '34px', padding: '0 14px', fontSize: '11.5px' }}
            >
              <span>EXECUTE</span>
              <ArrowRight size={12} />
            </button>
          </form>

          {attachment && (
            <div style={{
              marginTop: '4px',
              padding: '3px 8px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '11px',
              color: 'var(--text-secondary)',
              background: 'var(--bg-surface)',
              borderRadius: 'var(--radius-xs)'
            }}>
              <FileText size={12} style={{ color: 'var(--accent-lemongrass)' }} />
              <span>Attached: <strong>{attachment.name}</strong></span>
              <button
                onClick={() => setAttachment(null)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-dim)', cursor: 'pointer', marginLeft: 'auto' }}
              >
                <X size={12} />
              </button>
            </div>
          )}
        </div>

        {/* Compact Metadata Row Below Query Bar */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginTop: '6px',
          padding: '0 4px',
          fontFamily: 'var(--font-mono)',
          fontSize: '10px',
          color: 'var(--text-dim)'
        }}>
          <div style={{ display: 'flex', gap: '14px' }}>
            <span>LOCAL MODEL: <strong style={{ color: 'var(--text-secondary)' }}>AUTO (PHI-3.5)</strong></span>
            <span>ROUTER: <strong style={{ color: 'var(--text-secondary)' }}>ACTIVE</strong></span>
            <span>SANDBOX: <strong style={{ color: 'var(--accent-amber)' }}>AVAILABLE</strong></span>
          </div>

          <div>
            <span>0 OUTBOUND EGRESS</span>
          </div>
        </div>
      </div>
    </div>
  );
}
