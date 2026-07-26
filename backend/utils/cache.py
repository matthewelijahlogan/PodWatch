import threading
import time


class StaleCache:
    """Small process-local cache with stale-if-error support.

    Render's free filesystem is ephemeral, so the service must not depend on a
    local database. Cached values disappear safely on a restart and are rebuilt
    from Apple/YouTube feeds.
    """

    def __init__(self):
        self._items = {}
        self._lock = threading.RLock()

    def get(self, key, allow_stale=False):
        with self._lock:
            item = self._items.get(key)
            if not item:
                return None
            if not allow_stale and item["expires_at"] <= time.time():
                return None
            return item["value"]

    def set(self, key, value, ttl_seconds):
        with self._lock:
            self._items[key] = {
                "value": value,
                "expires_at": time.time() + ttl_seconds,
            }
        return value

    def get_or_load(self, key, loader, ttl_seconds):
        fresh = self.get(key)
        if fresh is not None:
            return fresh, "fresh"

        try:
            value = loader()
        except Exception:
            stale = self.get(key, allow_stale=True)
            if stale is not None:
                return stale, "stale"
            raise

        return self.set(key, value, ttl_seconds), "miss"


cache = StaleCache()
