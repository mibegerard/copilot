import express from "express";
import { fetchFromOllama } from "../services/ollamaService.js";
import { searchGraph } from "../services/neo4jService.js";
import { extractTechnicalKeywords, generateKeywordCombinations } from "../utils/keywordsUtils.js";
import logger from "../utils/logger.js";

const router = express.Router();

router.post("/", async (req, res) => {
  try {
    const userMessage = req.body.message;
    logger.info("User Message received", { userMessage });

    // Extract keywords from the user message
    const keywords = extractTechnicalKeywords(userMessage);
    logger.info("Extracted Keywords", { keywords });

    // Generate keyword combinations
    const keywordCombinations = generateKeywordCombinations(keywords);
    logger.info("Generated Keyword Combinations", { keywordCombinations });

    // Query the database using the keyword combinations
    const dbResults = [];
    for (const combination of keywordCombinations) {
      logger.info("Executing Neo4j query for combination", { combination });
      const result = await searchGraph([combination], "intent");
      logger.info("Neo4j query result", { combination, result });
      if (result.length > 0) {
        dbResults.push(...result);
      }
    }
    // Debug: Log the final database results
    console.log("Final Database Results:", JSON.stringify(dbResults, null, 2));
    logger.info("Database Results fetched", { dbResults });

    // Construct the prompt using the database results
    const dbContext = dbResults.map((result) => result.snippet).join("\n");
    const prompt = `Based on this database content:\n${dbContext}\nAnswer the user: ${userMessage}`;
    logger.info("Constructed Prompt", { prompt });

    // Fetch response from Ollama
    const ollamaResponse = await fetchFromOllama(prompt);
    logger.info("Response from Ollama", { ollamaResponse });

    res.json({ response: ollamaResponse });
  } catch (err) {
    logger.error("Error occurred", { error: err.message });
    res.status(500).json({ error: "Something went wrong" });
  }
});

export default router;