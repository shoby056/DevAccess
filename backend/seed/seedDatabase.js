
const mongoose = require("mongoose");
const dotenv = require("dotenv");

const Permission = require("../models/Permission");
const Role = require("../models/Role");

dotenv.config();

/*
=========================================================
PERMISSIONS
=========================================================
*/

const permissions = [
  // -------------------------
  // USERS
  // -------------------------

  {
    name: "users.read",
    description: "View users",
  },
  {
    name: "users.create",
    description: "Create users",
  },
  {
    name: "users.update",
    description: "Update users",
  },
  {
    name: "users.delete",
    description: "Delete users",
  },

  // -------------------------
  // ROLES
  // -------------------------

  {
    name: "roles.read",
    description: "View roles",
  },
  {
    name: "roles.update",
    description: "Update roles and permissions",
  },

  // -------------------------
  // TEAMS
  // -------------------------

  {
    name: "teams.read",
    description: "View teams",
  },
  {
    name: "teams.create",
    description: "Create teams",
  },
  {
    name: "teams.update",
    description: "Update teams",
  },
  {
    name: "teams.delete",
    description: "Delete teams",
  },

  // -------------------------
  // PROJECTS
  // -------------------------

  {
    name: "projects.read",
    description: "View projects",
  },
  {
    name: "projects.create",
    description: "Create projects",
  },
  {
    name: "projects.update",
    description: "Update projects",
  },
  {
    name: "projects.delete",
    description: "Delete projects",
  },

  // -------------------------
  // RESOURCES
  // -------------------------

  {
    name: "resources.read",
    description: "View resources",
  },
  {
    name: "resources.create",
    description: "Create resources",
  },
  {
    name: "resources.update",
    description: "Update resources",
  },
  {
    name: "resources.delete",
    description: "Delete resources",
  },

  // -------------------------
  // ACCESS
  // -------------------------

  {
    name: "access.request",
    description: "Request access to resources",
  },
  {
    name: "access.read",
    description: "View access requests and grants",
  },
  {
    name: "access.approve",
    description: "Approve access requests",
  },
  {
    name: "access.reject",
    description: "Reject access requests",
  },
  {
    name: "access.revoke",
    description: "Revoke granted access",
  },

  // -------------------------
  // AUDIT
  // -------------------------

  {
    name: "audit.read",
    description: "View audit logs",
  },
  {
    name: "audit.export",
    description: "Export audit logs",
  },

  // -------------------------
  // PROFILE
  // -------------------------

  {
    name: "profile.read",
    description: "View own profile",
  },
  {
    name: "profile.update",
    description: "Update own profile",
  },
];

/*
=========================================================
ROLE DEFINITIONS
=========================================================
*/

const roleDefinitions = [
  // -------------------------
  // SUPER ADMIN
  // -------------------------

  {
    name: "SUPER_ADMIN",
    description: "Full system access",

    permissions: permissions.map(
      (permission) => permission.name
    ),
  },

  // -------------------------
  // TEAM LEAD
  // -------------------------

  {
    name: "TEAM_LEAD",
    description:
      "Manage team members, projects, resources and access approvals",

    permissions: [
      "users.read",
      
      "teams.read",
      "teams.create",
      "teams.update",

      "projects.read",
      "projects.create",
      "projects.update",

      "resources.read",
      "resources.create",
      "resources.update",

      "access.request",
      "access.read",
      "access.approve",
      "access.reject",
      "access.revoke",

      "profile.read",
      "profile.update",
    ],
  },

  // -------------------------
  // DEVELOPER
  // -------------------------

  {
    name: "DEVELOPER",
    description:
      "Developer access to projects and resources",

    permissions: [
      "projects.read",

      "resources.read",

      "access.request",
      "access.read",

      "profile.read",
      "profile.update",
    ],
  },

  // -------------------------
  // QA ENGINEER
  // -------------------------

  {
    name: "QA_ENGINEER",
    description:
      "QA access to projects and resources",

    permissions: [
      "projects.read",

      "resources.read",

      "access.request",
      "access.read",

      "profile.read",
      "profile.update",
    ],
  },

  // -------------------------
  // AUDITOR
  // -------------------------

  {
    name: "AUDITOR",
    description:
      "Read-only audit and access history",

    permissions: [
      "users.read",

      "teams.read",

      "projects.read",

      "resources.read",

      "access.read",

      "audit.read",
      "audit.export",

      "profile.read",
      "profile.update",
    ],
  },
];

/*
=========================================================
SEED DATABASE
=========================================================
*/

const seedDatabase = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    console.log("MongoDB connected for seeding");

    /*
    ================================================
    1. CREATE / UPDATE PERMISSIONS
    ================================================
    */

    const permissionMap = {};

    for (const permissionData of permissions) {
      const permission = await Permission.findOneAndUpdate(
        { name: permissionData.name },

        permissionData,

        {
          new: true,
          upsert: true,
          setDefaultsOnInsert: true,
        }
      );

      permissionMap[permission.name] = permission._id;
    }

    console.log(
      `${permissions.length} permissions seeded`
    );

    /*
    ================================================
    2. CREATE / UPDATE ROLES
    ================================================
    */

    for (const roleData of roleDefinitions) {
      const permissionIds = roleData.permissions
        .map(
          (permissionName) =>
            permissionMap[permissionName]
        )
        .filter(Boolean);

      await Role.findOneAndUpdate(
        { name: roleData.name },

        {
          name: roleData.name,
          description: roleData.description,
          permissions: permissionIds,
        },

        {
          new: true,
          upsert: true,
          setDefaultsOnInsert: true,
        }
      );
    }

    console.log(
      `${roleDefinitions.length} roles seeded`
    );

    console.log(
      "Database seeding completed successfully"
    );

    await mongoose.disconnect();

    process.exit(0);
  } catch (error) {
    console.error(
      "Database seeding failed:",
      error.message
    );

    await mongoose.disconnect();

    process.exit(1);
  }
};

seedDatabase();

