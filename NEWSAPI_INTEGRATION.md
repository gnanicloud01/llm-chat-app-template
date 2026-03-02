# 📰 NewsAPI Integration - Complete Guide

## Overview

Your GT app now uses **NewsAPI** as the primary source for news queries, giving you access to:
- ✅ **70,000+ news sources** worldwide
- ✅ **3,000 free queries/month** (100/day)
- ✅ **Real-time news** from major publications
- ✅ **Better quality** than general search for news

## What Changed?

### Search Priority (New)

1. **NewsAPI** (Primary for news) - 70,000+ sources, 3,000/month
2. **Tavily AI** (Fallback) - AI-optimized, 1,000/month
3. **SearXNG** (Fallback 2) - Free meta-search
4. **DuckDuckGo** (Fallback 3) - Free instant answers
5. **Wikipedia** (Fallback 4) - Free encyclopedia

### How It Works

```
User asks: "today news"
    ↓
Is it a news query? YES
    ↓
Try NewsAPI first (70k+ sources)
    ↓
Success? Return 20 articles
    ↓
Failed? Try Tavily AI
    ↓
Success? Return 15 results
    ↓
Failed? Try other fallbacks
```

## NewsAPI Features

### What You Get

- **70,000+ sources**: CNN, BBC, Reuters, NYT, WSJ, etc.
- **Real-time updates**: Articles published within minutes
- **Rich metadata**: Title, description, content, source, date
- **Multiple endpoints**: Top headlines, everything, sources
- **Language support**: 14 languages including English
- **Category filtering**: Business, tech, sports, entertainment, etc.

### Free Tier Limits

- **100 requests/day** (3,000/month)
- **Articles from last 30 days**
- **No commercial use**
- **Attribution required**

## API Configuration

### Already Configured ✅

Your `.dev.vars` file now has:
```bash
NEWSAPI_KEY=c1b23a7d598e44b3b8bda3ece9e73f64
```

### For Production

When deploying to Cloudflare Workers:
```bash
wrangler secret put NEWSAPI_KEY
# Paste: c1b23a7d598e44b3b8bda3ece9e73f64
```

## Testing

### 1. Restart Server
```bash
cd llm-chat-app-template
npm run dev
```

### 2. Enable Web Search
Click the 🌐 globe icon (turns blue)

### 3. Try News Queries
```
"today news"
"latest technology news"
"breaking news"
"current world events"
"recent sports news"
```

### 4. Check Console
Open browser console (F12) and look for:
```
[Search] Attempting NewsAPI search for: today news
[Search] NewsAPI response status: 200
[Search] NewsAPI results count: 20
```

## Example Response

### NewsAPI Returns:
```json
{
  "articles": [
    {
      "source": { "name": "CNN" },
      "title": "Israeli-Iran Conflict Escalates",
      "description": "The United States and Israel have launched...",
      "url": "https://cnn.com/article",
      "publishedAt": "2026-03-02T08:30:00Z",
      "content": "Full article content..."
    },
    // ... 19 more articles
  ]
}
```

### Your App Shows:
```markdown
Here are today's top news highlights for Monday, March 2, 2026:

🌍 **World News | Latest Top Stories**
• **Israeli-Iran Conflict Escalates** — The United States and Israel 
  have launched a series of airstrikes targeting Iran's leadership. 
  According to [CNN](https://cnn.com/article).

• **Oil Prices Surge Over 10%** — Global markets react to Middle East 
  tensions. [BBC](https://bbc.com) reports energy concerns.

💼 **Business & Markets**
• **US Stocks Fall on Geopolitical Tensions** — Major indices decline 
  as investors react. Source: [Reuters](https://reuters.com)
```

## Advantages Over Tavily

| Feature | NewsAPI | Tavily AI |
|---------|---------|-----------|
| News Sources | 70,000+ | Unknown |
| Free Queries | 3,000/mo | 1,000/mo |
| News Quality | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| Source Names | ✅ Yes | ❌ No |
| Real-time | ✅ Yes | ✅ Yes |
| Setup | 2 min | 3 min |
| Credit Card | ❌ No | ❌ No |

## Query Examples

### General News
```
"today news"
"latest news"
"breaking news"
"current events"
```

### Topic-Specific
```
"technology news"
"sports news today"
"business news"
"entertainment news"
```

### Location-Specific
```
"US news today"
"world news"
"India news"
```

### Time-Based
```
"news from last 24 hours"
"recent news"
"today's headlines"
```

## Monitoring Usage

### Check Your Usage
Visit: https://newsapi.org/account

### Daily Limit
- 100 requests/day
- Resets at midnight UTC
- Monitor in dashboard

### Monthly Limit
- 3,000 requests/month
- Upgrade available if needed

## Error Handling

### Common Errors

**1. Rate Limit Exceeded**
```json
{
  "status": "error",
  "code": "rateLimited",
  "message": "You have made too many requests"
}
```
**Solution**: Wait until next day or upgrade plan

