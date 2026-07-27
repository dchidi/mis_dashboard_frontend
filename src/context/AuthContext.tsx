import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { useNavigate } from "react-router-dom";
import {
  AUTH_SESSION_EXPIRED_EVENT,
  authReturnPathStorage,
  authService,
  authStorage,
  type AuthUser,
} from "../services/auth";

interface AuthContextValue {
  isAdmin: boolean;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  user: AuthUser | null;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const navigate = useNavigate();
  const [user, setUser] = useState<AuthUser | null>(() => authStorage.getUser());
  const [isLoading, setIsLoading] = useState<boolean>(() =>
    Boolean(authStorage.getToken()),
  );

  useEffect(() => {
    const handleSessionExpired = () => {
      authReturnPathStorage.rememberCurrentLocation();
      authStorage.clear();
      setUser(null);
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
      setIsLoading(false);
      return;
    }

    let isActive = true;

    void authService
      .getCurrentUser(token)
      .then((currentUser) => {
        if (!isActive) {
          return;
        }

        authStorage.setSession(token, currentUser);
        setUser(currentUser);
      })
      .catch(() => {
        if (!isActive) {
          return;
        }

        authStorage.clear();
        setUser(null);
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

  const login = async (email: string, password: string) => {
    const response = await authService.login({ email, password });

    authStorage.setSession(response.access_token, response.user);
    setUser(response.user);
    setIsLoading(false);
    navigate(authReturnPathStorage.consume() ?? "/quote_dashboard", {
      replace: true,
    });
  };

  const logout = () => {
    authReturnPathStorage.clear();
    authStorage.clear();
    setUser(null);
    setIsLoading(false);
    navigate("/", { replace: true });
  };

  return (
    <AuthContext.Provider
      value={{
        isAdmin: user?.role === "admin",
        isAuthenticated: Boolean(user),
        isLoading,
        login,
        logout,
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
