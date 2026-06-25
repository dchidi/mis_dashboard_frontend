import type { AuthUser } from "../services/auth";

export const getUserNameParts = (user: AuthUser | null) => {
  const fullName = user?.full_name?.trim();
  if (!fullName) {
    return { firstName: "User", lastName: "Account" };
  }

  const parts = fullName.split(/\s+/).filter(Boolean);
  const firstName = parts[0] || "User";
  const lastName = parts.length > 1 ? parts.slice(1).join(" ") : "Account";

  return { firstName, lastName };
};
