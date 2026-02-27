/**
 * GT — AI Chat Application
 * Complete frontend logic: conversations, sidebar, streaming, markdown
 */

// ============================================================
// DOM References
// ============================================================
const DOM = {
	app: document.querySelector('.app'),
	sidebar: document.getElementById('sidebar'),
	sidebarOverlay: document.getElementById('sidebar-overlay'),
	menuToggle: document.getElementById('menu-toggle'),
	newChatBtn: document.getElementById('new-chat-btn'),
	searchInput: document.getElementById('search-input'),
	conversationList: document.getElementById('conversation-list'),
	noConversations: document.getElementById('no-conversations'),
	clearAllBtn: document.getElementById('clear-all-btn'),
	chatMessages: document.getElementById('chat-messages'),
	welcomeScreen: document.getElementById('welcome-screen'),
	typingIndicator: document.getElementById('typing-indicator'),
	userInput: document.getElementById('user-input'),
	sendButton: document.getElementById('send-button'),
	modelSelect: document.getElementById('model-select'),
	headerTitle: document.getElementById('header-title'),
	exportBtn: document.getElementById('export-btn'),
	suggestionCards: document.querySelectorAll('.suggestion-card'),
};

// ============================================================
// State
// ============================================================
const STORAGE_KEY = 'gt_conversations';
let conversations = [];
let activeConversationId = null;
let isProcessing = false;

// ============================================================
// Markdown Configuration
// ============================================================
const renderer = new marked.Renderer();

renderer.code = function ({ text, lang }) {
	const language = lang || 'plaintext';
	let highlighted;
	try {
		if (lang && hljs.getLanguage(lang)) {
			highlighted = hljs.highlight(text, { language: lang }).value;
		} else {
			highlighted = hljs.highlightAuto(text).value;
		}
	} catch {
		highlighted = escapeHtml(text);
	}

	const blockId = 'code-' + Math.random().toString(36).substr(2, 9);
	return `<div class="code-block" id="${blockId}">
    <div class="code-header">
      <span class="code-language">${language}</span>
      <button class="copy-code-btn" onclick="copyCode('${blockId}')">
        <svg viewBox="0 0 24 24"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
        Copy
      </button>
    </div>
    <pre><code class="hljs language-${language}">${highlighted}</code></pre>
  </div>`;
};

marked.setOptions({
	renderer,
	breaks: true,
	gfm: true,
});

function escapeHtml(str) {
	return str
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&#039;');
}

// ============================================================
// Conversation Management
// ============================================================
function loadConversations() {
	try {
		const data = localStorage.getItem(STORAGE_KEY);
		conversations = data ? JSON.parse(data) : [];
	} catch {
		conversations = [];
	}
}

function saveConversations() {
	localStorage.setItem(STORAGE_KEY, JSON.stringify(conversations));
}

function createConversation() {
	const conv = {
		id: 'conv-' + Date.now() + '-' + Math.random().toString(36).substr(2, 6),
		title: 'New Chat',
		messages: [],
		createdAt: Date.now(),
		updatedAt: Date.now(),
	};
	conversations.unshift(conv);
	saveConversations();
	setActiveConversation(conv.id);
	return conv;
}

function deleteConversation(id) {
	conversations = conversations.filter(c => c.id !== id);
	saveConversations();

	if (activeConversationId === id) {
		if (conversations.length > 0) {
			setActiveConversation(conversations[0].id);
		} else {
			activeConversationId = null;
			showWelcomeScreen();
		}
	}
	renderConversationList();
}

function clearAllConversations() {
	if (!confirm('Delete all conversations? This cannot be undone.')) return;
	conversations = [];
	activeConversationId = null;
	saveConversations();
	showWelcomeScreen();
	renderConversationList();
}

function getActiveConversation() {
	return conversations.find(c => c.id === activeConversationId) || null;
}

function setActiveConversation(id) {
	activeConversationId = id;
	const conv = getActiveConversation();
	if (!conv) {
		showWelcomeScreen();
		return;
	}

	if (conv.messages.length === 0) {
		showWelcomeScreen();
	} else {
		showChatMessages();
		renderMessages(conv.messages);
	}

	DOM.headerTitle.textContent = conv.title === 'New Chat' ? '' : conv.title;
	renderConversationList();
	closeSidebar();
}

function generateTitle(message) {
	const text = message.trim();
	if (text.length <= 40) return text;
	return text.substring(0, 40) + '...';
}

