import React from 'react';

/**
 * DitherProgress - Restful dither density meter component
 */
export default function DitherProgress({
  value = 50,          // 0 to 100
  totalBlocks = 24,
  label = '',
  statusText = '',
  accent = 'lemongrass', // 'lemongrass', 'cyan', 'amber'
  showPercent = true,
  dense = false
}) {
  const percent = Math.max(0, Math.min(100, value));
  const filledCount = Math.round((percent / 100) * totalBlocks);

  const filledChar = '█';
  const midChar = '▓';
  const lightChar = '░';

  // Construct functional dither string
  let filledStr = '';
  for (let i = 0; i < filledCount; i++) {
    filledStr += filledChar;
  }
  let midStr = '';
  if (filledCount < totalBlocks && (percent % (100 / totalBlocks) > 0)) {
    midStr = midChar;
  }
  let emptyStr = '';
  const remaining = totalBlocks - filledCount - (midStr ? 1 : 0);
  for (let i = 0; i < remaining; i++) {
    emptyStr += lightChar;
  }

  const getAccentColor = () => {
    switch (accent) {
      case 'cyan': return '#38bdf8';
      case 'amber': return '#f59e0b';
      case 'lemongrass':
      default: return 'var(--accent-lemongrass)';
    }
  };

  return (
    <div style={{ fontFamily: 'var(--font-mono)', fontSize: dense ? '11px' : '11.5px', margin: '4px 0' }}>
      {(label || statusText) && (
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          color: 'var(--text-dim)',
          fontSize: '10px',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          marginBottom: '3px'
        }}>
          <span>{label}</span>
          <span style={{ color: 'var(--text-secondary)' }}>{statusText || (showPercent ? `${Math.round(percent)}%` : '')}</span>
        </div>
      )}

      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
        letterSpacing: '0.02em',
        userSelect: 'none'
      }}>
        <span style={{ color: 'var(--text-dim)' }}>[</span>
        <span style={{ whiteSpace: 'pre' }}>
          <span style={{ color: getAccentColor() }}>{filledStr}{midStr}</span>
          <span style={{ color: 'rgba(255, 255, 255, 0.12)' }}>{emptyStr}</span>
        </span>
        <span style={{ color: 'var(--text-dim)' }}>]</span>
        {showPercent && !statusText && (
          <span style={{ fontSize: '10px', color: 'var(--text-dim)', marginLeft: '4px' }}>
            {Math.round(percent)}%
          </span>
        )}
      </div>
    </div>
  );
}

/**
 * Multi-layer Dither Matrix for Ingestion & Pipeline Transitions
 */
export function DitherMatrix({ stage = 'INGESTION' }) {
  return (
    <div style={{
      fontFamily: 'var(--font-mono)',
      fontSize: '11px',
      lineHeight: '1.2',
      color: 'var(--text-secondary)',
      background: 'rgba(0, 0, 0, 0.3)',
      padding: '8px 12px',
      borderRadius: 'var(--radius-sm)',
      border: '1px solid var(--border-subtle)'
    }}>
      <div style={{ fontSize: '10px', color: 'var(--text-dim)', marginBottom: '4px' }}>
        STAGE: {stage} // DENSITY MAPPING
      </div>
      <div style={{ color: 'var(--accent-lemongrass)' }}>████████████████████</div>
      <div style={{ color: 'var(--accent-lemongrass)' }}>████████<span style={{ color: 'rgba(255,255,255,0.1)' }}>░░░░░░░░░░░░</span></div>
      <div style={{ color: 'var(--accent-lemongrass)' }}>████<span style={{ color: 'rgba(255,255,255,0.1)' }}>░░░░░░░░░░░░░░░░</span></div>
      <div style={{ color: 'rgba(255, 255, 255, 0.2)' }}>██<span style={{ color: 'rgba(255,255,255,0.08)' }}>░░░░░░░░░░░░░░░░░░</span></div>
    </div>
  );
}
