import type { WebSocketDoc } from './types';

export function generateWebSocketCardTemplate(doc: WebSocketDoc, idx: number): string {
	const wsUrl = doc.requiresToken ? `${doc.path}?token=\${token}` : doc.path;

	return `
<div class="ws-card" id="ws-endpoint-${idx}">
  <div class="route-header">
    <span class="method WS">WS</span>
    <span class="path">${doc.path}</span>
  </div>

	${
		(doc.middlewares && doc.middlewares.length > 0) || doc.requiresToken || doc.handlers
			? `
    <div class="section">
    ${
			doc.middlewares && doc.middlewares.length > 0
				? `
        <div class="section-title">Middlewares</div>
        ${doc.middlewares.map((m) => `<span class="middleware-badge">${m}</span>`).join('')}
    `
				: ''
		}

		${
			doc.requiresToken
				? `
		<div class="section-title">Query Parameters</div>
		<div class="param-item">
			<span class="param-name">token</span>
			<span class="param-type">string (required)</span>
		</div>
		`
				: ''
		}

		<div class="section-title">Available Handlers</div>
		<div class="ws-handlers">
			${
				doc.handlers.open
					? '<span class="handler-badge">🔌 open</span>'
					: '<span class="handler-badge disabled">🔌 open</span>'
			}
			${
				doc.handlers.message
					? '<span class="handler-badge">💬 message</span>'
					: '<span class="handler-badge disabled">💬 message</span>'
			}
			${
				doc.handlers.close
					? '<span class="handler-badge">🚪 close</span>'
					: '<span class="handler-badge disabled">🚪 close</span>'
			}
			${
				doc.handlers.error
					? '<span class="handler-badge">⚠️ error</span>'
					: '<span class="handler-badge disabled">⚠️ error</span>'
			}
			${
				doc.handlers.drain
					? '<span class="handler-badge">💧 drain</span>'
					: '<span class="handler-badge disabled">💧 drain</span>'
			}
		</div>
    </div>
  `
			: ''
	}

	 <div class="section">

      <div class="section-title">🧪 Try WebSocket</div>

      ${
				doc.requiresToken
					? `
    		<div class="bearer-section">
   			<label>🔑 Token <span class="required-indicator">*</span>:</label>
   			<div class="bearer-input-group">
    				<input type="text" id="ws_token_${idx}" placeholder="Enter your authentication token" required />
    				<button type="button" class="clear-token-btn" onclick="clearWsToken(${idx})" title="Clear token">
   					✕
    				</button>
   			</div>
   			<small class="helper-text">This token will be saved and reused across page refreshes</small>
    		</div>
    		`
					: ''
			}

      <div class="ws-connection-section">
        <button type="button" id="ws_connect_btn_${idx}" onclick="connectWebSocket(${idx}, '${doc.path}', ${doc.requiresToken})">
          🔌 Connect
        </button>
        <button type="button" id="ws_disconnect_btn_${idx}" onclick="disconnectWebSocket(${idx})" style="display: none;" class="disconnect-btn">
          🚪 Disconnect
        </button>

        <div class="ws-status" id="ws_status_${idx}">
          <span class="status-badge disconnected">Disconnected</span>
        </div>
      </div>

      <div class="ws-message-section" id="ws_message_section_${idx}" style="display: none;">
        <label>📤 Send Message:</label>
        <div class="message-input-group">
          <input type="text" id="ws_message_${idx}" placeholder="Type your message here..." onkeypress="if(event.key==='Enter') sendWebSocketMessage(${idx})" />
          <button type="button" onclick="sendWebSocketMessage(${idx})">
            Send
          </button>
        </div>
      </div>

      <div class="ws-logs-section" id="ws_logs_section_${idx}" style="display: none;">
        <div class="section-title">📋 Connection Logs</div>
        <div class="ws-logs" id="ws_logs_${idx}"></div>
        <button type="button" class="clear-logs-btn" onclick="clearWebSocketLogs(${idx})">
          🗑️ Clear Logs
        </button>
      </div>
  </div>
</div>

<script>
  // Load saved token on page load for websocket ${idx}
  (function() {
    const savedToken = localStorage.getItem('ws_token');
    const tokenInput = document.getElementById('ws_token_${idx}');
    if (savedToken && tokenInput) {
      tokenInput.value = savedToken;
    }
  })();
</script>
`;
}
