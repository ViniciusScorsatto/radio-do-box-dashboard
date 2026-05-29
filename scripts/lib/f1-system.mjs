import fs from 'node:fs/promises';
import fsSync from 'node:fs';
import crypto from 'node:crypto';
import path from 'node:path';
import {projectRoot} from './video-system.mjs';

const generatedDir = path.join(projectRoot, 'src', 'data', 'generated');
const configRoot = path.join(projectRoot, 'config', 'f1');
const gpTranslationsFile = path.join(configRoot, 'translations', 'gp-names.pt-br.json');
const currentJobFile = path.join(generatedDir, 'current-job.f1.json');
const currentTemplateJobFile = (template) =>
  path.join(generatedDir, `current-job.f1.${template}.json`);
const f1AssetsDir = path.join(projectRoot, 'public', 'f1');
const f1DriverImagesDir = path.join(f1AssetsDir, 'drivers');
const f1TeamLogosDir = path.join(f1AssetsDir, 'teams');
const f1CircuitImagesDir = path.join(f1AssetsDir, 'circuits');
const f1VoiceoversDir = path.join(projectRoot, 'public', 'voiceovers', 'f1');

const templateFileNames = [
  'race-results.json',
  'race-pace.json',
  'teammate-battle.json',
  'circuit-insights.json',
  'qualifying-grid.json',
  'driver-standings.json',
  'constructor-standings.json',
  'weekend-schedule.json',
];

const brandLogos = {
  blue: '/branding/radio-do-box/white.png',
  orange: '/branding/radio-do-box/yellow.png',
  light: '/branding/radio-do-box/black.png',
};
const defaultF1Soundtrack = {
  path: '/audio/f1/country-rough-everet-almond.mp3',
  label: 'Country Rough - Everet Almond',
};

const f1SoundtrackLabelOverrides = {
  'country-rough-everet-almond.mp3': defaultF1Soundtrack.label,
  'get-tough-tracktribe.mp3': 'Get Tough - TrackTribe',
  'sacrifices-anno-domini-beats.mp3': 'Sacrifices - Anno Domini Beats',
  'checkered-flag-pulse-1.mp3': 'Checkered Flag Pulse (1)',
  'pace-lap-pulse-1.mp3': 'Pace Lap Pulse (1)',
  'radio-do-box.mp3': 'Rádio do Box',
  'radio-do-box-1.mp3': 'Rádio do Box (1)',
  'Rádio do Box - Intro jornal.mp3': 'Rádio do Box - Intro jornal',
  'Rádio do Box - Jornalistico.mp3': 'Rádio do Box - Jornalístico',
};

const preferredF1Soundtracks = [
  'country-rough-everet-almond.mp3',
  'get-tough-tracktribe.mp3',
  'sacrifices-anno-domini-beats.mp3',
];

const toF1SoundtrackLabel = (filename) => {
  if (f1SoundtrackLabelOverrides[filename]) return f1SoundtrackLabelOverrides[filename];
  const rawLabel = filename
    .replace(/\.mp3$/i, '')
    .replace(/\s+/g, ' ')
    .trim()
    .normalize('NFC');
  if (rawLabel.includes(' ') || rawLabel.includes(' - ')) return rawLabel;
  return rawLabel
    .replace(/[-_]+/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
};

const listF1SoundtrackPresets = () => {
  const audioDir = path.join(projectRoot, 'public', 'audio', 'f1');
  if (!fsSync.existsSync(audioDir)) return [];
  const filenames = fsSync
    .readdirSync(audioDir)
    .filter((filename) => filename.toLowerCase().endsWith('.mp3'));
  const preferredSet = new Set(preferredF1Soundtracks);
  const ordered = [
    ...preferredF1Soundtracks.filter((filename) => filenames.includes(filename)),
    ...filenames.filter((filename) => !preferredSet.has(filename)).sort((a, b) => a.localeCompare(b)),
  ];
  return ordered.map((filename) => ({
    value: `/audio/f1/${filename}`,
    label: toF1SoundtrackLabel(filename),
  }));
};

export const f1SoundtrackPresets = listF1SoundtrackPresets();

const sampleTeamColors = {
  Mercedes: '#65e1c6',
  Ferrari: '#ff5546',
  McLaren: '#ff9a3d',
  'Red Bull': '#5d74ff',
  RedBull: '#5d74ff',
  Williams: '#6fb4ff',
  Haas: '#f1f1f1',
  Alpine: '#ff76db',
  Sauber: '#85e46b',
  Audi: '#d4d7df',
  Cadillac: '#8fd1ff',
  'Racing Bulls': '#7b94ff',
  'Aston Martin': '#59b28c',
};

const constructorTeamLogoOverrides = {
  Mercedes: '/f1/teams/custom/mercedes.png',
  Ferrari: '/f1/teams/custom/ferrari.png',
  McLaren: '/f1/teams/custom/mclaren.png',
  'Red Bull': '/f1/teams/custom/red-bull.png',
  'Racing Bulls': '/f1/teams/custom/racing-bulls.png',
  Audi: '/f1/teams/custom/audi.png',
  Haas: '/f1/teams/custom/haas.png',
  Alpine: '/f1/teams/custom/alpine.png',
  Williams: '/f1/teams/custom/williams.png',
  'Aston Martin': '/f1/teams/custom/aston-martin.png',
  Cadillac: '/f1/teams/custom/cadillac.png',
};

const teamAliases = [
  {match: ['mercedes-amg-petronas', 'mercedes'], key: 'Mercedes'},
  {match: ['scuderia-ferrari', 'ferrari'], key: 'Ferrari'},
  {match: ['mclaren-racing', 'mclaren'], key: 'McLaren'},
  {match: ['oracle-red-bull-racing', 'red-bull-racing', 'red-bull'], key: 'Red Bull'},
  {match: ['racing-bulls', 'visa-cash-app-rb', 'rb-f1-team'], key: 'Racing Bulls'},
  {match: ['audi-revolut-f1-team', 'stake-f1-team-kick-sauber', 'kick-sauber', 'sauber', 'audi'], key: 'Audi'},
  {match: ['haas-f1-team', 'haas'], key: 'Haas'},
  {match: ['alpine-f1-team', 'alpine'], key: 'Alpine'},
  {match: ['williams-f1-team', 'williams'], key: 'Williams'},
  {match: ['aston-martin-aramco', 'aston-martin'], key: 'Aston Martin'},
  {match: ['cadillac'], key: 'Cadillac'},
];

let gpNameTranslationsCache = null;

const sanitize = (value) =>
  value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

const ensureGeneratedDir = async () => {
  await fs.mkdir(generatedDir, {recursive: true});
  await fs.mkdir(f1DriverImagesDir, {recursive: true});
  await fs.mkdir(f1TeamLogosDir, {recursive: true});
  await fs.mkdir(f1CircuitImagesDir, {recursive: true});
  await fs.mkdir(f1VoiceoversDir, {recursive: true});
};

const readJsonFile = async (filePath) => {
  const raw = await fs.readFile(filePath, 'utf8');
  return JSON.parse(raw);
};

const getGoogleF1VoiceConfig = () => {
  const configuredName = process.env.GOOGLE_TTS_PT_BR_VOICE?.trim();
  return configuredName ? {languageCode: 'pt-BR', name: configuredName} : {languageCode: 'pt-BR'};
};

const createF1TtsError = (message, details) => {
  const error = new Error(message);
  error.errorType = 'tts_error';
  error.details = details;
  return error;
};

const generateF1Voiceover = async ({text}) => {
  const apiKey = process.env.GOOGLE_TTS_API_KEY?.trim();

  if (!apiKey) {
    throw createF1TtsError(
      'Missing GOOGLE_TTS_API_KEY. Add it to .env to generate Formula 1 voiceovers.',
      {envVar: 'GOOGLE_TTS_API_KEY'}
    );
  }

  const voice = getGoogleF1VoiceConfig();
  const speakingRate = 1.13;
  const hash = crypto
    .createHash('sha1')
    .update(JSON.stringify({text, languageProfile: 'pt-br', voice, speakingRate}))
    .digest('hex')
    .slice(0, 16);
  const filename = `pt-br-${hash}.mp3`;
  const destination = path.join(f1VoiceoversDir, filename);

  try {
    await fs.access(destination);
    return `/voiceovers/f1/${filename}`;
  } catch {
    // Continue and synthesize the missing cached file.
  }

  const response = await fetch(
    `https://texttospeech.googleapis.com/v1/text:synthesize?key=${encodeURIComponent(apiKey)}`,
    {
      method: 'POST',
      headers: {'content-type': 'application/json; charset=utf-8'},
      body: JSON.stringify({
        input: {text},
        voice,
        audioConfig: {
          audioEncoding: 'MP3',
          speakingRate,
          pitch: -0.5,
        },
      }),
    }
  );

  const payload = await response.json().catch(() => null);

  if (!response.ok || !payload?.audioContent) {
    throw createF1TtsError('Google Text-to-Speech failed while generating Formula 1 voiceover.', {
      status: response.status,
      statusText: response.statusText,
      payload,
    });
  }

  await fs.writeFile(destination, Buffer.from(payload.audioContent, 'base64'));
  return `/voiceovers/f1/${filename}`;
};

const loadGpNameTranslations = async () => {
  if (gpNameTranslationsCache) {
    return gpNameTranslationsCache;
  }

  try {
    gpNameTranslationsCache = await readJsonFile(gpTranslationsFile);
  } catch {
    gpNameTranslationsCache = {};
  }

  return gpNameTranslationsCache;
};

const loadThemeConfig = async (variant) =>
  readJsonFile(path.join(configRoot, 'themes', `${variant}.json`));

const loadTemplateConfig = async (template) =>
  readJsonFile(path.join(configRoot, 'templates', `${template}.json`));

const loadCompetitionPresets = async () => {
  const competitionDir = path.join(configRoot, 'competitions');
  const entries = await fs.readdir(competitionDir);
  const configs = await Promise.all(entries.filter((entry) => entry.endsWith('.json')).map((entry) =>
    readJsonFile(path.join(competitionDir, entry))
  ));
  return configs;
};

const fetchJson = async (url, apiKey, apiHost) => {
  const response = await fetch(url, {
    headers: {
      'x-rapidapi-key': apiKey,
      'x-rapidapi-host': apiHost,
    },
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`${response.status} ${response.statusText}\n${body}`);
  }

  return response.json();
};

const downloadAsset = async (url, directory, fileStem) => {
  if (!url) {
    return undefined;
  }

  const extension = path.extname(new URL(url).pathname) || '.png';
  const filename = `${sanitize(fileStem)}${extension}`;
  const destination = path.join(directory, filename);

  try {
    await fs.access(destination);
    return destination
      .replace(path.join(projectRoot, 'public'), '')
      .split(path.sep)
      .join('/');
  } catch {
    // Not cached yet.
  }

  const response = await fetch(url);
  if (!response.ok) {
    return undefined;
  }

  const bytes = Buffer.from(await response.arrayBuffer());
  await fs.writeFile(destination, bytes);
  return destination
    .replace(path.join(projectRoot, 'public'), '')
    .split(path.sep)
    .join('/');
};

const normalizeTeamKey = (teamName = '') => {
  const normalized = sanitize(teamName);
  for (const alias of teamAliases) {
    if (alias.match.some((value) => normalized.includes(value))) {
      return alias.key;
    }
  }

  return teamName;
};

const resolveTeamColor = (teamName = '') => sampleTeamColors[normalizeTeamKey(teamName)] ?? '#ffffff';

const normalizeDriverCode = (value = '') => String(value).trim().toUpperCase().slice(0, 3);

const deriveSurnameCode = (name = '') => {
  const parts = String(name)
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (parts.length === 0) {
    return '';
  }

  const suffixes = new Set(['jr', 'junior', 'sr', 'filho', 'neto', 'ii', 'iii']);
  let surname = parts[parts.length - 1];
  if (suffixes.has(sanitize(surname)) && parts.length > 1) {
    surname = parts[parts.length - 2];
  }

  const normalizedSurname = String(surname)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z]/g, '')
    .toUpperCase();

  return normalizedSurname.slice(0, 3);
};

const summarizeFailureReason = (reason = '') => {
  const normalized = String(reason || '')
    .replace(/\s+/g, ' ')
    .trim();
  return normalized.length > 380 ? `${normalized.slice(0, 380)}…` : normalized;
};

