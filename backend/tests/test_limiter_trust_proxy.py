import importlib
import sys
from types import SimpleNamespace
from unittest.mock import Mock, patch

import pytest
from fastapi import Request


@pytest.fixture
def limiter(monkeypatch, tmp_path):
    """Hermetically import the limiter module.

    `limiter.py` builds a slowapi ``Limiter`` at module level, which makes
    starlette construct a ``Config`` that reads ``.env`` from the current
    working directory using the locale codec. On this Windows box the locale
    codec is cp1252 and the repo ``.env`` opens with UTF-8 box-drawing
    characters, so a plain ``import limiter`` raises UnicodeDecodeError.

    By chdir-ing into an empty tmp dir before importing we ensure starlette
    finds no ``.env`` file and the module imports cleanly regardless of the
    locale or the repo's secrets file.
    """
    monkeypatch.chdir(tmp_path)
    sys.modules.pop("limiter", None)
    return importlib.import_module("limiter")


def _make_request(xff_value):
    request = Mock(spec=Request)
    request.headers = {} if xff_value is None else {"X-Forwarded-For": xff_value}
    return request


def _fake_settings(trust_proxy):
    return SimpleNamespace(TRUST_PROXY=trust_proxy)


def test_get_real_ip_ignores_x_forwarded_for_when_trust_proxy_false(limiter):
    """When TRUST_PROXY=False, X-Forwarded-For must be ignored entirely and the
    socket peer address (get_remote_address) must be used."""
    with patch.object(limiter, "get_settings", return_value=_fake_settings(False)), \
         patch.object(limiter, "get_remote_address", return_value="192.0.2.1"):
        ip = limiter.get_real_ip(_make_request("203.0.113.1, 198.51.100.2"))

    assert ip == "192.0.2.1"


def test_get_real_ip_uses_last_value_when_trust_proxy_true(limiter):
    """When TRUST_PROXY=True, take the LAST value from X-Forwarded-For (a
    trusted proxy appends the client address)."""
    with patch.object(limiter, "get_settings", return_value=_fake_settings(True)):
        ip = limiter.get_real_ip(_make_request("203.0.113.1, 198.51.100.2"))

    assert ip == "198.51.100.2"


def test_get_real_ip_single_value_in_x_forwarded_for(limiter):
    """Single X-Forwarded-For value is used verbatim when TRUST_PROXY=True."""
    with patch.object(limiter, "get_settings", return_value=_fake_settings(True)):
        ip = limiter.get_real_ip(_make_request("203.0.113.1"))

    assert ip == "203.0.113.1"


def test_get_real_ip_falls_back_when_x_forwarded_for_missing(limiter):
    """Missing X-Forwarded-For header falls back to get_remote_address even
    when TRUST_PROXY=True."""
    with patch.object(limiter, "get_settings", return_value=_fake_settings(True)), \
         patch.object(limiter, "get_remote_address", return_value="192.0.2.1"):
        ip = limiter.get_real_ip(_make_request(None))

    assert ip == "192.0.2.1"


def test_get_real_ip_handles_whitespace_in_x_forwarded_for(limiter):
    """Values are trimmed so whitespace around commas does not leak into the
    returned client address."""
    with patch.object(limiter, "get_settings", return_value=_fake_settings(True)):
        ip = limiter.get_real_ip(_make_request(" 203.0.113.1 , 198.51.100.2 "))

    assert ip == "198.51.100.2"