**2. Invalid API Key**
```json
{
  "status": "error",
  "code": "apiKeyInvalid",
  "message": "Your API key is invalid"
}
```
**Solution**: Check `.dev.vars` has correct key

**3. No Results**
```json
{
  "status": "ok",
  "totalResults": 0,
  "articles": []
}
```
**Solution**: App automatically falls back to Tavily

### Automatic Fallback

If NewsAPI fails, your app automatically tries:
1. Tavily AI Search
2. SearXNG
3. DuckDuckGo
4. Wikipedia

You'll always get results! ✅

## Advanced Features

### 1. Top Headlines Endpoint

For breaking news, you could use:
```typescript
const url = `https://newsapi.org/v2/top-headlines?country=us&apiKey=${env.NEWSAPI_KEY}`;
```

### 2. Category Filtering

Filter by category:
```typescript
const url = `https://newsapi.org/v2/top-headlines?category=technology&apiKey=${env.NEWSAPI_KEY}`;
```

Categories: business, entertainment, general, health, science, sports, technology

### 3. Source Filtering

Get news from specific sources:
```typescript
const url = `https://newsapi.org/v2/everything?sources=cnn,bbc-news&apiKey=${env.NEWSAPI_KEY}`;
```

### 4. Date Range

Get news from specific dates:
```typescript
const url = `https://newsapi.org/v2/everything?q=bitcoin&from=2026-03-01&to=2026-03-02&apiKey=${env.NEWSAPI_KEY}`;
```

## Customization

### Change Number of Results

Edit `src/index.ts`:
```typescript
const newsApiUrl = `https://newsapi.org/v2/everything?q=${encodeURIComponent(query)}&sortBy=publishedAt&pageSize=30&language=en&apiKey=${env.NEWSAPI_KEY}`;
// Changed from 20 to 30
```

### Add Language Support

```typescript
const newsApiUrl = `https://newsapi.org/v2/everything?q=${encodeURIComponent(query)}&sortBy=publishedAt&pageSize=20&language=es&apiKey=${env.NEWSAPI_KEY}`;
// Changed from 'en' to 'es' for Spanish
```

### Filter by Domain

```typescript
const newsApiUrl = `https://newsapi.org/v2/everything?q=${encodeURIComponent(query)}&domains=cnn.com,bbc.com&apiKey=${env.NEWSAPI_KEY}`;
```

## Troubleshooting

### Issue: No results from NewsAPI

**Check:**
1. API key is correct in `.dev.vars`
2. Server was restarted after adding key
3. Query contains news keywords
4. Browser console shows NewsAPI attempt

**Solution:**
```bash
# Verify API key
cat .dev.vars | grep NEWSAPI

# Restart server
npm run dev

# Check browser console (F12)
```

### Issue: Rate limit exceeded

**Check:**
- Visit https://newsapi.org/account
- See daily/monthly usage

**Solution:**
- Wait until next day (resets midnight UTC)
- Or upgrade to paid plan

### Issue: Poor quality results

**Try:**
1. Use more specific queries
2. Add topic keywords (tech, sports, business)
3. Check if Tavily gives better results
4. Adjust pageSize parameter

## Best Practices

### 1. Efficient Queries
- Be specific: "technology news" vs "news"
- Use keywords: today, latest, breaking
- Avoid very broad queries

### 2. Monitor Usage
- Check dashboard weekly
- Stay under 100/day limit
- Plan for peak usage

### 3. Cache Results
- Implement caching for repeated queries
- Cache for 5-10 minutes
- Saves API calls

### 4. Fallback Strategy
- Always have Tavily as backup
- Test fallback scenarios
- Monitor which API is used

## Comparison: Before vs After

### Before (Tavily Only)
- 1,000 queries/month
- General search results
- No source names
- Good quality

### After (NewsAPI + Tavily)
- 4,000 queries/month total
- 70,000+ news sources
- Source names included
- Excellent news quality
- Automatic fallback

## Next Steps

### 1. Test It Now
```bash
npm run dev
# Ask: "today news"
```

### 2. Monitor Usage
Visit: https://newsapi.org/account

### 3. Optimize Queries
Try different news queries and see results

### 4. Consider Upgrade
If you need more than 100/day:
- **Developer**: $449/month (250,000 requests)
- **Business**: Custom pricing

## Support

### NewsAPI
- Dashboard: https://newsapi.org/account
- Docs: https://newsapi.org/docs
- Support: support@newsapi.org

### Your App
- Check `QUICK_START.md` for testing
- Check `NEWS_SEARCH_IMPROVEMENTS.md` for details
- Check browser console (F12) for errors

---

**Congratulations!** Your GT app now has access to 70,000+ news sources with NewsAPI! 🎉

Enjoy professional, comprehensive news coverage!
