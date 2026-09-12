const form = document.getElementById('job-form');
const templateSelect = document.getElementById('template');
const competitionSelect = document.getElementById('competition');
const raceSelectorFields = document.getElementById('race-selector-fields');
const teammateBattleFields = document.getElementById('teammate-battle-fields');
const racePredictionFields = document.getElementById('race-prediction-fields');
const predictionAuthorSelect = document.getElementById('prediction-author-select');
const predictionTypeSelect = document.getElementById('prediction-type-select');
const predictionDriverFields = document.getElementById('prediction-driver-fields');
const raceSelect = document.getElementById('race-id-select');
const raceTypeSelect = document.getElementById('race-type-select');
const teamSelect = document.getElementById('team-id-select');
const soundtrackSelect = document.getElementById('soundtrack-select');
const soundtrackVolumeRange = document.getElementById('soundtrack-volume-range');
const voiceoverEnabledCheckbox = document.querySelector(
  'input[type="checkbox"][name="voiceoverEnabled"]'
);
const prepareButton = document.getElementById('prepare-button');
const renderButton = document.getElementById('render-button');
const currentJobRoot = document.getElementById('current-job');
const renderDownloadRoot = document.getElementById('render-download');
const templateChip = document.getElementById('job-template-chip');
const dashboardCompetitionChip = document.getElementById('dashboard-competition-chip');
const dashboardQuickStatus = document.getElementById('dashboard-quick-status');
const raceDataSection = document.getElementById('race-data-section');
const logOutput = document.getElementById('log-output');
const errorBanner = document.getElementById('error-banner');
const errorBannerText = document.getElementById('error-banner-text');
const studioUrlInput = document.getElementById('studio-url');
const applyPreviewButton = document.getElementById('apply-preview-button');
const openPreviewLink = document.getElementById('open-preview-link');
const previewFrame = document.getElementById('preview-frame');
const youtubePrimaryAudienceInput = document.getElementById('youtube-primary-audience');
const youtubeStoryBriefInput = document.getElementById('youtube-story-brief');
const generateYoutubeContentButton = document.getElementById('generate-youtube-content-button');
const youtubeContentStatus = document.getElementById('youtube-content-status');
const youtubeContentOutput = document.getElementById('youtube-content-output');
const youtubeTitleOutput = document.getElementById('youtube-title-output');
const youtubeDescriptionOutput = document.getElementById('youtube-description-output');
const tiktokDescriptionOutput = document.getElementById('tiktok-description-output');
const instagramDescriptionOutput = document.getElementById('instagram-description-output');
const youtubeTagsOutput = document.getElementById('youtube-tags-output');
const youtubePinnedCommentOutput = document.getElementById('youtube-pinned-comment-output');
const copyActiveDescriptionButton = document.getElementById('copy-active-description-button');
const manualAdjustmentsBuilder = document.getElementById('manual-adjustments-builder');
const pasteResultsInput = document.getElementById('paste-results-input');
const pasteSeasonInput = document.getElementById('paste-season');
const pasteOutputNameInput = document.getElementById('paste-output-name');
const pasteLabelOverrideInput = document.getElementById('paste-label-override');
const pasteSoundtrackSelect = document.getElementById('paste-soundtrack-select');
const pastePrepareButton = document.getElementById('paste-prepare-button');
const pasteRenderButton = document.getElementById('paste-render-button');
const pasteResultsStatus = document.getElementById('paste-results-status');
let manualAdjustmentsDraft = '';

const apiBase = '/api/f1';
const STUDIO_URL_KEY = 'f1-dashboard-studio-url';
const MANUAL_ADJUSTMENTS_KEY = 'f1-dashboard-manual-adjustments';
const templateCompositionMap = {
  'race-results': 'F1RaceResultsShort',
  'race-pace': 'F1RacePaceShort',
  'teammate-battle': 'F1TeammateBattleShort',
  'circuit-insights': 'F1CircuitInsightsShort',
  'qualifying-grid': 'F1QualifyingGridShort',
  'driver-standings': 'F1DriverStandingsShort',
  'constructor-standings': 'F1ConstructorStandingsShort',
  'weekend-schedule': 'F1WeekendScheduleShort',
  'race-predictions': 'F1RacePredictionsShort',
};
const defaultRaceTypeByTemplate = {
  'race-results': 'Race',
  'race-pace': 'Race',
  'teammate-battle': 'Race',
  'circuit-insights': 'Race',
  'qualifying-grid': '3rd Qualifying',
  'race-predictions': 'Race',
};

const setBusy = (busy) => {
  prepareButton.disabled = busy;
  renderButton.disabled = busy;
};

const setYoutubeBusy = (busy) => {
  generateYoutubeContentButton.disabled = busy;
};

const log = (message, replace = false) => {
  const timestamp = new Date().toLocaleTimeString();
  logOutput.textContent = replace ? `[${timestamp}] ${message}` : `${logOutput.textContent}\n[${timestamp}] ${message}`;
  logOutput.scrollTop = logOutput.scrollHeight;
};

const setErrorBanner = (message) => {
  const normalized = String(message ?? '').trim();
  if (!normalized) {
    errorBanner.hidden = true;
    errorBannerText.textContent = '';
    return;
  }

  errorBanner.hidden = false;
  errorBannerText.textContent = normalized;
};

const bannerMessageForErrorType = (errorType, fallbackMessage) => {
  if (errorType === 'official_schedule_unavailable') {
    return 'Não foi possível obter os horários oficiais no Formula1.com. Tente novamente.';
  }
  if (errorType === 'network_error') {
    return 'Falha de rede ao buscar dados da API-Sports. Tente novamente.';
  }
  if (errorType === 'team_data_missing') {
    return 'Não foi possível montar a dupla da equipe para esse GP. Tente outra equipe ou corrida.';
  }
  return fallbackMessage;
};

