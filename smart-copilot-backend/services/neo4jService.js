import neo4j from "neo4j-driver";
import dotenv from "dotenv";

dotenv.config();

const driver = neo4j.driver(
  process.env.NEO4J_URI,
  neo4j.auth.basic(process.env.NEO4J_USERNAME, process.env.NEO4J_PASSWORD)
);

export const checkDatabaseConnection = async () => {
  const session = driver.session();

  try {
    // Vérifier la connexion en exécutant une requête simple
    const result = await session.run(`
      CALL db.labels() YIELD label
      RETURN label
    `);

    console.log("✅ Connected to Neo4j database successfully.");
    console.log("Available labels in the database:", result.records.map(record => record.get('label')));

    // Récupérer le nombre total de nœuds
    const nodeCountResult = await session.run(`
      MATCH (n)
      RETURN COUNT(n) AS nodeCount
    `);
    const nodeCount = nodeCountResult.records[0].get('nodeCount');
    console.log("Total number of nodes in the database:", nodeCount);

    // Récupérer le nombre total de relations
    const relationshipCountResult = await session.run(`
      MATCH ()-[r]->()
      RETURN COUNT(r) AS relationshipCount
    `);
    const relationshipCount = relationshipCountResult.records[0].get('relationshipCount');
    console.log("Total number of relationships in the database:", relationshipCount);

    return {
      success: true,
      labels: result.records.map(record => record.get('label')),
      nodeCount,
      relationshipCount,
    };
  } catch (err) {
    console.error("❌ Failed to connect to Neo4j database:", err.message);
    return { success: false, error: err.message };
  } finally {
    await session.close();
  }
};

// Search by trying each phrase one-by-one in order, until we find results
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

      // Log the query being executed
      console.log("Executing Neo4j query for term:", term);
      console.log("Query:", query);
      // Log the final query with the term injected
      console.log("Final Neo4j query with term injected:", query);

      const result = await session.run(query, { term });

      // Debug: Log raw Neo4j result
      console.log("Raw Neo4j result:", JSON.stringify(result.records, null, 2));

      // Debug: Log processed results
      const records = result.records.map(record => {
        const res = record.get('result');
        console.log("Processed result:", res);
        return res;
      });

      if (records.length > 0) {
        return records;
      }
    }

    // If no matches found at all
    return [];
  } catch (err) {
    console.error("Error in searchGraph:", err.message);
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
    console.log("Neo4j Query Result:", content);
    return content;
  } finally {
    await session.close();
  }
};
