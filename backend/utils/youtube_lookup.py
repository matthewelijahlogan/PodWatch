import os
import re
from datetime import datetime, timezone

import feedparser
import requests

from utils.cache import cache
from utils.show_catalog import match_featured_show


YOUTUBE_API_KEY = os.environ.get("YOUTUBE_API_KEY", "").strip()
YOUTUBE_API_URL = "https://www.googleapis.com/youtube/v3"
YOUTUBE_FEED_URL = "https://www.youtube.com/feeds/videos.xml"
REQUEST_TIMEOUT_SECONDS = 12
CACHE_TTL_SECONDS = 15 * 60
MIN_EPISODE_SECONDS = 15 * 60
EXCLUDED_TITLE_TERMS = ("#shorts", " short ", " clip ", " highlight ", " trailer ", " teaser ")


def _thumbnail(video_id):
    return f"https://i.ytimg.com/vi/{video_id}/hqdefault.jpg"


def _episode(video_id, title, published_at="", channel_id="", channel_title=""):
    return {
        "id": video_id,
        "video_id": video_id,
        "title": title or "Untitled episode",
        "url": f"https://www.youtube.com/watch?v={video_id}",
        "embed_url": f"https://www.youtube-nocookie.com/embed/{video_id}",
        "thumbnail": _thumbnail(video_id),
        "published_at": published_at or "",
        "channel_id": channel_id or "",
        "channel_title": channel_title or "",
        "source": "youtube",
        "duration_seconds": None,
        "embeddable": None,
        # Roku cannot legally/reliably stream a YouTube watch page as a media URL.
        "playback": {"kind": "youtube", "video_id": video_id},
    }


def _looks_like_episode(episode):
    padded = f" {(episode.get('title') or '').lower()} "
    return not any(term in padded for term in EXCLUDED_TITLE_TERMS)


def _duration_seconds(iso_duration):
    match = re.fullmatch(
        r"P(?:(?P<days>\d+)D)?T(?:(?P<hours>\d+)H)?(?:(?P<minutes>\d+)M)?(?:(?P<seconds>\d+)S)?",
        iso_duration or "",
    )
    if not match:
        return None
    values = {name: int(value or 0) for name, value in match.groupdict().items()}
    return (
        values["days"] * 86400
        + values["hours"] * 3600
        + values["minutes"] * 60
        + values["seconds"]
    )


def _verify_with_api(episodes):
    if not YOUTUBE_API_KEY or not episodes:
        return episodes

    response = requests.get(
        f"{YOUTUBE_API_URL}/videos",
        params={
            "part": "contentDetails,status",
            "id": ",".join(episode["video_id"] for episode in episodes),
            "key": YOUTUBE_API_KEY,
        },
        timeout=REQUEST_TIMEOUT_SECONDS,
    )
    response.raise_for_status()
    details = {item["id"]: item for item in response.json().get("items", [])}

    verified = []
    for episode in episodes:
        item = details.get(episode["video_id"])
        if not item:
            continue
        seconds = _duration_seconds(item.get("contentDetails", {}).get("duration"))
        status = item.get("status", {})
        embeddable = status.get("embeddable", False)
        if seconds is not None and seconds < MIN_EPISODE_SECONDS:
            continue
        if status.get("privacyStatus") != "public":
            continue
        episode["duration_seconds"] = seconds
        episode["embeddable"] = embeddable
        verified.append(episode)
    return verified


def _latest_from_feed(channel_id, limit):
    response = requests.get(
        YOUTUBE_FEED_URL,
        params={"channel_id": channel_id},
        timeout=REQUEST_TIMEOUT_SECONDS,
        headers={"User-Agent": "PodWatch/1.0"},
    )
    response.raise_for_status()
    parsed = feedparser.parse(response.content)
    if getattr(parsed, "bozo", False) and not parsed.entries:
        raise RuntimeError("YouTube returned an invalid uploads feed")

    episodes = []
    for entry in parsed.entries[:limit]:
        video_id = entry.get("yt_videoid") or entry.get("youtube_videoid")
        if not video_id:
            link = entry.get("link", "")
            video_id = link.split("v=", 1)[-1].split("&", 1)[0] if "v=" in link else ""
        if not video_id:
            continue
        episodes.append(
            _episode(
                video_id,
                entry.get("title", ""),
                entry.get("published", ""),
                channel_id,
                entry.get("author", ""),
            )
        )
    return episodes


