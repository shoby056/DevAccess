
const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const {
  chatWithAssistant,
} = require("../controllers/aiAssistantController");

const router = express.Router();

// Every chat request requires a valid JWT.
router.post("/chat", authMiddleware, chatWithAssistant);

module.exports = router;
