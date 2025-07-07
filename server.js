// File: server.js (in the project root)

import express from "express";
import { handler as generateApiHandler } from "./api/generate.js";

const app = express();
const PORT = 3001; // We'll run our backend on a separate port

// Middleware to parse JSON bodies from frontend requests
app.use(express.json());

// --- API Route ---
// Any request to /api/generate will be handled by our API logic
app.post("/api/generate", generateApiHandler);

app.listen(PORT, () => {
  console.log(`[SERVER] API Server is running on http://localhost:${PORT}`);
  console.log(
    `[INFO] Your frontend should be running on http://localhost:5173`
  );
  console.log(
    `[INFO] Vite's proxy will forward /api requests from 5173 to ${PORT}.`
  );
});
