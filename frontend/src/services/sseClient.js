// SSE Streaming Client for CITADEL WORKSPACE

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
  try {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'text/event-stream'
      },
      body: JSON.stringify({
        session_id: sessionId,
        message,
        model_override: modelOverride === 'auto' ? null : modelOverride,
        attachment: attachment ? { name: attachment.name, size: attachment.size } : null
      }),
      signal: abortSignal
    });

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
