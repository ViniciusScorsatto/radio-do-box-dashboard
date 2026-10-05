import { boundedText } from "./bounded-response.mjs";
// Read-only queries used by the public Veloci Stock championship pages.
const home = 'https://velocigroup.com.br/';
const endpoint = 'https://wv.paddockfan.com.br/api/Radio/phpRadio.php';
export const loadStockStandings = async ({season, category = 'stock-pro'}) => {
  if (!['stock-pro', 'stock-light'].includes(category)) throw new Error('Categoria Stock inválida.');
  const light = category === 'stock-light';
  const sourceUrl = `${home}#/${light ? 'stock-light' : 'stock-pro-series'}`;
  const rankingMethod = light ? 'stockcarclub_appcampeonatoranking' : 'stockcarclub_appcampeonatoranking_portal';
  const expectedName = light ? 'STOCK LIGHT' : 'STOCK CAR PRO SERIES';
  if (!Number.isInteger(Number(season)) || Number(season) < 1979 || Number(season) > 2100) throw new Error('Temporada Stock Car inválida.');
  const getText = async (url) => {
    const response = await fetch(url, {redirect: "error", signal: AbortSignal.timeout(20000)});
    if (!response.ok) throw new Error(`Fonte Veloci indisponível (HTTP ${response.status}).`);
    return boundedText(response);
  };
  const html = await getText(home);
  const scriptPath = html.match(/<script\b[^>]*src=["'](\/assets\/index-[^"']+\.js)["']/i)?.[1];
  if (!scriptPath) throw new Error('Consulta pública da Veloci não encontrada.');
  const script = await getText(new URL(scriptPath, home).href);
  // Never persist or log the public frontend authorization value.
  // Light's public query uses championship 17; verify its calendar before consuming points.
  const query = light
    ? script.match(/Authorization:"(Bearer [^"]+)"\},body:JSON\.stringify\(\{metodo:"stockcarclub_appcampeonatoranking",IDappCampeonato:"(17)",IDappCampeonatoEtapa:"0",AppCampeonatoRankingTipo:"Piloto"/)
    : script.match(/Authorization:"(Bearer [^"]+)"\},body:JSON\.stringify\(\{metodo:"stockcarclub_appcampeonatoranking_portal",IDappCampeonato:"(\d+)"/);
  if (!query) throw new Error('A consulta de ranking da Veloci mudou; importação interrompida.');
  const championshipId = query[2];
  const read = async (metodo) => {
    const response = await fetch(endpoint, {redirect: 'error', method: 'POST', headers: {'Content-Type': 'application/json', Accept: 'application/json', Authorization: query[1]}, body: JSON.stringify({metodo, IDappCampeonato: championshipId, IDappCampeonatoEtapa: '0', AppCampeonatoRankingTipo: 'Piloto'}), signal: AbortSignal.timeout(20000)});
    if (!response.ok) throw new Error(`Ranking Veloci indisponível (HTTP ${response.status}).`);
    const data = JSON.parse(await boundedText(response, 2 * 1024 * 1024));
    if (data.retorno?.codigo !== 0) throw new Error('A Veloci não retornou uma classificação válida.');
    return data.retorno;
  };
  const calendar = await read('stockcarclub_appconsultarcalendarioranking');
  const events = calendar.CampeonatoEtapa;
  if (!Array.isArray(events) || !events.length || events.some((event) => Number(event.AppCampeonatoAno) !== Number(season) || String(event.IDappCampeonato) !== championshipId || event.AppCampeonatoNome?.trim().toUpperCase() !== expectedName)) throw new Error('A Veloci disponibiliza outro campeonato/ano nesta página. Não é possível importar a temporada selecionada com segurança.');
  const ranking = (await read(rankingMethod)).CampeonatoRanking;
  if (!Array.isArray(ranking) || !ranking.length || ranking.length > 100) throw new Error('Ranking Stock Car vazio.');
  const portraits = {};
  const observations = {};
  const rows = ranking.map((driver) => {
    const position = String(driver.RankingNro ?? '').trim();
    const points = String(driver.RankingNroPontos ?? '').trim();
    const name = String(driver.RankingNome ?? '').replaceAll('_', ' ').replace(/\s+/g, ' ').trim();
    const team = String(driver.RankingEquipe ?? '').trim();
    const manufacturer = String(driver.RankingMontadora ?? '').trim();
    if (!/^\d+$/.test(position) || Number(position) < 1 || !/^\d+(?:\.\d+)?$/.test(points) || !name || !team || !manufacturer) throw new Error('Ranking Stock Car incompleto; geração bloqueada.');
    if (driver.RankingImagemUrl) {
      const url = new URL(driver.RankingImagemUrl);
      if (url.protocol === 'https:' && url.hostname === 'api.paddockfan.com.br' && /^\/simetraapppaddockfan\/imagens\//i.test(url.pathname)) portraits[name] = url.href;
    }
    if (driver.RankingObservacao?.trim()) observations[name] = driver.RankingObservacao.trim();
    return [position, name, team, points, manufacturer];
  }).sort((a, b) => Number(a[0]) - Number(b[0]));
  if (new Set(rows.map((row) => row[0])).size !== rows.length || new Set(rows.map((row) => row[1])).size !== rows.length) throw new Error('Ranking Stock Car com posições ou pilotos duplicados.');
  return {season: Number(season), sourceUrl, sourceLabel: 'velocigroup.com.br', standingsRows: [['Pos.', 'Piloto', 'Equipe', 'Pts.', 'Montadora'], ...rows], portraits, observations, extractedAt: new Date().toISOString()};
};
