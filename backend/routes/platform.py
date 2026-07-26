from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime, timezone

from flask import Blueprint, jsonify, request

from utils.show_catalog import get_featured_show, get_featured_shows
from utils.youtube_lookup import get_channel_episodes, youtube_status


platform_bp = Blueprint("platform", __name__)


def _bounded_int(name, default, minimum=1, maximum=20):
    try:
        value = int(request.args.get(name, default))
    except (TypeError, ValueError):
        value = default
    return max(minimum, min(value, maximum))


def _show_with_links(show):
    item = dict(show)
    item["links"] = {
        "self": f"/api/v1/shows/{show['id']}",
        "episodes": f"/api/v1/shows/{show['id']}/episodes",
    }
    return item


@platform_bp.get("/api/v1")
def service_document():
    return jsonify(
        {
            "name": "PodWatch API",
            "version": "1",
            "endpoints": {
                "health": "/api/v1/health",
                "guide": "/api/v1/guide",
                "shows": "/api/v1/shows",
                "podcasts": "/api/podcasts",
                "podcast_audio": "/api/podcast-episodes?q={title}",
            },
        }
    )


@platform_bp.get("/api/v1/health")
def platform_health():
    return jsonify(
        {
            "status": "ok",
            "service": "podwatch",
            "version": "1",
            "youtube": youtube_status(),
        }
    )


@platform_bp.get("/api/v1/shows")
@platform_bp.get("/api/featured-shows")
def featured_shows():
    return jsonify([_show_with_links(show) for show in get_featured_shows()])


@platform_bp.get("/api/v1/shows/<show_id>")
@platform_bp.get("/api/featured-shows/<show_id>")
def featured_show(show_id):
    show = get_featured_show(show_id)
    if not show:
        return jsonify({"error": {"code": "show_not_found", "message": "Show not found"}}), 404
    return jsonify(_show_with_links(show))


@platform_bp.get("/api/v1/shows/<show_id>/episodes")
def show_episodes(show_id):
    show = get_featured_show(show_id)
    if not show:
        return jsonify({"error": {"code": "show_not_found", "message": "Show not found"}}), 404

    limit = _bounded_int("limit", 10)
    try:
        episodes, cache_state = get_channel_episodes(
            show["youtube_channel_id"],
            limit,
            show.get("episode_title_pattern"),
        )
    except Exception as exc:
        return (
            jsonify(
                {
                    "show": _show_with_links(show),
                    "episodes": [],
                    "error": {
                        "code": "upstream_unavailable",
                        "message": "The episode feed is temporarily unavailable.",
                        "detail": str(exc),
                    },
                }
            ),
            502,
        )

    response = jsonify(
        {
            "show": _show_with_links(show),
            "episodes": episodes,
            "meta": {"count": len(episodes), "cache": cache_state},
        }
    )
    response.headers["Cache-Control"] = "public, max-age=300, stale-if-error=86400"
    return response


@platform_bp.get("/api/v1/guide")
def guide():
    """Return the complete on-demand guide in one bounded request."""
    limit = _bounded_int("episodes_per_show", 5, maximum=10)
    category = request.args.get("category", "all").strip().lower()
    shows = [
        show
        for show in get_featured_shows()
        if category == "all" or show.get("category", "").lower() == category
    ]

    results = {}
    errors = []
    with ThreadPoolExecutor(max_workers=min(6, max(1, len(shows)))) as executor:
        pending = {
            executor.submit(
                get_channel_episodes,
                show["youtube_channel_id"],
                limit,
                show.get("episode_title_pattern"),
            ): show
            for show in shows
        }
        for future in as_completed(pending):
            show = pending[future]
            try:
                episodes, cache_state = future.result()
            except Exception:
                episodes, cache_state = [], "error"
                errors.append(
                    {
                        "show_id": show["id"],
                        "code": "upstream_unavailable",
                        "message": "Episode feed temporarily unavailable",
                    }
                )
            results[show["id"]] = {
                "show": _show_with_links(show),
                "episodes": episodes,
                "cache": cache_state,
            }

    channels = [results[show["id"]] for show in shows]
    response = jsonify(
        {
            "generated_at": datetime.now(timezone.utc).isoformat(),
            "category": category,
            "channels": channels,
            "errors": errors,
            "meta": {
                "show_count": len(channels),
                "episode_count": sum(len(row["episodes"]) for row in channels),
                "partial": bool(errors),
            },
        }
    )
    response.headers["Cache-Control"] = "public, max-age=300, stale-if-error=86400"
    return response
