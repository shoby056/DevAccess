
import api from "./api";

const cleanParams = (params = {}) => {
  return Object.fromEntries(
    Object.entries(params).filter(
      ([, value]) =>
        value !== undefined &&
        value !== null &&
        value !== ""
    )
  );
};

const getProjects = async (params = {}) => {
  const response = await api.get("/projects", {
    params: cleanParams(params),
  });

  return response.data;
};

const getProjectById = async (id) => {
  const response = await api.get(`/projects/${id}`);
  return response.data;
};

const createProject = async (projectData) => {
  const response = await api.post("/projects", projectData);
  return response.data;
};

const updateProject = async (id, projectData) => {
  const response = await api.put(`/projects/${id}`, projectData);
  return response.data;
};

const updateProjectStatus = async (id, isActive) => {
  const response = await api.patch(`/projects/${id}/status`, {
    isActive,
  });

  return response.data;
};

const deleteProject = async (id) => {
  const response = await api.delete(`/projects/${id}`);
  return response.data;
};

const projectService = {
  getProjects,
  getProjectById,
  createProject,
  updateProject,
  updateProjectStatus,
  deleteProject,
};

export default projectService;
