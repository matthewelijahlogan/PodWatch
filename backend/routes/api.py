import re

import feedparser
import requests
from flask import Blueprint, jsonify, request

from utils.data_loader import load_editors_picks
from utils.podcast_catalog import fetch_top_podcasts, get_category_list

api_bp = Blueprint('api', __name__)

ITUNES_SEARCH_URL = 'https://itunes.apple.com/search'


def _search_itunes(query):
    params = {
        'term': query,
        'media': 'podcast',
        'entity': 'podcast',
        'limit': 5,
    }
    response = requests.get(ITUNES_SEARCH_URL, params=params, timeout=12)
    response.raise_for_status()
    payload = response.json()
    return payload.get('results', [])


def _extract_audio_url(entry):
    enclosures = entry.get('enclosures') or []
    for enclosure in enclosures:
        href = enclosure.get('href')
        if href:
            return href

    links = entry.get('links') or []
    for link in links:
        href = link.get('href')
        media_type = (link.get('type') or '').lower()
        if href and ('audio' in media_type or href.endswith('.mp3') or href.endswith('.m4a')):
            return href

    return None


def _extract_duration(entry):
    candidates = [
        entry.get('itunes_duration'),
        entry.get('duration'),
        entry.get('itunes:duration'),
    ]
    for value in candidates:
        if value:
            return str(value)
    return ''


def _episodes_from_feed(feed_url, limit=15):
    response = requests.get(feed_url, timeout=15)
    response.raise_for_status()
    parsed = feedparser.parse(response.content)

    episodes = []
    for entry in parsed.entries:
        audio_url = _extract_audio_url(entry)
        if not audio_url:
            continue

        episodes.append(
            {
                'title': entry.get('title', 'Untitled Episode'),
                'audio_url': audio_url,
                'published': entry.get('published', ''),
                'duration': _extract_duration(entry),
            }
        )

        if len(episodes) >= limit:
            break

    return episodes


@api_bp.route('/api/categories')
def api_categories():
    return jsonify(get_category_list())


@api_bp.route('/api/recommend')
def api_recommend():
    category = request.args.get('category', 'all')
    try:
        podcasts = fetch_top_podcasts(category=category, limit=30)
    except Exception as exc:
        return jsonify({'error': f'Unable to fetch recommendations right now: {exc}'}), 502
    editors = load_editors_picks()

    exclude = {
        item.strip().lower()
        for item in request.args.get('exclude', '').split(',')
        if item.strip()
    }

    editor_titles = {
        pick.get('title', '').strip().lower()
        for pick in editors
        if pick.get('title')
    }

    sorted_podcasts = sorted(
        podcasts,
        key=lambda pod: (
            0 if pod.get('title', '').strip().lower() in editor_titles else 1,
            pod.get('rank', 10_000),
        ),
    )

    recommendations = [
        pod for pod in sorted_podcasts if pod.get('title', '').strip().lower() not in exclude
    ][:10]
    return jsonify(recommendations)


@api_bp.route('/api/podcast-episodes')
def api_podcast_episodes():
    query = request.args.get('q', '').strip()
    if not query:
        return jsonify({'error': 'Missing query'}), 400

    try:
        limit = int(request.args.get('limit', 15))
    except ValueError:
        limit = 15

    limit = max(1, min(limit, 30))

    try:
        matches = _search_itunes(query)
    except requests.RequestException as exc:
        return jsonify({'error': f'iTunes lookup failed: {exc}'}), 502

    if not matches:
        return jsonify({'podcast': None, 'episodes': []})

    for match in matches:
        feed_url = match.get('feedUrl')
        if not feed_url:
            continue

        try:
            episodes = _episodes_from_feed(feed_url, limit=limit)
        except requests.RequestException:
            continue

        if episodes:
            return jsonify(
                {
                    'podcast': {
                        'title': match.get('collectionName') or query,
                        'author': match.get('artistName', ''),
                        'feed_url': feed_url,
                    },
                    'episodes': episodes,
                }
            )

    return jsonify({'podcast': None, 'episodes': []})


@api_bp.route('/api/health')
def api_health():
    return jsonify({'status': 'ok'})
