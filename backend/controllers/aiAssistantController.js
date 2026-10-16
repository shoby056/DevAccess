
const { getAssistantReply } = require("../services/aiAssistantService");

const chatWithAssistant = async (req, res) => {
  // 1. Validate authenticated DevAccess user
  const userId = req.user?.userId;

  if (!userId) {
    return res.status(401).json({
      success: false,
      message: "Your session has expired. Please sign in again.",
    });
  }

  try {
    // 2. Validate message
    const question =
      typeof req.body?.message === "string"
        ? req.body.message.trim()
        : "";

    if (!question) {
      return res.status(400).json({
        success: false,
        message: "Please enter a message.",
      });
    }

    if (question.length > 2000) {
      return res.status(400).json({
        success: false,
        message: "Message cannot exceed 2000 characters.",
      });
    }

    // 3. Validate conversation history
    const history = Array.isArray(req.body?.history)
      ? req.body.history
      : [];

    // 4. Request Gemini assistant response
    const reply = await getAssistantReply({
      question,
      history,
      userId,
    });

    if (typeof reply !== "string" || !reply.trim()) {
      throw new Error("AI service returned an empty response.");
    }

    return res.status(200).json({
      success: true,
      reply: reply.trim(),
    });
  } catch (error) {
    const status = Number(
      error.status || error.statusCode || error.response?.status
    );

    console.error("========== AI ASSISTANT ERROR ==========");
    console.error("Message:", error.message);
    console.error("Status:", status || "Unknown");
    console.error("Code:", error.code || "Unknown");
    console.error("Type:", error.type || "Unknown");
    console.error("========================================");

    // Missing Gemini API configuration
    if (
      error.code === "AI_NOT_CONFIGURED" ||
      error.statusCode === 503
    ) {
      return res.status(503).json({
        success: false,
        message:
          "Gemini AI is not configured. Check GEMINI_API_KEY in backend/.env and restart the backend.",
      });
    }

    // Gemini authentication failure
    if (status === 401 || status === 403) {
      return res.status(502).json({
        success: false,
        message:
          "Gemini rejected the API credentials or access. Check your API key and Google AI Studio project.",
      });
    }

    // Quota or rate limit
    if (status === 429) {
      return res.status(429).json({
        success: false,
        message:
          "Gemini API quota or rate limit reached. Check your model limits in Google AI Studio and try again later.",
      });
    }

    // Invalid model or request
    if (status === 400) {
      return res.status(400).json({
        success: false,
        message:
          "Gemini rejected the request. Check GEMINI_MODEL and the request configuration.",
      });
    }

    // Provider unavailable
    if ([500, 502, 503, 504].includes(status)) {
      return res.status(503).json({
        success: false,
        message:
          "Gemini AI is temporarily unavailable. Please try again shortly.",
      });
    }

    return res.status(500).json({
      success: false,
      message:
        "The assistant could not respond right now. Please check the backend logs.",
    });
  }
};

module.exports = { chatWithAssistant };
