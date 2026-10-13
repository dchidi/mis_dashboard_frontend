export type AuthUserRole =
  | "mis"
  | "admin"
  | "super_admin"
  | "marketing"
  | "biz_dev"
  | "exec_user";

export type AuthMenuKey = "quote" | "policy" | "renewals" | "reports" | "dsr";

export interface RoleMenuPermissions {
  allowed_menus: AuthMenuKey[];
  role: AuthUserRole;
}
export interface AuthUser {
  can_run_etl: boolean;
  created_at: string;
  email: string;
  full_name: string;
  id: string;
  is_email_verified: boolean;
  must_change_password: boolean;
  password_changed_at: string | null;
  role: AuthUserRole;
  updated_at: string | null;
}

export interface AuthResponse {
  access_token: string;
  token_type: "bearer";
  user: AuthUser;
}

export interface LoginResponse {
  access_token: string | null;
  password_change_required: boolean;
  password_change_token: string | null;
  token_type: "bearer";
  user: AuthUser;
}

interface LoginPayload {
  email: string;
  password: string;
}

export interface CreateUserPayload {
  can_run_etl: boolean;
  email: string;
  full_name: string;
  password: string;
  role: AuthUserRole;
}

export interface UpdateUserPayload {
  can_run_etl: boolean;
  email: string;
  full_name: string;
  role: AuthUserRole;
}

interface RequiredPasswordChangePayload {
  confirm_password: string;
  new_password: string;
  password_change_token: string;
}

const AUTH_TOKEN_STORAGE_KEY = "authToken";
const AUTH_USER_STORAGE_KEY = "authUser";
const AUTH_RETURN_PATH_STORAGE_KEY = "authReturnPath";
export const AUTH_SESSION_EXPIRED_EVENT = "auth:session-expired";
const API_V1_BASE_URL =
  import.meta.env.VITE_API_V1_BASE_URL?.replace(/\/+$/, "") ??
  "http://127.0.0.1:8000/api/v1";

export const isAuthenticationErrorStatus = (status: number) => status === 401;

export const dispatchSessionExpiredEvent = () => {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(new CustomEvent(AUTH_SESSION_EXPIRED_EVENT));
};

const getSafeReturnPath = (path: string | null) => {
  if (!path || typeof window === "undefined") {
    return null;
  }

  try {
    const url = new URL(path, window.location.origin);
    if (url.origin !== window.location.origin || url.pathname === "/") {
      return null;
    }

    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return null;
  }
};

export const authReturnPathStorage = {
  clear: () => {
    if (typeof window === "undefined") {
      return;
    }

    try {
      sessionStorage.removeItem(AUTH_RETURN_PATH_STORAGE_KEY);
    } catch {
      // Storage may be unavailable in privacy-restricted browser contexts.
    }
  },
  consume: () => {
    if (typeof window === "undefined") {
      return null;
    }

    try {
      const returnPath = sessionStorage.getItem(AUTH_RETURN_PATH_STORAGE_KEY);
      sessionStorage.removeItem(AUTH_RETURN_PATH_STORAGE_KEY);
      return getSafeReturnPath(returnPath);
    } catch {
      return null;
    }
  },
  rememberCurrentLocation: () => {
    if (typeof window === "undefined") {
      return;
    }

    const returnPath = getSafeReturnPath(
      `${window.location.pathname}${window.location.search}${window.location.hash}`,
    );
    if (!returnPath) {
      return;
    }

    try {
      sessionStorage.setItem(AUTH_RETURN_PATH_STORAGE_KEY, returnPath);
    } catch {
      // Falling back to the dashboard is safe when storage is unavailable.
    }
  },
};

const extractErrorMessage = async (response: Response) => {
  try {
    const payload = (await response.json()) as { detail?: string };
    return payload.detail || `Request failed with status ${response.status}`;
  } catch {
    return `Request failed with status ${response.status}`;
  }
};

export const authStorage = {
  clear: () => {
    if (typeof window === "undefined") {
      return;
    }

    localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
    localStorage.removeItem(AUTH_USER_STORAGE_KEY);
  },
  getToken: () => {
    if (typeof window === "undefined") {
      return null;
    }

    return localStorage.getItem(AUTH_TOKEN_STORAGE_KEY);
  },
  getUser: () => {
    if (typeof window === "undefined") {
      return null;
    }

    try {
      const raw = localStorage.getItem(AUTH_USER_STORAGE_KEY);
      return raw ? (JSON.parse(raw) as AuthUser) : null;
    } catch {
      return null;
    }
  },
  setSession: (token: string, user: AuthUser) => {
    if (typeof window === "undefined") {
      return;
    }

    localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, token);
    localStorage.setItem(AUTH_USER_STORAGE_KEY, JSON.stringify(user));
  },
};

