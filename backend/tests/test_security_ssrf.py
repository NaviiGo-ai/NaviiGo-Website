import pytest
from unittest.mock import patch, AsyncMock
import socket
import ipaddress
import httpx

from app.core.security import validate_url, safe_fetch, UnsafeUrlError
from app.core.config import get_settings

# Only the safe_fetch tests are async — the validate_url tests are pure sync,
# so the asyncio marker is applied per-function instead of file-wide.

# Test validate_url function
def test_validate_url_localhost():
    """Test that localhost URLs are blocked."""
    with pytest.raises(UnsafeUrlError, match="localhost"):
        validate_url("http://localhost:8000")

    with pytest.raises(UnsafeUrlError, match="localhost"):
        validate_url("https://localhost.localdomain")

def test_validate_url_private_ips():
    """Test that private IP addresses are blocked."""
    # IPv4 private ranges
    private_ips = [
        "127.0.0.1",
        "192.168.1.1",
        "10.0.0.1",
        "172.16.0.1",
        "100.64.0.1",  # CGNAT
        "169.254.0.1",  # link-local
    ]
    for ip in private_ips:
        with pytest.raises(UnsafeUrlError, match="private or internal network address"):
            validate_url(f"http://{ip}")

    # IPv6 private ranges (we test a few)
    ipv6_private = [
        "::1",  # loopback
        "fe80::1",  # link-local
        "fc00::1",  # unique-local
        "fd00::1",  # ULA
    ]
    for ip in ipv6_private:
        with pytest.raises(UnsafeUrlError, match="private or internal network address"):
            validate_url(f"http://[{ip}]")

def test_validate_url_cloud_metadata():
    """Test that cloud metadata IP is blocked."""
    with pytest.raises(UnsafeUrlError, match="private or internal network address"):
        validate_url("http://169.254.169.254")

def test_validate_url_safe_urls():
    """Test that safe public URLs are allowed."""
    # Deterministic DNS: resolve every hostname to a public IP so the test is
    # hermetic and never depends on the sandbox's resolver.
    with patch(
        "app.core.security.socket.getaddrinfo",
        return_value=[
            (socket.AF_INET, socket.SOCK_STREAM, 0, '', ('93.184.216.34', 80))
        ],
    ):
        # These should not raise
        validate_url("http://example.com")
        validate_url("https://example.com")
        validate_url("http://example.com:8080/path?query=value")
        validate_url("https://sub.domain.example.com")

def test_validate_url_invalid_scheme():
    """Test that non-http/https schemes are blocked."""
    with pytest.raises(UnsafeUrlError, match="URL scheme"):
        validate_url("ftp://example.com")

    with pytest.raises(UnsafeUrlError, match="URL scheme"):
        validate_url("file:///etc/passwd")

    with pytest.raises(UnsafeUrlError, match="URL scheme"):
        validate_url("gopher://example.com")

def test_validate_url_no_hostname():
    """Test that URLs with no hostname are blocked."""
    with pytest.raises(UnsafeUrlError, match="no hostname found"):
        validate_url("http://")

    with pytest.raises(UnsafeUrlError, match="no hostname found"):
        validate_url("https:///path")


# Test safe_fetch function
@patch("app.core.security.socket.getaddrinfo")
@patch("app.core.security.httpx.AsyncClient")
@pytest.mark.asyncio
async def test_safe_fetch_blocks_private_ip_after_dns(mock_client_class, mock_getaddrinfo):
    """Test that safe_fetch blocks a URL that resolves to a private IP."""
    # Mock DNS to return a private IP
    mock_getaddrinfo.return_value = [
        (socket.AF_INET, socket.SOCK_STREAM, 0, '', ('127.0.0.1', 80))
    ]

    # Mock the httpx client to avoid making a real request (though we expect it to be blocked before request)
    mock_client_instance = AsyncMock()
    mock_client_class.return_value.__aenter__.return_value = mock_client_instance

    # We expect an UnsafeUrlError to be raised before the client is even used
    with pytest.raises(UnsafeUrlError, match="private or internal network address"):
        await safe_fetch("http://example.com")

    # Ensure the client's get method was not called because we blocked at DNS validation
    mock_client_instance.get.assert_not_called()

