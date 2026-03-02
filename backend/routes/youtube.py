from flask import Blueprint, request, jsonify

from utils.youtube_lookup import get_latest_youtube_episodes

youtube_bp = Blueprint('youtube', __name__)


@youtube_bp.route('/youtube/latest', methods=['GET'])
def get_latest_episodes():
    query = request.args.get('q')
    if not query:
        return jsonify({'error': 'Missing search query'}), 400

    return jsonify(get_latest_youtube_episodes(query, limit=3))


@youtube_bp.route('/youtube/top', methods=['GET'])
def get_top_episodes():
    query = request.args.get('q')
    if not query:
        return jsonify({'error': 'Missing search query'}), 400

    # Reuse latest fallback behavior so this endpoint still returns data without API keys.
    return jsonify(get_latest_youtube_episodes(query, limit=3))
