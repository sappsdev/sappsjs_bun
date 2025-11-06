export const wsStyles = `
/* WebSocket specific styles */
.method.WS {
  background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
  color: white;
  box-shadow: 0 2px 8px rgba(139, 92, 246, 0.3);
}

.endpoint-method.WS {
  background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
  color: white;
  box-shadow: 0 2px 8px rgba(139, 92, 246, 0.3);
}

.ws-card {
  background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
  border-radius: 16px;
  padding: 40px;
  border: 1px solid #e2e8f0;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08), 0 0 0 1px rgba(0, 0, 0, 0.02);
  display: none;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.ws-card.active {
  display: block;
  animation: slideIn 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.ws-handlers {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 12px;
}

.handler-badge {
  background: #10b981;
  color: white;
  padding: 8px 16px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  text-transform: none;
  letter-spacing: 0.3px;
}

.handler-badge.disabled {
  background: #94a3b8;
  opacity: 0.6;
}

.ws-connection-section {
  display: flex;
  gap: 16px;
  margin: 20px 0;
  flex-wrap: wrap;
  align-items: center;
}

.ws-connection-section button {
  flex: 0 0 auto;
  margin: 0;
  padding: 14px 28px;
  border-radius: 10px;
  font-weight: 600;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.ws-connection-section .ws-status {
  flex: 1;
  margin: 0;
  padding: 0;
  background: none;
  border-radius: 0;
  text-align: left;
  border: none;
  min-width: 200px;
}

.disconnect-btn {
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
  box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
  transition: all 0.3s ease;
}

.disconnect-btn:hover {
  background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
  box-shadow: 0 6px 16px rgba(239, 68, 68, 0.4);
  transform: translateY(-2px);
}

.ws-status {
  display: inline-block;
}

.status-badge {
  padding: 10px 24px;
  border-radius: 24px;
  font-weight: 700;
  font-size: 13px;
  display: inline-block;
  text-transform: uppercase;
  letter-spacing: 1px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
}

.status-badge.connected {
  background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%);
  color: #065f46;
  box-shadow: 0 2px 12px rgba(16, 185, 129, 0.3);
  animation: pulse 2s ease-in-out infinite;
}

.status-badge.connecting {
  background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
  color: #92400e;
  animation: pulse 1.5s ease-in-out infinite;
}

.status-badge.disconnected {
  background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%);
  color: #991b1b;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.8;
  }
}

.ws-message-section {
  margin: 28px 0;
}

.message-input-group {
  display: flex;
  gap: 12px;
  align-items: stretch;
}

.message-input-group input {
  flex: 1;
  padding: 14px 18px;
  border: 2px solid #e2e8f0;
  border-radius: 10px;
  font-size: 14px;
  transition: all 0.3s ease;
  background: white;
}

.message-input-group input:focus {
  border-color: #8b5cf6;
  box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.1);
  outline: none;
}

.message-input-group button {
  margin: 0;
  padding: 14px 28px;
  min-width: auto;
  border-radius: 10px;
  font-weight: 600;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.message-input-group button:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.ws-logs-section {
  margin-top: 32px;
}

.ws-logs {
  background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
  border-radius: 12px;
  padding: 20px;
  min-height: 240px;
  max-height: 450px;
  overflow-y: auto;
  font-family: 'SF Mono', 'Monaco', 'Consolas', 'Courier New', monospace;
  font-size: 13px;
  margin-bottom: 16px;
  border: 2px solid #1e293b;
  box-shadow: inset 0 2px 8px rgba(0, 0, 0, 0.3), 0 4px 12px rgba(0, 0, 0, 0.2);
  position: relative;
}

.ws-logs::-webkit-scrollbar {
  width: 10px;
}

.ws-logs::-webkit-scrollbar-track {
  background: #1e293b;
  border-radius: 10px;
}

.ws-logs::-webkit-scrollbar-thumb {
  background: #475569;
  border-radius: 10px;
  transition: background 0.3s ease;
}

.ws-logs::-webkit-scrollbar-thumb:hover {
  background: #64748b;
}

.log-entry {
  padding: 10px 12px;
  margin: 6px 0;
  border-radius: 6px;
  line-height: 1.7;
  word-wrap: break-word;
  font-size: 13px;
  border-left: 3px solid transparent;
  transition: all 0.2s ease;
}

.log-entry:hover {
  background: rgba(255, 255, 255, 0.03);
}

.log-info {
  color: #60a5fa;
  border-left-color: #60a5fa;
}

.log-success {
  color: #34d399;
  border-left-color: #34d399;
}

.log-error {
  color: #f87171;
  background: rgba(248, 113, 113, 0.08);
  border-left-color: #f87171;
}

.log-warning {
  color: #fbbf24;
  border-left-color: #fbbf24;
}

.log-message {
  color: #a78bfa;
  background: rgba(167, 139, 250, 0.12);
  border-left-color: #a78bfa;
}

.log-sent {
  color: #4ade80;
  background: rgba(74, 222, 128, 0.12);
  border-left-color: #4ade80;
}

.clear-logs-btn {
  background: linear-gradient(135deg, #64748b 0%, #475569 100%);
  padding: 12px 24px;
  border-radius: 10px;
  font-weight: 600;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.clear-logs-btn:hover {
  background: linear-gradient(135deg, #475569 0%, #334155 100%);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

/* WebSocket sidebar section */
.sidebar-section-title {
  padding: 16px 20px 8px;
  font-size: 11px;
  font-weight: 700;
  color: #94a3b8;
  text-transform: uppercase;
  letter-spacing: 1px;
  border-top: 1px solid #334155;
  margin-top: 8px;
}
`;
