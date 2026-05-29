const form = document.getElementById('still-form');
const templateSelect = document.getElementById('template');
const competitionSelect = document.getElementById('competition');
const raceDataSection = document.getElementById('race-data-section');
const raceTypeSelect = document.getElementById('race-type-select');
const raceSelect = document.getElementById('race-id-select');
const outputNameInput = document.getElementById('output-name');
const renderButton = document.getElementById('render-button');
const currentJobRoot = document.getElementById('current-job');
const renderDownloadRoot = document.getElementById('render-download');
const stillPreviewImage = document.getElementById('still-preview-image');
const stillPreviewEmpty = document.getElementById('still-preview-empty');
const logOutput = document.getElementById('log-output');
const errorBanner = document.getElementById('error-banner');
const errorBannerText = document.getElementById('error-banner-text');
const dashboardQuickStatus = document.getElementById('dashboard-quick-status');

const apiBase = '/api/f1';
const supportedTemplates = new Set(['race-results', 'driver-standings', 'constructor-standings']);
const defaultOutputPrefixByTemplate = {
  'race-results': 'f1-large-race-results',
  'driver-standings': 'f1-large-driver-standings',
  'constructor-standings': 'f1-large-constructor-standings',
};

const escapeHtml = (value) =>
  String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');

const log = (message, replace = false) => {
  const timestamp = new Date().toLocaleTimeString();
  logOutput.textContent = replace
    ? `[${timestamp}] ${message}`
    : `${logOutput.textContent}\n[${timestamp}] ${message}`;
  logOutput.scrollTop = logOutput.scrollHeight;
};

const setBusy = (busy) => {
  renderButton.disabled = busy;
  templateSelect.disabled = busy;
  competitionSelect.disabled = busy;
  raceTypeSelect.disabled = busy || templateSelect.value !== 'race-results';
  raceSelect.disabled = busy || templateSelect.value !== 'race-results';
};

const setErrorBanner = (message) => {
  const normalized = String(message ?? '').trim();
  errorBanner.hidden = !normalized;
  errorBannerText.textContent = normalized;
};

const formDataToObject = () => Object.fromEntries(new FormData(form).entries());

const selectedTemplateLabel = () =>
  templateSelect.selectedOptions?.[0]?.textContent?.trim() || templateSelect.value;

const selectedCompetitionLabel = () =>
  competitionSelect.selectedOptions?.[0]?.textContent?.trim() ||
  form.elements.competitionName.value ||
  'Formula 1';

const defaultOutputName = () => {
  const season = form.elements.season.value || new Date().getFullYear();
  return `${defaultOutputPrefixByTemplate[templateSelect.value]}-${season}.png`;
};

const updateOutputPlaceholder = () => {
  outputNameInput.placeholder = defaultOutputName();
};

const updateStatus = () => {
  const templateLabel = selectedTemplateLabel();
  const competitionLabel = selectedCompetitionLabel();
  const raceLabel =
    templateSelect.value === 'race-results'
      ? raceSelect.selectedOptions?.[0]?.textContent?.split('•')?.[0]?.trim() || 'Automatico'
      : 'standings';

  dashboardQuickStatus.textContent = `${templateLabel} • ${competitionLabel} • ${raceLabel}`;
};

const renderCurrentJob = (job) => {
  if (!job) {
    currentJobRoot.innerHTML =
      '<div class="job-status-card"><div><strong>Nenhum still renderizado</strong><span>Escolha o tipo de still e gere o PNG.</span></div></div>';
    return;
  }

  const detailLine =
    job.template === 'race-results'
      ? `${job.podium?.length ?? 0} podium • ${job.entries?.length ?? 0} linhas`
      : `${job.entries?.length ?? 0} linhas`;

  currentJobRoot.innerHTML = `
    <div class="job-status-card">
      <div>
        <strong>${escapeHtml(job.title)} • ${escapeHtml(selectedTemplateLabel())}</strong>
        <span>${escapeHtml(job.subtitle)} • ${escapeHtml(detailLine)} • ${escapeHtml(job.outputName)}</span>
      </div>
      <div class="job-status-meta">
        <span class="chip subtle">${escapeHtml(String(job.season))}</span>
        <span class="chip subtle">1920x1080</span>
      </div>
    </div>
  `;
};

const setRenderDownload = (job, render) => {
  if (!job || !render?.outputPath) {
    renderDownloadRoot.innerHTML = '';
    stillPreviewImage.hidden = true;
    stillPreviewImage.removeAttribute('src');
    stillPreviewEmpty.hidden = false;
    return;
  }

  const downloadPath = `/${render.outputPath
    .replace(/^\/+/, '')
    .split('/')
    .map((part) => encodeURIComponent(part))
    .join('/')}`;

  renderDownloadRoot.innerHTML = `
    <div class="job-download-card">
      <div>
        <strong>PNG pronto</strong>
        <span>${escapeHtml(job.outputName)}</span>
      </div>
      <a class="download-link" href="${downloadPath}" download>Download PNG</a>
    </div>
  `;

  stillPreviewImage.src = `${downloadPath}?previewTs=${Date.now()}`;
  stillPreviewImage.hidden = false;
  stillPreviewEmpty.hidden = true;
};

const applyTemplateVisibility = () => {
  const isRaceResults = templateSelect.value === 'race-results';
  raceDataSection.hidden = !isRaceResults;
  raceTypeSelect.disabled = !isRaceResults;
  raceSelect.disabled = !isRaceResults;
  if (!isRaceResults) {
    raceSelect.value = '';
  }
  updateOutputPlaceholder();
  updateStatus();
};

