export const docsStyles = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  background: #ffffff;
  display: flex;
  height: 100vh;
  overflow: hidden;
}

/* ============================================
   SIDEBAR
   ============================================ */
.sidebar {
  width: 320px;
  background: #1e293b;
  color: white;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  border-right: 1px solid #e2e8f0;
  box-shadow: 2px 0 8px rgba(0, 0, 0, 0.08);
}

.sidebar-header {
  padding: 24px;
  background: #0f172a;
  border-bottom: 1px solid #334155;
}

.sidebar-header h1 {
  font-size: 20px;
  color: white;
  display: flex;
  align-items: center;
  gap: 10px;
  font-weight: 600;
  letter-spacing: -0.3px;
}

.sidebar-header p {
  font-size: 13px;
  color: #94a3b8;
  margin-top: 6px;
  font-weight: 500;
}

.sidebar-content {
  flex: 1;
  overflow-y: auto;
  padding: 8px 0;
}

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

.endpoint-item {
  padding: 12px 20px;
  margin: 2px 12px;
  cursor: pointer;
  border-radius: 8px;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 12px;
  position: relative;
}

.endpoint-item::before {
  content: '';
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 3px;
  height: 0;
  background: #3b82f6;
  border-radius: 0 2px 2px 0;
  transition: height 0.2s ease;
}

.endpoint-item:hover {
  background: #334155;
}

.endpoint-item:hover::before {
  height: 60%;
}

.endpoint-item.active {
  background: #334155;
  border-left: 3px solid #3b82f6;
  padding-left: 17px;
}

