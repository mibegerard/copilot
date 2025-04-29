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

export const searchGraph = async (termsArray, intent) => {
  const session = driver.session();

  try {
    for (const term of termsArray) {
      const query = `
        WITH "${term}" AS term

        OPTIONAL MATCH (t:Tag)
        WHERE toLower(REPLACE(t.name, "_", "")) = toLower(REPLACE(term, " ", ""))
          AND t.content IS NOT NULL AND t.content <> "No content found"

        OPTIONAL MATCH (f:File)
        WHERE toLower(REPLACE(f.name, "_", "")) = toLower(REPLACE(term, " ", ""))
          AND f.content IS NOT NULL AND f.content <> "No content found"

        OPTIONAL MATCH (d:Directory)
        WHERE toLower(REPLACE(d.name, "_", "")) = toLower(REPLACE(term, " ", ""))
          AND d.content IS NOT NULL AND d.content <> "No content found"

        WITH COLLECT(DISTINCT {
          file: f,
          directory: d,
          tag: t
        }) AS matches

        UNWIND matches AS match
        RETURN {
          type: CASE
            WHEN match.tag IS NOT NULL THEN 'Tag'
            WHEN match.file IS NOT NULL THEN 'File'
            WHEN match.directory IS NOT NULL THEN 'Directory'
            ELSE 'Unknown'
          END,
          name: COALESCE(match.file.file_path, match.directory.path, match.tag.name),
          content: COALESCE(match.tag.content, match.file.content, match.directory.content),
          snippet: COALESCE(
            REDUCE(s = '', t IN [match.tag] | 
              CASE WHEN t.content IS NOT NULL THEN s + t.content + '\n' ELSE s END
            ), 
            match.file.content
          ),
          confidence: 1.0
        } AS result
        ORDER BY result.confidence DESC
        LIMIT 3
      `;

      logger.info("Executing Neo4j query for term:", term);
      logger.debug("Query:", query);
      logger.debug("Final Neo4j query with term injected:", query);

      const result = await session.run(query, { term });

      logger.debug("Raw Neo4j result:", JSON.stringify(result.records, null, 2));

      const records = result.records.map(record => {
        const res = record.get('result');
        logger.debug("Processed result:", res);
        return res;
      });

      if (records.length > 0) {
        return records;
      }
    }

    return [];
  } catch (err) {
    logger.error("Error in searchGraph:", err.message);
    return [];
  } finally {
    await session.close();
  }
};

export const searchDatabase = async (query) => {
  const session = driver.session();
  try {
    const result = await session.run(
      `MATCH (n:sc_database)
       WHERE toLower(n.FilePath) CONTAINS toLower($query) OR toLower(n.Content) CONTAINS toLower($query)
       RETURN n.Content AS content LIMIT 1`,
      { query }
    );
    const content = result.records.map((record) => record.get("content")).join("\n");
    logger.info("Neo4j Query Result:", content);
    return content;
  } finally {
    await session.close();
  }
};
