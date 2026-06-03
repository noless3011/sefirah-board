import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig({
    plugins: [react(), tailwindcss()],
    server: {
        port: 5173,
        strictPort: true,
        proxy: {
            "/api": {
                target: "http://localhost:4000",
                changeOrigin: true,
            },
            "/workspace": {
                target: "ws://localhost:4000",
                ws: true,
            },
        },
    },
    resolve: {
        dedupe: ["react", "react-dom", "react-router", "react-router-dom"],
    },
});
