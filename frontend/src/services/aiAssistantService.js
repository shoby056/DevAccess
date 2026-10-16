
import api from "./api";

const chat = async ({ message, history = [] }) => {
  const response = await api.post("/ai-assistant/chat", {
    message,
    history,
  });

  return response.data;
};

const aiAssistantService = { chat };

export default aiAssistantService;
