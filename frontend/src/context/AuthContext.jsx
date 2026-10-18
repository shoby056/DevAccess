
import { createContext, useEffect, useState } from "react";
import authService from "../services/authService";
import api from "../services/api";

export const AuthContext = createContext();

const AuthContextProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(
    localStorage.getItem("devaccess_token")
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUser = async () => {
      const storedToken = localStorage.getItem("devaccess_token");

      if (!storedToken || storedToken === "undefined") {
        localStorage.removeItem("devaccess_token");
        setToken(null);
        setLoading(false);
        return;
      }

      try {
        api.defaults.headers.common.Authorization =
          `Bearer ${storedToken}`;

        const response = await authService.getMe();
        const currentUser = response?.data?.user;

        if (!currentUser) {
          throw new Error("User data missing from getMe response");
        }

        setUser(currentUser);
        setToken(storedToken);
      } catch (error) {
        console.error(
          "Failed to load user:",
          error.response?.data || error.message
        );

        localStorage.removeItem("devaccess_token");
        delete api.defaults.headers.common.Authorization;

        setUser(null);
        setToken(null);
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, []);

  const login = async (credentials) => {
    const response = await authService.login(credentials);
    const newToken = response?.data?.token;

    if (!newToken || newToken === "undefined") {
      throw new Error("Login response did not contain a valid token");
    }

    localStorage.setItem("devaccess_token", newToken);

    api.defaults.headers.common.Authorization =
      `Bearer ${newToken}`;

    try {
      const meResponse = await authService.getMe();
      const currentUser = meResponse?.data?.user;

      if (!currentUser) {
        throw new Error("User data missing from getMe response");
      }

      setToken(newToken);
      setUser(currentUser);

      return {
        ...response,
        user: currentUser,
      };
    } catch (error) {
      localStorage.removeItem("devaccess_token");
      delete api.defaults.headers.common.Authorization;

      setToken(null);
      setUser(null);

      throw error;
    }
  };

  const register = async (userData) => {
    return await authService.register(userData);
  };

  const logout = () => {
    localStorage.removeItem("devaccess_token");
    delete api.defaults.headers.common.Authorization;

    setToken(null);
    setUser(null);
  };

  const hasPermission = (permission) => {
    return user?.permissions?.includes(permission) ?? false;
  };

  const hasRole = (role) => {
    return user?.role === role;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        register,
        logout,
        hasPermission,
        hasRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContextProvider;
