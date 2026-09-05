import React, { useState, useRef, useEffect } from 'react';
import ModelSelector from '../components/ModelSelector';
import MarkdownRenderer from '../components/MarkdownRenderer';
import DitherProgress from '../components/DitherProgress';
import { streamChat } from '../services/sseClient';
import { DEMO_PRESETS } from '../services/mockData';
import {
  Send,
  Paperclip,
  X,
  ChevronDown,
  ChevronRight,
  RotateCcw,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  Wrench,
  Cpu
} from 'lucide-react';

let idCounter = 100;
const generateUniqueId = (prefix) => `${prefix}-${++idCounter}`;

/**
 * ChatPane - Left pane conversational interface
 * Manages message thread, live SSE streaming, collapsible step cards,
 * tool calls, model switch animations, and client-side 50MB file checks.
 */
export default function ChatPane({
  sessionId,
  onFileCreated,
  _onActiveFileChange
}) {
  const [messages, setMessages] = useState([
    {
      id: 'welcome-0',
      role: 'assistant',
      content: `### Sovereign AI Workbench Initialized // MRPL Cluster\nSystem operating in **verified air-gap mode**. No telemetry or data leaves this machine.\n\nSelect a preset scenario below or formulate an engineering query:`,
      steps: [],
      toolCalls: [],
      modelUsed: 'phi3.5:3.8b',
      isStreaming: false
    }
  ]);

  const [inputMessage, setInputMessage] = useState('');
  const [selectedModel, setSelectedModel] = useState('auto');
  const [isWorking, setIsWorking] = useState(false);
  const [activeAttachment, setActiveAttachment] = useState(null);
  const [uploadError, setUploadError] = useState('');
  const [modelSwitchBanner, setModelSwitchBanner] = useState(null);

  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const abortControllerRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, modelSwitchBanner]);

  // Client-side file validation (Max 50MB per specifications)
  const handleFileSelect = (file) => {
    setUploadError('');
    if (!file) return;

    const maxBytes = 50 * 1024 * 1024;
    if (file.size > maxBytes) {
      setUploadError(`File rejected: "${file.name}" exceeds maximum allowed 50 MB limit.`);
      return;
    }

    const acceptedTypes = ['.pdf', '.docx', '.xlsx', '.csv', '.png', '.jpg', '.jpeg'];
    const ext = '.' + file.name.split('.').pop().toLowerCase();
    if (!acceptedTypes.includes(ext)) {
      setUploadError(`Unsupported format: ${ext}. Supported: PDF, DOCX, XLSX, CSV, PNG, JPG, JPEG`);
      return;
    }

    setActiveAttachment(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  // Trigger agent message processing via SSE stream
  const handleSendMessage = async (textToSend, attachmentToSend = activeAttachment) => {
    const text = (textToSend || inputMessage).trim();
    if (!text && !attachmentToSend) return;
    if (isWorking) return;

    setUploadError('');
    const userMsgId = generateUniqueId('user');
    const assistantMsgId = generateUniqueId('assistant');

    // Add user message
    const newMessages = [
      ...messages,
      {
        id: userMsgId,
        role: 'user',
        content: text,
        attachment: attachmentToSend ? { name: attachmentToSend.name, size: attachmentToSend.size } : null,
        timestamp: new Date().toLocaleTimeString()
      },
      {
        id: assistantMsgId,
        role: 'assistant',
        content: '',
        steps: [],
        toolCalls: [],
        modelUsed: selectedModel === 'auto' ? 'Auto-Detecting...' : selectedModel,
        isStreaming: true,
        error: null
      }
    ];

    setMessages(newMessages);
    setInputMessage('');
    setActiveAttachment(null);
    setIsWorking(true);

    abortControllerRef.current = new AbortController();

    try {
      await streamChat({
        sessionId,
        message: text,
        modelOverride: selectedModel,
        attachment: attachmentToSend,
        abortSignal: abortControllerRef.current.signal,
        onEvent: (eventType, data) => {
          handleSSEEvent(assistantMsgId, eventType, data);
        }
      });
    } catch (err) {
      console.error('Chat stream error:', err);
      handleSSEEvent(assistantMsgId, 'error', {
        message: err.message || 'Stream connection interrupted',
        retryable: true
      });
    }
  };

  const handleSSEEvent = (msgId, eventType, data) => {
    setMessages((prev) =>
      prev.map((msg) => {
        if (msg.id !== msgId) return msg;

        const updated = { ...msg };

        switch (eventType) {
          case 'token':
            // Append token to current agent message (live typing effect)
            updated.content += typeof data === 'string' ? data : (data.token || '');
            break;

          case 'step_start':
            // Show new step card: "Step 1: Analyzing image..."
            updated.steps = [
              ...updated.steps,
              {
                id: generateUniqueId('step'),
                stepNumber: data.step || (updated.steps.length + 1),
                title: data.title || `Step ${data.step || updated.steps.length + 1}`,
                description: data.description || '',
                status: 'in_progress',
                collapsed: false
              }
            ];
            break;

          case 'tool_call':
            // Show "calling tool..." loading card with tool name
            updated.toolCalls = [
              ...updated.toolCalls,
              {
                id: generateUniqueId('tool'),
                tool: data.tool,
                args: data.args || {},
                status: 'running',
                result: null,
                collapsed: false
              }
            ];
            break;

          case 'tool_result':
            // Update the card with result, make it collapsible
            updated.toolCalls = updated.toolCalls.map((tc, idx) => {
              if (idx === updated.toolCalls.length - 1) {
                return {
                  ...tc,
                  status: data.success ? 'completed' : 'failed',
                  result: data.result,
                  collapsed: false
                };
              }
              return tc;
            });
            // Also mark latest step as completed if any
            if (updated.steps.length > 0) {
              const lastStep = updated.steps[updated.steps.length - 1];
              lastStep.status = 'completed';
            }
            break;

          case 'file_created':
            // Add file to Workspace Assets drawer + show preview in right pane
            if (onFileCreated) {
              onFileCreated(data);
            }
            break;

          case 'model_switch':
            // Show brief "Switching to Document Drafter..." indicator
            setModelSwitchBanner({
              model: data.target_model || 'Target Model',
              reason: data.reason || 'Task context match'
            });
            setTimeout(() => setModelSwitchBanner(null), 3000);
            updated.modelUsed = data.target_model || updated.modelUsed;
            break;

          case 'error':
            // Show error message + Retry Task button if retryable: true
            updated.error = {
              message: data.message || 'An error occurred during agent processing',
              retryable: data.retryable !== false
            };
            updated.isStreaming = false;
            setIsWorking(false);
            break;

          case 'done':
            // Re-enable chat input, mark response as complete
            updated.isStreaming = false;
            setIsWorking(false);
            break;

          default:
            break;
        }

        return updated;
      })
    );
  };

  const handleRetry = () => {
    // Retry last user message
    const lastUserMsg = [...messages].reverse().find((m) => m.role === 'user');
    if (lastUserMsg) {
      handleSendMessage(lastUserMsg.content, lastUserMsg.attachment);
    }
  };

  const toggleStepCollapse = (msgId, stepIdx) => {
    setMessages((prev) =>
      prev.map((msg) => {
        if (msg.id !== msgId) return msg;
        const newSteps = [...msg.steps];
        newSteps[stepIdx].collapsed = !newSteps[stepIdx].collapsed;
        return { ...msg, steps: newSteps };
      })
    );
  };

  const toggleToolCollapse = (msgId, toolIdx) => {
    setMessages((prev) =>
      prev.map((msg) => {
        if (msg.id !== msgId) return msg;
        const newTools = [...msg.toolCalls];
        newTools[toolIdx].collapsed = !newTools[toolIdx].collapsed;
        return { ...msg, toolCalls: newTools };
      })
    );
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        background: '#0a0d10',
        position: 'relative'
      }}
    >
      {/* Model Swap Banner Animation */}
      {modelSwitchBanner && (
        <div
          className="model-swap-active"
          style={{
            position: 'absolute',
            top: '8px',
            left: '16px',
            right: '16px',
            zIndex: 40,
            border: '1px solid var(--accent-lemongrass)',
            padding: '8px 14px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontFamily: 'var(--font-mono)',
            fontSize: '11.5px',
            boxShadow: '0 0 15px var(--accent-lemongrass-glow)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Cpu size={15} style={{ color: 'var(--accent-lemongrass)' }} />
            <span style={{ color: '#fff', fontWeight: 600 }}>
              MODEL SWITCH TRIGGERED &rarr; [ {modelSwitchBanner.model} ]
            </span>
          </div>
          <span style={{ color: 'var(--accent-lemongrass)', fontSize: '10.5px' }}>
            {modelSwitchBanner.reason}
          </span>
        </div>
      )}

      {/* Demo Scenario Preset Quick Buttons */}
      <div style={{
        padding: '10px 16px',
        background: '#11151a',
        borderBottom: '1px solid var(--border-subtle)',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        overflowX: 'auto'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          fontFamily: 'var(--font-mono)',
          fontSize: '10px',
          color: '#8b949e',
          textTransform: 'uppercase',
          whiteSpace: 'nowrap'
        }}>
          <Sparkles size={12} style={{ color: 'var(--accent-lemongrass)' }} />
          <span>PRESETS:</span>
        </div>

        {DEMO_PRESETS.map((p) => (
          <button
            key={p.id}
            onClick={() => {
              if (isWorking) return;
              setSelectedModel(p.modelKey);
              if (p.sampleFile) {
                setActiveAttachment(p.sampleFile);
              }
              handleSendMessage(p.prompt, p.sampleFile);
            }}
            disabled={isWorking}
            className="btn-control"
            style={{
              padding: '3px 8px',
              fontSize: '11px',
              whiteSpace: 'nowrap',
              background: '#161c23'
            }}
          >
            <span>{p.title}</span>
            <span style={{ color: 'var(--accent-lemongrass)', fontSize: '10px' }}>
              [{p.tag}]
            </span>
          </button>
        ))}
      </div>

      {/* Message Thread Scroll Area */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '16px 20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px'
      }}>
        {messages.map((msg) => (
          <div
            key={msg.id}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start'
            }}
          >
            {/* Message Meta Info */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontFamily: 'var(--font-mono)',
              fontSize: '10.5px',
              color: '#8b949e',
              marginBottom: '4px',
              textTransform: 'uppercase'
            }}>
              <span style={{ color: msg.role === 'user' ? '#fff' : 'var(--accent-lemongrass)', fontWeight: 600 }}>
                {msg.role === 'user' ? '[ OPERATOR // CHAITANYA ]' : `[ AGENT // ${msg.modelUsed || 'PHI-3.5'} ]`}
              </span>
              {msg.timestamp && <span>{msg.timestamp}</span>}
            </div>

            {/* Message Card */}
            <div
              className="tech-card"
              style={{
                maxWidth: '92%',
                border: msg.role === 'user' ? '1px solid #323d4b' : '1px solid var(--border-medium)',
                background: msg.role === 'user' ? '#141a22' : '#0f1318',
                padding: '14px 16px'
              }}
            >
              {/* If user attached a file */}
              {msg.attachment && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '11px',
                  color: 'var(--accent-lemongrass)',
                  background: '#090c0f',
                  border: '1px solid var(--border-subtle)',
                  padding: '4px 8px',
                  marginBottom: '10px',
                  width: 'fit-content'
                }}>
                  <Paperclip size={12} />
                  <span>ATTACHMENT: {msg.attachment.name}</span>
                </div>
              )}

              {/* Agent Reasoning Step Cards (Collapsible) */}
              {msg.steps && msg.steps.length > 0 && (
                <div style={{ marginBottom: '12px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {msg.steps.map((step, sIdx) => (
                    <div
                      key={step.id}
                      style={{
                        border: '1px solid #232c37',
                        background: '#0a0d11',
                        fontFamily: 'var(--font-mono)',
                        fontSize: '11.5px'
                      }}
                    >
                      <div
                        onClick={() => toggleStepCollapse(msg.id, sIdx)}
                        style={{
                          padding: '6px 10px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          cursor: 'pointer',
                          background: '#131820',
                          borderBottom: step.collapsed ? 'none' : '1px solid #1c232d'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          {step.status === 'completed' ? (
                            <CheckCircle2 size={13} style={{ color: 'var(--accent-lemongrass)' }} />
                          ) : (
                            <span className="pulse-dot" />
                          )}
                          <span style={{ color: '#fff', fontWeight: 600 }}>
                            Step {step.stepNumber}: {step.title}
                          </span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#8b949e' }}>
                          <span style={{ fontSize: '10px' }}>
                            {step.status === 'completed' ? '[DONE]' : '[PROCESSING]'}
                          </span>
                          {step.collapsed ? <ChevronRight size={13} /> : <ChevronDown size={13} />}
                        </div>
                      </div>

                      {!step.collapsed && (
                        <div style={{ padding: '8px 12px', color: '#9aa5b1', fontSize: '11px', lineHeight: '1.4' }}>
                          <div>{step.description}</div>
                          {step.status !== 'completed' && (
                            <DitherProgress value={70} totalBlocks={16} statusText="IN PROGRESS" />
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Tool Calls Cards (Interleaved, collapsible) */}
              {msg.toolCalls && msg.toolCalls.length > 0 && (
                <div style={{ marginBottom: '12px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {msg.toolCalls.map((tc, tcIdx) => (
                    <div
                      key={tc.id}
                      style={{
                        border: '1px solid #1e2530',
                        background: '#07090c',
                        fontFamily: 'var(--font-mono)',
                        fontSize: '11px'
                      }}
                    >
                      <div
                        onClick={() => toggleToolCollapse(msg.id, tcIdx)}
                        style={{
                          padding: '5px 10px',
                          background: '#0f141b',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          cursor: 'pointer'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Wrench size={12} style={{ color: '#38bdf8' }} />
                          <span style={{ color: '#38bdf8' }}>TOOL: {tc.tool}</span>
                          <span style={{ color: '#6e7681' }}>
                            {tc.status === 'running' ? '(CALLING...)' : '(EXECUTED)'}
                          </span>
                        </div>
                        {tc.collapsed ? <ChevronRight size={12} /> : <ChevronDown size={12} />}
                      </div>

                      {!tc.collapsed && (
                        <div style={{ padding: '8px 10px', borderTop: '1px solid #19202a' }}>
                          <div style={{ color: '#768390', fontSize: '10px', marginBottom: '4px' }}>
                            ARGUMENTS: {JSON.stringify(tc.args)}
                          </div>
                          {tc.result && (
                            <pre style={{
                              background: '#040608',
                              padding: '6px 8px',
                              color: '#a3e635',
                              fontSize: '11px',
                              overflowX: 'auto',
                              margin: 0
                            }}>
                              {tc.result}
                            </pre>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Message Markdown Content */}
              <MarkdownRenderer content={msg.content} />

              {/* Streaming Blinking Cursor */}
              {msg.isStreaming && <span className="typing-cursor" />}

              {/* Error Callout with Retry Task Button */}
              {msg.error && (
                <div style={{
                  marginTop: '12px',
                  border: '1px solid var(--status-rose)',
                  background: 'rgba(244, 63, 94, 0.1)',
                  padding: '10px 14px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <AlertTriangle size={15} style={{ color: 'var(--status-rose)' }} />
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11.5px', color: '#fda4af' }}>
                      {msg.error.message}
                    </span>
                  </div>
                  {msg.error.retryable && (
                    <button
                      onClick={handleRetry}
                      className="btn-control btn-control-danger"
                      style={{ padding: '3px 10px', fontSize: '11px' }}
                    >
                      <RotateCcw size={12} />
                      <span>[ RETRY TASK ]</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Upload Error Banner */}
      {uploadError && (
        <div style={{
          background: '#240a0f',
          borderTop: '1px solid var(--status-rose)',
          padding: '6px 16px',
          color: '#fda4af',
          fontFamily: 'var(--font-mono)',
          fontSize: '11px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <span>{uploadError}</span>
          <button
            onClick={() => setUploadError('')}
            style={{ background: 'transparent', border: 'none', color: '#fda4af', cursor: 'pointer' }}
          >
            <X size={13} />
          </button>
        </div>
      )}

      {/* Active Attachment Pill / Tag */}
      {activeAttachment && (
        <div style={{
          padding: '6px 16px',
          background: '#12171e',
          borderTop: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontFamily: 'var(--font-mono)',
          fontSize: '11px'
        }}>
          <span style={{ color: '#8b949e' }}>READY TO ATTACH:</span>
          <span style={{ color: 'var(--accent-lemongrass)', fontWeight: 600 }}>
            {activeAttachment.name}
          </span>
          <span style={{ color: '#6e7681' }}>
            ({(activeAttachment.size / (1024 * 1024)).toFixed(2)} MB)
          </span>
          <button
            onClick={() => setActiveAttachment(null)}
            style={{ background: 'transparent', border: 'none', color: '#888', cursor: 'pointer', marginLeft: 'auto' }}
          >
            <X size={13} />
          </button>
        </div>
      )}

      {/* Bottom Input Controls Bar */}
      <div style={{
        padding: '12px 16px',
        background: '#0c0f13',
        borderTop: '1px solid var(--border-medium)'
      }}>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          style={{ display: 'flex', gap: '8px', alignItems: 'center' }}
        >
          {/* File Upload Trigger */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={(e) => {
              if (e.target.files && e.target.files.length > 0) {
                handleFileSelect(e.target.files[0]);
              }
            }}
            accept=".pdf,.docx,.xlsx,.csv,.png,.jpg,.jpeg"
            style={{ display: 'none' }}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isWorking}
            className="btn-control"
            title="Attach file for this task (Max 50 MB, PDF/DOCX/XLSX/PNG/JPG)"
            style={{ height: '36px', padding: '0 10px' }}
          >
            <Paperclip size={14} />
          </button>

          {/* Model Selector Dropdown */}
          <ModelSelector
            selectedModel={selectedModel}
            onSelectModel={setSelectedModel}
            disabled={isWorking}
          />

          {/* Main Text Input Field */}
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            disabled={isWorking}
            placeholder={
              isWorking
                ? "Agent is working on sovereign execution... Please wait"
                : "Formulate task (e.g., 'Draft Approval Note from Inspection Report')..."
            }
            style={{
              flex: 1,
              height: '36px',
              background: isWorking ? '#080a0d' : '#131820',
              border: '1px solid var(--border-medium)',
              color: '#fff',
              padding: '0 12px',
              fontFamily: 'var(--font-ui)',
              fontSize: '13px',
              outline: 'none',
              cursor: isWorking ? 'not-allowed' : 'text'
            }}
          />

          {/* Send / Execute Button */}
          <button
            type="submit"
            disabled={isWorking || (!inputMessage.trim() && !activeAttachment)}
            className="btn-control btn-control-accent"
            style={{ height: '36px', padding: '0 16px', fontSize: '12px' }}
          >
            <span>[ EXECUTE ]</span>
            <Send size={13} />
          </button>
        </form>

        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginTop: '6px',
          fontFamily: 'var(--font-mono)',
          fontSize: '10px',
          color: '#556577'
        }}>
          <span>ACCEPTED: PDF, DOCX, XLSX, CSV, PNG, JPG (&le; 50 MB)</span>
          <span>DRAG & DROP SUPPORTED</span>
        </div>
      </div>
    </div>
  );
}
