import socket
from unittest.mock import patch
import httpx
import pytest
from app.core.security import safe_fetch, validate_url, UnsafeUrlError

PUBLIC = [(socket.AF_INET, socket.SOCK_STREAM, 0, "", ("93.184.216.34", 443))]


@pytest.mark.parametrize("url", [
    "http://127.0.0.1", "http://10.0.0.1", "http://192.168.1.1", "http://172.16.0.1",
    "http://100.64.0.1", "http://169.254.169.254", "http://0.0.0.0", "http://224.0.0.1",
    "http://[::1]", "http://[fe80::1]", "http://[fc00::1]", "http://[::ffff:127.0.0.1]",
    "http://[::ffff:169.254.169.254]", "http://[ff02::1]", "http://localhost:8000",
    "https://localhost.localdomain", "http://localhost.", "http://", "file:///etc/passwd",
    "ftp://example.com", "gopher://example.com", "http://user:password@example.com",
    "http://example.com\r\nHost:localhost", "http://example.com:bad",
])
def test_unsafe_urls_are_rejected(url):
    with pytest.raises(UnsafeUrlError):
        validate_url(url)


def test_public_urls_and_custom_ports_supported():
    with patch("app.core.security.socket.getaddrinfo", return_value=PUBLIC):
        for url in ["https://example.com", "http://example.com:8080/path?q=hello"]:
            assert validate_url(url) == url


def test_mixed_public_private_dns_rejected():
    records = PUBLIC + [(socket.AF_INET, socket.SOCK_STREAM, 0, "", ("127.0.0.1", 443))]
    with patch("app.core.security.socket.getaddrinfo", return_value=records):
        with pytest.raises(UnsafeUrlError):
            validate_url("https://example.com")


@pytest.mark.asyncio
async def test_dns_pin_preserves_host_and_tls_identity():
    def handler(request):
        assert request.url.host == "93.184.216.34"
        assert request.headers["host"] == "example.com"
        assert request.extensions["sni_hostname"] == "example.com"
        return httpx.Response(200, content=b"hello")
    with patch("app.core.security.socket.getaddrinfo", return_value=PUBLIC) as dns:
        response = await safe_fetch("https://example.com", transport=httpx.MockTransport(handler))
    assert response.text == "hello" and dns.call_count == 1
    assert str(response.url) == "https://example.com"


@pytest.mark.asyncio
@pytest.mark.parametrize("target", ["http://127.0.0.1", "http://169.254.169.254", "http://[::ffff:127.0.0.1]", "file:///etc/passwd"])
async def test_redirect_is_blocked_before_internal_request(target):
    seen = []
    def handler(request):
        seen.append(request)
        return httpx.Response(302, headers={"location": target})
    with patch("app.core.security.socket.getaddrinfo", return_value=PUBLIC):
        with pytest.raises(UnsafeUrlError):
            await safe_fetch("https://example.com", transport=httpx.MockTransport(handler))
    assert len(seen) == 1


@pytest.mark.asyncio
async def test_cross_origin_redirect_strips_credentials_and_revalidates():
    seen = []
    def handler(request):
        seen.append(request)
        if len(seen) == 1:
            return httpx.Response(302, headers={"location": "https://other.example/path"})
        assert request.headers["host"] == "other.example"
        assert "authorization" not in request.headers and "cookie" not in request.headers
        return httpx.Response(200, content=b"safe")
    with patch("app.core.security.socket.getaddrinfo", return_value=PUBLIC) as dns:
        result = await safe_fetch("https://example.com", headers={"Authorization": "test", "Cookie": "test"}, transport=httpx.MockTransport(handler))
    assert result.text == "safe" and dns.call_count == 2


class LargeStream(httpx.AsyncByteStream):
    def __init__(self):
        self.count = 0
    async def __aiter__(self):
        for _ in range(100):
            self.count += 1
            yield b"x" * 65536


@pytest.mark.asyncio
@pytest.mark.parametrize("headers", [{}, {"content-length": "1"}])
async def test_stream_stops_early_even_with_false_length(headers):
    stream = LargeStream()
    transport = httpx.MockTransport(lambda _: httpx.Response(200, headers=headers, stream=stream))
    with patch("app.core.security.socket.getaddrinfo", return_value=PUBLIC):
        with pytest.raises(UnsafeUrlError, match="too large"):
            await safe_fetch("https://example.com", transport=transport)
    assert stream.count < 100


@pytest.mark.asyncio
async def test_redirect_loop_is_bounded():
    transport = httpx.MockTransport(lambda _: httpx.Response(302, headers={"location": "/again"}))
    with patch("app.core.security.socket.getaddrinfo", return_value=PUBLIC):
        with pytest.raises(UnsafeUrlError, match="redirects"):
            await safe_fetch("https://example.com", transport=transport)
