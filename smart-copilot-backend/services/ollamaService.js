import axios from "axios";
import dotenv from "dotenv";
import logger from "../utils/logger.js";

dotenv.config();

/**
 * Fetches a response from the Ollama LLM API based on Neo4j query results.
 *
 * @param {boolean} isNeo4jSuccess - Indicates whether the Neo4j query was successful.
 * @param {string} input - If successful, contains the content from Neo4j. 
 *                         If not, it contains the original user prompt or question.
 * @returns {Promise<string>} The response content from either Neo4j or the Ollama model.
 *
 * If Neo4j returns valid content, that content is returned directly.
 * Otherwise, the function sends the user's question to Ollama and returns the AI's response.
 */
export const fetchFromOllama = async (isNeo4jSuccess, input) => {
  try {
    logger.info("🔍 Checking if Neo4j returned valid content...");
    logger.info("Neo4j content:", { input }); 
    logger.info("Neo4j success status:", { isNeo4jSuccess });
    if (isNeo4jSuccess) {
      logger.info("✅ Returning content from Neo4j (no LLM call needed).");
      return input;
    }

    logger.info("🤖 Querying Ollama model due to missing result in Neo4j...");
    const response = await axios.post(process.env.OLLAMA_API, {
      model: "llama2",
      messages: [{ role: "user", content: input }],
      stream: false,
    });

    const result = response.data?.message?.content || "No response from Ollama.";
    logger.info("✅ Received response from Ollama.");
    return result;

  } catch (error) {
    logger.error("❌ Error while querying Ollama:", error.message);
    return "Sorry, something went wrong while processing your request.";
  }
};
