import { defineConfig } from "vite";

export default defineConfig(({ command }) => ({
  define: {
    __PVF_DEVELOPMENT__: JSON.stringify(
      command === "serve" && process.env.PVF_MODE !== "pilot",
    ),
  },
  server: {
    host: "127.0.0.1",
    port: Number(process.env.PVF_WEB_PORT ?? 5181),
    strictPort: true,
    proxy: { "/api": `http://127.0.0.1:${process.env.PVF_API_PORT ?? 3101}` },
  },
}));
