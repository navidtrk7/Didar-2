"""Business domains — system spine (roles only get permissions on these)."""

from __future__ import annotations

DOMAIN_IDS: tuple[str, ...] = (
    "network",
    "product",
    "inventory",
    "commerce",
    "fulfillment",
    "finance",
    "service",
    "relationship",
    "intelligence",
    "governance",
)

DOMAIN_LABELS_FA: dict[str, str] = {
    "network": "شبکه",
    "product": "محصول",
    "inventory": "موجودی",
    "commerce": "تجارت",
    "fulfillment": "تحقق سفارش",
    "finance": "مالی",
    "service": "خدمات",
    "relationship": "ارتباطات",
    "intelligence": "هوش",
    "governance": "حاکمیت",
}
