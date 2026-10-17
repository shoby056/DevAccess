
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

// Allowed frontend origins
const allowedOrigins = [
  "http://localhost:5173",
  "https://dev-access-l26w.vercel.app",
  "https://dev-access-l26w-223wmwcjq-muhammad-shoaibs-projects-b9c8198d.vercel.app",
];

// Middleware
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests without an Origin header
      // (for example, health checks or server-to-server calls).
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error("Not allowed by CORS"));
    },
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json());

// Health check
app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "DevAccess API is running",
  });
});

// Authentication routes
app.use("/api/auth", authRoutes);

// Other API routes
app.use("/api/roles", roleRoutes);
app.use("/api/permissions", permissionRoutes);
app.use("/api/users", userRoutes);
app.use("/api/teams", teamRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/resources", resourceRoutes);
app.use("/api/access-requests", accessRequestRoutes);
app.use("/api/access-grants", accessGrantRoutes);
app.use("/api/audit-logs", auditLogRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/ai-assistant", aiAssistantRoutes);

// Root route
app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "DevAccess API is running",
  });
});

module.exports = app;
