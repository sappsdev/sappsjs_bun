export const sseScripts = `
let eventSources = {};

function connectStream(e, idx, path, requiresBearer = false) {
  e.preventDefault();

  if (eventSources[idx]) {
    addStreamLog(idx, '⚠️ Already connected', 'warning');
    return false;
  }

  const form = e.target;
  const formData = new FormData(form);

  let url = path;
  let bearerToken = null;

  // Handle bearer token
  if (requiresBearer) {
    bearerToken = formData.get('bearer_token');
    if (!bearerToken) {
      addStreamLog(idx, '❌ Bearer token is required for this endpoint', 'error');
      return false;
    }
    localStorage.setItem('bearer_token', bearerToken);
  }

  // Handle route parameters
  for (let [key, value] of formData.entries()) {
    if (key.startsWith('param_')) {
      const paramName = key.replace('param_', '');
      url = url.replace(':' + paramName, value);
    }
  }

  // Handle query parameters
  const query = formData.get('query');
  if (query) {
    url += '?' + query;
  }

  addStreamLog(idx, '🔄 Connecting to ' + url, 'info');
  updateStreamStatus(idx, 'connecting');

  try {
    // EventSource no soporta headers personalizados directamente
    // Si se requiere bearer token, debe ir en la URL o usar un proxy
    let eventSourceUrl = url;

    // Si requiere bearer, lo añadimos como query param (alternativa)
    if (requiresBearer && bearerToken) {
      const separator = url.includes('?') ? '&' : '?';
      eventSourceUrl += separator + 'authorization=' + encodeURIComponent(bearerToken);
    }

    const eventSource = new EventSource(eventSourceUrl);

    eventSource.onopen = function() {
      addStreamLog(idx, '✅ Stream connected successfully', 'success');
      updateStreamStatus(idx, 'connected');
      document.getElementById('stream_connect_btn_' + idx).style.display = 'none';
      document.getElementById('stream_disconnect_btn_' + idx).style.display = 'inline-block';
      document.getElementById('stream_logs_section_' + idx).style.display = 'block';
    };

    eventSource.onmessage = function(event) {
      const timestamp = new Date().toLocaleTimeString();
      try {
        const data = JSON.parse(event.data);
        addStreamLog(idx, '📥 [' + timestamp + '] ' + JSON.stringify(data, null, 2), 'message');
      } catch {
        addStreamLog(idx, '📥 [' + timestamp + '] ' + event.data, 'message');
      }
    };

    eventSource.onerror = function(error) {
      addStreamLog(idx, '❌ Stream error occurred', 'error');
      updateStreamStatus(idx, 'error');

      // Auto-reconexión después de 5 segundos si no se cerró manualmente
      if (eventSources[idx]) {
        setTimeout(() => {
          if (eventSources[idx] && eventSource.readyState === EventSource.CLOSED) {
            addStreamLog(idx, '🔄 Attempting to reconnect...', 'info');
          }
        }, 5000);
      }
    };

    // Manejar eventos personalizados (si el servidor los envía)
    eventSource.addEventListener('connected', function(event) {
      addStreamLog(idx, '📡 Custom event (connected): ' + event.data, 'info');
    });

    eventSource.addEventListener('status', function(event) {
      addStreamLog(idx, '📊 Status update: ' + event.data, 'info');
    });

    eventSources[idx] = eventSource;
  } catch (error) {
    addStreamLog(idx, '❌ Failed to connect: ' + error.message, 'error');
    updateStreamStatus(idx, 'disconnected');
  }

  return false;
}

function disconnectStream(idx) {
  const eventSource = eventSources[idx];
  if (eventSource) {
    eventSource.close();
    delete eventSources[idx];
    addStreamLog(idx, '🔌 Stream disconnected', 'info');
    updateStreamStatus(idx, 'disconnected');
    document.getElementById('stream_connect_btn_' + idx).style.display = 'inline-block';
    document.getElementById('stream_disconnect_btn_' + idx).style.display = 'none';
  }
}

function addStreamLog(idx, message, type = 'info') {
  const logsEl = document.getElementById('stream_logs_' + idx);
  if (!logsEl) return;

  const logEntry = document.createElement('div');
  logEntry.className = 'log-entry log-' + type;
  logEntry.textContent = message;
  logsEl.appendChild(logEntry);
  logsEl.scrollTop = logsEl.scrollHeight;
}

function clearStreamLogs(idx) {
  const logsEl = document.getElementById('stream_logs_' + idx);
  if (logsEl) {
    logsEl.innerHTML = '';
  }
}

function updateStreamStatus(idx, status) {
  const statusEl = document.getElementById('stream_status_' + idx);
  if (!statusEl) return;

  const badge = statusEl.querySelector('.status-badge');
  if (!badge) return;

  badge.className = 'status-badge ' + status;

  if (status === 'connected') {
    badge.textContent = 'Connected';
  } else if (status === 'connecting') {
    badge.textContent = 'Connecting...';
  } else if (status === 'error') {
    badge.textContent = 'Error';
  } else {
    badge.textContent = 'Disconnected';
  }
}

// Limpiar todas las conexiones SSE al salir
window.addEventListener('beforeunload', function() {
  Object.keys(eventSources).forEach(idx => {
    if (eventSources[idx]) {
      eventSources[idx].close();
    }
  });
});
`;