def _uploads_playlist_id(channel_id):
    response = requests.get(
        f"{YOUTUBE_API_URL}/channels",
        params={
            "part": "contentDetails",
            "id": channel_id,
            "key": YOUTUBE_API_KEY,
        },
        timeout=REQUEST_TIMEOUT_SECONDS,
    )
    response.raise_for_status()
    items = response.json().get("items", [])
    if not items:
        raise RuntimeError("YouTube channel was not found")
    return items[0]["contentDetails"]["relatedPlaylists"]["uploads"]


def _latest_from_api(channel_id, limit):
    playlist_id = _uploads_playlist_id(channel_id)
    response = requests.get(
        f"{YOUTUBE_API_URL}/playlistItems",
        params={
            "part": "snippet,contentDetails",
            "playlistId": playlist_id,
            "maxResults": min(limit, 20),
            "key": YOUTUBE_API_KEY,
        },
        timeout=REQUEST_TIMEOUT_SECONDS,
    )
    response.raise_for_status()

    episodes = []
    for item in response.json().get("items", []):
        snippet = item.get("snippet", {})
        video_id = item.get("contentDetails", {}).get("videoId")
        title = snippet.get("title", "")
        if not video_id or title in {"Private video", "Deleted video"}:
            continue
        episodes.append(
            _episode(
                video_id,
                title,
                snippet.get("publishedAt", ""),
                channel_id,
                snippet.get("channelTitle", ""),
            )
        )
    return episodes


def get_channel_episodes(channel_id, limit=3, title_pattern=None):
    channel_id = (channel_id or "").strip()
    limit = max(1, min(int(limit or 3), 20))
    if not channel_id:
        return [], "unmapped"

    def load():
        # The public Atom feed costs no API quota and is the default. The Data
        # API is a fallback for channels whose feed is temporarily unavailable.
        try:
            candidates = _latest_from_feed(channel_id, max(15, limit))
        except Exception:
            if not YOUTUBE_API_KEY:
                raise
            candidates = _latest_from_api(channel_id, max(15, limit))

        candidates = [episode for episode in candidates if _looks_like_episode(episode)]
        metadata_verified = False
        if YOUTUBE_API_KEY:
            try:
                candidates = _verify_with_api(candidates)
                metadata_verified = True
            except requests.RequestException:
                # Metadata verification is an enhancement; a transient quota or
                # API failure should not erase a healthy public feed.
                pass
        if title_pattern and not metadata_verified:
            candidates = [
                episode
                for episode in candidates
                if re.search(title_pattern, episode.get("title", ""), flags=re.IGNORECASE)
            ]
        return candidates[:limit]

    return cache.get_or_load(
        f"youtube:channel:{channel_id}:{limit}:{title_pattern or '*'}",
        load,
        CACHE_TTL_SECONDS,
    )


def get_latest_youtube_episodes(query, limit=3, channel_id=None):
    show = match_featured_show(query)
    resolved_channel_id = channel_id or (show or {}).get("youtube_channel_id")
    episodes, _ = get_channel_episodes(
        resolved_channel_id,
        limit=limit,
        title_pattern=(show or {}).get("episode_title_pattern"),
    )
    return episodes


def youtube_status():
    return {
        "mode": "channel_feeds",
        "api_key_configured": bool(YOUTUBE_API_KEY),
        "search_quota_used_per_guide_request": 0,
        "checked_at": datetime.now(timezone.utc).isoformat(),
    }
