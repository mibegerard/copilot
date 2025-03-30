import neo4j from "neo4j-driver";
import dotenv from "dotenv";

dotenv.config();

const driver = neo4j.driver(
  process.env.NEO4J_URI,
  neo4j.auth.basic(process.env.NEO4J_USERNAME, process.env.NEO4J_PASSWORD)
);

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