const formDataToObject = () => Object.fromEntries(new FormData(form).entries());
const getSelectedOptionLabel = (selectElement) =>
  selectElement?.selectedOptions?.[0]?.textContent?.trim() ?? '';
const requiresRacePicker = () =>
  templateSelect.value === 'race-results' ||
  templateSelect.value === 'race-pace' ||
  templateSelect.value === 'teammate-battle' ||
  templateSelect.value === 'circuit-insights' ||
  templateSelect.value === 'qualifying-grid' ||
  templateSelect.value === 'race-predictions';
const requiresTeamBattleFields = () => templateSelect.value === 'teammate-battle';
const requiresPredictionFields = () => templateSelect.value === 'race-predictions';
const raceTypeForTemplate = (template) => defaultRaceTypeByTemplate[template] ?? 'Race';

const ensurePredictionDriverFields = () => {
  if (predictionDriverFields.children.length > 0) {
    return;
  }

  predictionDriverFields.innerHTML = Array.from({length: 10}, (_, index) => {
    const position = index + 1;
    return `
      <label>
        P${position}
        <select name="predictionDriver${position}" data-prediction-driver-index="${position}">
          <option value="">Carregando pilotos…</option>
        </select>
      </label>
    `;
  }).join('');
};

const predictionDriverSelects = () =>
  [...predictionDriverFields.querySelectorAll('select[data-prediction-driver-index]')];

const normalizePredictionDriverName = (value) =>
  String(value ?? '')
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

const validatePredictionDriverUniqueness = () => {
  if (!requiresPredictionFields()) {
    return true;
  }

  const seen = new Map();
  for (const select of predictionDriverSelects()) {
    select.setCustomValidity('');
    const normalized = normalizePredictionDriverName(select.value);
    if (!normalized) {
      continue;
    }

    const duplicate = seen.get(normalized);
    if (duplicate) {
      const driverName = select.options[select.selectedIndex]?.textContent?.split('•')[0]?.trim() || select.value;
      const message = `${driverName} já foi selecionado. Cada piloto só pode aparecer uma vez no Top 10.`;
      duplicate.setCustomValidity(message);
      select.setCustomValidity(message);
      setErrorBanner(message);
      log(message);
      select.reportValidity();
      select.focus();
      return false;
    }

    seen.set(normalized, select);
  }

  return true;
};

const normalizeSoundtrackVolume = (value) => {
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue)) {
    return '0.30';
  }

  return Math.max(0, Math.min(1, numericValue)).toFixed(2);
};

const isVideoOutputName = (value) => /\.(mp4|mkv|mov)$/i.test(String(value ?? '').trim());

const setSoundtrackVolume = (value) => {
  const normalizedValue = normalizeSoundtrackVolume(value);
  form.elements.soundtrackVolume.value = normalizedValue;
  if (soundtrackVolumeRange) {
    soundtrackVolumeRange.value = normalizedValue;
  }
};

const escapeHtml = (value) =>
  String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');

const normalizeAdjustmentKey = (value) =>
  String(value ?? '')
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '');

const classificationEntriesForJob = (job) => {
  if (!job || !['race-results', 'qualifying-grid'].includes(job.template)) {
    return [];
  }

  const podium = Array.isArray(job.podium) ? job.podium : [];
  const entries = Array.isArray(job.entries) ? job.entries : [];
  return [...podium, ...entries]
    .filter((entry) => entry?.name)
    .sort((a, b) => Number(a.position ?? 999) - Number(b.position ?? 999));
};

const manualAdjustmentMap = () => {
  const map = new Map();
  String(
    manualAdjustmentsDraft ||
      form.elements.manualAdjustments?.value ||
      localStorage.getItem(MANUAL_ADJUSTMENTS_KEY) ||
      ''
  )
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .forEach((line) => {
      const timeMatch = line.match(/([+-]?\d+(?:[.,]\d+)?)\s*(?:s|sec|seg|segundo|segundos)\b/i);
      const positionMatch = line.match(/([+-]?\d+)\s*(?:pos|posicao|posicoes|posição|posições|places?|grid)\b/i);
      if (!timeMatch && !positionMatch) {
        return;
      }
      const driverName = line
        .replace(timeMatch?.[0] ?? '', '')
        .replace(positionMatch?.[0] ?? '', '')
        .trim();
      if (driverName) {
        map.set(normalizeAdjustmentKey(driverName), {
          seconds: timeMatch?.[1]?.trim() ?? '',
          positions: positionMatch?.[1]?.replace(/^\+/, '').trim() ?? '',
        });
      }
    });
  return map;
};

const syncManualAdjustmentsFromBuilder = () => {
  if (!manualAdjustmentsBuilder || !form.elements.manualAdjustments) {
    return;
  }

  const lines = [...manualAdjustmentsBuilder.querySelectorAll('[data-manual-adjustment-row]')]
    .map((row) => {
      const driver = row.dataset.manualAdjustmentRow;
      const seconds = row.querySelector('[data-manual-adjustment-seconds]')?.value.trim();
      const positions = row.querySelector('[data-manual-adjustment-positions]')?.value.trim();
      const parts = [];
      if (seconds) {
        parts.push(`+${seconds.replace(/^\+/, '')}s`);
      }
      if (positions) {
        parts.push(`+${positions.replace(/^\+/, '')} pos`);
      }
      return parts.length > 0 ? `${driver} ${parts.join(' ')}` : '';
    })
    .filter(Boolean);
  form.elements.manualAdjustments.value = lines.join('\n');
  manualAdjustmentsDraft = form.elements.manualAdjustments.value;
  localStorage.setItem(MANUAL_ADJUSTMENTS_KEY, manualAdjustmentsDraft);
};

