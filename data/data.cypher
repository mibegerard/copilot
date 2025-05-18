// Configuration des URLs
:param {
  nodes_directories: "https://raw.githubusercontent.com/mibegerard/copilot/main/data/nodes_directories.csv",
  nodes_tags: "https://raw.githubusercontent.com/mibegerard/copilot/main/data/nodes_tags.csv",
  nodes_files: "https://raw.githubusercontent.com/mibegerard/copilot/main/data/nodes_files.csv",
  rels_file_directory: "https://raw.githubusercontent.com/mibegerard/copilot/main/data/rels_file_directory.csv",
  rels_file_tags: "https://raw.githubusercontent.com/mibegerard/copilot/main/data/rels_file_tags.csv"
};

// Create constraints
CREATE CONSTRAINT Directory_path_unique IF NOT EXISTS
FOR (n:Directory) REQUIRE n.path IS UNIQUE;

CREATE CONSTRAINT Tag_name_unique IF NOT EXISTS
FOR (n:Tag) REQUIRE n.name IS UNIQUE;

CREATE CONSTRAINT File_file_path_unique IF NOT EXISTS
FOR (n:File) REQUIRE n.file_path IS UNIQUE;

// 1. Load Directories (unchanged)
LOAD CSV WITH HEADERS FROM $nodes_directories AS row
MERGE (d:Directory {path: row.path:ID(Directory)});

// 2. Load Tags with content - MODIFIED SECTION
LOAD CSV WITH HEADERS FROM $nodes_tags AS row
MERGE (t:Tag {name: row.name:ID(Tag)})
SET t.content = row.content;  // Add content property

// 3. Load Files (unchanged)
LOAD CSV WITH HEADERS FROM $nodes_files AS row
MERGE (f:File {file_path: row.file_path:ID(File)})
SET
  f.content = row.content,
  f.last_updated = datetime(row.last_updated),
  f.author = row.author,
  f.version = toFloat(row.version);

// 4-5. Relationships (unchanged)
LOAD CSV WITH HEADERS FROM $rels_file_directory AS row
MERGE (file:File {file_path: row.:START_ID(File)})
MERGE (dir:Directory {path: row.:END_ID(Directory)})
MERGE (file)-[:IN_DIRECTORY]->(dir);

LOAD CSV WITH HEADERS FROM $rels_file_tags AS row
MERGE (file:File {file_path: row.:START_ID(File)})
MERGE (tag:Tag {name: row.:END_ID(Tag)})
MERGE (file)-[:HAS_TAG]->(tag);