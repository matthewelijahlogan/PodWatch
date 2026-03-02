#backend/routes/podcasts.py

from flask import Blueprint, jsonify, request

from utils.podcast_catalog import fetch_top_podcasts
from utils.youtube_lookup import get_latest_youtube_episodes

podcast_bp = Blueprint('podcast_bp', __name__)

@podcast_bp.route('/podcasts', methods=['GET'])
def get_podcasts():
    category = request.args.get('category', 'all')
    include_episodes = request.args.get('include_episodes', '1').lower() not in {'0', 'false', 'no'}

    # Pagination parameters
    try:
        page = int(request.args.get('page', 1))
        per_page = int(request.args.get('per_page', 20))
    except ValueError:
        return jsonify({"error": "Invalid pagination parameters"}), 400
    per_page = max(1, min(per_page, 30))

    try:
        podcasts = fetch_top_podcasts(category=category, limit=30)
    except Exception as exc:
        return jsonify({'error': f'Failed to fetch live podcast charts: {exc}'}), 502

    if include_episodes:
        for podcast in podcasts:
            query = podcast.get('title') or podcast.get('author') or ''
            podcast['latest_episodes'] = get_latest_youtube_episodes(query, limit=3)

    start = (page - 1) * per_page
    end = start + per_page
    total = len(podcasts)
    page_podcasts = podcasts[start:end]

    return jsonify({
        "page": page,
        "per_page": per_page,
        "total": total,
        "podcasts": page_podcasts
    })
