import { fetchFromOllama, isCommonQuestion } from "./ollamaService.js";
import { searchGraph, searchVector, getSubventionModelGraph } from "./neo4jService.js";
import { classifyText } from "../utils/keywordsUtils.js";
import { hasCode, splitIntoSegments, detectLanguage } from "../utils/codeUtils.js";
import { generateEmbedding } from "./textEmbedding.js";
import logger from "../utils/logger.js";

export const processMessage = async (message) => {
  logger.info("🚀 Starting processMessage", { message });

  // ── Step 0: Check if it's a common question ──
  logger.info("Step 0: Checking if message is a common question...");
  const commonQuestionAnswer = await isCommonQuestion(message);
  logger.info("Step 0: isCommonQuestion response", { commonQuestionAnswer });

  let prompt;

  if (commonQuestionAnswer === "Yes") {
    logger.info("Step 0: Message is a common question. Using plain prompt.");
    prompt = message;
  } else {
    // ── Step 1: Load graph context ──────────────
    logger.info("Step 1: Loading graph context from Neo4j...");
    const graphContext = await getSubventionModelGraph();
    logger.info(`Step 1: Graph context loaded (${graphContext.length} connections)`);

    const modelStructure = graphContext
      .map(
        (c) =>
          `// ${c.connectionType}\nNodes: ${JSON.stringify(
            c.nodes,
            null,
            2
          )}\nRels: ${JSON.stringify(c.relationships, null, 2)}`
      )
      .join("\n\n");

    let dbContext = "";
    let vectorContext = "";
    let symbolicSearchHasResults = false;

    // ── Step 2: Symbolic graph search ──────────────
    logger.info("Step 2: Performing symbolic graph search...");
    const keywords = classifyText(message);
    logger.info("Step 2: Classified keywords", { keywords });

    const dbResults = await searchGraph(keywords.type, keywords.value);
    logger.info("Step 2: Graph search results received", { dbResults });

    if (
      dbResults &&
      ((Array.isArray(dbResults) && dbResults.length > 0) ||
        (typeof dbResults === "object" && Object.keys(dbResults).length > 0))
    ) {
      symbolicSearchHasResults = true;
      logger.info("Step 2: Symbolic search has results");

      if (Array.isArray(dbResults)) {
        dbContext = dbResults.map((r) => r.snippet).join("\n");
      } else if (dbResults.contents) {
        if (Array.isArray(dbResults.contents)) {
          dbContext = dbResults.contents
            .map(
              (file) =>
                `File: ${file.filename}\nPath: ${file.path}\nContent:\n${file.content}`
            )
            .join("\n\n");
        } else {
          const file = dbResults.contents;
          dbContext = `File: ${file.filename}\nPath: ${file.path}\nContent:\n${file.content}`;
        }
      }
      logger.info("Step 2: Constructed dbContext", { dbContextLength: dbContext.length });
    } else {
      logger.info("Step 2: No symbolic search results found. Will try vector search.");
    }

    // ── Step 3: Vector search if symbolic failed ──────────────
    if (!symbolicSearchHasResults) {
      logger.info("Step 3: Generating embedding for vector search...");
      const embedding = await generateEmbedding(message);
      logger.info("Step 3: Embedding generated");

      const vectorResults = await searchVector(embedding);
      logger.info("Step 3: Vector search results received", { vectorResults });

      if (vectorResults && vectorResults.length > 0) {
        vectorContext = vectorResults
          .map((res) => `// Source: ${res.source}\n${res.snippet}`)
          .join("\n\n");
        logger.info("Step 3: Constructed vectorContext", { vectorContextLength: vectorContext.length });
      } else {
        logger.info("Step 3: No vector search results found");
      }
    }

    // ── Step 4: Construct prompt ──────────────
    logger.info("Step 4: Constructing final prompt for Ollama...");
    prompt = `Use all the functions and graph context below:\n`;
    if (vectorContext) prompt += vectorContext + "\n";
    if (dbContext) prompt += dbContext + "\n";
    if (modelStructure) prompt += modelStructure + "\n";
    prompt += `to perform the task: "${message}"\nAnswer only in text.`;
    logger.info("Step 4: Prompt constructed", { promptLength: prompt.length });
  }

  // ── Step 5: Fetch response from Ollama ──────────────
  logger.info("Step 5: Fetching response from Ollama...");
  let ollamaResponse = await fetchFromOllama(prompt);
  logger.info("Step 5: Raw response received from Ollama", { ollamaResponse });

  // Ensure Ollama returns string
  if (!ollamaResponse || typeof ollamaResponse !== "string") {
    ollamaResponse = "Error fetching response from Ollama.";
    logger.error("Step 5: Ollama returned invalid response. Using fallback text.");
  }

  // ── Step 6: Detect code and language ──────────────
  logger.info("Step 6: Checking for code in response...");
  const containsCode = hasCode(ollamaResponse);
  let language = "plaintext";

  if (containsCode) {
    const segments = splitIntoSegments(ollamaResponse);
    const firstCode = segments.find((seg) => seg.type === "code");
    if (firstCode) {
      language = detectLanguage(firstCode.content) || "plaintext";
    }
  }
  logger.info("Step 6: Code detection completed", { containsCode, language });

  logger.info("✅ processMessage completed");

  return {
    response: ollamaResponse,
    metadata: { language, containsCode },
  };
};
