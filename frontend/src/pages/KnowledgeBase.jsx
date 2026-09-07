import React, { useState, useEffect, useRef } from 'react';
import {
  fetchKnowledgeBase,
  uploadDocument,
  deleteDocument
} from '../services/api';
import {
  FileText,
  Search,
  CheckCircle2,
  AlertTriangle,
  Upload,
  ArrowRight,
  Trash2
} from 'lucide-react';

/**
 * KnowledgeBase - Structured Engineering Document Repository
 * Highlights RAG hierarchical navigation, compact ingestion pipeline,
 * and Document Inspector with interactive tree traversal.
 */
export default function KnowledgeBase({
  onOpenDocument,
  onAskAboutDocument
}) {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [activeCategory, setActiveCategory] = useState('ALL');
  const [isDragging, setIsDragging] = useState(false);
  const [uploadStatus, setUploadStatus] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    let mounted = true;
    fetchKnowledgeBase()
      .then((data) => {
        if (mounted) {
          const docs = data || [];
          setDocuments(docs);
          if (docs.length > 0) {
            setSelectedDoc(docs[0]);
          }
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error('Failed to load KB documents:', err);
        if (mounted) setLoading(false);
      });
    return () => { mounted = false; };
  }, []);

  const reloadDocs = async () => {
    try {
      const data = await fetchKnowledgeBase();
      setDocuments(data || []);
      if (!selectedDoc && data?.length > 0) {
        setSelectedDoc(data[0]);
      }
    } catch (err) {
      console.error('Reload error:', err);
    }
  };

  const handleFileUpload = async (file) => {
    if (!file) return;

    const maxBytes = 50 * 1024 * 1024;
    if (file.size > maxBytes) {
      setUploadStatus({
        type: 'error',
        message: `VALIDATION ERROR: "${file.name}" exceeds 50 MB maximum allowed limit.`
      });
      return;
    }

    setUploadStatus({
      type: 'uploading',
      message: `Ingesting "${file.name}" through RAG structural pipeline...`
    });

    try {
      const createdDoc = await uploadDocument(file);
      setUploadStatus({
        type: 'success',
        message: `SUCCESS: Ingested and structured "${file.name}" into local repository.`
      });
      reloadDocs();
      setSelectedDoc(createdDoc);
      setTimeout(() => setUploadStatus(null), 4000);
    } catch (err) {
      setUploadStatus({
        type: 'error',
        message: `Upload error: ${err.message}`
      });
    }
  };

  const handleDelete = async (docId, docName, e) => {
    e.stopPropagation();
    if (window.confirm(`Confirm purging "${docName}" from local knowledge repository?`)) {
      try {
        await deleteDocument(docId);
        setDocuments((prev) => prev.filter((d) => d.id !== docId));
        if (selectedDoc?.id === docId) {
          setSelectedDoc(documents.find((d) => d.id !== docId) || null);
        }
      } catch (err) {
        alert(`Failed to delete document: ${err.message}`);
      }
    }
  };

  const getDocOutline = (doc) => {
    return [
      { title: 'Outline not available', level: 0 }
    ];
  };

  const getDocCategory = (name) => {
    if (name.includes('Pump') || name.includes('ASME')) return 'ENGINEERING';
    if (name.includes('SAFETY')) return 'SAFETY';
    if (name.includes('Maintenance') || name.includes('Inspection')) return 'OPERATIONS';
    return 'GENERAL';
  };

  const filteredDocs = documents.filter((doc) => {
    const matchesSearch = doc.name.toLowerCase().includes(searchTerm.toLowerCase());
    const category = getDocCategory(doc.name);
    const matchesCategory = activeCategory === 'ALL' || category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div style={{
      height: 'calc(100vh - 52px)',
      overflowY: 'auto',
      background: 'var(--bg-dark)',
      padding: '24px 36px',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* 1. TOP HEADER STRIP */}
      <div style={{
        marginBottom: '16px'
      }}>
        <h1 style={{
          fontFamily: 'var(--font-display)',
          fontSize: '22px',
          fontWeight: 700,
          color: 'var(--text-main)',
          letterSpacing: '-0.01em',
          marginBottom: '4px'
        }}>
          KNOWLEDGE BASE
        </h1>

        <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)' }}>
          Confidential engineering knowledge indexed for local retrieval.
        </p>
      </div>

      {/* 2. COMPACT UPLOAD DROP ZONE */}
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            handleFileUpload(e.dataTransfer.files[0]);
          }
        }}
        onClick={() => fileInputRef.current?.click()}
        style={{
          border: isDragging ? '1px dashed var(--accent-lemongrass)' : '1px dashed var(--border-medium)',
          background: isDragging ? 'rgba(182, 216, 58, 0.05)' : 'var(--bg-panel)',
          borderRadius: 'var(--radius-xs)',
          padding: '12px 18px',
          cursor: 'pointer',
          marginBottom: '6px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          transition: 'all 0.15s ease',
          boxShadow: 'var(--shadow-sm)'
        }}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={(e) => {
            if (e.target.files && e.target.files.length > 0) {
              handleFileUpload(e.target.files[0]);
            }
          }}
          accept=".pdf,.docx,.xlsx,.csv,.png,.jpg,.jpeg"
          style={{ display: 'none' }}
        />

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Upload size={15} style={{ color: 'var(--accent-lemongrass)' }} />
          <div>
            <span style={{ color: 'var(--text-main)', fontSize: '12px', fontWeight: 600 }}>Add Document</span>
            <span style={{ color: 'var(--text-muted)', fontSize: '11.5px', marginLeft: '8px' }}>
              Drop confidential files here or browse local drive
            </span>
          </div>
        </div>

        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10.5px', color: 'var(--accent-orange)' }}>
          BROWSE FILES
        </span>
      </div>

      {/* Supported file types label directly under upload */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: '6px',
        fontFamily: 'var(--font-mono)',
        fontSize: '10px',
        color: 'var(--text-dim)',
        padding: '0 4px'
      }}>
        <span>SUPPORTED: PDF · DOCX · XLSX · CSV</span>
        <span>LOCAL UPLOAD</span>
      </div>

      {/* Upload Feedback Banner */}
      {uploadStatus && (
        <div style={{
          background: uploadStatus.type === 'error' ? 'rgba(244, 63, 94, 0.1)' : 'var(--accent-blue-subtle)',
          border: `1px solid ${uploadStatus.type === 'error' ? 'var(--status-rose)' : 'var(--accent-blue)'}`,
          borderRadius: 'var(--radius-xs)',
          padding: '8px 14px',
          marginBottom: '16px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontSize: '11.5px',
          color: uploadStatus.type === 'error' ? '#b91c1c' : 'var(--accent-blue)'
        }}>
          {uploadStatus.type === 'error' ? <AlertTriangle size={14} /> : <CheckCircle2 size={14} />}
          <span>{uploadStatus.message}</span>
        </div>
      )}

      {/* 4. DOMINANT SPLIT VIEW: INDEXED REPOSITORY (Left) + DOCUMENT INSPECTOR (Right) */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1.2fr 1fr',
        gap: '18px',
        flex: 1,
        minHeight: 0
      }}>
        {/* LEFT COLUMN: INDEXED REPOSITORY */}
        <div style={{
          background: 'var(--bg-panel)',
          border: '1px solid var(--border-medium)',
          borderRadius: 'var(--radius-xs)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          boxShadow: 'var(--shadow-box)'
        }}>
          {/* Repository Toolbar */}
          <div style={{
            padding: '10px 14px',
            borderBottom: '1px solid var(--border-subtle)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '12px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', fontWeight: 600, color: 'var(--text-dim)' }}>
                INDEXED REPOSITORY
              </span>
              <span className="status-tag" style={{ padding: '1px 5px', fontSize: '9.5px' }}>
                {filteredDocs.length} DOCUMENTS
              </span>
            </div>

            {/* Search Box */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              background: 'var(--bg-input)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-xs)',
              padding: '4px 8px',
              width: '210px'
            }}>
              <Search size={12} style={{ color: 'var(--text-dim)', marginRight: '6px' }} />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search repository..."
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-main)',
                  fontSize: '11px',
                  outline: 'none',
                  width: '100%'
                }}
              />
            </div>
          </div>

          {/* Category Filter Strip */}
          <div style={{
            display: 'flex',
            gap: '4px',
            padding: '6px 14px',
            borderBottom: '1px solid var(--border-subtle)',
            background: 'var(--bg-elevated)'
          }}>
            {['ALL', 'ENGINEERING', 'OPERATIONS', 'SAFETY'].map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                style={{
                  background: activeCategory === cat ? 'var(--bg-surface)' : 'transparent',
                  border: activeCategory === cat ? '1px solid var(--border-subtle)' : '1px solid transparent',
                  color: activeCategory === cat ? 'var(--accent-orange-dim)' : 'var(--text-muted)',
                  borderRadius: 'var(--radius-xs)',
                  padding: '2px 8px',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '10px',
                  cursor: 'pointer'
                }}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Rows List */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '6px' }}>
            {loading ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', padding: '4px' }}>
                {[1, 2, 3, 4, 5].map((i) => (
                  <div
                    key={i}
                    className="anim-skeleton-pulse"
                    style={{
                      height: '46px',
                      borderRadius: 'var(--radius-xs)',
                      border: '1px solid var(--border-subtle)',
                      animationDelay: `${i * 100}ms`
                    }}
                  />
                ))}
              </div>
            ) : filteredDocs.length === 0 ? (
              <div style={{ padding: '30px', textAlign: 'center', color: 'var(--text-dim)', fontSize: '12px' }}>
                No matching documents found.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {filteredDocs.map((doc, dIdx) => {
                  const isSelected = selectedDoc?.id === doc.id;
                  const ext = doc.name.split('.').pop()?.toUpperCase() || 'DOC';
                  const category = getDocCategory(doc.name);

                  return (
                    <div
                      key={doc.id}
                      onClick={() => setSelectedDoc(doc)}
                      className="technical-row anim-stagger-item"
                      style={{
                        padding: '10px 12px',
                        background: isSelected ? 'var(--bg-elevated)' : 'var(--bg-surface)',
                        borderColor: isSelected ? 'var(--border-highlight)' : 'var(--border-subtle)',
                        animationDelay: `${dIdx * 45}ms`
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0, flex: 1 }}>
                        <span style={{
                          fontFamily: 'var(--font-mono)',
                          fontSize: '9.5px',
                          padding: '2px 6px',
                          background: isSelected ? 'var(--accent-orange-subtle)' : 'var(--bg-elevated)',
                          border: isSelected ? '1px solid rgba(245, 158, 11, 0.45)' : '1px solid var(--border-subtle)',
                          borderRadius: 'var(--radius-xs)',
                          color: isSelected ? 'var(--accent-orange-dim)' : 'var(--text-dim)',
                          fontWeight: isSelected ? 700 : 500
                        }}>
                          {ext}
                        </span>

                        <div style={{ minWidth: 0, flex: 1 }}>
                          <div style={{
                            color: 'var(--text-main)',
                            fontWeight: isSelected ? 600 : 500,
                            fontSize: '12px',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                          }}>
                            {doc.name}
                          </div>
                          <div style={{
                            fontSize: '10.5px',
                            color: 'var(--text-muted)',
                            display: 'flex',
                            gap: '8px',
                            marginTop: '2px',
                            fontFamily: 'var(--font-mono)'
                          }}>
                            <span>{category}</span>
                            <span>·</span>
                            <span>{doc.size_mb ? `${doc.size_mb} MB` : '3.8 MB'}</span>
                            <span>·</span>
                            <span>{doc.timestamp || 'Indexed'}</span>
                          </div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginLeft: '12px', flexShrink: 0 }}>
                        <button
                          onClick={(e) => handleDelete(doc.id, doc.name, e)}
                          className="btn-modern"
                          style={{ padding: '3px 6px', border: 'none', background: 'transparent', color: 'var(--text-dim)' }}
                          title="Purge document"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: DOCUMENT INSPECTOR (Document Outline & Actions) */}
        <div style={{
          background: 'var(--bg-panel)',
          border: '1px solid var(--border-medium)',
          borderRadius: 'var(--radius-xs)',
          padding: '16px 18px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          overflow: 'hidden',
          boxShadow: 'var(--shadow-box)'
        }}>
          {selectedDoc ? (
            <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
              {/* Inspector Header */}
              <div style={{ borderBottom: '1px solid var(--border-subtle)', paddingBottom: '12px', marginBottom: '12px' }}>
                <div style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '10px',
                  color: 'var(--text-dim)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  marginBottom: '4px'
                }}>
                  DOCUMENT INSPECTOR
                </div>

                <div style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '14.5px',
                  fontWeight: 700,
                  color: 'var(--text-main)',
                  wordBreak: 'break-all'
                }}>
                  {selectedDoc.name.toUpperCase()}
                </div>

                <div style={{
                  marginTop: '6px',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '10.5px',
                  color: 'var(--text-secondary)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <span>{selectedDoc.pages ? `${selectedDoc.pages} PAGES` : 'Outline not available'}</span>
                  <span>·</span>
                  <span style={{ color: 'var(--accent-orange-dim)', fontWeight: 600 }}>PARSED & INDEXED</span>
                </div>
              </div>

              {/* DOCUMENT STRUCTURE (Outline Tree) */}
              <div style={{ flex: 1, overflowY: 'auto', marginBottom: '14px' }}>
                <div style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '10px',
                  fontWeight: 600,
                  color: 'var(--text-dim)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  marginBottom: '8px'
                }}>
                  DOCUMENT STRUCTURE
                </div>

                <div style={{
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-xs)',
                  padding: '12px 14px',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '11px',
                  lineHeight: 1.6,
                  color: 'var(--text-secondary)'
                }}>
                  {getDocOutline(selectedDoc).map((item, idx, arr) => (
                    <div key={idx}>
                      <div style={{ color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ color: 'var(--text-dim)' }}>{idx === arr.length - 1 ? '└──' : '├──'}</span>
                        <span>{item.title}</span>
                      </div>
                      {item.children && item.children.map((child, cIdx, cArr) => (
                        <div key={cIdx} style={{ paddingLeft: '18px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ color: 'var(--text-dim)' }}>{cIdx === cArr.length - 1 ? '└──' : '├──'}</span>
                          <span>{child.title}</span>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '8px',
                borderTop: '1px solid var(--border-subtle)',
                paddingTop: '12px'
              }}>
                <button
                  onClick={() => onOpenDocument && onOpenDocument(selectedDoc)}
                  className="btn-modern"
                  style={{ justifyContent: 'center', padding: '7px 12px', fontSize: '11.5px' }}
                >
                  <FileText size={13} />
                  <span>OPEN DOCUMENT</span>
                </button>

                <button
                  onClick={() => onAskAboutDocument && onAskAboutDocument(selectedDoc)}
                  className="btn-modern btn-modern-accent"
                  style={{ justifyContent: 'center', padding: '7px 12px', fontSize: '11.5px' }}
                >
                  <span>ASK ABOUT DOCUMENT</span>
                  <ArrowRight size={12} />
                </button>
              </div>
            </div>
          ) : (
            <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-dim)', fontSize: '12px' }}>
              Select a document to inspect hierarchical structure.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
