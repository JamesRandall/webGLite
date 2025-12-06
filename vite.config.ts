import { defineConfig } from "vite"

export default defineConfig({
  root: "src",
  publicDir: "../static",
  build: {
    outDir: "../dist",
    emptyOutDir: true,
  },
  server: {
    open: true,
  },
})
