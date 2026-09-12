const seasonInput = document.getElementById('season-input');
const categorySelect = document.getElementById('category-select');
const raceSelect = document.getElementById('race-select');
const labelInput = document.getElementById('label-input');
const outputInput = document.getElementById('output-input');
const soundtrackSelect = document.getElementById('soundtrack-select');
const voiceoverInput = document.getElementById('voiceover-input');
const prepareButton = document.getElementById('prepare-button');
const renderButton = document.getElementById('render-button');
const pngButton = document.getElementById('png-button');
const pngLandscapeButton = document.getElementById('png-landscape-button');
const statusMessage = document.getElementById('status-message');
const outputMessage = document.getElementById('output-message');
const raceHeading = document.getElementById('race-heading');
const sessionCount = document.getElementById('session-count');
const sessionsList = document.getElementById('sessions-list');
const sourceChip = document.getElementById('source-chip');
const downloadLink = document.getElementById('download-link');
const downloadPngLink = document.getElementById('download-png-link');
const categoryChip = document.getElementById('category-chip');
const sourceChipNav = document.getElementById('source-chip-nav');
let races = [];
const categories = {f1: {label: 'Formula 1', short: 'F1', source: 'formula1.com'}, f2: {label: 'Formula 2', short: 'F2', source: 'fiaformula2.com'}, f3: {label: 'Formula 3', short: 'F3', source: 'fiaformula3.com'}, 'f1-academy': {label: 'F1 Academy', short: 'F1 Academy', source: 'f1academy.com'}};

const escapeHtml = (value) => String(value ?? '')
  .replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;').replaceAll("'", '&#39;');