// ============================================================
// Sidebar Rendering
// ============================================================
function renderConversationList(filter = '') {
	const list = DOM.conversationList;
	list.innerHTML = '';

	const filtered = filter
		? conversations.filter(c => c.title.toLowerCase().includes(filter.toLowerCase()))
		: conversations;

	if (filtered.length === 0) {
		list.innerHTML = `<div class="no-conversations">${filter ? 'No results found' : 'No conversations yet'}</div>`;
		return;
	}

	// Group by date
	const groups = groupByDate(filtered);

	for (const [label, convs] of Object.entries(groups)) {
		const groupLabel = document.createElement('div');
		groupLabel.className = 'conv-group-label';
		groupLabel.textContent = label;
		list.appendChild(groupLabel);

		for (const conv of convs) {
			const item = document.createElement('div');
			item.className = 'conv-item' + (conv.id === activeConversationId ? ' active' : '');
			item.innerHTML = `
        <span class="conv-item-title">${escapeHtml(conv.title)}</span>
        <button class="conv-item-delete" title="Delete" data-id="${conv.id}">
          <svg viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      `;

			item.addEventListener('click', (e) => {
				if (e.target.closest('.conv-item-delete')) return;
				setActiveConversation(conv.id);
			});

			const deleteBtn = item.querySelector('.conv-item-delete');
			deleteBtn.addEventListener('click', (e) => {
				e.stopPropagation();
				deleteConversation(conv.id);
			});

			list.appendChild(item);
		}
	}
}

function groupByDate(convs) {
	const now = new Date();
	const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
	const yesterday = today - 86400000;
	const last7 = today - 7 * 86400000;
	const last30 = today - 30 * 86400000;

	const groups = {};

	for (const conv of convs) {
		let label;
		if (conv.updatedAt >= today) label = 'Today';
		else if (conv.updatedAt >= yesterday) label = 'Yesterday';
		else if (conv.updatedAt >= last7) label = 'Last 7 Days';
		else if (conv.updatedAt >= last30) label = 'Last 30 Days';
		else label = 'Older';

		if (!groups[label]) groups[label] = [];
		groups[label].push(conv);
	}

	return groups;
}

// ============================================================
// View Management
// ============================================================
function showWelcomeScreen() {
	DOM.welcomeScreen.style.display = 'flex';
	DOM.chatMessages.style.display = 'none';
	DOM.headerTitle.textContent = '';
}

function showChatMessages() {
	DOM.welcomeScreen.style.display = 'none';
	DOM.chatMessages.style.display = 'block';
}

// ============================================================
// Message Rendering
// ============================================================
function renderMessages(messages) {
	DOM.chatMessages.innerHTML = '';
	for (const msg of messages) {
		if (msg.role === 'system') continue;
		appendMessageElement(msg.role, msg.content);
	}
	scrollToBottom();
}

function appendMessageElement(role, content) {
	const isAI = role === 'assistant';
	const div = document.createElement('div');
	div.className = `message ${isAI ? 'ai-message' : 'user-message'}`;

	const parsedContent = isAI ? renderMarkdown(content) : escapeHtml(content).replace(/\n/g, '<br>');

	div.innerHTML = `
    <div class="message-avatar">${isAI ? 'GT' : 'U'}</div>
    <div class="message-body">
      <div class="message-role">${isAI ? 'GT' : 'You'}</div>
      <div class="message-content">${parsedContent}</div>
      <div class="message-actions">
        <button class="msg-action-btn copy-msg-btn" title="Copy">
          <svg viewBox="0 0 24 24"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
        </button>
      </div>
    </div>
  `;

	const copyBtn = div.querySelector('.copy-msg-btn');
	copyBtn.addEventListener('click', () => {
		navigator.clipboard.writeText(content).then(() => {
			copyBtn.classList.add('copied-msg');
			setTimeout(() => copyBtn.classList.remove('copied-msg'), 1500);
		});
	});

	DOM.chatMessages.appendChild(div);
	return div;
}

function createStreamingMessage() {
	const div = document.createElement('div');
	div.className = 'message ai-message';
	div.innerHTML = `
    <div class="message-avatar" style="background:var(--accent);color:white;">GT</div>
    <div class="message-body">
      <div class="message-role">GT</div>
      <div class="message-content"></div>
      <div class="message-actions">
        <button class="msg-action-btn copy-msg-btn" title="Copy">
          <svg viewBox="0 0 24 24"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
        </button>
      </div>
    </div>
  `;
	DOM.chatMessages.appendChild(div);
	return div;
}

function renderMarkdown(text) {
	try {
		return marked.parse(text);
	} catch {
		return escapeHtml(text).replace(/\n/g, '<br>');
	}
}

