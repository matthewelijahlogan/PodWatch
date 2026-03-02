from flask import Blueprint, jsonify, request

from utils.reviews_store import add_review, list_reviews

reviews_bp = Blueprint('reviews', __name__)


def _valid_kind(value):
    return value in {'podcast', 'episode'}


def _summary_for(kind, target_id):
    entries = list_reviews(kind=kind, target_id=target_id)
    count = len(entries)
    average = round(sum(item['rating'] for item in entries) / count, 2) if count else 0

    comments = []
    for item in reversed(entries):
        if item.get('comment'):
            comments.append(
                {
                    'author': item.get('author') or 'Anonymous',
                    'comment': item.get('comment') or '',
                    'rating': item.get('rating') or 0,
                    'created_at': item.get('created_at') or '',
                }
            )
        if len(comments) >= 20:
            break

    return {
        'kind': kind,
        'target_id': target_id,
        'average_rating': average,
        'review_count': count,
        'comments': comments,
    }


@reviews_bp.route('/api/reviews', methods=['POST'])
def create_review():
    payload = request.get_json(silent=True) or {}
    kind = (payload.get('kind') or '').strip().lower()
    target_id = (payload.get('target_id') or '').strip()
    target_title = (payload.get('target_title') or '').strip()
    comment = (payload.get('comment') or '').strip()
    author = (payload.get('author') or '').strip()
    rating = payload.get('rating')

    if not _valid_kind(kind):
        return jsonify({'error': 'kind must be podcast or episode'}), 400
    if not target_id:
        return jsonify({'error': 'target_id is required'}), 400
    try:
        rating = int(rating)
    except (TypeError, ValueError):
        return jsonify({'error': 'rating must be an integer from 1 to 5'}), 400
    if rating < 1 or rating > 5:
        return jsonify({'error': 'rating must be between 1 and 5'}), 400
    if len(comment) > 600:
        return jsonify({'error': 'comment must be 600 characters or fewer'}), 400
    if len(author) > 40:
        return jsonify({'error': 'author must be 40 characters or fewer'}), 400

    entry = add_review(
        kind=kind,
        target_id=target_id,
        rating=rating,
        target_title=target_title,
        comment=comment,
        author=author,
    )
    return jsonify({'ok': True, 'review': entry, 'summary': _summary_for(kind, target_id)}), 201


@reviews_bp.route('/api/reviews/summary', methods=['GET'])
def review_summary():
    kind = (request.args.get('kind') or '').strip().lower()
    target_id = (request.args.get('target_id') or '').strip()
    if not _valid_kind(kind):
        return jsonify({'error': 'kind must be podcast or episode'}), 400
    if not target_id:
        return jsonify({'error': 'target_id is required'}), 400
    return jsonify(_summary_for(kind, target_id))


@reviews_bp.route('/api/reviews/summaries', methods=['GET'])
def review_summaries():
    kind = (request.args.get('kind') or '').strip().lower()
    if not _valid_kind(kind):
        return jsonify({'error': 'kind must be podcast or episode'}), 400

    ids = [
        item.strip()
        for item in (request.args.get('target_ids') or '').split(',')
        if item.strip()
    ]
    if not ids:
        return jsonify({'items': {}})

    unique_ids = list(dict.fromkeys(ids))
    return jsonify({'items': {target_id: _summary_for(kind, target_id) for target_id in unique_ids}})

