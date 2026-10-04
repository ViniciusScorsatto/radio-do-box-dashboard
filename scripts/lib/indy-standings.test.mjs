import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {test} from 'node:test';
import {loadOfficialChampionshipStandings, prepareF1Job} from './f1-system.mjs';

const row = ({position = 1, name = 'Alex', surname = 'Palou', points = 631, country = 'Spain', team = 'Chip Ganassi Racing', engine = 'Honda', year = 2026} = {}) => {
  const data = JSON.stringify({firstName: name, lastName: surname, rank: position, points, countryAbbreviation: country}).replaceAll('"', '&quot;').replaceAll("'", '&#39;');
  return `<tr><td>${position}</td><td>10</td><td><button data-driver-data='${data}'>${name} ${surname}</button></td><td><img alt="${team} Logo "></td><td><img alt="${engine} Logo"></td><td><button data-points-data='{&quot;year&quot;:${year}}'>${points}</button></td><td>99</td></tr>`;
};
const page = (rows, year = 2026) => `<h1>${year} Standings</h1><table><tr><th>Rank</th><th>No.</th><th>Driver</th><th>Team</th><th>Engine</th><th>Points</th><th>Wins</th></tr>${rows}</table>`;

test('Indy imports the selected season with team, engine, flags, zero points and entire grid', async (t) => {
  const rows = Array.from({length: 31}, (_, index) => row({position: index + 1, points: index === 0 ? 631 : 0, name: index === 1 ? 'Pato' : 'Alex', surname: index === 1 ? "O'Ward" : `Palou${index || ''}`, engine: index === 1 ? 'Chevrolet' : 'Honda'})).join('');
  t.mock.method(globalThis, 'fetch', async (url) => {assert.equal(url, 'https://www.indycar.com/standings/2026'); return new Response(page(rows));});
  t.mock.method(fs, 'writeFile', async () => {});
  const {job, fallbackReason} = await prepareF1Job({template: 'source-driver-standings', category: 'indycar', season: 2026, voiceoverEnabled: false});
  assert.equal(fallbackReason, null);
  assert.equal(job.entries.length, 31);
  assert.equal(job.subtitle, 'IndyCar 2026');
  assert.equal(job.dataSource, 'indycar.com');
  assert.equal(job.entries[0].team, 'Chip Ganassi Racing');
  assert.equal(job.entries[0].engine, 'Honda');
  assert.equal(job.entries[0].badge.sublabel, 'Chip Ganassi Racing · Honda');
  assert.equal(job.entries[0].badge.flagPath, '/f1/flags/spain.svg');
  assert.equal(job.entries[1].name, "Pato O'Ward");
  assert.equal(job.entries[1].engine, 'Chevrolet');
  assert.equal(job.entries[1].value, '0');
  assert.equal(job.entries.at(-1).position, 31);
  assert.ok(job.entries.every((entry) => entry.badge.plainSublabel && !entry.badge.imagePath));
});

test('Indy rejects wrong season, missing fields, inconsistent points and duplicate positions', async (t) => {
  for (const html of [page(row(), 2025), page(row({year: 2025})), page(row({team: ''})), page(row({engine: ''})), page(row()).replace('>631<', '>630<'), page(row() + row()), '<h1>2026 Standings</h1>']) {
    t.mock.method(globalThis, 'fetch', async () => new Response(html));
    await assert.rejects(loadOfficialChampionshipStandings({season: 2026, category: 'indycar'}));
  }
  await assert.rejects(loadOfficialChampionshipStandings({season: 2026, category: 'indycar', constructors: true}));
});
