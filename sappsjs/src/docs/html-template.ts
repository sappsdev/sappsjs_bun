import { generateRouteCardTemplate } from './card-template';
import { docsScripts } from './scripts';
import { generateSidebarTemplate } from './sidebar-template';
import { docsStyles } from './styles';
import type { DocsData } from './types';
import { generateWebSocketCardTemplate } from './ws-card-template';
import { wsScripts } from './ws-script';
import { wsStyles } from './ws-styles';
import { sseScripts } from './sse-scripts';
import { sseStyles } from './sse-styles';

export function generateHTMLTemplate(docs: DocsData): string {
	const hasWebSockets = docs.websockets.length > 0;
	const hasStreams = docs.http.some((doc) => doc.isStream);

	return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>API Documentation - SappsJS</title>
  <style>${docsStyles}${hasWebSockets ? wsStyles : ''}${hasStreams ? sseStyles : ''}</style>
</head>
<body>
  ${generateSidebarTemplate(docs)}

  <div class="main-content">
    <div class="welcome-screen" id="welcome">
      <div class="welcome-icon">📚</div>
      <h2>Welcome to the API Documentation</h2>
      <p>Select an endpoint from the sidebar to view its details</p>
      <p>and test it directly from here</p>
    </div>

    ${docs.http.map((doc, idx) => generateRouteCardTemplate(doc, idx)).join('')}
    ${docs.websockets.map((doc, idx) => generateWebSocketCardTemplate(doc, idx)).join('')}
  </div>

  <script>
    ${docsScripts}
    ${hasWebSockets ? wsScripts : ''}
    ${hasStreams ? sseScripts : ''}

    function switchMainTab(tabName) {
      // Update tab buttons
      document.querySelectorAll('.main-tab-btn').forEach(btn => {
        btn.classList.remove('active');
      });
      event.target.classList.add('active');

      // Update tab content
      document.querySelectorAll('.main-tab-content').forEach(content => {
        content.classList.remove('active');
      });
      document.getElementById('main-tab-' + tabName).classList.add('active');

      // Hide all active cards
      document.querySelectorAll('.route-card, .ws-card').forEach(card => {
        card.classList.remove('active');
      });

      // Show welcome screen
      if (tabName === 'http') {
        document.getElementById('welcome').style.display = 'block';
      } else {
        document.getElementById('ws-welcome').style.display = 'block';
      }

      // Reset sidebar selection
      document.querySelectorAll('.endpoint-item').forEach(item => {
        item.classList.remove('active');
      });
    }
  </script>
</body>
</html>
`;
}
