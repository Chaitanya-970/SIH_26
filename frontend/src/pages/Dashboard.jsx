import React, { useState, useEffect } from 'react';
import { RECENT_WORK_ITEMS } from '../services/mockData';
import FloatingLines from '../components/FloatingLines';
import WireframeBall from '../components/WireframeBall';
import {
  ArrowRight,
  ArrowUpRight,
  Database,
  Cpu,
  ChevronRight
} from 'lucide-react';
import Footer from '../components/Footer';

/**
 * Dashboard - Industrial Engineering Working Environment
 * Features:
 * - Animated FloatingLines subtle background from React Bits
 * - Animated WireframeBall 3D rotating network polyhedron in muted acid lime (#b6d83a)
 * - Row-based Recent Analysis with direct workspace resumption
 * - Compact System & Knowledge telemetry
 */

// Stable module constants to prevent unnecessary WebGL canvas re-renders
const FLOATING_LINES_WAVES = ['top', 'bottom'];
const FLOATING_LINES_COUNT = [10, 15, 20];
const FLOATING_LINES_DISTANCE = [8, 6, 4];
const FLOATING_LINES_GRADIENT = ['#1e293b', '#334155', '#b6d83a'];

export default function Dashboard({
  user,
  onNavigate,
  onNewQuery,
  onOpenWorkspace,
  onOpenKnowledge,
  onSelectRecentWork
}) {
  const userName = user?.name || 'Chaitanya';

  // Dynamic Live Timestamp
  const [currentDateTime, setCurrentDateTime] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const monthNames = [
        'JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE',
        'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER'
      ];
      const month = monthNames[now.getMonth()];
      const day = String(now.getDate()).padStart(2, '0');
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      setCurrentDateTime(`${month} ${day} · ${hours}:${minutes}`);
    };

    updateTime();
    const timer = setInterval(updateTime, 10000);
    return () => clearInterval(timer);
  }, []);

  // Category breakdown for Knowledge Index
  const knowledgeCategories = [
    { label: 'Engineering', count: 82 },
    { label: 'Operations', count: 94 },
    { label: 'Incidents', count: 31 },
    { label: 'Safety', count: 40 }
  ];

  // Helper for semantic status rendering
  const renderStatus = (status) => {
    switch (status) {
      case 'VERIFIED':
        return (
          <span style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '10px',
            color: 'var(--accent-lemongrass)',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px'
          }}>
            <span>Verified</span>
            <span className="pulse-dot anim-checkmark-pop" style={{ width: '4px', height: '4px' }} />
          </span>
        );
      case 'RUNNING':
        return (
          <span style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '10px',
            color: 'var(--status-cyan)',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px'
          }}>
            <span>Running</span>
            <span className="anim-agent-running">◌</span>
          </span>
        );
      case 'FAILED':
        return (
          <span style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '10px',
            color: 'var(--status-rose)',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px'
          }}>
            <span>Failed</span>
            <span>×</span>
          </span>
        );
      case 'COMPLETED':
      default:
        return (
          <span style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '10px',
            color: 'var(--text-secondary)',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px'
          }}>
            <span>Completed</span>
            <span className="anim-checkmark-pop">✓</span>
          </span>
        );
    }
  };

  return (
    <div style={{
      height: 'calc(100vh - 52px)',
      overflowY: 'auto',
      background: 'var(--bg-dark)',
      padding: '28px 36px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      position: 'relative'
    }}>
      {/* Background Ambient Three.js Floating Lines */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        opacity: 0.32,
        zIndex: 0,
        overflow: 'hidden'
      }}>
        <FloatingLines
          enabledWaves={FLOATING_LINES_WAVES}
          lineCount={FLOATING_LINES_COUNT}
          lineDistance={FLOATING_LINES_DISTANCE}
          bendRadius={5.0}
          bendStrength={-0.5}
          interactive={false}
          parallax={true}
          linesGradient={FLOATING_LINES_GRADIENT}
          animationSpeed={0.8}
        />
      </div>

      {/* Content Container */}
      <div style={{ width: '100%', maxWidth: '1100px', position: 'relative', zIndex: 1 }}>

        {/* 1. HEADER & QUICK ACTIONS STRIP */}
        <div
          className="anim-fade-up"
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            marginBottom: '18px',
            gap: '24px'
          }}
        >
          {/* Left: Operational Header */}
          <div>
            <div style={{
              marginBottom: '4px',
              fontFamily: 'var(--font-mono)',
              fontSize: '11px',
              color: 'var(--text-dim)',
              letterSpacing: '0.08em',
              textTransform: 'uppercase'
            }}>
              <span style={{ color: 'var(--text-secondary)' }}>
                {currentDateTime || 'SEPTEMBER 05 · 18:30'}
              </span>
            </div>
            <h1 style={{
              fontFamily: 'var(--font-display)',
              fontSize: '24px',
              fontWeight: 700,
              color: 'var(--text-main)',
              letterSpacing: '-0.02em',
              lineHeight: 1.15
            }}>
              OPERATIONS CONSOLE
            </h1>

            <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>
              Welcome back, {userName}.
            </div>
          </div>
        </div>

        {/* Divider */}
        <hr style={{ border: 'none', borderTop: '1px solid var(--border-subtle)', marginBottom: '20px' }} />

        {/* 2. UPPER SECTION: Unified Full-Width Engineering Query Bay */}
        <div
          className="query-bay-card anim-hero-enter"
          onClick={onNewQuery}
        >
          {/* Left: Left-Aligned Engineering Query Action */}
          <div style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start',
            textAlign: 'left'
          }}>
            <div style={{
              fontFamily: 'var(--font-display)',
              fontSize: '20px',
              fontWeight: 700,
              color: 'var(--text-main)',
              letterSpacing: '-0.01em',
              marginBottom: '8px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <span>+ New Engineering Query</span>
              <ArrowUpRight size={18} style={{ color: 'var(--accent-lemongrass)' }} />
            </div>

            <p style={{
              fontSize: '13px',
              color: 'var(--text-secondary)',
              lineHeight: 1.55,
              marginBottom: '16px',
              maxWidth: '560px',
              textAlign: 'left'
            }}>
              Formulate tasks, search equipment operating limits, and verify incident logs across your indexed repository.
            </p>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '14px',
              borderTop: '1px solid var(--border-subtle)',
              paddingTop: '12px',
              width: '100%',
              maxWidth: '560px'
            }}>
              <button
                className="btn-modern"
                style={{
                  padding: '5px 12px',
                  fontSize: '11.5px',
                  color: 'var(--text-main)'
                }}
              >
                <span>Open Terminal</span>
                <ArrowRight size={12} style={{ color: 'var(--accent-lemongrass)' }} />
              </button>
              <span style={{ fontSize: '11px', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>
                Press to open workspace terminal
              </span>
            </div>
          </div>

          {/* Right: Subdued Ambient 3D Network Ball with CSS-driven hover brightening */}
          <div className="wireframe-ball-container">
            <WireframeBall
              color="#98b934"
              secondaryColor="#62781e"
              size={150}
              speed={0.8}
              opacity={0.38}
            />
          </div>
        </div>

        {/* 3. RECENT ANALYSIS (Major Rows Section) */}
        <div className="anim-fade-up" style={{ marginBottom: '26px', animationDelay: '80ms' }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '10px',
            borderBottom: '1px solid var(--border-subtle)',
            paddingBottom: '8px'
          }}>
            <div className="section-label">
              <span>Recent Analysis</span>
            </div>

            <button
              onClick={onOpenWorkspace}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-secondary)',
                fontFamily: 'var(--font-mono)',
                fontSize: '11px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              <span>View all in Workspace</span>
              <ArrowRight size={11} />
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {RECENT_WORK_ITEMS.map((item, idx) => (
              <div
                key={item.id}
                onClick={() => onSelectRecentWork(item)}
                className="technical-row anim-stagger-item"
                style={{
                  padding: '12px 16px',
                  animationDelay: `${idx * 50}ms`
                }}
              >
                {/* Left: ID & Title & Query */}
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px', flex: 1, minWidth: 0 }}>
                  <span style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '12px',
                    fontWeight: 700,
                    color: 'var(--text-dim)',
                    marginTop: '2px'
                  }}>
                    {item.num}
                  </span>

                  <div style={{ minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '2px' }}>
                      <span style={{
                        fontFamily: 'var(--font-display)',
                        fontSize: '13.5px',
                        fontWeight: 600,
                        color: 'var(--text-main)'
                      }}>
                        {item.title}
                      </span>
                    </div>

                    <div style={{
                      fontSize: '12px',
                      color: 'var(--text-secondary)',
                      fontStyle: 'italic',
                      marginBottom: '4px',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      maxWidth: '560px'
                    }}>
                      &ldquo;{item.query}&rdquo;
                    </div>

                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      fontSize: '10.5px',
                      fontFamily: 'var(--font-mono)',
                      color: 'var(--text-dim)'
                    }}>
                      <span>Document Index</span>
                      <span>·</span>
                      <span>{item.sources?.length || 1} sources</span>
                      <span>·</span>
                      {renderStatus(item.status)}
                    </div>
                  </div>
                </div>

                {/* Right: Time & Action */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  marginLeft: '16px',
                  flexShrink: 0
                }}>
                  <span style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '11px',
                    color: 'var(--text-dim)'
                  }}>
                    {item.meta.split('·')[2]?.trim() || item.meta}
                  </span>

                  <ChevronRight size={14} style={{ color: 'var(--text-dim)' }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 4. SYSTEM / KNOWLEDGE SUMMARY (Compact Information Blocks) */}
        <div
          className="anim-fade-up"
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '16px',
            marginBottom: '28px',
            animationDelay: '180ms'
          }}
        >
          {/* Block 1: KNOWLEDGE INDEX */}
          <div style={{
            background: 'var(--bg-panel)',
            border: '1px solid var(--border-medium)',
            borderRadius: 'var(--radius-xs)',
            padding: '16px 20px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between'
          }}>
            <div>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '12px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-main)', fontWeight: 600, fontSize: '12.5px' }}>
                  <Database size={14} style={{ color: 'var(--text-dim)' }} />
                  <span>Knowledge Index</span>
                </div>
                <span style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '10px',
                  color: 'var(--accent-lemongrass)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}>
                  <span className="pulse-dot" style={{ width: '4px', height: '4px' }} />
                  <span>Index Ready</span>
                </span>
              </div>

              {/* Numbers */}
              <div style={{ display: 'flex', gap: '24px', marginBottom: '12px' }}>
                <div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '18px', fontWeight: 700, color: 'var(--text-main)' }}>
                    247
                  </div>
                  <div style={{ fontSize: '10px', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>
                    Documents
                  </div>
                </div>
                <div style={{ borderLeft: '1px solid var(--border-subtle)', paddingLeft: '20px' }}>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '18px', fontWeight: 700, color: 'var(--text-main)' }}>
                    12,482
                  </div>
                  <div style={{ fontSize: '10px', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>
                    Pages Indexed
                  </div>
                </div>
              </div>

              {/* Category Breakdown */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: '6px',
                fontFamily: 'var(--font-mono)',
                fontSize: '10.5px',
                padding: '6px 8px',
                background: 'rgba(0, 0, 0, 0.3)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-xs)',
                marginBottom: '12px'
              }}>
                {knowledgeCategories.map((cat) => (
                  <div key={cat.label} style={{ textAlign: 'center' }}>
                    <div style={{ color: 'var(--text-dim)', fontSize: '9.5px' }}>{cat.label}</div>
                    <div style={{ color: 'var(--text-main)', fontWeight: 600 }}>{cat.count}</div>
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={onOpenKnowledge}
              className="btn-modern"
              style={{
                width: '100%',
                justifyContent: 'center',
                padding: '6px 12px',
                fontSize: '11.5px'
              }}
            >
              <span>Browse Knowledge Base</span>
              <ChevronRight size={12} />
            </button>
          </div>

          {/* Block 2: SYSTEM INFORMATION */}
          <div style={{
            background: 'var(--bg-panel)',
            border: '1px solid var(--border-medium)',
            borderRadius: 'var(--radius-xs)',
            padding: '16px 20px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between'
          }}>
            <div>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '12px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-main)', fontWeight: 600, fontSize: '12.5px' }}>
                  <Cpu size={14} style={{ color: 'var(--text-dim)' }} />
                  <span>System Telemetry</span>
                </div>
                <span style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '10px',
                  color: 'var(--text-dim)'
                }}>
                  Local Telemetry
                </span>
              </div>

              {/* Status List */}
              <div style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '11px',
                display: 'flex',
                flexDirection: 'column',
                gap: '7px',
                padding: '8px 10px',
                background: 'rgba(0, 0, 0, 0.3)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-xs)',
                marginBottom: '12px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: 'var(--text-dim)' }}>Local Model</span>
                  <span style={{ color: 'var(--text-main)' }}>Phi-3.5 (3.8B)</span>
                  <span style={{ color: 'var(--accent-lemongrass)', fontSize: '10px' }}>● Ready</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: 'var(--text-dim)' }}>Agents</span>
                  <span style={{ color: 'var(--text-main)' }}>3 Active</span>
                  <span style={{ color: 'var(--accent-lemongrass)', fontSize: '10px' }}>● Ready</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: 'var(--text-dim)' }}>Inference</span>
                  <span style={{ color: 'var(--text-main)' }}>Local IPC</span>
                  <span style={{ color: 'var(--accent-lemongrass)', fontSize: '10px' }}>● Online</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: 'var(--text-dim)' }}>Network</span>
                  <span style={{ color: 'var(--text-main)' }}>Air-gapped</span>
                  <span style={{ color: 'var(--accent-lemongrass)', fontSize: '10px' }}>● Enforced</span>
                </div>
              </div>
            </div>

            <button
              onClick={onOpenWorkspace}
              className="btn-modern"
              style={{
                width: '100%',
                justifyContent: 'center',
                padding: '6px 12px',
                fontSize: '11.5px'
              }}
            >
              <span>Open Workspace</span>
              <ChevronRight size={12} />
            </button>
          </div>
        </div>

        {/* 5. COMPACT INDUSTRIAL FOOTER */}
        <Footer onNavigate={onNavigate || ((page) => {
          if (page === 'workspace') onOpenWorkspace && onOpenWorkspace();
          else if (page === 'kb') onOpenKnowledge && onOpenKnowledge();
        })} />

      </div>
    </div>
  );
}
