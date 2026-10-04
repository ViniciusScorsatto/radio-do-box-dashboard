// Disposable Linux/Chromium verification; never opens or imports the production DB.
import fs from "node:fs/promises";
import http from "node:http";
import path from "node:path";
import {
  renderMedia,
  renderStill,
  selectComposition,
} from "@remotion/renderer";
import { serveFile } from "./files.mjs";
const theme = JSON.parse(
  await fs.readFile("config/f1/themes/blue.json", "utf8"),
);
const base = {
  sport: "f1",
  brandName: "Radio do Box",
  title: "TESTE DE PRODUÇÃO",
  subtitle: "Dados fictícios · validação",
  season: 2026,
  themeConfig: theme,
  soundtrackPath: "/audio/f1/Gridlock Pulse.mp3",
  soundtrackVolume: 0.2,
  category: "f1",
};
const entry = (n) => ({
  position: n,
  name: `Piloto ${n}`,
  team: "Mercedes",
  value: String(200 - n * 4),
  stat: `${200 - n * 4} pts`,
  badge: { label: `P${n}`, sublabel: "Mercedes" },
});
const entries = Array.from({ length: 20 }, (_, i) => entry(i + 1));
const jobs = [
  {
    ...base,
    template: "race-results",
    podium: entries.slice(0, 3),
    entries: entries.slice(3),
  },
  {
    ...base,
    template: "qualifying-grid",
    podium: entries.slice(0, 3),
    entries: entries.slice(3),
  },
  { ...base, template: "driver-standings", leader: entries[0], entries },
  {
    ...base,
    template: "constructor-standings",
    leader: entries[0],
    entries: entries.slice(0, 10),
  },
  {
    ...base,
    template: "editorial",
    headline: "Teste de notícia oficial",
    deck: "Prévia e render com os mesmos dados.",
    body: "Este é um teste com dados fictícios para validar o ambiente Linux.",
    sourceLabel: "formula1.com",
    articleUrl: "https://www.formula1.com",
  },
];
const server = http.createServer((req, res) =>
  serveFile(
    req,
    res,
    path.resolve("build/renderer"),
    decodeURIComponent(
      new URL(req.url, "http://localhost").pathname.slice(1),
    ) || "index.html",
  ),
);
await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
const serveUrl = `http://127.0.0.1:${server.address().port}`;
await fs.mkdir("/tmp/rdb-smoke", { recursive: true });
try {
  for (const job of jobs) {
    const inputProps = { job };
    const composition = await selectComposition({
      serveUrl,
      id: "OnlineShort",
      inputProps,
    });
    await renderStill({
      composition,
      serveUrl,
      inputProps,
      output: `/tmp/rdb-smoke/${job.template}.png`,
      frame: 240,
    });
    console.log(JSON.stringify({ template: job.template, still: "passed" }));
  }
  const inputProps = { job: jobs[0] };
  const composition = await selectComposition({
    serveUrl,
    id: "OnlineShort",
    inputProps,
  });
  const started = Date.now();
  await renderMedia({
    composition,
    serveUrl,
    inputProps,
    outputLocation: "/tmp/rdb-smoke/test.mp4",
    codec: "h264",
    audioCodec: "aac",
    pixelFormat: "yuv420p",
    concurrency: 1,
  });
  console.log(
    JSON.stringify({
      render: "passed",
      durationMs: Date.now() - started,
      bytes: (await fs.stat("/tmp/rdb-smoke/test.mp4")).size,
    }),
  );
} finally {
  server.close();
}
