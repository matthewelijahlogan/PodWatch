# PodWatch Roku

SceneGraph Roku client for the shared PodWatch API.

The source is preconfigured for:

`https://podwatch.onrender.com`

TLS certificates and network timeouts are configured in `ApiTask.brs`.

## Sideload

1. Deploy the sibling `PodWatch` service to Render.
2. Zip the **contents** of `frontend/`, not the parent directory.
3. Open your Roku developer page at `http://<ROKU_IP>`.
4. Upload and install the zip.

For local backend development, temporarily change `m.baseUrl` in
`frontend/components/HomeScene.brs` to your computer's LAN URL.

## Playback

The Roku guide loads show metadata, official episode titles, video IDs, and
thumbnails from the PodWatch service. YouTube watch pages are not direct media
files, so they cannot be assigned to a SceneGraph `Video` node. The current Roku
UI provides discovery and previews; full playback requires a supported
YouTube/Roku handoff rather than server-side stream extraction.

## API endpoints

- `GET /api/health`
- `GET /api/podcasts`
- `GET /api/featured-shows`
- `GET /api/featured-shows/{id}`
- `GET /api/youtube/latest?q={known show}`
- `GET /api/youtube/top?q={known show}`

The legacy shapes above are served by the same backend as `/api/v1/guide`.
