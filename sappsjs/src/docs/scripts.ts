export const docsScripts = `
let currentEndpoint = null;
let exampleData = {};
let shikiHighlighter = null;

// Initialize Shiki
async function initShiki() {
  try {
    const { codeToHtml } = await import('https://esm.sh/shiki@3.0.0');
    return codeToHtml;
  } catch (error) {
    console.error('Failed to load Shiki:', error);
    return null;
  }
}

// Highlight all code blocks
async function highlightAllCodeBlocks() {
  if (!shikiHighlighter) {
    shikiHighlighter = await initShiki();
  }

  if (!shikiHighlighter) {
    console.warn('Shiki not available, falling back to plain text');
    return;
  }

  const containers = document.querySelectorAll('.shiki-container:not(.highlighted)');

  for (const container of containers) {
    const code = container.getAttribute('data-code');
    const lang = container.getAttribute('data-lang') || 'text';

    if (code) {
      try {
        const decodedCode = decodeHtmlEntities(code);
        const html = await shikiHighlighter(decodedCode, {
          lang: lang,
          theme: 'catppuccin-frappe'
        });
        container.innerHTML = html;
        container.classList.add('highlighted');
      } catch (error) {
        console.error('Error highlighting code:', error);
        // Fallback to plain text
        container.innerHTML = '<pre><code>' + code + '</code></pre>';
      }
    }
  }
}

// Decode HTML entities
function decodeHtmlEntities(text) {
  const textarea = document.createElement('textarea');
  textarea.innerHTML = text;
  return textarea.value;
}

function showEndpoint(idx) {
  // Ocultar ambos welcome screens
  document.getElementById('welcome').style.display = 'none';
  const wsWelcome = document.getElementById('ws-welcome');
  if (wsWelcome) wsWelcome.style.display = 'none';

  // Ocultar todas las cards (HTTP y WS)
  document.querySelectorAll('.route-card, .ws-card').forEach(card => {
    card.classList.remove('active');
  });

  document.querySelectorAll('.endpoint-item').forEach(item => {
    item.classList.remove('active');
  });

  document.getElementById('endpoint-' + idx).classList.add('active');
  document.getElementById('sidebar-' + idx).classList.add('active');

  currentEndpoint = idx;
  document.querySelector('.main-content').scrollTop = 0;

  // Highlight code blocks when showing endpoint
  setTimeout(() => highlightAllCodeBlocks(), 100);
}

function switchTab(idx, tabName) {
  const card = document.getElementById('endpoint-' + idx);

  // Update tab buttons
  card.querySelectorAll('.tab-btn').forEach(btn => {
    btn.classList.remove('active');
  });
  event.target.classList.add('active');

  // Update tab content
  card.querySelectorAll('.tab-content').forEach(content => {
    content.classList.remove('active');
  });
  card.querySelector('#tab-' + tabName + '-' + idx).classList.add('active');
}

function fillExampleData(idx) {
  const card = document.getElementById('endpoint-' + idx);
  const examplePre = card.querySelector('.example-json pre');

  if (examplePre) {
    const exampleJson = examplePre.textContent;
    const bodyTextarea = card.querySelector('textarea[name="body"]');

    if (bodyTextarea) {
      bodyTextarea.value = exampleJson;
    }
  }
}

function clearBearerToken(idx) {
  if (confirm('¿Está seguro de que desea eliminar el token guardado?')) {
    localStorage.removeItem('bearer_token');
    const tokenInput = document.getElementById('bearer_token_' + idx);
    if (tokenInput) {
      tokenInput.value = '';
    }
  }
}

async function sendFormDataRequest(e, idx, method, path, requiresBearer = false) {
  e.preventDefault();
  const form = e.target;
  const responseEl = document.getElementById('response-' + idx);

  let url = path;
  const formData = new FormData(form);

  // Handle bearer token
  let bearerToken = null;
  if (requiresBearer) {
    bearerToken = formData.get('bearer_token');
    if (!bearerToken) {
      responseEl.textContent = '❌ Bearer token is required for this endpoint';
      responseEl.classList.add('show');
      return false;
    }
    // Save token to localStorage
    localStorage.setItem('bearer_token', bearerToken);
    // Remove bearer token from form data
    formData.delete('bearer_token');
  }

  // Handle route parameters
  const paramsToRemove = [];
  for (let [key, value] of formData.entries()) {
    if (key.startsWith('param_')) {
      const paramName = key.replace('param_', '');
      url = url.replace(':' + paramName, value);
      paramsToRemove.push(key);
    }
  }
  paramsToRemove.forEach(key => formData.delete(key));

  // Handle query parameters
  const query = formData.get('query');
  if (query) {
    url += '?' + query;
    formData.delete('query');
  }

  // Setup headers
  let headers = {};
  if (requiresBearer && bearerToken) {
    headers['Authorization'] = 'Bearer ' + bearerToken;
  }

  responseEl.textContent = '⏳ Loading...';
  responseEl.classList.add('show');

  try {
    const startTime = performance.now();
    const response = await fetch(url, {
      method,
      headers,
      body: formData
    });
    const endTime = performance.now();
    const duration = (endTime - startTime).toFixed(0);

    const contentType = response.headers.get('content-type');
    let data;

    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      data = await response.text();
    }

    const statusEmoji = response.ok ? '✅' : '❌';
    responseEl.textContent = \`\${statusEmoji} Status: \${response.status} \${response.statusText}\\n⏱️ Time: \${duration}ms\\n\\n\` +
      JSON.stringify(data, null, 2);
  } catch (error) {
    responseEl.textContent = '❌ Error: ' + error.message;
  }

  return false;
}

async function sendRequest(e, idx, method, path, requiresBearer = false) {
  e.preventDefault();
  const form = e.target;
  const responseEl = document.getElementById('response-' + idx);

  let url = path;
  const formData = new FormData(form);

  // Handle bearer token
  let bearerToken = null;
  if (requiresBearer) {
    bearerToken = formData.get('bearer_token');
    if (!bearerToken) {
      responseEl.textContent = '❌ Bearer token is required for this endpoint';
      responseEl.classList.add('show');
      return false;
    }
    // Save token to localStorage
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

  // Handle request body
  let body = null;
  const bodyText = formData.get('body');
  if (bodyText && ['POST', 'PUT', 'PATCH'].includes(method)) {
    try {
      body = JSON.stringify(JSON.parse(bodyText));
    } catch (e) {
      responseEl.textContent = '❌ Invalid JSON in request body';
      responseEl.classList.add('show');
      return false;
    }
  }

  // Handle headers
  let headers = { 'Content-Type': 'application/json' };

  // Add bearer token to headers if required
  if (requiresBearer && bearerToken) {
    headers['Authorization'] = 'Bearer ' + bearerToken;
  }

  // Merge additional custom headers
  const headersText = formData.get('headers');
  if (headersText && headersText.trim() !== '{}') {
    try {
      const customHeaders = JSON.parse(headersText);
      headers = { ...headers, ...customHeaders };
    } catch (e) {
      responseEl.textContent = '❌ Invalid JSON in headers';
      responseEl.classList.add('show');
      return false;
    }
  }

  responseEl.textContent = '⏳ Loading...';
  responseEl.classList.add('show');

  try {
    const startTime = performance.now();
    const response = await fetch(url, {
      method,
      headers,
      body
    });
    const endTime = performance.now();
    const duration = (endTime - startTime).toFixed(0);

    const contentType = response.headers.get('content-type');
    let data;

    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      data = await response.text();
    }

    const statusEmoji = response.ok ? '✅' : '❌';
    responseEl.textContent = \`\${statusEmoji} Status: \${response.status} \${response.statusText}\\n⏱️ Time: \${duration}ms\\n\\n\` +
      JSON.stringify(data, null, 2);
  } catch (error) {
    responseEl.textContent = '❌ Error: ' + error.message;
  }

  return false;
}

// Initialize bearer tokens and Shiki on page load
document.addEventListener('DOMContentLoaded', function() {
  // Load saved bearer token
  const savedToken = localStorage.getItem('bearer_token');
  if (savedToken) {
    document.querySelectorAll('input[name="bearer_token"]').forEach(input => {
      input.value = savedToken;
    });
  }

  // Initialize Shiki and highlight visible code blocks
  highlightAllCodeBlocks();
});

function switchCodeTab(idx, tabName) {
  const card = document.getElementById('endpoint-' + idx);

  // Update tab buttons
  card.querySelectorAll('.code-tab-btn').forEach(btn => {
    btn.classList.remove('active');
  });
  event.target.classList.add('active');

  // Update tab content
  card.querySelectorAll('.code-tab-content').forEach(content => {
    content.classList.remove('active');
  });
  card.querySelector('#code-' + tabName + '-' + idx).classList.add('active');

  // Highlight code blocks when switching tabs
  setTimeout(() => highlightAllCodeBlocks(), 50);
}

function copyCode(idx, tabName) {
  const tabContent = document.querySelector('#code-' + tabName + '-' + idx);
  const copyBtn = event.target;

  if (!tabContent) return;

  // Try to get code from shiki container first, fallback to pre > code
  let code = '';
  const shikiContainer = tabContent.querySelector('.shiki-container');
  if (shikiContainer) {
    // Get the original code from data attribute
    code = decodeHtmlEntities(shikiContainer.getAttribute('data-code'));
  } else {
    const codeElement = tabContent.querySelector('pre code');
    if (codeElement) {
      code = codeElement.textContent;
    }
  }

  if (!code) return;

  const originalText = copyBtn.textContent;

  // Function to show success message
  function showSuccess() {
    copyBtn.textContent = '✅ Copied!';
    copyBtn.classList.add('copied');
    setTimeout(() => {
      copyBtn.textContent = originalText;
      copyBtn.classList.remove('copied');
    }, 2000);
  }

  // Function to show error message
  function showError(message) {
    console.error('Failed to copy:', message);
    copyBtn.textContent = '❌ Failed';
    setTimeout(() => {
      copyBtn.textContent = originalText;
    }, 2000);
  }

  // Try modern clipboard API first
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(code)
      .then(showSuccess)
      .catch(err => {
        // If clipboard API fails, try fallback
        if (fallbackCopyToClipboard(code)) {
          showSuccess();
        } else {
          showError(err);
        }
      });
  } else {
    // Use fallback if clipboard API is not available
    if (fallbackCopyToClipboard(code)) {
      showSuccess();
    } else {
      showError('Clipboard API not available');
    }
  }
}

// Fallback copy method using temporary textarea
function fallbackCopyToClipboard(text) {
  try {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.top = '0';
    textarea.style.left = '0';
    textarea.style.width = '2em';
    textarea.style.height = '2em';
    textarea.style.padding = '0';
    textarea.style.border = 'none';
    textarea.style.outline = 'none';
    textarea.style.boxShadow = 'none';
    textarea.style.background = 'transparent';
    textarea.style.opacity = '0';

    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();

    let successful = false;
    try {
      successful = document.execCommand('copy');
    } catch (err) {
      console.error('execCommand failed:', err);
    }

    document.body.removeChild(textarea);
    return successful;
  } catch (err) {
    console.error('Fallback copy failed:', err);
    return false;
  }
}
`;
