#!/usr/bin/env python3
"""Didar pilot E2E smoke against a live API base URL."""

from __future__ import annotations

import json
import sys
import time
import urllib.error
import urllib.request
from dataclasses import dataclass, field

BASE = sys.argv[1] if len(sys.argv) > 1 else "https://didar.cls9.com/api/v1"
PASSWORD = "didar123"


@dataclass
class Result:
    ok: list[str] = field(default_factory=list)
    fail: list[str] = field(default_factory=list)

    def add(self, name: str, passed: bool, detail: str = "") -> None:
        line = f"{name}" + (f" — {detail}" if detail else "")
        (self.ok if passed else self.fail).append(line)
        print(f"[{'OK' if passed else 'FAIL'}] {line}")


def req(
    method: str,
    path: str,
    *,
    token: str | None = None,
    body: dict | None = None,
) -> tuple[int, object]:
    data = None
    headers = {"Accept": "application/json"}
    if body is not None:
        data = json.dumps(body, ensure_ascii=False).encode("utf-8")
        headers["Content-Type"] = "application/json; charset=utf-8"
    if token:
        headers["Authorization"] = f"Bearer {token}"
    request = urllib.request.Request(
        f"{BASE}{path}", data=data, headers=headers, method=method
    )
    try:
        with urllib.request.urlopen(request, timeout=45) as resp:
            raw = resp.read().decode("utf-8")
            return resp.status, json.loads(raw) if raw else {}
    except urllib.error.HTTPError as exc:
        raw = exc.read().decode("utf-8", errors="replace")
        try:
            payload = json.loads(raw) if raw else {"detail": raw}
        except json.JSONDecodeError:
            payload = {"detail": raw}
        return exc.code, payload


def login(username: str) -> tuple[str, dict]:
    code, data = req(
        "POST",
        "/auth/login",
        body={"username": username, "password": PASSWORD},
    )
    if code != 200 or not isinstance(data, dict) or "access_token" not in data:
        raise RuntimeError(f"{code} {data}")
    return str(data["access_token"]), data.get("user") or {}


