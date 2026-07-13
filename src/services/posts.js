const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';
const SAFE_IMAGE_URL = /^(https?:\/\/[^\s"'()]+|\/(?!\/)[^\s"'()]+)$/i;

function formatPublishedAt(value) {
  if (!value) return 'Conteúdo ALM';

  const [date] = String(value).split(' ');
  const [year, month, day] = date.split('-');

  if (!year || !month || !day) return 'Conteúdo ALM';

  return `Publicado em ${day}/${month}/${year}`;
}

function normalizePost(post) {
  const imageUrl = post.featured_image && SAFE_IMAGE_URL.test(post.featured_image)
    ? post.featured_image
    : null;

  return {
    id: post.id,
    audience: 'Conteúdo ALM',
    time: formatPublishedAt(post.published_at),
    title: post.title,
    excerpt: post.excerpt || 'Leia o conteúdo completo preparado pela equipe ALM Anestesia.',
    content: post.content || '',
    image: 'records',
    imageUrl,
    href: post.slug ? `/blog/${post.slug}` : '/blog',
  };
}

export async function fetchPosts({ signal } = {}) {
  const response = await fetch(`${API_BASE_URL}/posts`, {
    headers: { Accept: 'application/json' },
    signal,
  });

  if (!response.ok) {
    throw new Error(`Falha ao carregar posts: ${response.status}`);
  }

  const payload = await response.json();
  const posts = Array.isArray(payload.data) ? payload.data : [];

  return posts.map(normalizePost);
}

export async function fetchPost(slug, { signal } = {}) {
  const response = await fetch(`${API_BASE_URL}/posts/${encodeURIComponent(slug)}`, {
    headers: { Accept: 'application/json' },
    signal,
  });

  if (!response.ok) {
    throw new Error(`Falha ao carregar post: ${response.status}`);
  }

  const payload = await response.json();

  return payload.data ? normalizePost(payload.data) : null;
}
