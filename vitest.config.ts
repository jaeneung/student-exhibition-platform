import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    // Mirrors tsconfig.json's "@/*" path mapping - tsc resolves it for
    // typecheck, but Vite/Vitest doesn't know about tsconfig paths on its
    // own, so any tested lib file importing another lib file via "@/"
    // fails to resolve here without this.
    alias: {
      "@": path.resolve(__dirname, "."),
      "server-only": path.resolve(__dirname, "tests/mocks/server-only.ts"),
    },
  },
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
  },
});