class F1PreparationError extends Error {
  constructor(message, errorType, details) {
    super(message);
    this.name = 'F1PreparationError';
    this.errorType = errorType;
    this.details = details;
  }
}

const countryCodeFromName = (name = '') => {
  const normalized = sanitize(name);
  const known = {
    australia: 'AUS',
    china: 'CHN',
    japan: 'JPN',
    bahrain: 'BHR',
    'saudi-arabia': 'SAU',
    italy: 'ITA',
    monaco: 'MCO',
    spain: 'ESP',
    canada: 'CAN',
    austria: 'AUT',
    'great-britain': 'GBR',
    belgium: 'BEL',
    netherlands: 'NLD',
    singapore: 'SGP',
    mexico: 'MEX',
    brazil: 'BRA',
    qatar: 'QAT',
    'abu-dhabi': 'ARE',
    usa: 'USA',
    'united-states': 'USA',
  };
  return known[normalized] ?? name.slice(0, 3).toUpperCase() ?? 'F1';
};

const badgeFor = async ({
  name,
  team,
  driverImageUrl,
  teamLogoUrl,
  useDriverPortrait = true,
}) => {
  const resolvedTeam = team || name;
  const normalizedTeamKey = normalizeTeamKey(resolvedTeam);
  const customTeamLogoPath = constructorTeamLogoOverrides[normalizedTeamKey];
  const downloadedLogoPath = customTeamLogoPath
    ? undefined
    : await downloadAsset(teamLogoUrl, f1TeamLogosDir, resolvedTeam);

  return {
    label: String(name)
      .split(/\s+/)
      .map((part) => part[0] ?? '')
      .join('')
      .slice(0, 2)
      .toUpperCase(),
    accentColor: resolveTeamColor(team),
    imagePath: useDriverPortrait
      ? await downloadAsset(driverImageUrl, f1DriverImagesDir, `${team}-${name}`)
      : customTeamLogoPath ?? downloadedLogoPath,
    logoPath: customTeamLogoPath ?? downloadedLogoPath,
    sublabel: team,
  };
};

const sortByPosition = (entries) => [...entries].sort((a, b) => a.position - b.position);

const groupRaceWeekend = (races) => {
  const groups = new Map();
  for (const race of races) {
    const competition = race.competition ?? {};
    const circuit = race.circuit ?? {};
    const key = [
      competition.id ?? competition.name ?? 'unknown',
      competition.location?.country ?? 'country',
      competition.location?.city ?? 'city',
      circuit.id ?? circuit.name ?? 'unknown',
    ].join(':');
    const list = groups.get(key) ?? [];
    list.push(race);
    groups.set(key, list);
  }
  return [...groups.values()];
};

const pickLatestCompletedWeekend = (races) => {
  const now = Date.now();
  const groups = groupRaceWeekend(races).filter((group) =>
    group.some((race) => new Date(race.date ?? 0).getTime() <= now)
  );
  groups.sort((a, b) => {
    const aTime = Math.max(...a.map((race) => new Date(race.date ?? 0).getTime()));
    const bTime = Math.max(...b.map((race) => new Date(race.date ?? 0).getTime()));
    return bTime - aTime;
  });
  return groups[0] ?? null;
};

const typeMatches = (race, matcher) => matcher.test(String(race.type ?? '').trim());
const isCompleted = (race) => String(race.status ?? '').toLowerCase() === 'completed';

const latestMatchingSession = (weekend, matcher) =>
  [...weekend]
    .filter((race) => typeMatches(race, matcher))
    .sort((a, b) => new Date(b.date ?? 0).getTime() - new Date(a.date ?? 0).getTime())[0];

const earliestMatchingSession = (weekend, matcher) =>
  [...weekend]
    .filter((race) => typeMatches(race, matcher))
    .sort((a, b) => new Date(a.date ?? 0).getTime() - new Date(b.date ?? 0).getTime())[0];

const normalizeRaceType = (value = '') => String(value).trim().toLowerCase();
const raceTypeMatches = (race, selectedRaceType = '') => {
  if (!selectedRaceType) {
    return true;
  }

  return normalizeRaceType(race.type) === normalizeRaceType(selectedRaceType);
};

const pickLatestSessionByType = (races, selectedRaceType, {completedOnly = true} = {}) =>
  [...races]
    .filter((race) => raceTypeMatches(race, selectedRaceType))
    .filter((race) => (completedOnly ? isCompleted(race) : true))
    .sort((a, b) => new Date(b.date ?? 0).getTime() - new Date(a.date ?? 0).getTime())[0];

const pickLatestCompletedRaceWeekend = (races) => {
  const groups = groupRaceWeekend(races).filter((group) =>
    group.some((race) => isCompleted(race) && /^race$/i.test(String(race.type ?? '').trim()))
  );
  groups.sort((a, b) => {
    const aRace = latestMatchingSession(a, /^race$/i) ?? latestMatchingSession(a, /race/i);
    const bRace = latestMatchingSession(b, /^race$/i) ?? latestMatchingSession(b, /race/i);
    return new Date(bRace?.date ?? 0).getTime() - new Date(aRace?.date ?? 0).getTime();
  });
  return groups[0] ?? null;
};

const pickLatestCompletedQualifyingWeekend = (races) => {
  const groups = groupRaceWeekend(races).filter((group) =>
    group.some((race) => isCompleted(race) && /qualifying/i.test(String(race.type ?? '')))
  );
  groups.sort((a, b) => {
    const aQualifying = latestMatchingSession(a, /qualifying/i);
    const bQualifying = latestMatchingSession(b, /qualifying/i);
    return new Date(bQualifying?.date ?? 0).getTime() - new Date(aQualifying?.date ?? 0).getTime();
  });
  return groups[0] ?? null;
};

const pickNextWeekend = (races) => {
  const now = Date.now();
  const groups = groupRaceWeekend(races).filter((group) =>
    group.some((race) => new Date(race.date ?? 0).getTime() > now)
  );
  groups.sort((a, b) => {
    const aTime = Math.min(...a.map((race) => new Date(race.date ?? 0).getTime()));
    const bTime = Math.min(...b.map((race) => new Date(race.date ?? 0).getTime()));
    return aTime - bTime;
  });
  return groups[0] ?? null;
};

const translatedGpName = (countryName = '', gpNameTranslations = {}) => {
  const normalizedCountryKey = sanitize(countryName);
  const translation = gpNameTranslations[normalizedCountryKey];
  if (!translation) {
    return `GP da ${countryName}`;
  }

  if (typeof translation === 'string') {
    return `GP da ${translation}`;
  }

  const translatedName = translation.name ?? countryName;
  const article = translation.article ?? 'da';
  return `GP ${article} ${translatedName}`;
};

const translatedCountryName = (countryName = '', gpNameTranslations = {}) => {
  const translation = gpNameTranslations[sanitize(countryName)];
  if (!translation) {
    return countryName;
  }

  if (typeof translation === 'string') {
    return translation;
  }

  return translation.name ?? countryName;
};

const formatCircuitLength = (value) => {
  const raw = String(value ?? '').trim();
  if (!raw) {
    return 'N/D';
  }

  if (/(km|kms|kil[oô]metros?)$/i.test(raw)) {
    return raw.replace(/\bkms\b/i, 'km');
  }

  return `${raw} km`;
};

const extractRaceMeta = (
  weekend = [],
  competitionConfig,
  season,
  referenceRace,
  gpNameTranslations = {}
) => {
  const reference = referenceRace ?? weekend[0] ?? {};
  const competitionName = reference.competition?.name ?? competitionConfig.label;
  const raceName = reference.competition?.location?.country ?? reference.circuit?.name ?? competitionName;
  return {
    competitionName,
    raceId: reference.id,
    raceName: reference.competition?.location?.country
      ? translatedGpName(reference.competition.location.country, gpNameTranslations)
      : reference.competition?.name ?? `Temporada ${season}`,
    countryCode: countryCodeFromName(reference.competition?.location?.country ?? raceName),
    circuitName: reference.circuit?.name ?? raceName,
  };
};

const createBaseJob = ({
  template,
  templateConfig,
  themeConfig,
  competitionConfig,
  season,
  brandName,
  outputName,
  title,
  subtitle,
  raceType,
  raceId,
  raceName,
  countryCode,
  circuitName,
  brandLogoPath,
  backgroundImagePath,
  soundtrackPath,
  soundtrackLabel,
  soundtrackVolume,
  introTitle,
  introSubtitle,
  voiceoverText,
  voiceoverEnabled,
  voiceoverPath,
  voiceoverLabel,
  dataSource = 'api',
  warnings = [],
}) => ({
  sport: 'f1',
  template,
  compositionId: templateConfig.compositionId,
  season,
  competitionId: competitionConfig.competitionId,
  competitionName: competitionConfig.label,
  competitionConfig,
  themeConfig,
  templateConfig,
  title,
  subtitle,
  raceType,
  raceId,
  raceName,
  countryCode,
  circuitName,
  brandName: brandName?.trim() || 'Radio do Box',
  brandLogoPath,
  backgroundImagePath,
  soundtrackPath: soundtrackPath || defaultF1Soundtrack.path,
  soundtrackLabel: soundtrackLabel || defaultF1Soundtrack.label,
  soundtrackVolume: Number.isFinite(Number(soundtrackVolume))
    ? Math.max(0, Math.min(1, Number(soundtrackVolume)))
    : 0.3,
  introTitle,
  introSubtitle,
  voiceoverText,
  voiceoverEnabled,
  voiceoverPath,
  voiceoverLabel,
  outputName,
  durationInFrames: templateConfig.durationInFrames,
  dataSource,
  warnings,
});

const getF1IntroDefaults = (job) => {
  const raceName = job.raceName || job.title || 'Formula 1';
  const titleByTemplate = {
    'race-results': raceName,
    'race-pace': raceName,
    'teammate-battle': job.teamName || raceName,
    'circuit-insights': raceName,
    'qualifying-grid': raceName,
    'driver-standings': 'Mundial de Pilotos',
    'constructor-standings': 'Mundial de Construtores',
    'weekend-schedule': raceName,
  };
  const subtitleByTemplate = {
    'race-results': 'Resultado da Corrida',
    'race-pace': 'Ritmo de Corrida',
    'teammate-battle': 'Head-to-Head de Equipe',
    'circuit-insights': 'Guia do Circuito',
    'qualifying-grid': 'Classificacao de Largada',
    'driver-standings': `Formula 1 ${job.season}`,
    'constructor-standings': `Formula 1 ${job.season}`,
    'weekend-schedule': 'Horarios do GP',
  };
  const voiceoverByTemplate = {
    'race-results': `Fala, galera do box. Resultado da corrida no ${raceName}.`,
    'race-pace': `Fala, galera do box. Ritmo de corrida no ${raceName}.`,
    'teammate-battle': `Fala, galera do box. Duelo interno da ${job.teamName || 'equipe'} no ${raceName}.`,
    'circuit-insights': `Fala, galera do box. Guia rápido do circuito para o ${raceName}.`,
    'qualifying-grid': `Fala, galera do box. Classificacao de largada do ${raceName}.`,
    'driver-standings': `Fala, galera do box. Mundial de pilotos atualizado da Formula 1 ${job.season}.`,
    'constructor-standings': `Fala, galera do box. Mundial de construtores atualizado da Formula 1 ${job.season}.`,
    'weekend-schedule': `Fala, galera do box. Horarios do ${raceName}.`,
  };

  return {
    introTitle: titleByTemplate[job.template] || raceName,
    introSubtitle: subtitleByTemplate[job.template] || job.subtitle,
    voiceoverText: voiceoverByTemplate[job.template] || `Fala, galera do box. ${job.subtitle || raceName}.`,
  };
};

const addF1IntroAndVoiceover = async (job, overrides = {}) => {
  const defaults = getF1IntroDefaults(job);
  const introTitle = overrides.introTitle?.trim() || job.introTitle || defaults.introTitle;
  const introSubtitle =
    overrides.introSubtitle?.trim() || job.introSubtitle || defaults.introSubtitle;
  const voiceoverText =
    overrides.voiceoverText?.trim() || job.voiceoverText || defaults.voiceoverText;
  const voiceoverEnabled = overrides.voiceoverEnabled !== false;
  const voiceoverPath = voiceoverEnabled
    ? await generateF1Voiceover({text: voiceoverText})
    : undefined;

  return {
    ...job,
    introTitle,
    introSubtitle,
    voiceoverEnabled,
    voiceoverText,
    voiceoverPath,
    voiceoverLabel: voiceoverEnabled ? voiceoverText : undefined,
  };
};

