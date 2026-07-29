import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { useNavigate } from "react-router-dom";
import { canAccessPath, getFirstAllowedMenuPath } from "../config/menuAccess";
import {
  AUTH_SESSION_EXPIRED_EVENT,
  authReturnPathStorage,
  authService,
  authStorage,
  type AuthMenuKey,
  type AuthUser,
} from "../services/auth";

interface AuthContextValue {
  allowedMenuKeys: AuthMenuKey[];
  canAccessMenu: (menuKey: AuthMenuKey) => boolean;
  cancelRequiredPasswordChange: () => void;
  completeRequiredPasswordChange: (
    newPassword: string,
    confirmPassword: string,
  ) => Promise<void>;
  isAdmin: boolean;
  isAuthenticated: boolean;
  isLoading: boolean;
  isSuperAdmin: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  passwordChangeUser: AuthUser | null;
  refreshMenuPermissions: () => Promise<void>;
  user: AuthUser | null;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const hasAdminAccess = (user: AuthUser | null) =>
  user?.role === "admin" || user?.role === "super_admin";

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const navigate = useNavigate();
  const [user, setUser] = useState<AuthUser | null>(() => authStorage.getUser());
  const [allowedMenuKeys, setAllowedMenuKeys] = useState<AuthMenuKey[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(() =>
    Boolean(authStorage.getToken()),
  );
  const [passwordChangeToken, setPasswordChangeToken] = useState<string | null>(
    null,
  );
  const [passwordChangeUser, setPasswordChangeUser] = useState<AuthUser | null>(
    null,
  );

  useEffect(() => {
    const handleSessionExpired = () => {
      authReturnPathStorage.rememberCurrentLocation();
      authStorage.clear();
      setUser(null);
      setAllowedMenuKeys([]);
      setPasswordChangeToken(null);
      setPasswordChangeUser(null);
      setIsLoading(false);
      navigate("/", { replace: true });
    };

    window.addEventListener(AUTH_SESSION_EXPIRED_EVENT, handleSessionExpired);

    return () => {
      window.removeEventListener(
        AUTH_SESSION_EXPIRED_EVENT,
        handleSessionExpired,
      );
    };
  }, [navigate]);

  useEffect(() => {
    const token = authStorage.getToken();
    if (!token) {
      return;
    }

    let isActive = true;

    void Promise.all([
      authService.getCurrentUser(token),
      authService.getMenuPermissions(token),
    ])
      .then(([currentUser, permissions]) => {
        if (!isActive) {
          return;
        }

        authStorage.setSession(token, currentUser);
        setUser(currentUser);
        setAllowedMenuKeys(permissions.allowed_menus);
      })
      .catch(() => {
        if (!isActive) {
          return;
        }

        authStorage.clear();
        setUser(null);
        setAllowedMenuKeys([]);
      })
      .finally(() => {
        if (isActive) {
          setIsLoading(false);
        }
      });

    return () => {
      isActive = false;
    };
  }, []);

  const navigateAfterLogin = (
    permissions: AuthMenuKey[],
    authenticatedUser: AuthUser,
  ) => {
    const requestedPath = authReturnPathStorage.consume();
    const isAdmin = hasAdminAccess(authenticatedUser);
    const canReturnToRequestedPath = Boolean(
      requestedPath &&
        canAccessPath(
          requestedPath,
          permissions,
          isAdmin,
          authenticatedUser.role === "super_admin",
        ),
    );
    const destination =
      (canReturnToRequestedPath ? requestedPath : null) ??
      getFirstAllowedMenuPath(permissions) ??
      (isAdmin ? "/manage_users" : "/access-denied");

    navigate(destination, { replace: true });
  };

  const establishSession = async (token: string, authenticatedUser: AuthUser) => {
    authStorage.setSession(token, authenticatedUser);
    try {
      const permissions = await authService.getMenuPermissions(token);
      setAllowedMenuKeys(permissions.allowed_menus);
      setPasswordChangeToken(null);
      setPasswordChangeUser(null);
      setUser(authenticatedUser);
      setIsLoading(false);
      navigateAfterLogin(permissions.allowed_menus, authenticatedUser);
    } catch (error) {
      authStorage.clear();
      setAllowedMenuKeys([]);
      setUser(null);
      throw error;
    }
  };

  const login = async (email: string, password: string) => {
    const response = await authService.login({ email, password });

    if (response.password_change_required) {
      if (!response.password_change_token) {
        throw new Error("The password change session could not be started.");
      }
      authStorage.clear();
      setUser(null);
      setAllowedMenuKeys([]);
      setPasswordChangeToken(response.password_change_token);
      setPasswordChangeUser(response.user);
      setIsLoading(false);
      return;
    }

    if (!response.access_token) {
      throw new Error("The sign-in response did not include an access token.");
    }

    await establishSession(response.access_token, response.user);
  };

  const completeRequiredPasswordChange = async (
    newPassword: string,
    confirmPassword: string,
  ) => {
    if (!passwordChangeToken) {
      throw new Error("The password change session has expired. Sign in again.");
    }

    const response = await authService.changeRequiredPassword({
      confirm_password: confirmPassword,
      new_password: newPassword,
      password_change_token: passwordChangeToken,
    });
    await establishSession(response.access_token, response.user);
  };

  const refreshMenuPermissions = async () => {
    if (!user) {
      setAllowedMenuKeys([]);
      return;
    }
    const permissions = await authService.getMenuPermissions();
    setAllowedMenuKeys(permissions.allowed_menus);
  };

  const cancelRequiredPasswordChange = () => {
    setPasswordChangeToken(null);
    setPasswordChangeUser(null);
  };

  const logout = () => {
    authReturnPathStorage.clear();
    authStorage.clear();
    setUser(null);
    setAllowedMenuKeys([]);
    setPasswordChangeToken(null);
    setPasswordChangeUser(null);
    setIsLoading(false);
    navigate("/", { replace: true });
  };

  const isAdmin = hasAdminAccess(user);

  return (
    <AuthContext.Provider
      value={{
        allowedMenuKeys,
        canAccessMenu: (menuKey) => allowedMenuKeys.includes(menuKey),
        cancelRequiredPasswordChange,
        completeRequiredPasswordChange,
        isAdmin,
        isAuthenticated: Boolean(user),
        isLoading,
        isSuperAdmin: user?.role === "super_admin",
        login,
        logout,
        passwordChangeUser,
        refreshMenuPermissions,
        user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }

  return context;
};