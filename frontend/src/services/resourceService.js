import api from "./api";

const getResources = async (params = {}) => {
  const response = await api.get("/resources", { params });
  return response.data;
};

const getResourceById = async (id) => {
  const response = await api.get(`/resources/${id}`);
  return response.data;
};

const createResource = async (resourceData) => {
  const response = await api.post("/resources", resourceData);
  return response.data;
};

const updateResource = async (id, resourceData) => {
  const response = await api.put(`/resources/${id}`, resourceData);
  return response.data;
};

const updateResourceStatus = async (id, isActive) => {
  const response = await api.patch(`/resources/${id}/status`, {
    isActive,
  });
  return response.data;
};

const deleteResource = async (id) => {
  const response = await api.delete(`/resources/${id}`);
  return response.data;
};

export default {
  getResources,
  getResourceById,
  createResource,
  updateResource,
  updateResourceStatus,
  deleteResource,
};