import React, { useState, useEffect } from 'react';
import {
  Layers,
  X,
  ShieldCheck,
  Users,
  Info,
  BookOpen,
  HelpCircle,
  Lock
} from 'lucide-react';

/**
 * Team configuration for hackathon showcase
 */
const TEAM_MEMBERS = [
  { name: 'Anwesha', role: 'Frontend & UI', initials: 'AN' },
  { name: 'Aryan', role: 'RAG / Knowledge Systems', initials: 'AR' },
  { name: 'Chaitanya', role: 'Agent Systems', initials: 'CH' },
  { name: 'Mohak', role: 'Agent Systems', initials: 'MO' },
  { name: 'Vedant', role: 'Infrastructure / Docker', initials: 'VE' },
  { name: 'Vardaan', role: 'Research & Documentation', initials: 'VA' }
];

/**
 * Footer - Compact Industrial Footer for Citadel Workspace
 * Displays on Dashboard / Landing with Brand, Product/Resource Links,
 * Real-Time Air-Gapped System Status, and interactive Technical Modals.
 */
export default function Footer({ onNavigate }) {
  const [activeModal, setActiveModal] = useState(null); // 'team' | 'privacy' | 'about' | 'docs' | 'faqs' | null

  // Escape key handler to close modals
  useEffect(() => {
    if (!activeModal) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setActiveModal(null);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeModal]);

  return (
    <>
      <footer style={{
        width: '100%',
        marginTop: '36px',
        marginBottom: '12px',
        background: 'var(--bg-panel)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-xs)',
        padding: '24px 28px 16px',
        userSelect: 'none',
        position: 'relative'
      }}>
        {/* Main 4-Column Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1.4fr 1fr 1.1fr 1.3fr',
          gap: '32px',
          alignItems: 'start'
        }}>
          {/* 1. LEFT: BRAND */}
          <div>
            <div
              style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px', cursor: 'pointer' }}
              onClick={() => onNavigate && onNavigate('dashboard')}
              title="Citadel Workspace"
            >
              <div style={{
                width: '26px',
                height: '26px',
                borderRadius: 'var(--radius-xs)',
                background: 'rgba(182, 216, 58, 0.08)',
                border: '1px solid rgba(182, 216, 58, 0.28)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--accent-lemongrass)',
                flexShrink: 0
              }}>
                <Layers size={15} strokeWidth={2.2} />
              </div>
              <div style={{
                fontFamily: 'var(--font-display)',
                fontSize: '13px',
                fontWeight: 700,
                color: 'var(--text-main)',
                letterSpacing: '0.04em'
              }}>
                CITADEL WORKSPACE
              </div>
            </div>

            <div style={{
              fontSize: '11.5px',
              color: 'var(--text-secondary)',
              lineHeight: 1.4,
              marginBottom: '6px'
            }}>
              Sovereign Industrial AI
            </div>

            <div style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '10px',
              color: 'var(--text-dim)',
              letterSpacing: '0.06em'
            }}>
              MRPL // ON-PREMISE
            </div>
          </div>

          {/* 2. MIDDLE-LEFT: PRODUCT */}
          <div>
            <div style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '10px',
              fontWeight: 600,
              color: 'var(--text-dim)',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              marginBottom: '10px'
            }}>
              PRODUCT
            </div>

            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <li>
                <button
                  onClick={() => onNavigate && onNavigate('workspace')}
                  style={{
                    background: 'none',
                    border: 'none',
                    padding: 0,
                    fontFamily: 'var(--font-ui)',
                    fontSize: '12px',
                    color: 'var(--text-secondary)',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'color 0.12s ease'
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--text-main)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-secondary)'; }}
                >
                  Workspace
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate && onNavigate('kb')}
                  style={{
                    background: 'none',
                    border: 'none',
                    padding: 0,
                    fontFamily: 'var(--font-ui)',
                    fontSize: '12px',
                    color: 'var(--text-secondary)',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'color 0.12s ease'
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--text-main)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-secondary)'; }}
                >
                  Knowledge Base
                </button>
              </li>
              <li>
                <button
                  onClick={() => setActiveModal('about')}
                  style={{
                    background: 'none',
                    border: 'none',
                    padding: 0,
                    fontFamily: 'var(--font-ui)',
                    fontSize: '12px',
                    color: 'var(--text-secondary)',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'color 0.12s ease'
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--text-main)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-secondary)'; }}
                >
                  About
                </button>
              </li>
              <li>
                <button
                  onClick={() => setActiveModal('team')}
                  style={{
                    background: 'none',
                    border: 'none',
                    padding: 0,
                    fontFamily: 'var(--font-ui)',
                    fontSize: '12px',
                    color: 'var(--text-secondary)',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'color 0.12s ease'
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--text-main)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-secondary)'; }}
                >
                  Team
                </button>
              </li>
            </ul>
          </div>

          {/* 3. MIDDLE-RIGHT: RESOURCES */}
          <div>
            <div style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '10px',
              fontWeight: 600,
              color: 'var(--text-dim)',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              marginBottom: '10px'
            }}>
              RESOURCES
            </div>

            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <li>
                <button
                  onClick={() => setActiveModal('docs')}
                  style={{
                    background: 'none',
                    border: 'none',
                    padding: 0,
                    fontFamily: 'var(--font-ui)',
                    fontSize: '12px',
                    color: 'var(--text-secondary)',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'color 0.12s ease'
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--text-main)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-secondary)'; }}
                >
                  Documentation
                </button>
              </li>
              <li>
                <button
                  onClick={() => setActiveModal('faqs')}
                  style={{
                    background: 'none',
                    border: 'none',
                    padding: 0,
                    fontFamily: 'var(--font-ui)',
                    fontSize: '12px',
                    color: 'var(--text-secondary)',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'color 0.12s ease'
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--text-main)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-secondary)'; }}
                >
                  FAQs
                </button>
              </li>
              <li>
                <button
                  onClick={() => setActiveModal('privacy')}
                  style={{
                    background: 'none',
                    border: 'none',
                    padding: 0,
                    fontFamily: 'var(--font-ui)',
                    fontSize: '12px',
                    color: 'var(--text-secondary)',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'color 0.12s ease'
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--text-main)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-secondary)'; }}
                >
                  Privacy &amp; Security
                </button>
              </li>
            </ul>
          </div>

          {/* 4. RIGHT: SYSTEM STATUS */}
          <div>
            <div style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '10px',
              fontWeight: 600,
              color: 'var(--text-dim)',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              marginBottom: '10px'
            }}>
              SYSTEM
            </div>

            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
              fontFamily: 'var(--font-mono)',
              fontSize: '11px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)' }}>
                  <span className="pulse-dot" style={{ width: '4px', height: '4px' }} />
                  <span>LOCAL INFERENCE</span>
                </span>
                <span style={{ color: 'var(--accent-lemongrass)', fontWeight: 600 }}>READY</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)' }}>
                  <span className="pulse-dot" style={{ width: '4px', height: '4px' }} />
                  <span>DOCUMENT INDEX</span>
                </span>
                <span style={{ color: 'var(--accent-lemongrass)', fontWeight: 600 }}>READY</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)' }}>
                  <span className="pulse-dot" style={{ width: '4px', height: '4px' }} />
                  <span>NETWORK</span>
                </span>
                <span style={{ color: 'var(--accent-lemongrass)', fontWeight: 600 }}>AIR-GAPPED</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Sub-Bar */}
        <div style={{
          marginTop: '20px',
          paddingTop: '12px',
          borderTop: '1px solid var(--border-subtle)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontFamily: 'var(--font-mono)',
          fontSize: '10.5px',
          color: 'var(--text-dim)'
        }}>
          <div>
            &copy; 2026 CITADEL WORKSPACE
          </div>

          <div style={{ color: 'var(--text-muted)' }}>
            Sovereign by design.
          </div>
        </div>
      </footer>

      {/* ============================================================ */}
      {/* INTERACTIVE TECHNICAL MODALS */}
      {/* ============================================================ */}

      {/* 1. TEAM MODAL */}
      {activeModal === 'team' && (
        <ModalBackdrop onClose={() => setActiveModal(null)}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Users size={16} style={{ color: 'var(--accent-lemongrass)' }} />
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', fontWeight: 600, letterSpacing: '0.08em', color: 'var(--text-dim)', textTransform: 'uppercase' }}>
                CITADEL // PROJECT TEAM
              </span>
            </div>
            <CloseButton onClick={() => setActiveModal(null)} />
          </div>

          <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', marginBottom: '18px', lineHeight: 1.5 }}>
            Engineered for high-assurance, sovereign industrial operations during the SIH Hackathon.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
            {TEAM_MEMBERS.map((member) => (
              <div
                key={member.name}
                style={{
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-xs)',
                  padding: '10px 12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px'
                }}
              >
                <div style={{
                  width: '26px',
                  height: '26px',
                  borderRadius: 'var(--radius-xs)',
                  background: 'rgba(182, 216, 58, 0.08)',
                  border: '1px solid rgba(182, 216, 58, 0.28)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--accent-lemongrass)',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '10.5px',
                  fontWeight: 700,
                  flexShrink: 0
                }}>
                  {member.initials}
                </div>
                <div>
                  <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-main)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    {member.name}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '1px' }}>
                    {member.role}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ModalBackdrop>
      )}

      {/* 2. PRIVACY & SECURITY MODAL */}
      {activeModal === 'privacy' && (
        <ModalBackdrop onClose={() => setActiveModal(null)}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ShieldCheck size={16} style={{ color: 'var(--accent-lemongrass)' }} />
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', fontWeight: 600, letterSpacing: '0.08em', color: 'var(--text-dim)', textTransform: 'uppercase' }}>
                PRIVACY &amp; SECURITY GUARANTEES
              </span>
            </div>
            <CloseButton onClick={() => setActiveModal(null)} />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '12.5px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            <div style={{
              background: 'rgba(182, 216, 58, 0.05)',
              border: '1px solid rgba(182, 216, 58, 0.2)',
              borderRadius: 'var(--radius-xs)',
              padding: '12px 14px',
              display: 'flex',
              gap: '10px'
            }}>
              <Lock size={16} style={{ color: 'var(--accent-lemongrass)', flexShrink: 0, marginTop: '2px' }} />
              <div>
                <strong style={{ color: 'var(--text-main)' }}>100% Air-Gapped &amp; On-Premise Execution:</strong>
                <p style={{ margin: '4px 0 0', fontSize: '11.5px', color: 'var(--text-secondary)' }}>
                  All refinery manuals, operating limits, and incident records remain within local facility hardware. No telemetry or embeddings ever reach cloud providers.
                </p>
              </div>
            </div>

            <div>
              <strong style={{ color: 'var(--text-main)' }}>Zero External Dependencies:</strong>
              <p style={{ margin: '4px 0 0' }}>
                Inference runs over local Ollama IPC channels (`phi3.5:3.8b` / `granite3.2`). The PageIndex document hierarchy and vector store reside completely on internal disk.
              </p>
            </div>

            <div>
              <strong style={{ color: 'var(--text-main)' }}>Deterministic Sovereign Verification:</strong>
              <p style={{ margin: '4px 0 0' }}>
                Responses are cross-referenced with cryptographic citation bounds before display. Hallucinated engineering figures are rejected by the verification stage.
              </p>
            </div>
          </div>
        </ModalBackdrop>
      )}

      {/* 3. ABOUT MODAL */}
      {activeModal === 'about' && (
        <ModalBackdrop onClose={() => setActiveModal(null)}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Info size={16} style={{ color: 'var(--accent-lemongrass)' }} />
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', fontWeight: 600, letterSpacing: '0.08em', color: 'var(--text-dim)', textTransform: 'uppercase' }}>
                ABOUT CITADEL WORKSPACE
              </span>
            </div>
            <CloseButton onClick={() => setActiveModal(null)} />
          </div>

          <div style={{ fontSize: '12.5px', color: 'var(--text-secondary)', lineHeight: 1.6, display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <p style={{ margin: 0 }}>
              <strong style={{ color: 'var(--text-main)' }}>Citadel</strong> is a sovereign industrial intelligence console built for critical infrastructure, refineries, and continuous process plants.
            </p>
            <p style={{ margin: 0 }}>
              Unlike generic chatbot interfaces, Citadel pairs a 3-stage agentic orchestrator with deep <strong>PageIndex hierarchical tree traversal</strong> to deliver precise technical answers backed by page-level citations.
            </p>
            <div style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-xs)',
              padding: '10px 12px',
              fontFamily: 'var(--font-mono)',
              fontSize: '11px',
              display: 'flex',
              justifyContent: 'space-between'
            }}>
              <span style={{ color: 'var(--text-dim)' }}>TARGET DEPLOYMENT:</span>
              <span style={{ color: 'var(--accent-lemongrass)' }}>MANGALORE REFINERY &amp; PETROCHEMICALS (MRPL)</span>
            </div>
          </div>
        </ModalBackdrop>
      )}

      {/* 4. DOCUMENTATION MODAL */}
      {activeModal === 'docs' && (
        <ModalBackdrop onClose={() => setActiveModal(null)}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <BookOpen size={16} style={{ color: 'var(--accent-lemongrass)' }} />
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', fontWeight: 600, letterSpacing: '0.08em', color: 'var(--text-dim)', textTransform: 'uppercase' }}>
                SYSTEM DOCUMENTATION // QUICK REFERENCE
              </span>
            </div>
            <CloseButton onClick={() => setActiveModal(null)} />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '12px', color: 'var(--text-secondary)' }}>
            <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-xs)', padding: '10px 12px' }}>
              <div style={{ fontWeight: 600, color: 'var(--text-main)', marginBottom: '3px' }}>1. PageIndex Tree Traversal</div>
              <p style={{ margin: 0, lineHeight: 1.5, color: 'var(--text-muted)' }}>
                Documents are indexed by logical hierarchy (sections, tables, equipment numbers) instead of blind token chunks, preserving technical context.
              </p>
            </div>

            <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-xs)', padding: '10px 12px' }}>
              <div style={{ fontWeight: 600, color: 'var(--text-main)', marginBottom: '3px' }}>2. 4-Stage Autonomous Pipeline</div>
              <p style={{ margin: 0, lineHeight: 1.5, color: 'var(--text-muted)' }}>
                Orchestrator decomposes queries &rarr; Document Analyst identifies sources &rarr; PageIndex traverses repository &rarr; Sovereign Verifier validates output.
              </p>
            </div>

            <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-xs)', padding: '10px 12px' }}>
              <div style={{ fontWeight: 600, color: 'var(--text-main)', marginBottom: '3px' }}>3. Evidence Highlighting &amp; Citations</div>
              <p style={{ margin: 0, lineHeight: 1.5, color: 'var(--text-muted)' }}>
                Every answer includes clickable citations that jump directly to the target document page with relevant text blocks highlighted.
              </p>
            </div>
          </div>
        </ModalBackdrop>
      )}

      {/* 5. FAQS MODAL */}
      {activeModal === 'faqs' && (
        <ModalBackdrop onClose={() => setActiveModal(null)}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <HelpCircle size={16} style={{ color: 'var(--accent-lemongrass)' }} />
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', fontWeight: 600, letterSpacing: '0.08em', color: 'var(--text-dim)', textTransform: 'uppercase' }}>
                FREQUENTLY ASKED QUESTIONS
              </span>
            </div>
            <CloseButton onClick={() => setActiveModal(null)} />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '12px', color: 'var(--text-secondary)' }}>
            <div>
              <div style={{ fontWeight: 600, color: 'var(--text-main)', marginBottom: '2px' }}>
                Does Citadel require an active internet connection?
              </div>
              <p style={{ margin: 0, color: 'var(--text-muted)', lineHeight: 1.5 }}>
                No. Citadel is specifically designed for air-gapped industrial plant networks where public internet access is prohibited.
              </p>
            </div>

            <div>
              <div style={{ fontWeight: 600, color: 'var(--text-main)', marginBottom: '2px' }}>
                What document formats are supported?
              </div>
              <p style={{ margin: 0, color: 'var(--text-muted)', lineHeight: 1.5 }}>
                Citadel processes standard PDF manuals, engineering drawings, incident logs, SOP markdown files, and technical datasheets.
              </p>
            </div>

            <div>
              <div style={{ fontWeight: 600, color: 'var(--text-main)', marginBottom: '2px' }}>
                How are hallucinations prevented in engineering calculations?
              </div>
              <p style={{ margin: 0, color: 'var(--text-muted)', lineHeight: 1.5 }}>
                Stage 4 (Sovereign Verifier) audits numeric outputs against retrieved source passages before answering. If evidence is ambiguous, the system requests operator clarification.
              </p>
            </div>
          </div>
        </ModalBackdrop>
      )}
    </>
  );
}

/**
 * Reusable modal backdrop with click-outside dismissal
 */
function ModalBackdrop({ children, onClose }) {
  return (
    <div
      onClick={onClose}
      className="anim-modal-backdrop"
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.72)',
        backdropFilter: 'blur(4px)',
        zIndex: 2000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px'
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="anim-modal-content"
        style={{
          width: '100%',
          maxWidth: '520px',
          background: 'var(--bg-panel)',
          border: '1px solid var(--border-medium)',
          borderRadius: 'var(--radius-xs)',
          padding: '24px',
          boxShadow: 'var(--shadow-lg)'
        }}
      >
        {children}
      </div>
    </div>
  );
}

/**
 * Clean close button for modals
 */
function CloseButton({ onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        background: 'transparent',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-xs)',
        color: 'var(--text-secondary)',
        cursor: 'pointer',
        padding: '4px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'all 0.12s ease'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.color = '#fff';
        e.currentTarget.style.borderColor = 'var(--border-highlight)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.color = 'var(--text-secondary)';
        e.currentTarget.style.borderColor = 'var(--border-subtle)';
      }}
      title="Close modal (Esc)"
    >
      <X size={14} />
    </button>
  );
}
