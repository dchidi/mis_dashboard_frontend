import type { AuthMenuKey } from "../services/auth";

export const MENU_PATHS: Record<AuthMenuKey, string> = {
  quote: "/quote_dashboard",
  policy: "/policy",
  renewals: "/renewals",
  reports: "/reports",
};

export const getFirstAllowedMenuPath = (
  allowedMenuKeys: AuthMenuKey[],
): string | null => {
  const firstMenuKey = (
    ["quote", "policy", "renewals", "reports"] as AuthMenuKey[]
  ).find((key) => allowedMenuKeys.includes(key));
  return firstMenuKey ? MENU_PATHS[firstMenuKey] : null;
};

export const canAccessPath = (
  path: string,
  allowedMenuKeys: AuthMenuKey[],
  isAdmin: boolean,
  isSuperAdmin = false,
): boolean => {
  const pathname = path.split(/[?#]/, 1)[0];
  if (isAdmin && pathname === "/manage_users") {
    return true;
  }
  if (isSuperAdmin && pathname === "/role_menu_access") {
    return true;
  }

  return Object.entries(MENU_PATHS).some(
    ([key, menuPath]) =>
      menuPath === pathname && allowedMenuKeys.includes(key as AuthMenuKey),
  );
};