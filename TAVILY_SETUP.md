# 🚀 Tavily AI Search Setup (Truly Free!)

## Why Tavily?

✅ **Truly free** - 1,000 queries/month, no credit card required  
✅ **Built for AI** - Specifically designed for LLM applications  
✅ **High quality** - Returns clean, relevant results  
✅ **Real-time** - Current news and information  
✅ **Easy setup** - 3 minutes to get started  

## Quick Setup (3 minutes)

### 1. Get Your Free API Key

1. Visit: **https://tavily.com/**
2. Click **"Get API Key"** or **"Sign Up"**
3. Sign up with email (no credit card needed!)
4. Verify your email
5. Copy your API key from the dashboard

### 2. Add to Your Project

Open `llm-chat-app-template/.dev.vars` and add:

```bash
TAVILY_API_KEY=tvly-xxxxxxxxxxxxxxxxxxxxx
```

### 3. Restart Server

```bash
# Stop current server (Ctrl+C)
npm run dev
```

### 4. Test It!

1. Open http://localhost:3000
2. Click the 🌐 globe icon (enable web search)
3. Ask: **"today news"** or **"latest technology news"**
4. You should see real results via Tavily AI!

## What You Get

### With Tavily API (Recommended)
- ✅ 10 high-quality results per query
- ✅ Real-time news and current events
- ✅ Clean, LLM-optimized content
- ✅ Publication dates included
- ✅ 1,000 queries/month FREE
- ✅ No credit card required
- ✅ Designed for AI applications

### Without API (Free Fallbacks)
- ⚠️ Uses SearXNG, Jina Reader, DuckDuckGo, Wikipedia
- ⚠️ Less reliable for news
- ⚠️ May return fewer results
- ✅ Still works, just not as good

## Example Queries

```
"today news"
"latest AI developments"
"current events in technology"
"what happened today"
"breaking news March 2026"
"latest sports scores"
"recent scientific discoveries"
```

## Comparison

| Feature | Tavily | ChatGPT | Brave | DDG |
|---------|--------|---------|-------|-----|
| Truly Free | ✅ Yes | ❌ No | ⚠️ Limited | ✅ Yes |
| Credit Card | ❌ Not needed | ✅ Required | ⚠️ Required | ❌ Not needed |
| AI-Optimized | ✅ Yes | ✅ Yes | ❌ No | ❌ No |
| News Quality | ✅ Excellent | ✅ Excellent | ✅ Good | ⚠️ Poor |
| Setup Time | ⏱️ 3 min | ⏱️ Complex | ⏱️ 5 min | ⏱️ None |
| Free Queries | 1,000/mo | 0 | 0* | Unlimited |

*Brave requires signup and has strict limits

## Rate Limits

**Free Plan:**
- 1,000 queries/month
- ~33 queries/day
- Perfect for personal projects and testing

**Need More?**
- Paid plans available for production apps
- See: https://tavily.com/pricing

## Troubleshooting

**"No results found" message?**
- Check if API key is in `.dev.vars`
- Make sure there are no extra spaces
- Restart the dev server
- Check browser console (F12) for errors

**API key not working?**
- Verify it starts with `tvly-`
- Make sure you copied the entire key
- Check if email is verified
- Visit Tavily dashboard to check status

**Still using fallback search?**
- Look for "via Tavily AI" in results
- If not showing, API key might be incorrect
- Check server logs for error messages

## Production Deployment

When deploying to Cloudflare Workers:

```bash
# Add secret to production
wrangler secret put TAVILY_API_KEY
# Paste your key when prompted

# Deploy
npm run deploy
```

## Why Tavily Over Others?

1. **No Credit Card** - Truly free, unlike Brave or Perplexity
2. **AI-First** - Built specifically for LLM applications
3. **Clean Results** - Returns content optimized for AI consumption
4. **Reliable** - Professional API with good uptime
5. **Generous Free Tier** - 1,000 queries is plenty for personal use

## Support

- Documentation: https://docs.tavily.com/
- Dashboard: https://app.tavily.com/
- Issues? Check browser console (F12) for error messages

---

**That's it!** Your GT app now has professional AI-powered search. 🎉