const pickBrandLogoPath = (themeVariant) => brandLogos[themeVariant] ?? brandLogos.orange;

const pickResultsBackground = (raceType = '') => {
  if (/sprint/i.test(raceType)) {
    return '/f1/backgrounds/sprint-results-main.png';
  }

  return '/f1/backgrounds/race-results-main.png';
};

const raceOptionLabel = (race, gpNameTranslations = {}) => {
  const gpName =
    race.competition?.location?.country
      ? translatedGpName(race.competition.location.country, gpNameTranslations)
      : race.competition?.name ?? race.circuit?.name ?? 'GP';
  const typeLabel = race.type ? String(race.type) : 'Sessao';
  const dateLabel = new Date(race.date ?? Date.now()).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
  return `${gpName} • ${typeLabel} • ${dateLabel}`;
};

const sampleWeekendSessions = [
  {dayLabel: 'Sexta-feira', title: 'Treino Livre 1', timeLabel: '23H30 - 00H30'},
  {dayLabel: 'Sexta-feira', title: 'Treino Livre 2', timeLabel: '03H00 - 04H00'},
  {dayLabel: 'Sabado', title: 'Classificacao', timeLabel: '03H00 - 04H00'},
  {dayLabel: 'Domingo', title: 'Corrida', timeLabel: '02H00 (BRT)'},
];

const sanitizeF1LabelOverride = (template, labelOverride) => {
  const raw = labelOverride?.trim();
  if (!raw) {
    return '';
  }

  if (template === 'driver-standings' || template === 'constructor-standings') {
    const staleTemplateLabels = new Set([
      'media limpa da corrida',
      'média limpa da corrida',
      'resultado da corrida',
      'classificacao de largada',
      'classificação de largada',
      'ritmo de corrida',
    ]);

    if (staleTemplateLabels.has(raw.toLowerCase())) {
      return '';
    }
  }

  if (template === 'qualifying-grid') {
    const staleTemplateLabels = new Set([
      'resultado da corrida',
      'ritmo de corrida',
      'media limpa da corrida',
      'média limpa da corrida',
    ]);

    if (staleTemplateLabels.has(raw.toLowerCase())) {
      return '';
    }
  }

  return raw;
};

const buildSampleJob = async ({
  template,
  season,
  competitionId,
  competitionName,
  raceType,
  teamId,
  brandName,
  soundtrackPath,
  soundtrackVolume,
  labelOverride,
  contextSubtitle,
  outputName,
  warning,
}) => {
  const competitionConfigs = await loadCompetitionPresets();
  const gpNameTranslations = await loadGpNameTranslations();
  const competitionConfig =
    competitionConfigs.find((item) => item.competitionId === competitionId) ?? competitionConfigs[0];
  const templateConfig = await loadTemplateConfig(template);
  const themeConfig = await loadThemeConfig(templateConfig.themeVariant);
  const baseWarnings = warning ? [warning] : [];
  labelOverride = sanitizeF1LabelOverride(template, labelOverride);
  const common = {
    template,
    templateConfig,
    themeConfig,
    competitionConfig: {
      ...competitionConfig,
      label: competitionName?.trim() || competitionConfig.label,
    },
    season,
    brandName,
    soundtrackPath,
    soundtrackLabel:
      f1SoundtrackPresets.find((preset) => preset.value === soundtrackPath)?.label,
    soundtrackVolume,
    dataSource: 'sample',
    warnings: baseWarnings,
  };

  if (template === 'race-results') {
    const podium = await Promise.all([
      {position: 1, name: 'George Russell', team: 'Mercedes', stat: '1:33:14.445', accentColor: '#65e1c6'},
      {position: 2, name: 'Kimi Antonelli', team: 'Mercedes', stat: '+1.4s', accentColor: '#65e1c6'},
      {position: 3, name: 'Charles Leclerc', team: 'Ferrari', stat: '+3.9s', accentColor: '#ff5546'},
    ].map(async (entry) => ({
      ...entry,
      badge: await badgeFor({name: entry.name, team: entry.team}),
    })));
    const entries = await Promise.all(
      [
        ['Lewis Hamilton', 'Ferrari', '4', '+7.1s'],
        ['Lando Norris', 'McLaren', '5', '+10.6s'],
        ['Max Verstappen', 'Red Bull', '6', '+12.0s'],
        ['Oliver Bearman', 'Haas', '7', '+18.4s'],
        ['Gabriel Bortoleto', 'Sauber', '8', '+22.1s'],
        ['Pierre Gasly', 'Alpine', '9', '+23.8s'],
        ['Liam Lawson', 'Williams', '10', '+24.1s'],
      ].map(async ([name, team, value, secondaryValue], index) => ({
        position: index + 4,
        name,
        team,
        badge: await badgeFor({name, team}),
        value,
        secondaryValue,
        accentColor: resolveTeamColor(team),
      }))
    );
    return {
      ...createBaseJob({
        ...common,
        title: 'Grande Prêmio da Austrália',
        subtitle: labelOverride?.trim() || 'Resultado da Corrida',
        raceType: raceType?.trim() || 'Race',
        raceId: 101,
        raceName: 'GP da Austrália',
        countryCode: 'AUS',
        circuitName: 'Albert Park',
        brandLogoPath: pickBrandLogoPath(themeConfig.variant),
        backgroundImagePath: pickResultsBackground('Race'),
        outputName: outputName?.trim() || 'f1-australia-race-results.mp4',
      }),
      podium,
      entries,
    };
  }

  if (template === 'qualifying-grid') {
    const podium = await Promise.all([
      {position: 1, name: 'George Russell', team: 'Mercedes', stat: '1:15.102', accentColor: '#65e1c6'},
      {position: 2, name: 'Kimi Antonelli', team: 'Mercedes', stat: '+0.083', accentColor: '#65e1c6'},
      {position: 3, name: 'Lewis Hamilton', team: 'Ferrari', stat: '+0.194', accentColor: '#ff5546'},
    ].map(async (entry) => ({
      ...entry,
      badge: await badgeFor({name: entry.name, team: entry.team}),
    })));
    const entries = await Promise.all(
      [
        ['Charles Leclerc', 'Ferrari', 'P4'],
        ['Oscar Piastri', 'McLaren', 'P5'],
        ['Lando Norris', 'McLaren', 'P6'],
        ['Pierre Gasly', 'Alpine', 'P7'],
        ['Max Verstappen', 'Red Bull', 'P8'],
        ['Isack Hadjar', 'Racing Bulls', 'P9'],
        ['Oliver Bearman', 'Haas', 'P10'],
      ].map(async ([name, team, value], index) => ({
        position: index + 4,
        name,
        team,
        badge: await badgeFor({name, team}),
        value,
        accentColor: resolveTeamColor(team),
      }))
    );
    return {
      ...createBaseJob({
        ...common,
        title: 'Grande Prêmio da Austrália',
        subtitle: labelOverride?.trim() || 'Classificação de Largada',
        raceType: raceType?.trim() || '3rd Qualifying',
        raceId: 101,
        raceName: 'GP da Austrália',
        countryCode: 'AUS',
        circuitName: 'Albert Park',
        brandLogoPath: pickBrandLogoPath(themeConfig.variant),
        outputName: outputName?.trim() || 'f1-australia-qualifying-grid.mp4',
      }),
      podium,
      entries,
    };
  }

  if (template === 'race-pace') {
    const entries = await Promise.all(
      [
        ['George Russell', 'Mercedes', '1:39.157', '--'],
        ['Kimi Antonelli', 'Mercedes', '1:39.182', '+0.025s/volta'],
        ['Charles Leclerc', 'Ferrari', '1:39.240', '+0.083s/volta'],
        ['Lewis Hamilton', 'Ferrari', '1:39.286', '+0.129s/volta'],
        ['Lando Norris', 'McLaren', '1:39.344', '+0.187s/volta'],
        ['Max Verstappen', 'Red Bull', '1:39.395', '+0.238s/volta'],
        ['Oscar Piastri', 'McLaren', '1:39.412', '+0.255s/volta'],
        ['Pierre Gasly', 'Alpine', '1:39.498', '+0.341s/volta'],
        ['Oliver Bearman', 'Haas', '1:39.541', '+0.384s/volta'],
        ['Liam Lawson', 'Racing Bulls', '1:39.566', '+0.409s/volta'],
      ].map(async ([name, team, value, secondaryValue], index) => ({
        position: index + 1,
        name,
        team,
        badge: await badgeFor({name, team}),
        value,
        secondaryValue,
        accentColor: resolveTeamColor(team),
      }))
    );
    return {
      ...createBaseJob({
        ...common,
        title: 'Ritmo de Corrida',
        subtitle: labelOverride?.trim() || 'Média limpa da corrida',
        raceType: 'Race',
        raceId: 101,
        raceName: 'GP da Austrália',
        countryCode: 'AUS',
        circuitName: 'Albert Park',
        brandLogoPath: pickBrandLogoPath(themeConfig.variant),
        outputName: outputName?.trim() || 'f1-race-pace-australia-2026.mp4',
      }),
      sessionCode: 'R',
      paceSummary: 'Média limpa da corrida',
      entries,
    };
  }

  if (template === 'teammate-battle') {
    const teamName = Number(teamId) === 2 ? 'Scuderia Ferrari' : 'Mercedes-AMG Petronas';
    const driver1Name = teamName.includes('Ferrari') ? 'Lewis Hamilton' : 'George Russell';
    const driver2Name = teamName.includes('Ferrari') ? 'Charles Leclerc' : 'Andrea Kimi Antonelli';
    const driver1Code = deriveSurnameCode(driver1Name);
    const driver2Code = deriveSurnameCode(driver2Name);

    return {
      ...createBaseJob({
        ...common,
        title: 'GP da Austrália',
        subtitle: labelOverride?.trim() || 'Head-to-Head de Equipe',
        raceType: 'Race',
        raceId: 101,
        raceName: 'GP da Austrália',
        countryCode: 'AUS',
        circuitName: 'Albert Park',
        brandLogoPath: pickBrandLogoPath(themeConfig.variant),
        outputName:
          outputName?.trim() ||
          `f1-head-to-head-${sanitize(teamName)}-${season}.mp4`,
      }),
      teamId: Number(teamId) || 1,
      teamName,
      contextSubtitle: contextSubtitle?.trim() || 'Após o GP da Austrália',
      driver1: {
        code: driver1Code,
        name: driver1Name,
        team: teamName,
        badge: await badgeFor({name: driver1Name, team: teamName}),
        accentColor: resolveTeamColor(teamName),
      },
      driver2: {
        code: driver2Code,
        name: driver2Name,
        team: teamName,
        badge: await badgeFor({name: driver2Name, team: teamName}),
        accentColor: resolveTeamColor(teamName),
      },
      qualifyingScore: {driver1: 3, driver2: 1, label: 'Classificação (Temporada)'},
      raceFinishScore: {driver1: 2, driver2: 2, label: 'Corrida (Temporada)'},
      championshipPoints: {driver1: 51, driver2: 47, label: 'Pontos no Campeonato'},
      championshipLeader: 'driver1',
    };
  }

  if (template === 'circuit-insights') {
    return {
      ...createBaseJob({
        ...common,
        title: 'GP do Japão',
        subtitle: labelOverride?.trim() || 'Circuito Insights',
        raceType: 'Race',
        raceId: 103,
        raceName: 'GP do Japão',
        countryCode: 'JPN',
        circuitName: 'Suzuka',
        brandLogoPath: pickBrandLogoPath(themeConfig.variant),
        outputName: outputName?.trim() || `f1-circuit-insights-japan-${season}.mp4`,
      }),
      keyPoints: [
        'Suzuka é um traçado de alta com trechos em sequência.',
        'As primeiras curvas costumam definir o tom da volta.',
        'Acerto aerodinâmico equilibrado faz diferença no setor final.',
        'Erro mínimo no setor 1 já custa tempo relevante.',
      ],
      stats: [
        {label: 'Circuito', value: 'Suzuka'},
        {label: 'País', value: 'Japão'},
        {label: 'Comprimento', value: '5.807 km'},
        {label: 'Voltas', value: '53'},
        {label: 'Temporada', value: String(season)},
      ],
      historicalNote: `Último vencedor: Max Verstappen (${Math.max(0, season - 1)})`,
      trackImagePath: undefined,
    };
  }

  if (template === 'driver-standings') {
    const entries = [
      ['George Russell', 'Mercedes', '51', '2 vitorias'],
      ['Kimi Antonelli', 'Mercedes', '47', '1 vitoria'],
      ['Charles Leclerc', 'Ferrari', '34', '2 podios'],
      ['Lewis Hamilton', 'Ferrari', '33', '1 podio'],
      ['Oliver Bearman', 'Haas', '17', ''],
      ['Lando Norris', 'McLaren', '15', ''],
      ['Pierre Gasly', 'Alpine', '9', ''],
      ['Max Verstappen', 'Red Bull', '8', ''],
      ['Liam Lawson', 'Williams', '8', ''],
      ['Gabriel Bortoleto', 'Sauber', '6', ''],
    ];
    const normalizedEntries = await Promise.all(
      entries.map(async ([name, team, value, secondaryValue], index) => ({
        position: index + 1,
        name,
        team,
        badge: await badgeFor({name, team}),
        value,
        secondaryValue,
        accentColor: resolveTeamColor(team),
      }))
    );
    return {
      ...createBaseJob({
        ...common,
        title: 'Mundial de Pilotos',
        subtitle: labelOverride?.trim() || `Formula 1 ${season}`,
        brandLogoPath: pickBrandLogoPath(themeConfig.variant),
        outputName: outputName?.trim() || `f1-driver-standings-${season}.mp4`,
      }),
      leader: {
        position: 1,
        name: 'George Russell',
        team: 'Mercedes',
        badge: await badgeFor({name: 'George Russell', team: 'Mercedes'}),
        stat: '51 pts',
        accentColor: '#65e1c6',
      },
      entries: normalizedEntries,
    };
  }

  if (template === 'constructor-standings') {
    const entries = [
      ['Mercedes', '43', '2 vitorias'],
      ['Ferrari', '27', '2 podios'],
      ['McLaren', '10', ''],
      ['Red Bull', '8', ''],
      ['Haas', '6', ''],
      ['Racing Bulls', '4', ''],
      ['Audi Revolut', '2', ''],
      ['Alpine', '1', ''],
      ['Williams', '0', ''],
      ['Cadillac', '0', ''],
    ];
    const normalizedEntries = await Promise.all(
      entries.map(async ([name, value, secondaryValue], index) => ({
        position: index + 1,
        name,
        team: '',
        badge: await badgeFor({name, team: name, useDriverPortrait: false}),
        value,
        secondaryValue,
        accentColor: resolveTeamColor(name),
      }))
    );
    return {
      ...createBaseJob({
        ...common,
        title: 'Mundial de Construtores',
        subtitle: labelOverride?.trim() || `Formula 1 ${season}`,
        brandLogoPath: pickBrandLogoPath(themeConfig.variant),
        outputName: outputName?.trim() || `f1-constructor-standings-${season}.mp4`,
      }),
      leader: {
        position: 1,
        name: 'Mercedes',
        team: 'Mercedes',
        badge: await badgeFor({name: 'Mercedes', team: 'Mercedes', useDriverPortrait: false}),
        stat: '43 pts',
        accentColor: '#65e1c6',
      },
      entries: normalizedEntries,
    };
  }

  if (template === 'weekend-schedule') {
    return {
      ...createBaseJob({
        ...common,
        title: 'Horarios da Formula 1',
        subtitle: labelOverride?.trim() || 'GP da China',
        raceId: 102,
        raceName: 'GP da China',
        countryCode: 'CHN',
        circuitName: 'Xangai',
        brandLogoPath: pickBrandLogoPath(themeConfig.variant),
        outputName: outputName?.trim() || 'f1-weekend-schedule-china.mp4',
      }),
      sessions: sampleWeekendSessions,
    };
  }

  return {
    ...createBaseJob({
      ...common,
      title: 'GP do Japão',
      subtitle: labelOverride?.trim() || 'Circuito de Suzuka',
      raceId: 103,
      raceName: 'GP do Japão',
      countryCode: 'JPN',
      circuitName: 'Suzuka',
      brandLogoPath: pickBrandLogoPath(themeConfig.variant),
      outputName: outputName?.trim() || 'f1-circuit-info-japan.mp4',
    }),
    facts: [
      {label: 'Curvas', value: '18 curvas, maioria de alta'},
      {label: 'Aero', value: 'Alta pressao aerodinamica'},
      {label: 'Desafio', value: 'Mudancas de direcao e ritmo'},
      {label: 'Estrategia', value: '1 ou 2 paradas'},
      {label: 'Clima', value: 'Pode chover no domingo'},
    ],
  };
};

