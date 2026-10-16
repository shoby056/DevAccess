import api from "./api";

// Get current user's profile
const getProfile = async () => {
  const response = await api.get("/profile");
  return response.data;
};

// Update current user's profile
const updateProfile = async (profileData) => {
  const response = await api.put("/profile", profileData);
  return response.data;
};

// Change current user's password
const changePassword = async (passwordData) => {
  const response = await api.put("/profile/password", passwordData);
  return response.data;
};

export default {
  getProfile,
  updateProfile,
  changePassword,
};