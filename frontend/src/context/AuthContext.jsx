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

      if (!storedToken) {
        setLoading(false);
        return;
      }

      try {
        api.defaults.headers.common.Authorization =
          `Bearer ${storedToken}`;

        const response = await authService.getMe();

        setUser(response.data.user);
        setToken(storedToken);
      } catch (error) {
        console.error("Failed to load user:", error);

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

    const newToken = response.data.token;

    localStorage.setItem("devaccess_token", newToken);

    api.defaults.headers.common.Authorization =
      `Bearer ${newToken}`;

    const meResponse = await authService.getMe();

    setToken(newToken);
    setUser(meResponse.data.user);

    return {
      ...response,
      data: {
        ...response.data,
        user: meResponse.data.user,
      },
    };
  };

  const register = async (userData) => {
    const response = await authService.register(userData);

    return response;
  };

  const logout = () => {
    localStorage.removeItem("devaccess_token");

    delete api.defaults.headers.common.Authorization;

    setToken(null);
    setUser(null);
  };

  const hasPermission = (permission) => {
    if (!user?.permissions) {
      return false;
    }

    return user.permissions.includes(permission);
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