const normalizeRankingEntries = async (rows, template) =>
  Promise.all(
    rows.map(async (row, index) => {
      const driver = row.driver ?? row.competitor ?? {};
      const team = row.team ?? row.teams?.[0] ?? {};
      const name = driver.name ?? team.name ?? `Posicao ${index + 1}`;
      const teamName = team.name ?? row.team?.name ?? row.constructor?.name ?? '';
      const accentColor = resolveTeamColor(teamName || name);
      const position = Number(row.position ?? row.rank ?? index + 1);

      let value = '';
      let secondaryValue = '';

      if (template === 'race-results') {
        value = row.time ?? row.gap ?? row.status ?? '';
        secondaryValue = row.laps ? `${row.laps} voltas` : row.status ?? '';
      } else if (template === 'qualifying-grid') {
        const qualifyingLapTime =
          row.time ??
          row.best_lap_time ??
          row.bestLapTime ??
          row.best_lap ??
          row.bestLap ??
          row.q3 ??
          row.q2 ??
          row.q1 ??
          '';
        value = qualifyingLapTime || row.gap || '';
        secondaryValue = row.gap ? `+${row.gap}` : row.status ?? '';
      } else if (template === 'driver-standings') {
        value = row.points !== undefined && row.points !== null ? String(row.points) : '0';
        const chips = [];
        if (row.wins) {
          chips.push(`${row.wins} vit`);
        }
        if (row.behind !== undefined && row.behind !== null) {
          chips.push(`+${row.behind}`);
        }
        secondaryValue = chips.join(' • ');
      } else {
        value = row.points !== undefined && row.points !== null ? String(row.points) : '0';
        secondaryValue = row.wins ? `${row.wins} vit` : '';
      }

      return {
        position,
        name,
        team: template === 'constructor-standings' ? '' : teamName,
        badge: await badgeFor({
          name,
          team: teamName || name,
          driverImageUrl: template === 'constructor-standings' ? undefined : driver.image,
          teamLogoUrl: team.logo,
          useDriverPortrait: template !== 'constructor-standings',
        }),
        value,
        secondaryValue,
        driverNumber:
          template === 'constructor-standings' || driver.number === undefined || driver.number === null
            ? undefined
            : String(driver.number),
        accentColor,
      };
    })
  ).then((entries) => entries.filter((entry) => entry.name));

const invalidResultStatusPattern = /dns|dnf|dsq|ret|withdrawn|excluded|not started|no start|did not start|retired/i;
const dnfResultStatusPattern = /dnf|ret\b|retired|withdrawn/i;
const dnsResultStatusPattern = /dns|not started|no start|did not start/i;
const dsqResultStatusPattern = /dsq|disqualified|excluded/i;

const resultStatusText = (row = {}) =>
  [
    row?.status,
    row?.time,
    row?.gap,
    row?.result,
    row?.comment,
    row?.note,
    row?.raw?.status,
    row?.raw?.time,
    row?.raw?.gap,
    row?.raw?.result,
    row?.raw?.comment,
    row?.raw?.note,
  ]
    .filter((value) => value !== undefined && value !== null)
    .map((value) => String(value).toLowerCase())
    .join(' ');

const parsePosition = (row) => {
  const position = Number(row?.position ?? row?.rank);
  return Number.isFinite(position) && position > 0 ? position : null;
};

const ordinalPositionPt = (position) => {
  const normalized = Number(position);
  return Number.isFinite(normalized) && normalized > 0 ? `${Math.round(normalized)}º` : 'N/D';
};

const bestPositionValue = (position) =>
  Number.isFinite(Number(position)) && Number(position) > 0 ? Number(position) : 0;

const positionComparisonValue = (position) =>
  Number.isFinite(Number(position)) && Number(position) > 0 ? Number(position) : 999;

const enrichDriverFromSeasonList = (driver, seasonDrivers = []) => {
  const match = seasonDrivers.find((row) => {
    const candidate = extractRowDriver(row);
    return (
      (driver.id && candidate.id && Number(driver.id) === Number(candidate.id)) ||
      (driver.name && candidate.name && normalizeEntityName(driver.name) === normalizeEntityName(candidate.name)) ||
      (driver.code && candidate.code && normalizeDriverCode(driver.code) === normalizeDriverCode(candidate.code))
    );
  });

  if (!match) {
    return driver;
  }

  const enriched = extractRowDriver(match);
  return {
    ...driver,
    ...Object.fromEntries(
      Object.entries(enriched).filter(([, value]) => value !== undefined && value !== '' && value !== 0)
    ),
  };
};

const normalizeEntityName = (value = '') =>
  String(value)
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

const qualifyingTimeFromRow = (row) =>
  row?.time ??
  row?.best_lap_time ??
  row?.bestLapTime ??
  row?.best_lap ??
  row?.bestLap ??
  row?.q3 ??
  row?.q2 ??
  row?.q1 ??
  '';

const rankingDriverKey = (row) => {
  const driver = row?.driver ?? row?.competitor ?? {};
  const driverId = Number(driver.id);
  if (Number.isFinite(driverId) && driverId > 0) {
    return `id:${driverId}`;
  }

  const name = driver.name ?? row?.name ?? '';
  return name ? `name:${normalizeEntityName(name)}` : '';
};

const mergeQualifyingStagesIntoGrid = ({q1Rows = [], q2Rows = [], q3Rows = []}) => {
  const mergedRows = [];
  const usedDrivers = new Set();

  const appendStage = (rows) => {
    for (const row of sortByPosition(rows)) {
      const key = rankingDriverKey(row);
      if (!key || usedDrivers.has(key) || !qualifyingTimeFromRow(row)) {
        continue;
      }

      usedDrivers.add(key);
      mergedRows.push({
        ...row,
        position: mergedRows.length + 1,
        rank: mergedRows.length + 1,
      });
    }
  };

  appendStage(q3Rows);
  appendStage(q2Rows);
  appendStage(q1Rows);

  return mergedRows;
};

const isInvalidStatusRow = (row) => invalidResultStatusPattern.test(resultStatusText(row));

const isDnfStatusRow = (row) => dnfResultStatusPattern.test(resultStatusText(row));

const isDnsStatusRow = (row) => dnsResultStatusPattern.test(resultStatusText(row));

const isDsqStatusRow = (row) => dsqResultStatusPattern.test(resultStatusText(row));

const raceHeadToHeadOutcome = (rowA, rowB) => {
  const posA = parsePosition(rowA);
  const posB = parsePosition(rowB);
  const hasPosA = posA !== null;
  const hasPosB = posB !== null;
  const invalidA = isInvalidStatusRow(rowA);
  const invalidB = isInvalidStatusRow(rowB);

  if (invalidA && invalidB) {
    return null;
  }
  if (invalidA && !invalidB) {
    return 'b';
  }
  if (!invalidA && invalidB) {
    return 'a';
  }

  if (hasPosA && hasPosB) {
    if (posA < posB) {
      return 'a';
    }
    if (posB < posA) {
      return 'b';
    }
    return null;
  }

  if (hasPosA && !hasPosB) {
    return 'a';
  }
  if (!hasPosA && hasPosB) {
    return 'b';
  }

  return null;
};

const extractRowTeam = (row) => {
  const teamCandidates = [row?.team, ...(Array.isArray(row?.teams) ? row.teams : [])].filter(Boolean);
  const preferred = teamCandidates[0] ?? {};
  return {
    id: Number(preferred?.id ?? preferred?.team_id ?? preferred?.teamId ?? preferred?.constructor_id ?? 0),
    name: String(preferred?.name ?? preferred?.team_name ?? '').trim(),
  };
};

