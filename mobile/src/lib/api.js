import AsyncStorage from '@react-native-async-storage/async-storage';

import { API_BASE_URL } from './config';

const REQUEST_TIMEOUT_MS = 12000;
const CACHE_PREFIX = 'podwatch_cache_v1:';

function cacheKeyFor(path) {
  return `${CACHE_PREFIX}${encodeURIComponent(path)}`;
}

async function readCache(path, maxAgeMs = 1000 * 60 * 60) {
  try {
    const raw = await AsyncStorage.getItem(cacheKeyFor(path));
    if (!raw) return null;

    const parsed = JSON.parse(raw);
    if (!parsed?.savedAt || parsed.data === undefined) return null;

    const age = Date.now() - parsed.savedAt;
    if (age > maxAgeMs) return null;

    return parsed.data;
  } catch {
    return null;
  }
}

async function writeCache(path, data) {
  try {
    const payload = JSON.stringify({ savedAt: Date.now(), data });
    await AsyncStorage.setItem(cacheKeyFor(path), payload);
  } catch {
    // cache failures should not break app flow
  }
}

async function fetchJson(path, options = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  const maxAgeMs = options.maxAgeMs ?? 1000 * 60 * 60;
  const method = options.method || 'GET';
  const canUseCache = method === 'GET' && options.useCache !== false;

  const requestOptions = {
    method,
    signal: controller.signal,
    headers: options.headers || undefined,
    body: options.body,
  };

  try {
    const response = await fetch(`${API_BASE_URL}${path}`, requestOptions);
    if (!response.ok) {
      throw new Error(`API request failed (${response.status}) for ${path}`);
    }
    const data = await response.json();
    if (canUseCache) {
      await writeCache(path, data);
    }
    return data;
  } catch (error) {
    if (canUseCache) {
      const cached = await readCache(path, maxAgeMs);
      if (cached !== null) {
        return cached;
      }
    }

    if (error?.name === 'AbortError') {
      throw new Error(`Request timed out for ${path}`);
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

export async function getHealth() {
  return fetchJson('/api/health', { maxAgeMs: 1000 * 30 });
}

export async function getTopPodcastsPage(page = 1, perPage = 20, category = 'all') {
  const path = `/api/podcasts?page=${page}&per_page=${perPage}&category=${encodeURIComponent(category)}&include_episodes=1`;
  const data = await fetchJson(path, { maxAgeMs: 1000 * 60 * 10 });
  return {
    page: data.page || page,
    perPage: data.per_page || perPage,
    total: data.total || 0,
    podcasts: Array.isArray(data.podcasts) ? data.podcasts : [],
  };
}

export async function getTopPodcasts(page = 1, perPage = 20, category = 'all') {
  const data = await getTopPodcastsPage(page, perPage, category);
  return data.podcasts;
}

export async function getEditorsPicks() {
  const data = await fetchJson('/api/editors-picks', { maxAgeMs: 1000 * 60 * 60 * 12 });
  return Array.isArray(data) ? data : [];
}

export async function getCategories() {
  const data = await fetchJson('/api/categories', { maxAgeMs: 1000 * 60 * 60 * 12 });
  return Array.isArray(data) ? data : [];
}

export async function getRecommendations() {
  const data = await fetchJson('/api/recommend', { maxAgeMs: 1000 * 60 * 30 });
  return Array.isArray(data) ? data : [];
}

export async function getLatestEpisodes(title) {
  if (!title) return [];
  const path = `/api/youtube/latest?q=${encodeURIComponent(title)}`;
  const data = await fetchJson(path, { maxAgeMs: 1000 * 60 * 10 });
  return Array.isArray(data) ? data : [];
}

export async function getTopEpisodes(title) {
  if (!title) return [];
  const path = `/api/youtube/top?q=${encodeURIComponent(title)}`;
  const data = await fetchJson(path, { maxAgeMs: 1000 * 60 * 30 });
  return Array.isArray(data) ? data : [];
}

export async function getPodcastEpisodes(query, limit = 15) {
  if (!query) return { podcast: null, episodes: [] };
  const path = `/api/podcast-episodes?q=${encodeURIComponent(query)}&limit=${limit}`;
  const data = await fetchJson(path, { maxAgeMs: 1000 * 60 * 30 });

  return {
    podcast: data?.podcast || null,
    episodes: Array.isArray(data?.episodes) ? data.episodes : [],
  };
}

export function toImageUrl(path) {
  if (!path) return null;
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  const normalized = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE_URL}${normalized}`;
}

export async function getReviewSummary(kind, targetId) {
  if (!kind || !targetId) {
    return { average_rating: 0, review_count: 0, comments: [] };
  }
  const path = `/api/reviews/summary?kind=${encodeURIComponent(kind)}&target_id=${encodeURIComponent(targetId)}`;
  return fetchJson(path, { maxAgeMs: 1000 * 60 * 2 });
}

export async function getReviewSummaries(kind, targetIds = []) {
  if (!kind || !Array.isArray(targetIds) || targetIds.length === 0) {
    return {};
  }
  const joined = targetIds.map((id) => encodeURIComponent(id)).join(',');
  const path = `/api/reviews/summaries?kind=${encodeURIComponent(kind)}&target_ids=${joined}`;
  const data = await fetchJson(path, { maxAgeMs: 1000 * 60 * 2 });
  return data?.items || {};
}

export async function submitReview(payload) {
  return fetchJson('/api/reviews', {
    method: 'POST',
    useCache: false,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload || {}),
  });
}
