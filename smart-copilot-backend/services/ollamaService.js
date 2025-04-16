import axios from "axios";
import dotenv from "dotenv";
import logger from "../utils/logger.js";

dotenv.config();

export const fetchFromOllama = async (prompt) => {
  try {
    const response = await axios.post(process.env.OLLAMA_API, {
      model: "llama2",
      messages: [{ role: "user", content: prompt }],
      stream: false,
    });
    return response.data.message.content;
  } catch (error) {
    console.error("Error fetching from Ollama:", error.message);
    throw new Error("Failed to fetch response from Ollama");
  }
};

export const buildContextualPrompt = (userPrompt, context) => {
  logger.debug("Building contextual prompt", { contextLength: context?.length });

  return [
    {
      role: "system",
      content:
        `You are a senior technical assistant that always responds with clean, well-documented, and typed code.
          Include:
          - A full Python function with a descriptive name
          - Type hints
          - A full docstring (with Args and Returns)
          - Clean formatting
          - Then a brief explanation of what the function does and why it's structured that way.`
    },
    {
      role: "system",
      content: context || "No relevant context found in database."
    },
    {
      role: "user",
      content: `User request: ${userPrompt}\nRespond following the structure above.`
    }
  ];
};

