import path from "path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],

  base: './',  // <-- adicione esta linha

  build: {
    outDir: "dist"
  },

  resolve: {
    alias: {
      "@": path.resolve(__dirname, ".")
    }
  }
});
