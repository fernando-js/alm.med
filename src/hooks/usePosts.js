import { useEffect, useMemo, useState } from 'react';
import { fetchPosts } from '../services/posts';

export function usePosts(fallbackArticles, limit = null) {
  const fallbackList = useMemo(
    () => fallbackArticles.slice(0, limit || undefined),
    [fallbackArticles, limit],
  );
  const [page, setPage] = useState(1);
  const [state, setState] = useState({
    articles: fallbackList,
    hasMore: false,
    status: 'idle',
    source: 'fallback',
  });

  useEffect(() => {
    const controller = new AbortController();

    setState((current) => ({ ...current, status: page === 1 ? 'loading' : 'loading-more' }));

    fetchPosts({ signal: controller.signal, limit, page })
      .then(({ posts, meta }) => {
        setState((current) => ({
          articles: page === 1
            ? (posts.length > 0 ? posts : fallbackList)
            : [...current.articles, ...posts],
          hasMore: posts.length > 0 ? meta.hasMore : false,
          status: 'success',
          source: posts.length > 0 ? 'api' : 'fallback',
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
  }, [fallbackList, limit, page]);

  return {
    ...state,
    loadMore: () => {
      if (state.status !== 'loading-more' && state.hasMore) {
        setPage((current) => current + 1);
      }
    },
  };
}
