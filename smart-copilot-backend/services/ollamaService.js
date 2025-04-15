import axios from "axios";
import dotenv from "dotenv";

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
    { role: "system", content: "You are a knowledgeable assistant. Use this context:" },
    { role: "system", content: context || "No relevant context found" },
    { role: "user", content: userPrompt }
  ];
};