const preserveManualAdjustmentsPayload = () => {
  if (!form.elements.manualAdjustments) {
    return;
  }
  if (!form.elements.manualAdjustments.value && manualAdjustmentsDraft) {
    form.elements.manualAdjustments.value = manualAdjustmentsDraft;
  }
  if (!manualAdjustmentsDraft && form.elements.manualAdjustments.value) {
    manualAdjustmentsDraft = form.elements.manualAdjustments.value;
  }
  if (manualAdjustmentsDraft) {
    localStorage.setItem(MANUAL_ADJUSTMENTS_KEY, manualAdjustmentsDraft);
  }
};

const renderManualAdjustmentsBuilder = (job) => {
  if (!manualAdjustmentsBuilder) {
    return;
  }

  if (!manualAdjustmentsDraft && !form.elements.manualAdjustments?.value) {
    form.elements.manualAdjustments.value = Array.isArray(job?.manualAdjustments)
      ? job.manualAdjustments.join('\n')
      : job?.manualAdjustments ?? localStorage.getItem(MANUAL_ADJUSTMENTS_KEY) ?? '';
    manualAdjustmentsDraft = form.elements.manualAdjustments.value;
  }

  const rows = classificationEntriesForJob(job);
  if (rows.length === 0) {
    manualAdjustmentsBuilder.innerHTML =
      '<div class="manual-adjustments-empty">Prepare um job de Resultado ou Grid para listar pilotos ajustáveis.</div>';
    return;
  }

  const existing = manualAdjustmentMap();
  manualAdjustmentsBuilder.innerHTML = `
    <div class="manual-adjustments-title">
      <strong>Ajustes manuais</strong>
      <span>Preencha somente quem recebeu punição. O prepare/render recalcula a ordem.</span>
    </div>
    <div class="manual-adjustments-header">
      <span>Pos</span>
      <span>Piloto</span>
      <span>Equipe</span>
      <span>Tempo +s</span>
      <span>Pos. perdidas</span>
    </div>
    ${rows
      .map((entry) => {
        const key = normalizeAdjustmentKey(entry.name);
        const existingValue = existing.get(key) ?? {};
        return `
          <div class="manual-adjustments-row" data-manual-adjustment-row="${escapeHtml(entry.name)}">
            <span class="manual-adjustments-position">P${escapeHtml(String(entry.position ?? ''))}</span>
            <span class="manual-adjustments-driver">${escapeHtml(entry.name)}</span>
            <span class="manual-adjustments-team">${escapeHtml(entry.team || entry.badge?.sublabel || '')}</span>
            <input
              type="number"
              step="0.001"
              min="0"
              inputmode="decimal"
              data-manual-adjustment-seconds
              value="${escapeHtml(existingValue.seconds ?? '')}"
              placeholder="5.000"
            />
            <input
              type="number"
              step="1"
              min="0"
              inputmode="numeric"
              data-manual-adjustment-positions
              value="${escapeHtml(existingValue.positions ?? '')}"
              placeholder="3"
            />
          </div>
        `;
      })
      .join('')}
  `;
  manualAdjustmentsBuilder
    .querySelectorAll('[data-manual-adjustment-seconds], [data-manual-adjustment-positions]')
    .forEach((input) => input.addEventListener('input', syncManualAdjustmentsFromBuilder));
};

const updateDashboardMeta = () => {
  const templateLabel = getSelectedOptionLabel(templateSelect) || 'template';
  const competitionLabel =
    getSelectedOptionLabel(competitionSelect) || form.elements.competitionName.value || 'Formula 1';
  const raceLabel = selectedRaceLabel();

  templateChip.textContent = templateLabel;
  if (dashboardCompetitionChip) {
    dashboardCompetitionChip.textContent = competitionLabel;
  }
  if (dashboardQuickStatus) {
    dashboardQuickStatus.textContent = `${templateLabel} • ${competitionLabel} • ${raceLabel}`;
  }
};

const templateHints = {
  'race-results': 'Usa a ultima corrida concluida e monta podium + lista de continuacao.',
  'race-pace': 'Calcula o ritmo medio por volta (top 10) da corrida selecionada.',
  'teammate-battle':
    'Duelo interno da equipe com placar de classificacao, corrida e pontos no campeonato.',
  'circuit-insights':
    'Prévia do próximo GP com pontos-chave do circuito, stats e último vencedor do ano anterior.',
  'qualifying-grid': 'Usa o grid mais recente disponivel e destaca P1, P2 e P3.',
  'driver-standings': 'Mostra o mundial atual de pilotos.',
  'constructor-standings': 'Mostra o mundial atual de construtores.',
  'weekend-schedule': 'Busca o proximo fim de semana de GP por padrao.',
  'race-predictions': 'Monta um Top 10 manual de palpite para classificacao ou corrida.',
};

const f1SpeechCopy = {
  'race-results': {
    title: (ctx) => ctx.raceName,
    subtitle: () => 'Resultado da Corrida',
    voice: (ctx) => `Fala, galera do box. Resultado da corrida no ${ctx.raceName}.`,
  },
  'race-pace': {
    title: (ctx) => ctx.raceName,
    subtitle: () => 'Ritmo de Corrida',
    voice: (ctx) => `Fala, galera do box. Ritmo de corrida no ${ctx.raceName}.`,
  },
  'teammate-battle': {
    title: (ctx) => ctx.teamName || ctx.raceName,
    subtitle: () => 'Head-to-Head de Equipe',
    voice: (ctx) => `Fala, galera do box. Duelo interno da ${ctx.teamName || 'equipe'} no ${ctx.raceName}.`,
  },
  'circuit-insights': {
    title: (ctx) => ctx.raceName,
    subtitle: () => 'Circuito Insights',
    voice: (ctx) => `Fala, galera do box. Pontos chave do circuito para o ${ctx.raceName}.`,
  },
  'qualifying-grid': {
    title: (ctx) => ctx.raceName,
    subtitle: () => 'Classificacao de Largada',
    voice: (ctx) => `Fala, galera do box. Classificacao de largada do ${ctx.raceName}.`,
  },
  'driver-standings': {
    title: () => 'Mundial de Pilotos',
    subtitle: (ctx) => `Formula 1 ${ctx.season}`,
    voice: (ctx) => `Fala, galera do box. Mundial de pilotos atualizado da Formula 1 ${ctx.season}.`,
  },
  'constructor-standings': {
    title: () => 'Mundial de Construtores',
    subtitle: (ctx) => `Formula 1 ${ctx.season}`,
    voice: (ctx) => `Fala, galera do box. Mundial de construtores atualizado da Formula 1 ${ctx.season}.`,
  },
  'weekend-schedule': {
    title: (ctx) => ctx.raceName,
    subtitle: () => 'Horarios do GP',
    voice: (ctx) => `Fala, galera do box. Horarios do ${ctx.raceName}.`,
  },
  'race-predictions': {
    title: (ctx) => `Palpite para a ${ctx.predictionTypeLabel}`,
    subtitle: (ctx) => `${ctx.predictionTypeLabel} • ${ctx.predictionAuthorName}`,
    voice: (ctx) =>
      `Fala, galera do box. Palpite ${ctx.predictionAuthorPronoun} ${ctx.predictionAuthorName} para o top 10 de ${ctx.predictionTypeLabel.toLowerCase()} no ${ctx.raceName}.`,
  },
};

