import axios from "axios";
import dotenv from "dotenv";
import logger from "../utils/logger.js";

dotenv.config();

/**
 * Fetches a response from the Ollama LLM API.
 * @param {string} input - The user query or processed prompt.
 * @returns {Promise<string>} The response from Ollama.
 */
export const fetchFromOllama = async (input) => {
  try {
    logger.info("🤖 Querying Ollama model with prompt");
    const response = await axios.post(process.env.OLLAMA_API_FULL, {
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

const COMMON_PATTERNS = [
  /^hi\b/i,
  /^hello\b/i,
  /^hey\b/i,
  /^how (are|is) you/i,
  /^what is the capital of/i,
  /^what's the weather/i,
  /^what time/i,
  /^who is/i,
  /^tell me about/i,
  /^show me/i
];

/**
 * Queries Ollama to check if input is a "common question".
 * Returns strictly "Yes" or "No".
 * @param {string} text - The text to evaluate.
 * @returns {Promise<string>} "Yes" or "No"
 */
export const isCommonQuestion = async (text) => {
  // Rule-based pre-filter
  if (COMMON_PATTERNS.some((pattern) => pattern.test(text))) {
    logger.info("✅ Matched rule-based common question pattern");
    return "Yes";
  }
  try {
    logger.info("🤖 Checking if input is a common question");

    // Few-shot prompt with examples for Ollama
    const prompt = `
You are an assistant that classifies questions as either:
- Common: trivial, greetings, small talk, or factual questions unrelated to our research
- Research: related to subventions, balances, vaults, postings, or other project-specific queries

Answer strictly with "Yes" if the question is common, or "No" if it is research-related.

Examples:
Q: "Hello, how are you?" → Yes
Q: "What is the capital of France?" → Yes
Q: "Hey, tell me a joke" → Yes
Q: "Show subventions for project X" → No
Q: "Calculate the balances for vault A" → No
Q: "List all postings for today" → No
Q: "What is 2 + 2?" → Yes
Q: "Who won the 2024 election?" → Yes

Now classify this question:
"${text}"
`;

    const response = await axios.post(`${process.env.OLLAMA_API}/api/chat`, {
      model: process.env.OLLAMA_CODE_MODEL,
      messages: [{ role: "user", content: prompt }],
      stream: false,
      temperature: 0,
    });

    let answer = response.data?.message?.content;
    logger.info("Raw isCommonQuestion response", { answer });

    if (!answer) {
      logger.warn("⚠️ Ollama returned empty response for common question check");
      return "No";
    }

    // Clean response: trim whitespace and remove any leading newline
    answer = answer.replace(/^\s+/, "").replace(/\s+$/, "");

    // Force Yes/No output if model outputs anything unexpected
    if (!["Yes", "No"].includes(answer)) {
      logger.warn("⚠️ Ollama returned unexpected answer, defaulting to 'No'");
      answer = "No";
    }

    logger.info("✅ isCommonQuestion response", { answer });
    return answer;

  } catch (error) {
    logger.error("❌ Error while checking if common question:", error.message);
    return "No";
  }
};
