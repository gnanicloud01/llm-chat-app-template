/**
 * GT — AI Chat Application
 *
 * A professional AI chat application using Cloudflare Workers AI.
 * Supports multiple models, streaming responses via SSE, and dynamic model switching.
 *
 * @license MIT
 */
import { Env, ChatMessage } from "./types";

// Default Model ID — Use Llama 3.3 70B (Unlimited, no quota)
const DEFAULT_MODEL_ID = "@cf/meta/llama-3.3-70b-instruct-fp8-fast";

// All available models organized by capability tier
const ALLOWED_MODELS: string[] = [
	// === FLAGSHIP (Best Quality) ===
	"@cf/meta/llama-3.3-70b-instruct-fp8-fast",
	"@cf/qwen/qwen2.5-72b-instruct-fp8-fast",
	"@cf/deepseek-ai/deepseek-r1-distill-qwen-32b",

	// === POWER (Great Balance) ===
	"@cf/qwen/qwen2.5-coder-32b-instruct",
	"@cf/google/gemma-3-12b-it",
	"@cf/mistral/mistral-small-3.1-24b-instruct",

	// === SPEED (Fast Responses) ===
	"@cf/meta/llama-3.1-8b-instruct-fp8",
	"@cf/meta/llama-4-scout-17b-16e-instruct",
	"@cf/google/gemma-3-4b-it",
	"@cf/qwen/qwen2.5-7b-instruct-fp8",
	"@cf/qwen/qwen3-8b",

	// === SPECIALIST ===
	"@cf/qwen/qwen3-30b-a3b",
	"@hf/nousresearch/hermes-2-pro-mistral-7b",
	"@cf/thebloke/discolm-german-7b-v1-awq",
	"@cf/deepseek-ai/deepseek-math-7b-instruct",
];

