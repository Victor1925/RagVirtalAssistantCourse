/* ===========================
   RAG Assistant - Frontend App
   =========================== */

const API_BASE = '';

// ============ State ============
let sessionId = null;
let isProcessing = false;

// ============ DOM References ============
const uploadZone      = document.getElementById('uploadZone');
const fileInput       = document.getElementById('fileInput');
const uploadProgress  = document.getElementById('uploadProgress');
const progressBarFill = document.getElementById('progressBarFill');
const progressText    = document.getElementById('progressText');
const uploadError     = document.getElementById('uploadError');
const uploadErrorText = document.getElementById('uploadErrorText');
const docList         = document.getElementById('docList');
const docCount        = document.getElementById('docCount');
const messagesContainer = document.getElementById('messagesContainer');
const welcomeMessage  = document.getElementById('welcomeMessage');
const questionInput   = document.getElementById('questionInput');
const sendBtn         = document.getElementById('sendBtn');
const clearChatBtn    = document.getElementById('clearChatBtn');
const statusDot       = document.getElementById('statusDot');
const statusLabel     = document.getElementById('statusLabel');

// ============ Health Check ============
async function checkHealth() {
  try {
    const res = await fetch(`${API_BASE}/api/health`);
    if (res.ok) {
      setStatus('online', 'Online');
    } else {
      setStatus('error', 'Degraded');
    }
  } catch {
    setStatus('error', 'Offline');
  }
}

function setStatus(state, label) {
  statusDot.className = 'status-dot ' + state;
  statusLabel.textContent = label;
}

// ============ Document Upload ============
function setupUploadZone() {
  // Click to browse
  uploadZone.addEventListener('click', () => fileInput.click());
  uploadZone.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      fileInput.click();
    }
  });

  // File input change
  fileInput.addEventListener('change', (e) => {
    const file = e.target.files?.[0];
    if (file) handleFileUpload(file);
    fileInput.value = '';
  });

  // Drag and drop
  uploadZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadZone.classList.add('dragging');
  });

  uploadZone.addEventListener('dragleave', (e) => {
    if (!uploadZone.contains(e.relatedTarget)) {
      uploadZone.classList.remove('dragging');
    }
  });

  uploadZone.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadZone.classList.remove('dragging');
    const file = e.dataTransfer?.files?.[0];
    if (file) handleFileUpload(file);
  });
}

async function handleFileUpload(file) {
  // Validate file type
  if (file.type !== 'application/pdf') {
    showUploadError('Only PDF files are supported.');
    return;
  }

  // Validate size (50MB)
  if (file.size > 50 * 1024 * 1024) {
    showUploadError('File is too large. Maximum size is 50MB.');
    return;
  }

  hideUploadError();
  showUploadProgress(0, `Uploading "${file.name}"...`);
  uploadZone.classList.add('uploading');

  try {
    const result = await uploadDocument(file);
    showUploadProgress(100, 'Processing complete!');

    setTimeout(() => {
      hideUploadProgress();
      uploadZone.classList.remove('uploading');
      addDocumentToList(result);
    }, 600);
  } catch (err) {
    hideUploadProgress();
    uploadZone.classList.remove('uploading');
    showUploadError(err.message || 'Upload failed. Please try again.');
  }
}

async function uploadDocument(file) {
  const formData = new FormData();
  formData.append('file', file);

  // Simulate progress while uploading
  let progress = 0;
  const progressInterval = setInterval(() => {
    if (progress < 85) {
      progress += Math.random() * 15;
      showUploadProgress(Math.min(progress, 85), `Processing "${file.name}"...`);
    }
  }, 400);

  try {
    const res = await fetch(`${API_BASE}/api/documents/upload`, {
      method: 'POST',
      body: formData,
    });

    clearInterval(progressInterval);

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.error?.message || errorData.error || `Upload failed (${res.status})`);
    }

    showUploadProgress(95, 'Finalizing...');
    return await res.json();
  } catch (err) {
    clearInterval(progressInterval);
    throw err;
  }
}

function showUploadProgress(percent, text) {
  uploadProgress.hidden = false;
  progressBarFill.style.width = `${Math.min(percent, 100)}%`;
  progressText.textContent = text;
}