.endpoint-method {
  padding: 4px 10px;
  border-radius: 4px;
  font-size: 10px;
  font-weight: 700;
  min-width: 58px;
  text-align: center;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.endpoint-method.GET {
  background: #3b82f6;
  color: white;
}

.endpoint-method.POST {
  background: #10b981;
  color: white;
}

.endpoint-method.PUT {
  background: #f59e0b;
  color: white;
}

.endpoint-method.DELETE {
  background: #ef4444;
  color: white;
}

.endpoint-method.PATCH {
  background: #8b5cf6;
  color: white;
}

.endpoint-method.WS {
  background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
  color: white;
  box-shadow: 0 2px 8px rgba(139, 92, 246, 0.3);
}

.endpoint-path {
  font-size: 13px;
  color: #e2e8f0;
  font-family: 'SF Mono', 'Monaco', 'Courier New', monospace;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-weight: 500;
}

/* ============================================
   MAIN CONTENT
   ============================================ */
.main-content {
  flex: 1;
  overflow-y: auto;
  padding: 32px 40px;
  background: #ffffff;
}

/* ============================================
   ROUTE CARD
   ============================================ */
.route-card,
.ws-card {
  display: none;
  transition: opacity 0.3s ease;
}

.route-card.active,
.ws-card.active {
  display: block;
  animation: slideIn 0.3s ease;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.route-header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 24px;
  padding-bottom: 20px;
  border-bottom: 2px solid #f1f5f9;
}

.method {
  padding: 8px 18px;
  border-radius: 6px;
  font-weight: 700;
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.8px;
}

.method.GET {
  background: #3b82f6;
  color: white;
}

.method.POST {
  background: #10b981;
  color: white;
}

.method.PUT {
  background: #f59e0b;
  color: white;
}

.method.DELETE {
  background: #ef4444;
  color: white;
}

.method.PATCH {
  background: #8b5cf6;
  color: white;
}

.method.WS {
  background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
  color: white;
  box-shadow: 0 2px 8px rgba(139, 92, 246, 0.3);
}

.path {
  font-family: 'SF Mono', 'Monaco', 'Courier New', monospace;
  font-size: 18px;
  color: #0f172a;
  font-weight: 600;
}

/* ============================================
   SECTIONS (GRAY CARDS)
   ============================================ */
.section {
  margin-top: 24px;
  padding: 24px;
  background: #f8fafc;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
}

.section-title {
  font-weight: 700;
  color: #0f172a;
  margin-bottom: 16px;
  font-size: 13px;
  text-transform: uppercase;
  letter-spacing: 1px;
}

/* ============================================
   TRY IT FORM
   ============================================ */
.try-it-form {
  margin-top: 24px;
  padding: 24px;
  background: #f8fafc;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
}

/* ============================================
   FORM ELEMENTS
   ============================================ */
input,
textarea,
select {
  width: 100%;
  padding: 12px 14px;
  margin: 8px 0;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  font-family: inherit;
  font-size: 14px;
  background: #ffffff;
  color: #0f172a;
  transition: all 0.2s ease;
}

input:focus,
textarea:focus,
select:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

input::placeholder,
textarea::placeholder {
  color: #94a3b8;
}

textarea {
  min-height: 140px;
  font-family: 'SF Mono', 'Monaco', 'Courier New', monospace;
  resize: vertical;
}

label {
  display: block;
  font-weight: 600;
  color: #334155;
  margin-top: 16px;
  margin-bottom: 6px;
  font-size: 13px;
  letter-spacing: 0.2px;
}

button {
  background: #3b82f6;
  color: white;
  border: none;
  padding: 12px 28px;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  margin-top: 16px;
  font-size: 14px;
  transition: all 0.2s ease;
  letter-spacing: 0.3px;
}

button:hover {
  background: #2563eb;
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
}

button:active {
  transform: translateY(1px);
}

/* ============================================
   RESPONSE AREA
   ============================================ */
.response {
  margin-top: 16px;
  padding: 16px;
  background: #0f172a;
  color: #e2e8f0;
  border-radius: 8px;
  font-family: 'SF Mono', 'Monaco', 'Courier New', monospace;
  font-size: 13px;
  white-space: pre-wrap;
  display: none;
  max-height: 500px;
  overflow-y: auto;
  border: 1px solid #1e293b;
}

.response.show {
  display: block;
  animation: fadeIn 0.2s ease;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

/* ============================================
   PARAMETERS
   ============================================ */
.param-item {
  background: #ffffff;
  padding: 14px 16px;
  margin: 10px 0;
  border-radius: 8px;
  display: flex;
  gap: 16px;
  align-items: center;
  border: 1px solid #e2e8f0;
  transition: all 0.2s ease;
}

.param-item:hover {
  border-color: #cbd5e1;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.param-name {
  font-weight: 700;
  color: #3b82f6;
  min-width: 140px;
  font-family: 'SF Mono', 'Monaco', 'Courier New', monospace;
}

.param-type {
  color: #64748b;
  font-size: 12px;
  font-style: italic;
  font-weight: 500;
}

/* ============================================
   BADGES
   ============================================ */
.middleware-badge {
  background: #dc2626;
  color: white;
  padding: 6px 12px;
  border-radius: 6px;
  margin-right: 8px;
  font-size: 11px;
  display: inline-block;
  margin-bottom: 8px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.type-badge {
  display: inline-block;
  padding: 4px 10px;
  background: #dbeafe;
  color: #1e40af;
  border-radius: 5px;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.type-badge.file {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.required-badge {
  display: inline-block;
  padding: 4px 10px;
  background: #fee2e2;
  color: #991b1b;
  border-radius: 5px;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.optional-badge {
  display: inline-block;
  padding: 4px 10px;
  background: #e0e7ff;
  color: #3730a3;
  border-radius: 5px;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.format-badge {
  display: inline-block;
  padding: 4px 10px;
  background: #fef3c7;
  color: #92400e;
  border-radius: 5px;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.stream-badge {
  background: linear-gradient(135deg, #06b6d4 0%, #0891b2 100%);
  color: white;
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 600;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  letter-spacing: 0.3px;
}

.formdata-badge {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 600;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  letter-spacing: 0.3px;
}

/* ============================================
   WELCOME SCREEN
   ============================================ */
.welcome-screen {
  text-align: center;
  padding: 80px 20px;
  color: #64748b;
}

.welcome-screen h2 {
  font-size: 36px;
  color: #0f172a;
  margin-bottom: 12px;
  font-weight: 600;
  letter-spacing: -0.8px;
}

.welcome-screen p {
  font-size: 16px;
  margin-bottom: 10px;
  font-weight: 500;
}

.welcome-icon {
  font-size: 80px;
  margin-bottom: 20px;
}

/* ============================================
   SCHEMA TABLES
   ============================================ */
.schema-table {
  overflow-x: auto;
  margin: 1rem 0;
  border-radius: 10px;
  border: 1px solid #e2e8f0;
}

.schema-table table {
  width: 100%;
  border-collapse: collapse;
  background: #ffffff;
  border-radius: 10px;
  overflow: hidden;
}

.schema-table thead {
  background: #f1f5f9;
}

.schema-table th {
  padding: 14px 16px;
  text-align: left;
  font-weight: 700;
  font-size: 12px;
  color: #475569;
  border-bottom: 2px solid #e2e8f0;
  text-transform: uppercase;
  letter-spacing: 0.8px;
}

.schema-table td {
  padding: 14px 16px;
  border-bottom: 1px solid #f1f5f9;
  font-size: 13px;
  color: #334155;
}

.schema-table tbody tr:last-child td {
  border-bottom: none;
}

.schema-table tbody tr {
  transition: background 0.15s ease;
}

.schema-table tbody tr:hover {
  background: #f8fafc;
}

/* ============================================
   TABS
   ============================================ */
.tabs-header {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
  border-bottom: 2px solid #e2e8f0;
}

.tab-btn {
  background: transparent;
  color: #64748b;
  border: none;
  border-bottom: 3px solid transparent;
  padding: 12px 20px;
  cursor: pointer;
  font-weight: 600;
  font-size: 13px;
  transition: all 0.2s ease;
  margin: 0;
  margin-bottom: -2px;
  border-radius: 0;
}

.tab-btn:hover {
  color: #3b82f6;
  background: #f1f5f9;
  box-shadow: none;
}

.tab-btn.active {
  color: #3b82f6;
  border-bottom-color: #3b82f6;
  background: transparent;
}

.tab-content {
  display: none;
}

.tab-content.active {
  display: block;
  animation: tabFadeIn 0.3s ease;
}

@keyframes tabFadeIn {
  from {
    opacity: 0;
    transform: translateY(-5px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.optional-fields {
  margin-top: 20px;
}

/* ============================================
   BEARER TOKEN
   ============================================ */
.bearer-section {
  margin: 20px 0;
  padding: 16px;
  background: #fef3c7;
  border-radius: 8px;
  border: 1px solid #fbbf24;
}

.bearer-input-group {
  position: relative;
  display: flex;
  gap: 8px;
  align-items: stretch;
}

.bearer-input-group input {
  flex: 1;
  margin: 0;
  padding-right: 45px;
}

.clear-token-btn {
  position: absolute;
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
  background: #f59e0b;
  color: white;
  border: none;
  width: 32px;
  height: 32px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 700;
  padding: 0;
  margin: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.clear-token-btn:hover {
  background: #d97706;
  box-shadow: 0 2px 8px rgba(245, 158, 11, 0.3);
}

.helper-text {
  display: block;
  margin-top: 8px;
  font-size: 12px;
  color: #92400e;
  font-style: italic;
}

.required-indicator {
  color: #ef4444;
  font-weight: bold;
}

/* ============================================
   FORMDATA
   ============================================ */
.formdata-fields {
  margin-top: 20px;
  padding: 20px;
  background: white;
  border-radius: 8px;
  border: 1px solid #e1e4e8;
}

.form-field {
  margin-bottom: 15px;
}

.form-field label {
  display: block;
  margin-bottom: 5px;
  font-weight: 500;
  color: #24292e;
}

.form-field input[type="file"] {
  display: block;
  width: 100%;
  padding: 10px;
  border: 2px dashed #d1d5db;
  border-radius: 6px;
  background: white;
  cursor: pointer;
  transition: all 0.2s;
}

.form-field input[type="file"]:hover {
  border-color: #667eea;
  background: #f8f9ff;
}

.form-field input[type="file"]:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.form-field input[type="text"],
.form-field input[type="number"],
.form-field input[type="email"],
.form-field input[type="date"] {
  display: block;
  width: 100%;
  padding: 10px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 14px;
  transition: all 0.2s;
}

.form-field input:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.form-field .helper-text {
  display: block;
  margin-top: 5px;
  font-size: 12px;
  color: #6b7280;
}

/* ============================================
   CODE EXAMPLES
   ============================================ */
.code-examples-section {
  margin-top: 24px;
  padding: 24px;
  background: #f8fafc;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
}

.code-tabs {
  margin-top: 16px;
}

.code-tabs-header {
  display: flex;
  gap: 8px;
  border-bottom: 2px solid #e2e8f0;
  margin-bottom: 0;
}

.code-tab-btn {
  background: transparent;
  color: #64748b;
  border: none;
  border-bottom: 3px solid transparent;
  padding: 12px 20px;
  cursor: pointer;
  font-weight: 600;
  font-size: 13px;
  transition: all 0.2s ease;
  margin: 0;
  margin-bottom: -2px;
  border-radius: 0;
}

.code-tab-btn:hover {
  color: #3b82f6;
  background: #f1f5f9;
  box-shadow: none;
}

.code-tab-btn.active {
  color: #3b82f6;
  border-bottom-color: #3b82f6;
  background: transparent;
}

.code-tabs-content {
  background: #303446;
  border-radius: 0 0 10px 10px;
  overflow: hidden;
}

.code-tab-content {
  display: none;
  animation: codeFadeIn 0.3s ease;
}

.code-tab-content.active {
  display: block;
}

@keyframes codeFadeIn {
  from {
    opacity: 0;
    transform: translateY(-5px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.code-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 20px;
  background: #292c3c;
  border-bottom: 1px solid #414559;
}

.code-language {
  color: #a5adcb;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.copy-btn {
  background: #3b82f6;
  color: white;
  border: none;
  padding: 6px 14px;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 600;
  font-size: 12px;
  transition: all 0.2s ease;
  margin: 0;
}

.copy-btn:hover {
  background: #2563eb;
  box-shadow: 0 2px 8px rgba(59, 130, 246, 0.3);
}

.copy-btn.copied {
  background: #10b981;
}

/* Shiki container styles */
.shiki-container {
  margin: 0;
  padding: 0;
  overflow-x: auto;
  background: #303446;
}

.shiki-container pre {
  margin: 0 !important;
  padding: 20px !important;
  background: transparent !important;
  overflow-x: auto;
}

.shiki-container code {
  font-family: 'SF Mono', 'Monaco', 'Courier New', monospace !important;
  font-size: 13px !important;
  line-height: 1.6 !important;
  background: transparent !important;
  padding: 0 !important;
  border-radius: 0 !important;
  display: block;
}

.shiki-container.highlighted pre {
  background: transparent !important;
}

.shiki-container.highlighted code {
  background: transparent !important;
  color: inherit !important;
}

.code-tab-content pre {
  margin: 0;
  padding: 20px;
  overflow-x: auto;
  background: #303446;
}

.code-tab-content code {
  color: #c6d0f5;
  font-family: 'SF Mono', 'Monaco', 'Courier New', monospace;
  font-size: 13px;
  line-height: 1.6;
  background: transparent;
  padding: 0;
  border-radius: 0;
}

.shiki-container::-webkit-scrollbar {
  height: 8px;
}

.shiki-container::-webkit-scrollbar-track {
  background: #292c3c;
}

.shiki-container::-webkit-scrollbar-thumb {
  background: #51576d;
  border-radius: 4px;
}

.shiki-container::-webkit-scrollbar-thumb:hover {
  background: #626880;
}

/* ============================================
   JSON EDITOR (CodeMirror)
   ============================================ */
.json-editor-container {
  margin-top: 20px;
}

.codemirror-wrapper {
  position: relative;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  overflow: hidden;
  background: #282c34;
  transition: all 0.2s ease;
}

.codemirror-wrapper:focus-within {
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.codemirror-wrapper .cm-editor {
  height: auto;
  min-height: 200px;
  max-height: 500px;
  font-size: 14px;
  font-family: 'SF Mono', 'Monaco', 'Courier New', monospace;
}

.codemirror-wrapper .cm-scroller {
  overflow: auto;
  font-family: 'SF Mono', 'Monaco', 'Courier New', monospace;
}

.codemirror-wrapper .cm-content {
  padding: 12px 8px;
}

.codemirror-wrapper .cm-line {
  padding: 0 8px;
}

.codemirror-wrapper .cm-gutters {
  background: #21252b;
  border-right: 1px solid #181a1f;
  color: #495162;
}

.codemirror-wrapper .cm-activeLineGutter {
  background: #2c313c;
}

.codemirror-wrapper .cm-activeLine {
  background: rgba(99, 123, 156, 0.1);
}

.codemirror-wrapper .cm-cursor {
  border-left-color: #528bff;
}

.codemirror-wrapper .cm-selectionBackground {
  background: #3e4451 !important;
}

.codemirror-wrapper .cm-focused .cm-selectionBackground {
  background: #3e4451 !important;
}

.codemirror-wrapper .cm-string {
  color: #98c379;
}

.codemirror-wrapper .cm-number {
  color: #d19a66;
}

.codemirror-wrapper .cm-bool,
.codemirror-wrapper .cm-null {
  color: #c678dd;
}

.codemirror-wrapper .cm-property {
  color: #e06c75;
}

.codemirror-wrapper .cm-punctuation {
  color: #abb2bf;
}

.codemirror-wrapper .cm-scroller::-webkit-scrollbar {
  width: 10px;
  height: 10px;
}

.codemirror-wrapper .cm-scroller::-webkit-scrollbar-track {
  background: #21252b;
}

.codemirror-wrapper .cm-scroller::-webkit-scrollbar-thumb {
  background: #4e5566;
  border-radius: 5px;
}

.codemirror-wrapper .cm-scroller::-webkit-scrollbar-thumb:hover {
  background: #5c6370;
}

.codemirror-wrapper textarea[name="body"] {
  display: none;
}

.codemirror-wrapper.error {
  border-color: #ef4444;
  box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
}

.codemirror-wrapper.loading::after {
  content: 'Loading editor...';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: #94a3b8;
  font-size: 14px;
  font-weight: 500;
}

.fill-example-btn {
  background: #10b981;
  margin-top: 12px;
}

.fill-example-btn:hover {
  background: #059669;
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
}

/* ============================================
   SCROLLBARS
   ============================================ */
::-webkit-scrollbar {
  width: 10px;
  height: 10px;
}

::-webkit-scrollbar-track {
  background: #f1f5f9;
}

::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 5px;
}

::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}

.sidebar::-webkit-scrollbar-track {
  background: #0f172a;
}

.sidebar::-webkit-scrollbar-thumb {
  background: #334155;
}
`;
