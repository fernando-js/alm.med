import { useEffect, useMemo, useState } from 'react';
import { fetchPosts } from '../services/posts';

export function usePosts(fallbackArticles, limit = null, searchTerm = '') {
  const normalizedSearchTerm = searchTerm.trim().toLowerCase();
  const fallbackList = useMemo(
    () => fallbackArticles
      .filter((article) => {
        if (!normalizedSearchTerm) return true;

        return [article.title, article.excerpt, article.audience]
          .filter(Boolean)
          .some((value) => value.toLowerCase().includes(normalizedSearchTerm));
      })
      .slice(0, limit || undefined),
    [fallbackArticles, limit, normalizedSearchTerm],
  );
  const [page, setPage] = useState(1);
  const [state, setState] = useState({
    articles: fallbackList,
    hasMore: false,
    status: 'idle',
    source: 'fallback',
  });

  useEffect(() => {
    setPage(1);
  }, [normalizedSearchTerm]);

  useEffect(() => {
    const controller = new AbortController();

    setState((current) => ({ ...current, status: page === 1 ? 'loading' : 'loading-more' }));

    fetchPosts({ signal: controller.signal, limit, page, searchTerm: normalizedSearchTerm })
      .then(({ posts, meta }) => {
        setState((current) => ({
          articles: page === 1
            ? (posts.length > 0 ? posts : (normalizedSearchTerm ? [] : fallbackList))
            : [...current.articles, ...posts],
          hasMore: posts.length > 0 ? meta.hasMore : false,
          status: 'success',
          source: posts.length > 0 || normalizedSearchTerm ? 'api' : 'fallback',
        }));
      })
      .catch((error) => {
        if (error.name === 'AbortError') return;

        setState((current) => ({
          articles: page === 1 ? fallbackList : current.articles,
          hasMore: false,
          status: 'error',
          source: 'fallback',
        }));
      });

    return () => controller.abort();
  }, [fallbackList, limit, page, normalizedSearchTerm]);

  return {
    ...state,
    loadMore: () => {
      if (state.status !== 'loading-more' && state.hasMore) {
        setPage((current) => current + 1);
      }
    },
  };
}
