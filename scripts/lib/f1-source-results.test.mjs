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

test('source Shorts apply time and grid penalties once, preserve status and allow clearing', async (t) => {
  const {prepare} = await import('../online/prepare.mjs');
  const rows = [
    ['1', '1', 'Driver One', 'Team', '51', '1:30:00.000', '25'],
    ['2', '2', 'Driver Two', 'Team', '51', '+2.000s', '18'],
    ['3', '3', 'Driver Three', 'Team', '51', '+4.000s', '15'],
    ['4', '4', 'Driver Four', 'Team', '50', '+1 lap', '12'],
    ['NC', '5', 'Driver Five', 'Team', '7', 'DNF', '0'],
  ];
  t.mock.method(globalThis, 'fetch', async () => new Response(htmlTable(rows)));
  const body = {template: 'source-results', category: 'f1', season: 2026, eventUrl: 'https://www.formula1.com/en/results/2026/races/1295/azerbaijan/race-result'};
  for (const raceType of ['race', 'sprint']) {
    const adjusted = await prepare({...body, raceType, manualAdjustments: 'Driver Two +5s'});
    assert.deepEqual(adjusted.podium.map(row => row.name), ['Driver One', 'Driver Three', 'Driver Two']);
    assert.match(adjusted.podium[2].secondaryValue, /18 pts.*PEN \+5s/);
    assert.equal(adjusted.entries[0].value, '+1 lap');
    assert.equal(adjusted.entries[1].value, 'DNF');
    const repeat = await prepare({...body, raceType, manualAdjustments: 'Driver Two +5s'});
    assert.deepEqual(repeat.podium, adjusted.podium);
    const cleared = await prepare({...body, raceType, manualAdjustments: ''});
    assert.equal(cleared.podium[1].name, 'Driver Two');
    assert.equal(cleared.podium[1].secondaryValue, '18 pts');
  }
  const grid = await prepare({...body, raceType: 'starting-grid', manualAdjustments: 'Driver One +3 pos'});
  assert.equal(grid.entries[0].name, 'Driver One');
  assert.equal(grid.entries[0].position, 4);
  assert.match(grid.entries[0].secondaryValue, /PEN \+3 POS/);
  await assert.rejects(prepare({...body, manualAdjustments: ['Driver Two +5s']}), /invalid_adjustments/);
});
