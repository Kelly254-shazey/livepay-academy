import hmac
from typing import Annotated

from fastapi import Header, HTTPException, status

from app.core.config import get_settings


async def require_internal_api_key(
    x_internal_api_key: Annotated[str | None, Header()] = None,
) -> None:
    expected_key = get_settings().internal_api_key
    provided_key = x_internal_api_key or ""

    if not hmac.compare_digest(provided_key, expected_key):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid internal API key.",
        )
