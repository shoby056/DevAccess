import api from "./api";

// Register a new user
const register = async (userData) => {
  const response = await api.post("/auth/register", userData);

  return response.data;
};

// Login existing user
const login = async (credentials) => {
  const response = await api.post("/auth/login", credentials);

  return response.data;
};

// Get currently logged-in user
const getMe = async () => {
  const response = await api.get("/auth/me");

  return response.data;
};

const authService = {
  register,
  login,
  getMe,
};

export default authService;