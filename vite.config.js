// File: vite.config.js (Vercel-ready version)

import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // The server.proxy section is now gone
});
