import React, { useState } from 'react';
import { DOCUMENT_PAGES, MOCK_DOCX_PREVIEW_HTML, MOCK_CODE_OUTPUT, MOCK_SHEET_DATA } from '../services/mockData';
import { downloadSessionFile } from '../services/api';
import {
  FileText,
  ChevronLeft,
  ChevronRight,
  Download,
  Code2,
  Terminal,
  ArrowLeft
} from 'lucide-react';

/**
 * DocumentViewer - Modern Center Pane Document & Code Inspector
 */
export default function DocumentViewer({
  document: activeDoc,
  initialPage = 1,
  highlightText = '',
  onBackToQuery,
  hasActiveQuery = false,
  sessionId = 'demo-session'
}) {
  const [pageMap, setPageMap] = useState({});
  const [activeCodeTab, setActiveCodeTab] = useState('code'); // 'code' | 'console'

  if (!activeDoc) return null;

  const totalPages = activeDoc.pages || 1;
  const currentPage = pageMap[activeDoc.name] || initialPage || 1;

  const handlePrevPage = () => {
    setPageMap((prev) => ({
      ...prev,
      [activeDoc.name]: Math.max(1, currentPage - 1)
    }));
  };

  const handleNextPage = () => {
    setPageMap((prev) => ({
      ...prev,
      [activeDoc.name]: Math.min(totalPages, currentPage + 1)
    }));
  };

  const docPageData = DOCUMENT_PAGES[activeDoc.name]?.[currentPage];

  const handleDownload = () => {
    downloadSessionFile(sessionId, activeDoc.name);
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      background: 'transparent',
      overflow: 'hidden'
    }}>
      {/* Top Document Toolbar */}
      <div style={{
        padding: '10px 20px',
        background: 'rgba(12, 16, 23, 0.75)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid var(--border-subtle)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        fontSize: '12px'
      }}>
        {/* Left: Document Name & Optional Back Button */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {hasActiveQuery && (
            <button
              onClick={onBackToQuery}
              className="btn-modern btn-modern-accent"
              style={{ padding: '4px 10px', fontSize: '11px' }}
              title="Return to Query Results"
            >
              <ArrowLeft size={13} />
              <span>Back to Query</span>
            </button>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FileText size={15} style={{ color: 'var(--accent-lemongrass)' }} />
            <span style={{ color: '#fff', fontWeight: 600 }}>{activeDoc.name}</span>
            <span className="pill-badge" style={{ padding: '1px 6px', fontSize: '10px' }}>
              {activeDoc.size || '3.2 MB'}
            </span>
          </div>
        </div>

        {/* Center: Pagination Controls */}
        {totalPages > 1 && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            background: 'rgba(0, 0, 0, 0.3)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-pill)',
            padding: '3px 12px'
          }}>
            <button
              onClick={handlePrevPage}
              disabled={currentPage <= 1}
              style={{ background: 'transparent', border: 'none', color: currentPage <= 1 ? '#444' : '#fff', cursor: currentPage <= 1 ? 'not-allowed' : 'pointer' }}
            >
              <ChevronLeft size={14} />
            </button>
            <span style={{ color: '#cbd5e1', fontSize: '11.5px' }}>
              Page <strong style={{ color: 'var(--accent-lemongrass)' }}>{currentPage}</strong> of {totalPages}
            </span>
            <button
              onClick={handleNextPage}
              disabled={currentPage >= totalPages}
              style={{ background: 'transparent', border: 'none', color: currentPage >= totalPages ? '#444' : '#fff', cursor: currentPage >= totalPages ? 'not-allowed' : 'pointer' }}
            >
              <ChevronRight size={14} />
            </button>
          </div>
        )}

        {/* Right: Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {activeDoc.type === 'py' && (
            <div className="segmented-tabs" style={{ padding: '2px', marginRight: '4px' }}>
              <button
                onClick={() => setActiveCodeTab('code')}
                className={`segmented-tab-btn ${activeCodeTab === 'code' ? 'active' : ''}`}
                style={{ padding: '4px 10px', fontSize: '11px' }}
              >
                <Code2 size={13} />
                <span>Code</span>
              </button>
              <button
                onClick={() => setActiveCodeTab('console')}
                className={`segmented-tab-btn ${activeCodeTab === 'console' ? 'active' : ''}`}
                style={{ padding: '4px 10px', fontSize: '11px' }}
              >
                <Terminal size={13} />
                <span>Stdout</span>
              </button>
            </div>
          )}

          <button
            onClick={handleDownload}
            className="btn-modern"
            style={{ padding: '5px 12px', fontSize: '11.5px' }}
            title="Download Document"
          >
            <Download size={13} />
            <span>Download</span>
          </button>
        </div>
      </div>

      {/* Main Document Content Body */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '30px',
        display: 'flex',
        justifyContent: 'center'
      }}>
        {renderDocumentBody(activeDoc, currentPage, docPageData, highlightText, activeCodeTab)}
      </div>
    </div>
  );
}

