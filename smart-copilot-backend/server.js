import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import bodyParser from "body-parser";
import chatRoutes from "./routes/chat.js";

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();

// Middlewares
app.use(cors());
app.use(bodyParser.json());

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
