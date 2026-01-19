// filepath: /web/src/lib/newsapi.ts
export type Article = {
  id?: string;
  uuid?: string;
  title: string;
  description?: string;
  url: string;
  image_url?: string;
  published_at?: string;
  source?: string;
  language?: string;
  categories?: string[];
};

export type NewsResponse = {
  data: Article[];
  meta?: any;
};

export type FetchParams = {
  page: number;
  search?: string;
  categories?: string;
  signal?: AbortSignal;
};

export function buildProxyUrl(params: FetchParams) {
  const base = '/api/news/all';
  const url = new URL(base, window.location.origin);
  url.searchParams.set('language', 'en');
  url.searchParams.set('limit', '3');
  url.searchParams.set('page', String(params.page));
  if (params.search && params.search.trim()) {
    url.searchParams.set('search', params.search.trim());
  } else if (params.categories && params.categories.trim()) {
    url.searchParams.set('categories', params.categories.trim());
  } else {
    url.searchParams.set('categories', 'tech');
  }
  return url.pathname + url.search; // client logs proxied URL (no token)
}

export async function fetchNews(params: FetchParams): Promise<NewsResponse> {
  const proxied = buildProxyUrl(params);
  console.log('[Client] GET', proxied);
  const res = await fetch(proxied, { headers: { 'Accept': 'application/json' }, signal: params.signal });
  if (!res.ok) {
    let msg = 'Failed to fetch news';
    if (res.status === 429) msg = 'Daily request limit reached…';
    else if (res.status === 401 || res.status === 403) msg = 'TheNewsApi authentication failed…';
    throw new Error(msg);
  }
  return res.json();
}
