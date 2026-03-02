import requests


CATEGORY_MAP = {
    'all': None,
    'comedy': '1303',
    'news': '1489',
    'business': '1321',
    'truecrime': '1488',
    'sports': '1545',
    'education': '1304',
    'society': '1324',
}


def get_category_list():
    return [
        {'id': category_id, 'name': category_id.title() if category_id != 'truecrime' else 'True Crime'}
        for category_id in CATEGORY_MAP.keys()
    ]


def _safe_get(obj, keys, default=''):
    current = obj
    for key in keys:
        if not isinstance(current, dict):
            return default
        current = current.get(key)
    if current is None:
        return default
    return current


def _normalize_from_marketing(result, rank, category_name):
    genres = result.get('genres') or []
    genre_name = category_name
    if genres:
        first = genres[0]
        if isinstance(first, dict):
            genre_name = first.get('name') or category_name

    return {
        'id': result.get('id', ''),
        'rank': rank,
        'title': result.get('name', ''),
        'author': result.get('artistName', ''),
        'image': result.get('artworkUrl100', ''),
        'description': '',
        'category': genre_name,
        'url': result.get('url', ''),
    }


def _normalize_from_itunes(entry, rank, category_name):
    images = entry.get('im:image') or []
    image = ''
    if images:
        image = images[-1].get('label', '')

    return {
        'id': _safe_get(entry, ['id', 'attributes', 'im:id']),
        'rank': rank,
        'title': _safe_get(entry, ['im:name', 'label']),
        'author': _safe_get(entry, ['im:artist', 'label']),
        'image': image,
        'description': _safe_get(entry, ['summary', 'label']),
        'category': category_name,
        'url': _safe_get(entry, ['link', 'attributes', 'href']),
    }


def fetch_top_podcasts(category='all', limit=30, country='us'):
    category = (category or 'all').strip().lower()
    if category not in CATEGORY_MAP:
        category = 'all'

    if category == 'all':
        url = f'https://rss.applemarketingtools.com/api/v2/{country}/podcasts/top/{limit}/podcasts.json'
        response = requests.get(url, timeout=20)
        response.raise_for_status()
        payload = response.json()
        results = payload.get('feed', {}).get('results', [])
        return [_normalize_from_marketing(result, idx + 1, 'All') for idx, result in enumerate(results[:limit])]

    genre_id = CATEGORY_MAP[category]
    url = f'https://itunes.apple.com/{country}/rss/toppodcasts/limit={limit}/genre={genre_id}/json'
    response = requests.get(url, timeout=20)
    response.raise_for_status()
    payload = response.json()
    entries = payload.get('feed', {}).get('entry', [])
    category_name = next((item['name'] for item in get_category_list() if item['id'] == category), category.title())
    return [_normalize_from_itunes(entry, idx + 1, category_name) for idx, entry in enumerate(entries[:limit])]

