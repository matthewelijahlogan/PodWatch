import json
import os
import re
import time

import requests


YOUTUBE_API_KEY = os.environ.get('YOUTUBE_API_KEY')
YOUTUBE_SEARCH_URL = 'https://www.googleapis.com/youtube/v3/search'

_CACHE = {}
_CACHE_TTL_SECONDS = 60 * 20


def _cache_get(key):
    value = _CACHE.get(key)
    if not value:
        return None
    saved_at, payload = value
    if (time.time() - saved_at) > _CACHE_TTL_SECONDS:
        _CACHE.pop(key, None)
        return None
    return payload


def _cache_set(key, payload):
    _CACHE[key] = (time.time(), payload)


def _extract_text(value):
    if isinstance(value, dict):
        simple = value.get('simpleText')
        if simple:
            return simple
        runs = value.get('runs') or []
        if runs:
            return ''.join((run.get('text') or '') for run in runs)
    return ''


def _iter_video_renderers(obj):
    if isinstance(obj, dict):
        video = obj.get('videoRenderer')
        if isinstance(video, dict):
            yield video
        for value in obj.values():
            yield from _iter_video_renderers(value)
    elif isinstance(obj, list):
        for value in obj:
            yield from _iter_video_renderers(value)


def _fallback_search_youtube(query, limit=3):
    headers = {'User-Agent': 'Mozilla/5.0'}
    params = {'search_query': f'{query} podcast full episode'}
    response = requests.get('https://www.youtube.com/results', params=params, headers=headers, timeout=20)
    response.raise_for_status()
    html = response.text

    match = re.search(r'var ytInitialData = (\{.*?\});', html, flags=re.DOTALL)
    if not match:
        return []

    data = json.loads(match.group(1))
    found = []
    seen = set()
    for video in _iter_video_renderers(data):
        video_id = video.get('videoId') or ''
        if not video_id or video_id in seen:
            continue

        title = _extract_text(video.get('title'))
        length_text = _extract_text(video.get('lengthText'))
        lowered = (title or '').lower()
        if not title or '#shorts' in lowered or 'shorts' == lowered.strip():
            continue

        if length_text:
            if ':' not in length_text:
                continue
            parts = [int(part) for part in length_text.split(':') if part.isdigit()]
            if len(parts) == 2:
                total_seconds = (parts[0] * 60) + parts[1]
            elif len(parts) == 3:
                total_seconds = (parts[0] * 3600) + (parts[1] * 60) + parts[2]
            else:
                total_seconds = 0
            if total_seconds and total_seconds < (8 * 60):
                continue

        found.append({'title': title, 'url': f'https://www.youtube.com/watch?v={video_id}'})
        seen.add(video_id)
        if len(found) >= limit:
            break

    return found


def get_latest_youtube_episodes(query, limit=3):
    query = (query or '').strip()
    if not query:
        return []

    cache_key = f'latest:{query}:{limit}'
    cached = _cache_get(cache_key)
    if cached is not None:
        return cached

    payload = []
    if YOUTUBE_API_KEY:
        params = {
            'part': 'snippet',
            'q': f'{query} podcast episode official -shorts -clip -clips -reaction -highlight -trailer',
            'maxResults': 12,
            'type': 'video',
            'order': 'date',
            'videoDuration': 'long',
            'key': YOUTUBE_API_KEY,
        }
        try:
            response = requests.get(YOUTUBE_SEARCH_URL, params=params, timeout=20)
            response.raise_for_status()
            items = response.json().get('items', [])
            for item in items:
                video_id = item.get('id', {}).get('videoId')
                title = item.get('snippet', {}).get('title')
                if video_id and title:
                    payload.append({'title': title, 'url': f'https://www.youtube.com/watch?v={video_id}'})
                if len(payload) >= limit:
                    break
        except requests.RequestException:
            payload = []

    if not payload:
        try:
            payload = _fallback_search_youtube(query, limit=limit)
        except requests.RequestException:
            payload = []

    _cache_set(cache_key, payload)
    return payload

