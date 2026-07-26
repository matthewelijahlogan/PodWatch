import os
import sys
import unittest
from unittest.mock import patch


BACKEND_DIR = os.path.dirname(os.path.dirname(__file__))
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

from app import app
from utils.cache import cache
from utils import youtube_lookup
from utils.youtube_lookup import get_latest_youtube_episodes


ATOM_FEED = b"""<?xml version="1.0" encoding="UTF-8"?>
<feed xmlns="http://www.w3.org/2005/Atom"
      xmlns:yt="http://www.youtube.com/xml/schemas/2015">
  <title>Uploads from Example</title>
  <entry>
    <yt:videoId>abcdefghijk</yt:videoId>
    <yt:channelId>UCzQUP1qoWDoEbmsQxvdjxgQ</yt:channelId>
    <title>Joe Rogan Experience #999 - Example full episode</title>
    <published>2026-07-25T12:00:00+00:00</published>
    <author><name>Example Channel</name></author>
    <link rel="alternate" href="https://www.youtube.com/watch?v=abcdefghijk"/>
  </entry>
</feed>"""


class FakeResponse:
    content = ATOM_FEED

    def raise_for_status(self):
        return None


class PlatformTests(unittest.TestCase):
    def setUp(self):
        app.config.update(TESTING=True)
        self.client = app.test_client()
        cache._items.clear()
        self.youtube_key = youtube_lookup.YOUTUBE_API_KEY
        youtube_lookup.YOUTUBE_API_KEY = ""

    def tearDown(self):
        youtube_lookup.YOUTUBE_API_KEY = self.youtube_key

    def test_health_exposes_service_and_youtube_mode(self):
        response = self.client.get("/api/v1/health")
        self.assertEqual(response.status_code, 200)
        payload = response.get_json()
        self.assertEqual(payload["service"], "podwatch")
        self.assertEqual(payload["youtube"]["mode"], "channel_feeds")
        self.assertEqual(payload["youtube"]["search_quota_used_per_guide_request"], 0)

    def test_featured_legacy_route_is_served_by_unified_app(self):
        response = self.client.get("/api/featured-shows")
        self.assertEqual(response.status_code, 200)
        self.assertGreaterEqual(len(response.get_json()), 6)

    @patch("utils.youtube_lookup.requests.get", return_value=FakeResponse())
    def test_known_query_uses_channel_feed(self, mocked_get):
        episodes = get_latest_youtube_episodes("Joe Rogan Experience", limit=3)
        self.assertEqual(episodes[0]["video_id"], "abcdefghijk")
        self.assertEqual(episodes[0]["playback"]["kind"], "youtube")
        self.assertEqual(mocked_get.call_args.kwargs["params"]["channel_id"], "UCzQUP1qoWDoEbmsQxvdjxgQ")

    @patch(
        "routes.platform.get_channel_episodes",
        return_value=(
            [{"video_id": "abcdefghijk", "title": "Example", "url": "https://youtube.test"}],
            "miss",
        ),
    )
    def test_guide_returns_all_channels_in_one_response(self, mocked_get):
        response = self.client.get("/api/v1/guide?episodes_per_show=3")
        self.assertEqual(response.status_code, 200)
        payload = response.get_json()
        self.assertEqual(payload["meta"]["show_count"], 6)
        self.assertEqual(payload["meta"]["episode_count"], 6)
        self.assertFalse(payload["meta"]["partial"])
        self.assertEqual(mocked_get.call_count, 6)

    def test_unknown_youtube_query_does_not_scrape_or_search(self):
        with patch("utils.youtube_lookup.requests.get") as mocked_get:
            episodes = get_latest_youtube_episodes("an unmapped podcast")
        self.assertEqual(episodes, [])
        mocked_get.assert_not_called()


if __name__ == "__main__":
    unittest.main()
