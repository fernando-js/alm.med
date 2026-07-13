import { useEffect, useState } from 'react';
import { fetchPosts } from '../services/posts';

export function usePosts(fallbackArticles) {
  const [state, setState] = useState({
    articles: fallbackArticles,
    status: 'idle',
    source: 'fallback',
  });

  useEffect(() => {
    const controller = new AbortController();

    setState((current) => ({ ...current, status: 'loading' }));

    fetchPosts({ signal: controller.signal })
      .then((posts) => {
        setState({
          articles: posts.length > 0 ? posts : fallbackArticles,
          status: 'success',
          source: posts.length > 0 ? 'api' : 'fallback',
        });
      })
      .catch((error) => {
        if (error.name === 'AbortError') return;

        setState({
          articles: fallbackArticles,
          status: 'error',
          source: 'fallback',
        });
      });

    return () => controller.abort();
  }, [fallbackArticles]);

  return state;
}
