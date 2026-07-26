import json
import os


DATA_FILE = os.path.join(os.path.dirname(__file__), "..", "data", "featured_shows.json")


def get_featured_shows():
    with open(DATA_FILE, "r", encoding="utf-8") as handle:
        return json.load(handle)


def get_featured_show(show_id):
    normalized = (show_id or "").strip().lower()
    return next(
        (show for show in get_featured_shows() if show.get("id", "").lower() == normalized),
        None,
    )


def match_featured_show(query):
    normalized = " ".join((query or "").lower().split())
    if not normalized:
        return None

    for show in get_featured_shows():
        candidates = [
            show.get("id"),
            show.get("title"),
            show.get("short_title"),
            show.get("host"),
            show.get("youtube_query"),
            *(show.get("aliases") or []),
        ]
        if any(
            candidate
            and (
                normalized == " ".join(candidate.lower().split())
                or " ".join(candidate.lower().split()) in normalized
            )
            for candidate in candidates
        ):
            return show
    return None
