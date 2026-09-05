import React from 'react';

/**
 * SystemStatusBox - Modern telemetry status banner
 */
export default function SystemStatusBox({
  modelName = 'QWEN-2.5 / PHI-3.5',
  vramUsage = '4.7 / 6.0 GB',
  networkStatus = 'AIR-GAPPED (0 EGRESS)',
  ragStatus = 'CHROMADB / 768-DIM READY',
  compact = false
}) {
  if (compact) {
    return (
      <div style={{
        fontFamily: 'var(--font-mono)',
        fontSize: '11px',
        color: 'var(--text-muted)',
        background: 'rgba(255, 255, 255, 0.03)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-md)',
        padding: '6px 14px',
        display: 'flex',
        alignItems: 'center',
        gap: '14px',
        whiteSpace: 'nowrap',
        overflowX: 'auto'
      }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <span className="pulse-dot" style={{ width: '5px', height: '5px' }} />
          <span>LOCAL: <strong style={{ color: '#fff' }}>ONLINE</strong></span>
        </span>
        <span style={{ color: 'var(--border-subtle)' }}>|</span>
        <span>MODEL: <strong style={{ color: '#fff' }}>{modelName}</strong></span>
        <span style={{ color: 'var(--border-subtle)' }}>|</span>
        <span>VRAM: <strong style={{ color: '#fff' }}>{vramUsage}</strong></span>
        <span style={{ color: 'var(--border-subtle)' }}>|</span>
        <span>NETWORK: <strong style={{ color: '#fff' }}>{networkStatus}</strong></span>
      </div>
    );
  }

  return (
    <div className="modern-card" style={{ padding: '14px 18px' }}>
      <div style={{ fontSize: '10.5px', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>
        SYSTEM STATUS // CITADEL SOVEREIGN WORKBENCH
      </div>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11.5px', lineHeight: '1.6', color: 'var(--text-secondary)' }}>
        <div>LOCAL CLUSTER: <strong style={{ color: '#fff' }}>ONLINE (UNIX LOOPBACK)</strong></div>
        <div>ACTIVE MODEL: <strong style={{ color: '#fff' }}>{modelName}</strong></div>
        <div>VRAM POOL: <strong style={{ color: '#fff' }}>{vramUsage}</strong></div>
        <div>EXTERNAL NET: <strong style={{ color: '#fff' }}>{networkStatus}</strong></div>
        <div>VECTOR RAG: <strong style={{ color: '#fff' }}>{ragStatus}</strong></div>
      </div>
    </div>
  );
}
