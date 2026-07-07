import ipaddress

from starlette.requests import Request
from slowapi import Limiter

from app.config import get_settings

settings = get_settings()

_trusted_networks: list[ipaddress.IPv4Network | ipaddress.IPv6Network] = [
    ipaddress.ip_network(cidr.strip())
    for cidr in settings.TRUSTED_PROXY_CIDRS.split(",")
    if cidr.strip()
]


def _is_trusted_proxy(ip: str) -> bool:
    try:
        addr = ipaddress.ip_address(ip)
        return any(addr in net for net in _trusted_networks)
    except ValueError:
        return False


def get_real_ip(request: Request) -> str:
    client_ip = request.client.host if request.client else "unknown"
    if _is_trusted_proxy(client_ip):
        real_ip = (
            request.headers.get("X-Real-IP")
            or request.headers.get("X-Forwarded-For", "").split(",")[0].strip()
        )
        if real_ip:
            return real_ip
    return client_ip


limiter = Limiter(
    key_func=get_real_ip,
    storage_uri=settings.REDIS_URL,
    default_limits=[settings.RATE_LIMIT_GLOBAL],
)