const extractRowDriver = (row) => {
  const driver = row?.driver ?? row?.competitor ?? row ?? {};
  return {
    id: Number(driver?.id ?? driver?.driver_id ?? driver?.driverId ?? 0),
    code: normalizeDriverCode(
      driver?.code ?? driver?.abbreviation ?? driver?.acronym ?? deriveSurnameCode(driver?.name ?? '')
    ),
    name: String(driver?.name ?? '').trim(),
    image: driver?.image,
    number:
      driver?.number === undefined || driver?.number === null
        ? undefined
        : String(driver.number),
  };
};

const rowMatchesDriver = (row, driver) => {
  if (!driver) {
    return false;
  }
  const rowDriver = extractRowDriver(row);
  if (driver.id && rowDriver.id && Number(driver.id) === Number(rowDriver.id)) {
    return true;
  }
  if (driver.code && rowDriver.code && normalizeDriverCode(driver.code) === normalizeDriverCode(rowDriver.code)) {
    return true;
  }
  if (driver.name && rowDriver.name && normalizeEntityName(driver.name) === normalizeEntityName(rowDriver.name)) {
    return true;
  }
  return false;
};

const findDriverRowsForTeam = (rows = [], driver1, driver2, teamId) => {
  const teamScopedRows = rows.filter((row) => {
    const team = extractRowTeam(row);
    return teamId ? Number(team.id) === Number(teamId) : true;
  });

  const row1 = teamScopedRows.find((row) => rowMatchesDriver(row, driver1));
  const row2 = teamScopedRows.find((row) => rowMatchesDriver(row, driver2));
  return {row1, row2};
};

const normalizeF1Race = (race = {}) => ({
  id: Number(race.id ?? 0),
  type: String(race.type ?? '').trim(),
  status: String(race.status ?? '').trim(),
  date: race.date,
  timestamp: new Date(race.date ?? 0).getTime(),
  raw: race,
});

const normalizeDriverRankingRow = (row = {}) => {
  const driver = extractRowDriver(row);
  const team = extractRowTeam(row);
  return {
    driver,
    team,
    position: parsePosition(row),
    points: Number.isFinite(Number(row.points)) ? Number(row.points) : 0,
    wins: Number.isFinite(Number(row.wins)) ? Number(row.wins) : 0,
    raw: row,
  };
};

const normalizeRaceResultRow = (row = {}, raceId) => {
  const driver = extractRowDriver(row);
  const team = extractRowTeam(row);
  return {
    raceId: Number(raceId),
    driver,
    team,
    position: parsePosition(row),
    status: String(row.status ?? '').trim(),
    raw: row,
  };
};

const normalizeStartingGridRow = (row = {}, raceId) => {
  const driver = extractRowDriver(row);
  const team = extractRowTeam(row);
  return {
    raceId: Number(raceId),
    driver,
    team,
    position: parsePosition(row),
    raw: row,
  };
};

const teamMatchesId = (team, selectedTeamId) =>
  Number.isFinite(Number(selectedTeamId)) &&
  Number(selectedTeamId) > 0 &&
  Number(team?.id) === Number(selectedTeamId);

const driverIdentityKey = (driver = {}) => {
  if (Number(driver.id) > 0) return `id:${Number(driver.id)}`;
  if (driver.name) return `name:${normalizeEntityName(driver.name)}`;
  if (driver.code) return `code:${normalizeDriverCode(driver.code)}`;
  return '';
};

const sameDriverIdentity = (a = {}, b = {}) => {
  if (a.id && b.id && Number(a.id) === Number(b.id)) return true;
  if (a.name && b.name && normalizeEntityName(a.name) === normalizeEntityName(b.name)) return true;
  if (a.code && b.code && normalizeDriverCode(a.code) === normalizeDriverCode(b.code)) return true;
  return false;
};

const roundOneDecimalOrNull = (value) =>
  Number.isFinite(value) ? Math.round(value * 10) / 10 : null;

const averagePosition = (positions = []) => {
  const valid = positions.filter((position) => Number.isFinite(position) && position > 0);
  if (valid.length === 0) return null;
  return roundOneDecimalOrNull(valid.reduce((sum, position) => sum + position, 0) / valid.length);
};

const countDnfRaceResult = (row) => isDnfStatusRow(row?.raw ?? row);

const countDnsRaceResult = (row) => isDnsStatusRow(row?.raw ?? row);

const countDsqRaceResult = (row) => isDsqStatusRow(row?.raw ?? row);

const raceHeadToHeadOutcomeFromNormalized = (rowA, rowB) =>
  raceHeadToHeadOutcome(rowA?.raw ?? rowA, rowB?.raw ?? rowB);

const positionDisplayPt = (position) =>
  position === null || position === undefined ? 'N/D' : ordinalPositionPt(position);

const normalizedRowsForDriver = (rows, driver) =>
  rows.filter((row) => sameDriverIdentity(row.driver, driver));

const sortTeammateDrivers = (drivers) =>
  [...drivers].sort((a, b) => {
    const pointsDelta = (b.championshipPoints ?? 0) - (a.championshipPoints ?? 0);
    if (pointsDelta !== 0) return pointsDelta;
    const posA = a.championshipPosition ?? Number.POSITIVE_INFINITY;
    const posB = b.championshipPosition ?? Number.POSITIVE_INFINITY;
    if (posA !== posB) return posA - posB;
    return String(a.name).localeCompare(String(b.name), 'en', {sensitivity: 'base'});
  });

const resolveStandingsTeamPair = async (standingsRows, selectedTeamId) => {
  const teamMap = new Map();

  for (const row of standingsRows) {
    const driver = extractRowDriver(row);
    const team = extractRowTeam(row);
    if (!driver.name || !team.name) {
      continue;
    }

    const key = team.id ? `id:${team.id}` : `name:${normalizeEntityName(team.name)}`;
    const existing = teamMap.get(key) ?? {
      teamId: team.id || undefined,
      teamName: team.name,
      drivers: new Map(),
    };
    const driverKey = driver.id ? `id:${driver.id}` : `name:${normalizeEntityName(driver.name)}`;
    const points = Number(row?.points ?? 0);
    const existingDriver = existing.drivers.get(driverKey);
    if (!existingDriver || points > existingDriver.points) {
      existing.drivers.set(driverKey, {
        ...driver,
        teamId: team.id || undefined,
        teamName: team.name,
        points,
      });
    }
    teamMap.set(key, existing);
  }

  const teams = [...teamMap.values()]
    .map((team) => ({
      ...team,
      drivers: [...team.drivers.values()].sort((a, b) => b.points - a.points),
    }))
    .filter((team) => team.drivers.length >= 2);

  if (teams.length === 0) {
    return null;
  }

  let selectedTeam = null;
  if (selectedTeamId) {
    selectedTeam = teams.find((team) => Number(team.teamId) === Number(selectedTeamId)) ?? null;
  }

  if (!selectedTeam) {
    selectedTeam = teams[0];
  }

  if (!selectedTeam || selectedTeam.drivers.length < 2) {
    return null;
  }

  return {
    teamId: selectedTeam.teamId ?? Number(selectedTeamId ?? 0),
    teamName: selectedTeam.teamName,
    driver1: selectedTeam.drivers[0],
    driver2: selectedTeam.drivers[1],
  };
};

const parseRaceTimeToMs = (value) => {
  if (!value) {
    return Number.NaN;
  }
  const raw = String(value).trim();
  if (!raw || /^\+/.test(raw) || /lap|dnf|dns|dsq|ret|nc/i.test(raw)) {
    return Number.NaN;
  }

  const parts = raw.split(':').map((part) => part.trim());
  if (parts.some((part) => part.length === 0)) {
    return Number.NaN;
  }

  const secondsPart = Number(parts.pop());
  if (!Number.isFinite(secondsPart)) {
    return Number.NaN;
  }

  let totalSeconds = secondsPart;
  let multiplier = 60;
  while (parts.length > 0) {
    const unit = Number(parts.pop());
    if (!Number.isFinite(unit)) {
      return Number.NaN;
    }
    totalSeconds += unit * multiplier;
    multiplier *= 60;
  }

  return totalSeconds * 1000;
};

const formatPaceMs = (paceMs) => {
  if (!Number.isFinite(paceMs) || paceMs <= 0) {
    return '';
  }
  const totalSeconds = paceMs / 1000;
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds - minutes * 60;
  return `${minutes}:${seconds.toFixed(3).padStart(6, '0')}`;
};

const isComparableRaceRow = (row) => {
  const status = String(row?.status ?? '').toLowerCase();
  if (/dns|dnf|dsq|ret|withdrawn|excluded|not started/i.test(status)) {
    return false;
  }
  const laps = Number(row?.laps ?? row?.lap ?? 0);
  if (!Number.isFinite(laps) || laps <= 0) {
    return false;
  }
  const totalRaceMs = parseRaceTimeToMs(row?.time);
  return Number.isFinite(totalRaceMs) && totalRaceMs > 0;
};

const buildRacePaceEntries = async (rows = []) => {
  const comparableRows = rows.filter((row) => isComparableRaceRow(row));
  const paceRows = comparableRows
    .map((row) => {
      const laps = Number(row?.laps ?? row?.lap ?? 0);
      const totalRaceMs = parseRaceTimeToMs(row?.time);
      const paceMs = totalRaceMs / laps;
      return {...row, paceMs};
    })
    .filter((row) => Number.isFinite(row.paceMs) && row.paceMs > 0)
    .sort((a, b) => a.paceMs - b.paceMs);

  if (paceRows.length === 0) {
    return [];
  }

  const leaderPace = paceRows[0].paceMs;
  const entries = await Promise.all(
    paceRows.slice(0, 10).map(async (row, index) => {
      const driver = row.driver ?? row.competitor ?? {};
      const team = row.team ?? row.teams?.[0] ?? {};
      const name = driver.name ?? `Posição ${index + 1}`;
      const teamName = team.name ?? '';
      const deltaPerLap = row.paceMs - leaderPace;

      return {
        position: index + 1,
        name,
        team: teamName,
        badge: await badgeFor({
          name,
          team: teamName || name,
          driverImageUrl: driver.image,
          teamLogoUrl: team.logo,
          useDriverPortrait: true,
        }),
        value: formatPaceMs(row.paceMs),
        secondaryValue: index === 0 ? '--' : `+${(deltaPerLap / 1000).toFixed(3)}s/volta`,
        driverNumber:
          driver.number === undefined || driver.number === null
            ? undefined
            : String(driver.number),
        accentColor: resolveTeamColor(teamName || name),
      };
    })
  );

  return entries;
};

