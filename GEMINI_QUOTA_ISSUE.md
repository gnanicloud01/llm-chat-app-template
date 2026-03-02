# ⚠️ Gemini API Quota Exceeded

## Issue

Your Gemini API key has exceeded its free tier quota:
```
Quota exceeded for metric: generativelanguage.googleapis.com/generate_content_free_tier_requests
limit: 0, model: gemini-2.0-flash
```

## Solution: Use Cloudflare Workers AI (Unlimited & Free!)

### Option 1: Switch to Llama 3.3 70B (Recommended)

This model is:
- ✅ **Unlimited** - No quota limits
- ✅ **Free** - Included with Cloudflare Workers
- ✅ **Excellent quality** - Comparable to Gemini
- ✅ **Fast** - Optimized for Workers

**How to switch:**
1. Open your GT app at http://localhost:3000
2. Click the model dropdown (currently shows "google/gemini-2.0-flash")
3. Select: **"Llama 3.3 70B Instruct"** (`@cf/meta/llama-3.3-70b-instruct-fp8-fast`)
4. Start chatting!

### Option 2: Try Other Free Models

All these models are unlimited and free:

**Flagship Models (Best Quality):**
- Llama 3.3 70B Instruct (Recommended)
- Qwen 2.5 72B Instruct
- DeepSeek R1 Distill Qwen 32B

**Power Models (Great Balance):**
- Qwen 2.5 Coder 32B
- Gemma 3 12B
- Mistral Small 3.1 24B

**Speed Models (Fast Responses):**
- Llama 3.1 8B Instruct
- Llama 4 Scout 17B
- Gemma 3 4B

### Option 3: Get New Gemini API Key

If you want to continue using Gemini:

1. Visit: https://aistudio.google.com/apikey
2. Create a new API key
3. Update `.dev.vars`:
   ```bash
   GEMINI_API_KEY=your_new_key_here
   ```
4. Restart server: `npm run dev`

**Note:** Free tier limits:
- 15 requests per minute
- 1,500 requests per day
- 1 million tokens per day

## Why This Happened

Gemini's free tier has strict limits:
- You've used all your daily/monthly quota
- The API key might be shared across multiple projects
- High usage in a short time period

## Recommended Action

**Use Llama 3.3 70B** - It's unlimited, free, and excellent quality!

1. Open http://localhost:3000
2. Change model to "Llama 3.3 70B Instruct"
3. Continue chatting without limits

## Comparison

| Feature | Gemini 2.0 Flash | Llama 3.3 70B |
|---------|------------------|---------------|
| Quality | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| Speed | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| Free Quota | 1,500/day | ♾️ Unlimited |
| Rate Limit | 15/min | ♾️ None |
| Cost | Free tier | Free forever |

## Testing News Search

The news search improvements work with ANY model! Try:

1. Switch to Llama 3.3 70B
2. Enable web search (🌐 button)
3. Ask: "today news"
4. Get professional news summaries!

---

**Switch to Llama 3.3 70B now and enjoy unlimited, free AI!** 🚀