const selectedRaceLabel = () => {
  const selected = raceSelect.options[raceSelect.selectedIndex];
  const rawLabel = selected?.textContent?.split('•')[0]?.trim();
  return rawLabel && !/autom[aá]tico/i.test(rawLabel) ? rawLabel : 'Formula 1';
};

const currentIntroContext = () => ({
  raceName: selectedRaceLabel(),
  season: form.elements.season.value || new Date().getFullYear(),
  teamName: teamSelect.options[teamSelect.selectedIndex]?.textContent?.split('(')[0]?.trim() || '',
  predictionAuthorName:
    predictionAuthorSelect.options[predictionAuthorSelect.selectedIndex]?.textContent?.trim() || 'Vini',
  predictionAuthorPronoun: normalizePredictionAuthorValue(predictionAuthorSelect.value) === 'eme' ? 'da' : 'do',
  predictionTypeLabel:
    predictionTypeSelect.options[predictionTypeSelect.selectedIndex]?.textContent?.trim() || 'Corrida',
});

const normalizePredictionAuthorValue = (value) => (value === 'emeline' ? 'eme' : value || 'vini');

const selectedTemplateLabel = () => getSelectedOptionLabel(templateSelect) || templateSelect.value;

const currentYoutubeContext = () => ({
  ...formDataToObject(),
  templateLabel: selectedTemplateLabel(),
  raceName: selectedRaceLabel(),
  competitionLabel: getSelectedOptionLabel(competitionSelect) || form.elements.competitionName.value,
  teamName: teamSelect.options[teamSelect.selectedIndex]?.textContent?.split('(')[0]?.trim() || '',
});

const defaultTeamBattleContextSubtitle = () => {
  const raceName = selectedRaceLabel();
  if (!raceName || raceName === 'Formula 1') {
    return 'Após o GP';
  }
  return `Após o ${raceName.replace(/^GP\\s+/i, 'GP de ')}`;
};

const applyIntroPlaceholders = () => {
  const copy = f1SpeechCopy[templateSelect.value];
  const ctx = currentIntroContext();
  if (!copy) {
    return;
  }

  form.elements.introTitle.placeholder = copy.title(ctx);
  form.elements.introSubtitle.placeholder = copy.subtitle(ctx);
  form.elements.voiceoverText.placeholder = copy.voice(ctx);

  if (form.elements.contextSubtitle) {
    form.elements.contextSubtitle.placeholder = defaultTeamBattleContextSubtitle();
  }
};

const clearIntroOverrides = () => {
  form.elements.introTitle.value = '';
  form.elements.introSubtitle.value = '';
  form.elements.voiceoverText.value = '';
  applyIntroPlaceholders();
};

const renderCurrentJob = (job) => {
  if (!job) {
    templateChip.textContent = 'no job';
    currentJobRoot.innerHTML =
      '<div class="job-status-card"><div><strong>Nenhum job preparado</strong><span>Escolha um template de F1 e prepare o preview.</span></div></div>';
    if (dashboardQuickStatus) {
      dashboardQuickStatus.textContent = 'Escolha um template de F1, selecione o GP quando precisar e prepare o preview.';
    }
    renderManualAdjustmentsBuilder(null);
    return;
  }

  const templateLabel = getSelectedOptionLabel(templateSelect) || job.template;
  templateChip.textContent = templateLabel;
  const detailLine =
    job.template === 'weekend-schedule'
      ? `${job.sessions.length} sessoes`
      : job.template === 'circuit-insights'
        ? `${job.stats?.length ?? 0} stats • ${job.keyPoints?.length ?? 0} pontos-chave`
        : job.template === 'race-predictions'
          ? `${job.authorName} • ${job.subtitle} • Top ${job.entries?.length ?? 0}`
        : job.template === 'teammate-battle'
          ? `${job.teamName} • ${job.driver1.code} x ${job.driver2.code}`
        : `${job.entries.length}${job.podium ? ` + ${job.podium.length} no topo` : ''}`;

  const warningLine = job.dataSource === 'formula1.com'
    ? 'Fonte: Formula1.com • horário de Brasília'
    : job.dataSource === 'paste'
    ? 'Fonte: resultado colado • offline'
    : Array.isArray(job.warnings) && job.warnings.length > 0 ? job.warnings[0] : 'Fonte: API';

  if (dashboardQuickStatus) {
    dashboardQuickStatus.textContent = `${job.title} • ${job.subtitle} • ${detailLine}`;
  }

  currentJobRoot.innerHTML = `
    <div class="job-status-card">
      <div>
        <strong>${escapeHtml(job.title)} • ${escapeHtml(templateLabel)}</strong>
        <span>${escapeHtml(job.subtitle)} • ${escapeHtml(detailLine)} • ${escapeHtml(job.outputName)}</span>
      </div>
      <div class="job-status-meta">
        <span class="chip subtle">${escapeHtml(String(job.season))}</span>
        <span class="chip subtle">${escapeHtml(warningLine)}</span>
      </div>
    </div>
  `;
  renderManualAdjustmentsBuilder(job);
};