const loadRaceOptions = async (preferredRaceId) => {
  if (templateSelect.value !== 'race-results') {
    return;
  }

  const season = Number(form.elements.season.value || new Date().getFullYear());
  const competitionId = Number(form.elements.competitionId.value || competitionSelect.value || 1);
  const raceType = String(form.elements.raceType.value || 'Race');

  raceSelect.disabled = true;
  raceSelect.innerHTML = '<option value="">Carregando corridas...</option>';

  try {
    const params = new URLSearchParams({
      season: String(season),
      competitionId: String(competitionId),
      template: 'race-results',
      raceType,
    });
    const response = await fetch(`${apiBase}/races?${params.toString()}`);
    const data = await response.json();
    if (!response.ok || !data.ok) {
      throw new Error(data.error || 'Falha ao carregar corridas.');
    }

    const races = Array.isArray(data.races) ? data.races : [];
    const raceOptions = races
      .map((race) => `<option value="${escapeHtml(String(race.id))}">${escapeHtml(race.label)}</option>`)
      .join('');
    raceSelect.innerHTML = `<option value="">Automatico (mais recente)</option>${raceOptions}`;

    const selectedRaceId = preferredRaceId ?? form.elements.raceId.value;
    raceSelect.value =
      selectedRaceId && races.some((race) => String(race.id) === String(selectedRaceId))
        ? String(selectedRaceId)
        : '';
  } catch (error) {
    raceSelect.innerHTML = '<option value="">Automatico (lista indisponivel)</option>';
    log(error instanceof Error ? error.message : String(error));
  } finally {
    raceSelect.disabled = false;
    updateStatus();
  }
};

const loadOptions = async () => {
  const response = await fetch(`${apiBase}/options`);
  const data = await response.json();
  const stillTemplates = (data.templates ?? []).filter((template) =>
    supportedTemplates.has(template.template)
  );

  templateSelect.innerHTML = stillTemplates
    .map((template) => `<option value="${template.template}">${escapeHtml(template.label)}</option>`)
    .join('');

  competitionSelect.innerHTML = (data.competitionPresets ?? [])
    .map(
      (competition) =>
        `<option value="${escapeHtml(String(competition.competitionId))}">${escapeHtml(competition.label)}</option>`
    )
    .join('');

  const currentJob = supportedTemplates.has(data.currentJob?.template) ? data.currentJob : null;
  form.elements.template.value = currentJob?.template ?? 'race-results';
  competitionSelect.value = String(currentJob?.competitionId ?? '1');
  form.elements.season.value = currentJob?.season ?? new Date().getFullYear();
  form.elements.competitionId.value = currentJob?.competitionId ?? competitionSelect.value ?? '1';
  form.elements.competitionName.value = currentJob?.competitionName ?? selectedCompetitionLabel();
  form.elements.brandName.value = currentJob?.brandName ?? 'Radio do Box';
  form.elements.raceType.value = currentJob?.raceType ?? 'Race';
  form.elements.raceId.value = currentJob?.raceId ?? '';
  form.elements.labelOverride.value =
    currentJob?.template === 'race-results' ? currentJob?.raceName ?? '' : currentJob?.subtitle ?? '';
  form.elements.outputName.value = '';

  applyTemplateVisibility();
  await loadRaceOptions(currentJob?.raceId);
  renderCurrentJob(currentJob);
  setRenderDownload(null, null);
  setErrorBanner('');
  log(data.statusMessage || 'Dashboard de stills F1 pronto.', true);
};

const renderStill = async () => {
  try {
    const payload = formDataToObject();
    payload.template = supportedTemplates.has(payload.template) ? payload.template : 'race-results';
    payload.season = payload.season || String(new Date().getFullYear());
    setBusy(true);
    setErrorBanner('');
    setRenderDownload(null, null);
    log('Renderizando PNG still...');

    if (!payload.outputName) {
      payload.outputName = defaultOutputName();
    }

    const response = await fetch(`${apiBase}/large-stills/render`, {
      method: 'POST',
      headers: {'content-type': 'application/json'},
      body: JSON.stringify(payload),
    });
    const data = await response.json();
    if (!response.ok || !data.ok) {
      throw new Error(data.error || 'Falha ao renderizar still.');
    }

    renderCurrentJob(data.job);
    setRenderDownload(data.job, data.render);
    log(data.message || 'Still renderizado.');
    if (data.fallbackReason) {
      log(`Fallback ativo: ${data.fallbackReason}`);
    }
    if (data.render?.outputPath) {
      log(`Arquivo renderizado: ${data.render.outputPath}`);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    setErrorBanner(message);
    log(message);
  } finally {
    setBusy(false);
  }
};

competitionSelect.addEventListener('change', () => {
  const selected = competitionSelect.options[competitionSelect.selectedIndex];
  form.elements.competitionId.value = competitionSelect.value;
  form.elements.competitionName.value = selected?.textContent ?? 'Formula 1';
  updateStatus();
  void loadRaceOptions();
});

templateSelect.addEventListener('change', () => {
  form.elements.raceType.value = 'Race';
  form.elements.raceId.value = '';
  applyTemplateVisibility();
  void loadRaceOptions();
});

form.elements.season.addEventListener('change', () => {
  updateOutputPlaceholder();
  updateStatus();
  void loadRaceOptions();
});

raceTypeSelect.addEventListener('change', () => {
  updateStatus();
  void loadRaceOptions();
});

raceSelect.addEventListener('change', updateStatus);
renderButton.addEventListener('click', renderStill);

loadOptions();