// ============================================================
// Copy Code
// ============================================================
window.copyCode = function (blockId) {
	const block = document.getElementById(blockId);
	if (!block) return;
	const code = block.querySelector('pre code');
	if (!code) return;

	navigator.clipboard.writeText(code.textContent).then(() => {
		const btn = block.querySelector('.copy-code-btn');
		const originalText = btn.innerHTML;
		btn.innerHTML = `<svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12" stroke="currentColor" fill="none" stroke-width="2"/></svg> Copied!`;
		btn.classList.add('copied');
		setTimeout(() => {
			btn.innerHTML = originalText;
			btn.classList.remove('copied');
		}, 1500);
	});
};

// ============================================================
// Send Message & Streaming
// ============================================================
async function sendMessage(messageText) {
	const message = (messageText || DOM.userInput.value).trim();
	if (message === '' || isProcessing) return;

	isProcessing = true;
	DOM.userInput.disabled = true;
	DOM.sendButton.disabled = true;
	DOM.userInput.value = '';
	DOM.userInput.style.height = 'auto';

	// Create conversation if none active
	let conv = getActiveConversation();
	if (!conv) {
		conv = createConversation();
	}

	// If this is the first message, update the title
	if (conv.messages.length === 0) {
		conv.title = generateTitle(message);
		showChatMessages();
		renderConversationList();
		DOM.headerTitle.textContent = conv.title;
	}

	// Add user message
	conv.messages.push({ role: 'user', content: message });
	conv.updatedAt = Date.now();
	saveConversations();

	appendMessageElement('user', message);
	scrollToBottom();

	// Show typing
	DOM.typingIndicator.classList.add('visible');
	scrollToBottom();

	try {
		const streamDiv = createStreamingMessage();
		const contentEl = streamDiv.querySelector('.message-content');

		// Build messages for API (include all history)
		const apiMessages = conv.messages.map(m => ({ role: m.role, content: m.content }));

		const response = await fetch('/api/chat', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ messages: apiMessages, model: DOM.modelSelect.value }),
		});

		if (!response.ok) throw new Error('Failed to get response');
		if (!response.body) throw new Error('Response body is null');

		const reader = response.body.getReader();
		const decoder = new TextDecoder();
		let responseText = '';
		let buffer = '';
		let sawDone = false;

		const flushContent = () => {
			contentEl.innerHTML = renderMarkdown(responseText);
			scrollToBottom();
		};

		while (true) {
			const { done, value } = await reader.read();

			if (done) {
				const parsed = consumeSseEvents(buffer + '\n\n');
				for (const data of parsed.events) {
					if (data === '[DONE]') break;
					try {
						const jsonData = JSON.parse(data);
						let content = '';
						if (typeof jsonData.response === 'string' && jsonData.response.length > 0) {
							content = jsonData.response;
						} else if (jsonData.choices?.[0]?.delta?.content) {
							content = jsonData.choices[0].delta.content;
						}
						if (content) {
							responseText += content;
							flushContent();
						}
					} catch (e) {
						console.error('Error parsing SSE data:', e, data);
					}
				}
				break;
			}

			buffer += decoder.decode(value, { stream: true });
			const parsed = consumeSseEvents(buffer);
			buffer = parsed.buffer;

			for (const data of parsed.events) {
				if (data === '[DONE]') {
					sawDone = true;
					buffer = '';
					break;
				}
				try {
					const jsonData = JSON.parse(data);
					let content = '';
					if (typeof jsonData.response === 'string' && jsonData.response.length > 0) {
						content = jsonData.response;
					} else if (jsonData.choices?.[0]?.delta?.content) {
						content = jsonData.choices[0].delta.content;
					}
					if (content) {
						responseText += content;
						flushContent();
					}
				} catch (e) {
					console.error('Error parsing SSE data:', e, data);
				}
			}

			if (sawDone) break;
		}

		// Save assistant response
		if (responseText.length > 0) {
			conv.messages.push({ role: 'assistant', content: responseText });
			conv.updatedAt = Date.now();
			saveConversations();

			// Final render with full markdown
			contentEl.innerHTML = renderMarkdown(responseText);

			// Wire up copy button for this message
			const copyBtn = streamDiv.querySelector('.copy-msg-btn');
			copyBtn.addEventListener('click', () => {
				navigator.clipboard.writeText(responseText).then(() => {
					copyBtn.classList.add('copied-msg');
					setTimeout(() => copyBtn.classList.remove('copied-msg'), 1500);
				});
			});
		}
	} catch (error) {
		console.error('Error:', error);
		appendMessageElement('assistant', 'Sorry, there was an error processing your request. Please try again.');
	} finally {
		DOM.typingIndicator.classList.remove('visible');
		isProcessing = false;
		DOM.userInput.disabled = false;
		DOM.sendButton.disabled = false;
		DOM.userInput.focus();
		scrollToBottom();
		renderConversationList();
	}
}