const setRenderDownload = (job, render) => {
  if (!job || !render?.outputPath) {
    renderDownloadRoot.innerHTML = '';
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
        <strong>Render pronto</strong>
        <span>${escapeHtml(job.outputName)}</span>
      </div>
      <a class="download-link" href="${downloadPath}" download>Download MP4</a>
    </div>
  `;
};

const applyTemplateHints = () => {
  const helper = document.getElementById('template-hint');
  helper.textContent = templateHints[templateSelect.value] ?? '';
  updateDashboardMeta();
};

const normalizeStudioUrl = (value) => {
  const trimmed = value.trim();
  return trimmed || 'http://127.0.0.1:3000';
};

const buildStudioPreviewUrl = () => {
  const studioUrl = normalizeStudioUrl(studioUrlInput.value);
  const compositionId = templateCompositionMap[templateSelect.value];
  const refreshToken = Date.now().toString();

  try {
    const url = new URL(studioUrl);
    const cleanPath = url.pathname === '/' ? '' : url.pathname.replace(/\/+$/, '');
    url.pathname = compositionId ? `${cleanPath}/${encodeURIComponent(compositionId)}` : cleanPath || '/';
    url.searchParams.set('codexPreviewTs', refreshToken);
    return url.toString();
  } catch {
    if (!compositionId) {
      return `${studioUrl}${studioUrl.includes('?') ? '&' : '?'}codexPreviewTs=${refreshToken}`;
    }

    return `${studioUrl.replace(/\/+$/, '')}/${encodeURIComponent(compositionId)}?codexPreviewTs=${refreshToken}`;
  }
};

const updatePreview = () => {
  const studioUrl = normalizeStudioUrl(studioUrlInput.value);
  studioUrlInput.value = studioUrl;
  localStorage.setItem(STUDIO_URL_KEY, studioUrl);
  const previewUrl = buildStudioPreviewUrl();
  previewFrame.src = previewUrl;
  openPreviewLink.href = previewUrl;
};

const applyRacePickerVisibility = () => {
  const visible = requiresRacePicker();
  raceSelectorFields.hidden = !visible;
  raceDataSection.hidden =
    !visible && !requiresTeamBattleFields() && !requiresPredictionFields();
  const forceRaceType =
    templateSelect.value === 'race-pace' ||
    templateSelect.value === 'teammate-battle' ||
    templateSelect.value === 'circuit-insights' ||
    templateSelect.value === 'race-predictions';
  raceTypeSelect.disabled = forceRaceType;
  if (forceRaceType) {
    raceTypeSelect.value = 'Race';
  }
  if (!visible) {
    raceSelect.value = '';
  }
  updateDashboardMeta();
};

const applyTeamBattleVisibility = () => {
  const visible = requiresTeamBattleFields();
  teammateBattleFields.hidden = !visible;
};

const applyPredictionVisibility = () => {
  const visible = requiresPredictionFields();
  racePredictionFields.hidden = !visible;
  if (visible) {
    ensurePredictionDriverFields();
  }
};

const loadRaceOptions = async (preferredRaceId) => {
  if (!requiresRacePicker()) {
    return;
  }

  const season = Number(form.elements.season.value || new Date().getFullYear());
  const competitionId = Number(form.elements.competitionId.value || competitionSelect.value || 1);
  const raceType = String(form.elements.raceType.value || raceTypeForTemplate(templateSelect.value));

  raceSelect.disabled = true;
  raceSelect.innerHTML = '<option value="">Carregando corridas…</option>';

  try {
    const params = new URLSearchParams({
      season: String(season),
      competitionId: String(competitionId),
      template: templateSelect.value,
      raceType,
    });
    const response = await fetch(`${apiBase}/races?${params.toString()}`);
    const data = await response.json();
    if (!response.ok || !data.ok) {
      throw new Error(data.error || 'Falha ao carregar corridas.');
    }

    const races = Array.isArray(data.races) ? data.races : [];
    const autoOption = '<option value="">Automático (mais recente desse tipo)</option>';
    const raceOptions = races
      .map((race) => `<option value="${race.id}">${escapeHtml(race.label)}</option>`)
      .join('');
    raceSelect.innerHTML = `${autoOption}${raceOptions}`;

    const selectedRaceId = preferredRaceId ?? form.elements.raceId.value;
    if (selectedRaceId && races.some((race) => String(race.id) === String(selectedRaceId))) {
      raceSelect.value = String(selectedRaceId);
    } else {
      raceSelect.value = '';
    }
  } catch (error) {
    raceSelect.innerHTML = '<option value="">Automático (lista indisponível)</option>';
    log(error instanceof Error ? error.message : String(error));
  } finally {
    raceSelect.disabled = false;
    await loadTeamOptions();
    await loadPredictionDriverOptions();
    applyIntroPlaceholders();
  }
};

const loadTeamOptions = async () => {
  if (!requiresTeamBattleFields()) {
    return;
  }

  const season = Number(form.elements.season.value || new Date().getFullYear());
  const competitionId = Number(form.elements.competitionId.value || competitionSelect.value || 1);
  const currentTeamId = String(form.elements.teamId.value || '');

  teamSelect.disabled = true;
  teamSelect.innerHTML = '<option value="">Carregando equipes…</option>';

  try {
    const params = new URLSearchParams({
      season: String(season),
      competitionId: String(competitionId),
    });
    const response = await fetch(`${apiBase}/teams?${params.toString()}`);
    const data = await response.json();
    if (!response.ok || !data.ok) {
      throw new Error(data.error || 'Falha ao carregar equipes.');
    }

    const teams = Array.isArray(data.teams) ? data.teams : [];
    if (teams.length === 0) {
      teamSelect.innerHTML = '<option value="">Nenhuma equipe com dupla disponível</option>';
      form.elements.teamId.value = '';
      return;
    }

    const options = teams
      .map((team) => {
        const names = Array.isArray(team.drivers)
          ? team.drivers.map((driver) => String(driver.name || '').trim()).filter(Boolean)
          : [];
        const duo = names.length > 0 ? ` (${names.join(' x ')})` : '';
        return `<option value="${escapeHtml(String(team.id))}">${escapeHtml(`${team.name}${duo}`)}</option>`;
      })
      .join('');
    teamSelect.innerHTML = options;

    const hasCurrent = teams.some((team) => String(team.id) === currentTeamId);
    teamSelect.value = hasCurrent ? currentTeamId : String(teams[0].id);
    form.elements.teamId.value = teamSelect.value;
  } catch (error) {
    teamSelect.innerHTML = '<option value="">Equipes indisponíveis</option>';
    form.elements.teamId.value = '';
    log(error instanceof Error ? error.message : String(error));
  } finally {
    teamSelect.disabled = false;
  }
};

const loadPredictionDriverOptions = async () => {
  if (!requiresPredictionFields()) {
    return;
  }

  ensurePredictionDriverFields();
  const season = Number(form.elements.season.value || new Date().getFullYear());
  const competitionId = Number(form.elements.competitionId.value || competitionSelect.value || 1);
  const selects = predictionDriverSelects();
  const currentValues = selects.map((select) => select.value);

  selects.forEach((select) => {
    select.disabled = true;
    select.innerHTML = '<option value="">Carregando pilotos…</option>';
  });

  try {
    const params = new URLSearchParams({
      season: String(season),
      competitionId: String(competitionId),
    });
    const response = await fetch(`${apiBase}/drivers?${params.toString()}`);
    const data = await response.json();
    if (!response.ok || !data.ok) {
      throw new Error(data.error || 'Falha ao carregar pilotos.');
    }

    const drivers = Array.isArray(data.drivers) ? data.drivers : [];
    const options = drivers
      .map((driver) => {
        const team = driver.team ? ` • ${driver.team}` : '';
        return `<option value="${escapeHtml(driver.name)}">${escapeHtml(`${driver.name}${team}`)}</option>`;
      })
      .join('');

    selects.forEach((select, index) => {
      select.innerHTML = `<option value="">Selecione P${index + 1}</option>${options}`;
      const preferred = currentValues[index] || select.dataset.preferredValue || '';
      if (preferred && drivers.some((driver) => driver.name === preferred)) {
        select.value = preferred;
      } else if (drivers[index]) {
        select.value = drivers[index].name;
      }
      select.dataset.preferredValue = '';
    });

    if (data.fallbackReason) {
      log(`Pilotos carregados com fallback: ${data.fallbackReason}`);
    }
  } catch (error) {
    selects.forEach((select) => {
      select.innerHTML = '<option value="">Pilotos indisponíveis</option>';
    });
    log(error instanceof Error ? error.message : String(error));
  } finally {
    selects.forEach((select) => {
      select.disabled = false;
    });
  }
};

const loadOptions = async () => {
  const response = await fetch(`${apiBase}/options`);
  const data = await response.json();

  templateSelect.innerHTML = data.templates
    .map((template) => `<option value="${template.template}">${template.label}</option>`)
    .join('');

  competitionSelect.innerHTML = data.competitionPresets
    .map(
      (competition) =>
        `<option value="${competition.competitionId}">${competition.label}</option>`
    )
    .join('');

  soundtrackSelect.innerHTML = (data.soundtrackPresets ?? [])
    .map((preset) => `<option value="${preset.value}">${preset.label}</option>`)
    .join('');
  if (pasteSoundtrackSelect) {
    pasteSoundtrackSelect.innerHTML = soundtrackSelect.innerHTML;
  }
  if (pasteSeasonInput) {
    pasteSeasonInput.value = String(new Date().getFullYear());
  }

  const currentJob = data.currentJob;
  if (currentJob) {
    form.elements.template.value = currentJob.template;
    competitionSelect.value = String(currentJob.competitionId ?? '1');
    form.elements.season.value = currentJob.season;
    form.elements.competitionId.value = currentJob.competitionId;
    form.elements.competitionName.value = currentJob.competitionName;
    form.elements.raceType.value = currentJob.raceType || raceTypeForTemplate(currentJob.template);
    form.elements.raceId.value = currentJob.raceId ?? '';
    form.elements.teamId.value = currentJob.teamId ?? '';
    form.elements.contextSubtitle.value = currentJob.contextSubtitle ?? '';
    form.elements.predictionAuthor.value = normalizePredictionAuthorValue(currentJob.predictionAuthor);
    form.elements.predictionType.value = currentJob.predictionType ?? 'race';
    ensurePredictionDriverFields();
    if (currentJob.template === 'race-predictions') {
      (currentJob.entries ?? []).slice(0, 10).forEach((entry, index) => {
        const select = form.elements[`predictionDriver${index + 1}`];
        if (select) {
          select.dataset.preferredValue = entry.name;
        }
      });
    }
    form.elements.labelOverride.value =
      currentJob.template === 'race-predictions' ? currentJob.raceName ?? '' : currentJob.subtitle;
    form.elements.manualAdjustments.value = Array.isArray(currentJob.manualAdjustments)
      ? currentJob.manualAdjustments.join('\n')
      : currentJob.manualAdjustments ?? localStorage.getItem(MANUAL_ADJUSTMENTS_KEY) ?? '';
    manualAdjustmentsDraft = form.elements.manualAdjustments.value;
    form.elements.brandName.value = currentJob.brandName;
    form.elements.outputName.value = isVideoOutputName(currentJob.outputName) ? currentJob.outputName : '';
    form.elements.introTitle.value = currentJob.introTitle ?? '';
    form.elements.introSubtitle.value = currentJob.introSubtitle ?? '';
    form.elements.voiceoverText.value = currentJob.voiceoverText ?? '';
    voiceoverEnabledCheckbox.checked = currentJob.voiceoverEnabled !== false;
    form.elements.soundtrackPath.value = currentJob.soundtrackPath ?? data.soundtrackPresets?.[0]?.value ?? '';
    setSoundtrackVolume(currentJob.soundtrackVolume ?? 0.3);
  } else {
    form.elements.template.value = 'race-results';
    competitionSelect.value = '1';
    form.elements.season.value = new Date().getFullYear();
    form.elements.competitionId.value = '1';
    form.elements.competitionName.value = 'Formula 1';
    form.elements.raceType.value = raceTypeForTemplate('race-results');
    form.elements.raceId.value = '';
    form.elements.teamId.value = '';
    form.elements.contextSubtitle.value = '';
    form.elements.predictionAuthor.value = 'vini';
    form.elements.predictionType.value = 'race';
    ensurePredictionDriverFields();
    form.elements.manualAdjustments.value = '';
    manualAdjustmentsDraft = localStorage.getItem(MANUAL_ADJUSTMENTS_KEY) ?? '';
    form.elements.manualAdjustments.value = manualAdjustmentsDraft;
    form.elements.brandName.value = 'Radio do Box';
    form.elements.introTitle.value = '';
    form.elements.introSubtitle.value = '';
    form.elements.voiceoverText.value = '';
    voiceoverEnabledCheckbox.checked = true;
    form.elements.soundtrackPath.value = data.soundtrackPresets?.[0]?.value ?? '';
    setSoundtrackVolume(0.3);
  }

  applyTemplateHints();
  applyRacePickerVisibility();
  applyTeamBattleVisibility();
  applyPredictionVisibility();
  await loadRaceOptions(currentJob?.raceId);
  applyIntroPlaceholders();
  renderCurrentJob(currentJob);
  updateDashboardMeta();
  const persistedWarning = Array.isArray(currentJob?.warnings) && currentJob.warnings.length > 0
    ? String(currentJob.warnings[0])
    : '';
  const persistedFallbackMessage = persistedWarning.includes('Fallback sample data used')
    ? persistedWarning
    : '';
  setErrorBanner(persistedFallbackMessage);
  setRenderDownload(null, null);
  const savedStudioUrl = localStorage.getItem(STUDIO_URL_KEY) || 'http://127.0.0.1:3000';
  studioUrlInput.value = savedStudioUrl;
  updatePreview();
  log(data.statusMessage || 'Dashboard de F1 pronto.', true);
};

competitionSelect.addEventListener('change', () => {
  const selected = competitionSelect.options[competitionSelect.selectedIndex];
  form.elements.competitionId.value = competitionSelect.value;
  form.elements.competitionName.value = selected?.textContent ?? 'Formula 1';
  updateDashboardMeta();
  void loadRaceOptions();
});

templateSelect.addEventListener('change', () => {
  form.elements.raceType.value = raceTypeForTemplate(templateSelect.value);
  clearIntroOverrides();
  applyTemplateHints();
  applyRacePickerVisibility();
  applyTeamBattleVisibility();
  applyPredictionVisibility();
  void loadRaceOptions();
  updatePreview();
  updateDashboardMeta();
});

form.elements.season.addEventListener('change', () => {
  updateDashboardMeta();
  void loadRaceOptions();
});

raceTypeSelect.addEventListener('change', () => {
  updateDashboardMeta();
  void loadRaceOptions();
});

raceSelect.addEventListener('change', () => {
  void loadTeamOptions();
  applyIntroPlaceholders();
  updateDashboardMeta();
});

teamSelect.addEventListener('change', () => {
  form.elements.teamId.value = teamSelect.value;
  applyIntroPlaceholders();
  updateDashboardMeta();
});

predictionAuthorSelect.addEventListener('change', () => {
  applyIntroPlaceholders();
  updateDashboardMeta();
});

predictionTypeSelect.addEventListener('change', () => {
  applyIntroPlaceholders();
  updateDashboardMeta();
});

form.elements.contextSubtitle?.addEventListener('input', updateDashboardMeta);
soundtrackVolumeRange?.addEventListener('input', () => {
  setSoundtrackVolume(soundtrackVolumeRange.value);
});
form.elements.soundtrackVolume?.addEventListener('input', () => {
  setSoundtrackVolume(form.elements.soundtrackVolume.value);
});

const submitJob = async (endpoint, actionLabel) => {
  if (!validatePredictionDriverUniqueness()) {
    return;
  }

  try {
    setBusy(true);
    setErrorBanner('');
    syncManualAdjustmentsFromBuilder();
    preserveManualAdjustmentsPayload();
    const payload = formDataToObject();
    log(`${actionLabel}…`);
    const response = await fetch(`${apiBase}${endpoint}`, {
      method: 'POST',
      headers: {'content-type': 'application/json'},
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    if (!response.ok || !data.ok) {
      const error = new Error(data.error || 'Unknown error');
      error.errorType = data.errorType;
      error.errorDetails = data.errorDetails;
      throw error;
    }

    renderCurrentJob(data.job);
    setRenderDownload(data.job, data.render);
    log(data.message || `${actionLabel} finalizado.`);
    if (data.fallbackReason) {
      const fallbackMessage = `Fallback ativo: ${data.fallbackReason}`;
      setErrorBanner(fallbackMessage);
      log(fallbackMessage);
    }
    if (data.render?.outputPath) {
      log(`Arquivo renderizado: ${data.render.outputPath}`);
    }
  } catch (error) {
    const fallbackMessage = error instanceof Error ? error.message : String(error);
    const bannerMessage = bannerMessageForErrorType(error?.errorType, fallbackMessage);
    setErrorBanner(bannerMessage);
    log(fallbackMessage);
    if (error?.errorDetails) {
      log(`Detalhes técnicos: ${error.errorDetails}`);
    }
  } finally {
    setBusy(false);
  }
};

const setPasteStatus = (message, isError = false) => {
  pasteResultsStatus.textContent = message;
  pasteResultsStatus.classList.toggle('error', isError);
};

const submitPastedResult = async (render = false) => {
  const pastedText = pasteResultsInput.value.trim();
  if (!pastedText) {
    setPasteStatus('Cole o resultado da corrida antes de continuar.', true);
    return;
  }

  pastePrepareButton.disabled = true;
  pasteRenderButton.disabled = true;
  setPasteStatus(render ? 'Renderizando o Short offline…' : 'Interpretando resultado e preparando preview…');
  try {
    const response = await fetch(`${apiBase}/paste-results/${render ? 'render' : 'prepare'}`, {
      method: 'POST',
      headers: {'content-type': 'application/json'},
      body: JSON.stringify({
        pastedText,
        season: pasteSeasonInput.value,
        outputName: pasteOutputNameInput.value,
        labelOverride: pasteLabelOverrideInput.value,
        soundtrackPath: pasteSoundtrackSelect.value,
        soundtrackVolume: form.elements.soundtrackVolume?.value || '0.30',
        voiceoverEnabled: false,
      }),
    });
    const data = await response.json();
    if (!response.ok || !data.ok) {
      throw new Error(data.error || 'Não foi possível interpretar o resultado colado.');
    }
    templateSelect.value = 'race-results';
    renderCurrentJob(data.job);
    setRenderDownload(data.job, data.render);
    setPasteStatus(data.render?.outputPath ? `MP4 pronto: ${data.job.outputName}` : data.message);
    log(data.message || 'Resultado colado preparado offline.');
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    setPasteStatus(message, true);
    log(message);
  } finally {
    pastePrepareButton.disabled = false;
    pasteRenderButton.disabled = false;
  }
};

const setYoutubeStatus = (message, isError = false) => {
  youtubeContentStatus.textContent = message;
  youtubeContentStatus.classList.toggle('error', isError);
};

const renderYoutubeContent = (content) => {
  youtubeTitleOutput.value = content.title ?? '';
  youtubeDescriptionOutput.value = content.description ?? '';
  tiktokDescriptionOutput.value = content.tiktokDescription ?? '';
  instagramDescriptionOutput.value = content.instagramDescription ?? '';
  youtubeTagsOutput.value = Array.isArray(content.tags)
    ? content.tags.join(', ')
    : String(content.tags ?? '');
  youtubePinnedCommentOutput.value = content.pinnedComment ?? '';
  youtubeContentOutput.hidden = false;
};

const generateYoutubeContent = async () => {
  try {
    setYoutubeBusy(true);
    setYoutubeStatus('Lendo o job atual e gerando conteúdo editorial...');
    const payload = {
      audienceHint: youtubePrimaryAudienceInput.value,
      editorialHint: youtubeStoryBriefInput.value,
      dashboardContext: currentYoutubeContext(),
    };

    const response = await fetch(`${apiBase}/youtube-content`, {
      method: 'POST',
      headers: {'content-type': 'application/json'},
      body: JSON.stringify(payload),
    });
    const data = await response.json();
    if (!response.ok || !data.ok) {
      throw new Error(data.error || 'Falha ao gerar conteúdo para YouTube.');
    }

    renderYoutubeContent(data.content);
    setYoutubeStatus(`Conteúdo gerado com ${data.model}.`);
    log('Conteúdo para redes sociais gerado.');
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    setYoutubeStatus(message, true);
    log(message);
  } finally {
    setYoutubeBusy(false);
  }
};

const activeDescriptionOutput = () =>
  document.querySelector('.platform-description-output.active') ?? youtubeDescriptionOutput;

const setDescriptionTab = (tabName) => {
  document.querySelectorAll('[data-description-tab]').forEach((tab) => {
    tab.classList.toggle('active', tab.dataset.descriptionTab === tabName);
  });
  document.querySelectorAll('[data-description-panel]').forEach((panel) => {
    const active = panel.dataset.descriptionPanel === tabName;
    panel.hidden = !active;
    panel.classList.toggle('active', active);
  });
};

const copyFieldValue = async (button) => {
  const target = button === copyActiveDescriptionButton
    ? activeDescriptionOutput()
    : document.getElementById(button.dataset.copyTarget);
  const value = target?.value ?? '';
  if (!value.trim()) {
    setYoutubeStatus('Nada para copiar ainda.', true);
    return;
  }

  try {
    await navigator.clipboard.writeText(value);
    setYoutubeStatus('Copiado.');
  } catch {
    target.focus();
    target.select();
    document.execCommand('copy');
    setYoutubeStatus('Copiado.');
  }
};

prepareButton.addEventListener('click', () => submitJob('/jobs/prepare', 'Preparando job'));
renderButton.addEventListener('click', () => submitJob('/jobs/render', 'Renderizando video'));
pastePrepareButton?.addEventListener('click', () => submitPastedResult(false));
pasteRenderButton?.addEventListener('click', () => submitPastedResult(true));
applyPreviewButton.addEventListener('click', updatePreview);
generateYoutubeContentButton.addEventListener('click', generateYoutubeContent);
document.querySelectorAll('[data-copy-target]').forEach((button) => {
  button.addEventListener('click', () => copyFieldValue(button));
});
copyActiveDescriptionButton.addEventListener('click', () => copyFieldValue(copyActiveDescriptionButton));
document.querySelectorAll('[data-description-tab]').forEach((tab) => {
  tab.addEventListener('click', () => setDescriptionTab(tab.dataset.descriptionTab));
});

loadOptions();