const buildTeammateBattleData = async ({
  apiKey,
  apiHost,
  season,
  races,
  untilRaceId,
  selectedTeamId,
}) => {
  const standingsPayload = await fetchJson(
    `https://${apiHost}/rankings/drivers?season=${season}`,
    apiKey,
    apiHost
  );
  const standingsRows = Array.isArray(standingsPayload.response)
    ? standingsPayload.response.map(normalizeDriverRankingRow)
    : [];
  const driversPayload = await fetchJson(
    `https://${apiHost}/drivers?season=${season}`,
    apiKey,
    apiHost
  ).catch(() => ({response: []}));
  const seasonDrivers = Array.isArray(driversPayload.response) ? driversPayload.response : [];
  const warnings = [];
  const normalizedRaces = races
    .map(normalizeF1Race)
    .filter((race) => race.id > 0 && /^race$/i.test(race.type) && String(race.status).toLowerCase() === 'completed')
    .sort((a, b) => a.timestamp - b.timestamp);
  const cutoffRace = untilRaceId
    ? normalizedRaces.find((race) => Number(race.id) === Number(untilRaceId))
    : null;
  const cutoffTime = cutoffRace?.timestamp ?? Number.POSITIVE_INFINITY;
  const completedRaces = normalizedRaces.filter((race) => race.timestamp <= cutoffTime);
  const skippedRaceIds = new Set();
  const raceResultsByRaceId = new Map();
  const startingGridsByRaceId = new Map();

  for (const race of completedRaces) {
    try {
      const racePayload = await fetchJson(
        `https://${apiHost}/rankings/races?race=${race.id}`,
        apiKey,
        apiHost
      );
      const raceRows = Array.isArray(racePayload.response)
        ? racePayload.response.map((row) => normalizeRaceResultRow(row, race.id))
        : [];
      if (raceRows.length === 0) {
        skippedRaceIds.add(race.id);
      }
      raceResultsByRaceId.set(race.id, raceRows);
    } catch {
      skippedRaceIds.add(race.id);
      raceResultsByRaceId.set(race.id, []);
    }

    try {
      const gridPayload = await fetchJson(
        `https://${apiHost}/rankings/startinggrid?race=${race.id}`,
        apiKey,
        apiHost
      );
      const gridRows = Array.isArray(gridPayload.response)
        ? gridPayload.response.map((row) => normalizeStartingGridRow(row, race.id))
        : [];
      if (gridRows.length === 0) {
        skippedRaceIds.add(race.id);
      }
      startingGridsByRaceId.set(race.id, gridRows);
    } catch {
      skippedRaceIds.add(race.id);
      startingGridsByRaceId.set(race.id, []);
    }
  }

  const teamRankingRows = standingsRows.filter((row) => teamMatchesId(row.team, selectedTeamId));
  const allRaceResultRows = [...raceResultsByRaceId.values()]
    .flat()
    .filter((row) => teamMatchesId(row.team, selectedTeamId));
  const allStartingGridRows = [...startingGridsByRaceId.values()]
    .flat()
    .filter((row) => teamMatchesId(row.team, selectedTeamId));

  const candidates = new Map();
  const addCandidate = (driver, team, source, appearanceWeight = 0) => {
    const key = driverIdentityKey(driver);
    if (!key || !driver?.name) return;
    const existing = candidates.get(key) ?? {
      ...driver,
      teamId: team?.id || Number(selectedTeamId),
      teamName: team?.name || '',
      appearances: 0,
      sources: new Set(),
    };
    existing.appearances += appearanceWeight;
    existing.sources.add(source);
    candidates.set(key, existing);
  };

  teamRankingRows.forEach((row) => addCandidate(row.driver, row.team, 'rankings', 0));
  allRaceResultRows.forEach((row) => addCandidate(row.driver, row.team, 'race-results', 1));
  allStartingGridRows.forEach((row) => addCandidate(row.driver, row.team, 'starting-grid', 1));

  const candidatesBySource = (sources) =>
    [...candidates.values()].filter((candidate) =>
      sources.some((source) => candidate.sources.has(source))
    );
  let candidatePool = candidatesBySource(['rankings']);
  if (candidatePool.length < 2) {
    candidatePool = candidatesBySource(['rankings', 'race-results']);
  }
  if (candidatePool.length < 2) {
    candidatePool = candidatesBySource(['rankings', 'race-results', 'starting-grid']);
  }

  if (candidatePool.length < 2) {
    throw new F1PreparationError(
      'Equipe sem dupla válida encontrada para gerar Head-to-Head.',
      'team_data_missing',
      `teamId=${selectedTeamId}; candidates=${candidatePool.length}`
    );
  }

  if (candidatePool.length > 2) {
    warnings.push(
      `Mais de dois pilotos encontrados para a equipe ${selectedTeamId}; usando os dois com mais aparições.`
    );
  }

  const standingForDriver = (driver) =>
    teamRankingRows.find((row) => sameDriverIdentity(row.driver, driver)) ?? null;

  const teamName =
    teamRankingRows[0]?.team.name ||
    allRaceResultRows[0]?.team.name ||
    allStartingGridRows[0]?.team.name ||
    `Equipe ${selectedTeamId}`;

  const buildDriverStats = (driver) => {
    const ranking = standingForDriver(driver);
    const resultRows = normalizedRowsForDriver(allRaceResultRows, driver);
    const gridRows = normalizedRowsForDriver(allStartingGridRows, driver);
    const classifiedResultRows = resultRows.filter((row) => !isInvalidStatusRow(row));
    const finishPositions = classifiedResultRows
      .map((row) => row.position)
      .filter((position) => position !== null);
    const gridPositions = gridRows
      .map((row) => row.position)
      .filter((position) => position !== null);

    return {
      ...driver,
      teamId: Number(selectedTeamId),
      teamName,
      championshipPosition: ranking?.position ?? null,
      championshipPoints: ranking?.points ?? 0,
      wins: classifiedResultRows.filter((row) => row.position === 1).length,
      podiums: classifiedResultRows.filter((row) => row.position !== null && row.position <= 3).length,
      poles: gridRows.filter((row) => row.position === 1).length,
      bestFinish: finishPositions.length ? Math.min(...finishPositions) : null,
      averageFinish: averagePosition(finishPositions),
      bestGrid: gridPositions.length ? Math.min(...gridPositions) : null,
      averageGrid: averagePosition(gridPositions),
      racesStarted: gridPositions.length,
      classifiedResults: classifiedResultRows.length,
      dnfCount: resultRows.filter(countDnfRaceResult).length,
      dnsCount: resultRows.filter(countDnsRaceResult).length,
      dsqCount: resultRows.filter(countDsqRaceResult).length,
      resultRows,
      gridRows,
    };
  };

  const selectedDrivers = candidatePool
    .sort((a, b) => {
      if (b.appearances !== a.appearances) return b.appearances - a.appearances;
      return String(a.name).localeCompare(String(b.name), 'en', {sensitivity: 'base'});
    })
    .slice(0, 2)
    .map(buildDriverStats);

  const sortedDrivers = sortTeammateDrivers(selectedDrivers);
  const [driver1Stats, driver2Stats] = sortedDrivers;
  const driver1 = enrichDriverFromSeasonList(driver1Stats, seasonDrivers);
  const driver2 = enrichDriverFromSeasonList(driver2Stats, seasonDrivers);
  const driver1Badge = await badgeFor({
    name: driver1.name,
    team: teamName,
    driverImageUrl: driver1.image,
    useDriverPortrait: true,
  });
  const driver2Badge = await badgeFor({
    name: driver2.name,
    team: teamName,
    driverImageUrl: driver2.image,
    useDriverPortrait: true,
  });

  let qualifyingScore1 = 0;
  let qualifyingScore2 = 0;
  let raceScore1 = 0;
  let raceScore2 = 0;

  for (const race of completedRaces) {
    const resultRows = (raceResultsByRaceId.get(race.id) ?? []).filter((row) =>
      teamMatchesId(row.team, selectedTeamId)
    );
    const gridRows = (startingGridsByRaceId.get(race.id) ?? []).filter((row) =>
      teamMatchesId(row.team, selectedTeamId)
    );
    const resultRow1 = resultRows.find((row) => sameDriverIdentity(row.driver, driver1Stats));
    const resultRow2 = resultRows.find((row) => sameDriverIdentity(row.driver, driver2Stats));
    const gridRow1 = gridRows.find((row) => sameDriverIdentity(row.driver, driver1Stats));
    const gridRow2 = gridRows.find((row) => sameDriverIdentity(row.driver, driver2Stats));
    const raceOutcome = raceHeadToHeadOutcomeFromNormalized(resultRow1, resultRow2);
    const gridOutcome = raceHeadToHeadOutcomeFromNormalized(gridRow1, gridRow2);

    if (raceOutcome === 'a') raceScore1 += 1;
    if (raceOutcome === 'b') raceScore2 += 1;
    if (gridOutcome === 'a') qualifyingScore1 += 1;
    if (gridOutcome === 'b') qualifyingScore2 += 1;
  }

  const points1 = driver1Stats.championshipPoints;
  const points2 = driver2Stats.championshipPoints;
  let leaderDriverId = null;
  if (points1 > points2) {
    leaderDriverId = driver1Stats.id || null;
  } else if (points2 > points1) {
    leaderDriverId = driver2Stats.id || null;
  } else {
    const pos1 = driver1Stats.championshipPosition ?? Number.POSITIVE_INFINITY;
    const pos2 = driver2Stats.championshipPosition ?? Number.POSITIVE_INFINITY;
    if (pos1 < pos2) leaderDriverId = driver1Stats.id || null;
    if (pos2 < pos1) leaderDriverId = driver2Stats.id || null;
  }
  const championshipLeader =
    leaderDriverId && Number(leaderDriverId) === Number(driver1Stats.id)
      ? 'driver1'
      : leaderDriverId && Number(leaderDriverId) === Number(driver2Stats.id)
        ? 'driver2'
        : 'tie';
  const diagnostics = {
    completedRaceCount: completedRaces.length,
    raceResultRaceCount: [...raceResultsByRaceId.values()].filter((rows) => rows.length > 0).length,
    startingGridRaceCount: [...startingGridsByRaceId.values()].filter((rows) => rows.length > 0).length,
    skippedRaceIds: [...skippedRaceIds].sort((a, b) => a - b),
    warnings,
  };

  return {
    teamId: Number(selectedTeamId),
    teamName,
    driver1: {
      code: driver1.code || deriveSurnameCode(driver1.name),
      name: driver1.name,
      team: teamName,
      badge: driver1Badge,
      accentColor: resolveTeamColor(teamName),
    },
    driver2: {
      code: driver2.code || deriveSurnameCode(driver2.name),
      name: driver2.name,
      team: teamName,
      badge: driver2Badge,
      accentColor: resolveTeamColor(teamName),
    },
    qualifyingScore: {
      driver1: qualifyingScore1,
      driver2: qualifyingScore2,
      label: 'Classificação (Temporada)',
    },
    raceFinishScore: {
      driver1: raceScore1,
      driver2: raceScore2,
      label: 'Corrida (Temporada)',
    },
    championshipPoints: {
      driver1: points1,
      driver2: points2,
      label: 'Pontos no Campeonato',
    },
    podiums: {
      driver1: driver1Stats.podiums,
      driver2: driver2Stats.podiums,
      label: 'Pódios',
      hasData: diagnostics.raceResultRaceCount > 0,
    },
    wins: {
      driver1: driver1Stats.wins,
      driver2: driver2Stats.wins,
      label: 'Vitórias',
      hasData: diagnostics.raceResultRaceCount > 0,
    },
    bestRaceFinish: {
      driver1: positionComparisonValue(driver1Stats.bestFinish),
      driver2: positionComparisonValue(driver2Stats.bestFinish),
      driver1Display: positionDisplayPt(driver1Stats.bestFinish),
      driver2Display: positionDisplayPt(driver2Stats.bestFinish),
      label: 'Melhor Chegada',
      higherIsBetter: false,
      hasData: driver1Stats.bestFinish !== null || driver2Stats.bestFinish !== null,
    },
    highestGridPosition: {
      driver1: positionComparisonValue(driver1Stats.bestGrid),
      driver2: positionComparisonValue(driver2Stats.bestGrid),
      driver1Display: positionDisplayPt(driver1Stats.bestGrid),
      driver2Display: positionDisplayPt(driver2Stats.bestGrid),
      label: 'Melhor Largada',
      higherIsBetter: false,
      hasData: driver1Stats.bestGrid !== null || driver2Stats.bestGrid !== null,
    },
    dnfCount: {
      driver1: driver1Stats.dnfCount,
      driver2: driver2Stats.dnfCount,
      label: 'DNF · Abandono',
      higherIsBetter: false,
      hasData: diagnostics.raceResultRaceCount > 0,
    },
    dnsCount: {
      driver1: driver1Stats.dnsCount,
      driver2: driver2Stats.dnsCount,
      label: 'DNS · Não largou',
      higherIsBetter: false,
      hasData: diagnostics.raceResultRaceCount > 0,
    },
    dsqCount: {
      driver1: driver1Stats.dsqCount,
      driver2: driver2Stats.dsqCount,
      label: 'DSQ · Desclassificado',
      higherIsBetter: false,
      hasData: diagnostics.raceResultRaceCount > 0,
    },
    driverStats: [
      {
        driverId: driver1Stats.id || null,
        name: driver1Stats.name,
        championshipPosition: driver1Stats.championshipPosition,
        championshipPoints: driver1Stats.championshipPoints,
        wins: driver1Stats.wins,
        podiums: driver1Stats.podiums,
        poles: driver1Stats.poles,
        bestFinish: driver1Stats.bestFinish,
        averageFinish: driver1Stats.averageFinish,
        bestGrid: driver1Stats.bestGrid,
        averageGrid: driver1Stats.averageGrid,
        racesStarted: driver1Stats.racesStarted,
        classifiedResults: driver1Stats.classifiedResults,
        dnfCount: driver1Stats.dnfCount,
        dnsCount: driver1Stats.dnsCount,
        dsqCount: driver1Stats.dsqCount,
      },
      {
        driverId: driver2Stats.id || null,
        name: driver2Stats.name,
        championshipPosition: driver2Stats.championshipPosition,
        championshipPoints: driver2Stats.championshipPoints,
        wins: driver2Stats.wins,
        podiums: driver2Stats.podiums,
        poles: driver2Stats.poles,
        bestFinish: driver2Stats.bestFinish,
        averageFinish: driver2Stats.averageFinish,
        bestGrid: driver2Stats.bestGrid,
        averageGrid: driver2Stats.averageGrid,
        racesStarted: driver2Stats.racesStarted,
        classifiedResults: driver2Stats.classifiedResults,
        dnfCount: driver2Stats.dnfCount,
        dnsCount: driver2Stats.dnsCount,
        dsqCount: driver2Stats.dsqCount,
      },
    ],
    leaderDriverId,
    diagnostics,
    warnings: diagnostics.warnings,
    championshipLeader,
  };
};