function consumeSseEvents(buffer) {
	let normalized = buffer.replace(/\r/g, '');
	const events = [];
	let eventEndIndex;
	while ((eventEndIndex = normalized.indexOf('\n\n')) !== -1) {
		const rawEvent = normalized.slice(0, eventEndIndex);
		normalized = normalized.slice(eventEndIndex + 2);

		const lines = rawEvent.split('\n');
		const dataLines = [];
		for (const line of lines) {
			if (line.startsWith('data:')) {
				dataLines.push(line.slice('data:'.length).trimStart());
			}
		}
		if (dataLines.length === 0) continue;
		events.push(dataLines.join('\n'));
	}
	return { events, buffer: normalized };
}

function scrollToBottom() {
	requestAnimationFrame(() => {
		DOM.chatMessages.scrollTop = DOM.chatMessages.scrollHeight;
	});
}

// ============================================================
// Export
// ============================================================
function exportConversation() {
	const conv = getActiveConversation();
	if (!conv || conv.messages.length === 0) return;

	let text = `# ${conv.title}\n\nExported from GT\n\n---\n\n`;
	for (const msg of conv.messages) {
		if (msg.role === 'system') continue;
		const role = msg.role === 'user' ? 'You' : 'GT';
		text += `**${role}:**\n${msg.content}\n\n---\n\n`;
	}

	const blob = new Blob([text], { type: 'text/markdown' });
	const url = URL.createObjectURL(blob);
	const a = document.createElement('a');
	a.href = url;
	a.download = `${conv.title.replace(/[^a-zA-Z0-9\s]/g, '').trim()}.md`;
	a.click();
	URL.revokeObjectURL(url);
}

// ============================================================
// Sidebar Toggle
// ============================================================
function openSidebar() {
	DOM.sidebar.classList.add('open');
	DOM.sidebarOverlay.classList.add('visible');
}

function closeSidebar() {
	DOM.sidebar.classList.remove('open');
	DOM.sidebarOverlay.classList.remove('visible');
}

// ============================================================
// Input Handling
// ============================================================
function autoResizeInput() {
	DOM.userInput.style.height = 'auto';
	DOM.userInput.style.height = Math.min(DOM.userInput.scrollHeight, 200) + 'px';
}

function updateSendButton() {
	DOM.sendButton.disabled = DOM.userInput.value.trim() === '' || isProcessing;
}

// ============================================================
// Event Listeners
// ============================================================

// Input
DOM.userInput.addEventListener('input', () => {
	autoResizeInput();
	updateSendButton();
});

DOM.userInput.addEventListener('keydown', (e) => {
	if (e.key === 'Enter' && !e.shiftKey) {
		e.preventDefault();
		sendMessage();
	}
});

DOM.sendButton.addEventListener('click', () => sendMessage());

// Sidebar
DOM.menuToggle.addEventListener('click', () => {
	DOM.sidebar.classList.contains('open') ? closeSidebar() : openSidebar();
});

DOM.sidebarOverlay.addEventListener('click', closeSidebar);

DOM.newChatBtn.addEventListener('click', () => {
	createConversation();
	DOM.userInput.focus();
	closeSidebar();
});

DOM.clearAllBtn.addEventListener('click', clearAllConversations);

DOM.searchInput.addEventListener('input', (e) => {
	renderConversationList(e.target.value);
});

// Suggestion cards
DOM.suggestionCards.forEach(card => {
	card.addEventListener('click', () => {
		const prompt = card.getAttribute('data-prompt');
		if (prompt) {
			// Create a new conversation for suggestion
			createConversation();
			sendMessage(prompt);
		}
	});
});

// Export
DOM.exportBtn.addEventListener('click', exportConversation);

// Keyboard shortcut: Ctrl+Shift+N for new chat
document.addEventListener('keydown', (e) => {
	if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'N') {
		e.preventDefault();
		createConversation();
		DOM.userInput.focus();
	}
});

// ============================================================
// Initialize
// ============================================================
function init() {
	loadConversations();
	renderConversationList();

	if (conversations.length > 0) {
		setActiveConversation(conversations[0].id);
	} else {
		showWelcomeScreen();
	}

	DOM.userInput.focus();
}

init();
