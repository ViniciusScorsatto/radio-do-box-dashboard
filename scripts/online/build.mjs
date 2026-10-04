import { bundle } from "@remotion/bundler";
import { build } from "esbuild";
import fs from "node:fs/promises";
import path from "node:path";
await fs.mkdir("build/online", { recursive: true });
await build({
  entryPoints: ["src/online/player.tsx"],
  bundle: true,
  outfile: "build/online/player.js",
  platform: "browser",
  format: "iife",
  minify: true,
  define: { "process.env.NODE_ENV": '"production"' },
});
await bundle({
  entryPoint: "src/online/render-entry.tsx",
  outDir: path.resolve("build/renderer"),
  publicDir: path.resolve("public"),
});
