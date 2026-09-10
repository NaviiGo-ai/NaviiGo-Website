# ─── SSRF-safe URL fetching ────────────────────────────────────────────────────
# Every user-supplied URL passes through this module before any HTTP request.
# We block private IPs, metadata services, non-http schemes, and cap response
# size and redirects.
from __future__ import annotations

import ipaddress
import socket
from urllib.parse import urlparse

import httpx

from app.core.config import get_settings
from app.core.errors import UnsafeUrlError
from app.core.logging import get_logger

logger = get_logger(__name__)

# Private / dangerous ranges to block for user-supplied URLs.
_BLOCKED_NETWORKS = [
    ipaddress.ip_network("127.0.0.0/8"),     # loopback v4
    ipaddress.ip_network("::1/128"),          # loopback v6
    ipaddress.ip_network("10.0.0.0/8"),
    ipaddress.ip_network("172.16.0.0/12"),
    ipaddress.ip_network("192.168.0.0/16"),
    ipaddress.ip_network("0.0.0.0/8"),
    ipaddress.ip_network("100.64.0.0/10"),    # CGNAT
    ipaddress.ip_network("169.254.0.0/16"),   # link-local v4
    ipaddress.ip_network("fe80::/10"),         # link-local v6
    ipaddress.ip_network("fd00::/8"),          # ULA v6
    ipaddress.ip_network("fc00::/7"),          # unique-local v6
    ipaddress.ip_network("ff00::/8"),          # multicast v6
    # Cloud metadata services
    ipaddress.ip_network("169.254.169.254/32"),
]

_ALLOWED_SCHEMES = {"http", "https"}


def _is_private_ip(host: str) -> bool:
    """Check whether a hostname resolves to a blocked IP.

    Literal IPs are checked directly (no DNS re-resolution) so a redirect to
    ``http://127.0.0.1`` or ``http://169.254.169.254`` can never sneak past the
    guard even if a resolver is tricked or offline.
    """
    try:
        direct = ipaddress.ip_address(host.strip("[]"))
    except ValueError:
        direct = None
    else:
        for net in _BLOCKED_NETWORKS:
            if direct in net:
                return True
        # A literal public IP is safe — no need to consult DNS at all.
        return False

    try:
        addr_infos = socket.getaddrinfo(host, None, socket.AF_UNSPEC, socket.SOCK_STREAM)
    except socket.gaierror:
        return True  # unresolvable → block
    for (_, _, _, _, sockaddr) in addr_infos:
        ip = ipaddress.ip_address(sockaddr[0])
        for net in _BLOCKED_NETWORKS:
            if ip in net:
                return True
    return False


def validate_url(url: str) -> str:
    """Validate and return a safe URL, or raise UnsafeUrlError."""
    parsed = urlparse(url)
    if parsed.scheme.lower() not in _ALLOWED_SCHEMES:
        raise UnsafeUrlError(f"URL scheme '{parsed.scheme}' is not allowed. Use http:// or https://.")
    if not parsed.hostname:
        raise UnsafeUrlError("Invalid URL: no hostname found.")
    hostname = parsed.hostname.lower()
    if hostname in ("localhost", "localhost.localdomain"):
        raise UnsafeUrlError("URLs pointing to localhost are blocked for safety.")
    if _is_private_ip(hostname):
        raise UnsafeUrlError("This URL points to a private or internal network address.")
    return url


async def safe_fetch(url: str, *, headers: dict | None = None) -> httpx.Response:
    """Fetch a user-supplied URL after SSRF validation.

    Caps response size, follows limited redirects, enforces timeout.
    """
    settings = get_settings()
    safe_url = validate_url(url)

    default_headers = {
        "User-Agent": "Mozilla/5.0 (compatible; NaviiGoBot/2.0; +https://naviigo.in)",
        "Accept": "text/html,application/xhtml+xml",
    }
    if headers:
        default_headers.update(headers)

    async with httpx.AsyncClient(
        timeout=settings.URL_FETCH_TIMEOUT_SECONDS,
        max_redirects=settings.URL_FETCH_MAX_REDIRECTS,
        follow_redirects=True,
    ) as client:
        resp = await client.get(safe_url, headers=default_headers)
        # Also validate the final resolved URL after redirects
        final_url = str(resp.url)
        final_parsed = urlparse(final_url)
        if final_parsed.hostname and _is_private_ip(final_parsed.hostname):
            raise UnsafeUrlError("This URL redirected to a private network address.")

        # Cap response body size
        if resp.headers.get("content-length"):
            try:
                if int(resp.headers["content-length"]) > settings.URL_FETCH_MAX_BYTES:
                    raise UnsafeUrlError("Response is too large.")
            except ValueError:
                pass
        if len(resp.content) > settings.URL_FETCH_MAX_BYTES:
            raise UnsafeUrlError("Response is too large.")

        return resp
