"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  homePathForRole,
  roleFromPath,
  useSession,
} from "@/context/session-context";
import {
  domainFromPath,
  pathPermissionDenied,
  roleCanAccessDomain,
} from "@/data/domains";

/** Map old role-folder URLs onto the domain spine. */
function legacyDomainRedirect(pathname: string): string | null {
  if (pathname === "/app/agent" || pathname === "/app/agent/") {
    return "/app/commerce";
  }
  if (pathname.startsWith("/app/agent/proforma")) return "/app/commerce/proforma";
  if (pathname.startsWith("/app/agent/gallery")) return "/app/commerce/gallery";
  if (pathname.startsWith("/app/agent/deliveries")) {
    return "/app/fulfillment/delivery";
  }
  if (pathname.startsWith("/app/agent/qc")) return "/app/product/qc";

  if (pathname === "/app/retailer" || pathname === "/app/retailer/") {
    return "/app/commerce";
  }
  if (pathname.startsWith("/app/retailer/orders")) return "/app/commerce/orders";
  if (pathname.startsWith("/app/retailer/proformas")) {
    return "/app/commerce/orders";
  }

  if (pathname === "/app/customer" || pathname === "/app/customer/") {
    return "/app/service";
  }
  if (pathname.startsWith("/app/customer/warranty")) {
    return "/app/service/warranty";
  }

  if (pathname.startsWith("/app/producer")) return "/app/product";

  if (pathname.startsWith("/app/warehouse")) {
    if (pathname.includes("/issue")) return "/app/inventory/uids";
    if (pathname.includes("/inventory")) return "/app/inventory/stock";
    return "/app/inventory";
  }

  if (pathname.startsWith("/app/qc")) {
    if (pathname.includes("/inspect") || pathname.includes("/designs")) {
      return "/app/product/qc";
    }
    if (pathname.includes("/catalog")) return "/app/product/catalog";
    return "/app/product";
  }

  if (pathname.startsWith("/app/pricing")) {
    if (pathname.includes("/simulator")) {
      return "/app/commerce/pricing/simulator";
    }
    if (pathname.includes("/rules")) {
      return "/app/commerce/pricing/rules";
    }
    if (pathname.includes("/rate-requests")) {
      return "/app/commerce/pricing/rate-requests";
    }
    return "/app/commerce/pricing";
  }

  return null;
}

/**
 * Auth for /app — domain spine is primary.
 * Role folders either redirect to domains or stay as channel tools
 * (e.g. /app/retailer/inventory).
 */
export function AuthGate({ children }: { children: React.ReactNode }) {
  const { ready, isAuthenticated, role, user, isAdmin, availableRoles } =
    useSession();
  const pathname = usePathname();
  const router = useRouter();

  const legacyTarget = legacyDomainRedirect(pathname);
  const domain = domainFromPath(pathname);
  const pathRole = roleFromPath(pathname);

  const needsLogin = ready && (!isAuthenticated || !role || !user);

  const domainAllowed =
    Boolean(domain) &&
    (roleCanAccessDomain(role, domain!) ||
      availableRoles.some((r) => roleCanAccessDomain(r, domain!)));

  /** Shared docs — any signed-in role. */
  const helpOk = pathname === "/app/help" || pathname.startsWith("/app/help/");

  /** Admin may open retailer/agent channel tools for support. */
  const adminChannelOk =
    isAdmin &&
    (pathRole === "admin" ||
      pathRole === "retailer" ||
      pathRole === "agent");

  /** Remaining role-channel tools (not redirected above). */
  const roleChannelOk =
    Boolean(pathRole) &&
    !domain &&
    !legacyTarget &&
    !helpOk &&
    (pathRole === role || adminChannelOk);

  const wrongRole = Boolean(
    ready &&
      isAuthenticated &&
      role &&
      pathRole &&
      !domain &&
      !legacyTarget &&
      !helpOk &&
      pathRole !== role &&
      !adminChannelOk,
  );

  const needsHomeRedirect =
    ready &&
    isAuthenticated &&
    role &&
    (pathname === "/app" || pathname === "/app/");

  /** Sensitive tools: hide by redirect — don’t leave dead-end permission toasts. */
  const toolDenied =
    ready &&
    isAuthenticated &&
    Boolean(role) &&
    !helpOk &&
    !legacyTarget &&
    pathPermissionDenied(role, pathname);

  const allowed =
    ready &&
    isAuthenticated &&
    Boolean(role) &&
    Boolean(user) &&
    !wrongRole &&
    !needsHomeRedirect &&
    !legacyTarget &&
    !toolDenied &&
    (domainAllowed || roleChannelOk || helpOk);

  useEffect(() => {
    if (!ready) return;

    if (needsLogin) {
      const next = encodeURIComponent(pathname || "/app");
      router.replace(`/enter?next=${next}`);
      return;
    }

    if (legacyTarget) {
      router.replace(legacyTarget);
      return;
    }

    if (toolDenied && role) {
      try {
        sessionStorage.setItem(
          "didar.access_denied",
          "این مسیر برای نقش شما در دسترس نیست یا فعلاً پارک شده است.",
        );
      } catch {
        /* ignore */
      }
      router.replace(homePathForRole(role));
      return;
    }

    if (domain && role && !domainAllowed) {
      try {
        sessionStorage.setItem(
          "didar.access_denied",
          "به این بخش دسترسی ندارید.",
        );
      } catch {
        /* ignore */
      }
      router.replace(homePathForRole(role));
      return;
    }

    if (wrongRole && role) {
      try {
        sessionStorage.setItem(
          "didar.access_denied",
          "این کانال برای نقش فعلی شما نیست.",
        );
      } catch {
        /* ignore */
      }
      router.replace(homePathForRole(role));
      return;
    }

    if (needsHomeRedirect && role) {
      router.replace(homePathForRole(role));
    }
  }, [
    ready,
    needsLogin,
    wrongRole,
    needsHomeRedirect,
    legacyTarget,
    toolDenied,
    domain,
    domainAllowed,
    role,
    pathname,
    router,
  ]);

  if (!allowed) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--mist)] text-sm text-[var(--muted)]">
        در حال بررسی دسترسی…
      </div>
    );
  }

  return <>{children}</>;
}
