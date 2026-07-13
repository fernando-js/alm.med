import { useEffect, useMemo, useState } from 'react';
import { fetchPosts } from '../services/posts';

export function usePosts(fallbackArticles, limit = null) {
  const fallbackList = useMemo(
    () => fallbackArticles.slice(0, limit || undefined),
    [fallbackArticles, limit],
  );
  const [state, setState] = useState({
    articles: fallbackList,
    status: 'idle',
    source: 'fallback',
  });

  useEffect(() => {
    const controller = new AbortController();

    setState((current) => ({ ...current, status: 'loading' }));

    fetchPosts({ signal: controller.signal })
      .then((posts) => {
        setState({
          articles: (posts.length > 0 ? posts : fallbackArticles).slice(0, limit || undefined),
          status: 'success',
          source: posts.length > 0 ? 'api' : 'fallback',
        });
      })
      .catch((error) => {
        if (error.name === 'AbortError') return;

        setState({
          articles: fallbackList,
          status: 'error',
          source: 'fallback',
        });
      });

    return () => controller.abort();
  }, [fallbackArticles, fallbackList, limit]);

  return state;
}
