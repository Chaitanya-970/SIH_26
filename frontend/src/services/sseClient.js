// SSE Streaming Client for CITADEL WORKSPACE

const SESSION_ID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function createSessionId() {
  if (typeof crypto?.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (character) => {
    const random = Math.random() * 16 | 0;
    const value = character === 'x' ? random : (random & 0x3 | 0x8);
    return value.toString(16);
  });
}

function normalizeSessionId(sessionId) {
  return SESSION_ID_PATTERN.test(sessionId || '') ? sessionId : createSessionId();
}

/**
 * Stream reader parsing Server-Sent Events from POST /api/chat
 * Handles live event dispatch: token, step_start, tool_call, tool_result, file_created, model_switch, sources_found, error, done
 */
export async function streamChat({
  sessionId = 'demo-session',
  message,
  modelOverride = null,
  attachment = null,
  onEvent,
  abortSignal
}) {
  const validSessionId = normalizeSessionId(sessionId);

  try {
    let fetchOptions = {
      method: 'POST',
      headers: {
        'Accept': 'text/event-stream'
      },
      signal: abortSignal
    };

    if (attachment) {
      const formData = new FormData();
      formData.append('session_id', validSessionId);
      formData.append('message', message);
      if (modelOverride && modelOverride !== 'auto') {
        formData.append('model_override', modelOverride);
      }
      formData.append('attachment', attachment);
      fetchOptions.body = formData;
    } else {
      fetchOptions.headers['Content-Type'] = 'application/json';
      fetchOptions.body = JSON.stringify({
        session_id: validSessionId,
        message,
        model_override: modelOverride === 'auto' ? null : modelOverride
      });
    }

    const response = await fetch('/api/chat', fetchOptions);

    if (!response.ok) {
      throw new Error(`Server returned ${response.status}`);
    }

    // Read real SSE stream
    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let buffer = '';

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n\n');
      buffer = lines.pop(); // keep partial chunk

      for (const block of lines) {
        if (!block.trim()) continue;
        parseAndDispatchSSEBlock(block, onEvent);
      }
    }

    if (buffer.trim()) {
      parseAndDispatchSSEBlock(buffer, onEvent);
    }
  } catch (err) {
    if (err.name === 'AbortError') {
      console.log('[SSE] Stream aborted by user');
      return;
    }
    console.warn('[SSE] Chat streaming failed:', err.message);
    onEvent('error', { message: 'Backend unavailable' });
  }
}

function parseAndDispatchSSEBlock(block, onEvent) {
  let eventType = 'token';
  let dataStr = '';

  const lines = block.split('\n');
  for (const line of lines) {
    if (line.startsWith('event:')) {
      eventType = line.replace('event:', '').trim();
    } else if (line.startsWith('data:')) {
      dataStr += line.replace('data:', '').trim();
    }
  }

  if (!dataStr) return;

  try {
    const parsed = JSON.parse(dataStr);
    onEvent(eventType, parsed);
  } catch {
    onEvent(eventType, dataStr);
  }
}
