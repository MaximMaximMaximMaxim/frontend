import { defineConfig } from "vite";

export default defineConfig({
  server: {
    host: "127.0.0.1",
    port: 5173,
    proxy: {
      "/assistant-api": {
        target: "https://assistant-api.ustyantsevmd.ru",
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/assistant-api/, ""),
      },
    },
  },
});
