import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      "/api": "http://localhost:5174"
    }
  },
  build: {
    outDir: "dist/web",
    emptyOutDir: true
  },
  test: {
    globals: true,
    environment: "node",
    include: ["src/**/*.test.ts"]
  }
});
