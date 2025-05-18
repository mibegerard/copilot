import express from "express";
import { fetchFromOllama } from "../services/ollamaService.js";
import { searchGraph } from "../services/neo4jService.js";
import { classifyText } from "../utils/keywordsUtils.js";
import logger from "../utils/logger.js";

const router = express.Router();

router.post("/", async (req, res) => {
  try {
    const userMessage = req.body.message;
    logger.info("User Message received", { userMessage });

    // Extract keywords from the user message
    const keywords = classifyText(userMessage);
    logger.info("Nature of user text", { type: keywords.type});
    logger.info("Value Keywords", { value: keywords.value });

    // Query the database
    const dbResults = await searchGraph(keywords.type, keywords.value);

    // Construct the prompt using the database results
    const dbContext = dbResults.map((result) => result.snippet).join("\n");
    let prompt;
    if (dbContext) {
      prompt = dbContext;
      var searchDatabase = true;
    } else {
      prompt = userMessage;
      var searchDatabase = false;
    }

    // Fetch response from Ollama
    const ollamaResponse = await fetchFromOllama(searchDatabase, prompt);

    // Format the Ollama response and send it back
    res.json({ response: ollamaResponse });

  } catch (error) {
    logger.error("Error in chat route", { error });
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;