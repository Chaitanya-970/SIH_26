import React, { useState } from 'react';
import {
  FileText,
  ChevronRight,
  ChevronDown,
  Search,
  Plus,
  ChevronLeft
} from 'lucide-react';

/**
 * KnowledgeTreePane - PANE 1 (LEFT): KNOWLEDGE
 * "What the system knows"
 * Clean industrial repository navigator with PageIndex hierarchy
 */
export default function KnowledgeTreePane({
  documents = [],
  onSelectDocument,
  activeDocument,
  onOpenAddSource,
  isCollapsed,
  onToggleCollapse
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedDocs, setExpandedDocs] = useState({});

  const toggleDocPageIndex = (docId, e) => {
    e.stopPropagation();
    setExpandedDocs((prev) => ({ ...prev, [docId]: !prev[docId] }));
  };

  const filteredDocs = documents.filter((d) =>
    (d.name || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isCollapsed) {
    return (
      <div style={{
        width: '38px',
        height: '100%',
        background: 'var(--bg-panel)',
        borderRight: '1px solid var(--border-medium)',
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
          title="Expand Knowledge Pane"
        >
          <ChevronRight size={13} />
        </button>
        <div style={{
          writingMode: 'vertical-rl',
          textOrientation: 'mixed',
          transform: 'rotate(180deg)',
          fontFamily: 'var(--font-mono)',
          fontSize: '10px',
          fontWeight: 600,
          color: 'var(--text-dim)',
          letterSpacing: '0.12em',
          marginTop: '16px'
        }}>
          KNOWLEDGE
        </div>
      </div>
    );
  }

  return (
    <div style={{
      width: '260px',
      minWidth: '240px',
      maxWidth: '300px',
      height: '100%',
      background: 'var(--bg-panel)',
      borderRight: '1px solid var(--border-medium)',
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
            KNOWLEDGE
          </div>
          <div style={{
            fontSize: '11px',
            color: 'var(--text-muted)'
          }}>
            What the system knows
          </div>
        </div>

        <button
          onClick={onToggleCollapse}
          className="btn-modern"
          style={{ padding: '3px', width: '22px', height: '22px', justifyContent: 'center' }}
          title="Collapse Knowledge Pane"
        >
          <ChevronLeft size={12} />
        </button>
      </div>

      {/* Search Input */}
      <div style={{ padding: '8px 12px', borderBottom: '1px solid var(--border-subtle)' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          background: 'var(--bg-input)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-xs)',
          padding: '5px 8px',
          gap: '6px'
        }}>
          <Search size={12} style={{ color: 'var(--text-dim)' }} />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search indexed documents..."
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-main)',
              fontFamily: 'var(--font-ui)',
              fontSize: '11.5px',
              outline: 'none',
              width: '100%'
            }}
          />
        </div>
      </div>

      {/* Document List */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '8px 8px',
        fontSize: '12px'
      }}>
        <div style={{
          padding: '4px 6px',
          fontSize: '10px',
          fontFamily: 'var(--font-mono)',
          fontWeight: 600,
          color: 'var(--text-dim)',
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '4px'
        }}>
          <span>REPOSITORY</span>
          <span>{documents.length} DOCS</span>
        </div>

        {/* Empty State or Document List */}
        {filteredDocs.length === 0 ? (
          <div style={{
            padding: '28px 12px',
            textAlign: 'center',
            color: 'var(--text-muted)'
          }}>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>
              No indexed documents
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-dim)', marginBottom: '14px' }}>
              Upload technical documents to index.
            </div>
            <button
              onClick={onOpenAddSource}
              className="btn-modern btn-modern-accent"
              style={{ fontSize: '11px', padding: '5px 10px', width: '100%', justifyContent: 'center' }}
            >
              <Plus size={12} />
              <span>Upload Document</span>
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            {filteredDocs.map((doc, idx) => {
              const isDocSelected = activeDocument?.name === doc.name;
              const hasPageIndex = doc.pageIndex && doc.pageIndex.length > 0;
              const isIndexExpanded = expandedDocs[doc.id];

              return (
                <div key={doc.id || doc.name} className="anim-stagger-item" style={{ margin: '1px 0', animationDelay: `${idx * 40}ms` }}>
                  {/* Document Item */}
                  <div
                    onClick={() => onSelectDocument(doc, 1)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '5px 6px',
                      borderRadius: 'var(--radius-xs)',
                      cursor: 'pointer',
                      background: isDocSelected ? 'var(--bg-elevated)' : 'transparent',
                      border: isDocSelected ? '1px solid var(--border-medium)' : '1px solid transparent',
                      color: isDocSelected ? 'var(--text-main)' : 'var(--text-secondary)',
                      fontSize: '11.5px',
                      transition: 'background 0.1s ease'
                    }}
                  >
                    {hasPageIndex ? (
                      <button
                        onClick={(e) => toggleDocPageIndex(doc.id, e)}
                        style={{ background: 'transparent', border: 'none', color: 'var(--text-dim)', cursor: 'pointer', padding: 0 }}
                      >
                        {isIndexExpanded ? <ChevronDown size={11} /> : <ChevronRight size={11} />}
                      </button>
                    ) : (
                      <span style={{ width: '11px' }} />
                    )}
                    <FileText size={12} style={{ color: isDocSelected ? 'var(--accent-lemongrass)' : 'var(--text-dim)', flexShrink: 0 }} />
                    <span style={{
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      flex: 1,
                      fontWeight: isDocSelected ? 600 : 400
                    }}>
                      {doc.name}
                    </span>
                  </div>

                  {/* PageIndex Tree Subsections */}
                  {hasPageIndex && isIndexExpanded && (
                    <div style={{
                      paddingLeft: '12px',
                      borderLeft: '1px solid var(--border-subtle)',
                      marginLeft: '11px',
                      marginTop: '2px',
                      fontSize: '10.5px',
                      fontFamily: 'var(--font-mono)'
                    }}>
                      {doc.pageIndex.map((section, sIdx) => (
                        <div key={sIdx}>
                          <div
                            onClick={() => onSelectDocument(doc, section.page)}
                            style={{
                              padding: '2px 4px',
                              color: 'var(--text-muted)',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between'
                            }}
                          >
                            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {section.title}
                            </span>
                            <span style={{ color: 'var(--text-dim)', fontSize: '9.5px', marginLeft: '4px' }}>
                              p.{section.page}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Pane Footer: Upload Action */}
      <div style={{
        padding: '10px 14px',
        borderTop: '1px solid var(--border-subtle)',
        background: 'var(--bg-panel)'
      }}>
        <button
          onClick={onOpenAddSource}
          className="btn-modern"
          style={{ width: '100%', justifyContent: 'center', fontSize: '11.5px', padding: '6px 10px', color: 'var(--text-main)' }}
        >
          <Plus size={12} style={{ color: 'var(--accent-lemongrass)' }} />
          <span>Upload Document</span>
        </button>
      </div>
    </div>
  );
}