@patch("app.core.security.socket.getaddrinfo")
@patch("app.core.security.httpx.AsyncClient")
@pytest.mark.asyncio
async def test_safe_fetch_allows_safe_url(mock_client_class, mock_getaddrinfo):
    """Test that safe_fetch allows a URL that resolves to a public IP."""
    # Mock DNS to return a public IP
    mock_getaddrinfo.return_value = [
        (socket.AF_INET, socket.SOCK_STREAM, 0, '', ('93.184.216.34', 80))  # example.com
    ]

    # Mock the httpx client to return a successful response
    mock_response = AsyncMock()
    mock_response.status_code = 200
    mock_response.headers = httpx.Headers({"content-length": "100"})
    mock_response.content = b"Hello, world!"
    mock_response.url = "http://example.com"

    mock_client_instance = AsyncMock()
    mock_client_instance.get.return_value = mock_response
    mock_client_class.return_value.__aenter__.return_value = mock_client_instance

    # This should not raise
    response = await safe_fetch("http://example.com")

    # Check that we got the mocked response
    assert response.status_code == 200
    assert response.content == b"Hello, world!"

    # Ensure the client's get method was called once
    mock_client_instance.get.assert_called_once()

@patch("app.core.security.socket.getaddrinfo")
@patch("app.core.security.httpx.AsyncClient")
@pytest.mark.asyncio
async def test_safe_fetch_blocks_redirect_to_private(mock_client_class, mock_getaddrinfo):
    """Test that safe_fetch blocks if the URL redirects to a private IP."""
    # Mock DNS to return a public IP initially
    mock_getaddrinfo.return_value = [
        (socket.AF_INET, socket.SOCK_STREAM, 0, '', ('93.184.216.34', 80))
    ]

    # Mock the httpx client to return a redirect to a private IP
    mock_response = AsyncMock()
    mock_response.status_code = 200  # We'll simulate that the client followed redirects and ended up at a private IP
    # However, the safe_fetch function checks the final URL after redirects.
    # We need to mock the final URL to be a private IP.
    # The function does: final_url = str(resp.url) and then validates that URL.
    # So we can set mock_response.url to a private IP URL.
    mock_response.url = "http://127.0.0.1"
    mock_response.headers = httpx.Headers({"content-length": "100"})
    mock_response.content = b"private"

    mock_client_instance = AsyncMock()
    mock_client_instance.get.return_value = mock_response
    mock_client_class.return_value.__aenter__.return_value = mock_client_instance

    # We expect an UnsafeUrlError because the final URL is private
    with pytest.raises(UnsafeUrlError, match="redirected to a private network address"):
        await safe_fetch("http://example.com")

    mock_client_instance.get.assert_called_once()

@patch("app.core.security.socket.getaddrinfo")
@patch("app.core.security.httpx.AsyncClient")
@pytest.mark.asyncio
async def test_safe_fetch_response_size_limit(mock_client_class, mock_getaddrinfo):
    """Test that safe_fetch blocks responses that are too large."""
    # Mock DNS to return a public IP
    mock_getaddrinfo.return_value = [
        (socket.AF_INET, socket.SOCK_STREAM, 0, '', ('93.184.216.34', 80))
    ]

    # Mock the httpx client to return a response with a large content-length header
    mock_response = AsyncMock()
    mock_response.status_code = 200
    mock_response.headers = {"content-length": str(1024 * 1024 + 1)}  # 1MB+1 byte
    # We don't need to set content because the check on headers will raise first
    mock_response.url = "http://example.com"

    mock_client_instance = AsyncMock()
    mock_client_instance.get.return_value = mock_response
    mock_client_class.return_value.__aenter__.return_value = mock_client_instance

    # We expect an UnsafeUrlError because the response is too large
    with pytest.raises(UnsafeUrlError, match="Response is too large"):
        await safe_fetch("http://example.com")

    mock_client_instance.get.assert_called_once()

    # Now test the case where content-length is missing but the actual content is too large
    mock_response.headers = {}  # Remove content-length
    mock_response.content = b"x" * (1024 * 1024 + 1)  # 1MB+1 byte

    with pytest.raises(UnsafeUrlError, match="Response is too large"):
        await safe_fetch("http://example.com")