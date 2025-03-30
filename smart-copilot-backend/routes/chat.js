import express from "express";
import { fetchFromOllama } from "../services/ollamaService.js";
import { searchDatabase } from "../services/neo4jService.js";

const router = express.Router();

router.post("/", async (req, res) => {
  try {
    const userMessage = req.body.message;
    const dbContext = await searchDatabase(userMessage);
    console.log("Database Context:", dbContext);

    const prompt = `Based on this database content:\n${dbContext}\nAnswer the user: ${userMessage}`;
    console.log("Constructed Prompt:", prompt);

    const ollamaResponse = await fetchFromOllama(prompt);
    res.json({ response: ollamaResponse });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Something went wrong" });
  }
});

export default router;
