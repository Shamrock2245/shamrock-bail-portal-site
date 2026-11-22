"""Tests for IndexNow integration in scripts/blog/publish_due_posts.py."""
from __future__ import annotations

import io
import json
import sys
import urllib.error
from pathlib import Path
from unittest.mock import patch

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts" / "blog"))

import publish_due_posts  # noqa: E402


class _FakeResp:
    def __init__(self, status: int):
        self.status = status

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc, tb):
        return False


def test_resolve_post_public_url_from_publish_response():
    url = publish_due_posts.resolve_post_public_url(
        {"draft_id": "d1"},
        publish_res={"post": {"slug": "lee-county-bail-guide"}},
    )
    assert url == "https://www.shamrockbailbonds.biz/post/lee-county-bail-guide"


def test_resolve_post_public_url_from_get_lookup():
    post = {"draft_id": "d2", "post_id": "p2"}
    with patch.object(
        publish_due_posts,
        "http_json",
        return_value={"post": {"slug": "collier-county-bail-guide"}},
    ) as mock_http:
        url = publish_due_posts.resolve_post_public_url(post, publish_res={}, token="tok")
    assert url == "https://www.shamrockbailbonds.biz/post/collier-county-bail-guide"
    mock_http.assert_called_once()


def test_build_indexnow_urls_dedupes_and_appends_hubs():
    urls = publish_due_posts.build_indexnow_urls([
        "https://www.shamrockbailbonds.biz/post/a",
        "https://www.shamrockbailbonds.biz/post/a",
        "https://other.example.com/bad",
        "https://www.shamrockbailbonds.biz/post/b",
    ])
    assert urls == [
        "https://www.shamrockbailbonds.biz/post/a",
        "https://www.shamrockbailbonds.biz/post/b",
        "https://www.shamrockbailbonds.biz/blog",
        "https://www.shamrockbailbonds.biz/_functions/llmsTxt",
    ]


def test_ping_indexnow_200_and_202():
    captured = {}

    def fake_urlopen(req, timeout=10):
        captured["url"] = req.full_url
        captured["method"] = req.get_method()
        captured["body"] = json.loads(req.data.decode("utf-8"))
        return _FakeResp(202)

    res = publish_due_posts.ping_indexnow(
        ["https://www.shamrockbailbonds.biz/post/a"],
        urlopen_fn=fake_urlopen,
    )
    assert res["ok"] is True
    assert res["status"] == 202
    assert captured["url"] == publish_due_posts.INDEXNOW_ENDPOINT
    assert captured["method"] == "POST"
    assert captured["body"]["host"] == "www.shamrockbailbonds.biz"
    assert captured["body"]["key"] == publish_due_posts.INDEXNOW_KEY
    assert captured["body"]["keyLocation"] == publish_due_posts.INDEXNOW_KEY_LOCATION


def test_ping_indexnow_soft_fails_on_http_and_network_errors():
    def http_fail(req, timeout=10):
        raise urllib.error.HTTPError(
            req.full_url, 429, "Too Many Requests", {}, io.BytesIO(b"rate limit")
        )

    res1 = publish_due_posts.ping_indexnow(
        ["https://www.shamrockbailbonds.biz/post/a"],
        urlopen_fn=http_fail,
    )
    assert res1["ok"] is False
    assert res1["status"] == 429

    def net_fail(req, timeout=10):
        raise OSError("network unreachable")

    res2 = publish_due_posts.ping_indexnow(
        ["https://www.shamrockbailbonds.biz/post/a"],
        urlopen_fn=net_fail,
    )
    assert res2["ok"] is False
    assert "unreachable" in res2["error"]
