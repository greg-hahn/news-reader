// filepath: /api/health.js
export default async function handler(req, res) {
  res.status(200).json({ status: 'ok', service: 'news-reader-proxy', tokenPresent: !!process.env.THENEWSAPI_TOKEN });
}
