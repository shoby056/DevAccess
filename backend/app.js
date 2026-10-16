const express = require("express");
const cors = require("cors");
const roleRoutes = require("./routes/roleRoutes");
const permissionRoutes = require("./routes/permissionRoutes");
const userRoutes = require("./routes/userRoutes");

const authRoutes = require("./routes/authRoutes");
const teamRoutes = require("./routes/teamRoutes");
const projectRoutes = require("./routes/projectRoutes");
const resourceRoutes = require("./routes/resourceRoutes");
const accessRequestRoutes = require("./routes/accessRequestRoutes");
const accessGrantRoutes = require("./routes/accessGrantRoutes");
const auditLogRoutes = require("./routes/auditLogRoutes");
const profileRoutes = require("./routes/profileRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const aiAssistantRoutes = require("./routes/aiAssistantRoutes");

const app = express();

// Parse JSON requests
app.use(express.json());

// Enable CORS
app.use(
  cors({
    origin: process.env.CLIENT_URL,
  })
);

// Health check
app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "DevAccess API is running",
  });
});

// Authentication routes
app.use("/api/auth", authRoutes);


app.use("/api/roles", roleRoutes);
app.use("/api/permissions", permissionRoutes);
app.use("/api/users", userRoutes);
app.use("/api/teams", teamRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/resources", resourceRoutes);
app.use(
  "/api/access-requests",
  accessRequestRoutes
);

app.use(
  "/api/access-grants",
  accessGrantRoutes
);
app.use("/api/audit-logs", auditLogRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/ai-assistant", aiAssistantRoutes);
app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "DevAccess API is running",
  });
});
module.exports = app;