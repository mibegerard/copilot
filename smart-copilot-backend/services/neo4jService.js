import neo4j from "neo4j-driver";
import dotenv from "dotenv";
import logger from "../utils/logger.js";

dotenv.config();

const driver = neo4j.driver(
  process.env.NEO4J_URI,
  neo4j.auth.basic(process.env.NEO4J_USERNAME, process.env.NEO4J_PASSWORD)
);

logger.info("Neo4j Credentials:");
logger.info("URI:", process.env.NEO4J_URI);
logger.info("Username:", process.env.NEO4J_USERNAME);
logger.info("Password:", process.env.NEO4J_PASSWORD ? "******" : "Not Set");

export const checkDatabaseConnection = async () => {
  const session = driver.session();

  try {
    const result = await session.run(`
      CALL db.labels() YIELD label
      RETURN label
    `);

    logger.info("✅ Connected to Neo4j database successfully.");
    logger.info("Available labels in the database:", result.records.map(record => record.get('label')));

    const nodeCountResult = await session.run(`
      MATCH (n)
      RETURN COUNT(n) AS nodeCount
    `);
    const nodeCount = nodeCountResult.records[0].get('nodeCount');
    logger.info("Total number of nodes in the database:", nodeCount);

    const relationshipCountResult = await session.run(`
      MATCH ()-[r]->()
      RETURN COUNT(r) AS relationshipCount
    `);
    const relationshipCount = relationshipCountResult.records[0].get('relationshipCount');
    logger.info("Total number of relationships in the database:", relationshipCount);

    return {
      success: true,
      labels: result.records.map(record => record.get('label')),
      nodeCount,
      relationshipCount,
    };
  } catch (err) {
    logger.error("❌ Failed to connect to Neo4j database:", err.message);
    return { success: false, error: err.message };
  } finally {
    await session.close();
  }
};

export const searchGraph = async (type, value) => {
  const session = driver.session();
  logger.info("🔍 Searching in Neo4j database...");

  try {
    let query = "";
    let result;

    if (type === "Directory") {
      const dirPrefix = value.toUpperCase() + "/";
      query = `
        MATCH (f:File)
        WHERE f.file_path STARTS WITH $dirPrefix
        RETURN collect(f.content) AS result
      `;
      logger.info(`📁 Searching for all files in directory: ${dirPrefix}`);
      logger.info("🧠 Query:", query.trim());
      logger.info("📦 Params:", { dirPrefix });

      result = await session.run(query, { dirPrefix });

      const contents = result.records[0]?.get("result") || [];
      if (contents.length > 0) {
        const combinedContent = contents.join("\n\n");
        return [{
          snippet: combinedContent,
          source: `Directory: ${dirPrefix}`
        }];
      }

    } else if (type === "File") {
        const words = value.split('/');

        if (words.length > 1) {
          words[0] = words[0].toUpperCase();
        } else {
          const upper = value.split(' ')[0].toUpperCase();
          const rest = value.replace(/_/g, '');
          words[0] = `${upper}/${rest}`;
        }

        const filePath = words.join('/');
        query = `
          MATCH (f:File)
          WHERE toLower(REPLACE(REPLACE(f.file_path, "_", ""), ".py", "")) = toLower(REPLACE($filePath, " ", ""))
          RETURN f.content AS result
          LIMIT 1
        `;

        logger.info(`📄 Searching file content for: ${value}`);
        logger.info(`📂 Reconstructed file path: ${filePath}`);
        logger.info(`🧠 Query: ${query.trim()}`);
        logger.info(`📦 Params: ${JSON.stringify({ filePath })}`);

        result = await session.run(query, { filePath });

        const content = result.records[0]?.get("result");
        if (content) {
          return [{
            snippet: content,
            source: `File: ${value}`
          }];
        }
      }
      else if (type === "Tag") {
      query = `
        WITH $tagName AS keywords
        MATCH (t:Tag)
        WHERE ANY(keyword IN keywords WHERE
            toLower(REPLACE(t.name, "_", "")) = toLower(REPLACE(keyword, " ", ""))
          )
          AND t.content IS NOT NULL AND t.content <> "No content found"
        RETURN t.content AS result, t.name AS name
        LIMIT 1
      `;
      logger.info(`🏷️ Searching for tag: ${value}`);
      logger.info("🧠 Query:", query.trim());
      logger.info("📦 Params:", { tagName: value });

      result = await session.run(query, { tagName: value });

      const tagContent = result.records[0]?.get("result");
      if (tagContent) {
        return [{
          snippet: tagContent,
          source: `Tag: ${value}`
        }];
      }
    }

    return [];

  } catch (err) {
    logger.error("❌ Error in searchGraph:", err.message);
    return [];
  } finally {
    await session.close();
  }
};
