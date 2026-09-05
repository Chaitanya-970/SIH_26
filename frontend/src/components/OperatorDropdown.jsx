import React from 'react';
import { Check } from 'lucide-react';

/**
 * Team / Operator configuration for local hackathon demo
 */
export const OPERATORS = [
  { id: 'chaitanya', name: 'Chaitanya', role: 'Agent Systems', initials: 'CH' },
  { id: 'mohak', name: 'Mohak', role: 'Agent Systems', initials: 'MO' },
  { id: 'anwesha', name: 'Anwesha', role: 'Frontend & UI', initials: 'AN' },
  { id: 'aryan', name: 'Aryan', role: 'RAG & Retrieval', initials: 'AR' },
  { id: 'vedant', name: 'Vedant', role: 'Infrastructure & Docker', initials: 'VE' },
  { id: 'vardaan', name: 'Vardaan', role: 'Research & Documentation', initials: 'VA' }
];

/**
 * OperatorDropdown - Compact profile & operator switcher popover
 * Anchored directly below the top-right navbar operator button.
 */
export default function OperatorDropdown({
  isOpen,
  onClose,
  currentOperator,
  operators = OPERATORS,
  onSelectOperator
}) {
  if (!isOpen) return null;

  return (
    <div
      className="anim-dropdown"
      style={{
        position: 'absolute',
        top: 'calc(100% + 6px)',
        right: 0,
        width: '275px',
        background: 'var(--bg-panel)',
        border: '1px solid var(--border-medium)',
        borderRadius: 'var(--radius-xs)',
        boxShadow: 'var(--shadow-lg)',
        zIndex: 1000,
        overflow: 'hidden'
      }}
    >
      {/* 1. Header Section */}
      <div style={{ padding: '12px 14px 10px', background: 'rgba(255, 255, 255, 0.01)' }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '8px'
        }}>
          <span style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '9px',
            color: 'var(--text-dim)',
            letterSpacing: '0.08em',
            textTransform: 'uppercase'
          }}>
            CITADEL WORKSPACE
          </span>
          <span style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '9px',
            color: 'var(--text-dim)',
            letterSpacing: '0.06em',
            textTransform: 'uppercase'
          }}>
            OPERATOR PROFILE
          </span>
        </div>

        {/* Current Active Operator Card */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          padding: '8px 10px',
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-xs)'
        }}>
          <div style={{
            width: '28px',
            height: '28px',
            borderRadius: 'var(--radius-xs)',
            background: 'rgba(182, 216, 58, 0.08)',
            border: '1px solid rgba(182, 216, 58, 0.28)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--accent-lemongrass)',
            fontFamily: 'var(--font-mono)',
            fontSize: '11px',
            fontWeight: 700,
            flexShrink: 0
          }}>
            {currentOperator?.initials || currentOperator?.name?.[0] || 'CH'}
          </div>
          <div style={{ overflow: 'hidden' }}>
            <div style={{
              fontSize: '12.5px',
              fontWeight: 600,
              color: 'var(--text-main)',
              lineHeight: 1.2
            }}>
              {currentOperator?.name || 'Chaitanya'}
            </div>
            <div style={{
              fontSize: '11px',
              color: 'var(--text-secondary)',
              marginTop: '2px',
              fontFamily: 'var(--font-ui)'
            }}>
              {currentOperator?.role || 'Agent Systems'}
            </div>
          </div>
        </div>
      </div>

      {/* Divider */}
      <div style={{ height: '1px', background: 'var(--border-subtle)' }} />

      {/* 2. Switch Operator List */}
      <div style={{ padding: '8px 8px 6px' }}>
        <div style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '9.5px',
          fontWeight: 600,
          color: 'var(--text-dim)',
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          padding: '4px 6px 6px'
        }}>
          SWITCH OPERATOR
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          {operators.map((op) => {
            const isSelected = op.id === currentOperator?.id || op.name === currentOperator?.name;
            return (
              <div
                key={op.id}
                onClick={() => {
                  onSelectOperator(op);
                  onClose();
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '6px 8px',
                  borderRadius: 'var(--radius-xs)',
                  cursor: 'pointer',
                  background: isSelected ? 'var(--bg-surface)' : 'transparent',
                  border: isSelected ? '1px solid var(--border-medium)' : '1px solid transparent',
                  transition: 'background 0.12s ease, border-color 0.12s ease'
                }}
                onMouseEnter={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.background = 'var(--bg-elevated)';
                    e.currentTarget.style.borderColor = 'var(--border-subtle)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.borderColor = 'transparent';
                  }
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
                  <div style={{
                    width: '22px',
                    height: '22px',
                    borderRadius: 'var(--radius-xs)',
                    background: isSelected ? 'rgba(182, 216, 58, 0.08)' : 'var(--bg-elevated)',
                    border: isSelected ? '1px solid rgba(182, 216, 58, 0.3)' : '1px solid var(--border-subtle)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: isSelected ? 'var(--accent-lemongrass)' : 'var(--text-secondary)',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '9.5px',
                    fontWeight: 700,
                    flexShrink: 0
                  }}>
                    {op.initials}
                  </div>
                  <div>
                    <div style={{
                      fontSize: '12px',
                      fontWeight: isSelected ? 600 : 500,
                      color: isSelected ? 'var(--text-main)' : 'var(--text-secondary)',
                      lineHeight: 1.2
                    }}>
                      {op.name}
                    </div>
                    <div style={{
                      fontSize: '10.5px',
                      color: 'var(--text-muted)',
                      marginTop: '1px'
                    }}>
                      {op.role}
                    </div>
                  </div>
                </div>

                {isSelected && (
                  <Check size={13} className="anim-checkmark-pop" style={{ color: 'var(--accent-lemongrass)', flexShrink: 0 }} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Divider */}
      <div style={{ height: '1px', background: 'var(--border-subtle)' }} />

      {/* 3. Footer */}
      <div style={{
        padding: '7px 14px',
        background: 'rgba(0, 0, 0, 0.25)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        fontFamily: 'var(--font-mono)',
        fontSize: '9.5px',
        color: 'var(--text-dim)'
      }}>
        <span>DEMO ENVIRONMENT</span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', color: 'var(--text-secondary)' }}>
          <span className="pulse-dot" style={{ width: '4px', height: '4px' }} />
          <span>LOCAL</span>
        </span>
      </div>
    </div>
  );
}