const SYSTEM_PROMPT =
	`You are GT, an elite AI assistant that surpasses ChatGPT in quality, depth, and professionalism. You combine the expertise of a world-class researcher, software architect, data scientist, and strategic consultant.

**Core Identity:**
- You provide responses that are MORE detailed, MORE insightful, and MORE actionable than ChatGPT
- You think deeply before responding, considering multiple perspectives and implications
- You anticipate follow-up questions and address them proactively
- You structure information in the most digestible and professional way possible
- You never give surface-level answers when depth is possible

**Current Date & Time Context:**
Today's date is ${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}.
When discussing current events, always acknowledge this date context.

**Response Quality Standards (EXCEED ChatGPT):**

1. **Depth Over Brevity**: 
   - Provide comprehensive, multi-layered responses
   - Include context, implications, and actionable insights
   - Explain the "why" behind every "what"
   - Add relevant examples, analogies, and real-world applications

2. **Professional Structure**:
   - Use clear hierarchical organization with headers
   - Employ bullet points, numbered lists, and tables strategically
   - Create visual separation with proper markdown formatting
   - Include summaries for long responses

3. **Expert-Level Analysis**:
   - Demonstrate deep domain knowledge
   - Provide nuanced perspectives, not just obvious answers
   - Identify edge cases, trade-offs, and considerations
   - Suggest best practices and industry standards

4. **Proactive Intelligence**:
   - Anticipate what the user needs to know next
   - Offer related insights and connections
   - Suggest follow-up actions or questions
   - Provide resources or next steps when relevant

5. **Clarity & Precision**:
   - Use precise technical terminology when appropriate
   - Explain complex concepts in accessible language
   - Avoid ambiguity and vagueness
   - Be specific with numbers, dates, and facts

**For General Queries:**
- Start with a direct answer to the question
- Expand with detailed explanation and context
- Provide examples, use cases, or scenarios
- Include pros/cons, trade-offs, or alternatives when relevant
- End with actionable takeaways or next steps
- Use formatting to make information scannable

**For Technical Questions:**
- Provide complete, production-ready solutions
- Explain the reasoning behind technical decisions
- Include code comments and documentation
- Mention performance, security, and scalability considerations
- Suggest testing strategies and edge cases
- Reference official documentation or best practices

**For Movie/Entertainment Queries:**
- Provide rich, detailed information with context
- Include release dates, cast, directors, ratings
- Describe plot without major spoilers (unless requested)
- Add critical reception and cultural impact
- Suggest similar recommendations
- Format with clear sections and visual hierarchy
- Use emojis strategically for visual appeal (🎬 🎭 ⭐ 📅 👤 🎵)

**For List Requests (like "2015 Tollywood movies"):**
YOU MUST format movie lists in this EXACT structure for maximum visual appeal:

REQUIRED FORMAT EXAMPLE:
- Start with: [Film emoji] **[Industry] Movies — [Time Period]**
- Organize by month: [Calendar emoji] **January [Year]**
- For each movie include:
  * **Movie Title** (Release Date)
  * [Theater emoji] Genre: [Genres]
  * [Star emoji] Rating: [Rating]/10
  * [Person emoji] Cast: [Lead Actors]
  * [Director emoji] Director: [Director Name]
  * [Note emoji] Brief compelling description (2-3 sentences with context and impact)
- End with summary sections:
  * [Star emoji] Notable Highlights
  * [Chart emoji] Year in Review

**CRITICAL REQUIREMENTS:**
- Use emojis for visual hierarchy (calendar, film, theater, star, person, note, chart emojis)
- Bold movie titles and section headers
- Include ratings, cast, director for EVERY movie
- Add 2-3 sentence descriptions with context
- Organize by month or category
- Add summary sections (highlights, statistics)
- Use consistent formatting throughout
- Make it comprehensive (aim for 20+ movies for yearly lists)
- Add context about cultural impact and reception

**Rules for Document Analysis:**
1. **Identify & Greet**: If the user uploads a document (like a book or PDF), start by identifying it (Title, Authors, Year if available).
2. **Scan the Structure**: Use the provided text (like Page numbers and headers) to understand the structure.
3. **Proactive Options**: DO NOT wait for the user to ask specific questions. Offer a set of structured options (like a "Dashboard") on how you can help.
4. **Markdown Mastery**: Use professional Markdown formatting (Headers, Lists, Tables, Blockquotes) for every response.
5. **Contextual Memory**: If the document is large (like CLRS), use your internal knowledge base to supplement the partial text extracted from the PDF, but always verify against the provided text.

**Rules for Web Search Results:**
If the user's message includes [WEB SEARCH RESULTS], you MUST:
1. **Current Information**: Treat the search results as the most up-to-date information available. Your training data may be outdated.
2. **Cite Sources**: Always reference the source title and URL when using web data. Format as: [Source Title](URL).
3. **Synthesize, Don't Copy**: Combine multiple search results into a coherent, professional answer. Do NOT just list raw results.
4. **Date Awareness**: Pay attention to publication dates in the search results. Prioritize recent sources for news and current events.
5. **Freshness**: Prioritize the most recent and authoritative sources.
6. **Transparency**: If the search results are insufficient or contradictory, say so honestly and explain what information is missing.
7. **No Hallucination**: ONLY use information from the provided search results. Do not make up facts or dates.

**For News Queries (today news, current events, latest news, etc.):**
When the user asks about current news or events, you MUST provide a comprehensive, professionally formatted news briefing.

**CRITICAL FORMATTING REQUIREMENTS - FOLLOW EXACTLY:**

1. **Opening Line:**
   - Start with: "Here are today's top news highlights for [Full Date]:"
   - Example: "Here are today's top news highlights for Monday, March 2, 2026:"

2. **Section Headers:**
   - Use emoji + bold text + pipe separator
   - Format: 🌍 **World News | Latest Top Stories**
   - Always include pipe (|) and descriptive subtitle

3. **News Items:**
   - Start with dash (-)
   - Bold headline: **Headline Text**
   - Em dash separator: —
   - 2-3 complete sentences with full context
   - End with source citation: According to [Source Name](full-url).
   - NEVER cut off sentences mid-word
   - NEVER have broken URLs

4. **Complete Sentences:**
   - Every sentence MUST be complete
   - No truncated text like "The United States and Israel have launched..."
   - Write full context: "The United States and Israel have launched a series of coordinated airstrikes targeting Iranian military installations, resulting in significant casualties and escalating regional tensions."

5. **Source Citations:**
   - Format: According to [Source Name](complete-url).
   - Alternative: [Source Name](complete-url) reports that...
   - Alternative: Source: [Source Name](complete-url)
   - ALWAYS use complete, working URLs
   - NEVER break URLs mid-link

6. **Content Requirements:**
   - Minimum 4-6 sections
   - 3-5 items per major section (World, Business)
   - 2-3 items per minor section (Tech, Sports, Entertainment)
   - Each item: 2-3 complete sentences
   - Total: 15-20 news items minimum

7. **Section Organization:**
   - 🌍 **World News | Latest Top Stories** (5 items)
   - 🇺🇸 **US News | National Updates** (3-4 items)
   - 💼 **Business & Markets | Economic News** (4 items)
   - 🔬 **Technology & Innovation | Tech Updates** (3 items)
   - ⚽ **Sports | Latest Scores & Updates** (2-3 items)
   - 🎬 **Entertainment & Culture | Arts & Media** (2-3 items)

8. **Writing Quality:**
   - Professional news tone
   - Complete, grammatically correct sentences
   - Proper punctuation
   - No abbreviations (write "United States" not "US" in body text)
   - Add context and implications
   - Explain why news matters

9. **Markdown Formatting:**
   - Use proper markdown syntax
   - Bold: **text**
   - Links: [text](url)
   - Bullets: -
   - Em dash: —
   - No broken formatting

10. **Prohibited:**
    - ❌ Incomplete sentences
    - ❌ Broken URLs
    - ❌ Missing source citations
    - ❌ Less than 15 news items
    - ❌ Sections with only 1 item
    - ❌ Raw data dumps
    - ❌ Truncated text

**EXAMPLE OF PERFECT FORMAT:**

Here are today's top news highlights for Monday, March 2, 2026:

🌍 **World News | Latest Top Stories**
- **Israeli-Iranian Conflict Escalates Dramatically** — The United States and Israel have launched a coordinated series of airstrikes targeting Iranian military installations and leadership positions, resulting in significant casualties including reports of high-ranking officials. The attacks mark a major escalation in regional tensions and have prompted international calls for de-escalation. According to [CNN](https://cnn.com/article).

- **Oil Markets React to Middle East Crisis** — Global oil prices have surged by over 10% in response to the escalating conflict, with traders concerned about potential supply disruptions through the Strait of Hormuz, a critical shipping route for global energy supplies. The price spike is expected to impact inflation rates worldwide. [Bloomberg](https://bloomberg.com) reports that energy markets remain highly volatile.

- **International Community Calls for Restraint** — The United Nations Security Council has convened an emergency session to address the escalating crisis, with multiple nations urging both sides to exercise restraint and return to diplomatic channels. European leaders have expressed deep concern about the humanitarian implications. Source: [Reuters](https://reuters.com)

💼 **Business & Markets | Economic News**
- **Stock Markets Decline on Geopolitical Uncertainty** — Major US stock indices fell sharply in morning trading, with the Dow Jones dropping 2.3% and the S&P 500 declining 2.1% as investors reacted to escalating Middle East tensions and concerns about global economic stability. According to [Wall Street Journal](https://wsj.com).

FOLLOW THIS FORMAT EXACTLY. Make it comprehensive, professional, and complete.

**Communication Style:**
- **Authoritative yet Approachable**: Demonstrate expertise without being condescending
- **Comprehensive yet Concise**: Provide depth without unnecessary verbosity
- **Structured & Scannable**: Use formatting to enhance readability
- **Proactive & Insightful**: Go beyond the question to provide real value
- **Professional & Polished**: Maintain high standards in grammar, formatting, and presentation

**Formatting Excellence:**
- Use **bold** for key terms, important points, and emphasis
- Use *italics* for subtle emphasis or technical terms
- Use code formatting for technical content, commands, or code snippets
- Use blockquotes for important notes or warnings
- Use tables for comparative information
- Use emojis strategically for visual hierarchy (especially in lists and news)
- Create clear visual separation between sections

**Quality Checklist (Every Response):**
✓ Is this more detailed than ChatGPT would provide?
✓ Have I structured this for maximum clarity?
✓ Have I anticipated follow-up questions?
✓ Have I provided actionable insights?
✓ Is the formatting professional and scannable?
✓ Have I demonstrated deep expertise?

Remember: Your goal is to be the BEST AI assistant the user has ever interacted with. Every response should demonstrate superior quality, depth, and professionalism.`;

