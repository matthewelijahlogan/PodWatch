import AsyncStorage from '@react-native-async-storage/async-storage';

import { API_BASE_URL } from './config';

const REQUEST_TIMEOUT_MS = 45000;
const CACHE_PREFIX = 'podwatch_cache_v1:';
const RETRYABLE_STATUS = new Set([408, 429, 500, 502, 503, 504]);

function delay(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

async function fetchWithTimeout(url, requestOptions) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    return await fetch(url, { ...requestOptions, signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
}

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
  const maxAgeMs = options.maxAgeMs ?? 1000 * 60 * 60;
  const method = options.method || 'GET';
  const canUseCache = method === 'GET' && options.useCache !== false;

  const requestOptions = {
    method,
    headers: options.headers || undefined,
    body: options.body,
  };

  try {
    const url = `${API_BASE_URL}${path}`;
    let response = await fetchWithTimeout(url, requestOptions);
    if (!response.ok && RETRYABLE_STATUS.has(response.status)) {
      await delay(900);
      response = await fetchWithTimeout(url, requestOptions);
    }
    if (!response.ok) {
      throw new Error(`API request failed (${response.status}) for ${path}`);
    }
    const data = await response.json();
    if (canUseCache) {
      await writeCache(path, data);
    }
    return data;
  } catch (error) {
    // Keep explicit runtime diagnostics in release builds for network triage.
    console.error('[api] request failed', {
      path,
      base: API_BASE_URL,
      message: error?.message,
      name: error?.name,
    });

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
  }
}

export async function getHealth() {
  return fetchJson('/api/health', { maxAgeMs: 1000 * 30 });
}

export async function getTopPodcastsPage(page = 1, perPage = 20, category = 'all') {
  const path = `/api/podcasts?page=${page}&per_page=${perPage}&category=${encodeURIComponent(category)}`;
  const data = await fetchJson(path, { maxAgeMs: 1000 * 60 * 10 });
  return {
    page: data.page || page,
    perPage: data.per_page || perPage,
    total: data.total || 0,
    podcasts: Array.isArray(data.podcasts) ? data.podcasts : [],
  };
}

export async function getGuide(category = 'all', episodesPerShow = 5) {
  const path = `/api/v1/guide?category=${encodeURIComponent(category)}&episodes_per_show=${episodesPerShow}`;
  const data = await fetchJson(path, { maxAgeMs: 1000 * 60 * 15 });
  return {
    channels: Array.isArray(data?.channels) ? data.channels : [],
    errors: Array.isArray(data?.errors) ? data.errors : [],
    partial: Boolean(data?.meta?.partial),
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
  try {
    const curated = await fetchJson('/api/meta-curated?category=all&limit=10&source_limit=50', {
      maxAgeMs: 1000 * 60 * 30,
    });
    const items = Array.isArray(curated?.items) ? curated.items : [];
    if (items.length) return items;
  } catch {
    // Fallback to legacy recommend endpoint if meta-curated isn't deployed yet.
  }

  const data = await fetchJson('/api/recommend', { maxAgeMs: 1000 * 60 * 30 });
  return Array.isArray(data) ? data : [];
}

export async function getLatestEpisodes(title, limit = 3) {
  if (!title) return [];
  const safeLimit = Math.max(1, Math.min(Number(limit) || 3, 20));
  const path = `/api/youtube/latest?q=${encodeURIComponent(title)}&limit=${safeLimit}`;
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
