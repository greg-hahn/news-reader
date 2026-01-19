// filepath: /api/news/all.js
export default async function handler(req, res) {
  try {
    const token = process.env.THENEWSAPI_TOKEN;
    if (!token) {
      return res.status(500).json({ error: 'Server configuration error: THENEWSAPI_TOKEN missing' });
    }

    const q = req.query || {};
    const pageRaw = Array.isArray(q.page) ? q.page[0] : q.page;
    const searchRaw = Array.isArray(q.search) ? q.search[0] : q.search;
    const categoriesRaw = Array.isArray(q.categories) ? q.categories[0] : q.categories;

    const page = Math.max(1, parseInt(pageRaw || '1', 10) || 1);
    const search = (searchRaw || '').trim();
    const categories = (categoriesRaw || '').trim();

    const url = new URL('https://api.thenewsapi.com/v1/news/all');
    url.searchParams.set('language', 'en');
    url.searchParams.set('limit', '3');
    url.searchParams.set('page', String(page));

    if (search) {
      url.searchParams.set('search', search);
    } else if (categories) {
      url.searchParams.set('categories', categories);
    } else {
      url.searchParams.set('categories', 'tech');
    }

    url.searchParams.set('api_token', token);

    const sanitized = new URL(url.toString());
    sanitized.searchParams.delete('api_token');
    console.log(`[Vercel Proxy] GET ${sanitized.toString()}`);

    const upstream = await fetch(url.toString(), { method: 'GET', headers: { 'Accept': 'application/json' } });

    if (!upstream.ok) {
      const status = upstream.status;
      let message = 'An error occurred while fetching news';
      if (status === 429) message = 'Daily request limit reached for TheNewsApi';
      else if (status === 401 || status === 403) message = 'TheNewsApi authentication failed';
      return res.status(status).json({ error: message });
    }

    const payload = await upstream.json();
    const list = Array.isArray(payload.data) ? [...payload.data] : [];
    list.sort((a, b) => {
      const ad = a && a.published_at ? Date.parse(a.published_at) : 0;
      const bd = b && b.published_at ? Date.parse(b.published_at) : 0;
      return bd - ad; // newest first
    });

    const ttl = parseInt(process.env.NEWS_EDGE_TTL || '120', 10); // seconds
    const swr = parseInt(process.env.NEWS_EDGE_SWR || '300', 10); // seconds
    // Vercel Edge CDN cache (path+query form the cache key). Errors are not cached.
    res.setHeader('Cache-Control', `public, s-maxage=${ttl}, stale-while-revalidate=${swr}`);
    res.status(200).json({ ...payload, data: list });
  } catch (err) {
    res.status(500).json({ error: 'Server error contacting TheNewsApi' });
  }
}
