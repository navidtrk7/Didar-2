"""Domain-scoped permissions. Roles receive grants; APIs check permission keys."""

from __future__ import annotations

from typing import Annotated

from fastapi import Depends, HTTPException

from app.deps import get_current_user
from app.models import User

ROLE_GRANTS: dict[str, frozenset[str]] = {
    "network.view": frozenset({"admin", "agent", "finance"}),
    "network.manage": frozenset({"admin"}),
    "product.view": frozenset(
        {
            "admin",
            "qc",
            "warehouse",
            "pricing",
            "agent",
            "retailer",
            "producer",
        }
    ),
    "product.sku_create": frozenset({"admin", "qc", "producer"}),
    "product.qc_approve": frozenset({"admin", "qc"}),
    "inventory.view": frozenset({"admin", "warehouse", "agent", "finance"}),
    "inventory.uid_issue": frozenset({"admin", "warehouse"}),
    "inventory.allocate": frozenset({"admin", "warehouse"}),
    "inventory.custody": frozenset({"admin", "warehouse", "agent"}),
    "commerce.view": frozenset({"admin", "pricing", "agent", "retailer"}),
    "commerce.pricing": frozenset({"admin", "pricing"}),
    "commerce.proforma": frozenset({"admin", "agent"}),
    "commerce.order": frozenset({"admin", "agent", "retailer"}),
    "commerce.promotion": frozenset({"admin", "pricing", "agent"}),
    "fulfillment.view": frozenset({"admin", "warehouse", "agent"}),
    "fulfillment.stage": frozenset({"admin", "warehouse"}),
    "fulfillment.deliver": frozenset({"admin", "agent", "warehouse"}),
    "finance.view": frozenset({"admin", "finance", "agent"}),
    "finance.ledger": frozenset({"admin", "finance"}),
    # Agent may record verbal/phone trust deals + settle with channel notes
    "finance.credit": frozenset({"admin", "finance", "agent"}),
    "finance.settlement": frozenset({"admin", "finance"}),
    "service.view": frozenset(
        {"admin", "customer", "agent", "retailer", "finance"}
    ),
    "service.warranty": frozenset({"admin", "customer", "agent"}),
    "service.lifecycle": frozenset({"admin", "agent", "retailer", "finance"}),
    "relationship.view": frozenset({"admin", "agent", "retailer"}),
    "relationship.manage": frozenset({"admin", "agent"}),
    "intelligence.view": frozenset({"admin", "finance", "pricing", "agent"}),
    "governance.view": frozenset({"admin"}),
    "governance.users": frozenset({"admin"}),
    "governance.audit": frozenset({"admin"}),
}


def role_has_permission(role: str, permission: str) -> bool:
    if role == "admin":
        return True
    granted = ROLE_GRANTS.get(permission)
    if not granted:
        return False
    return role in granted


def effective_roles(user: User) -> set[str]:
    """Primary role + active grants — pilot multi-hat."""
    roles: set[str] = {user.role}
    for g in getattr(user, "role_grants", None) or []:
        if getattr(g, "status", "active") == "active" and g.role_code:
            roles.add(g.role_code)
    return roles


def user_has_permission(user: User, permission: str) -> bool:
    roles = effective_roles(user)
    if "admin" in roles:
        return True
    return any(role_has_permission(r, permission) for r in roles)


def permissions_for_role(role: str) -> list[str]:
    if role == "admin":
        return sorted(ROLE_GRANTS.keys())
    return sorted(p for p, roles in ROLE_GRANTS.items() if role in roles)


def permissions_for_user(user: User) -> list[str]:
    roles = effective_roles(user)
    if "admin" in roles:
        return sorted(ROLE_GRANTS.keys())
    out: set[str] = set()
    for role in roles:
        out.update(permissions_for_role(role))
    return sorted(out)


def domains_for_role(role: str) -> list[str]:
    seen: set[str] = set()
    for perm in permissions_for_role(role):
        domain = perm.split(".", 1)[0]
        seen.add(domain)
    return sorted(seen)


def domains_for_user(user: User) -> list[str]:
    seen: set[str] = set()
    for perm in permissions_for_user(user):
        domain = perm.split(".", 1)[0]
        seen.add(domain)
    return sorted(seen)


def require_permission(permission: str):
    def _dep(user: Annotated[User, Depends(get_current_user)]) -> User:
        if not user_has_permission(user, permission):
            raise HTTPException(403, f"مجوز لازم: {permission}")
        return user

    return _dep
