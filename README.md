```markdown
# Smart Copilot


## **Project Overview**

**Smart Copilot** is a hybrid knowledge retrieval and AI reasoning system that combines:

- **Neo4j Graph Database** for structured data storage.  
- **Ollama Large Language Model (LLM)** for AI-driven semantic search and reasoning.

It enables users to search, analyze, and interact with complex datasets, including **files, directories, tags, workflows, smart contracts, and parameters**.  

The system supports:

- Graph-based queries  
- Semantic vector search  
- AI-augmented responses when direct data is unavailable  
- Visualization-ready graph retrieval for audits or analytics  

---

## **Features**

- **Database Health Check:** Verify connection and retrieve database schema.  
- **Graph Search:** Lookup files, directories, or tags in Neo4j.  
- **Vector Search:** Semantic search using text embeddings.  
- **AI Responses:** Query Ollama LLM when Neo4j data is insufficient.  
- **Subvention Model Graph:** Extract structured graph relationships from Smart Contracts.  
- **Chat Interface:** Send queries and receive AI responses in a structured format.  

---

---

## **Installation**

### 1. Clone the repository
```bash
git clone https://github.com/mibegerard/copilot.git
cd sc-copilot
````

### 2. Configure environment variables

Create a `.env` file at the root of `smart-copilot-backend`:

```ini
NODE_ENV=development
PORT=5000
NEO4J_URI=bolt://localhost:7687
NEO4J_USERNAME=neo4j
NEO4J_PASSWORD=yourpassword
OLLAMA_API=http://localhost:11434
OLLAMA_CODE_MODEL=nomic-code-model
OLLAMA_EMBEDDING_MODEL=nomic-embed-text
```

### 3. Start services using Docker Compose

```bash
docker-compose up --build
```

This will start:

* Neo4j database at port 7474
* Backend at port 5050
* Frontend at port 3000
* Ollama LLM at port 11434

---

## **Backend API Endpoints**

### **Health Check**

```bash
GET /api/health
```

Checks database connectivity and returns the status.

### **Search Graph**

```bash
POST /api/search-graph
Body: { type: "File" | "Directory" | "Tag", value: "search_term" }
```

Returns relevant files, directories, or tag content from Neo4j.

### **Vector Search**

```bash
POST /api/search-vector
Body: { embedding: [number], topK: 5 }
```

Returns the top K semantically similar nodes using embeddings.

### **Chat (Ollama)**

```bash
POST /api/chat
Body: { message: "Your question or prompt" }
```

Returns a structured AI response from Ollama.

### **Subvention Model Graph**

```bash
GET /api/subvention-graph
```

Returns a structured representation of smart contract relationships.

---

## **Core Backend Services**

### **Neo4j Integration**

Handles graph connection, queries, and session management.

**Functions:**

* `checkDatabaseConnection()` → checks DB status and logs labels, node & relationship count.
* `searchGraph(type, value)` → searches nodes by directory, file, or tag.
* `searchVector(embedding, topK)` → semantic vector search.
* `getSubventionModelGraph()` → extracts a subvention model graph.

### **Ollama AI Integration**

**Functions:**

* `generateEmbedding(text)` → converts text to vector embeddings.
* `fetchFromOllama(input)` → fetches AI responses if Neo4j data is insufficient.
* `getChatResponse(req, res)` → API endpoint for chat queries.

---

## **Data Flow**

### **Vector Search Flow**

User query → backend → convert query to embedding → Neo4j vector index → top K matches → merged & sorted → frontend.

### **Graph Search Flow**

User query → backend → determine type (File, Directory, Tag) → query Neo4j → results formatted → returned → fallback to Ollama if no data.

---

## **Technologies Used**

* **Backend:** Node.js, Express.js
* **Database:** Neo4j
* **Frontend:** React
* **AI Model:** Ollama LLM
* **Containerization:** Docker, Docker Compose
* **Logging:** Winston-based custom logger
* **Environment Management:** dotenv

---



## **Contributing**

1. Fork the repository.
2. Create your feature branch: `git checkout -b feature-name`.
3. Commit your changes: `git commit -am 'Add feature'`.
4. Push to the branch: `git push origin feature-name`.
5. Open a pull request.

---

```
