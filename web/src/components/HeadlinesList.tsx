// filepath: /web/src/components/HeadlinesList.tsx
import React from 'react';
import type { Article } from '../lib/newsapi';

type Props = {
  articles: Article[];
  index: number;
  onPrev: () => void;
  onNext: () => void;
  onFirstPage: () => void;
  onSetIndex: (i: number) => void;
  isFavorite: (a: Article) => boolean;
  onToggleFavorite: (a: Article) => void;
};

export default function HeadlinesList({ articles, index, onPrev, onNext, onFirstPage, onSetIndex, isFavorite, onToggleFavorite }: Props) {
  const article = articles[index];

  if (!article) return null;

  const img = article.image_url || '/placeholder.png';
  const alt = article.title || 'Article image';

  return (
    <div className="card" role="article" aria-label={article.title}>
      <img src={img} alt={alt} />
      <div className="overlay">
        <div className="panel">
          <h2>{article.title}</h2>
          {article.description && <p>{article.description}</p>}
          <div className="actions">
            <a href={article.url} target="_blank" rel="noreferrer">View Full Article</a>
            <button onClick={() => onToggleFavorite(article)}>{isFavorite(article) ? 'Unsave' : 'Save to Favorites'}</button>
          </div>
        </div>
      </div>
    </div>
  );
}
