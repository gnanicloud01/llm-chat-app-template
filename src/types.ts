/**
 * Type definitions for the LLM chat application.
 */

export interface Env {
	/**
	 * Binding for the Workers AI API.
	 */
	AI: Ai;

	/**
	 * Binding for static assets.
	 * 
	 */
	ASSETS: { fetch: (request: Request) => Promise<Response> };

	/**
	 * Binding for D1 Database
	 */
	DB: D1Database;

	/**
	 * Binding for R2 Storage
	 */
	BUCKET: R2Bucket;

	/**
	 * API Key for Tavily AI Search (https://tavily.com/)
	 * Truly free tier: 1,000 queries/month, no credit card required
	 * Best for AI applications - designed for LLMs
	 */
	TAVILY_API_KEY?: string;

	/**
	 * API Key for NewsAPI (https://newsapi.org/)
	 * Free tier: 100 requests/day (3,000/month), no credit card required
	 * 70,000+ news sources worldwide
	 * Best for news headlines and articles
	 */
	NEWSAPI_KEY?: string;
}

/**
 * Represents a chat message.
 */
export interface ChatMessage {
	role: "system" | "user" | "assistant";
	content: string;
}
