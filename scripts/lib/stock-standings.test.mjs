import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {test} from 'node:test';
import {loadStockStandings} from './stock-standings.mjs';
import {prepareF1Job, loadOfficialChampionshipStandings} from './f1-system.mjs';

const driver = {RankingNro: 1, RankingNome: 'GAETANO DI_MAURO', RankingNroPontos: 679, RankingEquipe: 'EUROFARMA RC', RankingMontadora: 'Mitsubishi', RankingObservacao: 'Punição publicada pela fonte'};
const mockSource = (t, {year = 2026, category = 'stock-pro', name = category === 'stock-light' ? 'STOCK LIGHT' : 'STOCK CAR PRO SERIES', rows = [driver], codigo = 0, scriptChanged = false} = {}) => {
  const id = category === 'stock-light' ? '17' : '16';
  const method = category === 'stock-light' ? 'stockcarclub_appcampeonatoranking' : 'stockcarclub_appcampeonatoranking_portal';
  t.mock.method(globalThis, 'fetch', async (url, options) => {
    if (url === 'https://velocigroup.com.br/') return new Response('<script type="module" src="/assets/index-test.js"></script>');
    if (url === 'https://velocigroup.com.br/assets/index-test.js') return new Response(scriptChanged ? 'changed' : `Authorization:"Bearer public-test-value"},body:JSON.stringify({metodo:"${method}",IDappCampeonato:"${id}",IDappCampeonatoEtapa:"0",AppCampeonatoRankingTipo:"Piloto"`);
    assert.equal(url, 'https://wv.paddockfan.com.br/api/Radio/phpRadio.php');
    assert.equal(options.method, 'POST');
    const request = JSON.parse(options.body);
    assert.equal(request.IDappCampeonato, id);
    assert.equal(request.IDappCampeonatoEtapa, '0');
    assert.equal(request.AppCampeonatoRankingTipo, 'Piloto');
    if (request.metodo === 'stockcarclub_appconsultarcalendarioranking') return Response.json({retorno: {codigo, CampeonatoEtapa: [{IDappCampeonato: Number(id), AppCampeonatoAno: year, AppCampeonatoNome: name}]}});
    assert.equal(request.metodo, method);
    return Response.json({retorno: {codigo, CampeonatoRanking: rows}});
  });
};

test('Stock uses official totals, team and manufacturer, keeps notes and full grid', async (t) => {
  mockSource(t, {rows: Array.from({length: 32}, (_, index) => ({...driver, RankingNro: index + 1, RankingNome: index ? `PILOTO ${index}` : driver.RankingNome, RankingNroPontos: index ? 0 : 679}))});
  t.mock.method(fs, 'writeFile', async () => {});
  const {job, fallbackReason} = await prepareF1Job({template: 'source-driver-standings', category: 'stock-pro', season: 2026, voiceoverEnabled: false});
  assert.equal(fallbackReason, null);
  assert.equal(job.dataSource, 'velocigroup.com.br');
  assert.equal(job.title, 'Campeonato de Pilotos');
  assert.equal(job.subtitle, 'Stock Car Pro Series 2026');
  assert.equal(job.entries.length, 32);
  assert.equal(job.entries[0].name, 'GAETANO DI MAURO');
  assert.equal(job.entries[0].value, '679');
  assert.equal(job.entries[0].team, 'EUROFARMA RC');
  assert.equal(job.entries[0].manufacturer, 'Mitsubishi');
  assert.equal(job.entries[0].engine, undefined);
  assert.equal(job.entries[0].sourceNote, driver.RankingObservacao);
  assert.equal(job.entries[0].badge.sublabel, 'EUROFARMA RC · Mitsubishi');
  assert.equal(job.entries.at(-1).value, '0');
  assert.ok(job.entries.every((entry) => !entry.badge.flagPath && !entry.badge.imagePath && entry.badge.plainSublabel));
});

test('Stock fails closed for wrong season/category, malformed data and changed website', async (t) => {
  for (const scenario of [{year: 2025}, {name: 'STOCK LIGHT'}, {rows: []}, {rows: [driver, driver]}, {rows: [{...driver, RankingNroPontos: null}]}, {rows: [{...driver, RankingEquipe: ''}]}, {rows: [{...driver, RankingMontadora: ''}]}, {codigo: 1}, {scriptChanged: true}]) {
    mockSource(t, scenario);
    await assert.rejects(loadStockStandings({season: 2026}));
  }
  await assert.rejects(loadOfficialChampionshipStandings({season: 2026, category: 'stock-pro', constructors: true}));
});

test('Stock Light uses its own championship and ranking method, not Pro data', async (t) => {
  mockSource(t, {category: 'stock-light', rows: [{...driver, RankingNome: 'GABRIEL KOENIGKAN', RankingNroPontos: 418, RankingEquipe: 'W2 RACING PRO GP', RankingMontadora: 'Chevrolet'}, {...driver, RankingNro: 2, RankingNome: 'PILOTO SEM PONTOS', RankingNroPontos: 0}]});
  t.mock.method(fs, 'writeFile', async () => {});
  const {job} = await prepareF1Job({template: 'source-driver-standings', category: 'stock-light', season: 2026, voiceoverEnabled: false});
  assert.equal(job.category, 'stock-light');
  assert.equal(job.subtitle, 'Stock Light 2026');
  assert.equal(job.sourceUrl, 'https://velocigroup.com.br/#/stock-light');
  assert.equal(job.entries[0].value, '418');
  assert.equal(job.entries[0].badge.sublabel, 'W2 RACING PRO GP · Chevrolet');
  assert.equal(job.entries[1].value, '0');
  assert.ok(job.entries.every((entry) => !entry.badge.flagPath && !entry.badge.imagePath));
  for (const scenario of [{year: 2025}, {name: 'STOCK CAR PRO SERIES'}, {rows: []}, {scriptChanged: true}]) {
    mockSource(t, {category: 'stock-light', ...scenario});
    await assert.rejects(loadStockStandings({season: 2026, category: 'stock-light'}));
  }
  await assert.rejects(loadOfficialChampionshipStandings({season: 2026, category: 'stock-light', constructors: true}));
});