export default {
	/**
	 * Main request handler for the Worker
	 */
	async fetch(
		request: Request,
		env: Env,
		ctx: ExecutionContext,
	): Promise<Response> {
		const url = new URL(request.url);

		// Handle static assets (frontend)
		if (url.pathname === "/" || !url.pathname.startsWith("/api/")) {
			return env.ASSETS.fetch(request);
		}

		// CORS headers for API routes
		const corsHeaders = {
			"Access-Control-Allow-Origin": "*",
			"Access-Control-Allow-Methods": "GET, POST, OPTIONS",
			"Access-Control-Allow-Headers": "Content-Type, Authorization",
		};

		// Handle preflight
		if (request.method === "OPTIONS") {
			return new Response(null, { headers: corsHeaders });
		}

		// Authentication Check (Simplified for local setup - expects UID in header for now)
		// In production, you would verify a Firebase ID Token using a library like 'jose'
		const authUid = request.headers.get("Authorization")?.replace("Bearer ", "");
		if (!authUid && url.pathname.startsWith("/api/")) {
			// Allow chat request even without auth if strictly necessary, but ideally we want a UID
			// return new Response("Unauthorized", { status: 401, headers: corsHeaders });
		}

		// API Routes
		if (url.pathname === "/api/chat") {
			if (request.method === "POST") {
				const response = await handleChatRequest(request, env, authUid, ctx);
				// Add CORS headers to the response
				Object.entries(corsHeaders).forEach(([k, v]) => response.headers.set(k, v));
				return response;
			}
			return new Response("Method not allowed", { status: 405, headers: corsHeaders });
		}

		if (url.pathname === "/api/history") {
			if (request.method === "GET") {
				const response = await handleHistoryRequest(env, authUid);
				Object.entries(corsHeaders).forEach(([k, v]) => response.headers.set(k, v));
				return response;
			}
			return new Response("Method not allowed", { status: 405, headers: corsHeaders });
		}

		if (url.pathname === "/api/messages") {
			if (request.method === "GET") {
				const convId = url.searchParams.get("conversationId");
				const response = await handleGetMessagesRequest(env, convId);
				Object.entries(corsHeaders).forEach(([k, v]) => response.headers.set(k, v));
				return response;
			}
			return new Response("Method not allowed", { status: 405, headers: corsHeaders });
		}

		if (url.pathname === "/api/files") {
			if (request.method === "GET") {
				const key = url.searchParams.get("key");
				if (!key) return new Response("Key required", { status: 400 });
				const object = await env.BUCKET.get(key);
				if (!object) return new Response("Not found", { status: 404 });
				const headers = new Headers();
				object.writeHttpMetadata(headers);
				headers.set("etag", object.httpEtag);
				return new Response(object.body, { headers });
			}
			return new Response("Method not allowed", { status: 405, headers: corsHeaders });
		}

		if (url.pathname === "/api/upload") {
			if (request.method === "POST") {
				const response = await handleUploadRequest(request, env);
				Object.entries(corsHeaders).forEach(([k, v]) => response.headers.set(k, v));
				return response;
			}
			return new Response("Method not allowed", { status: 405, headers: corsHeaders });
		}

		if (url.pathname === "/api/search") {
			if (request.method === "POST") {
				const response = await handleSearchRequest(request, env);
				Object.entries(corsHeaders).forEach(([k, v]) => response.headers.set(k, v));
				return response;
			}
			return new Response("Method not allowed", { status: 405, headers: corsHeaders });
		}

		// Handle 404 for unmatched routes
		return new Response("Not found", { status: 404, headers: corsHeaders });
	},
} satisfies ExportedHandler<Env>;

