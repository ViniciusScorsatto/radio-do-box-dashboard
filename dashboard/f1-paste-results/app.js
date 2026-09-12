const input = document.getElementById('paste-results-input');
const season = document.getElementById('paste-season');
const outputName = document.getElementById('paste-output-name');
const labelOverride = document.getElementById('paste-label-override');
const soundtrack = document.getElementById('paste-soundtrack-select');
const volumeRange = document.getElementById('paste-soundtrack-volume-range');
const volumeInput = document.getElementById('paste-soundtrack-volume');
const prepareButton = document.getElementById('paste-prepare-button');
const renderButton = document.getElementById('paste-render-button');
const status = document.getElementById('paste-results-status');
const download = document.getElementById('paste-render-download');
const studioUrlInput = document.getElementById('studio-url');
const applyPreviewButton = document.getElementById('apply-preview-button');
const openPreviewLink = document.getElementById('open-preview-link');
const previewFrame = document.getElementById('preview-frame');
const STUDIO_URL_KEY = 'f1-dashboard-studio-url';

const setStatus = (message, isError = false) => {
  status.textContent = message;
  status.classList.toggle('error', isError);
};

const escapeHtml = (value) => String(value ?? '')
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#39;');

const renderDownload = (job, render) => {
  if (!render?.outputPath) {
    download.innerHTML = '';
    return;
  }

  const outputPath = `/${render.outputPath.replace(/^\/+/, '').split('/').map(encodeURIComponent).join('/')}`;
  download.innerHTML = `
    <div class="job-download-card">
      <div><strong>Render pronto</strong><span>${escapeHtml(job.outputName)}</span></div>
      <a class="download-link" href="${outputPath}" download>Baixar MP4</a>
    </div>
  `;
};

const normalizeVolume = (value) => {
  const numeric = Number(value);
  return (Number.isFinite(numeric) ? Math.max(0, Math.min(1, numeric)) : 0.3).toFixed(2);
};

const setVolume = (value) => {
  const normalized = normalizeVolume(value);
  volumeRange.value = normalized;
  volumeInput.value = normalized;
};

const normalizeStudioUrl = (value) => String(value ?? '').trim() || 'http://127.0.0.1:3000';

const buildPreviewUrl = () => {
  const base = normalizeStudioUrl(studioUrlInput.value);
  try {
    const url = new URL(base);
    const cleanPath = url.pathname === '/' ? '' : url.pathname.replace(/\/+$/, '');
    url.pathname = `${cleanPath}/F1RaceResultsShort`;
    url.searchParams.set('codexPreviewTs', Date.now().toString());
    return url.toString();
  } catch {
    return `${base.replace(/\/+$/, '')}/F1RaceResultsShort?codexPreviewTs=${Date.now()}`;
  }
};

const updatePreview = () => {
  const studioUrl = normalizeStudioUrl(studioUrlInput.value);
  studioUrlInput.value = studioUrl;
  localStorage.setItem(STUDIO_URL_KEY, studioUrl);
  const previewUrl = buildPreviewUrl();
  previewFrame.src = previewUrl;
  openPreviewLink.href = previewUrl;
};

const submit = async (render = false) => {
  if (!input.value.trim()) {
    setStatus('Cole o resultado da corrida antes de continuar.', true);
    return;
  }

  prepareButton.disabled = true;
  renderButton.disabled = true;
  setStatus(render ? 'Renderizando o Short offline…' : 'Interpretando o resultado…');
  try {
    const response = await fetch(`/api/f1/paste-results/${render ? 'render' : 'prepare'}`, {
      method: 'POST',
      headers: {'content-type': 'application/json'},
      body: JSON.stringify({
        pastedText: input.value,
        season: season.value,
        outputName: outputName.value,
        labelOverride: labelOverride.value,
        soundtrackPath: soundtrack.value,
        soundtrackVolume: volumeInput.value,
        voiceoverEnabled: false,
      }),
    });
    const data = await response.json();
    if (!response.ok || !data.ok) {
      throw new Error(data.error || 'Não foi possível preparar o resultado colado.');
    }

    renderDownload(data.job, data.render);
    updatePreview();
    setStatus(data.render?.outputPath ? `MP4 pronto: ${data.job.outputName}` : data.message);
  } catch (error) {
    setStatus(error instanceof Error ? error.message : String(error), true);
  } finally {
    prepareButton.disabled = false;
    renderButton.disabled = false;
  }
};

const loadOptions = async () => {
  season.value = String(new Date().getFullYear());
  const response = await fetch('/api/f1/options');
  const data = await response.json();
  soundtrack.innerHTML = (data.soundtrackPresets ?? [])
    .map((preset) => `<option value="${escapeHtml(preset.value)}">${escapeHtml(preset.label)}</option>`)
    .join('');
  setVolume(0.30);
  studioUrlInput.value = localStorage.getItem(STUDIO_URL_KEY) || 'http://127.0.0.1:3000';
  updatePreview();
};

volumeRange.addEventListener('input', () => setVolume(volumeRange.value));
volumeInput.addEventListener('input', () => setVolume(volumeInput.value));
applyPreviewButton.addEventListener('click', updatePreview);
prepareButton.addEventListener('click', () => submit(false));
renderButton.addEventListener('click', () => submit(true));
loadOptions().catch((error) => setStatus(error instanceof Error ? error.message : String(error), true));
