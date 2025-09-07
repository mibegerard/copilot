import neo4j from "neo4j-driver";
import dotenv from "dotenv";
import logger from "../utils/logger.js";

dotenv.config();

const driver = neo4j.driver(
  process.env.NEO4J_URI,
  neo4j.auth.basic(process.env.NEO4J_USERNAME, process.env.NEO4J_PASSWORD)
);

export const checkDatabaseConnection = async () => {
  const session = driver.session();

  try {
    const result = await session.run(`
      CALL db.labels() YIELD label
      RETURN label
    `);

    const nodeCountResult = await session.run(`
      MATCH (n)
      RETURN COUNT(n) AS nodeCount
    `);
    const nodeCount = nodeCountResult.records[0].get('nodeCount');

    const relationshipCountResult = await session.run(`
      MATCH ()-[r]->()
      RETURN COUNT(r) AS relationshipCount
    `);
    const relationshipCount = relationshipCountResult.records[0].get('relationshipCount');

    return {
      success: true,
      labels: result.records.map(record => record.get('label')),
      nodeCount,
      relationshipCount,
    };
  } catch (err) {
    return { success: false, error: err.message };
  } finally {
    await session.close();
  }
};

export const searchVector = async (embedding, topK = 5) => {
  const neo4jEmbedding = embedding.map(e => Number(e));
  const neo4jTopK = neo4j.int(topK);

  const sessionFile = driver.session({ defaultAccessMode: neo4j.session.READ });
  const sessionTag = driver.session({ defaultAccessMode: neo4j.session.READ });

  try {
    const fileQuery = `
      CALL db.index.vector.queryNodes('file_vector_index', $topK, $embedding)
      YIELD node, score
      WHERE node.vector IS NOT NULL
      RETURN node.content AS content, score, node.file_path AS source, 'File' AS type
      ORDER BY score DESC
    `;

    const tagQuery = `
      CALL db.index.vector.queryNodes('tag_vector_index', $topK, $embedding)
      YIELD node, score
      WHERE node.vector IS NOT NULL
      RETURN node.content AS content, score, node.name AS source, 'Tag' AS type
      ORDER BY score DESC
    `;

    const [fileResult, tagResult] = await Promise.all([
      sessionFile.run(fileQuery, { embedding: neo4jEmbedding, topK: neo4jTopK }),
      sessionTag.run(tagQuery, { embedding: neo4jEmbedding, topK: neo4jTopK })
    ]);

    const fileMapped = fileResult.records.map(r => ({
      snippet: r.get('content'),
      score: r.get('score'),
      source: `File: ${r.get('source')}`
    }));

    const tagMapped = tagResult.records.map(r => ({
      snippet: r.get('content'),
      score: r.get('score'),
      source: `Tag: ${r.get('source')}`
    }));

    const combined = [
      ...fileMapped,
      ...tagMapped
    ].sort((a, b) => b.score - a.score);

    logger.info("🔗 Combined and sorted results:", combined);

    const sliced = combined.slice(0, topK);
    logger.info(`✅ Returning top ${topK} results:`, sliced);

    return sliced;
  } catch (err) {
    logger.error("Vector search error:", {
      message: err.message,
      stack: err.stack,
      embedding: embedding?.slice(0, 5)
    });
    return [];
    
  } finally {
    await Promise.all([sessionFile.close(), sessionTag.close()]);
  }
};


export const searchGraph = async (type, value) => {
  const session = driver.session();

  try {
    let query = "";
    let result;

    if (type === "Directory") {
    // Handle directory path formatting more robustly
    const dirPrefix = value.toUpperCase().replace(/\s+/g, '') + "/";
    query = `
        MATCH (f:File)
        WHERE f.file_path STARTS WITH $dirPrefix
        RETURN collect({content: f.content, path: f.file_path}) AS files
    `;
    

    try {
        result = await session.run(query, { dirPrefix });
        const records = result.records;
        
        if (records.length === 0 || !records[0].get('files')?.length) {
            return {
                status: 'success',
                directory: dirPrefix,
                contents: []
            };
        }

        // Deserialize the files array
        const files = records[0].get('files');
        
        // Transform into a more usable format
        const directoryContents = files.map(file => ({
            path: file.path,
            content: file.content,
            filename: file.path.split('/').pop() // Extract filename
        }));

        directoryContents.forEach((file, index) => {
          logger.info(`\n📄 File ${index + 1}: ${file.filename}`);
          logger.info(`📁 Path: ${file.path}`);
          logger.info(`📏 Content length: ${file.content.length} characters`);
        });
        return {
            contents: directoryContents
        };

    } catch (error) {
        return {
            message: 'Failed to retrieve directory contents',
            error: error.message
        };
    }
} else if (type === "File") {
      // Improved file path handling
      const words = value.split('/');
      const normalizedWords = words.map(word => 
        word.replace(/_/g, '').replace(/\s+/g, '')
      );
      
      if (words.length > 1) {
        normalizedWords[0] = normalizedWords[0].toUpperCase();
      } else {
        const [first, ...rest] = value.split(' ');
        normalizedWords[0] = `${first.toUpperCase()}/${first.toLowerCase()}${rest.join('').toLowerCase()}`;
      }

      const filePath = normalizedWords.join('/');
      query = `
        MATCH (f:File)
        WHERE toLower(REPLACE(REPLACE(f.file_path, "_", ""), ".py", "")) = toLower($filePath)
        RETURN f.content AS result, f.file_path AS path
        LIMIT 1
      `;

      result = await session.run(query, { filePath });
      if (result.records.length > 0) {
        logger.info("📊 Raw records:", JSON.stringify(result.records, null, 2));
        logger.info("📊 Record fields:", Object.keys(result.records[0]?.toObject?.() || {}));
        logger.info("📊 Record toObject:", result.records[0]?.toObject?.());

        // Retrieve all results, not just the first
        const allResults = result.records.map(record => ({
          snippet: record.get("result"),
          source: `File: ${record.get("path")}`
        }));
        
        return allResults;
      } else {
        logger.info(`📄 File not found: ${filePath}`);
      }

    } else if (type === "Tag") {
      const tagNames = Array.isArray(value) ? value : [value];
      query = `
        WITH $tagNames AS keywords
        MATCH (t:Tag)
        WHERE ANY(keyword IN keywords WHERE
            toLower(REPLACE(t.name, "_", "")) = toLower(REPLACE(keyword, " ", ""))
          )
          AND t.content IS NOT NULL AND t.content <> "No content found"
        RETURN t.content AS result, t.name AS name
        LIMIT 3
      `;

      result = await session.run(query, { tagNames });
      if (result.records.length > 0) {
        const allResults = result.records.map(record => ({
          snippet: record.get("result"),
          source: `Tag: ${record.get("name")}`
        }));
        return allResults;
      } else {
        logger.info(`🏷️ No matching tags found for:`, tagNames);
      }
    }

  } catch (err) {
    console.error("❌ Error in searchGraph:", err.message);
    console.error("Stack trace:", err.stack);
  } finally {
    await session.close();
  }
};

