# PodWatch

PodWatch is a shared podcast guide service plus web and Android clients. The
Roku source lives in the sibling `PodWatchRoku` folder and uses the same API.

## What changed

The deployable Flask app is now the single backend for all three clients.

- `GET /api/v1/guide` returns every configured show and its recent official
  YouTube uploads in one request.
- YouTube lookup uses official channel upload feeds. It does not scrape search
  result HTML, proxy video bytes, or spend YouTube search quota.
- Apple podcast charts and podcast RSS audio remain separate, appropriate data
  sources.
- In-memory stale caching and a checked-in Apple chart snapshot keep the guide
  useful through upstream failures and Render restarts.
- Legacy endpoints remain available for the existing clients.

## Local run

```powershell
cd backend
python -m pip install -r requirements.txt
python app.py
```

Then open `http://localhost:5000` or:

- `http://localhost:5000/api/v1`
- `http://localhost:5000/api/v1/health`
- `http://localhost:5000/api/v1/guide`

Run verification from the `PodWatch` folder:

```powershell
python -m unittest discover -s backend/tests -t backend -v
./scripts/check_render_ready.ps1
```

## Render free deployment

The Blueprint in `render.yaml` creates one `free` Python web service named
`podwatch`.

1. Put `PodWatchProject/PodWatch` at the root of its own GitHub repository.
2. In Render, choose **New > Blueprint** and connect that repository.
3. Apply the detected `render.yaml`.
4. Verify `https://podwatch.onrender.com/api/v1/health`.

`YOUTUBE_API_KEY` is optional. Public channel feeds are the primary source; the
key is only a fallback for feed failures.

Render free services sleep after idle time and have an ephemeral filesystem.
The API therefore treats local caches as disposable. The guide needs no
database. User reviews written to the current JSON review store are suitable
for local demos only and will not survive a Render restart; use a durable
database before treating reviews as production data.

## API contract

### Guide

`GET /api/v1/guide?category=all&episodes_per_show=5`

```json
{
  "generated_at": "2026-07-26T12:00:00+00:00",
  "channels": [
    {
      "show": {
        "id": "jre",
        "title": "The Joe Rogan Experience",
        "youtube_channel_id": "UCzQUP1qoWDoEbmsQxvdjxgQ"
      },
      "episodes": [
        {
          "video_id": "abcdefghijk",
          "title": "Episode title",
          "url": "https://www.youtube.com/watch?v=abcdefghijk",
          "embed_url": "https://www.youtube-nocookie.com/embed/abcdefghijk",
          "thumbnail": "https://i.ytimg.com/vi/abcdefghijk/hqdefault.jpg",
          "playback": { "kind": "youtube", "video_id": "abcdefghijk" }
        }
      ]
    }
  ],
  "errors": [],
  "meta": { "show_count": 6, "episode_count": 30, "partial": false }
}
```

A partial upstream failure does not fail the entire guide. The affected show is
listed in `errors`, and stale data is returned when available.

### Other stable endpoints

- `GET /api/v1/shows`
- `GET /api/v1/shows/{show_id}`
- `GET /api/v1/shows/{show_id}/episodes`
- `GET /api/podcasts?page=1&per_page=20&category=all`
- `GET /api/podcast-episodes?q=Radiolab&limit=15`
- `GET /api/categories`
- `GET /api/editors-picks`

## YouTube playback boundary

The service returns YouTube IDs and official URLs; it intentionally does not
extract or relay YouTube media streams.

- Web: use `embed_url` in an iframe.
- Android: open the official watch URL or use an official YouTube player
  integration.
- Roku: display guide metadata and thumbnails, then hand off through a supported
  YouTube/Roku integration. A YouTube watch page is not a direct media stream
  that a Roku `Video` node can play.

This boundary is what makes the catalog reliable and keeps the backend from
breaking whenever YouTube changes its web player.