const setStatus = (message, error = false) => {
  statusMessage.textContent = message;
  statusMessage.classList.toggle('error', error);
};
const setBusy = (busy) => {
  prepareButton.disabled = busy;
  renderButton.disabled = busy;
  pngButton.disabled = busy;
  pngLandscapeButton.disabled = busy;
  raceSelect.disabled = busy || races.length === 0;
};
const renderSessions = (job) => {
  const sessions = Array.isArray(job?.sessions) ? job.sessions : [];
  raceHeading.textContent = job?.subtitle || job?.raceName || 'Próximo GP';
  sessionCount.textContent = `${sessions.length} ${sessions.length === 1 ? 'sessão' : 'sessões'}`;
  sessionsList.innerHTML = sessions.length === 0
    ? '<p class="schedule-empty">Nenhuma sessão oficial encontrada.</p>'
    : sessions.map((session) => `<article class="official-session-row"><div><strong>${escapeHtml(session.title)}</strong><span>${escapeHtml(session.dayLabel)} • ${escapeHtml(session.subtitle || 'Agendada')}</span></div><time>${escapeHtml(session.timeLabel)}</time></article>`).join('');
};
const fillRaces = (preferredId) => {
  raceSelect.innerHTML = races.map((race) => `<option value="${escapeHtml(race.id)}">${escapeHtml(race.label)}</option>`).join('');
  if (preferredId && races.some((race) => String(race.id) === String(preferredId))) raceSelect.value = String(preferredId);
  if (!preferredId) {
    const nextRace = races.find((race) => race.status === 'Scheduled');
    if (nextRace) raceSelect.value = String(nextRace.id);
  }
  raceSelect.disabled = races.length === 0;
};
const loadRaces = async (preferredId) => {
  raceSelect.disabled = true;
  raceSelect.innerHTML = '<option>Buscando no Formula1.com…</option>';
  const category = categories[categorySelect.value] || categories.f1;
  const params = new URLSearchParams({season: seasonInput.value, competitionId: '1', template: 'weekend-schedule', category: categorySelect.value});
  const response = await fetch(`/api/f1/races?${params}`);
  const data = await response.json();
  if (!response.ok || !data.ok) throw new Error(data.error || 'Falha ao carregar o calendário oficial.');
  races = Array.isArray(data.races) ? data.races : [];
  fillRaces(preferredId);
  sourceChip.textContent = `${races.length} rodadas • ${category.source}`;
  categoryChip.textContent = category.short;
  sourceChipNav.textContent = category.source;
  document.querySelector('.dashboard-header h1').textContent = `Horários Oficiais ${category.short}`;
};
const prepare = async (render = false) => {
  if (!raceSelect.value) return setStatus('Selecione um GP antes de continuar.', true);
  setBusy(true); setStatus(render ? 'Renderizando o Short…' : 'Preparando o Short…'); downloadLink.hidden = true; downloadPngLink.hidden = true;
  try {
    const response = await fetch(`/api/f1/jobs/${render ? 'render' : 'prepare'}`, {
      method: 'POST', headers: {'content-type': 'application/json'},
      body: JSON.stringify({template: 'weekend-schedule', category: categorySelect.value, season: seasonInput.value, competitionId: 1, raceId: raceSelect.value, labelOverride: labelInput.value, outputName: outputInput.value, soundtrackPath: soundtrackSelect.value, voiceoverEnabled: voiceoverInput.checked}),
    });
    const data = await response.json();
    if (!response.ok || !data.ok) throw new Error(data.error || 'Não foi possível preparar o Short.');
    renderSessions(data.job);
    outputMessage.textContent = data.render?.outputPath ? `MP4 pronto: ${data.render.outputPath}` : `${data.message} Fonte: ${data.job.sourceLabel || data.job.dataSource}. Fuso: America/Sao_Paulo.`;
    if (data.render?.outputPath) { downloadLink.href = `/out/${encodeURIComponent(data.job.outputName)}`; downloadLink.hidden = false; }
    setStatus(render ? 'MP4 renderizado com sucesso.' : 'Job preparado com sucesso.');
  } catch (error) { setStatus(error instanceof Error ? error.message : String(error), true); }
  finally { setBusy(false); }
};
const renderPng = async (format) => {
  if (!raceSelect.value) return setStatus('Selecione uma rodada antes de continuar.', true);
  setBusy(true); setStatus(`Renderizando PNG ${format === 'landscape' ? '16:9' : '9:16'}…`); downloadLink.hidden = true; downloadPngLink.hidden = true;
  try {
    const response = await fetch('/api/f1/jobs/render-png', {method: 'POST', headers: {'content-type': 'application/json'}, body: JSON.stringify({template: 'weekend-schedule', category: categorySelect.value, season: seasonInput.value, competitionId: 1, raceId: raceSelect.value, labelOverride: labelInput.value, outputName: outputInput.value, soundtrackPath: soundtrackSelect.value, voiceoverEnabled: false, format})});
    const data = await response.json();
    if (!response.ok || !data.ok) throw new Error(data.error || 'Não foi possível renderizar o PNG.');
    renderSessions(data.job); outputMessage.textContent = `PNG pronto: ${data.render.outputPath}`; downloadPngLink.href = `/out/${encodeURIComponent(data.job.outputName)}`; downloadPngLink.textContent = `Download PNG ${format === 'landscape' ? '16:9' : '9:16'}`; downloadPngLink.hidden = false; setStatus('PNG renderizado com sucesso.');
  } catch (error) { setStatus(error instanceof Error ? error.message : String(error), true); }
  finally { setBusy(false); }
};
const init = async () => {
  seasonInput.value = String(new Date().getFullYear());
  try {
    const options = await (await fetch('/api/f1/options')).json();
    soundtrackSelect.innerHTML = (options.soundtrackPresets ?? []).map((preset) => `<option value="${escapeHtml(preset.value)}">${escapeHtml(preset.label)}</option>`).join('');
    const scheduleJob = options.currentJob?.template === 'weekend-schedule' ? options.currentJob : null;
    if (scheduleJob?.category && categories[scheduleJob.category]) categorySelect.value = scheduleJob.category;
    await loadRaces(scheduleJob?.raceId);
    if (scheduleJob) { labelInput.value = scheduleJob.subtitle || ''; outputInput.value = scheduleJob.outputName || ''; renderSessions(scheduleJob); outputMessage.textContent = 'Job oficial atual carregado.'; }
  } catch (error) { setStatus(error instanceof Error ? error.message : String(error), true); sourceChip.textContent = 'Indisponível'; }
};
seasonInput.addEventListener('change', () => loadRaces().catch((error) => setStatus(error.message, true)));
categorySelect.addEventListener('change', () => loadRaces().catch((error) => setStatus(error.message, true)));
raceSelect.addEventListener('change', () => { raceHeading.textContent = races.find((race) => String(race.id) === String(raceSelect.value))?.label || 'GP selecionado'; });
prepareButton.addEventListener('click', () => prepare(false));
renderButton.addEventListener('click', () => prepare(true));
pngButton.addEventListener('click', () => renderPng('vertical'));
pngLandscapeButton.addEventListener('click', () => renderPng('landscape'));
init();
