import api from "./api";

const createAccessRequest = async (requestData) => {
  const response = await api.post("/access-requests", requestData);
  return response.data;
};

const getAccessRequests = async (params = {}) => {
  const response = await api.get("/access-requests", { params });
  return response.data;
};

const getAccessRequestById = async (id) => {
  const response = await api.get(`/access-requests/${id}`);
  return response.data;
};

const approveAccessRequest = async (id, reviewComment = "") => {
  const response = await api.patch(`/access-requests/${id}/approve`, {
    reviewComment,
  });
  return response.data;
};

const rejectAccessRequest = async (id, reviewComment = "") => {
  const response = await api.patch(`/access-requests/${id}/reject`, {
    reviewComment,
  });
  return response.data;
};

const cancelAccessRequest = async (id) => {
  const response = await api.patch(`/access-requests/${id}/cancel`);
  return response.data;
};

const getAccessGrants = async (params = {}) => {
  const response = await api.get("/access-grants", { params });
  return response.data;
};

const getAccessGrantById = async (id) => {
  const response = await api.get(`/access-grants/${id}`);
  return response.data;
};

const revokeAccessGrant = async (id, revokeReason = "") => {
  const response = await api.patch(`/access-grants/${id}/revoke`, {
    revokeReason,
  });
  return response.data;
};

export default {
  createAccessRequest,
  getAccessRequests,
  getAccessRequestById,
  approveAccessRequest,
  rejectAccessRequest,
  cancelAccessRequest,
  getAccessGrants,
  getAccessGrantById,
  revokeAccessGrant,
};