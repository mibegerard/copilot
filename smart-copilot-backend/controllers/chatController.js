import { processMessage } from "../services/chatService.js";
import logger from "../utils/logger.js";

export const handleChat = async (req, res) => {
  const { message } = req.body;

  if (!message) {
    return res.status(400).json({ error: "Message is required" });
  }

  try {
    const result = await processMessage(message);
    res.json({ success: true, userMessage: message, ...result });
  } catch (error) {
    logger.error("Error handling chat message", { error });
    res.status(500).json({ error: "Internal server error" });
  }
};
