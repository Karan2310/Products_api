import env from "../config/env.js";

const DEFAULT_TIMEOUT_MS = 3_000;

const buildHeaders = () => {
  const headers = new Headers();
  headers.set("Content-Type", "application/json");

  if (env.CHATBOT_API_KEY) {
    headers.set("Authorization", `Bearer ${env.CHATBOT_API_KEY}`);
  }

  return headers;
};

export const dispatchChatbotEvent = async (event, data) => {
  if (!env.CHATBOT_API_URL) {
    return false;
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);

    const response = await fetch(env.CHATBOT_API_URL, {
      method: "POST",
      headers: buildHeaders(),
      body: JSON.stringify({ event, data }),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!response.ok) {
      console.warn("Chatbot event failed", event, await response.text().catch(() => ""));
      return false;
    }

    return true;
  } catch (error) {
    console.warn("Chatbot event dispatch error", event, error);
    return false;
  }
};