const extractCircuitImageUrl = (circuit = {}) =>
  circuit.image ??
  circuit.layout ??
  circuit.map ??
  circuit.thumbnail ??
  circuit.track ??
  circuit.photo_url ??
  circuit.image_url ??
  circuit?.media?.image ??
  circuit?.media?.layout ??
  circuit.photo ??
  undefined;

const findEquivalentPreviousRace = (previousRaces = [], referenceRace = {}) => {
  const refCountry = sanitize(referenceRace?.competition?.location?.country ?? '');
  const refCircuit = sanitize(referenceRace?.circuit?.name ?? '');

  return [...previousRaces]
    .filter((race) => /^race$/i.test(String(race?.type ?? '').trim()))
    .filter((race) => isCompleted(race))
    .filter((race) => {
      const raceCountry = sanitize(race?.competition?.location?.country ?? '');
      const raceCircuit = sanitize(race?.circuit?.name ?? '');
      const countryMatch = refCountry && raceCountry && refCountry === raceCountry;
      const circuitMatch = refCircuit && raceCircuit && refCircuit === raceCircuit;
      return countryMatch || circuitMatch;
    })
    .sort((a, b) => new Date(b?.date ?? 0).getTime() - new Date(a?.date ?? 0).getTime())[0];
};

const findWinnerNameFromRaceRanking = (rows = []) => {
  const ordered = [...rows]
    .map((row) => ({
      row,
      position: Number(row?.position ?? row?.rank ?? Number.MAX_SAFE_INTEGER),
    }))
    .filter((entry) => Number.isFinite(entry.position))
    .sort((a, b) => a.position - b.position);

  const winner = ordered[0]?.row;
  if (!winner) {
    return '';
  }
  const driver = winner.driver ?? winner.competitor ?? {};
  return String(driver.name ?? '').trim();
};

const buildApiJob = async ({
  template,
  apiKey,
  apiHost,
  competitionId,
  season,
  raceType,
  teamId,
  raceId,
  brandName,
  competitionName,
  labelOverride,
  contextSubtitle,
  soundtrackPath,
  soundtrackVolume,
  introTitle,
  introSubtitle,
  voiceoverText,
  outputName,
}) => {
  const competitionConfigs = await loadCompetitionPresets();
  const gpNameTranslations = await loadGpNameTranslations();
  const competitionConfig =
    competitionConfigs.find((item) => item.competitionId === competitionId) ?? competitionConfigs[0];
  const templateConfig = await loadTemplateConfig(template);
  const themeConfig = await loadThemeConfig(templateConfig.themeVariant);
  labelOverride = sanitizeF1LabelOverride(template, labelOverride);
  const racesPayload = await fetchJson(
    `https://${apiHost}/races?season=${season}`,
    apiKey,
    apiHost
  );
  const races = Array.isArray(racesPayload.response)
    ? racesPayload.response.filter((race) => {
        if (!competitionId || competitionId === 1) {
          return true;
        }

        return Number(race.competition?.id) === Number(competitionId);
      })
    : [];
  const selectedRaceType = String(raceType ?? '').trim();
  const effectiveSelectedRaceType =
    template === 'race-pace' || template === 'teammate-battle' || template === 'circuit-insights'
      ? 'Race'
      : selectedRaceType;
  const groupedWeekends = groupRaceWeekend(races);
  const latestBySelectedType =
    !raceId && effectiveSelectedRaceType
      ? pickLatestSessionByType(races, effectiveSelectedRaceType, {
          completedOnly:
            template === 'race-results' ||
            template === 'race-pace' ||
            template === 'teammate-battle' ||
            template === 'circuit-insights' ||
            template === 'qualifying-grid',
        })
      : null;
  const targetWeekend = raceId
    ? groupedWeekends.find((group) => group.some((race) => Number(race.id) === Number(raceId)))
    : latestBySelectedType
      ? groupedWeekends.find((group) =>
          group.some((race) => Number(race.id) === Number(latestBySelectedType.id))
        )
      : template === 'weekend-schedule' || template === 'circuit-insights'
      ? pickNextWeekend(races)
      : template === 'qualifying-grid'
        ? pickLatestCompletedQualifyingWeekend(races)
        : template === 'race-results' || template === 'race-pace' || template === 'teammate-battle'
          ? pickLatestCompletedRaceWeekend(races)
      : pickLatestCompletedWeekend(races);

  if (!targetWeekend || targetWeekend.length === 0) {
    throw new Error(`No Formula 1 race weekend found for season ${season}.`);
  }

  const referenceRace =
    raceId
      ? targetWeekend.find((race) => Number(race.id) === Number(raceId))
      : latestBySelectedType
        ? targetWeekend.find((race) => Number(race.id) === Number(latestBySelectedType.id))
      : template === 'qualifying-grid'
        ? latestMatchingSession(targetWeekend, /qualifying/i)
        : template === 'race-results' || template === 'race-pace' || template === 'teammate-battle'
          ? latestMatchingSession(targetWeekend, /^race$/i) ?? latestMatchingSession(targetWeekend, /race/i)
          : template === 'weekend-schedule' || template === 'circuit-insights'
            ? earliestMatchingSession(targetWeekend, /.*/) ?? targetWeekend[0]
            : targetWeekend[0];
  const meta = extractRaceMeta(
    targetWeekend,
    competitionConfig,
    season,
    referenceRace,
    gpNameTranslations
  );
  const common = {
    template,
    templateConfig,
    themeConfig,
    competitionConfig: {
      ...competitionConfig,
      label: competitionName?.trim() || competitionConfig.label,
    },
    season,
    brandName,
    soundtrackPath,
    soundtrackLabel:
      f1SoundtrackPresets.find((preset) => preset.value === soundtrackPath)?.label,
    soundtrackVolume,
    raceType: referenceRace?.type ? String(referenceRace.type) : undefined,
    raceId: meta.raceId,
    raceName: meta.raceName,
    countryCode: meta.countryCode,
    circuitName: meta.circuitName,
    brandLogoPath: pickBrandLogoPath(themeConfig.variant),
  };

  if (template === 'weekend-schedule') {
    const sessions = sortByPosition(
      targetWeekend.map((race, index) => ({
        position: index + 1,
        dayLabel: new Date(race.date ?? Date.now()).toLocaleDateString('pt-BR', {weekday: 'long'}),
        title: race.type ?? race.status ?? `Sessao ${index + 1}`,
        timeLabel: new Date(race.date ?? Date.now()).toLocaleTimeString('pt-BR', {
          hour: '2-digit',
          minute: '2-digit',
        }),
        subtitle: race.status ?? '',
      }))
    ).map(({dayLabel, title, timeLabel, subtitle}) => ({dayLabel, title, timeLabel, subtitle}));

    return {
      ...createBaseJob({
        ...common,
        title: 'Horarios da Formula 1',
        subtitle: labelOverride?.trim() || meta.raceName,
        outputName: outputName?.trim() || `${sanitize(meta.raceName)}-schedule-${season}.mp4`,
      }),
      sessions,
    };
  }

  if (template === 'circuit-insights') {
    const circuitPayload = meta.circuitName
      ? await fetchJson(
          `https://${apiHost}/circuits?search=${encodeURIComponent(meta.circuitName)}`,
          apiKey,
          apiHost
        ).catch(() => ({response: []}))
      : {response: []};
    const circuit = circuitPayload.response?.[0] ?? {};
    const rawCountryLabel =
      circuit?.competition?.location?.country ??
      referenceRace?.competition?.location?.country ??
      meta.countryCode ??
      'F1';
    const countryLabel = translatedCountryName(rawCountryLabel, gpNameTranslations);
    const cityLabel =
      circuit?.competition?.location?.city ??
      referenceRace?.competition?.location?.city ??
      'A definir';
    const lengthLabel = formatCircuitLength(circuit?.length);
    const lapsLabel = circuit?.laps ? String(circuit.laps) : 'N/D';
    let historicalNote = 'Histórico indisponível';
    const previousSeason = Number(season) - 1;
    if (previousSeason >= 1950) {
      const previousRacesPayload = await fetchJson(
        `https://${apiHost}/races?season=${previousSeason}`,
        apiKey,
        apiHost
      ).catch(() => ({response: []}));
      const previousRaces = Array.isArray(previousRacesPayload.response)
        ? previousRacesPayload.response.filter((race) => {
            if (!competitionId || Number(competitionId) === 1) {
              return true;
            }
            return Number(race.competition?.id) === Number(competitionId);
          })
        : [];
      const previousEquivalentRace = findEquivalentPreviousRace(previousRaces, referenceRace ?? {});
      if (previousEquivalentRace?.id) {
        const previousRankingPayload = await fetchJson(
          `https://${apiHost}/rankings/races?race=${previousEquivalentRace.id}`,
          apiKey,
          apiHost
        ).catch(() => ({response: []}));
        const previousRows = Array.isArray(previousRankingPayload.response)
          ? previousRankingPayload.response
          : [];
        const winnerName = findWinnerNameFromRaceRanking(previousRows);
        if (winnerName) {
          historicalNote = `Último vencedor: ${winnerName} (${previousSeason})`;
        }
      }
    }

    const trackImagePathFromApi =
      (await downloadAsset(
        extractCircuitImageUrl(circuit),
        f1CircuitImagesDir,
        `${meta.circuitName || meta.raceName}-track-${season}`
      )) ||
      (await downloadAsset(
        extractCircuitImageUrl(referenceRace?.circuit),
        f1CircuitImagesDir,
        `${meta.circuitName || meta.raceName}-track-${season}`
      ));
    const trackImagePath = trackImagePathFromApi;

    return {
      ...createBaseJob({
        ...common,
        title: meta.raceName,
        subtitle: labelOverride?.trim() || 'Guia do Circuito',
        raceType: 'Race',
        outputName: outputName?.trim() || `${sanitize(meta.raceName)}-circuit-insights-${season}.mp4`,
      }),
      keyPoints: [
        `${meta.circuitName || 'Circuito'} em ${cityLabel}, ${countryLabel}.`,
        `Traçado de ${lengthLabel} com ${lapsLabel} voltas na corrida.`,
        'Primeiro setor costuma premiar quem acerta bem a entrada de curva.',
        'Consistência ao longo da volta tende a decidir a classificação.',
      ],
      stats: [
        {label: 'Circuito', value: String(meta.circuitName ?? 'N/D')},
        {label: 'País', value: String(countryLabel)},
        {label: 'Cidade', value: String(cityLabel)},
        {label: 'Comprimento', value: String(lengthLabel)},
        {label: 'Voltas', value: String(lapsLabel)},
      ],
      historicalNote,
      trackImagePath,
    };
  }

  if (template === 'teammate-battle') {
    const referenceRaceSession =
      latestMatchingSession(targetWeekend, /^race$/i) ??
      latestMatchingSession(targetWeekend, /race/i) ??
      referenceRace;
    const teammateData = await buildTeammateBattleData({
      apiKey,
      apiHost,
      season,
      races,
      untilRaceId: referenceRaceSession?.id ?? raceId,
      selectedTeamId: teamId,
    });

    return {
      ...createBaseJob({
        ...common,
        title: meta.raceName,
        subtitle: labelOverride?.trim() || 'Head-to-Head de Equipe',
        raceType: 'Race',
        outputName:
          outputName?.trim() ||
          `${sanitize(meta.raceName)}-head-to-head-${sanitize(teammateData.teamName)}-${season}.mp4`,
        warnings: teammateData.warnings,
      }),
      ...teammateData,
      contextSubtitle:
        contextSubtitle?.trim() ||
        `Após o ${meta.raceName.replace(/^GP\s+/i, 'GP de ')}`,
    };
  }

  const rankingsEndpoint =
    template === 'qualifying-grid'
      ? 'startinggrid'
      : template === 'race-results' || template === 'race-pace'
        ? 'races'
        : template === 'driver-standings'
          ? 'drivers'
          : 'teams';

  const rankingPayload = await fetchJson(
    `https://${apiHost}/rankings/${rankingsEndpoint}?${
      template === 'driver-standings' || template === 'constructor-standings'
        ? `season=${season}`
        : `race=${meta.raceId}`
    }`,
    apiKey,
    apiHost
  );
  let rankingRows = Array.isArray(rankingPayload.response) ? rankingPayload.response : [];

  if (template === 'qualifying-grid') {
    const sessionByExactType = (type) =>
      targetWeekend.find(
        (race) => String(race.type ?? '').trim().toLowerCase() === type.toLowerCase()
      );
    const fetchRaceRankingRows = async (session) =>
      session?.id
        ? await fetchJson(`https://${apiHost}/rankings/races?race=${session.id}`, apiKey, apiHost)
          .then((payload) => (Array.isArray(payload.response) ? payload.response : []))
          .catch(() => [])
        : [];
    const referenceDetailRows = await fetchRaceRankingRows(referenceRace);

    if (rankingRows.length === 0) {
      const [q1Rows, q2Rows, q3Rows] = await Promise.all([
        fetchRaceRankingRows(sessionByExactType('1st Qualifying')),
        fetchRaceRankingRows(sessionByExactType('2nd Qualifying')),
        fetchRaceRankingRows(sessionByExactType('3rd Qualifying')),
      ]);
      const mergedQualifyingGrid = mergeQualifyingStagesIntoGrid({q1Rows, q2Rows, q3Rows});
      rankingRows = mergedQualifyingGrid.length > 0 ? mergedQualifyingGrid : referenceDetailRows;
    } else if (referenceDetailRows.length > 0) {
      const detailByDriverId = new Map(
        referenceDetailRows
          .map((row) => [Number(row?.driver?.id ?? row?.competitor?.id), row])
          .filter(([id]) => Number.isFinite(id))
      );

      rankingRows = rankingRows.map((row) => {
        const driverId = Number(row?.driver?.id ?? row?.competitor?.id);
        const detailRow = Number.isFinite(driverId) ? detailByDriverId.get(driverId) : undefined;

        if (!detailRow) {
          return row;
        }

        const rowTime =
          row.time ??
          row.best_lap_time ??
          row.bestLapTime ??
          row.best_lap ??
          row.bestLap ??
          row.q3 ??
          row.q2 ??
          row.q1;
        const detailTime =
          detailRow.time ??
          detailRow.best_lap_time ??
          detailRow.bestLapTime ??
          detailRow.best_lap ??
          detailRow.bestLap ??
          detailRow.q3 ??
          detailRow.q2 ??
          detailRow.q1;

        return {
          ...row,
          time: rowTime || detailTime || row.time || '',
          gap: row.gap || detailRow.gap || '',
        };
      });
    }
  }

  if (template === 'race-pace') {
    const paceEntries = await buildRacePaceEntries(rankingRows);
    if (paceEntries.length === 0) {
      throw new Error('No comparable race pace rows returned for race-pace.');
    }
    return {
      ...createBaseJob({
        ...common,
        title: 'Ritmo de Corrida',
        subtitle: labelOverride?.trim() || meta.raceName,
        raceType: 'Race',
        outputName:
          outputName?.trim() ||
          `${sanitize(meta.raceName)}-ritmo-de-corrida-${season}.mp4`,
      }),
      sessionCode: 'R',
      paceSummary: 'Média limpa da corrida',
      entries: paceEntries,
    };
  }

  const entries = sortByPosition(await normalizeRankingEntries(rankingRows, template));

  if (entries.length === 0) {
    throw new Error(`No live rows returned for F1 template ${template}.`);
  }

  if (template === 'race-results' || template === 'qualifying-grid') {
    const displayRaceName = labelOverride?.trim() || meta.raceName;
    const templateSubtitle =
      template === 'race-results' ? 'Resultado da Corrida' : 'Classificação de Largada';
    const podium = entries.slice(0, 3).map((entry) => ({
      position: entry.position,
      name: entry.name,
      team: entry.team ?? '',
      badge: entry.badge,
      stat: entry.secondaryValue || entry.value,
      accentColor: entry.accentColor,
    }));
    return {
      ...createBaseJob({
        ...common,
        title: displayRaceName,
        subtitle: templateSubtitle,
        raceName: displayRaceName,
        backgroundImagePath:
          template === 'race-results' ? pickResultsBackground(referenceRace?.type) : undefined,
        outputName:
          outputName?.trim() ||
          `${sanitize(meta.raceName)}-${template}-${season}.mp4`,
      }),
      podium,
      entries: template === 'race-results' ? entries.slice(3) : entries.slice(3),
    };
  }

  if (template === 'driver-standings') {
    return {
      ...createBaseJob({
        ...common,
        title: 'Mundial de Pilotos',
        subtitle: labelOverride?.trim() || `Formula 1 ${season}`,
        outputName: outputName?.trim() || `f1-driver-standings-${season}.mp4`,
      }),
      leader: entries[0]
        ? {
            position: entries[0].position,
            name: entries[0].name,
            team: entries[0].team ?? '',
            badge: entries[0].badge,
            stat: entries[0].value ? `${entries[0].value} pts` : undefined,
            accentColor: entries[0].accentColor,
          }
        : undefined,
      entries: entries.slice(0, 22),
    };
  }

  return {
    ...createBaseJob({
      ...common,
      title: 'Mundial de Construtores',
      subtitle: labelOverride?.trim() || `Formula 1 ${season}`,
      outputName: outputName?.trim() || `f1-constructor-standings-${season}.mp4`,
    }),
    leader: entries[0]
      ? {
          position: entries[0].position,
          name: entries[0].name,
          team: entries[0].name,
          badge: entries[0].badge,
          stat: entries[0].value ? `${entries[0].value} pts` : undefined,
          accentColor: entries[0].accentColor,
        }
      : undefined,
    entries: entries.slice(0, 10),
  };
};

