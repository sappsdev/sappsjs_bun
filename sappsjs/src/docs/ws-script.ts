export const wsScripts = `
let webSockets = {};

function getWebSocketUrl(path, requiresToken, idx) {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const host = window.location.host;
  let url = protocol + '//' + host + path;

  if (requiresToken) {
    const token = document.getElementById('ws_token_' + idx).value;
    if (!token) {
      addWebSocketLog(idx, '❌ Token is required', 'error');
      return null;
    }
    localStorage.setItem('ws_token', token);
    url += '?token=' + encodeURIComponent(token);
  }

  return url;
}

function connectWebSocket(idx, path, requiresToken = false) {
  if (webSockets[idx]) {
    addWebSocketLog(idx, '⚠️ Already connected', 'warning');
    return;
  }

  const url = getWebSocketUrl(path, requiresToken, idx);
  if (!url) return;

  addWebSocketLog(idx, '🔄 Connecting to ' + url, 'info');
  updateConnectionStatus(idx, 'connecting');

  try {
    const ws = new WebSocket(url);

    ws.onopen = function() {
      addWebSocketLog(idx, '✅ Connected successfully', 'success');
      updateConnectionStatus(idx, 'connected');
      document.getElementById('ws_connect_btn_' + idx).style.display = 'none';
      document.getElementById('ws_disconnect_btn_' + idx).style.display = 'inline-block';
      document.getElementById('ws_message_section_' + idx).style.display = 'block';
    };

    ws.onmessage = function(event) {
      const timestamp = new Date().toLocaleTimeString();
      addWebSocketLog(idx, '📥 [' + timestamp + '] ' + event.data, 'message');
    };

    ws.onerror = function(error) {
      addWebSocketLog(idx, '❌ Error: ' + error.message, 'error');
    };

    ws.onclose = function(event) {
      addWebSocketLog(idx, '🚪 Connection closed (Code: ' + event.code + ')', 'info');
      updateConnectionStatus(idx, 'disconnected');
      document.getElementById('ws_connect_btn_' + idx).style.display = 'inline-block';
      document.getElementById('ws_disconnect_btn_' + idx).style.display = 'none';
      document.getElementById('ws_message_section_' + idx).style.display = 'none';
      delete webSockets[idx];
    };

    webSockets[idx] = ws;
  } catch (error) {
    addWebSocketLog(idx, '❌ Failed to connect: ' + error.message, 'error');
    updateConnectionStatus(idx, 'disconnected');
  }
}

function disconnectWebSocket(idx) {
  const ws = webSockets[idx];
  if (ws) {
    ws.close();
    addWebSocketLog(idx, '🔌 Disconnecting...', 'info');
  }
}

function sendWebSocketMessage(idx) {
  const ws = webSockets[idx];
  const messageInput = document.getElementById('ws_message_' + idx);
  const message = messageInput.value.trim();

  if (!ws) {
    addWebSocketLog(idx, '❌ Not connected', 'error');
    return;
  }

  if (!message) {
    addWebSocketLog(idx, '⚠️ Message cannot be empty', 'warning');
    return;
  }

  try {
    ws.send(message);
    const timestamp = new Date().toLocaleTimeString();
    addWebSocketLog(idx, '📤 [' + timestamp + '] ' + message, 'sent');
    messageInput.value = '';
  } catch (error) {
    addWebSocketLog(idx, '❌ Failed to send: ' + error.message, 'error');
  }
}

function addWebSocketLog(idx, message, type = 'info') {
  const logsEl = document.getElementById('ws_logs_' + idx);
  const logEntry = document.createElement('div');
  logEntry.className = 'log-entry log-' + type;
  logEntry.textContent = message;
  logsEl.appendChild(logEntry);
  logsEl.scrollTop = logsEl.scrollHeight;

  const logsSection = document.getElementById('ws_logs_section_' + idx);
  if (logsSection) {
    logsSection.style.display = 'block';
  }
}

function clearWebSocketLogs(idx) {
  const logsEl = document.getElementById('ws_logs_' + idx);
  logsEl.innerHTML = '';
}

function updateConnectionStatus(idx, status) {
  const statusEl = document.getElementById('ws_status_' + idx);
  const badge = statusEl.querySelector('.status-badge');

  badge.className = 'status-badge ' + status;

  if (status === 'connected') {
    badge.textContent = 'Connected';
  } else if (status === 'connecting') {
    badge.textContent = 'Connecting...';
  } else {
    badge.textContent = 'Disconnected';
  }
}

function clearWsToken(idx) {
  if (confirm('¿Está seguro de que desea eliminar el token guardado?')) {
    localStorage.removeItem('ws_token');
    const tokenInput = document.getElementById('ws_token_' + idx);
    if (tokenInput) {
      tokenInput.value = '';
    }
  }
}

function showWebSocketEndpoint(idx) {
  // Ocultar ambos welcome screens
  document.getElementById('welcome').style.display = 'none';
  const wsWelcome = document.getElementById('ws-welcome');
  if (wsWelcome) wsWelcome.style.display = 'none';

  // Ocultar todas las cards
  document.querySelectorAll('.route-card, .ws-card').forEach(card => {
    card.classList.remove('active');
  });

  document.querySelectorAll('.endpoint-item').forEach(item => {
    item.classList.remove('active');
  });

  document.getElementById('ws-endpoint-' + idx).classList.add('active');
  document.getElementById('sidebar-ws-' + idx).classList.add('active');

  document.querySelector('.main-content').scrollTop = 0;
}

// Initialize websocket tokens on page load
document.addEventListener('DOMContentLoaded', function() {
  const savedToken = localStorage.getItem('ws_token');
  if (savedToken) {
    document.querySelectorAll('input[id^="ws_token_"]').forEach(input => {
      input.value = savedToken;
    });
  }
});
`;