function renderDocumentBody(doc, currentPage, pageData, highlightText, activeCodeTab) {
  // 1. Python Code Sandbox
  if (doc.type === 'py' || doc.name.endsWith('.py')) {
    const codeData = doc.code_data || MOCK_CODE_OUTPUT;
    if (activeCodeTab === 'console') {
      return (
        <div style={{ width: '100%', maxWidth: '840px' }}>
          <div style={{
            padding: '8px 16px',
            background: 'rgba(19, 25, 34, 0.9)',
            border: '1px solid var(--border-medium)',
            borderTopLeftRadius: 'var(--radius-lg)',
            borderTopRightRadius: 'var(--radius-lg)',
            borderBottom: 'none',
            fontSize: '11.5px',
            color: '#94a3b8',
            display: 'flex',
            justifyContent: 'space-between'
          }}>
            <span>SECURE SANDBOX // UNPRIVILEGED IPC</span>
            <span style={{ color: 'var(--accent-lemongrass)', fontWeight: 600 }}>STATUS: EXIT 0 (0.84s)</span>
          </div>
          <pre style={{
            background: '#05070a',
            border: '1px solid var(--border-medium)',
            borderBottomLeftRadius: 'var(--radius-lg)',
            borderBottomRightRadius: 'var(--radius-lg)',
            padding: '20px',
            fontFamily: 'var(--font-mono)',
            fontSize: '12px',
            lineHeight: '1.55',
            color: '#a3e635',
            overflow: 'auto',
            margin: 0,
            boxShadow: 'var(--shadow-lg)'
          }}>
            {codeData.stdout}
          </pre>
        </div>
      );
    }
    return (
      <div style={{ width: '100%', maxWidth: '840px' }}>
        <div style={{
          padding: '8px 16px',
          background: 'rgba(19, 25, 34, 0.9)',
          border: '1px solid var(--border-medium)',
          borderTopLeftRadius: 'var(--radius-lg)',
          borderTopRightRadius: 'var(--radius-lg)',
          borderBottom: 'none',
          fontSize: '11.5px',
          color: '#94a3b8',
          display: 'flex',
          justifyContent: 'space-between'
        }}>
          <span>SYNTAX HIGHLIGHTED PYTHON 3.11</span>
          <span style={{ color: '#38bdf8', fontWeight: 600 }}>ASME B31.3 VERIFIED</span>
        </div>
        <pre style={{
          background: '#05070a',
          border: '1px solid var(--border-medium)',
          borderBottomLeftRadius: 'var(--radius-lg)',
          borderBottomRightRadius: 'var(--radius-lg)',
          padding: '20px',
          fontFamily: 'var(--font-mono)',
          fontSize: '12px',
          lineHeight: '1.55',
          color: '#e2e8f0',
          overflow: 'auto',
          margin: 0,
          boxShadow: 'var(--shadow-lg)'
        }}>
          <code>{codeData.code}</code>
        </pre>
      </div>
    );
  }

  // 2. Word / Approval Note HTML Preview
  if (doc.type === 'docx' || doc.name.endsWith('.docx')) {
    return (
      <div style={{ width: '100%', maxWidth: '840px' }}>
        <div
          className="modern-card"
          style={{ padding: '32px', background: '#fff', color: '#1a202c', boxShadow: '0 20px 60px rgba(0,0,0,0.6)' }}
          dangerouslySetInnerHTML={{ __html: MOCK_DOCX_PREVIEW_HTML }}
        />
      </div>
    );
  }

  // 3. Spreadsheet Data Table
  if (doc.type === 'xlsx' || doc.name.endsWith('.xlsx') || doc.type === 'csv') {
    return (
      <div style={{ width: '100%', maxWidth: '880px' }}>
        <div className="modern-card" style={{ padding: '20px' }}>
          <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--accent-lemongrass)', marginBottom: '14px' }}>
            ULTRASONIC CORROSION SURVEY LOG // CDU-2 TRAY SURVEY
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', fontFamily: 'var(--font-mono)' }}>
            <thead>
              <tr style={{ background: 'rgba(255, 255, 255, 0.04)', borderBottom: '2px solid var(--border-medium)', color: '#94a3b8', textAlign: 'left' }}>
                <th style={{ padding: '10px 12px' }}>POINT TAG</th>
                <th style={{ padding: '10px 12px' }}>LOCATION</th>
                <th style={{ padding: '10px 12px' }}>T_NOM (mm)</th>
                <th style={{ padding: '10px 12px' }}>T_MEAS (mm)</th>
                <th style={{ padding: '10px 12px' }}>T_MIN (mm)</th>
                <th style={{ padding: '10px 12px' }}>STATUS</th>
              </tr>
            </thead>
            <tbody>
              {MOCK_SHEET_DATA.map((row, idx) => (
                <tr key={idx} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                  <td style={{ padding: '10px 12px', color: '#fff' }}>{row.tag}</td>
                  <td style={{ padding: '10px 12px', color: '#cbd5e1' }}>{row.location}</td>
                  <td style={{ padding: '10px 12px' }}>{row.t_nom}</td>
                  <td style={{ padding: '10px 12px', color: row.status === 'ATTENTION' ? 'var(--status-amber)' : 'inherit', fontWeight: 600 }}>{row.t_meas}</td>
                  <td style={{ padding: '10px 12px' }}>{row.t_min}</td>
                  <td style={{ padding: '10px 12px' }}>
                    <span className={`pill-badge ${row.status === 'ATTENTION' ? '' : 'pill-badge-accent'}`} style={{ padding: '2px 8px', fontSize: '10px' }}>
                      {row.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  // 4. Modern PDF Document Presentation
  return (
    <div style={{
      width: '100%',
      maxWidth: '760px',
      background: '#ffffff',
      color: '#1a202c',
      padding: '48px 56px',
      borderRadius: 'var(--radius-lg)',
      boxShadow: '0 20px 60px -10px rgba(0, 0, 0, 0.65), 0 0 0 1px rgba(255, 255, 255, 0.1)',
      fontFamily: 'var(--font-mono)',
      minHeight: '700px',
      position: 'relative'
    }}>
      {/* Watermark & Header */}
      <div style={{
        borderBottom: '2px solid #0f172a',
        paddingBottom: '14px',
        marginBottom: '24px',
        display: 'flex',
        justifyContent: 'space-between',
        fontSize: '10.5px',
        fontWeight: 600,
        color: '#475569',
        letterSpacing: '0.04em'
      }}>
        <span>MANGALORE REFINERY AND PETROCHEMICALS LIMITED</span>
        <span style={{ color: '#dc2626' }}>CONFIDENTIAL // ON-PREMISE ONLY</span>
      </div>

      {pageData ? (
        <>
          <div style={{ fontSize: '17px', fontWeight: 700, color: '#0f172a', marginBottom: '4px' }}>
            {pageData.title}
          </div>
          <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '22px' }}>
            {pageData.subtitle}
          </div>

          {/* Glowing Citation Match Highlight */}
          {(pageData.highlight || highlightText) && (
            <div style={{
              background: '#f7fee7',
              border: '1px solid #bef264',
              borderLeft: '4px solid #65a30d',
              borderRadius: 'var(--radius-sm)',
              padding: '12px 16px',
              margin: '18px 0',
              fontSize: '12px',
              color: '#14532d',
              fontWeight: 600,
              boxShadow: '0 2px 8px rgba(132, 204, 22, 0.15)'
            }}>
              <span style={{ textTransform: 'uppercase', fontSize: '10.5px', color: '#4d7c0f', display: 'block', marginBottom: '3px' }}>
                [Grounding Evidence Citation Match]:
              </span>
              &ldquo;{pageData.highlight || highlightText}&rdquo;
            </div>
          )}

          <div style={{
            fontSize: '12.5px',
            lineHeight: '1.7',
            whiteSpace: 'pre-wrap',
            color: '#334155'
          }}>
            {pageData.content}
          </div>
        </>
      ) : (
        <div style={{ textAlign: 'center', padding: '70px 0', color: '#64748b' }}>
          <div style={{ fontSize: '16px', fontWeight: 600, marginBottom: '8px', color: '#0f172a' }}>
            {doc.name}
          </div>
          <div style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '20px' }}>
            Viewing Page {currentPage} of {totalPages}
          </div>
          <p style={{ fontSize: '12px', lineHeight: '1.6', maxWidth: '520px', margin: '0 auto', color: '#475569' }}>
            Indexed document content extracted by on-device OCR and stored in ChromaDB vector store.
          </p>
        </div>
      )}

      {/* Page Footer */}
      <div style={{
        position: 'absolute',
        bottom: '24px',
        left: '56px',
        right: '56px',
        borderTop: '1px solid #e2e8f0',
        paddingTop: '10px',
        display: 'flex',
        justifyContent: 'space-between',
        fontSize: '10px',
        color: '#94a3b8'
      }}>
        <span>CITADEL LOCAL VECTOR STORE: NOMIC-EMBED-TEXT</span>
        <span>PAGE {currentPage} OF {totalPages}</span>
      </div>
    </div>
  );
}
