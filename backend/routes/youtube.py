from flask import Blueprint, request, jsonify

from utils.youtube_lookup import get_latest_youtube_episodes

youtube_bp = Blueprint('youtube', __name__)


@youtube_bp.route('/youtube/latest', methods=['GET'])
def get_latest_episodes():
    query = request.args.get('q')
    if not query:
        return jsonify({'error': 'Missing search query'}), 400

    try:
        limit = int(request.args.get('limit', 3))
    except (TypeError, ValueError):
        limit = 3
    limit = max(1, min(limit, 20))

    channel_id = request.args.get('channel_id')
    return jsonify(get_latest_youtube_episodes(query, limit=limit, channel_id=channel_id))


@youtube_bp.route('/youtube/top', methods=['GET'])
def get_top_episodes():
    query = request.args.get('q')
    if not query:
        return jsonify({'error': 'Missing search query'}), 400

    # "Top" is retained for old clients. A channel's recent official uploads are
    # deterministic and quota-free; arbitrary popularity search was unreliable.
    channel_id = request.args.get('channel_id')
    return jsonify(get_latest_youtube_episodes(query, limit=3, channel_id=channel_id))
