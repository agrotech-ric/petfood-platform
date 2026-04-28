import { useContext, createContext, useState, ReactNode, useEffect } from "react";
import { useNavigate } from "react-router-dom";

export type UserRole = 'USER' | 'ADMIN' | 'VET';

type User = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  createdAt: string;
};

type AuthContextType = {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  loginAction: (data: { email: string; password: string }) => Promise<void>;
  registerAction: (data: {
    email: string;
    firstName: string;
    lastName: string;
   // iin: string;
    password: string;
  }) => Promise<{ userId: string; email: string }>;
  confirmRegistration: (data: { email: string; code: string }) => Promise<void>;
  logout: () => void;
  fetchUserProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;

const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const navigate = useNavigate();

  useEffect(() => {
  const checkAuth = async () => {
    try {
      await fetchUserProfile();
    } catch (err) {
      setIsAuthenticated(false);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  checkAuth();
}, []);

  const fetchUserProfile = async () => {
    try {
      const response = await fetch(`${apiBaseUrl}/api/v1/account/profile/me`, {
        method: "GET",
        credentials: "include",
        headers: {
          "Content-Type": "application/json"
        }
      });

      if (!response.ok) {
        throw new Error("Not authenticated");
      }

      const userData: User = await response.json();
      setUser(userData);
      setIsAuthenticated(true);
    } catch (err) {
      setUser(null);
      setIsAuthenticated(false);
      throw err;
    }
  };

  const loginAction = async (data: { email: string; password: string }) => {
    try {
      const response = await fetch(`${apiBaseUrl}/api/v1/account/login/email`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Login failed");
      }

      const res = await response.json();

      if (res.status === "logged_in") {
        const profileResponse = await fetch(`${apiBaseUrl}/api/v1/account/profile/me`, {
          method: "GET",
          credentials: "include",
          headers: {
            "Content-Type": "application/json"
          }
        });

        if (!profileResponse.ok) {
          throw new Error("Failed to fetch user profile");
        }

        const userData: User = await profileResponse.json();
        setUser(userData);
        setIsAuthenticated(true);

        if (userData.role === 'VET') {
          navigate("/vet/dashboard");
        } else if (userData.role === 'ADMIN') {
          navigate("/admin/users");
        } else {
          navigate("/dashboard");
        }
        return;
      }

      throw new Error("Invalid login response");
    } catch (err) {
      console.error(err);
      throw err;
    }
  };

  const registerAction = async (data: {
    email: string;
    firstName: string;
    lastName: string;
    iin: string;
    password: string;
  }) => {
    try {
      const response = await fetch(`${apiBaseUrl}/api/v1/account/register`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Registration failed");
      }

      const res = await response.json();

      if (res.status === "PENDING_VERIFICATION") {
        return {
          userId: res.userId,
          email: res.email
        };
      }

      throw new Error("Invalid registration response");
    } catch (err) {
      console.error(err);
      throw err;
    }
  };

  const confirmRegistration = async (data: { email: string; code: string }) => {
    try {
      const response = await fetch(`${apiBaseUrl}/api/v1/account/register/confirm`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Verification failed");
      }

      const res = await response.json();

      if (res.status === "verified") {
        navigate("/login");
        return;
      }

      throw new Error("Invalid verification response");
    } catch (err) {
      console.error(err);
      throw err;
    }
  };

  const logout = async () => {
    try {
      await fetch(`${apiBaseUrl}/api/v1/account/logout`, {
        method: "POST",
        credentials: "include"
      });

      setUser(null);
      setIsAuthenticated(false);
      navigate("/login");
    } catch (err) {
      console.error("Logout error:", err);
      setUser(null);
      setIsAuthenticated(false);
      navigate("/login");
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated,
      isLoading,
      loginAction,
      registerAction,
      confirmRegistration,
      logout,
      fetchUserProfile
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};