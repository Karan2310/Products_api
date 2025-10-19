import env from "../config/env.js";

const AUTH_HEADER_NAME = "x-chatbot-key";

export const authenticateChatbot = (req, res, next) => {
  if (!env.CHATBOT_API_KEY) {
    return res.status(503).json({ error: "Chatbot API key is not configured" });
  }

  const headerKey = req.headers[AUTH_HEADER_NAME];
  const authHeader = req.headers.authorization;

  const tokenFromHeader =
    typeof headerKey === "string" && headerKey.length > 0 ? headerKey : null;

  const tokenFromAuthorization =
    typeof authHeader === "string" && authHeader.startsWith("Bearer ")
      ? authHeader.slice(7).trim()
      : null;

  const provided = tokenFromHeader ?? tokenFromAuthorization;

  if (!provided || provided !== env.CHATBOT_API_KEY) {
    return res.status(401).json({ error: "Unauthorized chatbot client" });
  }

  return next();
};