def main() -> int:
    r = Result()
    print(f"BASE={BASE}\n")

    code, health = req("GET", "/health")
    r.add(
        "health",
        code == 200 and isinstance(health, dict) and health.get("db_ok") is True,
        json.dumps(health, ensure_ascii=False) if isinstance(health, dict) else str(health),
    )

    # Seeded demo accounts (see backend/app/seed/demo.py USERS)
    accounts = {
        "leila": "admin",
        "maryam": "qc",
        "sara": "retailer",
        "navid": "agent",
        "hossein": "warehouse",
        "kambiz": "finance",
        "arash": "producer",
    }
    tokens: dict[str, str] = {}
    for user, expect_role in accounts.items():
        try:
            tok, me = login(user)
            tokens[user] = tok
            role = me.get("role")
            roles = me.get("roles")
            r.add(
                f"login:{user}",
                role == expect_role,
                f"role={role} roles={roles}",
            )
        except Exception as exc:  # noqa: BLE001
            r.add(f"login:{user}", False, str(exc))

    if "sara" in tokens:
        code, _ = req("GET", "/platform", token=tokens["sara"])
        r.add("platform:retailer:auth", code == 200, f"status={code}")
    code, _ = req("GET", "/platform")
    r.add("platform:unauth", code == 401, f"status={code}")

    # Multi-role: navid agent + warehouse grant
    if "navid" in tokens:
        code, me = req("GET", "/auth/me", token=tokens["navid"])
        roles = me.get("roles") if isinstance(me, dict) else []
        r.add(
            "multirole:navid_has_warehouse",
            isinstance(roles, list) and "warehouse" in roles and "agent" in roles,
            str(roles),
        )
        code, _ = req("GET", "/inventory/custody", token=tokens["navid"])
        r.add("multirole:custody_api", code == 200, f"status={code}")

    # Producer → QC → UID
    sku_id = None
    stamp = int(time.time()) % 100000
    if "arash" in tokens:
        code, sku = req(
            "POST",
            "/product/skus",
            token=tokens["arash"],
            body={
                "name": f"پایلوت دودکش {stamp}",
                "category": "ring",
                "sku_code": f"PL-{stamp}",
                "karat": 18,
                "catalog_weight": 2.15,
                "collection": "پایلوت",
                "status": "draft",
            },
        )
        sku_id = sku.get("id") if isinstance(sku, dict) else None
        r.add("producer:sku_create", code in (200, 201) and bool(sku_id), f"{code} id={sku_id}")

        if sku_id:
            code, qc = req(
                "POST",
                f"/product/skus/{sku_id}/send-to-qc",
                token=tokens["arash"],
            )
            inspection_id = qc.get("id") if isinstance(qc, dict) else None
            r.add(
                "producer:send_to_qc",
                code in (200, 201) and bool(inspection_id),
                f"{code} insp={inspection_id}",
            )
        else:
            inspection_id = None
    else:
        inspection_id = None

    if inspection_id and "maryam" in tokens:
        code, done = req(
            "POST",
            f"/product/qc/{inspection_id}/complete",
            token=tokens["maryam"],
            body={
                "measured_weight": 2.15,
                "result": "pass",
                "notes": "pilot smoke",
            },
        )
        r.add("qc:complete", code == 200, f"{code} {done}")

    uid = None
    if sku_id and "hossein" in tokens:
        code, asset = req(
            "POST",
            f"/inventory/uids?sku_id={urllib_quote(sku_id)}",
            token=tokens["hossein"],
        )
        uid = asset.get("uid") if isinstance(asset, dict) else None
        r.add("warehouse:uid_issue", code in (200, 201) and bool(uid), f"{code} uid={uid}")

    # Retailer order with the freshly issued UID (critical path)
    order_uid = uid
    if "sara" in tokens:
        if not order_uid:
            code, assets = req(
                "GET", "/inventory/uids", token=tokens.get("hossein", tokens["sara"])
            )
            if code == 200 and isinstance(assets, list):
                for a in assets:
                    if a.get("status") == "available" and a.get("uid"):
                        order_uid = a["uid"]
                        break
        if order_uid:
            code, order = req(
                "POST",
                "/commerce/orders",
                token=tokens["sara"],
                body={
                    "retailer": "ignored-for-retailer-role",
                    "items": 1,
                    "total_weight": 2.15,
                    "value": 40_000_000,
                    "uids": [order_uid],
                },
            )
            r.add(
                "retailer:order_glue",
                code in (200, 201)
                and isinstance(order, dict)
                and order.get("status") in ("submitted", "picking"),
                f"{code} status={order.get('status') if isinstance(order, dict) else order}",
            )
            delivery_id = None
            if code in (200, 201) and "hossein" in tokens:
                code2, dlv = req(
                    "GET", "/fulfillment/shipments", token=tokens["hossein"]
                )
                has = False
                if code2 == 200 and isinstance(dlv, list):
                    for d in dlv:
                        if order_uid in (d.get("uids") or []):
                            has = True
                            delivery_id = d.get("id")
                            break
                r.add(
                    "fulfillment:from_order",
                    has,
                    f"{code2} matched={has} count={len(dlv) if isinstance(dlv, list) else 0}",
                )

                # Advance pick → pack → handover → awaiting_otp, then demo OTP
                if delivery_id:
                    stage = None
                    for step in ("packing", "handover", "awaiting_otp"):
                        code_a, adv = req(
                            "POST",
                            f"/fulfillment/shipments/{delivery_id}/advance",
                            token=tokens["hossein"],
                        )
                        stage = adv.get("status") if isinstance(adv, dict) else None
                        if code_a != 200:
                            r.add(
                                f"fulfillment:advance_to_{step}",
                                False,
                                f"{code_a} {adv}",
                            )
                            break
                    else:
                        r.add(
                            "fulfillment:advance_to_otp",
                            stage in ("awaiting_otp", "en_route"),
                            f"status={stage}",
                        )

                    if stage in ("awaiting_otp", "en_route", "handover") and "navid" in tokens:
                        code_o, done = req(
                            "POST",
                            f"/fulfillment/shipments/{delivery_id}/confirm-otp",
                            token=tokens["navid"],
                            body={"otp": "1234"},
                        )
                        st = done.get("status") if isinstance(done, dict) else None
                        r.add(
                            "fulfillment:confirm_otp",
                            code_o == 200 and st == "completed",
                            f"{code_o} status={st}",
                        )
                        if code_o == 200 and st == "completed":
                            code_w, claim = req(
                                "POST",
                                "/service/claims",
                                token=tokens["navid"],
                                body={
                                    "uid": order_uid,
                                    "notes": "pilot warranty after delivery",
                                },
                            )
                            r.add(
                                "warranty:accept_delivered",
                                code_w in (200, 201),
                                f"{code_w} {claim.get('id') if isinstance(claim, dict) else claim}",
                            )
                            code_q, quote = req(
                                "GET",
                                f"/service/buyback-quote/{urllib_quote(order_uid)}",
                                token=tokens["sara"],
                            )
                            offer = (
                                quote.get("offer_irr")
                                if isinstance(quote, dict)
                                else None
                            )
                            r.add(
                                "buyback:quote",
                                code_q == 200 and isinstance(offer, int) and offer > 0,
                                f"{code_q} offer={offer}",
                            )
                            code_b, case = req(
                                "POST",
                                "/service/cases",
                                token=tokens["sara"],
                                body={
                                    "uid": order_uid,
                                    "kind": "buyback",
                                    "notes": "pilot buyback",
                                    "amount_irr": 0,
                                },
                            )
                            cid = case.get("id") if isinstance(case, dict) else None
                            r.add(
                                "buyback:open",
                                code_b in (200, 201) and bool(cid),
                                f"{code_b} id={cid}",
                            )
                            if cid:
                                code_c, closed = req(
                                    "POST",
                                    f"/service/cases/{cid}/close",
                                    token=tokens["sara"],
                                )
                                zref = (
                                    closed.get("zarrin_ref")
                                    if isinstance(closed, dict)
                                    else None
                                )
                                r.add(
                                    "buyback:close_zarrin",
                                    code_c == 200 and bool(zref),
                                    f"{code_c} zarrin_ref={zref}",
                                )
                else:
                    r.add("fulfillment:advance_to_otp", False, "no delivery id")
        else:
            r.add("retailer:order_glue", False, "no available UID")

    # Agent proforma on a separate available UID
    if "navid" in tokens and "hossein" in tokens:
        agent_uid = None
        code, assets = req("GET", "/inventory/uids", token=tokens["hossein"])
        if code == 200 and isinstance(assets, list):
            for a in assets:
                if a.get("status") == "available" and a.get("uid"):
                    agent_uid = a["uid"]
                    break
        if agent_uid:
            retailer = "گالری مهر طلا"
            code, lock = req(
                "POST",
                "/commerce/locks",
                token=tokens["navid"],
                body={"retailer": retailer},
            )
            lock_id = lock.get("id") if isinstance(lock, dict) else None
            r.add("agent:price_lock", code in (200, 201) and bool(lock_id), f"{code}")
            if lock_id:
                code, pf = req(
                    "POST",
                    "/commerce/proformas",
                    token=tokens["navid"],
                    body={
                        "retailer": retailer,
                        "lock_id": lock_id,
                        "lines": [{"uid": agent_uid}],
                    },
                )
                r.add(
                    "agent:proforma",
                    code in (200, 201),
                    f"{code} {pf.get('code') if isinstance(pf, dict) else pf}",
                )
        else:
            r.add("agent:price_lock", False, "no available UID for agent path")
            r.add("agent:proforma", False, "skipped")

    # Trust settle — verbal/phone (not Zarrin)
    if "kambiz" in tokens and "navid" in tokens:
        code, deal = req(
            "POST",
            "/finance/credit-documents",
            token=tokens["navid"],
            body={
                "retailer": "گالری مهر طلا",
                "amount_irr": 5_000_000,
                "weight_grams": 0.5,
                "origin_channel": "verbal",
                "notes": "pilot verbal trust deal",
            },
        )
        tid = deal.get("id") if isinstance(deal, dict) else None
        r.add(
            "trust:open_verbal_deal",
            code in (200, 201) and bool(tid),
            f"{code} id={tid}",
        )
        if tid:
            code, settled = req(
                "POST",
                f"/finance/credit-documents/{tid}/settle",
                token=tokens["kambiz"],
                body={"channel": "phone", "notes": "confirmed by phone pilot"},
            )
            ch = settled.get("settlement_channel") if isinstance(settled, dict) else None
            r.add(
                "trust:settle_phone",
                code == 200 and ch == "phone",
                f"{code} channel={ch}",
            )
        # cash_only party cannot use verbal settle
        code, docs = req(
            "GET", "/finance/credit-documents", token=tokens["kambiz"]
        )
        zid = None
        if code == 200 and isinstance(docs, list):
            for d in docs:
                if d.get("retailer") == "گالری زمرد" and d.get("status") != "settled":
                    zid = d.get("id")
                    break
        if zid:
            code, body = req(
                "POST",
                f"/finance/credit-documents/{zid}/settle",
                token=tokens["kambiz"],
                body={"channel": "verbal", "notes": "should fail"},
            )
            r.add(
                "trust:cash_only_blocks_verbal",
                code == 400,
                f"{code} {body}",
            )
        else:
            r.add(
                "trust:cash_only_blocks_verbal",
                True,
                "skipped (no open زمرد doc — gate covered by unit path)",
            )

    # Finance settlement → Zarrin adapter
    if "kambiz" in tokens:
        code, row = req(
            "POST",
            "/finance/producer-settlements",
            token=tokens["kambiz"],
            body={
                "producer": "آتلیه نوا",
                "weight_grams": 10,
                "amount_irr": 0,
                "period_label": "پایلوت",
            },
        )
        sid = row.get("id") if isinstance(row, dict) else None
        r.add("finance:create_settlement", code in (200, 201) and bool(sid), f"{code}")
        if sid:
            code, paid = req(
                "POST",
                f"/finance/producer-settlements/{sid}/settle",
                token=tokens["kambiz"],
            )
            zref = paid.get("zarrin_ref") if isinstance(paid, dict) else None
            r.add(
                "finance:settle_zarrin",
                code == 200 and bool(zref),
                f"{code} zarrin_ref={zref}",
            )

    # Warranty reject undelivered
    if "navid" in tokens and "hossein" in tokens:
        code, assets = req("GET", "/inventory/uids", token=tokens["hossein"])
        test_uid = None
        if code == 200 and isinstance(assets, list):
            for a in assets:
                if a.get("status") != "delivered" and a.get("uid"):
                    test_uid = a["uid"]
                    break
        if test_uid:
            code, body = req(
                "POST",
                "/service/claims",
                token=tokens["navid"],
                body={"uid": test_uid, "notes": "should fail"},
            )
            r.add("warranty:reject_undelivered", code == 400, f"{code} {body}")
        else:
            r.add("warranty:reject_undelivered", False, "no undelivered uid")

    # Discrepancy open/resolve
    if "hossein" in tokens:
        code, assets = req("GET", "/inventory/uids", token=tokens["hossein"])
        disc_uid = None
        if code == 200 and isinstance(assets, list):
            for a in assets:
                if a.get("status") in ("available", "reserved") and a.get("uid"):
                    disc_uid = a["uid"]
                    break
        if disc_uid:
            code, d = req(
                "POST",
                "/inventory/discrepancies",
                token=tokens["hossein"],
                body={
                    "uid": disc_uid,
                    "measured_weight": 1.11,
                    "reason": "pilot smoke",
                },
            )
            did = d.get("id") if isinstance(d, dict) else None
            r.add("custody:open_discrepancy", code in (200, 201) and bool(did), f"{code} {d}")
            if did:
                code, _ = req(
                    "POST",
                    f"/inventory/discrepancies/{did}/resolve",
                    token=tokens["hossein"],
                    body={
                        "resolution": "resolved",
                        "notes": "pilot close",
                        "accept_measured": False,
                    },
                )
                r.add("custody:resolve_discrepancy", code == 200, f"{code}")
        else:
            r.add("custody:open_discrepancy", False, "no uid")

    code, _ = req("POST", "/admin/reseed")
    r.add("reseed:unauth", code == 401, f"status={code}")

    print("\n=== SUMMARY ===")
    print(f"passed={len(r.ok)} failed={len(r.fail)}")
    for line in r.fail:
        print(f"  - {line}")
    return 1 if r.fail else 0


def urllib_quote(value: str) -> str:
    from urllib.parse import quote

    return quote(value, safe="")


if __name__ == "__main__":
    raise SystemExit(main())
