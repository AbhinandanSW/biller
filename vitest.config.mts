import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  resolve: { tsconfigPaths: true },
  test: {
    // Pure logic (calculations, validation) runs in node. Component tests opt
    // into the DOM with a `// @vitest-environment jsdom` comment.
    environment: "node",
    setupFiles: ["./vitest.setup.ts"],
    include: ["src/**/*.test.{ts,tsx}", "supabase/tests/**/*.test.ts"],
  },
});