function hideUploadProgress() {
  uploadProgress.hidden = true;
  progressBarFill.style.width = '0%';
}

function showUploadError(message) {
  uploadError.hidden = false;
  uploadErrorText.textContent = message;
  setTimeout(() => hideUploadError(), 6000);
}

function hideUploadError() {
  uploadError.hidden = true;
}

function addDocumentToList(doc) {
  // Remove empty state
  const emptyEl = docList.querySelector('.doc-empty');
  if (emptyEl) emptyEl.remove();

  const li = document.createElement('li');
  li.className = 'doc-item';
  li.dataset.docId = doc.documentId;

  const date = new Date();
  const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  li.innerHTML = `
    <div class="doc-icon">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
        <polyline points="14 2 14 8 20 8"/>
        <line x1="16" y1="13" x2="8" y2="13"/>
        <line x1="16" y1="17" x2="8" y2="17"/>
      </svg>
    </div>
    <div class="doc-info">
      <div class="doc-name" title="${escapeHtml(doc.documentName)}">${escapeHtml(doc.documentName)}</div>
      <div class="doc-meta">Uploaded at ${timeStr}</div>
    </div>
    <span class="doc-chunks">${doc.chunksCreated} chunks</span>
  `;

  docList.prepend(li);
  updateDocCount();
}

function updateDocCount() {
  const count = docList.querySelectorAll('.doc-item').length;
  docCount.textContent = count;
}

async function loadDocuments() {
  try {
    const res = await fetch(`${API_BASE}/api/documents`);
    if (!res.ok) return;
    const data = await res.json();

    if (data.documents && data.documents.length > 0) {
      const emptyEl = docList.querySelector('.doc-empty');
      if (emptyEl) emptyEl.remove();

      data.documents.forEach(doc => {
        const li = document.createElement('li');
        li.className = 'doc-item';
        li.dataset.docId = doc.id;

        const date = new Date(doc.uploadedAt);
        const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        li.innerHTML = `
          <div class="doc-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
              <line x1="16" y1="13" x2="8" y2="13"/>
              <line x1="16" y1="17" x2="8" y2="17"/>
            </svg>
          </div>
          <div class="doc-info">
            <div class="doc-name" title="${escapeHtml(doc.name)}">${escapeHtml(doc.name)}</div>
            <div class="doc-meta">Uploaded at ${timeStr}</div>
          </div>
          <span class="doc-chunks">${doc.chunksCount} chunks</span>
        `;

        docList.appendChild(li);
      });

      updateDocCount();
    }
  } catch {
    // Silently fail on load
  }
}

// ============ Chat ============
function setupChat() {
  // Auto-resize textarea
  questionInput.addEventListener('input', () => {
    questionInput.style.height = 'auto';
    questionInput.style.height = Math.min(questionInput.scrollHeight, 120) + 'px';
    sendBtn.disabled = questionInput.value.trim().length === 0 || isProcessing;
  });

  // Send on Enter (Shift+Enter = newline)
  questionInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!sendBtn.disabled) handleAskQuestion();
    }
  });

  sendBtn.addEventListener('click', () => {
    if (!sendBtn.disabled) handleAskQuestion();
  });

  clearChatBtn.addEventListener('click', clearChat);
}

async function handleAskQuestion() {
  const question = questionInput.value.trim();
  if (!question || isProcessing) return;

  isProcessing = true;
  sendBtn.disabled = true;
  questionInput.value = '';
  questionInput.style.height = 'auto';

  // Hide welcome message
  if (welcomeMessage) welcomeMessage.style.display = 'none';

  // Render user message
  renderMessage('user', question);

  // Show loading indicator
  const loadingId = renderLoadingMessage();

  try {
    const result = await askQuestion(question, sessionId);
    sessionId = result.sessionId;

    // Remove loading
    removeMessage(loadingId);

    // Render assistant message
    renderMessage('assistant', result.answer, result.sources);
  } catch (err) {
    removeMessage(loadingId);
    renderMessage('assistant', `Sorry, I encountered an error: ${err.message || 'Please try again.'}`, []);
  } finally {
    isProcessing = false;
    sendBtn.disabled = questionInput.value.trim().length === 0;
  }
}

