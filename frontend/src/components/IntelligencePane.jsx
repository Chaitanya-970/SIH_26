import React, { useState } from 'react';
import DitherProgress from './DitherProgress';
import {
  ChevronRight,
  ChevronLeft,
  ArrowUpRight,
  Wrench
} from 'lucide-react';

/**
 * IntelligencePane - PANE 3 (RIGHT): INTELLIGENCE
 * "What the system is doing"
 * Live execution console, agent state progression, and grounding citations
 */
export default function IntelligencePane({
  activeTab = 'agents',
  onTabChange,
  agentSteps = [],
  toolCalls = [],
  sources = [],
  onSelectSource,
  isCollapsed,
  onToggleCollapse,
  activeModel = 'phi3.5:3.8b',
  isStreaming = false
}) {
  const [internalTab, setInternalTab] = useState('agents');
  const [expandedTools, setExpandedTools] = useState({});

  const currentTab = onTabChange ? activeTab : internalTab;
  const setTab = onTabChange || setInternalTab;

  const toggleToolCollapse = (toolId) => {
    setExpandedTools((prev) => ({ ...prev, [toolId]: !prev[toolId] }));
  };

  if (isCollapsed) {
    return (
      <div style={{
        width: '38px',
        height: '100%',
        background: 'var(--bg-panel)',
        borderLeft: '1px solid var(--border-medium)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '12px 0',
        userSelect: 'none'
      }}>
        <button
          onClick={onToggleCollapse}
          className="btn-modern"
          style={{ padding: '4px', width: '26px', height: '26px', justifyContent: 'center' }}
          title="Expand Intelligence Pane"
        >
          <ChevronLeft size={13} />
        </button>
        <div style={{
          writingMode: 'vertical-rl',
          textOrientation: 'mixed',
          fontFamily: 'var(--font-mono)',
          fontSize: '10px',
          fontWeight: 600,
          color: 'var(--text-dim)',
          letterSpacing: '0.12em',
          marginTop: '16px'
        }}>
          INTELLIGENCE
        </div>
      </div>
    );
  }

  // Dynamic Pipeline States
  const getStageStatus = (stageNum) => {
    if (isStreaming) {
      if (stageNum === 1) return { label: 'RUNNING', symbol: '●', color: 'var(--accent-lemongrass)', isRunning: true };
      if (stageNum === 2) return sources.length > 0 ? { label: 'COMPLETE', symbol: '✓', color: 'var(--text-secondary)', isComplete: true } : { label: 'WAITING', symbol: '◌', color: 'var(--text-dim)' };
      if (stageNum === 3) return sources.length > 0 ? { label: 'COMPLETE', symbol: '✓', color: 'var(--text-secondary)', isComplete: true } : { label: 'WAITING', symbol: '◌', color: 'var(--text-dim)' };
      if (stageNum === 4) return sources.length > 0 ? { label: 'VERIFYING', symbol: '●', color: 'var(--accent-amber)', isRunning: true } : { label: 'STANDBY', symbol: '—', color: 'var(--text-dim)' };
    }

    if (sources.length > 0 || agentSteps.length > 0) {
      if (stageNum === 1) return { label: 'COMPLETE', symbol: '✓', color: 'var(--text-secondary)', isComplete: true };
      if (stageNum === 2) return { label: 'COMPLETE', symbol: '✓', color: 'var(--text-secondary)', isComplete: true };
      if (stageNum === 3) return { label: 'COMPLETE', symbol: '✓', color: 'var(--text-secondary)', isComplete: true };
      if (stageNum === 4) return { label: 'VERIFIED', symbol: '✓', color: 'var(--accent-lemongrass)', isVerified: true, isComplete: true };
    }

    // Default Idle State
    switch (stageNum) {
      case 1: return { label: 'IDLE', symbol: '●', color: 'var(--text-dim)' };
      case 2: return { label: 'READY', symbol: '●', color: 'var(--text-secondary)' };
      case 3: return { label: 'READY', symbol: '●', color: 'var(--text-secondary)' };
      case 4: default: return { label: 'STANDBY', symbol: '—', color: 'var(--text-dim)' };
    }
  };

  const stages = [
    { num: '01', name: 'ORCHESTRATOR', desc: 'Task decomposition', status: getStageStatus(1) },
    { num: '02', name: 'DOCUMENT ANALYST', desc: 'Source identification', status: getStageStatus(2) },
    { num: '03', name: 'PAGEINDEX', desc: 'Repository traversal', status: getStageStatus(3) },
    { num: '04', name: 'SOVEREIGN VERIFIER', desc: 'Evidence validation', status: getStageStatus(4) }
  ];

  return (
    <div style={{
      width: '290px',
      minWidth: '270px',
      maxWidth: '340px',
      height: '100%',
      background: 'var(--bg-panel)',
      borderLeft: '1px solid var(--border-medium)',
      display: 'flex',
      flexDirection: 'column',
      userSelect: 'none',
      overflow: 'hidden'
    }}>
      {/* Pane Header */}
      <div style={{
        padding: '12px 14px',
        borderBottom: '1px solid var(--border-subtle)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start'
      }}>
        <div>
          <div style={{
            fontFamily: 'var(--font-display)',
            fontSize: '13px',
            fontWeight: 700,
            color: 'var(--text-main)',
            letterSpacing: '0.04em'
          }}>
            INTELLIGENCE
          </div>
          <div style={{
            fontSize: '11px',
            color: 'var(--text-muted)'
          }}>
            What the system is doing
          </div>
        </div>

        <button
          onClick={onToggleCollapse}
          className="btn-modern"
          style={{ padding: '3px', width: '22px', height: '22px', justifyContent: 'center' }}
          title="Collapse Intelligence Pane"
        >
          <ChevronRight size={12} />
        </button>
      </div>

      {/* Tabs: [ AGENTS ] [ SOURCES ] [ SYSTEM ] */}
      <div style={{ padding: '8px 12px', borderBottom: '1px solid var(--border-subtle)' }}>
        <div className="segmented-tabs">
          <button
            onClick={() => setTab('agents')}
            className={`segmented-tab-btn ${currentTab === 'agents' ? 'active' : ''}`}
          >
            <span>AGENTS</span>
          </button>

          <button
            onClick={() => setTab('sources')}
            className={`segmented-tab-btn ${currentTab === 'sources' ? 'active' : ''}`}
          >
            <span>SOURCES</span>
            {sources.length > 0 && (
              <span style={{
                color: 'var(--accent-lemongrass)',
                fontSize: '9.5px',
                fontWeight: 700
              }}>
                ({sources.length})
              </span>
            )}
          </button>

          <button
            onClick={() => setTab('system')}
            className={`segmented-tab-btn ${currentTab === 'system' ? 'active' : ''}`}
          >
            <span>SYSTEM</span>
          </button>
        </div>
      </div>

      {/* Tab Content Container */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '12px 14px',
        fontSize: '12px'
      }}>
        {/* 1. AGENTS TAB */}
        {currentTab === 'agents' && (
          <div className="tab-panel-enter">
            <div style={{
              fontSize: '10px',
              fontFamily: 'var(--font-mono)',
              fontWeight: 600,
              color: 'var(--text-dim)',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              marginBottom: '8px'
            }}>
              AGENT PIPELINE
            </div>

            {/* Pipeline Stage List */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
              marginBottom: '16px'
            }}>
              {stages.map((st) => (
                <div
                  key={st.num}
                  style={{
                    background: 'var(--bg-surface)',
                    border: `1px solid ${st.status.isVerified ? 'rgba(182, 216, 58, 0.35)' : 'var(--border-subtle)'}`,
                    borderRadius: 'var(--radius-xs)',
                    padding: '8px 10px',
                    fontFamily: 'var(--font-mono)',
                    transition: 'border-color 0.25s ease, background 0.25s ease'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: 'var(--text-main)', fontWeight: 600 }}>
                      <span style={{ color: 'var(--text-dim)' }}>{st.num}</span>
                      <span>{st.name}</span>
                    </div>

                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      fontSize: '10px',
                      color: st.status.color,
                      transition: 'color 0.25s ease'
                    }}>
                      {st.status.isRunning ? (
                        <span className="anim-agent-running">{st.status.symbol}</span>
                      ) : st.status.isComplete ? (
                        <span className="anim-checkmark-pop">{st.status.symbol}</span>
                      ) : (
                        <span>{st.status.symbol}</span>
                      )}
                      <span>{st.status.label}</span>
                    </div>
                  </div>

                  <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                    {st.desc}
                  </div>
                </div>
              ))}
            </div>

            {/* High-level Task Stages (Safe execution, no raw CoT) */}
            {agentSteps && agentSteps.length > 0 && (
              <div style={{ marginBottom: '16px' }}>
                <div style={{
                  fontSize: '10px',
                  fontFamily: 'var(--font-mono)',
                  fontWeight: 600,
                  color: 'var(--text-dim)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  marginBottom: '6px'
                }}>
                  TASK STAGES
                </div>
                {agentSteps.map((st, sIdx) => (
                  <div
                    key={sIdx}
                    className="anim-stagger-item"
                    style={{
                      background: 'var(--bg-surface)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-xs)',
                      padding: '6px 10px',
                      marginBottom: '4px',
                      fontFamily: 'var(--font-mono)',
                      animationDelay: `${sIdx * 45}ms`
                    }}
                  >
                    <div style={{ color: 'var(--text-main)', fontWeight: 600, fontSize: '11px' }}>
                      Stage {st.step}: {st.title}
                    </div>
                    {st.description && (
                      <div style={{ color: 'var(--text-muted)', fontSize: '10px', marginTop: '1px' }}>
                        {st.description}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Interleaved Tool Calls */}
            {toolCalls && toolCalls.length > 0 && (
              <div>
                <div style={{
                  fontSize: '10px',
                  fontFamily: 'var(--font-mono)',
                  fontWeight: 600,
                  color: 'var(--text-dim)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  marginBottom: '6px'
                }}>
                  ACTIVE TOOLS
                </div>
                {toolCalls.map((tc, idx) => (
                  <div
                    key={idx}
                    className="anim-stagger-item"
                    style={{
                      background: 'var(--bg-surface)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-xs)',
                      marginBottom: '4px',
                      overflow: 'hidden',
                      fontFamily: 'var(--font-mono)',
                      animationDelay: `${idx * 45}ms`
                    }}
                  >
                    <div
                      onClick={() => toggleToolCollapse(idx)}
                      style={{
                        padding: '6px 10px',
                        cursor: 'pointer',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Wrench size={11} style={{ color: 'var(--accent-lemongrass)' }} />
                        <span style={{ color: 'var(--text-secondary)', fontSize: '11px', fontWeight: 600 }}>{tc.tool}</span>
                      </div>
                      <span style={{
                        fontSize: '9px',
                        color: 'var(--text-dim)'
                      }}>
                        {tc.status?.toUpperCase() || 'DONE'}
                      </span>
                    </div>
                    {!expandedTools[idx] && tc.result && (
                      <div style={{ padding: '6px 10px', fontSize: '10px', color: 'var(--text-muted)', borderTop: '1px solid var(--border-subtle)', background: 'rgba(0,0,0,0.2)' }}>
                        {tc.result.substring(0, 90)}...
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 2. SOURCES TAB */}
        {currentTab === 'sources' && (
          <div className="tab-panel-enter">
            <div style={{
              fontSize: '10px',
              fontFamily: 'var(--font-mono)',
              fontWeight: 600,
              color: 'var(--text-dim)',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              marginBottom: '8px'
            }}>
              GROUNDING SOURCES
            </div>

            {sources.length === 0 ? (
              <div style={{
                color: 'var(--text-dim)',
                textAlign: 'center',
                padding: '32px 14px',
                lineHeight: 1.5,
                fontSize: '11.5px'
              }}>
                No citations active. Formulate an engineering query in the center workspace to retrieve verified document evidence.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {sources.map((src, idx) => (
                  <div
                    key={idx}
                    onClick={() => onSelectSource && onSelectSource(src)}
                    className="technical-row anim-evidence-item"
                    style={{
                      flexDirection: 'column',
                      alignItems: 'flex-start',
                      gap: '4px',
                      padding: '10px 12px',
                      animationDelay: `${idx * 50}ms`
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                      <span style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: '10px',
                        color: 'var(--text-dim)',
                        fontWeight: 600
                      }}>
                        [{String(idx + 1).padStart(2, '0')}]
                      </span>
                      <span style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: '9.5px',
                        color: 'var(--text-secondary)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '3px'
                      }}>
                        Page {src.page} <ArrowUpRight size={10} style={{ color: 'var(--text-muted)' }} />
                      </span>
                    </div>

                    <div style={{ color: 'var(--text-main)', fontWeight: 600, fontSize: '11.5px' }}>
                      {src.documentName}
                    </div>

                    {src.section && (
                      <div style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>
                        {src.section}
                      </div>
                    )}

                    {src.snippet && (
                      <div style={{
                        marginTop: '4px',
                        padding: '4px 6px',
                        background: 'rgba(0, 0, 0, 0.3)',
                        borderLeft: '2px solid var(--border-medium)',
                        fontSize: '10px',
                        color: 'var(--text-secondary)',
                        lineHeight: 1.4
                      }}>
                        &ldquo;{src.snippet}&rdquo;
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 3. SYSTEM TAB */}
        {currentTab === 'system' && (
          <div className="tab-panel-enter">
            <div style={{
              fontSize: '10px',
              fontFamily: 'var(--font-mono)',
              fontWeight: 600,
              color: 'var(--text-dim)',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              marginBottom: '8px'
            }}>
              LOCAL INFRASTRUCTURE
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div style={{
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-xs)',
                padding: '10px 12px',
                fontFamily: 'var(--font-mono)'
              }}>
                <div style={{ fontSize: '9.5px', color: 'var(--text-dim)' }}>NETWORK</div>
                <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-main)', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span className="pulse-dot" style={{ width: '5px', height: '5px' }} />
                  <span>AIR-GAPPED ●</span>
                </div>
              </div>

              <div style={{
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-xs)',
                padding: '10px 12px',
                fontFamily: 'var(--font-mono)'
              }}>
                <div style={{ fontSize: '9.5px', color: 'var(--text-dim)' }}>MODEL</div>
                <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-main)', marginTop: '2px' }}>
                  LOCAL / {activeModel.toUpperCase()}
                </div>
              </div>

              <div style={{
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-xs)',
                padding: '10px 12px',
                fontFamily: 'var(--font-mono)'
              }}>
                <div style={{ fontSize: '9.5px', color: 'var(--text-dim)' }}>PAGEINDEX</div>
                <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--accent-lemongrass)', marginTop: '2px' }}>
                  READY ●
                </div>
              </div>

              <div style={{
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-xs)',
                padding: '10px 12px',
                fontFamily: 'var(--font-mono)'
              }}>
                <div style={{ fontSize: '9.5px', color: 'var(--text-dim)' }}>AGENTS</div>
                <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-main)', marginTop: '2px' }}>
                  3 ACTIVE
                </div>
              </div>

              <div style={{
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-xs)',
                padding: '10px 12px'
              }}>
                <DitherProgress value={68} totalBlocks={18} label="GPU ALLOCATION" statusText="68% LOAD" />
              </div>

              <div style={{
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-xs)',
                padding: '10px 12px'
              }}>
                <DitherProgress value={70} totalBlocks={18} label="VRAM RESIDENCY" statusText="4.2 / 6.0 GB" />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
