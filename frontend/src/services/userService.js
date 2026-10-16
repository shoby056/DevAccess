import api from "./api";

// Get users with search, filter, pagination and sorting
const getUsers = async (params = {}) => {
  const response = await api.get("/users", {
    params,
  });

  return response.data;
};

// Get single user
const getUserById = async (id) => {
  const response = await api.get(`/users/${id}`);

  return response.data;
};

// Create user
const createUser = async (userData) => {
  const response = await api.post("/users", userData);

  return response.data;
};

// Update user name/email
const updateUser = async (id, userData) => {
  const response = await api.put(`/users/${id}`, userData);

  return response.data;
};

// Delete user
const deleteUser = async (id) => {
  const response = await api.delete(`/users/${id}`);

  return response.data;
};

// Activate/deactivate user
const updateUserStatus = async (id, isActive) => {
  const response = await api.patch(`/users/${id}/status`, {
    isActive,
  });

  return response.data;
};

// Change user role
const updateUserRole = async (id, role) => {
  const response = await api.patch(`/users/${id}/role`, {
    role,
  });

  return response.data;
};

const userService = {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  updateUserStatus,
  updateUserRole,
};

export default userService;