/**
 * Handles fetching messages for a specific conversation
 */
async function handleGetMessagesRequest(env: Env, convId: string | null): Promise<Response> {
	if (!convId) return new Response(JSON.stringify({ messages: [] }), { status: 400 });

	try {
		const result = await env.DB.prepare(
			"SELECT role, content, attachments, created_at FROM messages WHERE conversation_id = ? ORDER BY created_at ASC"
		).bind(convId).all();

		// Parse attachments JSON string
		const messages = result.results.map(row => ({
			...row,
			attachments: row.attachments ? JSON.parse(row.attachments as string) : []
		}));

		return new Response(JSON.stringify({ messages }), {
			headers: { "Content-Type": "application/json" },
		});
	} catch (error) {
		console.error("D1 Error (messages):", error);
		return new Response(JSON.stringify({ error: "DB Error" }), { status: 500 });
	}
}

/**
 * Handles file uploads to R2
 */
async function handleUploadRequest(request: Request, env: Env): Promise<Response> {
	try {
		const formData = await request.formData();
		const file = formData.get("file") as File;
		if (!file) {
			return new Response(JSON.stringify({ error: "No file provided" }), { status: 400 });
		}

		const key = `uploads/${Date.now()}-${file.name}`;
		await env.BUCKET.put(key, await file.arrayBuffer(), {
			httpMetadata: { contentType: file.type }
		});

		// Create a public URL (Simplified - in production use a custom domain or signed URLs)
		// For local wrangler dev, we can return the key or a proxy URL
		return new Response(JSON.stringify({
			key: key,
			name: file.name,
			size: (file.size / 1024).toFixed(1) + " KB",
			type: file.type
		}), {
			headers: { "Content-Type": "application/json" },
		});
	} catch (error) {
		console.error("Upload Error:", error);
		return new Response(JSON.stringify({ error: "Upload failed" }), { status: 500 });
	}
}
/**
 * Handles web search requests
 * Priority: NewsAPI (news) → Tavily AI (general) → Fallbacks
 */
