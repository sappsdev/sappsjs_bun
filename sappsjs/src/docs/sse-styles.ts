export const sseStyles = `
/* Stream Badge */
.stream-badge {
  display: inline-block;
  padding: 4px 12px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 600;
  margin-left: 8px;
  animation: pulse 2s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.7;
  }
}

/* Stream Info */
.stream-info {
  background: linear-gradient(135deg, #667eea15 0%, #764ba215 100%);
  border-left: 3px solid #667eea;
  padding: 12px 16px;
  border-radius: 8px;
  margin-top: 12px;
}

.stream-info p {
  margin: 8px 0;
  color: #4a5568;
  font-size: 14px;
}

.stream-info strong {
  color: #667eea;
}

/* Stream Controls */
.stream-controls {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 16px;
}

.stream-controls button {
  flex: 0 0 auto;
}

.stream-status {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: flex-end;
}

.stream-status .status-badge {
  padding: 6px 16px;
  border-radius: 20px;
  font-size: 13px;
  font-weight: 600;
  transition: all 0.3s ease;
}

.stream-status .status-badge.connected {
  background: #48bb78;
  color: white;
  box-shadow: 0 0 0 4px rgba(72, 187, 120, 0.2);
}

.stream-status .status-badge.connecting {
  background: #ed8936;
  color: white;
  animation: pulse 1.5s ease-in-out infinite;
}

.stream-status .status-badge.disconnected {
  background: #cbd5e0;
  color: #4a5568;
}

.stream-status .status-badge.error {
  background: #f56565;
  color: white;
}

/* Stream Logs Section */
.stream-logs-section {
  margin-top: 24px;
}

.stream-logs {
  background: #1a202c;
  border-radius: 8px;
  padding: 16px;
  max-height: 400px;
  overflow-y: auto;
  font-family: 'Courier New', monospace;
  font-size: 13px;
  line-height: 1.6;
  margin: 12px 0;
}

.stream-logs .log-entry {
  padding: 8px 12px;
  margin: 4px 0;
  border-radius: 4px;
  word-wrap: break-word;
  white-space: pre-wrap;
}

.stream-logs .log-info {
  background: rgba(66, 153, 225, 0.1);
  border-left: 3px solid #4299e1;
  color: #90cdf4;
}

.stream-logs .log-success {
  background: rgba(72, 187, 120, 0.1);
  border-left: 3px solid #48bb78;
  color: #9ae6b4;
}

.stream-logs .log-error {
  background: rgba(245, 101, 101, 0.1);
  border-left: 3px solid #f56565;
  color: #fc8181;
}

.stream-logs .log-warning {
  background: rgba(237, 137, 54, 0.1);
  border-left: 3px solid #ed8936;
  color: #fbd38d;
}

.stream-logs .log-message {
  background: rgba(159, 122, 234, 0.1);
  border-left: 3px solid #9f7aea;
  color: #d6bcfa;
}

.clear-logs-btn {
  background: #e53e3e;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 13px;
  font-weight: 600;
  transition: all 0.2s ease;
}

.clear-logs-btn:hover {
  background: #c53030;
  transform: translateY(-1px);
}

/* Scrollbar styling for logs */
.stream-logs::-webkit-scrollbar {
  width: 8px;
}

.stream-logs::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 4px;
}

.stream-logs::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.2);
  border-radius: 4px;
}

.stream-logs::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.3);
}
`;
