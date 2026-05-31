"""Tests for DataCache play-by-play dict helpers."""

import time

from app.services.data_cache import DataCache


def test_playbyplay_cache_set_and_get():
    cache = DataCache()
    cache._set_playbyplay("game1", object())
    assert cache._playbyplay_cache.get("game1") is not None


def test_playbyplay_cache_remove():
    cache = DataCache()
    cache._set_playbyplay("game1", object())
    cache._remove_playbyplay("game1")
    assert cache._playbyplay_cache.get("game1") is None


def test_clear_old_playbyplay_entries():
    cache = DataCache()
    cache._set_playbyplay("game1", object())
    cache._playbyplay_timestamps["game1"] = time.time() - 100000
    removed = cache._clear_old_playbyplay(max_age_seconds=1)
    assert removed == 1
    assert cache._playbyplay_cache.get("game1") is None
