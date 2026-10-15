"""DNS-pinned public fetches with pre-connect redirect checks and streaming caps."""
import asyncio
import ipaddress
import socket
from urllib.parse import urljoin, urlparse

import httpx
from app.core.config import get_settings
from app.core.errors import UnsafeUrlError


def _public_addresses(host, port):
    try:
        addresses = [str(ipaddress.ip_address(host))]
    except ValueError:
        try:
            addresses = list(dict.fromkeys(r[4][0] for r in socket.getaddrinfo(host, port, socket.AF_UNSPEC, socket.SOCK_STREAM)))
        except OSError as error:
            raise UnsafeUrlError("The URL hostname could not be resolved safely.") from error
    if not addresses:
        raise UnsafeUrlError("The URL hostname could not be resolved safely.")
    for address in addresses:
        ip = ipaddress.ip_address(address)
        ip = getattr(ip, "ipv4_mapped", None) or ip
        if not ip.is_global or ip.is_multicast or ip.is_reserved or ip.is_unspecified:
            raise UnsafeUrlError("This URL points to a private or internal network address.")
    return addresses


def _is_private_ip(host):
    try:
        _public_addresses(host.strip("[]"), 443)
        return False
    except (UnsafeUrlError, ValueError):
        return True


def _validated_target(url):
    if not isinstance(url, str) or len(url) > 4096 or any(ord(c) <= 32 or ord(c) == 127 for c in url):
        raise UnsafeUrlError("Invalid URL.")
    try:
        parsed = urlparse(url)
        if parsed.scheme.lower() not in {"http", "https"}:
            raise UnsafeUrlError("URL scheme is not allowed. Use http:// or https://.")
        if not parsed.hostname:
            raise UnsafeUrlError("Invalid URL: no hostname found.")
        hostname = parsed.hostname.lower().rstrip(".")
        if hostname in {"localhost", "localhost.localdomain"}:
            raise UnsafeUrlError("URLs pointing to localhost are blocked for safety.")
        if parsed.username is not None or parsed.password is not None:
            raise UnsafeUrlError("URLs containing credentials are not allowed.")
        port = parsed.port or (443 if parsed.scheme == "https" else 80)
        return parsed, _public_addresses(hostname, port)
    except ValueError as error:
        raise UnsafeUrlError("Invalid URL.") from error


def validate_url(url):
    _validated_target(url)
    return url


async def safe_fetch(url, *, headers=None, transport=None):
    """Pin validated DNS results; preserve Host and TLS identity, never disable TLS.

    The optional transport is a hermetic test seam. No environment proxy or
    automatic redirects can bypass validation. Deadline covers DNS, hops and body.
    """
    settings = get_settings()
    request_headers = httpx.Headers({"User-Agent": "NaviiGoBot/2.0 (+https://naviigo.in)",
        "Accept": "text/html,application/xhtml+xml", "Accept-Encoding": "identity"})
    request_headers.update(headers or {})
    current = url
    try:
        async with asyncio.timeout(settings.URL_FETCH_TIMEOUT_SECONDS):
            async with httpx.AsyncClient(timeout=settings.URL_FETCH_TIMEOUT_SECONDS, follow_redirects=False,
                                         trust_env=False, transport=transport,
                                         limits=httpx.Limits(max_keepalive_connections=0)) as client:
                for hop in range(settings.URL_FETCH_MAX_REDIRECTS + 1):
                    parsed, addresses = await asyncio.to_thread(_validated_target, current)
                    original = httpx.URL(current)
                    pinned = original.copy_with(host=addresses[0])
                    request_headers["Host"] = original.netloc.decode("ascii")
                    async with client.stream("GET", pinned, headers=request_headers,
                                             extensions={"sni_hostname": original.host}) as response:
                        if response.status_code in {301, 302, 303, 307, 308}:
                            if hop == settings.URL_FETCH_MAX_REDIRECTS:
                                raise UnsafeUrlError("Too many URL redirects.")
                            location = response.headers.get("location")
                            if not location:
                                raise UnsafeUrlError("Invalid URL redirect.")
                            target = urljoin(current, location)
                            if httpx.URL(target).netloc != original.netloc or urlparse(target).scheme != parsed.scheme:
                                for key in ("Authorization", "Cookie", "Proxy-Authorization"):
                                    request_headers.pop(key, None)
                            current = target
                            continue
                        try:
                            length = int(response.headers.get("content-length", "0"))
                        except ValueError:
                            length = 0
                        if length > settings.URL_FETCH_MAX_BYTES:
                            raise UnsafeUrlError("Response is too large.")
                        content = bytearray()
                        async for chunk in response.aiter_bytes():
                            if len(content) + len(chunk) > settings.URL_FETCH_MAX_BYTES:
                                raise UnsafeUrlError("Response is too large.")
                            content.extend(chunk)
                        output_headers = httpx.Headers(response.headers)
                        for key in ("content-encoding", "content-length", "transfer-encoding", "set-cookie"):
                            output_headers.pop(key, None)
                        return httpx.Response(response.status_code, headers=output_headers, content=bytes(content),
                                              request=httpx.Request("GET", current))
    except TimeoutError as error:
        raise UnsafeUrlError("The URL fetch timed out.") from error
    raise UnsafeUrlError("URL could not be fetched safely.")
