"""Zarrin gold-accounting adapter.

Production shape is fixed here. Default mode is ``test`` (deterministic,
no network). When ``ZARRIN_MODE=live`` and base URL + API key are set,
the same payloads are POSTed to the real API.
"""

from __future__ import annotations

import hashlib
import json
import time
import urllib.error
import urllib.request
from dataclasses import dataclass
from functools import lru_cache
from typing import Any, Literal

from app.config import get_settings

ZarrinMode = Literal["test", "live"]


@dataclass(frozen=True)
class ZarrinResult:
    ok: bool
    mode: ZarrinMode
    zarrin_id: str
    external_id: str
    status: str
    ledger_ref: str
    posted_at: str
    raw: dict[str, Any]


def _iso_now() -> str:
    return time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())


def _stable_id(prefix: str, external_id: str) -> str:
    digest = hashlib.sha256(external_id.encode("utf-8")).hexdigest()[:16]
    return f"{prefix}_{digest}"


class ZarrinClient:
    def __init__(
        self,
        *,
        mode: ZarrinMode = "test",
        base_url: str = "",
        api_key: str = "",
        timeout_s: float = 15.0,
    ):
        self.mode = mode if mode in ("test", "live") else "test"
        self.base_url = (base_url or "").rstrip("/")
        self.api_key = api_key or ""
        self.timeout_s = timeout_s

    def _post(self, path: str, body: dict[str, Any]) -> dict[str, Any]:
        if self.mode != "live" or not self.base_url or not self.api_key:
            # Test mode: echo a production-shaped acceptance response.
            external_id = str(body.get("external_id") or "unknown")
            kind = "set" if "settlement" in path else "bb"
            return {
                "id": _stable_id(f"zrn_{kind}", external_id),
                "external_id": external_id,
                "status": "accepted",
                "ledger_ref": f"ZLG-{external_id}",
                "posted_at": _iso_now(),
                "mode": "test",
                "request_echo": body,
            }

        url = f"{self.base_url}{path}"
        data = json.dumps(body, ensure_ascii=False).encode("utf-8")
        req = urllib.request.Request(
            url,
            data=data,
            method="POST",
            headers={
                "Content-Type": "application/json; charset=utf-8",
                "Accept": "application/json",
                "Authorization": f"Bearer {self.api_key}",
                "X-Didar-Source": "didar-platform",
            },
        )
        try:
            with urllib.request.urlopen(req, timeout=self.timeout_s) as resp:
                raw = resp.read().decode("utf-8")
                return json.loads(raw) if raw else {}
        except urllib.error.HTTPError as exc:
            detail = exc.read().decode("utf-8", errors="replace")
            raise RuntimeError(f"Zarrin HTTP {exc.code}: {detail}") from exc
        except urllib.error.URLError as exc:
            raise RuntimeError(f"Zarrin unreachable: {exc.reason}") from exc

    def post_producer_settlement(
        self,
        *,
        external_id: str,
        producer: str,
        weight_grams: float,
        amount_irr: int,
        period_label: str,
    ) -> ZarrinResult:
        body = {
            "external_id": external_id,
            "kind": "producer_settlement",
            "counterparty": {"name": producer, "type": "producer"},
            "weight_grams": float(weight_grams),
            "amount_irr": int(amount_irr),
            "currency": "IRR",
            "period_label": period_label,
            "meta": {"source": "didar", "domain": "finance"},
        }
        raw = self._post("/v1/settlements", body)
        return ZarrinResult(
            ok=str(raw.get("status", "")).lower() in ("accepted", "posted", "ok"),
            mode=self.mode if self.base_url and self.api_key else "test",
            zarrin_id=str(raw.get("id") or ""),
            external_id=str(raw.get("external_id") or external_id),
            status=str(raw.get("status") or "unknown"),
            ledger_ref=str(raw.get("ledger_ref") or ""),
            posted_at=str(raw.get("posted_at") or _iso_now()),
            raw=raw,
        )

    def post_buyback(
        self,
        *,
        external_id: str,
        uid: str,
        claimant: str,
        weight_grams: float,
        amount_irr: int,
    ) -> ZarrinResult:
        body = {
            "external_id": external_id,
            "kind": "buyback",
            "uid": uid,
            "counterparty": {"name": claimant, "type": "retailer_or_customer"},
            "weight_grams": float(weight_grams),
            "amount_irr": int(amount_irr),
            "currency": "IRR",
            "meta": {"source": "didar", "domain": "service"},
        }
        raw = self._post("/v1/buybacks", body)
        return ZarrinResult(
            ok=str(raw.get("status", "")).lower() in ("accepted", "posted", "ok"),
            mode=self.mode if self.base_url and self.api_key else "test",
            zarrin_id=str(raw.get("id") or ""),
            external_id=str(raw.get("external_id") or external_id),
            status=str(raw.get("status") or "unknown"),
            ledger_ref=str(raw.get("ledger_ref") or ""),
            posted_at=str(raw.get("posted_at") or _iso_now()),
            raw=raw,
        )


@lru_cache
def get_zarrin_client() -> ZarrinClient:
    settings = get_settings()
    mode: ZarrinMode = "live" if settings.zarrin_mode == "live" else "test"
    return ZarrinClient(
        mode=mode,
        base_url=settings.zarrin_base_url,
        api_key=settings.zarrin_api_key,
    )