export const f1Templates = async () => {
  const configs = await Promise.all(templateFileNames.map((fileName) =>
    readJsonFile(path.join(configRoot, 'templates', fileName))
  ));
  return configs;
};

export const loadCurrentF1Job = async () => {
  const raw = await fs.readFile(currentJobFile, 'utf8');
  return JSON.parse(raw);
};

export const loadCurrentF1TemplateJob = async (template) => {
  const raw = await fs.readFile(currentTemplateJobFile(template), 'utf8');
  return JSON.parse(raw);
};

export const loadF1RaceOptions = async ({
  apiKey,
  apiHost = 'v1.formula-1.api-sports.io',
  season,
  competitionId = 1,
  template = 'race-results',
  raceType = '',
}) => {
  if (!apiKey) {
    throw new Error('Missing Formula 1 API key.');
  }

  const gpNameTranslations = await loadGpNameTranslations();
  const racesPayload = await fetchJson(`https://${apiHost}/races?season=${season}`, apiKey, apiHost);
  const races = Array.isArray(racesPayload.response)
    ? racesPayload.response.filter((race) => {
        if (!competitionId || Number(competitionId) === 1) {
          return true;
        }
        return Number(race.competition?.id) === Number(competitionId);
      })
    : [];
  const selectedRaceType =
    template === 'race-pace' || template === 'teammate-battle' || template === 'circuit-insights'
      ? 'Race'
      : String(raceType ?? '').trim();

  return races
    .filter((race) => raceTypeMatches(race, selectedRaceType))
    .sort((a, b) => new Date(b.date ?? 0).getTime() - new Date(a.date ?? 0).getTime())
    .map((race) => ({
      id: Number(race.id),
      label: raceOptionLabel(race, gpNameTranslations),
      date: race.date,
      type: race.type ?? '',
      status: race.status ?? '',
    }));
};

export const loadF1TeamOptions = async ({
  apiKey,
  apiHost = 'v1.formula-1.api-sports.io',
  season,
  competitionId = 1,
}) => {
  if (!apiKey) {
    throw new Error('Missing Formula 1 API key.');
  }

  const standingsPayload = await fetchJson(
    `https://${apiHost}/rankings/drivers?season=${season}`,
    apiKey,
    apiHost
  );
  const standingsRows = Array.isArray(standingsPayload.response) ? standingsPayload.response : [];

  const teamMap = new Map();
  for (const row of standingsRows) {
    const team = extractRowTeam(row);
    const driver = extractRowDriver(row);
    if (!team.name || !driver.name) {
      continue;
    }
    const teamKey = team.id ? `id:${team.id}` : `name:${normalizeEntityName(team.name)}`;
    const entry = teamMap.get(teamKey) ?? {
      id: team.id || undefined,
      name: team.name,
      competitionId,
      drivers: new Map(),
    };
    const driverKey = driver.id ? `id:${driver.id}` : `name:${normalizeEntityName(driver.name)}`;
    if (!entry.drivers.has(driverKey)) {
      entry.drivers.set(driverKey, {
        code: driver.code || deriveSurnameCode(driver.name),
        name: driver.name,
      });
    }
    teamMap.set(teamKey, entry);
  }

  const teams = [...teamMap.values()]
    .map((team) => ({
      id: Number(team.id ?? 0),
      name: team.name,
      drivers: [...team.drivers.values()].slice(0, 2),
    }))
    .filter((team) => team.drivers.length >= 2)
    .sort((a, b) => a.name.localeCompare(b.name, 'en', {sensitivity: 'base'}));

  return {teams};
};

export const prepareF1Job = async ({
  template,
  apiKey,
  apiHost = 'v1.formula-1.api-sports.io',
  competitionId = 1,
  season,
  raceType,
  teamId,
  raceId,
  brandName,
  competitionName,
  labelOverride,
  contextSubtitle,
  introTitle,
  introSubtitle,
  voiceoverText,
  voiceoverEnabled = true,
  soundtrackPath,
  soundtrackVolume,
  outputName,
}) => {
  await ensureGeneratedDir();

  let job;
  let message = 'Current F1 job prepared. Refresh Remotion Studio to preview it.';
  let fallbackReason = null;

  try {
    if (!apiKey) {
      throw new Error('Missing Formula 1 API key.');
    }
    job = await buildApiJob({
      template,
      apiKey,
      apiHost,
      competitionId,
      season,
      raceType,
      teamId,
      raceId,
      brandName,
      competitionName,
      labelOverride,
      contextSubtitle,
      soundtrackPath,
      soundtrackVolume,
      introTitle,
      introSubtitle,
      voiceoverText,
      voiceoverEnabled,
      outputName,
    });
  } catch (error) {
    if (error instanceof F1PreparationError) {
      throw error;
    }
    const reason = error instanceof Error ? error.message : String(error);
    if (template === 'teammate-battle') {
      const cleanReason = summarizeFailureReason(reason);
      throw new F1PreparationError(
        'Não foi possível preparar o Head-to-Head para essa equipe/GP.',
        'team_data_missing',
        cleanReason
      );
    }
    fallbackReason = reason;
    job = await buildSampleJob({
      template,
      season,
      competitionId,
      competitionName,
      raceType,
      teamId,
      brandName,
      labelOverride,
      contextSubtitle,
      soundtrackPath,
      soundtrackVolume,
      introTitle,
      introSubtitle,
      voiceoverText,
      voiceoverEnabled,
      outputName,
      warning: `Fallback sample data used because real API data failed: ${reason}`,
    });
    message =
      'Current F1 job prepared with sample fallback data. Real API data could not be prepared for this selection.';
  }

  job = await addF1IntroAndVoiceover(job, {
    introTitle,
    introSubtitle,
    voiceoverText,
    voiceoverEnabled,
  });

  const templateJobFile = currentTemplateJobFile(template);
  await fs.writeFile(currentJobFile, `${JSON.stringify(job, null, 2)}\n`, 'utf8');
  await fs.writeFile(templateJobFile, `${JSON.stringify(job, null, 2)}\n`, 'utf8');
  return {job, files: {currentJobFile, templateJobFile}, message, fallbackReason};
};

export const getF1Options = async () => {
  const [templates, competitionPresets] = await Promise.all([f1Templates(), loadCompetitionPresets()]);
  const currentJob = await loadCurrentF1Job().catch(() => null);
  return {
    templates,
    competitionPresets,
    soundtrackPresets: f1SoundtrackPresets,
    currentJob,
    statusMessage:
      'Formula 1 workspace ready. If API-Sports data is unavailable, the dashboard will fall back to sample data.',
  };
};
