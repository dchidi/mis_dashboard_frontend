export type AuthUserRole = "admin" | "user";

export interface AuthUser {
  created_at: string;
  email: string;
  full_name: string;
  id: string;
  is_email_verified: boolean;
  role: AuthUserRole;
}

interface AuthResponse {
  access_token: string;
  token_type: "bearer";
  user: AuthUser;
}

interface LoginPayload {
  email: string;
  password: string;
}

const AUTH_TOKEN_STORAGE_KEY = "authToken";
const AUTH_USER_STORAGE_KEY = "authUser";
export const AUTH_SESSION_EXPIRED_EVENT = "auth:session-expired";
const API_V1_BASE_URL =
  import.meta.env.VITE_API_V1_BASE_URL?.replace(/\/+$/, "") ??
  "http://127.0.0.1:8000/api/v1";

export const isAuthenticationErrorStatus = (status: number) =>
  status === 401 || status === 403;

export const dispatchSessionExpiredEvent = () => {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(new CustomEvent(AUTH_SESSION_EXPIRED_EVENT));
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
  getCurrentUser: async (token?: string): Promise<AuthUser> => {
    const response = await authenticatedFetch("/auth/me", { method: "GET" }, token);
    return (await response.json()) as AuthUser;
  },
  login: async ({ email, password }: LoginPayload): Promise<AuthResponse> => {
    const response = await authenticatedFetch("/auth/login", {
      body: JSON.stringify({ email, password }),
      method: "POST",
    });
    return (await response.json()) as AuthResponse;
  },
};
