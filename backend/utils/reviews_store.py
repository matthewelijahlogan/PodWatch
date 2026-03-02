import json
import os
import threading
from datetime import datetime, timezone


_LOCK = threading.Lock()
_DATA_DIR = os.path.join(os.path.dirname(__file__), '..', 'data')
_STORE_PATH = os.path.join(_DATA_DIR, 'reviews.json')


def _ensure_store():
    os.makedirs(_DATA_DIR, exist_ok=True)
    if not os.path.exists(_STORE_PATH):
        with open(_STORE_PATH, 'w', encoding='utf-8') as f:
            json.dump([], f)


def _load_all():
    _ensure_store()
    with open(_STORE_PATH, 'r', encoding='utf-8') as f:
        payload = json.load(f)
    if isinstance(payload, list):
        return payload
    return []


def _save_all(items):
    with open(_STORE_PATH, 'w', encoding='utf-8') as f:
        json.dump(items, f, ensure_ascii=False, indent=2)


def list_reviews(kind=None, target_id=None):
    with _LOCK:
        items = _load_all()

    if kind:
        items = [item for item in items if item.get('kind') == kind]
    if target_id:
        items = [item for item in items if item.get('target_id') == target_id]
    return items


def add_review(kind, target_id, rating, target_title='', comment='', author=''):
    now = datetime.now(timezone.utc).isoformat()
    entry = {
        'kind': kind,
        'target_id': target_id,
        'target_title': (target_title or '').strip(),
        'rating': int(rating),
        'comment': (comment or '').strip(),
        'author': (author or '').strip() or 'Anonymous',
        'created_at': now,
    }

    with _LOCK:
        items = _load_all()
        items.append(entry)
        _save_all(items)

    return entry

