import React from 'react';

/**
 * ArchitectureSchematic - Technical Local Intelligence Architecture Visualization
 * Represents the sovereign engineering dataflow:
 * DOCUMENTS -> PAGEINDEX -> AGENT ROUTER -> [DOC | VISION | DATA] -> VERIFIER -> LOCAL LLM
 * Features crisp engineering schematic layout with subtle status signals.
 */
export default function ArchitectureSchematic() {
  return (
    <div style={{
      background: 'var(--bg-panel)',
      border: '1px solid var(--border-medium)',
      borderRadius: 'var(--radius-xs)',
      padding: '16px 20px',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      fontFamily: 'var(--font-mono)',
      userSelect: 'none',
      height: '100%'
    }}>
      {/* Schematic Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottom: '1px solid var(--border-subtle)',
        paddingBottom: '8px',
        marginBottom: '12px'
      }}>
        <div style={{
          fontSize: '10.5px',
          fontWeight: 600,
          color: 'var(--text-dim)',
          letterSpacing: '0.08em',
          textTransform: 'uppercase'
        }}>
          LOCAL INTELLIGENCE ARCHITECTURE
        </div>
        <div style={{
          fontSize: '10px',
          color: 'var(--accent-lemongrass)',
          display: 'flex',
          alignItems: 'center',
          gap: '5px'
        }}>
          <span className="pulse-dot" style={{ width: '5px', height: '5px' }} />
          <span>PIPELINE ACTIVE</span>
        </div>
      </div>

      {/* Schematic Flow Chart */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '4px',
        padding: '4px 0',
        fontSize: '11px'
      }}>
        {/* Node 1: DOCUMENTS */}
        <div style={{
          padding: '4px 16px',
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-xs)',
          color: 'var(--text-main)',
          fontWeight: 600,
          letterSpacing: '0.06em'
        }}>
          DOCUMENTS
        </div>

        {/* Connector */}
        <div style={{ color: 'var(--text-dim)', fontSize: '11px', lineHeight: 1 }}>↓</div>

        {/* Node 2: PAGEINDEX */}
        <div style={{
          padding: '4px 18px',
          background: 'rgba(182, 216, 58, 0.08)',
          border: '1px solid rgba(182, 216, 58, 0.35)',
          borderRadius: 'var(--radius-xs)',
          color: 'var(--accent-lemongrass)',
          fontWeight: 600,
          letterSpacing: '0.06em'
        }}>
          PAGEINDEX
        </div>

        {/* Connector */}
        <div style={{ color: 'var(--text-dim)', fontSize: '11px', lineHeight: 1 }}>↓</div>

        {/* Node 3: AGENT ROUTER */}
        <div style={{
          padding: '4px 16px',
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-medium)',
          borderRadius: 'var(--radius-xs)',
          color: 'var(--text-main)',
          fontWeight: 600,
          letterSpacing: '0.06em'
        }}>
          AGENT ROUTER
        </div>

        {/* Fan-Out Connectors */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          width: '210px',
          color: 'var(--text-dim)',
          fontSize: '10px',
          lineHeight: 1,
          padding: '0 12px'
        }}>
          <span>/</span>
          <span>|</span>
          <span>\</span>
        </div>

        {/* Multi-Agent Capabilities (DOC / VISION / DATA) */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '6px',
          width: '100%',
          maxWidth: '240px'
        }}>
          <div style={{
            padding: '3px 4px',
            textAlign: 'center',
            background: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-xs)',
            fontSize: '9.5px',
            color: 'var(--text-secondary)'
          }}>
            DOC
          </div>
          <div style={{
            padding: '3px 4px',
            textAlign: 'center',
            background: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-xs)',
            fontSize: '9.5px',
            color: 'var(--text-secondary)'
          }}>
            VISION
          </div>
          <div style={{
            padding: '3px 4px',
            textAlign: 'center',
            background: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-xs)',
            fontSize: '9.5px',
            color: 'var(--text-secondary)'
          }}>
            DATA
          </div>
        </div>

        {/* Fan-In Connectors */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          width: '210px',
          color: 'var(--text-dim)',
          fontSize: '10px',
          lineHeight: 1,
          padding: '0 12px'
        }}>
          <span>\</span>
          <span>|</span>
          <span>/</span>
        </div>

        {/* Node 4: VERIFIER */}
        <div style={{
          padding: '4px 18px',
          background: 'rgba(197, 168, 90, 0.08)',
          border: '1px solid rgba(197, 168, 90, 0.35)',
          borderRadius: 'var(--radius-xs)',
          color: 'var(--accent-amber)',
          fontWeight: 600,
          letterSpacing: '0.06em'
        }}>
          VERIFIER
        </div>

        {/* Connector */}
        <div style={{ color: 'var(--text-dim)', fontSize: '11px', lineHeight: 1 }}>↓</div>

        {/* Node 5: LOCAL LLM */}
        <div style={{
          padding: '4px 16px',
          background: 'var(--bg-elevated)',
          border: '1px solid var(--border-medium)',
          borderRadius: 'var(--radius-xs)',
          color: 'var(--text-main)',
          fontWeight: 600,
          letterSpacing: '0.06em'
        }}>
          LOCAL LLM
        </div>
      </div>

      {/* Small System States Strip */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderTop: '1px solid var(--border-subtle)',
        paddingTop: '10px',
        marginTop: '8px',
        fontSize: '10px',
        color: 'var(--text-dim)'
      }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <span className="pulse-dot" style={{ width: '4px', height: '4px', background: 'var(--accent-lemongrass)' }} />
          <span style={{ color: 'var(--text-secondary)' }}>AIR-GAPPED</span>
        </span>
        <span style={{ color: 'var(--border-subtle)' }}>·</span>
        <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <span className="pulse-dot" style={{ width: '4px', height: '4px', background: 'var(--accent-lemongrass)' }} />
          <span style={{ color: 'var(--text-secondary)' }}>LOCAL INFERENCE</span>
        </span>
        <span style={{ color: 'var(--border-subtle)' }}>·</span>
        <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <span className="pulse-dot" style={{ width: '4px', height: '4px', background: 'var(--accent-lemongrass)' }} />
          <span style={{ color: 'var(--accent-lemongrass)', fontWeight: 600 }}>INDEX READY</span>
        </span>
      </div>
    </div>
  );
}
