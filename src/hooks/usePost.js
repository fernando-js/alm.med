import { useEffect, useState } from 'react';
import { fetchPost } from '../services/posts';

export function usePost(slug) {
  const [state, setState] = useState({
    post: null,
    status: slug ? 'loading' : 'error',
  });

  useEffect(() => {
    if (!slug) {
      setState({ post: null, status: 'error' });
      return undefined;
    }

    const controller = new AbortController();

    setState({ post: null, status: 'loading' });

    fetchPost(slug, { signal: controller.signal })
      .then((post) => {
        setState({ post, status: post ? 'success' : 'error' });
      })
      .catch((error) => {
        if (error.name === 'AbortError') return;

        setState({ post: null, status: 'error' });
      });

    return () => controller.abort();
  }, [slug]);

  return state;
}
