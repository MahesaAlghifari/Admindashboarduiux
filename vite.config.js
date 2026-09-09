import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  base: "/edussphere.sekolahss.sch.id/",

  plugins: [
    react(),
    tailwindcss(),
  ],

  server: {
    proxy: {
      "/backend": {
        target: "https://ssphereapigateway.ibik.cloud",
        changeOrigin: true,
        secure: true,
        rewrite: (path) =>
          path.replace(/^\/backend/, ""),
      },
    },
  },

  build: {
    sourcemap: false,
    cssCodeSplit: true,
    reportCompressedSize: true,
    chunkSizeWarningLimit: 700,

    rollupOptions: {
      output: {
        manualChunks: {
          react: [
            "react",
            "react-dom",
          ],
        },
      },
    },
  },
});