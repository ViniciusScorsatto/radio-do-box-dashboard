import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {test} from 'node:test';
import {loadFormulaOneStandings, loadOfficialChampionshipStandings, prepareF1Job} from './f1-system.mjs';

const table = (rows) => `<table>${rows.map((row) => `<tr>${row.map((cell) => `<td>${cell}</td>`).join('')}</tr>`).join('')}</table>`;

test('F3 retains a full grid, official position gaps, zero totals and sporting flags', async (t) => {
  const rows = Array.from({length: 34}, (_, index) => [`${index === 33 ? 35 : index + 1} ${index === 0 ? 'U. Ugochukwu' : index === 1 ? 'M. Colnaghi' : index === 33 ? 'S. Hanna' : `Driver ${index}`}`, '10', '25', index === 0 ? '159' : '0']);
  t.mock.method(globalThis, 'fetch', async (url) => {
    assert.equal(url, 'https://www.fiaformula3.com/en/standings/2026/drivers');
    return new Response(table([['Driver', 'SR', 'FR', 'Points'], ...rows]));
  });
  t.mock.method(fs, 'writeFile', async () => {});
  const {job} = await prepareF1Job({template: 'source-driver-standings', category: 'f3', season: 2026, voiceoverEnabled: false});
  assert.equal(job.dataSource, 'fiaformula3.com');
  assert.equal(job.subtitle, 'Formula 3 2026');
  assert.equal(job.entries.length, 34);
  assert.equal(job.entries[0].value, '159');
  assert.equal(job.entries[1].badge.nationality, 'Argentina');
  assert.equal(job.entries.at(-1).position, 35);
  assert.equal(job.entries.at(-1).value, '0');
  assert.equal(job.entries.at(-1).badge.nationality, 'Colombia');
  assert.ok(job.entries.every((entry) => entry.badge.hideSublabel && !entry.badge.imagePath));
  await assert.rejects(loadOfficialChampionshipStandings({season: 2026, category: 'f3', constructors: true}));
});

const academyPage = (year, standings) => `<script id="__NEXT_DATA__" type="application/json">${JSON.stringify({props: {pageProps: {seasonData: [2025, 2026].map((season) => ({SeasonId: season - 2022, SeasonName: `${season} F1 Academy`})), pageData: {Season: `${year} F1 Academy`, SeasonId: year - 2022, Standings: standings}}}})}</script>`;
const academyDrivers = [{Position: 1, DisplayName: 'A. Palmowski', CountryCode: 'GB', TotalPoints: 136}, {Position: 2, DisplayName: 'C. Bättig (WCD)', CountryCode: 'CH', TotalPoints: 0}];

test('Academy preserves totals, wildcards, zero points and sporting flags', async (t) => {
  t.mock.method(globalThis, 'fetch', async () => new Response(academyPage(2026, academyDrivers)));
  t.mock.method(fs, 'writeFile', async () => {});
  const {job} = await prepareF1Job({template: 'source-driver-standings', category: 'f1-academy', season: 2026, voiceoverEnabled: false});
  assert.equal(job.dataSource, 'f1academy.com');
  assert.equal(job.category, 'f1-academy');
  assert.equal(job.entries[0].value, '136');
  assert.equal(job.entries[0].badge.flagPath, '/f1/flags/academy-gb.png');
  assert.equal(job.entries[1].name, 'C. Bättig (WCD)');
  assert.equal(job.entries[1].value, '0');
  assert.ok(job.entries.every((entry) => entry.badge.hideSublabel && !entry.badge.imagePath));
});

test('Academy selects official season IDs and rejects wrong seasons or missing totals', async (t) => {
  const urls = [];
  t.mock.method(globalThis, 'fetch', async (url) => { urls.push(url); return new Response(academyPage(url.includes('?seasonId=3') ? 2025 : 2026, academyDrivers)); });
  const result = await loadOfficialChampionshipStandings({season: 2025, category: 'f1-academy'});
  assert.equal(result.season, 2025);
  assert.match(urls[1], /seasonId=3$/);
  t.mock.method(globalThis, 'fetch', async () => new Response(academyPage(2026, academyDrivers)));
  await assert.rejects(loadOfficialChampionshipStandings({season: 2025, category: 'f1-academy'}), /não corresponde/);
  await assert.rejects(loadOfficialChampionshipStandings({season: 2024, category: 'f1-academy'}), /não publicada/);
  t.mock.method(globalThis, 'fetch', async () => new Response(academyPage(2026, [{...academyDrivers[0], TotalPoints: null}])));
  await assert.rejects(loadOfficialChampionshipStandings({season: 2026, category: 'f1-academy'}), /incompleta/);
});

