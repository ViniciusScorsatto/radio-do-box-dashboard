import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import { prepare } from "../../scripts/online/prepare.mjs";
test("site-only preparation never writes current jobs or enables narration", async (t) => {
  const html =
    "<table><tr><th>Pos.</th><th>Driver</th><th>Team</th><th>Pts.</th></tr><tr><td>1</td><td>Piloto Teste</td><td>Mercedes</td><td>42</td></tr></table>";
  t.mock.method(globalThis, "fetch", async (url) => {
    assert.equal(url, "https://www.formula1.com/en/results/2026/drivers");
    return new Response(html);
  });
  t.mock.method(fs, "writeFile", async () => {
    assert.fail("Preparation must not write shared jobs");
  });
  const job = await prepare({
    template: "source-driver-standings",
    category: "f1",
    season: 2026,
    voiceoverEnabled: true,
  });
  assert.equal(job.template, "driver-standings");
  assert.equal(job.entries[0].value, "42");
  assert.equal(job.voiceoverPath, undefined);
});
test("reject API templates, arbitrary URLs, missing source and invalid values", async () => {
  for (const body of [
    { template: "race-results" },
    { template: "source-results", eventUrl: "http://127.0.0.1/private" },
    { template: "source-results", eventUrl: "https://evil.example/test" },
    { template: "source-driver-standings", soundtrackPath: "../../secret" },
    { template: "source-driver-standings", soundtrackVolume: 10 },
    { template: "source-driver-standings", category: "football" },
    { template: "source-driver-standings", season: 0 },
  ])
    await assert.rejects(prepare({ season: 2026, category: "f1", ...body }));
});
