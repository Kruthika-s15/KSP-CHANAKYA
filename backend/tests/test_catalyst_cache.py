import time

from app.catalyst.cache import LocalTTLCache


def test_set_and_get():
    cache = LocalTTLCache()
    cache.set("a", {"x": 1}, ttl_seconds=10)
    assert cache.get("a") == {"x": 1}


def test_miss_returns_none():
    cache = LocalTTLCache()
    assert cache.get("missing") is None


def test_expiry():
    cache = LocalTTLCache()
    cache.set("a", 1, ttl_seconds=0.01)
    time.sleep(0.05)
    assert cache.get("a") is None


def test_clear():
    cache = LocalTTLCache()
    cache.set("a", 1, ttl_seconds=10)
    cache.set("b", 2, ttl_seconds=10)
    cleared = cache.clear()
    assert cleared == 2
    assert cache.get("a") is None
