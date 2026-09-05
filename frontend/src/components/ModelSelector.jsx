import React, { useState, useEffect } from 'react';
import { fetchModels } from '../services/api';
import { Cpu, ChevronDown } from 'lucide-react';

/**
 * ModelSelector - Modern dynamic model selection control
 */
export default function ModelSelector({ selectedModel, onSelectModel, disabled = false }) {
  const [models, setModels] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    async function loadModels() {
      try {
        const data = await fetchModels();
        if (mounted) {
          setModels(data);
          setLoading(false);
        }
      } catch (err) {
        console.error('Failed to load models:', err);
        if (mounted) setLoading(false);
      }
    }
    loadModels();
    return () => { mounted = false; };
  }, []);

  return (
    <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        background: 'rgba(255, 255, 255, 0.04)',
        border: '1px solid var(--border-medium)',
        borderRadius: 'var(--radius-md)',
        padding: '0 10px 0 8px',
        height: '36px',
        color: 'var(--text-main)',
        fontSize: '11.5px',
        gap: '7px',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.06)'
      }}>
        <Cpu size={14} style={{ color: 'var(--accent-lemongrass)' }} />
        <span style={{ color: '#94a3b8', fontSize: '10.5px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
          MODEL:
        </span>

        <select
          value={selectedModel || 'auto'}
          onChange={(e) => onSelectModel(e.target.value)}
          disabled={disabled || loading}
          style={{
            background: 'transparent',
            border: 'none',
            color: 'var(--accent-lemongrass)',
            fontFamily: 'var(--font-mono)',
            fontSize: '11.5px',
            fontWeight: 600,
            cursor: disabled ? 'not-allowed' : 'pointer',
            outline: 'none',
            paddingRight: '6px'
          }}
        >
          <option value="auto" style={{ background: '#0f141d', color: '#fff' }}>
            Auto-Detect (Router Rules)
          </option>

          {models.map((m) => (
            <option key={m.key} value={m.key} style={{ background: '#0f141d', color: '#fff' }}>
              {m.name} ({m.capability?.toUpperCase() || 'LLM'})
            </option>
          ))}
        </select>

        <ChevronDown size={12} style={{ color: '#64748b', pointerEvents: 'none' }} />
      </div>
    </div>
  );
}