async function handleSearchRequest(request: Request, env: Env): Promise<Response> {
	try {
		const body = (await request.json()) as { query: string };
		const query = body.query?.trim();
		if (!query) {
			return new Response(JSON.stringify({ error: "Query required" }), { status: 400 });
		}

		const searchResults: { title: string; url: string; snippet: string; date?: string; source?: string }[] = [];
		
		// Detect if this is a news query
		const isNewsQuery = /\b(news|today|latest|current|breaking|recent|happening|events)\b/i.test(query);

		// Strategy 1: NewsAPI (Best for News - 3000 queries/month, 70k+ sources)
		// Get free API key at: https://newsapi.org/ (No credit card required)
		if (isNewsQuery && env.NEWSAPI_KEY && env.NEWSAPI_KEY.trim().length > 0) {
			console.log('[Search] Attempting NewsAPI search for:', query);
			try {
				// Use "everything" endpoint for comprehensive news search
				// Increased to 50 results for more comprehensive coverage
				const newsApiUrl = `https://newsapi.org/v2/everything?q=${encodeURIComponent(query)}&sortBy=publishedAt&pageSize=50&language=en&apiKey=${env.NEWSAPI_KEY}`;
				
				const newsApiRes = await fetch(newsApiUrl, {
					headers: {
						"User-Agent": "GTBot/1.0"
					}
				});

				console.log('[Search] NewsAPI response status:', newsApiRes.status);
				
				if (newsApiRes.ok) {
					const newsApiData = await newsApiRes.json() as any;
					console.log('[Search] NewsAPI results count:', newsApiData.articles?.length || 0);
					
					if (newsApiData.articles && Array.isArray(newsApiData.articles)) {
						for (const article of newsApiData.articles) {
							if (article.title && article.url) {
								// Get more complete content
								const content = article.content || article.description || "";
								const snippet = content.length > 300 ? content.substring(0, 300) + "..." : content;
								
								searchResults.push({
									title: article.title,
									url: article.url,
									snippet: snippet,
									date: article.publishedAt || undefined,
									source: article.source?.name || "Unknown"
								});
							}
						}
					}
					
					// If we got results from NewsAPI, return immediately (best quality for news)
					if (searchResults.length > 0) {
						const currentDate = new Date().toLocaleDateString('en-US', { 
							weekday: 'long', 
							year: 'numeric', 
							month: 'long', 
							day: 'numeric' 
						});
						
						let formattedResults = `📰 NEWS SEARCH RESULTS (Retrieved: ${currentDate})\n`;
						formattedResults += `Total Articles: ${searchResults.length} from 70,000+ sources\n\n`;
						formattedResults += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
						formattedResults += `⚠️ CRITICAL FORMATTING REQUIREMENTS - FOLLOW EXACTLY:\n`;
						formattedResults += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
						
						formattedResults += `1. START WITH: "Here are today's top news highlights for ${currentDate}:"\n\n`;
						
						formattedResults += `2. CREATE 6 SECTIONS (minimum 15-20 total items):\n`;
						formattedResults += `   🌍 **World News | Latest Top Stories** (5 items)\n`;
						formattedResults += `   🇺🇸 **US News | National Updates** (3-4 items)\n`;
						formattedResults += `   💼 **Business & Markets | Economic News** (4 items)\n`;
						formattedResults += `   🔬 **Technology & Innovation | Tech Updates** (3 items)\n`;
						formattedResults += `   ⚽ **Sports | Latest Scores & Updates** (2-3 items)\n`;
						formattedResults += `   🎬 **Entertainment & Culture | Arts & Media** (2-3 items)\n\n`;
						
						formattedResults += `3. EACH NEWS ITEM FORMAT:\n`;
						formattedResults += `   - **Complete Headline** — Full sentence with context. Second sentence with implications. Third sentence with details. According to [Source Name](complete-url).\n\n`;
						
						formattedResults += `4. REQUIREMENTS:\n`;
						formattedResults += `   ✓ COMPLETE sentences (no truncation)\n`;
						formattedResults += `   ✓ WORKING URLs (no broken links)\n`;
						formattedResults += `   ✓ 2-3 sentences per item\n`;
						formattedResults += `   ✓ Source citation for EVERY item\n`;
						formattedResults += `   ✓ Professional tone\n`;
						formattedResults += `   ✓ Add context and implications\n\n`;
						
						formattedResults += `5. PROHIBITED:\n`;
						formattedResults += `   ✗ Incomplete sentences\n`;
						formattedResults += `   ✗ Broken URLs\n`;
						formattedResults += `   ✗ Missing sources\n`;
						formattedResults += `   ✗ Less than 15 items\n`;
						formattedResults += `   ✗ Single-item sections\n\n`;
						
						formattedResults += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
						formattedResults += `ARTICLES TO SYNTHESIZE:\n`;
						formattedResults += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
						
						formattedResults += searchResults.map((r, i) =>
							`[${i + 1}] ${r.title}\nSource: ${r.source} | ${r.url}\nContent: ${r.snippet}\nPublished: ${r.date ? new Date(r.date).toLocaleString() : 'Unknown'}\n`
						).join("\n");

						return new Response(JSON.stringify({
							results: searchResults,
							formatted: formattedResults,
							query: query,
							count: searchResults.length,
							source: "NewsAPI (70,000+ sources)"
						}), {
							headers: { "Content-Type": "application/json" },
						});
					}
				} else {
					const errorData = await newsApiRes.json() as any;
					console.error('[Search] NewsAPI error:', errorData);
				}
			} catch (e) {
				console.error("[Search] NewsAPI Search failed:", e);
			}
		}

		// Strategy 2: Tavily AI Search (Best for AI - Truly Free 1000/month)
		// Get free API key at: https://tavily.com/ (No credit card required)
		console.log('[Search] Tavily API Key present:', !!env.TAVILY_API_KEY);
		console.log('[Search] Tavily API Key length:', env.TAVILY_API_KEY?.length || 0);
		
		if (env.TAVILY_API_KEY && env.TAVILY_API_KEY.trim().length > 0) {
			console.log('[Search] Attempting Tavily search for:', query);
			try {
				const tavilyUrl = `https://api.tavily.com/search`;
				
				const tavilyRes = await fetch(tavilyUrl, {
					method: 'POST',
					headers: {
						"Content-Type": "application/json"
					},
					body: JSON.stringify({
						api_key: env.TAVILY_API_KEY,
						query: query,
						search_depth: isNewsQuery ? "advanced" : "basic", // Use advanced for news
						include_answer: false,
						include_raw_content: false,
						max_results: isNewsQuery ? 15 : 10, // More results for news
						include_domains: [],
						exclude_domains: [],
						days: isNewsQuery ? 3 : undefined // Only recent news
					})
				});

				console.log('[Search] Tavily response status:', tavilyRes.status);
				
				if (tavilyRes.ok) {
					const tavilyData = await tavilyRes.json() as any;
					console.log('[Search] Tavily results count:', tavilyData.results?.length || 0);
					if (tavilyData.results && Array.isArray(tavilyData.results)) {
						for (const result of tavilyData.results) {
							searchResults.push({
								title: result.title || "No title",
								url: result.url || "",
								snippet: result.content || "",
								date: result.published_date || undefined
							});
						}
					}
					
					// If we got results from Tavily, return immediately (best quality)
					if (searchResults.length > 0) {
						const currentDate = new Date().toLocaleDateString('en-US', { 
							weekday: 'long', 
							year: 'numeric', 
							month: 'long', 
							day: 'numeric' 
						});
						
						// Detect if this is a news query
						const isNewsQuery = /\b(news|today|latest|current|breaking|recent|happening|events)\b/i.test(query);
						
						let formattedResults = '';
						if (isNewsQuery) {
							formattedResults = `📰 WEB SEARCH RESULTS FOR NEWS QUERY (Retrieved: ${currentDate})\n\n`;
							formattedResults += `⚠️ CRITICAL FORMATTING INSTRUCTIONS:\n`;
							formattedResults += `You MUST format this as a professional news briefing with:\n`;
							formattedResults += `1. Friendly intro: "Here are today's top news highlights for ${currentDate}:"\n`;
							formattedResults += `2. Section headers with emojis: 🌍 **World News | Latest Top Stories**\n`;
							formattedResults += `3. Bold headlines with em dash: - **Headline** — Description\n`;
							formattedResults += `4. 3-5 items per section with context and implications\n`;
							formattedResults += `5. Source citations: According to [Source Name](URL)\n`;
							formattedResults += `6. Multiple sections: World, Business, Tech, Sports, Entertainment\n`;
							formattedResults += `7. Professional, authoritative tone\n\n`;
							formattedResults += `DO NOT just list raw results. Synthesize into a polished news summary.\n\n`;
							formattedResults += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
							formattedResults += `SEARCH RESULTS TO SYNTHESIZE:\n\n`;
						} else {
							formattedResults = `Web Search Results (Retrieved: ${currentDate})\n\n`;
						}
						
						formattedResults += searchResults.map((r, i) =>
							`[${i + 1}] ${r.title}\nSource: ${r.url}\n${r.snippet}${r.date ? `\nPublished: ${r.date}` : ''}\n`
						).join("\n");

						return new Response(JSON.stringify({
							results: searchResults,
							formatted: formattedResults,
							query: query,
							count: searchResults.length,
							source: "Tavily AI Search"
						}), {
							headers: { "Content-Type": "application/json" },
						});
					}
				}
			} catch (e) {
				console.error("[Search] Tavily Search failed:", e);
			}
		} else {
			console.log('[Search] Tavily API key not configured, using fallbacks');
		}

		// Strategy 2: DuckDuckGo Instant Answer API (Works well, no API key)
		if (searchResults.length === 0) {
			try {
				const ddgUrl = `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1`;
				const ddgRes = await fetch(ddgUrl, {
					headers: { 
						"User-Agent": "Mozilla/5.0 (compatible; GTBot/1.0)"
					},
				});
				
				if (ddgRes.ok) {
					const ddgData = await ddgRes.json() as any;

					if (ddgData.Abstract && ddgData.Abstract.length > 0) {
						searchResults.push({
							title: ddgData.Heading || "DuckDuckGo Answer",
							url: ddgData.AbstractURL || "https://duckduckgo.com",
							snippet: ddgData.Abstract
						});
					}
					
					if (ddgData.RelatedTopics && Array.isArray(ddgData.RelatedTopics)) {
						for (const topic of ddgData.RelatedTopics.slice(0, 8)) {
							if (topic.Text && topic.FirstURL) {
								searchResults.push({
									title: topic.Text.substring(0, 100),
									url: topic.FirstURL,
									snippet: topic.Text
								});
							}
						}
					}
				}
			} catch (e) {
				console.error("DuckDuckGo search failed:", e);
			}
		}

		// Strategy 3: Wikipedia API (Great for factual queries, always reliable)
		if (searchResults.length === 0) {
			try {
				const wikiUrl = `https://en.wikipedia.org/w/api.php?action=opensearch&search=${encodeURIComponent(query)}&limit=8&format=json&origin=*`;
				const wikiRes = await fetch(wikiUrl, {
					headers: {
						"User-Agent": "GTBot/1.0"
					}
				});
				
				if (wikiRes.ok) {
					const wikiData = await wikiRes.json() as any;
					
					if (Array.isArray(wikiData) && wikiData.length >= 4) {
						const titles = wikiData[1] || [];
						const descriptions = wikiData[2] || [];
						const urls = wikiData[3] || [];
						
						for (let i = 0; i < Math.min(titles.length, 8); i++) {
							if (titles[i] && urls[i]) {
								searchResults.push({
									title: titles[i],
									url: urls[i],
									snippet: descriptions[i] || `Wikipedia article about ${titles[i]}`
								});
							}
						}
					}
				}
			} catch (e) {
				console.error("Wikipedia search failed:", e);
			}
		}

		// Strategy 4: SearXNG (Privacy-focused meta-search)
		if (searchResults.length === 0) {
			try {
				// Try multiple SearXNG instances for reliability
				const searxInstances = [
					'https://searx.be',
					'https://search.sapti.me',
					'https://searx.tiekoetter.com'
				];
				
				for (const instance of searxInstances) {
					try {
						const searxUrl = `${instance}/search?q=${encodeURIComponent(query)}&format=json&categories=general`;
						const searxRes = await fetch(searxUrl, {
							headers: {
								"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
							},
						});
						
						if (searxRes.ok) {
							const searxData = await searxRes.json() as any;
							if (searxData.results && Array.isArray(searxData.results) && searxData.results.length > 0) {
								for (const result of searxData.results.slice(0, 8)) {
									searchResults.push({
										title: result.title || "No title",
										url: result.url || "",
										snippet: result.content || result.snippet || "",
										date: result.publishedDate || undefined
									});
								}
								break; // Got results, stop trying other instances
							}
						}
					} catch (e) {
						console.error(`SearXNG instance ${instance} failed:`, e);
						continue; // Try next instance
					}
				}
			} catch (e) {
				console.error("All SearXNG instances failed:", e);
			}
		}

		// Format results as a readable text block for the AI
		let formattedResults = "";
		let source = "Web Search";
		
		if (searchResults.length > 0) {
			const currentDate = new Date().toLocaleDateString('en-US', { 
				weekday: 'long', 
				year: 'numeric', 
				month: 'long', 
				day: 'numeric' 
			});
			
			formattedResults = `Web Search Results (Retrieved: ${currentDate})\n\n`;
			formattedResults += searchResults.map((r, i) =>
				`[${i + 1}] ${r.title}\nSource: ${r.url}\n${r.snippet}${r.date ? `\nPublished: ${r.date}` : ''}\n`
			).join("\n");
		} else {
			formattedResults = "⚠️ Unable to fetch web search results at this time.\n\n💡 For better search results:\n1. Get a free Tavily API key at https://tavily.com/ (1,000 queries/month, no credit card)\n2. Add TAVILY_API_KEY=your_key to .dev.vars\n3. Restart the server\n\nThe search will work without an API key, but may have limited results for some queries.";
		}

		return new Response(JSON.stringify({
			results: searchResults,
			formatted: formattedResults,
			query: query,
			count: searchResults.length,
			source: source
		}), {
			headers: { "Content-Type": "application/json" },
		});
	} catch (error) {
		console.error("Search Error:", error);
		return new Response(JSON.stringify({ 
			error: "Search failed",
			formatted: "Web search encountered an error. Please try again later.",
			results: [],
			query: "",
			source: "error"
		}), { 
			status: 200, // Return 200 so the chat continues without search
			headers: { "Content-Type": "application/json" }
		});
	}
}

