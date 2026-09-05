import React from 'react';
import { downloadSessionFile } from '../services/api';
import { Download, FileText, Code2, Table, FolderArchive } from 'lucide-react';

/**
 * WorkspaceAssets - Modern frosted deliverables drawer with instant download buttons
 */
export default function WorkspaceAssets({
  files = [],
  activeFile,
  onSelectFile,
  sessionId = 'demo-session'
}) {
  const getFileIcon = (type) => {
    switch (type) {
      case 'docx':
      case 'pptx':
      case 'pdf':
        return <FileText size={14} style={{ color: '#c084fc' }} />;
      case 'py':
      case 'sh':
        return <Code2 size={14} style={{ color: '#38bdf8' }} />;
      case 'xlsx':
      case 'csv':
        return <Table size={14} style={{ color: 'var(--accent-lemongrass)' }} />;
      default:
        return <FileText size={14} style={{ color: '#94a3b8' }} />;
    }
  };

  const handleDownload = (e, fileName) => {
    e.stopPropagation();
    downloadSessionFile(sessionId, fileName);
  };

  return (
    <div style={{
      background: 'rgba(12, 16, 23, 0.75)',
      backdropFilter: 'blur(16px)',
      borderBottom: '1px solid var(--border-subtle)',
      padding: '8px 20px'
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '6px',
        fontSize: '11px',
        color: 'var(--text-muted)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <FolderArchive size={14} style={{ color: 'var(--accent-lemongrass)' }} />
          <span style={{ fontWeight: 600, letterSpacing: '0.02em', color: '#e2e8f0' }}>SESSION DELIVERABLES</span>
          <span className="pill-badge" style={{ padding: '1px 6px', fontSize: '9.5px' }}>{files.length}</span>
        </div>
        <span style={{ fontSize: '10.5px', color: 'var(--accent-lemongrass)', fontWeight: 500 }}>
          Export Ready
        </span>
      </div>

      <div style={{
        display: 'flex',
        gap: '8px',
        overflowX: 'auto',
        paddingBottom: '3px'
      }}>
        {files.length === 0 ? (
          <div style={{ fontSize: '11px', color: 'var(--text-dim)', padding: '4px 0' }}>
            No deliverables generated in this session yet.
          </div>
        ) : (
          files.map((file, fIdx) => {
            const isSelected = activeFile?.name === file.name;
            return (
              <div
                key={file.name}
                onClick={() => onSelectFile(file)}
                className="anim-stagger-item"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: isSelected ? 'rgba(163, 230, 53, 0.12)' : 'rgba(255, 255, 255, 0.03)',
                  border: isSelected ? '1px solid rgba(163, 230, 53, 0.45)' : '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  padding: '4px 10px',
                  cursor: 'pointer',
                  fontSize: '11.5px',
                  whiteSpace: 'nowrap',
                  transition: 'transform 0.18s ease, background 0.18s ease, border-color 0.18s ease',
                  animationDelay: `${fIdx * 50}ms`
                }}
              >
                {getFileIcon(file.type)}
                <span style={{ color: isSelected ? '#fff' : '#cbd5e1', fontWeight: isSelected ? 600 : 400 }}>
                  {file.name}
                </span>
                <span style={{ fontSize: '10px', color: 'var(--text-dim)' }}>
                  ({file.size || '32 KB'})
                </span>

                {/* Instant Download Button */}
                <button
                  onClick={(e) => handleDownload(e, file.name)}
                  className="btn-modern btn-modern-accent"
                  title={`Instant Download ${file.name}`}
                  style={{
                    padding: '2px 8px',
                    fontSize: '10px',
                    height: '22px',
                    borderRadius: 'var(--radius-sm)',
                    marginLeft: '4px'
                  }}
                >
                  <Download size={11} />
                  <span>Download</span>
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
