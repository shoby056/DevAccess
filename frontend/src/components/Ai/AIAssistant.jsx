
import { useEffect, useRef, useState } from "react";
import aiAssistantService from "../../services/aiAssistantService";


const INITIAL_MESSAGE = {
  role: "assistant",
  content:
    "Assalam-o-Alaikum! Main DevAccess AI Assistant hoon. Aap Users, Roles, Permissions, Projects, Access Requests, Audit Logs ya kisi bhi software feature ke baare mein pooch sakte hain.\n\nHow can I help you today?",
};

const SUGGESTIONS = [
  "How do I create a user?",
  "Role aur permissions kya hain?",
  "How do I change my password?",
  "DevAccess ke features explain karo",
];

const AIAssistant = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([INITIAL_MESSAGE]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      bottomRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "end",
      });

      inputRef.current?.focus();
    }
  }, [isOpen, messages, isLoading]);

  const sendMessage = async (text = message) => {
    const question = text.trim();

    if (!question || isLoading) return;

    const history = messages
      .filter((item) =>
        ["user", "assistant"].includes(item.role)
      )
      .slice(-10)
      .map(({ role, content }) => ({ role, content }));

    const userMessage = {
      role: "user",
      content: question,
    };

    setMessages((previous) => [
      ...previous,
      userMessage,
    ]);

    setMessage("");
    setError("");
    setIsLoading(true);

    try {
      const result = await aiAssistantService.chat({
        message: question,
        history,
      });

      setMessages((previous) => [
        ...previous,
        {
          role: "assistant",
          content: result.reply,
        },
      ]);
    } catch (err) {
      const errorMessage =
        err.response?.data?.message ||
        "Assistant se connection nahi ho saka. Dobara try karein.";

      setError(errorMessage);
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    sendMessage();
  };

  const handleKeyDown = (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      sendMessage();
    }
  };

  const resetChat = () => {
    setMessages([INITIAL_MESSAGE]);
    setMessage("");
    setError("");
  };

  return (
    <div className="ai-assistant-root">
      {isOpen && (
        <section
          className="ai-chat-panel"
          role="dialog"
          aria-label="DevAccess AI Assistant"
          aria-modal="false"
        >
          <header className="ai-chat-header">
            <div className="ai-chat-brand">
              <div className="ai-chat-logo">
                AI
              </div>

              <div className="ai-chat-heading">
                <strong>DevAccess Assistant</strong>
                <span>
                  <span className="ai-status-dot" />
                  Software help
                </span>
              </div>
            </div>

            <div className="ai-chat-actions">
              <button
                type="button"
                className="ai-icon-button"
                onClick={resetChat}
                title="Start a new chat"
                aria-label="Start a new chat"
              >
                ↻
              </button>

              <button
                type="button"
                className="ai-icon-button"
                onClick={() => setIsOpen(false)}
                title="Close assistant"
                aria-label="Close assistant"
              >
                ×
              </button>
            </div>
          </header>

          <div className="ai-chat-messages" aria-live="polite">
            {messages.map((item, index) => (
              <div
                key={`${index}-${item.role}`}
                className={`ai-message-row ${
                  item.role === "user"
                    ? "ai-message-user"
                    : "ai-message-assistant"
                }`}
              >
                {item.role === "assistant" && (
                  <div className="ai-message-avatar">
                    AI
                  </div>
                )}

                <div className="ai-message-bubble">
                  {item.content}
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="ai-message-row ai-message-assistant">
                <div className="ai-message-avatar">
                  AI
                </div>

                <div
                  className="ai-message-bubble ai-typing"
                  aria-label="Assistant is responding"
                >
                  <span />
                  <span />
                  <span />
                </div>
              </div>
            )}

            {error && (
              <div className="ai-chat-error" role="alert">
                {error}
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {messages.length === 1 && (
            <div className="ai-suggestions">
              <span>Try asking</span>

              {SUGGESTIONS.map((suggestion) => (
                <button
                  type="button"
                  key={suggestion}
                  disabled={isLoading}
                  onClick={() => sendMessage(suggestion)}
                >
                  {suggestion}
                </button>
              ))}
            </div>
          )}

          <form
            className="ai-chat-form"
            onSubmit={handleSubmit}
          >
            <textarea
              ref={inputRef}
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask anything about DevAccess..."
              aria-label="Your message"
              rows={1}
              maxLength={2000}
              disabled={isLoading}
            />

            <button
              type="submit"
              className="ai-send-button"
              disabled={isLoading || !message.trim()}
              aria-label="Send message"
            >
              ↑
            </button>
          </form>

          <footer className="ai-chat-footer">
            AI responses may be inaccurate. Verify important security decisions.
          </footer>
        </section>
      )}

      <button
        type="button"
        className={`ai-floating-button ${
          isOpen ? "ai-floating-button-open" : ""
        }`}
        onClick={() => setIsOpen((previous) => !previous)}
        aria-label={
          isOpen
            ? "Close AI Assistant"
            : "Open AI Assistant"
        }
        aria-expanded={isOpen}
      >
        {isOpen ? "×" : "✦"}
        {!isOpen && (
          <span className="ai-floating-label">
            Ask AI
          </span>
        )}
      </button>
    </div>
  );
};

export default AIAssistant;
