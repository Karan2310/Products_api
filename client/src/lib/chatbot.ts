const DEFAULT_CHATBOT_ENDPOINT = "https://dummy-chatbot.local/api/events";

type ChatbotEventPayload = Record<string, unknown>;

const endpoint = process.env.NEXT_PUBLIC_CHATBOT_URL ?? DEFAULT_CHATBOT_ENDPOINT;

export const sendChatbotEvent = async (event: string, data: ChatbotEventPayload) => {
  try {
    await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ event, data }),
    });
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.debug("chatbot event failed", event, error);
    }
  }
};