async function askQuestion(question, sid) {
  const res = await fetch(`${API_BASE}/api/chat/ask`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question, sessionId: sid }),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error?.message || errorData.error || `Request failed (${res.status})`);
  }

  return await res.json();
}

function renderMessage(role, content, sources) {
  const messageId = 'msg-' + Date.now() + '-' + Math.random().toString(36).slice(2);
  const now = new Date();
  const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const messageEl = document.createElement('div');
  messageEl.className = `message message-${role}`;
  messageEl.id = messageId;

  const avatarHtml = role === 'user'
    ? `<div class="message-avatar">You</div>`
    : `<div class="message-avatar">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"/>
          <path d="M12 8v4l3 3"/>
        </svg>
      </div>`;

  const sourcesHtml = sources && sources.length > 0 ? renderSources(sources) : '';

  messageEl.innerHTML = `
    ${avatarHtml}
    <div class="message-body">
      <div class="message-bubble">${formatMessageContent(content)}</div>
      ${sourcesHtml}
      <div class="message-time">${timeStr}</div>
    </div>
  `;

  messagesContainer.appendChild(messageEl);
  scrollToBottom();

  return messageId;
}

function renderSources(sources) {
  if (!sources || sources.length === 0) return '';

  const sourceItems = sources.map((source, i) => {
    const scorePercent = Math.round(source.score * 100);
    return `
      <div class="source-item">
        <div class="source-header">
          <div class="source-doc-name">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
            </svg>
            ${escapeHtml(source.documentName)}
          </div>
          <span class="source-score">${scorePercent}% match</span>
        </div>
        <div class="source-excerpt">"${escapeHtml(source.excerpt)}"</div>
      </div>
    `;
  }).join('');

  return `
    <div class="sources-section">
      <button class="sources-toggle" onclick="toggleSources(this)">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M9 11l3 3L22 4"/>
          <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
        </svg>
        Sources
        <svg class="chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="6 9 12 15 18 9"/>
        </svg>
        <span class="sources-count">${sources.length}</span>
      </button>
      <div class="sources-list">
        ${sourceItems}
      </div>
    </div>
  `;
}

function toggleSources(btn) {
  btn.classList.toggle('open');
  const list = btn.nextElementSibling;
  if (list) list.classList.toggle('open');
}

function renderLoadingMessage() {
  const id = 'loading-' + Date.now();

  const messageEl = document.createElement('div');
  messageEl.className = 'message message-assistant message-loading';
  messageEl.id = id;

  messageEl.innerHTML = `
    <div class="message-avatar">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="10"/>
        <path d="M12 8v4l3 3"/>
      </svg>
    </div>
    <div class="message-body">
      <div class="message-bubble">
        <div class="typing-indicator">
          <div class="typing-dot"></div>
          <div class="typing-dot"></div>
          <div class="typing-dot"></div>
        </div>
      </div>
    </div>
  `;

  messagesContainer.appendChild(messageEl);
  scrollToBottom();

  return id;
}

function removeMessage(id) {
  const el = document.getElementById(id);
  if (el) el.remove();
}

function clearChat() {
  // Remove all messages except welcome
  const messages = messagesContainer.querySelectorAll('.message');
  messages.forEach(m => m.remove());

  // Show welcome again
  if (welcomeMessage) welcomeMessage.style.display = '';

  sessionId = null;
}

function scrollToBottom() {
  requestAnimationFrame(() => {
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  });
}

// ============ Helpers ============
function formatMessageContent(content) {
  // Escape HTML first
  let escaped = escapeHtml(content);

  // Convert **bold**
  escaped = escaped.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

  // Convert *italic*
  escaped = escaped.replace(/\*(.*?)\*/g, '<em>$1</em>');

  // Convert `code`
  escaped = escaped.replace(/`([^`]+)`/g, '<code style="background:var(--color-surface-2);padding:2px 5px;border-radius:3px;font-family:var(--font-mono);font-size:0.85em;">$1</code>');

  // Convert newlines to <br>
  escaped = escaped.replace(/\n/g, '<br>');

  return escaped;
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// ============ Init ============
function init() {
  setupUploadZone();
  setupChat();
  checkHealth();
  loadDocuments();

  // Re-check health every 30s
  setInterval(checkHealth, 30000);
}

document.addEventListener('DOMContentLoaded', init);