const authenticatedFetch = async (
  path: string,
  init?: RequestInit,
  token?: string,
) => {
  const effectiveToken = token ?? authStorage.getToken();
  let response: Response;
  try {
    response = await fetch(`${API_V1_BASE_URL}${path}`, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        ...(effectiveToken ? { Authorization: `Bearer ${effectiveToken}` } : {}),
        ...(init?.headers ?? {}),
      },
    });
  } catch {
    throw new Error(
      `Unable to reach the backend at ${API_V1_BASE_URL}. Start the backend and try again.`,
    );
  }

  if (!response.ok) {
    if (
      effectiveToken &&
      isAuthenticationErrorStatus(response.status) &&
      path !== "/auth/login"
    ) {
      dispatchSessionExpiredEvent();
    }

    throw new Error(await extractErrorMessage(response));
  }

  return response;
};

export const authService = {
  changeRequiredPassword: async (
    payload: RequiredPasswordChangePayload,
  ): Promise<AuthResponse> => {
    const response = await authenticatedFetch("/auth/change-required-password", {
      body: JSON.stringify(payload),
      method: "POST",
    });
    return (await response.json()) as AuthResponse;
  },
  createUser: async (payload: CreateUserPayload): Promise<AuthUser> => {
    const response = await authenticatedFetch("/auth/users", {
      body: JSON.stringify(payload),
      method: "POST",
    });
    return (await response.json()) as AuthUser;
  },
  deleteUser: async (userId: string): Promise<void> => {
    await authenticatedFetch(`/auth/users/${encodeURIComponent(userId)}`, {
      method: "DELETE",
    });
  },
  getCurrentUser: async (token?: string): Promise<AuthUser> => {
    const response = await authenticatedFetch("/auth/me", { method: "GET" }, token);
    return (await response.json()) as AuthUser;
  },
  getMenuPermissions: async (token?: string): Promise<RoleMenuPermissions> => {
    const response = await authenticatedFetch(
      "/auth/menu-permissions",
      { method: "GET" },
      token,
    );
    return (await response.json()) as RoleMenuPermissions;
  },
  listRoleMenuPermissions: async (): Promise<RoleMenuPermissions[]> => {
    const response = await authenticatedFetch("/auth/role-menu-permissions", {
      method: "GET",
    });
    return (await response.json()) as RoleMenuPermissions[];
  },  listUsers: async (): Promise<AuthUser[]> => {
    const response = await authenticatedFetch("/auth/users", { method: "GET" });
    return (await response.json()) as AuthUser[];
  },
  login: async ({ email, password }: LoginPayload): Promise<LoginResponse> => {
    const response = await authenticatedFetch("/auth/login", {
      body: JSON.stringify({ email, password }),
      method: "POST",
    });
    return (await response.json()) as LoginResponse;
  },
  requestPasswordChange: async (userId: string): Promise<AuthUser> => {
    const response = await authenticatedFetch(
      `/auth/users/${encodeURIComponent(userId)}/require-password-change`,
      { method: "POST" },
    );
    return (await response.json()) as AuthUser;
  },
  updateRoleMenuPermissions: async (
    role: AuthUserRole,
    allowedMenus: AuthMenuKey[],
  ): Promise<RoleMenuPermissions> => {
    const response = await authenticatedFetch(
      `/auth/role-menu-permissions/${encodeURIComponent(role)}`,
      {
        body: JSON.stringify({ allowed_menus: allowedMenus }),
        method: "PUT",
      },
    );
    return (await response.json()) as RoleMenuPermissions;
  },  updateUser: async (
    userId: string,
    payload: UpdateUserPayload,
  ): Promise<AuthUser> => {
    const response = await authenticatedFetch(
      `/auth/users/${encodeURIComponent(userId)}`,
      {
        body: JSON.stringify(payload),
        method: "PUT",
      },
    );
    return (await response.json()) as AuthUser;
  },
};
