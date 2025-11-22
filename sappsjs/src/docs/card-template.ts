import { generateCodeExamples } from './code-generator';
import type { RouteDoc } from './types';

function escapeHtml(text: string): string {
	return text
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&#039;');
}

export function generateRouteCardTemplate(doc: RouteDoc, idx: number): string {
	const codeExamples = generateCodeExamples(doc, '');
	const defaultHeaders = '{}';
	const hasFormData = !!doc.formDataSchema;

	return `
<div class="route-card" id="endpoint-${idx}">
  <div class="route-header">
    <span class="method ${doc.method}">${doc.method}</span>
    <span class="path">${doc.path}</span>
    ${doc.isStream ? '<span class="stream-badge">📡 SSE Stream</span>' : ''}
    ${hasFormData ? '<span class="formdata-badge">📎 FormData</span>' : ''}
  </div>

	${
		doc.bodySchema ||
		doc.formDataSchema ||
		(doc.middlewares && doc.middlewares.length > 0) ||
		doc.queryParams ||
		(doc.params && doc.params.length > 0) ||
		doc.isStream
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
		doc.params && doc.params.length > 0
			? `

      <div class="section-title">Route Parameters</div>
      ${doc.params
				.map(
					(p) =>
						`<div class="param-item"><span class="param-name">:${p}</span><span class="param-type">string</span></div>`
				)
				.join('')}
  `
			: ''
	}
	 ${
			doc.queryParams
				? `
      <div class="section-title">Query Parameters</div>
      <div class="schema-table">
        <table>
          <thead>
            <tr>
              <th>Parameter</th>
              <th>Type</th>
              <th>Required</th>
              <th>Description</th>
              <th>Example</th>
            </tr>
          </thead>
          <tbody>
            ${Object.entries(doc.queryParams)
							.map(
								([param, info]) => `
              <tr>
                <td><code>${param}</code></td>
                <td><span class="type-badge">${info.type}</span></td>
                <td>${info.optional ? '<span class="optional-badge">No</span>' : '<span class="required-badge">Yes</span>'}</td>
                <td>${info.description || '-'}</td>
                <td><code>${JSON.stringify(info.example)}</code></td>
              </tr>
            `
							)
							.join('')}
          </tbody>
        </table>
      </div>
  `
				: ''
		}
		${
			doc.bodySchema
				? `
      <div class="section-title">Request Body Schema (JSON)</div>
      <div class="schema-table">
        <table>
          <thead>
            <tr>
              <th>Field</th>
              <th>Type</th>
              <th>Required</th>
              <th>Format</th>
              <th>Example</th>
            </tr>
          </thead>
          <tbody>
            ${Object.entries(doc.bodySchema.properties)
							.map(
								([field, prop]) => `
              <tr>
                <td><code>${field}</code></td>
                <td><span class="type-badge">${prop.type}</span></td>
                <td>${doc.bodySchema!.required.includes(field) ? '<span class="required-badge">Yes</span>' : '<span class="optional-badge">No</span>'}</td>
                <td>${prop.format ? `<span class="format-badge">${prop.format}</span>` : '-'}</td>
                <td><code>${JSON.stringify(prop.example)}</code></td>
              </tr>
            `
							)
							.join('')}
          </tbody>
        </table>
      </div>`
				: ''
		}
		${
			doc.formDataSchema
				? `
      <div class="section-title">Request Body Schema (FormData)</div>
      <div class="schema-table">
        <table>
          <thead>
            <tr>
              <th>Field</th>
              <th>Type</th>
              <th>Required</th>
              <th>File Info</th>
              <th>Rules</th>
            </tr>
          </thead>
          <tbody>
            ${Object.entries(doc.formDataSchema.properties)
							.map(([field, prop]) => {
								let fileInfo = '-';
								if (prop.isFile) {
									const details = [];
									if (prop.isMultiple) details.push('Multiple files');
									else details.push('Single file');
									if (prop.maxSize)
										details.push(`Max: ${(prop.maxSize / 1024 / 1024).toFixed(2)}MB`);
									if (prop.minSize)
										details.push(`Min: ${(prop.minSize / 1024 / 1024).toFixed(2)}MB`);
									if (prop.mimeTypes) details.push(`Types: ${prop.mimeTypes.join(', ')}`);
									if (prop.maxFiles) details.push(`Max files: ${prop.maxFiles}`);
									if (prop.minFiles) details.push(`Min files: ${prop.minFiles}`);
									fileInfo = details.join('<br>');
								}

								return `
              <tr>
                <td><code>${field}</code></td>
                <td><span class="type-badge ${prop.isFile ? 'file' : ''}">${prop.isFile ? (prop.isMultiple ? 'file[]' : 'file') : prop.type}</span></td>
                <td>${doc.formDataSchema!.required.includes(field) ? '<span class="required-badge">Yes</span>' : '<span class="optional-badge">No</span>'}</td>
                <td>${fileInfo}</td>
                <td><small>${prop.rules.join(', ')}</small></td>
              </tr>
            `;
							})
							.join('')}
          </tbody>
        </table>
      </div>`
				: ''
		}

    ${
			doc.isStream
				? `
      <div class="section-title">Stream Information</div>
      <div class="stream-info">
        <p>📡 This endpoint uses <strong>Server-Sent Events (SSE)</strong> to stream real-time data.</p>
        <p>The connection will remain open and receive updates as they occur.</p>
      </div>
    `
				: ''
		}
    </div>
  `
			: ''
	}

  ${
		doc.isStream
			? `
  <div class="try-it-form">
    <div class="section-title">🧪 Try Stream Endpoint</div>
    <form onsubmit="return connectStream(event, ${idx}, '${doc.path}', ${doc.requiresBearer})">

      ${
				doc.requiresBearer
					? `
        <div class="bearer-section">
          <label>🔐 Bearer Token <span class="required-indicator">*</span>:</label>
          <div class="bearer-input-group">
            <input type="text" name="bearer_token" id="bearer_token_${idx}" placeholder="Enter your authentication token" required />
            <button type="button" class="clear-token-btn" onclick="clearBearerToken(${idx})" title="Clear token">
              ✕
            </button>
          </div>
          <small class="helper-text">This token will be saved and reused across page refreshes</small>
        </div>
      `
					: ''
			}

      ${
				doc.params && doc.params.length > 0
					? doc.params
							.map(
								(p) => `
        <div>
          <label>${p}:</label>
          <input type="text" name="param_${p}" placeholder="Enter ${p} value" required />
        </div>
      `
							)
							.join('')
					: ''
			}

      <div class="optional-fields">
        <label>Query Parameters ${doc.queryParams ? '(auto-detected)' : '(optional)'}:</label>
        <input type="text" name="query" placeholder="key1=value1&key2=value2" value="${
					doc.queryParams
						? Object.entries(doc.queryParams)
								.map(([k, v]) => `${k}=${v.example}`)
								.join('&')
						: ''
				}" />
      </div>

      <div class="stream-controls">
        <button type="submit" id="stream_connect_btn_${idx}">📡 Connect Stream</button>
        <button type="button" id="stream_disconnect_btn_${idx}" onclick="disconnectStream(${idx})" style="display: none;" class="disconnect-btn">
          🚪 Disconnect
        </button>
        <div class="stream-status" id="stream_status_${idx}">
          <span class="status-badge disconnected">Disconnected</span>
        </div>
      </div>
    </form>

    <div class="stream-logs-section" id="stream_logs_section_${idx}" style="display: none;">
      <div class="section-title">📋 Stream Events</div>
      <div class="stream-logs" id="stream_logs_${idx}"></div>
      <button type="button" class="clear-logs-btn" onclick="clearStreamLogs(${idx})">
        🗑️ Clear Logs
      </button>
    </div>
  </div>
  `
			: `
  <div class="try-it-form">
    <div class="section-title">🧪 Try Endpoint</div>
    <form onsubmit="return ${hasFormData ? `sendFormDataRequest(event, ${idx}, '${doc.method}', '${doc.path}', ${doc.requiresBearer})` : `sendRequest(event, ${idx}, '${doc.method}', '${doc.path}', ${doc.requiresBearer})`}">

 			<div class="optional-fields">
         <div class="tabs-header">
           <button type="button" class="tab-btn active" onclick="switchTab(${idx}, 'query')">
             🔍 Query Parameters
           </button>
           ${
							!hasFormData
								? `<button type="button" class="tab-btn" onclick="switchTab(${idx}, 'headers')">
             📋 Additional Headers
           </button>`
								: ''
						}
         </div>

         <div class="tab-content active" id="tab-query-${idx}">
           <label>Query Parameters ${doc.isPaginated ? '(auto-detected)' : '(optional)'}:</label>
           <input type="text" name="query" placeholder="key1=value1&key2=value2" value="${
							doc.queryParams
								? Object.entries(doc.queryParams)
										.map(([k, v]) => `${k}=${v.example}`)
										.join('&')
								: ''
						}" />
         </div>

         ${
						!hasFormData
							? `<div class="tab-content" id="tab-headers-${idx}">
           <label>Additional Headers (optional, JSON):</label>
           <textarea name="headers" placeholder='${defaultHeaders}'>${defaultHeaders}</textarea>
           <small class="helper-text">Add any extra headers here. ${doc.requiresBearer ? 'Authorization header is automatically added from Bearer Token above.' : ''}</small>
         </div>`
							: ''
					}
       </div>
      ${
				doc.requiresBearer
					? `
        <div class="bearer-section">
          <label>🔐 Bearer Token <span class="required-indicator">*</span>:</label>
          <div class="bearer-input-group">
            <input type="text" name="bearer_token" id="bearer_token_${idx}" placeholder="Enter your authentication token" required />
            <button type="button" class="clear-token-btn" onclick="clearBearerToken(${idx})" title="Clear token">
              ✕
            </button>
          </div>
          <small class="helper-text">This token will be saved and reused across page refreshes</small>
        </div>
      `
					: ''
			}

      ${
				doc.params && doc.params.length > 0
					? doc.params
							.map(
								(p) => `
        <div>
          <label>${p}:</label>
          <input type="text" name="param_${p}" placeholder="Enter ${p} value" required />
        </div>
      `
							)
							.join('')
					: ''
			}

      ${
				hasFormData && doc.formDataSchema
					? `
        <div class="formdata-fields">
          <div class="section-title">📎 Form Fields</div>
          ${Object.entries(doc.formDataSchema.properties)
						.map(([field, prop]) => {
							if (prop.isFile) {
								return `
          <div class="form-field">
            <label>${field} ${doc.formDataSchema!.required.includes(field) ? '<span class="required-indicator">*</span>' : ''}:</label>
            <input
              type="file"
              name="${field}"
              ${prop.isMultiple ? 'multiple' : ''}
              ${prop.mimeTypes ? `accept="${prop.mimeTypes.join(',')}"` : ''}
              ${doc.formDataSchema!.required.includes(field) ? 'required' : ''}
            />
            <small class="helper-text">
              ${prop.isMultiple ? 'Multiple files allowed' : 'Single file'}
              ${prop.maxSize ? ` - Max size: ${(prop.maxSize / 1024 / 1024).toFixed(2)}MB` : ''}
              ${prop.mimeTypes ? ` - Accepted: ${prop.mimeTypes.join(', ')}` : ''}
            </small>
          </div>`;
							} else {
								return `
          <div class="form-field">
            <label>${field} ${doc.formDataSchema!.required.includes(field) ? '<span class="required-indicator">*</span>' : ''}:</label>
            <input
              type="${prop.type === 'number' ? 'number' : prop.format === 'email' ? 'email' : prop.format === 'date' ? 'date' : 'text'}"
              name="${field}"
              placeholder="Enter ${field}"
              ${doc.formDataSchema!.required.includes(field) ? 'required' : ''}
            />
          </div>`;
							}
						})
						.join('')}
        </div>
      `
					: ['POST', 'PUT', 'PATCH'].includes(doc.method)
						? `
        <div>
          <label>Request Body (JSON):</label>
          <textarea name="body" placeholder='${doc.bodySchema ? JSON.stringify(doc.bodySchema.example, null, 2) : '{"key": "value"}'}'>${doc.bodySchema ? JSON.stringify(doc.bodySchema.example, null, 2) : ''}</textarea>
          ${
						doc.bodySchema
							? `
          <button type="button" class="fill-example-btn" onclick="fillExampleData(${idx})">
            📋 Fill Example Data
          </button>
          `
							: ''
					}
        </div>
      `
						: ''
			}

      <button type="submit">Send Request</button>
    </form>
    <div class="response" id="response-${idx}"></div>
  </div>
  `
	}
 <div class="code-examples-section">
    <div class="section-title">📋 Code Examples</div>
    <div class="code-tabs">
      <div class="code-tabs-header">
        <button type="button" class="code-tab-btn active" onclick="switchCodeTab(${idx}, 'svelte')">
          🎯 Svelte (sappsui)
        </button>
        <button type="button" class="code-tab-btn" onclick="switchCodeTab(${idx}, 'fetch')">
          🌐 Fetch API
        </button>
        <button type="button" class="code-tab-btn" onclick="switchCodeTab(${idx}, 'curl')">
          💻 cURL
        </button>
      </div>
      <div class="code-tabs-content">
        <div class="code-tab-content active" id="code-svelte-${idx}">
          <div class="code-header">
            <span class="code-language">Svelte + sappsui</span>
            <button type="button" class="copy-btn" onclick="copyCode(${idx}, 'svelte')">
              📋 Copy
            </button>
          </div>
          <pre><code>${escapeHtml(codeExamples.svelte)}</code></pre>
        </div>
        <div class="code-tab-content" id="code-fetch-${idx}">
          <div class="code-header">
            <span class="code-language">JavaScript Fetch</span>
            <button type="button" class="copy-btn" onclick="copyCode(${idx}, 'fetch')">
              📋 Copy
            </button>
          </div>
          <pre><code>${escapeHtml(codeExamples.fetch)}</code></pre>
        </div>
        <div class="code-tab-content" id="code-curl-${idx}">
          <div class="code-header">
            <span class="code-language">cURL</span>
            <button type="button" class="copy-btn" onclick="copyCode(${idx}, 'curl')">
              📋 Copy
            </button>
          </div>
          <pre><code>${escapeHtml(codeExamples.curl)}</code></pre>
        </div>
      </div>
    </div>
  </div>
</div>
<script>
  // Load saved bearer token on page load for endpoint ${idx}
  (function() {
    const savedToken = localStorage.getItem('bearer_token');
    const tokenInput = document.getElementById('bearer_token_${idx}');
    if (savedToken && tokenInput) {
      tokenInput.value = savedToken;
    }
  })();
</script>
`;
}
