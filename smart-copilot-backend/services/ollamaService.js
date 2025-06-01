import axios from "axios";
import dotenv from "dotenv";
import logger from "../utils/logger.js";

dotenv.config();

/**
 * Fetches a response from the Ollama LLM API based on Neo4j query results.
 * @param {string} input - If successful, contains the content from Neo4j. 
 *                         If not, it contains the original user prompt or question.
 * @returns {Promise<string>} The response content from either Neo4j or the Ollama model.
 *
 * If Neo4j returns valid content, that content is returned directly.
 * Otherwise, the function sends the user's question to Ollama and returns the AI's response.
 */
export const fetchFromOllama = async (input) => {
  try {
    logger.info("🤖 Querying Ollama model due with prompt");
    const response = await axios.post(process.env.OLLAMA_API, {
      model: process.env.OLLAMA_CODE_MODEL,
      messages: [{ role: "user", content: input }],
      stream: false,
    });

    const result = response.data?.message?.content;
    logger.info("✅ Received response from Ollama.");
    return result;

  } catch (error) {
    logger.error("❌ Error while querying Ollama:", error.message);
    return "Sorry, something went wrong while processing your request.";
  }
};