export async function getSubventionModelGraph() {
  const session = driver.session({ defaultAccessMode: neo4j.session.READ });

  const query = `
    // 1. Direct contract connections
    MATCH path1 = (sc:SmartContractPSU {name: 'subvention'})-[r]-(connected)
    RETURN path1 AS path, 'Direct Contract Connection' AS connection_type

    UNION ALL

    // 2. Internal component relationships
    MATCH path2 = (src)-[r]-(dest)
    WHERE ANY(label IN labels(src) WHERE label IN [
          'Hook', 'Workflow', 'Entity', 'Parameter',
          'DataShape', 'Timeseries', 'PostingInstruction',
          'NotificationType', 'Address'
        ])
      AND ANY(label IN labels(dest) WHERE label IN [
          'Hook', 'Workflow', 'Entity', 'Parameter',
          'DataShape', 'Timeseries', 'PostingInstruction',
          'NotificationType', 'Address'
        ])
      AND NOT (src:SmartContractPSU OR dest:SmartContractPSU)
    RETURN path2 AS path, 'Internal Component Connection' AS connection_type

    UNION ALL

    // 3. Parameter → Shape
    MATCH path3 = (p:Parameter)-[:USES_SHAPE]->(ds:DataShape)
    RETURN path3 AS path, 'Parameter-Shape Connection' AS connection_type

    UNION ALL

    // 4. Hook → Timeseries
    MATCH path4 = (h:Hook)-[:REQUIRES]->(t:Timeseries)
    RETURN path4 AS path, 'Hook-Timeseries Requirement' AS connection_type

    UNION ALL

    // 5. Shape → Parameter
    MATCH path5 = (ds:DataShape)-[:HAS_SHAPE]->(p:Parameter)
    RETURN path5 AS path, 'Shape-Has-Parameter' AS connection_type

    UNION ALL

    // 6. OptionalShape → Wrapped Shape
    MATCH path6 = (opt:DataShape)-[:WRAPS]->(wrapped:DataShape)
    RETURN path6 AS path, 'OptionalShape Wraps' AS connection_type

    UNION ALL

    // 7. Parameter → ParameterCategory
    MATCH path7 = (p:Parameter)-[:BELONGS_TO]->(cat:ParameterCategory)
    RETURN path7 AS path, 'Parameter Category Link' AS connection_type

    UNION ALL

    // 8. SmartContract → Constants
    MATCH path8 = (sc:SmartContractPSU {name: 'subvention'})-[:HAS_CONSTANT]->(c:Constant)
    RETURN path8 AS path, 'Contract Constant Link' AS connection_type

    UNION ALL

    // 9. Workflow Operational
    MATCH path9 = (w:Workflow)-[:POOLS_FUNDS_FROM|CHECKS_BALANCE_AT|GENERATES_BATCH|EXECUTES_INSTRUCTION]->(x)
    RETURN path9 AS path, 'Workflow Operational Link' AS connection_type

    UNION ALL

    // 10. Entity → Entity
    MATCH path10 = (e1:Entity)-[:HAS_LINK]->(e2:Entity)
    RETURN path10 AS path, 'Entity Link' AS connection_type

    UNION ALL

    // 11. Hook → Notification
    MATCH path11 = (h:Hook)-[:EMITS_NOTIFICATION]->(n:NotificationType)
    RETURN path11 AS path, 'Hook Emits Notification' AS connection_type
  `;

  try {
    const result = await session.run(query);

    const paths = result.records.map(record => {
      const path = record.get('path');
      const type = record.get('connection_type');

      const nodes = path.segments.map(segment => segment.start)
        .concat(path.segments.map(segment => segment.end));
      const relationships = path.segments.map(segment => segment.relationship);

      return {
        connectionType: type,
        nodes: [...new Map(nodes.map(n => [n.identity.toString(), {
          id: n.identity.toString(),
          labels: n.labels,
          properties: n.properties
        }])).values()],
        relationships: relationships.map(rel => ({
          id: rel.identity.toString(),
          type: rel.type,
          startNode: rel.start.toString(),
          endNode: rel.end.toString(),
          properties: rel.properties
        }))
      };
    });

    return paths;
  } catch (error) {
    console.error("Error retrieving subvention model graph:", error);
    throw error;
  } finally {
    await session.close();
  }
}

export default {
  checkDatabaseConnection,
  searchVector,
  searchGraph,
  getSubventionModelGraph
};