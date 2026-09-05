import React, { useState } from 'react';
import { Copy, Check, Terminal } from 'lucide-react';

/**
 * MarkdownRenderer - Clean, fast markdown renderer with code blocks, tables, lists, and copy action
 */
export default function MarkdownRenderer({ content = '' }) {
  if (!content) return null;

  // Split by code blocks first
  const parts = [];
  const codeBlockRegex = /```([a-zA-Z0-9_-]*)\n([\s\S]*?)```/g;
  let lastIndex = 0;
  let match;

  while ((match = codeBlockRegex.exec(content)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ type: 'markdown', text: content.substring(lastIndex, match.index) });
    }
    parts.push({
      type: 'code',
      language: match[1] || 'text',
      code: match[2].trimEnd()
    });
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < content.length) {
    parts.push({ type: 'markdown', text: content.substring(lastIndex) });
  }

  return (
    <div className="markdown-body">
      {parts.map((part, idx) => {
        if (part.type === 'code') {
          return <CodeBlock key={idx} code={part.code} language={part.language} />;
        }
        return <MarkdownText key={idx} text={part.text} />;
      })}
    </div>
  );
}

function CodeBlock({ code, language }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{
      margin: '12px 0',
      border: '1px solid var(--border-medium)',
      background: '#07090c'
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '5px 12px',
        background: '#101419',
        borderBottom: '1px solid var(--border-subtle)',
        fontFamily: 'var(--font-mono)',
        fontSize: '11px',
        color: '#8b949e'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Terminal size={12} style={{ color: 'var(--accent-lemongrass)' }} />
          <span>{language ? language.toUpperCase() : 'CODE'}</span>
        </div>
        <button
          onClick={handleCopy}
          className="btn-control"
          style={{ padding: '2px 8px', fontSize: '10px', height: '22px' }}
        >
          {copied ? <Check size={11} style={{ color: 'var(--accent-lemongrass)' }} /> : <Copy size={11} />}
          {copied ? 'COPIED' : 'COPY'}
        </button>
      </div>
      <pre style={{
        padding: '12px',
        margin: 0,
        fontFamily: 'var(--font-mono)',
        fontSize: '12px',
        lineHeight: '1.5',
        overflowX: 'auto',
        color: '#e6edf3',
        background: 'transparent'
      }}>
        <code>{code}</code>
      </pre>
    </div>
  );
}

function MarkdownText({ text }) {
  // Simple block parser for paragraphs, headers, tables, lists
  const lines = text.split('\n');
  const elements = [];
  let currentList = [];
  let currentTable = [];

  const flushList = () => {
    if (currentList.length > 0) {
      elements.push(
        <ul key={`list-${elements.length}`} style={{ paddingLeft: '20px', margin: '8px 0' }}>
          {currentList.map((item, i) => (
            <li key={i} style={{ marginBottom: '4px' }}>
              <InlineFormatting text={item} />
            </li>
          ))}
        </ul>
      );
      currentList = [];
    }
  };

  const flushTable = () => {
    if (currentTable.length > 0) {
      const headerRow = currentTable[0];
      const bodyRows = currentTable.slice(2); // row 1 is delimiter (|---|---|)
      elements.push(
        <div key={`table-${elements.length}`} style={{ overflowX: 'auto', margin: '12px 0' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', fontFamily: 'var(--font-mono)' }}>
            <thead>
              <tr style={{ background: 'var(--bg-elevated)', borderBottom: '1px solid var(--border-medium)' }}>
                {headerRow.map((cell, cIdx) => (
                  <th key={cIdx} style={{ padding: '6px 10px', textAlign: 'left', color: 'var(--accent-lemongrass)' }}>
                    <InlineFormatting text={cell.trim()} />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {bodyRows.map((row, rIdx) => (
                <tr key={rIdx} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                  {row.map((cell, cIdx) => (
                    <td key={cIdx} style={{ padding: '6px 10px' }}>
                      <InlineFormatting text={cell.trim()} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
      currentTable = [];
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Table line
    if (line.trim().startsWith('|') && line.trim().endsWith('|')) {
      flushList();
      const cells = line.trim().split('|').slice(1, -1);
      currentTable.push(cells);
      continue;
    } else {
      flushTable();
    }

    // List item
    if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
      currentList.push(line.trim().substring(2));
      continue;
    } else {
      flushList();
    }

    // Headers
    if (line.startsWith('### ')) {
      elements.push(<h3 key={i}><InlineFormatting text={line.substring(4)} /></h3>);
      continue;
    }
    if (line.startsWith('## ')) {
      elements.push(<h2 key={i}><InlineFormatting text={line.substring(3)} /></h2>);
      continue;
    }
    if (line.startsWith('# ')) {
      elements.push(<h1 key={i}><InlineFormatting text={line.substring(2)} /></h1>);
      continue;
    }

    // Empty line
    if (!line.trim()) {
      continue;
    }

    // Paragraph
    elements.push(
      <p key={i} style={{ margin: '6px 0' }}>
        <InlineFormatting text={line} />
      </p>
    );
  }

  flushList();
  flushTable();

  return <>{elements}</>;
}

function InlineFormatting({ text }) {
  if (!text) return null;

  // Split by inline code first `...`
  const parts = [];
  const codeRegex = /`([^`]+)`/g;
  let lastIndex = 0;
  let match;

  while ((match = codeRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ type: 'text', content: text.substring(lastIndex, match.index) });
    }
    parts.push({ type: 'code', content: match[1] });
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < text.length) {
    parts.push({ type: 'text', content: text.substring(lastIndex) });
  }

  return (
    <>
      {parts.map((p, i) => {
        if (p.type === 'code') {
          return (
            <code key={i} style={{
              background: 'var(--bg-elevated)',
              padding: '1px 5px',
              border: '1px solid var(--border-medium)',
              color: 'var(--accent-lemongrass)',
              fontFamily: 'var(--font-mono)',
              fontSize: '11.5px'
            }}>
              {p.content}
            </code>
          );
        }

        // Handle bold **...**
        const boldParts = p.content.split(/(\*\*[^*]+\*\*)/g);
        return (
          <span key={i}>
            {boldParts.map((bp, bIdx) => {
              if (bp.startsWith('**') && bp.endsWith('**')) {
                return <strong key={bIdx} style={{ color: '#fff' }}>{bp.slice(2, -2)}</strong>;
              }
              return bp;
            })}
          </span>
        );
      })}
    </>
  );
}
