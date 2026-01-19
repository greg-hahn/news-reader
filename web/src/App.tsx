// filepath: /web/src/App.tsx
import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';
import HeadlinesList from './components/HeadlinesList';
import type { Article } from './lib/newsapi';
import { fetchNews } from './lib/newsapi';

const CATEGORIES = ['tech','general','science','sports','business','health','entertainment','politics','food','travel'] as const;
type Category = typeof CATEGORIES[number];

function getKey(a: Article) {
  return a.id || a.uuid || a.url;
}

function App() {
  const [category, setCategory] = useState<Category>('tech');
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [index, setIndex] = useState(0);
  const [items, setItems] = useState<Article[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [showFavorites, setShowFavorites] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 900);
  const [cache] = useState<Map<number, Article[]>>(new Map());
  const [prefetchNext, setPrefetchNext] = useState<Article[] | null>(null);
  const [prefetchPrev, setPrefetchPrev] = useState<Article[] | null>(null);
  const [favorites, setFavorites] = useState<Map<string, Article>>(() => {
    try {
      const raw = localStorage.getItem('favorites');
      if (!raw) return new Map();
      const arr: Article[] = JSON.parse(raw);
      return new Map(arr.map(a => [getKey(a), a]));
    } catch {
      return new Map();
    }
  });

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth <= 900);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  useEffect(() => {
    if (showFavorites) return; // no live fetch when viewing favorites
    setLoading(true);
    setError(null);
    setItems(null);
    setPage(1);
    setIndex(0);
    cache.clear();
    setPrefetchNext(null);
    setPrefetchPrev(null);

    const controller = new AbortController();
    fetchNews({ page: 1, search: search.trim() || undefined, categories: search.trim() ? undefined : category, signal: controller.signal })
      .then(r => {
        setItems(r.data || []);
        cache.set(1, r.data || []);
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, [category, search, showFavorites]);

  // Prefetch logic
  useEffect(() => {
    if (showFavorites) return;
    if (!items || items.length === 0) return;
    const shouldPrefetchNext = index === 1; // when user reaches second article
    const shouldPrefetchPrev = index === 0 && page > 1;

    if (shouldPrefetchNext && !cache.has(page + 1)) {
      fetchNews({ page: page + 1, search: search.trim() || undefined, categories: search.trim() ? undefined : category })
        .then(r => {
          cache.set(page + 1, r.data || []);
          setPrefetchNext(r.data || []);
        })
        .catch(() => { /* ignore */ });
    }
    if (shouldPrefetchPrev && !cache.has(page - 1)) {
      fetchNews({ page: page - 1, search: search.trim() || undefined, categories: search.trim() ? undefined : category })
        .then(r => {
          cache.set(page - 1, r.data || []);
          setPrefetchPrev(r.data || []);
        })
        .catch(() => { /* ignore */ });
    }
  }, [index, page, items, category, search, showFavorites]);

  const currentList = useMemo(() => {
    if (showFavorites) {
      return Array.from(favorites.values());
    }
    return items || [];
  }, [showFavorites, favorites, items]);

  function isFavorite(a: Article) {
    return favorites.has(getKey(a));
  }
  function toggleFavorite(a: Article) {
    const key = getKey(a);
    const next = new Map(favorites);
    if (next.has(key)) next.delete(key); else next.set(key, a);
    setFavorites(next);
    localStorage.setItem('favorites', JSON.stringify(Array.from(next.values())));
  }

  function goFirstPage() {
    if (showFavorites) {
      setIndex(0);
      return;
    }
    setIndex(0);
    setPage(1);
    const cached = cache.get(1);
    if (cached) setItems(cached);
    else {
      setLoading(true);
      fetchNews({ page: 1, search: search.trim() || undefined, categories: search.trim() ? undefined : category })
        .then(r => { setItems(r.data || []); cache.set(1, r.data || []); })
        .catch(e => setError(e.message))
        .finally(() => setLoading(false));
    }
  }
  function prev() {
    if (showFavorites) {
      setIndex(i => Math.max(0, i - 1));
      return;
    }
    if (index > 0) {
      setIndex(index - 1);
      return;
    }
    if (page > 1) {
      const use = prefetchPrev || cache.get(page - 1);
      if (use) {
        setItems(use);
        setPage(page - 1);
        setIndex(2);
        return;
      }
      setLoading(true);
      fetchNews({ page: page - 1, search: search.trim() || undefined, categories: search.trim() ? undefined : category })
        .then(r => { cache.set(page - 1, r.data || []); setItems(r.data || []); setPage(p => p - 1); setIndex(2); })
        .catch(e => setError(e.message))
        .finally(() => setLoading(false));
    }
  }
  function next() {
    if (showFavorites) {
      setIndex(i => Math.min(currentList.length - 1, i + 1));
      return;
    }
    if (index < 2) {
      setIndex(index + 1);
      return;
    }
    const use = prefetchNext || cache.get(page + 1);
    if (use) {
      setItems(use);
      setPage(page + 1);
      setIndex(0);
      return;
    }
    setLoading(true);
    fetchNews({ page: page + 1, search: search.trim() || undefined, categories: search.trim() ? undefined : category })
      .then(r => { cache.set(page + 1, r.data || []); setItems(r.data || []); setPage(p => p + 1); setIndex(0); })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }
  function setDot(i: number) {
    setIndex(i);
  }

  const header = (
    <div className="header">
      <h1>News Reader</h1>
      {!isMobile && (
        <button className="filtersToggle" onClick={() => setShowFilters(s => !s)}>{(showFilters || window.innerWidth > 900) ? 'Hide Filters' : 'Show Filters'}</button>
      )}
      {isMobile && (
        <div className="headerControls" aria-label="mobile filters">
          <select
            aria-label="Category"
            value={category}
            onChange={(e) => { setSearch(''); setSearchInput(''); setCategory(e.target.value as Category); }}
          >
            {CATEGORIES.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
          <input
            type="text"
            placeholder="Search…"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') setSearch(searchInput.trim()); }}
            aria-label="Search"
          />
          <button className="filtersToggle" onClick={() => setSearch(searchInput.trim())}>Go</button>
          <button className="filtersToggle" onClick={() => setShowFavorites(s => !s)}>{showFavorites ? 'Exit' : 'Favorites'}</button>
        </div>
      )}
    </div>
  );

  const sidebar = (
    <aside className="sidebar" aria-label="filters">
      <h1>Filters</h1>
      <div className="search" role="search">
        <input
          type="text"
          placeholder="Search…"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') setSearch(searchInput.trim()); }}
          aria-label="Search"
        />
        <button onClick={() => setSearch(searchInput.trim())}>Go</button>
      </div>
      <div className="categories" role="list">
        {CATEGORIES.map(cat => (
          <button key={cat} className={`category ${(!search && category===cat) ? 'active' : ''}`} onClick={() => { setSearch(''); setSearchInput(''); setCategory(cat); }}>
            {cat}
          </button>
        ))}
      </div>
      <div className="favoritesToggle">
        <span>Favorites</span>
        <button onClick={() => setShowFavorites(s => !s)}>{showFavorites ? 'Exit' : 'View'}</button>
      </div>
    </aside>
  );

  return (
    <div className="app">
      {header}
      {!isMobile && ((showFilters || window.innerWidth > 900)) && sidebar}
      <main className="content">
        {loading && (
          <div className="skeleton" role="status" aria-live="polite"><div className="loader" /></div>
        )}
        {!loading && error && (
          <div className="skeleton"><p>{error}</p></div>
        )}
        {!loading && !error && currentList.length > 0 && (
          <HeadlinesList
            articles={currentList}
            index={index}
            onPrev={prev}
            onNext={next}
            onFirstPage={goFirstPage}
            onSetIndex={setDot}
            isFavorite={isFavorite}
            onToggleFavorite={toggleFavorite}
          />
        )}
        {!loading && !error && currentList.length === 0 && (
          <div className="skeleton"><p>No results</p></div>
        )}
        {/* Separate pager beneath the card */}
        {!loading && !error && (
          <div className="pager" role="navigation" aria-label="pagination">
            <button className="pageBtn" onClick={goFirstPage} aria-label="First page">«</button>
            <button className="pageBtn" onClick={prev} aria-label="Previous">‹</button>
            {[0,1,2].map((i) => (
              <button key={i} className={`pageBtn ${index===i ? 'active' : ''}`} onClick={() => setDot(i)} aria-label={`Go to article ${i+1}`}>{i+1}</button>
            ))}
            <button className="pageBtn" onClick={next} aria-label="Next">›</button>
          </div>
        )}

        {/* Footer space to reserve height and avoid page scroll */}
        <div className="footer" role="contentinfo" aria-label="footer" />
      </main>
    </div>
  );
}

const root = createRoot(document.getElementById('root')!);
root.render(<App />);
