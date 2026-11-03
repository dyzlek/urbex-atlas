import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Le proxy envoie /api et /socket.io vers le serveur Node (port 3001)
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5180,
    proxy: {
      "/api": "http://localhost:3001",
      "/socket.io": { target: "http://localhost:3001", ws: true },
    },
  },
});
