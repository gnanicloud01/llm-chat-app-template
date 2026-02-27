/**
 * GT — AI Chat Application
 *
 * A professional AI chat application using Cloudflare Workers AI.
 * Supports multiple models, streaming responses via SSE, and dynamic model switching.
 *
 * @license MIT
 */
import { Env, ChatMessage } from "./types";

// Default Model ID
const DEFAULT_MODEL_ID = "@cf/meta/llama-3.1-8b-instruct-fp8";

// Allowed models (must match frontend select options)
const ALLOWED_MODELS: string[] = [
	"@cf/meta/llama-3.1-8b-instruct-fp8",
	"@cf/meta/llama-3.3-70b-instruct-fp8-fast",
	"@cf/deepseek-ai/deepseek-r1-distill-qwen-32b",
	"@cf/qwen/qwen2.5-coder-32b-instruct",
	"@cf/google/gemma-7b-it-lora",
];

// Default system prompt
const SYSTEM_PROMPT =
	"You are GT, a helpful and knowledgeable AI assistant. Provide clear, accurate, and well-structured responses. When writing code, always include comments and use proper formatting.";

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
			"Access-Control-Allow-Methods": "POST, OPTIONS",
			"Access-Control-Allow-Headers": "Content-Type",
		};

		// Handle preflight
		if (request.method === "OPTIONS") {
			return new Response(null, { headers: corsHeaders });
		}

		// API Routes
		if (url.pathname === "/api/chat") {
			if (request.method === "POST") {
				return handleChatRequest(request, env);
			}
			return new Response("Method not allowed", { status: 405 });
		}

		// Handle 404 for unmatched routes
		return new Response("Not found", { status: 404 });
	},
} satisfies ExportedHandler<Env>;

/**
 * Handles chat API requests with dynamic model selection
 */
async function handleChatRequest(
	request: Request,
	env: Env,
): Promise<Response> {
	try {
		const body = (await request.json()) as {
			messages: ChatMessage[];
			model?: string;
		};

		const { messages = [], model } = body;

		// Determine which model to use
		let modelId = DEFAULT_MODEL_ID;
		if (model && ALLOWED_MODELS.includes(model)) {
			modelId = model;
		}

		// Add system prompt if not present
		if (!messages.some((msg) => msg.role === "system")) {
			messages.unshift({ role: "system", content: SYSTEM_PROMPT });
		}

		const stream = await env.AI.run(
			modelId as Parameters<typeof env.AI.run>[0],
			{
				messages,
				max_tokens: 2048,
				stream: true,
			},
			{
				// Uncomment to use AI Gateway
				// gateway: {
				//   id: "YOUR_GATEWAY_ID",
				//   skipCache: false,
				//   cacheTtl: 3600,
				// },
			},
		);

		return new Response(stream as ReadableStream, {
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
