import express from "express";
import { fetchFromOllama } from "../services/ollamaService.js";
import { searchGraph } from "../services/neo4jService.js";
import { classifyText } from "../utils/keywordsUtils.js";
import { hasCode, splitIntoSegments } from "../utils/codeUtils.js";
import { searchVector } from "../services/neo4jService.js";
import { generateEmbedding } from "../services/textEmbedding.js";
import { getSubventionModelGraph } from "../services/neo4jService.js";
import { detectLanguage } from "../utils/codeUtils.js";
import logger from "../utils/logger.js";

const router = express.Router();

router.post("/", async (req, res) => {
  try {
    const text = req.body.message;
    logger.info("User Message received", { text });

    // Load full subvention model graph context
    const graphContext = await getSubventionModelGraph();
    const modelStructure = graphContext.map(c =>
        `// ${c.connectionType}\n` +
        `Nodes: ${JSON.stringify(c.nodes, null, 2)}\n` +
        `Rels: ${JSON.stringify(c.relationships, null, 2)}`
    ).join('\n\n');
    logger.info('🔍 Loaded subvention model graph context.');
    logger.debug(`Model structure: ${modelStructure}`);


    let dbContext = '';
    let vectorContext ='';
    let symbolicSearchHasResults = false;
    let prompt = text;

    // ── Étape 1 : Symbolic graph search ─────────────────────────
    const keywords = classifyText(text);
    logger.info(`🔍 Classifying text: ${text}`);
    const dbResults = await searchGraph(keywords.type, keywords.value);

    // Handle different response formats from searchGraph
    if (
      dbResults &&
      (
      (Array.isArray(dbResults) && dbResults.length > 0) ||
      (typeof dbResults === 'object' && Object.keys(dbResults).length > 0)
      )
    ) {
      symbolicSearchHasResults = true;
      if (Array.isArray(dbResults)) {
      // Handle array response format
      logger.info('🔎 Found results via symbolic graph search (array format)');
      dbContext = dbResults.map(r => r.snippet).join('\n');
      } else if (dbResults.contents) {
      // Handle directory contents format
      logger.info('🔎 Found results via symbolic graph search (contents format)');
      if (Array.isArray(dbResults.contents)) {
        dbContext = dbResults.contents
        .map(file => `File: ${file.filename}\nPath: ${file.path}\nContent:\n${file.content}`)
        .join('\n\n');
      } else {
        // Handle single file case
        const file = dbResults.contents;
        dbContext = `File: ${file.filename}\nPath: ${file.path}\nContent:\n${file.content}`;
      }
      }

      if (dbContext) {
      logger.debug(`Database context:\n${dbContext}`);
      } else {
      logger.warn('Unexpected response format from searchGraph:', dbResults);
      }
      logger.info(`🔎 Found results via symbolic graph search. ${dbContext}`);
    }

    // ── Étape 2 : Vector similarity search if no symbolic results ──────────────
    if (!symbolicSearchHasResults) {
      logger.info('No valid results from symbolic graph search, proceeding to vector similarity search.');
      const embedding = await generateEmbedding(text);
      logger.info('🔍 Generating embedding for vector search.');
      const vectorResults = await searchVector(embedding);

      if (vectorResults && vectorResults.length > 0) {
      logger.info('🔎 Found results via vector search.');
      vectorContext = vectorResults.map(res =>
        `// Source: ${res.source}\n${res.snippet}`
      ).join('\n\n');
    }
    }

    // ── Étape 3 : Constructing the prompt ─────────────────────────
    prompt = `Use all the functions and graph context below:\n`;
    if (vectorContext) prompt += vectorContext + "\n";
    if (dbContext) prompt += dbContext + "\n";
    prompt += `to perform the task: "${text}"`;

  logger.info("Constructed prompt for Ollama", { prompt });

    // Fetch response from Ollama
    const ollamaResponse = await fetchFromOllama(prompt);

    let language = "plaintext";
    if (hasCode(ollamaResponse)) {
      const segments = splitIntoSegments(ollamaResponse);
      const firstCode = segments.find(seg => seg.type === "code");
      if (firstCode) {
        language = detectLanguage(firstCode.content) || "plaintext";
      }
    }

    const containsCode = hasCode(ollamaResponse);
    
    logger.info("Language detected", { language: language ?? "undefined" });
    logger.info("Contains code detected", { containsCode });
    
    res.json({ 
      response: prompt,
      metadata: {
        language: language,
        containsCode: containsCode
      }
    });
    return;
    

  } catch (error) {
    logger.error("Error in chat route", { error });
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;