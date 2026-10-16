import api from "./api";

const getTeams = async (params = {}) => {
  const response = await api.get("/teams", { params });
  return response.data;
};

const getTeamById = async (id) => {
  const response = await api.get(`/teams/${id}`);
  return response.data;
};

const createTeam = async (teamData) => {
  const response = await api.post("/teams", teamData);
  return response.data;
};

const updateTeam = async (id, teamData) => {
  const response = await api.put(`/teams/${id}`, teamData);
  return response.data;
};

const deleteTeam = async (id) => {
  const response = await api.delete(`/teams/${id}`);
  return response.data;
};

const addMember = async (teamId, userId) => {
  const response = await api.post(`/teams/${teamId}/members`, {
    userId,
  });

  return response.data;
};

const removeMember = async (teamId, userId) => {
  const response = await api.delete(`/teams/${teamId}/members`, {
    data: { userId },
  });

  return response.data;
};

export default {
  getTeams,
  getTeamById,
  createTeam,
  updateTeam,
  deleteTeam,
  addMember,
  removeMember,
};