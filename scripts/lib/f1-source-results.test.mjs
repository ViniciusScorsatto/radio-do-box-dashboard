import assert from 'node:assert/strict';
import {test} from 'node:test';
import {loadF1SourceResults} from './f1-system.mjs';

const htmlTable = (rows) => `<table><tr>${['Pos.', 'No.', 'Driver', 'Team', 'Laps', 'Time / Retired', 'Pts.'].map((cell) => `<th>${cell}</th>`).join('')}</tr>${rows.map((row) => `<tr>${row.map((cell) => `<td>${cell}</td>`).join('')}</tr>`).join('')}</table>`;

test('official race and sprint results retain all 22 drivers, including NC/DNF', async (t) => {
  const rows = Array.from({length: 22}, (_, i) => [
    i < 16 ? String(i + 1) : 'NC', String(i + 1), `Driver ${i + 1}`, 'Team',
    i < 15 ? '51' : '7', i < 15 ? '+1.000s' : 'DNF', '0',
  ]);
  t.mock.method(globalThis, 'fetch', async () => new Response(htmlTable(rows)));
  for (const session of ['race', 'sprint']) {
    const result = await loadF1SourceResults({season: 2026, eventUrl: 'https://www.formula1.com/en/results/2026/races/1295/azerbaijan/race-result', session});
    assert.equal(result.rows.length, 22);
    assert.deepEqual(result.rows.map((row) => row.position), Array.from({length: 22}, (_, i) => i + 1));
    assert.equal(result.rows.filter((row) => row.time === 'DNF').length, 7);
    assert.equal(result.rows[21].positionText, 'NC');
    assert.equal(result.rows[21].driver, 'Driver 22');
  }
});

test('status rows survive empty time cells without admitting notes or malformed positions', async (t) => {
  const rows = ['1', 'DNF', 'DNS', 'DSQ', 'NC', 'RET', 'DQ', 'Note', '2invalid'].map((pos, i) => [pos, String(i + 1), `Driver ${i + 1}`, 'Team', '0', '', '0']);
  t.mock.method(globalThis, 'fetch', async () => new Response(htmlTable(rows)));
  const result = await loadF1SourceResults({season: 2026, eventUrl: 'https://www.formula1.com/example/race-result'});
  assert.equal(result.rows.length, 7);
  assert.deepEqual(result.rows.map((row) => row.time), ['', 'DNF', 'DNS', 'DSQ', 'NC', 'RET', 'DQ']);
  assert.ok(result.rows.every((row) => row.team === 'Team'));
});
