import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import bodyParser from "body-parser";
import chatRoutes from "./routes/chat.js";
import { checkDatabaseConnection } from "./services/neo4jService.js";

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();

// Middlewares
app.use(cors());
app.use(bodyParser.json());

// Vérifier la connexion à la base de données Neo4j
checkDatabaseConnection().then((status) => {
  console.log("Connecting to Neo4j with URI:", process.env.NEO4J_URI);
  console.log("Using username:", process.env.NEO4J_USERNAME);
  if (status.success) {
    console.log("Neo4j database is ready:", status);
  } else {
    console.error("Neo4j database connection failed:", status.error);
  }
});

// Routes
app.use("/api/chat", chatRoutes);

// 404 Handling
app.use((req, res) => {
  res.status(404).json({ message: "Endpoint not found" });
});

// Start the server
const port = process.env.PORT || 5000;
app.listen(port, () => {
  console.log(`✅ Backend running on port ${port}`);
});
