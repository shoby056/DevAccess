const PERMISSIONS = {
  USERS_READ: "users.read",
  USERS_CREATE: "users.create",
  USERS_UPDATE: "users.update",
  USERS_DELETE: "users.delete",

  ROLES_READ: "roles.read",
  ROLES_UPDATE: "roles.update",

  TEAMS_READ: "teams.read",
  TEAMS_CREATE: "teams.create",
  TEAMS_UPDATE: "teams.update",
  TEAMS_DELETE: "teams.delete",

  PROJECTS_READ: "projects.read",
  PROJECTS_CREATE: "projects.create",
  PROJECTS_UPDATE: "projects.update",
  PROJECTS_DELETE: "projects.delete",

  RESOURCES_READ: "resources.read",
  RESOURCES_CREATE: "resources.create",
  RESOURCES_UPDATE: "resources.update",
  RESOURCES_DELETE: "resources.delete",

  ACCESS_REQUEST: "access.request",
  ACCESS_READ: "access.read",
  ACCESS_APPROVE: "access.approve",
  ACCESS_REJECT: "access.reject",
  ACCESS_REVOKE: "access.revoke",

  AUDIT_READ: "audit.read",
  AUDIT_EXPORT: "audit.export",

  PROFILE_READ: "profile.read",
  PROFILE_UPDATE: "profile.update",
};

module.exports = PERMISSIONS;