test('F2 uses total points, preserves accents and zero scores without F1 portraits', async (t) => {
  t.mock.method(globalThis, 'fetch', async (url) => {
    assert.equal(url, 'https://www.fiaformula2.com/en/standings/2026/drivers');
    return new Response(table([['Driver', 'SR', 'FR', 'Points'], ['1 R. Câmara', '10', '25', '207'], ['2 J. Dürksen', '-', '-', '0']]));
  });
  const result = await loadOfficialChampionshipStandings({season: 2026, category: 'f2'});
  assert.deepEqual(result.standingsRows[1], ['1', 'R. Câmara', '', '207']);
  t.mock.method(fs, 'writeFile', async () => {});
  const {job} = await prepareF1Job({template: 'source-driver-standings', category: 'f2', season: 2026, voiceoverEnabled: false});
  assert.equal(job.dataSource, 'fiaformula2.com');
  assert.equal(job.subtitle, 'Formula 2 2026');
  assert.equal(job.entries[1].value, '0');
  assert.equal(job.entries[0].badge.imagePath, undefined);
  assert.equal(job.entries[0].badge.flagPath, '/f1/flags/brazil.svg');
  assert.equal(job.entries[1].badge.nationality, 'Paraguay');
  assert.ok(job.entries.every((entry) => entry.badge.hideSublabel));
  await assert.rejects(loadOfficialChampionshipStandings({season: 2026, category: 'f2', constructors: true}));
});

for (const constructors of [false, true]) {
  test(`Formula1.com ${constructors ? 'constructors' : 'drivers'} preserves points, zero scores, teams and theme`, async (t) => {
    t.mock.method(globalThis, 'fetch', async (url) => {
      assert.equal(url, `https://www.formula1.com/en/results/2026/${constructors ? 'team' : 'drivers'}`);
      return new Response(table(constructors
        ? [['Pos.', 'Team', 'Pts.'], ['1', 'Mercedes', '538'], ['2', 'Cadillac', '0']]
        : [['Pos.', 'Driver', 'Nationality', 'Team', 'Pts.'], ['1', '<span>Kimi Antonelli</span><span>ANT</span>', 'ITA', 'Mercedes', '302'], ['2', 'Sergio Perez PER', 'MEX', 'Cadillac', '0']]));
    });
    const result = await loadFormulaOneStandings({season: 2026, constructors});
    assert.equal(result.standingsRows.length, 3);
    assert.equal(result.standingsRows[1][1], constructors ? 'Mercedes' : 'Kimi Antonelli');
    assert.equal(result.standingsRows[2][3], '0');
    t.mock.method(fs, 'writeFile', async () => {});
    const {job, fallbackReason} = await prepareF1Job({template: constructors ? 'source-constructor-standings' : 'source-driver-standings', season: 2026, voiceoverEnabled: false});
    assert.equal(fallbackReason, null);
    assert.equal(job.dataSource, 'formula1.com');
    assert.equal(job.sourceUrl, result.sourceUrl);
    assert.equal(job.entries.length, 2);
    assert.equal(job.entries[0].team, 'Mercedes');
    assert.equal(job.entries[1].value, '0');
    assert.equal(job.leader.name, job.entries[0].name);
    const theme = JSON.parse(await fs.readFile(`config/f1/themes/${job.templateConfig.themeVariant}.json`, 'utf8'));
    assert.deepEqual(job.themeConfig, theme);
  });
}

test('missing points fail explicitly rather than producing sample standings', async (t) => {
  t.mock.method(globalThis, 'fetch', async () => new Response(table([['Pos.', 'Team', 'Pts.'], ['1', 'Mercedes', '']])));
  await assert.rejects(loadFormulaOneStandings({season: 2026, constructors: true}), /incompleta/);
  await assert.rejects(prepareF1Job({template: 'source-constructor-standings', season: 2026, voiceoverEnabled: false}));
});
