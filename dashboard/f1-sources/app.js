const categorySelect = document.getElementById('category-select');
const seasonInput = document.getElementById('season-input');
const eventSelect = document.getElementById('event-select');
const sessionSelect = document.getElementById('session-select');
const statusNode = document.getElementById('sources-status');
const categoryChip = document.getElementById('source-category-chip');
const resultsSourceChip = document.getElementById('results-source-chip');
const resultsHeading = document.getElementById('results-heading');
const resultsTableWrap = document.getElementById('results-table-wrap');
const resultsWarning = document.getElementById('results-warning');
const resultsSourceLink = document.getElementById('results-source-link');
const fiaDocuments = document.getElementById('fia-documents');
const fiaWarning = document.getElementById('fia-warning');
const fiaSourceLink = document.getElementById('fia-source-link');
const editorialList = document.getElementById('editorial-list');
const editorialSourceLink = document.getElementById('editorial-source-link');
const sourceOutputChip = document.getElementById('source-output-chip');
const sourceOutputStatus = document.getElementById('source-output-status');
const sourceStudioUrl = document.getElementById('source-studio-url');
const sourcePreviewFrame = document.getElementById('source-preview-frame');
const openSourceStudioLink = document.getElementById('open-source-studio-link');
const sourceDownload = document.getElementById('source-download');
const sourceDownloadLink = document.getElementById('source-download-link');
const sourceSoundtrackSelect = document.getElementById('source-soundtrack-select');
const loadSoundtracks = async () => {
  try {
    const response = await fetch('/api/f1/options');
    if (!response.ok) throw new Error('Não foi possível carregar as trilhas. Atualize a página para tentar novamente.');
    const data = await response.json();
    const presets = data.soundtrackPresets ?? [];
    if (!presets.length) throw new Error('Nenhuma trilha sonora disponível.');
    sourceSoundtrackSelect.replaceChildren(...presets.map(({label, value}) => new Option(label, value)));
    const currentPath = data.currentJob?.soundtrackPath;
    if (presets.some(({value}) => value === currentPath)) sourceSoundtrackSelect.value = currentPath;
    sourceSoundtrackSelect.disabled = false;
    return true;
  } catch (error) {
    document.getElementById('source-soundtrack-status').textContent = error.message;
    return false;
  }
};
let currentCompositionId = '';
const updateSourcePreview = () => {
  const url = new URL(sourceStudioUrl.value.trim() || 'http://127.0.0.1:3000');
  url.pathname = currentCompositionId ? `/${encodeURIComponent(currentCompositionId)}` : '/';
  url.searchParams.set('codexPreviewTs', String(Date.now()));
  sourcePreviewFrame.src = url.href;
  openSourceStudioLink.href = url.href;
};
let lastFiaResult = null;
let lastSourceResult = null;
const categories = {
  'stock-light': {label: 'Stock Light', short: 'Stock Light', site: 'velocigroup.com.br'},
  'stock-pro': {label: 'Stock Car Pro Series', short: 'Stock Pro', site: 'velocigroup.com.br'},
  indycar: {label: 'IndyCar', short: 'Indy', site: 'indycar.com'},
  f1: {label: 'Formula 1', short: 'F1', site: 'formula1.com'},
  f2: {label: 'Formula 2', short: 'F2', site: 'fiaformula2.com'},
  f3: {label: 'Formula 3', short: 'F3', site: 'fiaformula3.com'},
  'f1-academy': {label: 'F1 Academy', short: 'F1 Academy', site: 'f1academy.com'},
};
let events = [];
const standingsType = document.getElementById('standings-type');
const standingsCategory = document.getElementById('standings-category');
let standingsRequestId = 0;
const loadStandings = async () => {
  const requestId = ++standingsRequestId;
  const container = document.getElementById('standings-table');
  const link = document.getElementById('standings-source-link');
  link.hidden = true;
  const isF2 = standingsCategory.value !== 'f1';
  if (isF2) standingsType.value = 'drivers';
  standingsType.disabled = isF2;
  document.getElementById('standings-source-label').textContent = categories[standingsCategory.value].site;
  container.textContent = 'Carregando classificação oficial…';
  try {
    const params = new URLSearchParams({season: seasonInput.value, type: standingsType.value, category: standingsCategory.value});
    const {result} = await api(`/api/f1/sources/standings?${params}`);
    if (requestId !== standingsRequestId) return;
    link.href = result.sourceUrl;
    link.hidden = false;
    const isStock = ['stock-pro', 'stock-light'].includes(standingsCategory.value);
    const isIndy = standingsCategory.value === 'indycar' || isStock;
    const visibleRows = result.standingsRows.map((row) => isIndy ? [row[0], row[1], row[2], row[4], row[3]] : standingsType.value === 'constructors' || isF2 ? [row[0], row[1], row[3]] : row);
    const [, ...rows] = visibleRows;
    const header = isIndy ? ['Pos.', 'Piloto', 'Equipe', isStock ? 'Montadora' : 'Motor', 'Pontos'] : standingsType.value === 'constructors' ? ['Pos.', 'Construtor', 'Pontos'] : isF2 ? ['Pos.', 'Piloto', 'Pontos'] : ['Pos.', 'Piloto', 'Equipe', 'Pontos'];
    container.innerHTML = `<table class="source-table"><thead><tr>${header.map((cell) => `<th>${escapeHtml(cell)}</th>`).join('')}</tr></thead><tbody>${rows.map((row) => `<tr>${row.map((cell) => `<td>${escapeHtml(cell)}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
    if (isStock) {
      container.innerHTML += '<p class="panel-help">Stock: a temporada precisa corresponder ao campeonato atual publicado pela Veloci. Pontos totais mantidos conforme a fonte.</p>';
      for (const [driver, note] of Object.entries(result.observations ?? {})) container.innerHTML += `<p class="panel-help"><strong>${escapeHtml(driver)}:</strong> ${escapeHtml(note)}</p>`;
    }
  } catch (error) {
    if (requestId === standingsRequestId) container.textContent = error.message;
  }
};
const runStandingsJob = async (render) => {
  try {
    setStatus(render ? 'Renderizando mundial…' : 'Preparando mundial…');
    await postJob({template: standingsType.value === 'constructors' ? 'source-constructor-standings' : 'source-driver-standings', category: standingsCategory.value, season: Number(seasonInput.value), competitionName: categories[standingsCategory.value].label}, render);
    setStatus(render ? 'MP4 do mundial renderizado.' : 'Short do mundial preparado.');
  } catch (error) { setStatus(error.message, true); }
};

const escapeHtml = (value) => String(value ?? '')
  .replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;').replaceAll("'", '&#39;');
const setStatus = (message, error = false) => {
  statusNode.textContent = message;
  statusNode.classList.toggle('error', error);
};
const selectedCategory = () => categories[categorySelect.value] || categories.f1;
const api = async (path) => {
  const response = await fetch(path);
  const data = await response.json();
  if (!response.ok || !data.ok) throw new Error(data.error || 'Fonte oficial indisponível.');
  return data;
};

const renderResults = (result) => {
  lastSourceResult = result;
  const rows = Array.isArray(result?.rows) ? result.rows : [];
  resultsHeading.textContent = `${selectedCategory().short} · ${sessionSelect.selectedOptions[0]?.textContent || 'Sessão'}`;
  resultsSourceLink.href = result?.sourceUrl || '#';
  resultsSourceLink.hidden = !result?.sourceUrl;
  resultsWarning.textContent = result?.warning || (rows.length ? `Extraído em ${new Date(result.extractedAt).toLocaleString('pt-BR')}.` : '');
  resultsTableWrap.innerHTML = rows.length
    ? `<table class="source-table"><thead><tr><th>Pos</th><th>Identificação</th><th>Dados publicados</th></tr></thead><tbody>${rows.map((row) => `<tr><td class="position-cell">P${escapeHtml(row.position)}</td><td><strong>${escapeHtml(row.driver)}</strong>${row.number ? `<small> #${escapeHtml(row.number)}</small>` : ''}</td><td>${escapeHtml(row.values.slice(1).join(' · '))}</td></tr>`).join('')}</tbody></table>`
    : '<p class="source-empty">Nenhuma linha classificável encontrada no HTML público desta sessão.</p>';
};

const postJob = async (payload, render = false) => {
  if (!await soundtracksReady) throw new Error('As trilhas não foram carregadas. Atualize a página e tente novamente.');
  payload = {...payload, soundtrackPath: sourceSoundtrackSelect.value};
  sourceDownload.hidden = true;
  sourceDownloadLink.removeAttribute('href');
  sourceOutputStatus.textContent = render ? 'Renderizando MP4… O download aparecerá aqui quando terminar.' : 'Preparando preview…';
  const response = await fetch(`/api/f1/jobs/${render ? 'render' : 'prepare'}`, {method: 'POST', headers: {'content-type': 'application/json'}, body: JSON.stringify({...payload, voiceoverEnabled: false})});
  const data = await response.json();
  if (!response.ok || !data.ok) {
    sourceOutputStatus.textContent = data.error || 'Não foi possível preparar o Short.';
    throw new Error(sourceOutputStatus.textContent);
  }
  const job = data.job;
  sourceOutputChip.textContent = job.compositionId || 'job preparado';
  sourceOutputStatus.textContent = data.message || `Job preparado: ${job.outputName}`;
  if (job.compositionId) {
    currentCompositionId = job.compositionId;
    updateSourcePreview();
  }
  if (data.render?.outputPath) {
    sourceDownloadLink.href = `/${data.render.outputPath.replace(/^\/+/, '').split('/').map(encodeURIComponent).join('/')}`;
    sourceDownloadLink.download = job.outputName;
    document.getElementById('source-download-name').textContent = job.outputName;
    sourceDownload.hidden = false;
    sourceOutputStatus.textContent = 'Render concluído. Use “Baixar MP4” para salvar o Short.';
    sourceDownload.scrollIntoView({behavior: 'smooth', block: 'center'});
  }
  return data;
};

const sourceResultPayload = () => ({template: 'source-results', category: categorySelect.value, season: Number(seasonInput.value), eventUrl: eventSelect.value, raceType: sessionSelect.value, competitionName: selectedCategory().label, labelOverride: document.getElementById('source-title-override').value.trim()});
const runSourceResultJob = async (render) => { try { setStatus(render ? 'Renderizando Short do resultado…' : 'Preparando Short do resultado…'); await postJob(sourceResultPayload(), render); setStatus(render ? 'MP4 do resultado renderizado.' : 'Short do resultado preparado.'); } catch (error) { setStatus(error.message, true); } };
const runFiaJob = async (render) => { try { setStatus(render ? 'Renderizando Short FIA…' : 'Preparando Short FIA…'); await postJob({template: 'fia-standings', category: categorySelect.value, season: Number(seasonInput.value), competitionName: selectedCategory().label}, render); setStatus(render ? 'MP4 FIA renderizado.' : 'Short FIA preparado.'); } catch (error) { setStatus(error.message, true); } };
const runEditorialJob = async (articleUrl, render) => { try { setStatus(render ? 'Renderizando notícia oficial…' : 'Preparando notícia oficial…'); await postJob({template: 'editorial', category: categorySelect.value, season: Number(seasonInput.value), articleUrl, competitionName: selectedCategory().label}, render); setStatus(render ? 'MP4 editorial renderizado.' : 'Short editorial preparado.'); } catch (error) { setStatus(error.message, true); } };

const loadResults = async () => {
  const eventUrl = eventSelect.value;
  if (!eventUrl) return;
  setStatus('Lendo resultado publicado pela categoria…');
  try {
    const params = new URLSearchParams({season: seasonInput.value, category: categorySelect.value, eventUrl, session: sessionSelect.value});
    const data = await api(`/api/f1/sources/results?${params}`);
    renderResults(data.result);
    setStatus('Resultado da categoria carregado.');
  } catch (error) {
    resultsTableWrap.innerHTML = `<p class="source-empty">${escapeHtml(error.message)}</p>`;
    resultsWarning.textContent = '';
    setStatus(error.message, true);
  }
};

const loadEvents = async () => {
  const category = selectedCategory();
  eventSelect.disabled = true;
  eventSelect.innerHTML = '<option>Buscando etapas oficiais…</option>';
  resultsSourceChip.textContent = category.site;
  categoryChip.textContent = category.short;
  try {
    const params = new URLSearchParams({season: seasonInput.value, category: categorySelect.value});
    const data = await api(`/api/f1/sources/events?${params}`);
    events = data.events || [];
    eventSelect.innerHTML = events.length ? events.map((event) => `<option value="${escapeHtml(event.url)}">${escapeHtml(event.label)}</option>`).join('') : '<option value="">Nenhuma etapa encontrada</option>';
    eventSelect.disabled = !events.length;
    if (events.length) await loadResults();
  } catch (error) {
    eventSelect.innerHTML = `<option value="">${escapeHtml(error.message)}</option>`;
    setStatus(error.message, true);
  }
};

const renderFia = (result) => {
  lastFiaResult = result;
  fiaSourceLink.href = result?.sourceUrl || '#';
  fiaSourceLink.hidden = !result?.sourceUrl;
  fiaWarning.textContent = result?.warning || '';
  const documents = result?.documents || [];
  const standingsRows = result?.standingsRows || [];
  fiaDocuments.innerHTML = documents.length
    ? documents.map((doc) => `<a class="document-row" href="${escapeHtml(doc.url)}" target="_blank" rel="noreferrer"><span><strong>${escapeHtml(doc.label)}</strong><small>Documento FIA · ${escapeHtml(result.season)}</small></span><span class="document-arrow">↗</span></a>`).join('')
    : standingsRows.length
      ? `<div class="table-wrap"><table class="source-table"><thead><tr>${standingsRows[0].map((cell) => `<th>${escapeHtml(cell)}</th>`).join('')}</tr></thead><tbody>${standingsRows.slice(1).map((row) => `<tr>${row.map((cell, index) => `<td class="${index === 0 ? 'position-cell' : ''}">${escapeHtml(cell)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`
      : '<p class="source-empty">Nenhum documento de classificação encontrado para esta categoria/temporada.</p>';
};

const renderEditorial = (result) => {
  editorialSourceLink.href = result?.sourceUrl || '#';
  editorialSourceLink.hidden = !result?.sourceUrl;
  const articles = result?.articles || [];
  editorialList.innerHTML = articles.length
    ? articles.map((article, index) => `<div class="editorial-row"><a href="${escapeHtml(article.url)}" target="_blank" rel="noreferrer"><span class="editorial-index">${String(index + 1).padStart(2, '0')}</span><span><strong>${escapeHtml(article.title)}</strong><small>${escapeHtml(article.source)}</small></span><span class="document-arrow">↗</span></a><span class="editorial-actions"><button type="button" data-editorial-action="prepare" data-editorial-url="${escapeHtml(article.url)}">Short</button><button type="button" class="secondary-action" data-editorial-action="render" data-editorial-url="${escapeHtml(article.url)}">MP4</button></span></div>`).join('')
    : '<p class="source-empty">Nenhuma notícia encontrada no HTML público desta página inicial.</p>';
};

const loadSecondarySources = async () => {
  fiaDocuments.innerHTML = '<p class="source-empty">Carregando documentos FIA…</p>';
  editorialList.innerHTML = '<p class="source-empty">Carregando notícias…</p>';
  const base = new URLSearchParams({season: seasonInput.value, category: categorySelect.value});
  const [fia, editorial] = await Promise.allSettled([
    api(`/api/f1/sources/fia?${base}`),
    api(`/api/f1/sources/editorial?${base}`),
  ]);
  if (fia.status === 'fulfilled') renderFia(fia.value.result); else fiaWarning.textContent = fia.reason.message;
  if (editorial.status === 'fulfilled') renderEditorial(editorial.value.result); else editorialList.innerHTML = `<p class="source-empty">${escapeHtml(editorial.reason.message)}</p>`;
};

const loadAll = async () => {
  setStatus('Atualizando fontes…');
  await Promise.all([loadEvents(), loadSecondarySources(), loadStandings()]);
  setStatus('Fontes atualizadas.');
};

document.querySelectorAll('[data-source-tab]').forEach((tab) => tab.addEventListener('click', () => {
  document.querySelectorAll('[data-source-tab]').forEach((item) => item.classList.toggle('active', item === tab));
  document.querySelectorAll('[data-source-panel]').forEach((panel) => {
    const active = panel.dataset.sourcePanel === tab.dataset.sourceTab;
    panel.hidden = !active;
    panel.classList.toggle('active', active);
  });
}));
categorySelect.addEventListener('change', () => loadAll().catch((error) => setStatus(error.message, true)));
standingsType.addEventListener('change', loadStandings);
standingsCategory.addEventListener('change', loadStandings);
document.getElementById('prepare-standings-button').addEventListener('click', () => runStandingsJob(false));
document.getElementById('render-standings-button').addEventListener('click', () => runStandingsJob(true));
seasonInput.addEventListener('change', () => loadAll().catch((error) => setStatus(error.message, true)));
eventSelect.addEventListener('change', loadResults);
sessionSelect.addEventListener('change', loadResults);
document.getElementById('load-results-button').addEventListener('click', loadResults);
document.getElementById('prepare-source-result-button').addEventListener('click', () => runSourceResultJob(false));
document.getElementById('render-source-result-button').addEventListener('click', () => runSourceResultJob(true));
document.getElementById('prepare-fia-button').addEventListener('click', () => runFiaJob(false));
document.getElementById('render-fia-button').addEventListener('click', () => runFiaJob(true));
document.getElementById('load-source-preview-button').addEventListener('click', () => {
  try { updateSourcePreview(); } catch { setStatus('Informe uma URL válida para o Studio.', true); }
});
document.addEventListener('click', (event) => { const button = event.target.closest('[data-editorial-action]'); if (button) runEditorialJob(button.dataset.editorialUrl, button.dataset.editorialAction === 'render'); });
seasonInput.value = String(new Date().getFullYear());
const soundtracksReady = loadSoundtracks();
loadAll().catch((error) => setStatus(error.message, true));
