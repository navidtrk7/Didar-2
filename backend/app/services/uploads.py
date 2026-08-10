"""Product image uploads — stored under backend/uploads and served at /media."""

from __future__ import annotations

import re
import uuid
from pathlib import Path

from fastapi import HTTPException, UploadFile

ALLOWED_TYPES = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
    "image/gif": ".gif",
}
MAX_BYTES = 5 * 1024 * 1024  # 5 MB
DEFAULT_PRODUCT_IMAGE = "/products/product-01.jpg"

_SAFE = re.compile(r"[^a-zA-Z0-9._-]+")


def normalize_image_url(url: str | None) -> str:
    """Empty/missing → public catalog placeholder (verify + cards must never get '')."""
    u = (url or "").strip()
    return u if u else DEFAULT_PRODUCT_IMAGE


def uploads_root() -> Path:
    root = Path(__file__).resolve().parents[2] / "uploads"
    root.mkdir(parents=True, exist_ok=True)
    return root


def products_dir() -> Path:
    d = uploads_root() / "products"
    d.mkdir(parents=True, exist_ok=True)
    return d


async def save_product_image(file: UploadFile) -> str:
    content_type = (file.content_type or "").split(";")[0].strip().lower()
    ext = ALLOWED_TYPES.get(content_type)
    if not ext:
        raise HTTPException(
            400,
            "فرمت تصویر مجاز نیست — JPEG، PNG، WebP یا GIF",
        )

    data = await file.read()
    if not data:
        raise HTTPException(400, "فایل خالی است")
    if len(data) > MAX_BYTES:
        raise HTTPException(400, "حجم تصویر حداکثر ۵ مگابایت است")

    original = _SAFE.sub("-", (file.filename or "image").rsplit(".", 1)[0])[:40]
    name = f"{uuid.uuid4().hex[:12]}-{original or 'img'}{ext}"
    path = products_dir() / name
    path.write_bytes(data)
    return f"/media/products/{name}"
