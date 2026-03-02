import React, { useState, useEffect, useRef } from 'react';
import { auth, logoutUser } from './firebase';
import { marked } from 'marked';
import hljs from 'highlight.js';
import 'highlight.js/styles/github-dark.css';
import DOMPurify from 'dompurify';

export default function ChatLayout() {
	const [conversations, setConversations] = useState([]);
	const [activeId, setActiveId] = useState(null);
	const [userInput, setUserInput] = useState('');
	const [isProcessing, setIsProcessing] = useState(false);
	const [model, setModel] = useState('@cf/meta/llama-3.3-70b-instruct-fp8-fast');
	const [streamingText, setStreamingText] = useState('');
	const [isSidebarOpen, setIsSidebarOpen] = useState(false);
	const [attachments, setAttachments] = useState([]);
	const [searchTerm, setSearchTerm] = useState('');
	const [webSearch, setWebSearch] = useState(false);
	const [isSearching, setIsSearching] = useState(false);
	const [currentUser, setCurrentUser] = useState(null);
	const messagesEndRef = useRef(null);
	const textareaRef = useRef(null);
	const fileInputRef = useRef(null);

	// Get current user info
	useEffect(() => {
		const user = auth?.currentUser;
		if (user) {
			setCurrentUser({
				displayName: user.displayName || user.email?.split('@')[0] || 'User',
				email: user.email || '',
				photoURL: user.photoURL || null
			});
		} else if (localStorage.getItem("gt_auth_token") === "mock") {
			setCurrentUser({
				displayName: 'Mock User',
				email: 'mock@example.com',
				photoURL: null
			});
		}
	}, []);

	// Initialize PDF.js worker
	useEffect(() => {
		if (window.pdfjsLib) {
			window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.worker.min.js';
		}
	}, []);

	const addAttachment = (file, content, preview = null) => {
		const newAttachment = {
			id: 'file-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
			name: file.name,
			size: (file.size / 1024).toFixed(1) + ' KB',
			type: file.type,
			file: file,
			content: content,
			preview: preview
		};
		setAttachments(prev => [...prev, newAttachment]);
	};

	const handleFileSelect = (e) => {
		const files = Array.from(e.target.files);
		files.forEach(file => {
			const isText = file.type.startsWith('text/') ||
				file.name.endsWith('.js') ||
				file.name.endsWith('.py') ||
				file.name.endsWith('.md') ||
				file.name.endsWith('.json') ||
				file.name.endsWith('.css') ||
				file.name.endsWith('.html');
			const isPDF = file.type === 'application/pdf';

			if (isText) {
				const reader = new FileReader();
				reader.onload = (event) => {
					addAttachment(file, event.target.result);
				};
				reader.readAsText(file);
			} else if (isPDF && window.pdfjsLib) {
				const reader = new FileReader();
				reader.onload = async (event) => {
					try {
						const typedarray = new Uint8Array(event.target.result);
						const loadingTask = window.pdfjsLib.getDocument(typedarray);
						const pdf = await loadingTask.promise;
						let fullText = '';
						// Read more pages but be selective about text per page to avoid context bloat
						const maxPages = Math.min(pdf.numPages, 100);
						for (let i = 1; i <= maxPages; i++) {
							const page = await pdf.getPage(i);
							const textContent = await page.getTextContent();
							const pageText = textContent.items.map(item => item.str).join(' ');
							// Only take the first 1000 characters per page if it's a huge book
							fullText += `--- Page ${i} ---\n${pageText.substring(0, 1000)}\n\n`;
						}
						addAttachment(file, fullText);
					} catch (err) {
						console.error("PDF reading error:", err);
						addAttachment(file, null);
					}
				};
				reader.readAsArrayBuffer(file);
			} else if (file.type.startsWith('image/')) {
				addAttachment(file, null, URL.createObjectURL(file));
			} else {
				addAttachment(file, null);
			}
		});
		e.target.value = '';
	};

	const removeAttachment = (id) => {
		setAttachments(prev => prev.filter(a => a.id !== id));
	};

	// Initialize marked
	useEffect(() => {
		const renderer = new marked.Renderer();
		renderer.code = function ({ text, lang }) {
			const language = lang || 'plaintext';
			let highlighted;
			try {
				if (language && hljs.getLanguage(language)) {
					highlighted = hljs.highlight(text, { language }).value;
				} else {
					highlighted = hljs.highlightAuto(text).value;
				}
			} catch {
				highlighted = text;
			}
			const blockId = 'code-' + Math.random().toString(36).substr(2, 9);
			return `<div class="code-block" id="${blockId}">
				<div class="code-header">
					<span class="code-language">${language}</span>
					<button class="copy-code-btn" onclick="navigator.clipboard.writeText(\`${text.replace(/`/g, '\\`').replace(/\$/g, '\\$')}\`).then(() => { this.innerText = 'Copied!'; setTimeout(() => this.innerText = 'Copy', 1500); })">
						<svg viewBox="0 0 24 24"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
						Copy
					</button>
				</div>
				<pre><code class="hljs language-${language}">${highlighted}</code></pre>
			</div>`;
		};
		marked.setOptions({ renderer, breaks: true, gfm: true });
	}, []);

	// Render Math (KaTeX)
	useEffect(() => {
		if (window.renderMathInElement) {
			window.renderMathInElement(document.body, {
				delimiters: [
					{ left: '$$', right: '$$', display: true },
					{ left: '$', right: '$', display: false },
					{ left: '\\(', right: '\\)', display: false },
					{ left: '\\[', right: '\\]', display: true }
				],
				throwOnError: false
			});
		}
	}, [conversations, streamingText]);

	const handleExport = () => {
		if (!activeConversation) return;
		const content = activeConversation.messages.map(m =>
			`### ${m.role === 'user' ? 'You' : 'GT'}\n${m.content}\n`
		).join('\n---\n\n');

		const blob = new Blob([content], { type: 'text/markdown' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = `${activeConversation.title.replace(/\s+/g, '_')}.md`;
		a.click();
		URL.revokeObjectURL(url);
	};

	const filteredConversations = conversations.filter(c =>
		c.title.toLowerCase().includes(searchTerm.toLowerCase())
	);

	// Fetch messages for active conversation if they don't exist
	useEffect(() => {
		const fetchMessages = async () => {
			if (!activeId) return;
			const activeConv = conversations.find(c => c.id === activeId);
			if (activeConv && (!activeConv.messages || activeConv.messages.length === 0)) {
				try {
					const res = await fetch(`/api/messages?conversationId=${activeId}`);
					if (res.ok) {
						const data = await res.json();
						setConversations(prev => prev.map(c =>
							c.id === activeId ? { ...c, messages: data.messages || [] } : c
						));
					}
				} catch (e) {
					console.error("Failed to fetch messages", e);
				}
			}
		};
		fetchMessages();
	}, [activeId]);

	// Initial load from backend + local fallback
	useEffect(() => {
		const loadHistory = async () => {
			const saved = localStorage.getItem('gt_conversations');
			if (saved) {
				setConversations(JSON.parse(saved));
			}

			if (auth?.currentUser) {
				try {
					const res = await fetch('/api/history', {
						headers: { 'Authorization': `Bearer ${auth.currentUser.uid}` }
					});
					if (res.ok) {
						const data = await res.json();
						if (data.conversations && data.conversations.length > 0) {
							// Initialize with empty messages array to prevent crashes
							const initialized = data.conversations.map(c => ({
								...c,
								messages: c.messages || []
							}));
							setConversations(initialized);
						}
					}
				} catch (e) {
					console.error("Failed to load history from backend", e);
				}
			}
		};
		loadHistory();
	}, []);

	// Save on change (Sync to local storage)
	useEffect(() => {
		if (conversations.length > 0) {
			localStorage.setItem('gt_conversations', JSON.stringify(conversations));
		}
	}, [conversations]);

	// Auto-scroll to bottom
	useEffect(() => {
		messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
	}, [conversations, streamingText, isProcessing]);

	const activeConversation = conversations.find(c => c.id === activeId);

	const handleNewChat = () => {
		setActiveId(null);
		setUserInput('');
		setStreamingText('');
		setIsProcessing(false);
	};

	const logout = () => {
		logoutUser();
	};

	const generateTitle = (text) => {
		const cleanText = text.trim();
		if (cleanText.length <= 40) return cleanText;
		return cleanText.substring(0, 40) + '...';
	};

	const handleSend = async (overridePrompt) => {
		const prompt = (overridePrompt || userInput).trim();
		if (!prompt || isProcessing) return;

		setIsProcessing(true);
		if (!overridePrompt) setUserInput('');

		const authHeaders = {};
		if (auth?.currentUser) {
			authHeaders['Authorization'] = `Bearer ${auth.currentUser.uid}`;
		} else if (localStorage.getItem("gt_auth_token") === "mock") {
			authHeaders['Authorization'] = `Bearer mock-user-123`;
		}

		// Prepare attachments for upload and processing
		const uploadedAttachments = [];
		if (attachments.length > 0) {
			for (const att of attachments) {
				try {
					const formData = new FormData();
					formData.append('file', att.file);
					const uploadRes = await fetch('/api/upload', {
						method: 'POST',
						headers: authHeaders,
						body: formData
					});
					if (uploadRes.ok) {
						const uploadData = await uploadRes.json();
						uploadedAttachments.push({
							...uploadData,
							preview: att.preview // Keep local preview
						});
					}
				} catch (e) {
					console.error("Failed to upload file", att.name, e);
				}
			}
		}

		// Build user message with metadata for attachments
		const userMsg = {
			id: Date.now().toString(),
			role: 'user',
			content: prompt,
			attachments: uploadedAttachments
		};

		const updatedConversations = [...conversations];
		const activeConv = activeConversation;

		if (activeConv) {
			const convIndex = updatedConversations.findIndex(c => c.id === activeId);
			updatedConversations[convIndex].messages.push(userMsg);
			updatedConversations[convIndex].updatedAt = new Date().toISOString();
		} else {
			const newConvId = Date.now().toString();
			updatedConversations.unshift({
				id: newConvId,
				title: prompt.substring(0, 30) + (prompt.length > 30 ? '...' : ''),
				messages: [userMsg],
				createdAt: new Date().toISOString(),
				updatedAt: new Date().toISOString()
			});
			setActiveId(newConvId);
		}

		setConversations([...updatedConversations]);
		setUserInput('');
		setAttachments([]);
		if (textareaRef.current) textareaRef.current.style.height = 'auto';

		try {
			const currentConv = updatedConversations.find(c => c.id === (activeId || updatedConversations[0].id));
			const headers = { 'Content-Type': 'application/json', ...authHeaders };

			// Prepare messages for AI - inject document content if available
			const aiMessages = currentConv.messages.map((m, idx) => {
				let content = m.content;
				// If this is the last message and there are local attachments (still in the scope)
				if (idx === currentConv.messages.length - 1 && attachments.length > 0) {
					const textContents = attachments
						.filter(a => a.content)
						.map(a => `\n--- Attached File: ${a.name} ---\n${a.content}\n--- End of File ---`)
						.join('\n');
					if (textContents) {
						content += `\n\n[USER PROVIDED DOCUMENTS]:\n${textContents}`;
					}
				}
				return { role: m.role, content: content };
			});
			// --- Web Search Integration ---
			let searchResults = '';
			if (webSearch) {
				setIsSearching(true);
				try {
					const searchRes = await fetch('/api/search', {
						method: 'POST',
						headers: { 'Content-Type': 'application/json' },
						body: JSON.stringify({ query: prompt })
					});
					if (searchRes.ok) {
						const searchData = await searchRes.json();
						searchResults = searchData.formatted || '';
					}
				} catch (e) {
					console.error("Web search failed:", e);
				}
				setIsSearching(false);
			}

			const response = await fetch('/api/chat', {
				method: 'POST',
				headers: headers,
				body: JSON.stringify({
					messages: aiMessages,
					model: model,
					conversationId: currentConv.id,
					attachments: uploadedAttachments,
					webSearch: webSearch,
					searchResults: searchResults
				}),
			});

			if (!response.ok) throw new Error('Failed to get response');
			if (!response.body) throw new Error('Response body is null');

			const reader = response.body.getReader();
			const decoder = new TextDecoder();
			let responseText = '';

			while (true) {
				const { done, value } = await reader.read();
				if (done) break;

				const chunk = decoder.decode(value, { stream: true });
				const lines = chunk.split('\n');
				for (const line of lines) {
					if (line.startsWith('data:')) {
						const data = line.slice(5).trim();
						if (data === '[DONE]') break;
						try {
							const jsonData = JSON.parse(data);
							const content = jsonData.response || jsonData.choices?.[0]?.delta?.content || '';
							responseText += content;
							setStreamingText(responseText);
						} catch (e) {
							// Ignore parse errors from partial segments
						}
					}
				}
			}

			if (responseText) {
				const assistantMsg = { role: 'assistant', content: responseText };
				currentConv.messages = [...currentConv.messages, assistantMsg];
				currentConv.updatedAt = Date.now();
				setConversations([...updatedConversations]);
			}
		} catch (error) {
			console.error('Error:', error);
			currentConv.messages = [...currentConv.messages, { role: 'assistant', content: 'Sorry, I encountered an error. Please try again.' }];
			setConversations([...updatedConversations]);
		} finally {
			setStreamingText('');
			setIsProcessing(false);
		}
	};

	const handleDeleteConversation = (e, id) => {
		e.stopPropagation();
		const updated = conversations.filter(c => c.id !== id);
		setConversations(updated);
		if (activeId === id) setActiveId(null);
		localStorage.setItem('gt_conversations', JSON.stringify(updated));
	};

	const handleClearAll = () => {
		if (window.confirm('Delete all conversations?')) {
			setConversations([]);
			setActiveId(null);
			localStorage.removeItem('gt_conversations');
		}
	};

	const handleSelectConversation = (id) => {
		setActiveId(id);
		setIsSidebarOpen(false);
	};

	const renderMarkdown = (content) => {
		return { __html: DOMPurify.sanitize(marked.parse(content)) };
	};

	return (
		<div className="app">
			<div
				className={`sidebar-overlay ${isSidebarOpen ? 'visible' : ''}`}
				id="sidebar-overlay"
				onClick={() => setIsSidebarOpen(false)}
			></div>
			<aside className={`sidebar ${isSidebarOpen ? 'open' : ''}`} id="sidebar">
				<div className="sidebar-header">
					<div className="brand" onClick={() => setActiveId(null)} style={{ cursor: 'pointer' }}>
						<div className="brand-logo">GT</div>
						<span className="brand-name">GT</span>
					</div>
					<button className="new-chat-btn" id="new-chat-btn" onClick={handleNewChat}>
						<svg viewBox="0 0 24 24">
							<line x1="12" y1="5" x2="12" y2="19" />
							<line x1="5" y1="12" x2="19" y2="12" />
						</svg>
						New Chat
					</button>
				</div>

				<div className="sidebar-search">
					<div className="sidebar-search-wrapper">
						<svg viewBox="0 0 24 24">
							<circle cx="11" cy="11" r="8" />
							<line x1="21" y1="21" x2="16.65" y2="16.65" />
						</svg>
						<input
							type="text"
							id="search-input"
							placeholder="Search conversations..."
							value={searchTerm}
							onChange={(e) => setSearchTerm(e.target.value)}
						/>
					</div>
				</div>

				<div className="conversation-list" id="conversation-list">
					{(searchTerm ? filteredConversations : conversations).length === 0 ? (
						<div className="no-conversations">
							{searchTerm ? 'No matches found' : 'No conversations yet'}
						</div>
					) : (
						(searchTerm ? filteredConversations : conversations).map(conv => (
							<div
								key={conv.id}
								className={`conv-item ${activeId === conv.id ? 'active' : ''}`}
								onClick={() => handleSelectConversation(conv.id)}
							>
								<span className="conv-item-title">{conv.title}</span>
								<button className="conv-item-delete" onClick={(e) => handleDeleteConversation(e, conv.id)}>
									<svg viewBox="0 0 24 24">
										<line x1="18" y1="6" x2="6" y2="18" />
										<line x1="6" y1="6" x2="18" y2="18" />
									</svg>
								</button>
							</div>
						))
					)}
				</div>

				<div className="sidebar-footer">
					{currentUser && (
						<div className="user-profile">
							<div className="user-avatar">
								{currentUser.photoURL ? (
									<img src={currentUser.photoURL} alt={currentUser.displayName} />
								) : (
									<div className="user-avatar-placeholder">
										{currentUser.displayName?.charAt(0).toUpperCase() || 'U'}
									</div>
								)}
							</div>
							<div className="user-info">
								<div className="user-name">{currentUser.displayName}</div>
								<div className="user-email">{currentUser.email}</div>
							</div>
						</div>
					)}
					<button className="sidebar-footer-btn" id="clear-all-btn" onClick={handleClearAll}>
						<svg viewBox="0 0 24 24">
							<polyline points="3 6 5 6 21 6" />
							<path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
						</svg>
						Clear all conversations
					</button>
				</div>
				<div className="logout-btn-wrapper">
					<button className="logout-btn" id="logout-btn" onClick={logout}>
						<svg viewBox="0 0 24 24">
							<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
							<polyline points="16 17 21 12 16 7" />
							<line x1="21" y1="12" x2="9" y2="12" />
						</svg>
						Log out
					</button>
				</div>
			</aside>

			<main className="main-content" id="main-content">
				<header className="chat-header">
					<button className="menu-toggle" id="menu-toggle" onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
						<svg viewBox="0 0 24 24">
							<line x1="3" y1="6" x2="21" y2="6" />
							<line x1="3" y1="12" x2="21" y2="12" />
							<line x1="3" y1="18" x2="21" y2="18" />
						</svg>
					</button>
					<div className="model-selector">
						<select id="model-select" value={model} onChange={(e) => setModel(e.target.value)}>
							<optgroup label="🏆 Flagship">
								<option value="@cf/meta/llama-3.3-70b-instruct-fp8-fast">Llama 3.3 70B ⭐</option>
								<option value="@cf/qwen/qwen2.5-72b-instruct-fp8-fast">Qwen 2.5 72B</option>
								<option value="@cf/deepseek-ai/deepseek-r1-distill-qwen-32b">DeepSeek R1 32B</option>
							</optgroup>
							<optgroup label="⚡ Power">
								<option value="@cf/qwen/qwen2.5-coder-32b-instruct">Qwen 2.5 Coder 32B</option>
								<option value="@cf/google/gemma-3-12b-it">Gemma 3 12B</option>
								<option value="@cf/mistral/mistral-small-3.1-24b-instruct">Mistral 3.1 24B</option>
							</optgroup>
							<optgroup label="🚀 Speed">
								<option value="@cf/meta/llama-3.1-8b-instruct-fp8">Llama 3.1 8B</option>
								<option value="@cf/meta/llama-4-scout-17b-16e-instruct">Llama 4 Scout 17B</option>
								<option value="@cf/google/gemma-3-4b-it">Gemma 3 4B</option>
								<option value="@cf/qwen/qwen2.5-7b-instruct-fp8">Qwen 2.5 7B</option>
								<option value="@cf/qwen/qwen3-8b">Qwen 3 8B</option>
							</optgroup>
							<optgroup label="🧠 Specialist">
								<option value="@cf/qwen/qwen3-30b-a3b">Qwen 3 30B MoE</option>
								<option value="@hf/nousresearch/hermes-2-pro-mistral-7b">Hermes 2 Pro 7B</option>
								<option value="@cf/deepseek-ai/deepseek-math-7b-instruct">DeepSeek Math 7B</option>
							</optgroup>
						</select>
					</div>
					<div className="header-title" id="header-title">
						{activeConversation?.messages.length > 0 ? activeConversation.title : ''}
					</div>
					<div className="header-actions">
						<button className="header-action-btn" id="export-btn" title="Export conversation" onClick={handleExport}>
							<svg viewBox="0 0 24 24">
								<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
								<polyline points="7 10 12 15 17 10" />
								<line x1="12" y1="15" x2="12" y2="3" />
							</svg>
						</button>
					</div>
				</header>

				{(!activeConversation || activeConversation.messages.length === 0) && (
					<div className="welcome-screen" id="welcome-screen">
						<div className="welcome-logo">GT</div>
						<h1 className="welcome-title">How can I help you today?</h1>
						<p className="welcome-subtitle">I can help you write code, analyze data, draft content, explain concepts, and much more.</p>
						<div className="suggestion-cards">
							{[
								{ title: 'Write code', desc: 'Generate code for any project', prompt: 'Write a Python script that fetches data from a REST API with error handling', icon: <><polyline points="16 18 22 12 16 6" /><polyline points="8 6 2 12 8 18" /></> },
								{ title: 'Analyze data', desc: 'Break down complex information', prompt: 'Analyze the pros and cons of using microservices vs monolithic architecture', icon: <><line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" /></> },
								{ title: 'Draft content', desc: 'Write emails, essays, and more', prompt: 'Draft a professional email to a client about a project timeline update', icon: <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" /> },
								{ title: 'Explain concepts', desc: 'Understand any topic easily', prompt: 'Explain how neural networks work in simple terms with analogies', icon: <><circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" /></> }
							].map((item, i) => (
								<button key={i} className="suggestion-card" onClick={() => handleSend(item.prompt)}>
									<div className="suggestion-card-icon"><svg viewBox="0 0 24 24">{item.icon}</svg></div>
									<span className="suggestion-card-title">{item.title}</span>
									<span className="suggestion-card-desc">{item.desc}</span>
								</button>
							))}
						</div>
					</div>
				)}

				<div className="chat-messages" id="chat-messages" style={{ display: (activeConversation?.messages.length > 0 || streamingText || isProcessing) ? 'block' : 'none' }}>
					{activeConversation?.messages.map((msg, i) => (
						<div key={i} className={`message ${msg.role === 'assistant' ? 'ai-message' : 'user-message'}`}>
							<div className="message-avatar" style={{ background: msg.role === 'assistant' ? 'var(--accent)' : 'var(--bg-secondary)', color: 'white' }}>{msg.role === 'assistant' ? 'GT' : 'U'}</div>
							<div className="message-body">
								<div className="message-role">{msg.role === 'assistant' ? 'GT' : 'You'}</div>
								<div className="message-content" dangerouslySetInnerHTML={
									msg.role === 'assistant'
										? renderMarkdown(msg.content)
										: {
											__html: msg.content
												.split('[USER PROVIDED DOCUMENTS]')[0] // Hide injected documents from UI
												.trim()
												.replace(/\n/g, '<br>')
										}
								} />
								{msg.attachments && msg.attachments.length > 0 && (
									<div className="message-attachments">
										{msg.attachments.map((att, idx) => {
											const fileUrl = att.key ? `/api/files?key=${encodeURIComponent(att.key)}` : att.preview;
											return att.type?.startsWith('image/') ? (
												<img key={idx} src={fileUrl} alt={att.name} className="message-attachment-image" onClick={() => window.open(fileUrl, '_blank')} />
											) : (
												<div key={idx} className="message-attachment-file" onClick={() => window.open(fileUrl, '_blank')}>
													<div className="message-attachment-file-icon">
														<svg viewBox="0 0 24 24"><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" /><polyline points="13 2 13 9 20 9" /></svg>
													</div>
													<div className="message-attachment-file-info">
														<div className="message-attachment-file-name">{att.name}</div>
														<div className="message-attachment-file-size">{att.size}</div>
													</div>
												</div>
											);
										})}
									</div>
								)}
								<div className="message-actions">
									<button className="msg-action-btn copy-msg-btn" title="Copy" onClick={() => navigator.clipboard.writeText(msg.content)}>
										<svg viewBox="0 0 24 24"><rect x="9" y="9" width="13" height="13" rx="2" ry="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></svg>
									</button>
								</div>
							</div>
						</div>
					))}
					{streamingText && (
						<div className="message ai-message">
							<div className="message-avatar" style={{ background: 'var(--accent)', color: 'white' }}>GT</div>
							<div className="message-body">
								<div className="message-role">GT</div>
								<div className="message-content" dangerouslySetInnerHTML={renderMarkdown(streamingText)} />
							</div>
						</div>
					)}
					{isProcessing && !streamingText && (
						<div className="typing-indicator visible">
							<div className="message-avatar ai-avatar" style={{ background: 'var(--accent)', color: 'white', width: '32px', height: '32px', borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: '600' }}>GT</div>
							<div>
								<div className="message-role">GT</div>
								<div className="typing-dots"><span></span><span></span><span></span></div>
							</div>
						</div>
					)}
					<div ref={messagesEndRef} />
				</div>

				<div className="input-area">
					<div className="input-wrapper">
						{attachments.length > 0 && (
							<div className="attachment-previews has-files">
								{attachments.map(att => (
									<div key={att.id} className="attachment-preview-item">
										{att.preview ? <img src={att.preview} alt="preview" /> : (
											<div className="attachment-preview-icon">
												<svg viewBox="0 0 24 24"><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" /><polyline points="13 2 13 9 20 9" /></svg>
											</div>
										)}
										<div className="attachment-preview-info">
											<div className="attachment-preview-name">{att.name}</div>
											<div className="attachment-preview-size">{att.size}</div>
										</div>
										<button className="attachment-remove-btn" onClick={() => removeAttachment(att.id)}>×</button>
									</div>
								))}
							</div>
						)}
						<div className="input-container">
							<input
								type="file"
								ref={fileInputRef}
								onChange={handleFileSelect}
								style={{ display: 'none' }}
								multiple
							/>
							<button className="attach-btn" onClick={() => fileInputRef.current.click()}>
								<svg viewBox="0 0 24 24"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" /></svg>
							</button>
							<button
								className={`web-search-btn ${webSearch ? 'active' : ''}`}
								onClick={() => setWebSearch(!webSearch)}
								title={webSearch ? 'Web Search ON' : 'Enable Web Search'}
							>
								<svg viewBox="0 0 24 24">
									<circle cx="12" cy="12" r="10" />
									<line x1="2" y1="12" x2="22" y2="12" />
									<path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
								</svg>
								{webSearch && <span className="web-search-label">Web</span>}
							</button>
							<textarea
								ref={textareaRef}
								value={userInput}
								onChange={(e) => {
									setUserInput(e.target.value);
									e.target.style.height = 'auto';
									e.target.style.height = Math.min(e.target.scrollHeight, 200) + 'px';
								}}
								onKeyDown={(e) => {
									if (e.key === 'Enter' && !e.shiftKey) {
										e.preventDefault();
										handleSend();
									}
								}}
								placeholder={webSearch ? "Search the web and ask GT..." : "Message GT..."}
								rows="1"
								autoFocus
							/>
							<button
								className="send-btn"
								onClick={() => handleSend()}
								disabled={!userInput.trim() || isProcessing}
								style={{ opacity: (!userInput.trim() || isProcessing) ? 0.5 : 1 }}
							>
								<svg viewBox="0 0 24 24">
									<path d="M22 2L11 13" />
									<path d="M22 2L15 22L11 13L2 9L22 2Z" />
								</svg>
							</button>
						</div>
					</div>
					{isSearching && (
						<p className="input-hint" style={{ color: 'var(--accent)', fontWeight: '500' }}>
							🌐 Searching the web for latest information...
						</p>
					)}
					<p className="input-hint">GT can make mistakes. Consider checking important information.</p>
				</div>
			</main>
		</div>
	);
}
