const express = require("express");

const {
  createProject,
  getProjects,
  getProjectById,
  updateProject,
  updateProjectStatus,
  deleteProject,
} = require("../controllers/projectController");

const authMiddleware = require("../middleware/authMiddleware");

const requirePermission = require("../middleware/permissionMiddleware");

const router = express.Router();

/*
=========================================================
ALL PROJECT ROUTES REQUIRE LOGIN
=========================================================
*/

router.use(authMiddleware);

/*
=========================================================
GET ALL PROJECTS
=========================================================
*/

router.get(
  "/",
  requirePermission("projects.read"),
  getProjects
);

/*
=========================================================
GET SINGLE PROJECT
=========================================================
*/

router.get(
  "/:id",
  requirePermission("projects.read"),
  getProjectById
);

/*
=========================================================
CREATE PROJECT
=========================================================
*/

router.post(
  "/",
  requirePermission("projects.create"),
  createProject
);

/*
=========================================================
UPDATE PROJECT
=========================================================
*/

router.put(
  "/:id",
  requirePermission("projects.update"),
  updateProject
);

/*
=========================================================
UPDATE PROJECT ACTIVE STATUS
=========================================================
*/

router.patch(
  "/:id/status",
  requirePermission("projects.update"),
  updateProjectStatus
);

/*
=========================================================
DELETE PROJECT
=========================================================
*/

router.delete(
  "/:id",
  requirePermission("projects.delete"),
  deleteProject
);

module.exports = router;