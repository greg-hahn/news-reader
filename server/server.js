// filepath: /server/server.js
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const PORT = 5177;
const app = express();

app.use(cors({
  origin: 'http://localhost:5176',
}));

// Quiet favicon requests (avoid 404 noise in logs)
app.get('/favicon.ico', (req, res) => {
  res.status(204).end();
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'news-reader-proxy', tokenPresent: !!process.env.THENEWSAPI_TOKEN });
});

app.get('/api/news/all', async (req, res) => {
  const token = process.env.THENEWSAPI_TOKEN;
  if (!token) {
    return res.status(500).json({ error: 'Server configuration error: THENEWSAPI_TOKEN missing' });
  }

  try {
    const page = parseInt(req.query.page || '1', 10);
    const search = (req.query.search || '').trim();
    const categories = (req.query.categories || '').trim();

    const params = {
      language: 'en',
      limit: 3,
      page: isNaN(page) || page < 1 ? 1 : page,
    };

    if (search) {
      params.search = search;
    } else if (categories) {
      params.categories = categories;
    } else {
      params.categories = 'tech';
    }

    // Build sanitized URL for logging (no token)
    const baseUrl = 'https://api.thenewsapi.com/v1/news/all';
    const urlParams = new URLSearchParams(params);
    const sanitizedUrl = `${baseUrl}?${urlParams.toString()}`;

    // Never log the raw token or full URL with token
    console.log(`[Proxy] GET ${sanitizedUrl}`);

    // Call TheNewsApi with api_token
    const response = await axios.get(baseUrl, {
      params: { ...params, api_token: token },
      timeout: 10000,
    });

      const ttl = parseInt(process.env.NEWS_EDGE_TTL || '60', 10);
      const swr = parseInt(process.env.NEWS_EDGE_SWR || '120', 10);
      res.setHeader('Cache-Control', `public, s-maxage=${ttl}, stale-while-revalidate=${swr}`);
    // Ensure most recent results first by published_at desc
    const payload = response.data || {};
    const list = Array.isArray(payload.data) ? [...payload.data] : [];
    list.sort((a, b) => {
      const ad = a && a.published_at ? Date.parse(a.published_at) : 0;
      const bd = b && b.published_at ? Date.parse(b.published_at) : 0;
      return bd - ad; // desc
    });
    res.status(200).json({ ...payload, data: list });
  } catch (err) {
    if (err.response) {
      const status = err.response.status;
      let message = 'An error occurred while fetching news';
      if (status === 429) message = 'Daily request limit reached for TheNewsApi';
      else if (status === 401 || status === 403) message = 'TheNewsApi authentication failed';
      res.status(status).json({ error: message });
    } else if (err.code === 'ECONNABORTED') {
      res.status(504).json({ error: 'Upstream request timed out' });
    } else {
      res.status(500).json({ error: 'Server error contacting TheNewsApi' });
    }
  }
});

app.listen(PORT, () => {
  console.log(`News Reader Proxy listening on http://localhost:${PORT}`);
});
