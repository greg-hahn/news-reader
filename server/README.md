<!-- filepath: /server/README.md -->
# News Reader Proxy

Express proxy for TheNewsApi. Hides `THENEWSAPI_TOKEN` from the browser.

## Routes
- `GET /api/health` — health check
- `GET /api/news/all` — proxies `https://api.thenewsapi.com/v1/news/all`

Query params:
- Always sets `language=en` and `limit=3`
- Accepts `page`
- Accepts either `categories` or `search` (search takes priority)

## Environment
Create `server/.env` from `.env.example` and set your token:

```
THENEWSAPI_TOKEN=your_token_here
```

## Security
- Token is never exposed to the browser.
- Server logs only sanitized URLs without token.
