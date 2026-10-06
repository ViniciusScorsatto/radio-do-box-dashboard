import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { prepare } from "../../scripts/online/prepare.mjs";
import { persistOnlinePortrait } from "../../scripts/lib/online-portraits.mjs";
import { backupOnline } from "../../scripts/online/backup.mjs";
import { openStore } from "../../scripts/online/store.mjs";
const portraitUrl =
  "https://api.paddockfan.com.br:9091/simetraapppaddockfan/imagens/piloto.png";
const png = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aPe0AAAAASUVORK5CYII=",
  "base64",
);
async function online(t) {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), "rdb-categories-"));
  const previous = {
    APP_ONLINE: process.env.APP_ONLINE,
    APP_DATA_DIR: process.env.APP_DATA_DIR,
  };
  process.env.APP_ONLINE = "true";
  process.env.APP_DATA_DIR = directory;
  t.after(async () => {
    for (const [key, value] of Object.entries(previous)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
    await fs.rm(directory, { recursive: true, force: true });
  });
  return directory;
}
test("online Indy standings preserve engine, points and flags without API keys or shared writes", async (t) => {
  await online(t);
  const data = JSON.stringify({
    firstName: "Alex",
    lastName: "Palou",
    rank: 1,
    points: 631,
    countryAbbreviation: "Spain",
  }).replaceAll('"', "&quot;");
  t.mock.method(globalThis, "fetch", async (url, options) => {
    assert.equal(url, "https://www.indycar.com/standings/2026");
    assert.equal(options.redirect, "error");
    return new Response(
      `<h1>2026 Standings</h1><table><tr><th>Rank</th><th>No.</th><th>Driver</th><th>Team</th><th>Engine</th><th>Points</th></tr><tr><td>1</td><td>10</td><td><button data-driver-data='${data}'>Alex Palou</button></td><td><img alt="Chip Ganassi Racing Logo"></td><td><img alt="Honda Logo"></td><td><button data-points-data='{&quot;year&quot;:2026}'>631</button></td></tr></table>`,
    );
  });
  t.mock.method(fs, "writeFile", async () =>
    assert.fail("Indy must not write current jobs"),
  );
  const job = await prepare({
    category: "indycar",
    season: 2026,
    template: "source-driver-standings",
  });
  assert.equal(job.category, "indycar");
  assert.equal(job.entries[0].engine, "Honda");
  assert.equal(job.entries[0].value, "631");
  assert.equal(job.entries[0].badge.flagPath, "/f1/flags/spain.svg");
});
for (const category of ["stock-pro", "stock-light"])
  test(`online ${category} uses its own championship and persists immutable portraits`, async (t) => {
    const directory = await online(t);
    let portraitDownloads = 0;
    const id = category === "stock-light" ? "17" : "16";
    const method =
      category === "stock-light"
        ? "stockcarclub_appcampeonatoranking"
        : "stockcarclub_appcampeonatoranking_portal";
    const label =
      category === "stock-light" ? "STOCK LIGHT" : "STOCK CAR PRO SERIES";
    t.mock.method(globalThis, "fetch", async (url, options) => {
      if (url === "https://velocigroup.com.br/")
        return new Response('<script src="/assets/index-fixture.js"></script>');
      if (url === "https://velocigroup.com.br/assets/index-fixture.js")
        return new Response(
          `Authorization:"Bearer fixture"},body:JSON.stringify({metodo:"${method}",IDappCampeonato:"${id}",IDappCampeonatoEtapa:"0",AppCampeonatoRankingTipo:"Piloto"`,
        );
      if (url === portraitUrl) {
        portraitDownloads++;
        assert.equal(options.redirect, "error");
        return new Response(png);
      }
      assert.equal(url, "https://wv.paddockfan.com.br/api/Radio/phpRadio.php");
      const request = JSON.parse(options.body);
      assert.equal(request.IDappCampeonato, id);
      return Response.json({
        retorno: {
          codigo: 0,
          ...(request.metodo === "stockcarclub_appconsultarcalendarioranking"
            ? {
                CampeonatoEtapa: [
                  {
                    IDappCampeonato: id,
                    AppCampeonatoAno: 2026,
                    AppCampeonatoNome: label,
                  },
                ],
              }
            : {
                CampeonatoRanking: [
                  {
                    RankingNro: 1,
                    RankingNome: "PILOTO TESTE",
                    RankingNroPontos: 42,
                    RankingEquipe: "Equipe",
                    RankingMontadora: "Chevrolet",
                    RankingImagemUrl: portraitUrl,
                  },
                ],
              }),
        },
      });
    });
    const original = fs.writeFile;
    t.mock.method(fs, "writeFile", async (file, ...args) => {
      assert.ok(file.startsWith(directory + path.sep));
      return original(file, ...args);
    });
    const job = await prepare({
      category,
      season: 2026,
      template: "source-driver-standings",
    });
    assert.equal(job.category, category);
    assert.equal(job.entries[0].manufacturer, "Chevrolet");
    assert.equal(job.entries[0].value, "42");
    const image = job.entries[0].badge.imagePath;
    assert.match(image, /^\/online-assets\/[a-f0-9]{64}\.png$/);
    assert.deepEqual(
      await fs.readFile(path.join(directory, "public", image)),
      png,
    );
    assert.equal(
      await persistOnlinePortrait(portraitUrl, { category, season: 2026 }),
      image,
    );
    await prepare({
      category,
      season: 2026,
      template: "source-driver-standings",
    });
    assert.equal(portraitDownloads, 1);
    const store = openStore(directory);
    store.snapshot(job);
    store.db.close();
    const destination = path.join(directory, "backup.sqlite");
    await backupOnline(directory, destination);
    assert.deepEqual(
      await fs.readFile(
        path.join(destination + ".assets", path.basename(image)),
      ),
      png,
    );
  });
test("standings-only categories reject unrelated templates and unsafe portrait sources", async (t) => {
  await online(t);
  t.mock.method(globalThis, "fetch", async () =>
    assert.fail("Invalid requests must not fetch"),
  );
  for (const category of ["indycar", "stock-pro", "stock-light"])
    for (const template of [
      "source-results",
      "source-constructor-standings",
      "editorial",
    ])
      await assert.rejects(
        prepare({ category, template, season: 2026 }),
        /category_standings_only/,
      );
  for (const url of [
    "http://127.0.0.1/x",
    "https://evil.example/image.png",
    "https://api.paddockfan.com.br/private",
    "https://api.paddockfan.com.br:8080/simetraapppaddockfan/imagens/x.png",
    "https://user@api.paddockfan.com.br/simetraapppaddockfan/imagens/x.png",
  ])
    await assert.rejects(persistOnlinePortrait(url), /invalid_portrait_url/);
});