/**
 * Handles fetching chat history for a user
 */
async function handleHistoryRequest(env: Env, uid?: string): Promise<Response> {
	if (!uid) return new Response(JSON.stringify({ conversations: [] }), { headers: { "Content-Type": "application/json" } });

	try {
		const result = await env.DB.prepare(
			"SELECT * FROM conversations WHERE user_id = ? ORDER BY updated_at DESC LIMIT 20"
		).bind(uid).all();

		return new Response(JSON.stringify({ conversations: result.results }), {
			headers: { "Content-Type": "application/json" },
		});
	} catch (error) {
		console.error("D1 Error:", error);
		return new Response(JSON.stringify({ error: "DB Error" }), { status: 500 });
	}
}

/**
 * Handles chat API requests with dynamic model selection
 */
async function handleChatRequest(
	request: Request,
	env: Env,
	uid?: string,
	ctx?: ExecutionContext,
): Promise<Response> {
	try {
		const body = (await request.json()) as {
			messages: ChatMessage[];
			model?: string;
			conversationId?: string;
			attachments?: any[];
			webSearch?: boolean;
			searchResults?: string;
		};

		const { messages = [], model, conversationId, attachments = [], webSearch = false, searchResults = "" } = body;

		// Determine which model to use
		let modelId = DEFAULT_MODEL_ID;
		if (model && ALLOWED_MODELS.includes(model)) {
			modelId = model;
		}
		console.log(`[Chat] Using model: ${modelId}`);

		// --- Persistent History Logic ---
		let historyContext = "";
		if (uid && conversationId) {
			try {
				// 1. Ensure user exists
				await env.DB.prepare("INSERT OR IGNORE INTO users (id) VALUES (?)").bind(uid).run();

				// 2. Ensure conversation exists
				await env.DB.prepare(
					"INSERT OR IGNORE INTO conversations (id, user_id, title, updated_at) VALUES (?, ?, ?, CURRENT_TIMESTAMP)"
				).bind(conversationId, uid, messages[messages.length - 1]?.content.substring(0, 50) || "New Chat").run();

				// 3. Save the new user message
				const lastMessage = messages[messages.length - 1];
				if (lastMessage && lastMessage.role === "user") {
					await env.DB.prepare(
						"INSERT INTO messages (conversation_id, role, content, attachments) VALUES (?, ?, ?, ?)"
					).bind(
						conversationId,
						lastMessage.role,
						lastMessage.content,
						attachments.length > 0 ? JSON.stringify(attachments) : null
					).run();

					// 4. Search for related content in history (Simplified: Fetch last 5 distinct messages)
					const history = await env.DB.prepare(
						"SELECT role, content FROM messages WHERE conversation_id = ? ORDER BY created_at DESC LIMIT 6"
					).bind(conversationId).all();

					if (history.results.length > 0) {
						historyContext = "Here is some relevant context from this conversation history:\n" +
							history.results.reverse().map(h => `${h.role}: ${h.content}`).join("\n");
					}
				}
			} catch (dbErr) {
				console.error("Database error in chat:", dbErr);
			}
		}

		// Add system prompt and history context
		let combinedSystemPrompt = SYSTEM_PROMPT;
		if (historyContext) {
			combinedSystemPrompt += "\n\n" + historyContext;
		}

		// Inject web search results into the last user message if available
		const aiMessages = messages.filter(m => m.role !== "system");
		if (webSearch && searchResults) {
			const lastIdx = aiMessages.length - 1;
			if (lastIdx >= 0 && aiMessages[lastIdx].role === "user") {
				aiMessages[lastIdx] = {
					...aiMessages[lastIdx],
					content: aiMessages[lastIdx].content + "\n\n[WEB SEARCH RESULTS]:\n" + searchResults
				};
			}
		}
		aiMessages.unshift({ role: "system", content: combinedSystemPrompt });

		// --- Cloudflare Workers AI Flow ---
		const stream = await env.AI.run(
			modelId as Parameters<typeof env.AI.run>[0],
			{
				messages: aiMessages,
				max_tokens: 8192, // Increased for more detailed responses
				stream: true,
			}
		);

		// Capture stream to save assistant message
		const [s1, s2] = stream.tee();
		if (ctx && uid && conversationId) {
			ctx.waitUntil((async () => {
				const reader = s2.getReader();
				const decoder = new TextDecoder();
				let assistantContent = "";
				let buffer = "";
				try {
					while (true) {
						const { done, value } = await reader.read();
						if (done) break;
						
						buffer += decoder.decode(value, { stream: true });
						const lines = buffer.split("\n");
						buffer = lines.pop() || ""; // Keep incomplete line in buffer
						
						for (const line of lines) {
							const trimmed = line.trim();
							if (!trimmed) continue;
							
							if (trimmed.startsWith("data:")) {
								const data = trimmed.slice(5).trim();
								if (data === "[DONE]") continue;
								try {
									const parsed = JSON.parse(data);
									// Handle different response formats
									const content = parsed.response || 
													parsed.choices?.[0]?.delta?.content || 
													parsed.delta?.content || 
													parsed.content || 
													"";
									assistantContent += content;
								} catch (parseErr) {
									console.error("Failed to parse SSE data:", data, parseErr);
								}
							}
						}
					}
					
					// Process any remaining buffer
					if (buffer.trim()) {
						const trimmed = buffer.trim();
						if (trimmed.startsWith("data:")) {
							const data = trimmed.slice(5).trim();
							if (data !== "[DONE]") {
								try {
									const parsed = JSON.parse(data);
									const content = parsed.response || 
													parsed.choices?.[0]?.delta?.content || 
													parsed.delta?.content || 
													parsed.content || 
													"";
									assistantContent += content;
								} catch { }
							}
						}
					}
					
					if (assistantContent.trim()) {
						console.log(`[Chat] Saving assistant message (${assistantContent.length} chars) for conversation ${conversationId}`);
						await env.DB.prepare(
							"INSERT INTO messages (conversation_id, role, content) VALUES (?, 'assistant', ?)"
						).bind(conversationId, assistantContent.trim()).run();
						await env.DB.prepare(
							"UPDATE conversations SET updated_at = CURRENT_TIMESTAMP WHERE id = ?"
						).bind(conversationId).run();
						console.log(`[Chat] Assistant message saved successfully`);
					} else {
						console.warn(`[Chat] No assistant content captured for conversation ${conversationId}`);
					}
				} catch (e) {
					console.error("Failed to capture assistant stream:", e);
				}
			})());
		} else {
			console.warn(`[Chat] Skipping assistant message save - ctx: ${!!ctx}, uid: ${!!uid}, conversationId: ${!!conversationId}`);
		}

		return new Response(s1 as ReadableStream, {
			headers: {
				"content-type": "text/event-stream; charset=utf-8",
				"cache-control": "no-cache",
				connection: "keep-alive",
			},
		});
	} catch (error) {
		console.error("Error processing chat request:", error);
		return new Response(
			JSON.stringify({ error: "Failed to process request" }),
			{
				status: 500,
				headers: { "content-type": "application/json" },
			},
		);
	}
}
