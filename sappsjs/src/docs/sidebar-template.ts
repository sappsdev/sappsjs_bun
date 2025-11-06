import type { DocsData } from './types';

export function generateSidebarTemplate(docs: DocsData): string {
	const hasWebSockets = docs.websockets.length > 0;
	const totalEndpoints = docs.http.length + docs.websockets.length;

	return `
<div class="sidebar">
  <div class="sidebar-header">
    <h1>🚀 API Docs</h1>
    <p>${totalEndpoints} endpoint${totalEndpoints !== 1 ? 's' : ''} available</p>
  </div>
  <div class="sidebar-content">
    <div class="sidebar-section-title">HTTP Endpoints (${docs.http.length})</div>
    ${docs.http
			.map(
				(doc, idx) => `
      <div class="endpoint-item" onclick="showEndpoint(${idx})" id="sidebar-${idx}">
        <span class="endpoint-method ${doc.method}">${doc.method}</span>
        <span class="endpoint-path">${doc.path}</span>
        ${doc.isStream ? '<span class="stream-icon" title="SSE Stream">📡</span>' : ''}
      </div>
    `
			)
			.join('')}

    ${
			hasWebSockets
				? `
    <div class="sidebar-section-title">WebSocket Endpoints (${docs.websockets.length})</div>
    ${docs.websockets
			.map(
				(doc, idx) => `
      <div class="endpoint-item" onclick="showWebSocketEndpoint(${idx})" id="sidebar-ws-${idx}">
        <span class="endpoint-method WS">WS</span>
        <span class="endpoint-path">${doc.path}</span>
      </div>
    `
			)
			.join('')}
    `
				: ''
		}
  </div>
</div>
`;
}
