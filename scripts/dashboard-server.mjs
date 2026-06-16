import fs from 'node:fs/promises';
import http from 'node:http';
import path from 'node:path';
import {spawn} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {projectRoot} from './lib/video-system.mjs';
import {
  getF1Options,
  loadCurrentF1Job,
  loadF1DriverOptions,
  loadF1RaceOptions,
  loadF1TeamOptions,
  prepareF1Job,
} from './lib/f1-system.mjs';

const dashboardDir = path.join(projectRoot, 'dashboard');
const outDir = path.join(projectRoot, 'out');
const port = Number(process.env.DASHBOARD_PORT ?? '4321');
const host = process.env.DASHBOARD_HOST ?? '127.0.0.1';

const contentTypes = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.mp4': 'video/mp4',
};

const sendJson = (response, statusCode, data) => {
  response.writeHead(statusCode, {'content-type': 'application/json; charset=utf-8'});
  response.end(JSON.stringify(data));
};

const notFound = (response, message = 'Not found') => {
  response.writeHead(404);
  response.end(message);
};

const readBody = async (request) => {
  const chunks = [];
  for await (const chunk of request) {
    chunks.push(chunk);
  }

  const raw = Buffer.concat(chunks).toString('utf8');
  return raw ? JSON.parse(raw) : {};
};

const parseBooleanField = (value, defaultValue = true) => {
  if (value === undefined || value === null || value === '') {
    return defaultValue;
  }

  if (typeof value === 'boolean') {
    return value;
  }

  return !['false', '0', 'off', 'no'].includes(String(value).toLowerCase());
};

const serveStatic = async (response, filePath) => {
  try {
    const ext = path.extname(filePath);
    const body = await fs.readFile(filePath);
    response.writeHead(200, {'content-type': contentTypes[ext] ?? 'application/octet-stream'});
    response.end(body);
  } catch {
    notFound(response);
  }
};

const sendF1Options = async (response) => {
  const options = await getF1Options();
  sendJson(response, 200, options);
};

const sendF1RaceOptions = async (response, url) => {
  try {
    const parsedSeason = Number(url.searchParams.get('season'));
    const season = Number.isFinite(parsedSeason) && parsedSeason > 0
      ? parsedSeason
      : new Date().getFullYear();
    const competitionId = Number(url.searchParams.get('competitionId') ?? '1');
    const template = url.searchParams.get('template') ?? 'race-results';
    const raceType = url.searchParams.get('raceType') ?? '';
    const races = await loadF1RaceOptions({
      apiKey: process.env.F1_API_KEY,
      apiHost: process.env.F1_API_HOST ?? 'v1.formula-1.api-sports.io',
      season,
      competitionId,
      template,
      raceType,
    });
    sendJson(response, 200, {
      ok: true,
      races,
    });
  } catch (error) {
    sendJson(response, 500, {
      ok: false,
      error: error instanceof Error ? error.message : String(error),
      races: [],
    });
  }
};

const sendF1TeamOptions = async (response, url) => {
  try {
    const parsedSeason = Number(url.searchParams.get('season'));
    const season = Number.isFinite(parsedSeason) && parsedSeason > 0
      ? parsedSeason
      : new Date().getFullYear();
    const competitionId = Number(url.searchParams.get('competitionId') ?? '1');
    const options = await loadF1TeamOptions({
      apiKey: process.env.F1_API_KEY,
      apiHost: process.env.F1_API_HOST ?? 'v1.formula-1.api-sports.io',
      season,
      competitionId,
    });
    sendJson(response, 200, {
      ok: true,
      ...options,
    });
  } catch (error) {
    sendJson(response, 500, {
      ok: false,
      error: error instanceof Error ? error.message : String(error),
      teams: [],
    });
  }
};

const sendF1DriverOptions = async (response, url) => {
  const parsedSeason = Number(url.searchParams.get('season'));
  const season = Number.isFinite(parsedSeason) && parsedSeason > 0
    ? parsedSeason
    : new Date().getFullYear();
  const competitionId = Number(url.searchParams.get('competitionId') ?? '1');
  const options = await loadF1DriverOptions({
    apiKey: process.env.F1_API_KEY,
    apiHost: process.env.F1_API_HOST ?? 'v1.formula-1.api-sports.io',
    season,
    competitionId,
  });
  sendJson(response, 200, {
    ok: true,
    ...options,
  });
};

const normalizeVideoOutputName = (outputName) => {
  const requestedName = String(outputName ?? '').trim();
  if (!requestedName) {
    return '';
  }

  if (/\.(mp4|mkv|mov)$/i.test(requestedName)) {
    return requestedName;
  }

  const extension = path.extname(requestedName);
  return extension
    ? `${requestedName.slice(0, -extension.length)}.mp4`
    : `${requestedName}.mp4`;
};

const prepareFormulaOneJob = async (body, {normalizeOutputName = normalizeVideoOutputName} = {}) =>
  prepareF1Job({
    template: body.template,
    apiKey: process.env.F1_API_KEY,
    apiHost: process.env.F1_API_HOST ?? 'v1.formula-1.api-sports.io',
    competitionId: Number(body.competitionId ?? '1'),
    season: Number(body.season),
    raceType: body.raceType,
    teamId: body.teamId ? Number(body.teamId) : undefined,
    raceId: body.raceId ? Number(body.raceId) : undefined,
    brandName: body.brandName,
    competitionName: body.competitionName,
    labelOverride: body.labelOverride,
    contextSubtitle: body.contextSubtitle,
    predictionAuthor: body.predictionAuthor,
    predictionType: body.predictionType,
    predictionDrivers: Array.from({length: 10}, (_, index) =>
      body[`predictionDriver${index + 1}`]
    ),
    introTitle: body.introTitle,
    introSubtitle: body.introSubtitle,
    voiceoverText: body.voiceoverText,
    voiceoverEnabled: parseBooleanField(body.voiceoverEnabled, true),
    soundtrackPath: body.soundtrackPath,
    soundtrackVolume: body.soundtrackVolume,
    outputName: normalizeOutputName(body.outputName),
  });

const largeStillDefaultNameByTemplate = {
  'race-results': 'f1-large-race-results',
  'driver-standings': 'f1-large-driver-standings',
  'constructor-standings': 'f1-large-constructor-standings',
};

const normalizeLargeStillOutputName = ({template, season, outputName}) => {
  const requestedName = String(outputName ?? '').trim();
  const baseName =
    requestedName ||
    `${largeStillDefaultNameByTemplate[template] ?? 'f1-large-still'}-${season || new Date().getFullYear()}`;

  return baseName.toLowerCase().endsWith('.png') ? baseName : `${baseName}.png`;
};

const prepareFormulaOneLargeStillJob = async (body) => {
  const template = body.template;
  if (!['race-results', 'driver-standings', 'constructor-standings'].includes(template)) {
    throw new Error('F1 large stills support race results, driver standings, and constructor standings only.');
  }

  return prepareFormulaOneJob({
    ...body,
    outputName: normalizeLargeStillOutputName({
      template,
      season: Number(body.season),
      outputName: body.outputName,
    }),
  }, {
    normalizeOutputName: (outputName) => outputName,
  });
};

const RADIO_DO_BOX_CONTENT_SYSTEM = `RADIO DO BOX - CONTENT GENERATION SYSTEM

Objective:
Generate YouTube Shorts metadata that maximizes swipe-through rate, retention, satisfaction, comments, and subscriber conversion.

Channel position:
The channel is not an F1 news channel. It explains what changed, why it matters, who gained momentum, who lost momentum, and what happens next.

Core principle:
Never describe the race. Always describe the consequences.
Bad: corrida emocionante, muitas ultrapassagens, grande vitoria.
Good: Antonelli abre vantagem no campeonato, Norris volta para a disputa, Ferrari perde terreno para a Mercedes, Verstappen ja esta pressionado?

Every video must define primaryAudience.

Story score:
Major teams: Mercedes +5, Ferrari +5, McLaren +5, Red Bull +5, Williams +3, Audi +3, Alpine +3.
Major stakes: Championship Lead +5, Championship Battle +5, Constructors Battle +4, Pole Position +3, Podium +3, Penalty +4, Crash +4, Upgrade Package +4, Strategy Failure +4, Title Momentum +5, Rookie Performance +4.
Prioritize the highest-scoring story.

Hook rules:
The first frame must create curiosity immediately. Prefer questions, consequences, risks, championship implications, and momentum shifts.

Video structure:
0-1s hook. 1-3s main fact. 3-6s supporting evidence. 6-9s consequence. 9-12s question.

Story frameworks:
Championship story: hook, fact, evidence, consequence, question.
Team story: hook, fact, evidence, consequence, question.
Driver story: hook, fact, evidence, consequence, question.
Strategy story: hook, fact, evidence, consequence, question.

Title rules:
Every title must contain driver or team, consequence, and championship context when relevant.
Preferred examples: Antonelli dispara no campeonato! Mercedes abre vantagem! Norris volta para a briga! Ferrari perde terreno! Verstappen pressionado? McLaren reage na disputa!
Avoid vague race descriptions unless paired with a clear consequence.

Golden title rules:
1. Cut vague words and name the actual thing.
2. Do not make the title only about the creator; name who it is for when relevant.
3. Drop broad category-killer words; use specific segment language so the video does not compete with major channels on broad terms.

Description rules:
Structure:
[Main consequence]

• Principal estatistica
• Principal impacto
• Principal rival afetado

[Question]

#Shorts #Formula1 #F1

Driver-focused rule:
When the story is about a driver, make the driver the center of the narrative, especially for standings, wins, poles, fastest laps, rookie performances, and driver comparisons.

Comment triggers:
Always ask a specific consequence question, such as: Antonelli ja e favorito? Quem leva o campeonato? Norris ainda alcanca? Russell reage? Verstappen volta para a disputa? Quem termina na frente?
Never ask: O que achou? Gostou do video? Comente abaixo.

Radio do Box formula:
Hook, statistic, consequence, question.`;

const extractOpenAiText = (data) => {
  if (typeof data?.output_text === 'string') {
    return data.output_text;
  }

  const parts = [];
  for (const item of data?.output ?? []) {
    for (const content of item?.content ?? []) {
      if (typeof content?.text === 'string') {
        parts.push(content.text);
      }
    }
  }
  return parts.join('\n').trim();
};

const parseGeneratedContentJson = (rawText) => {
  const trimmed = String(rawText ?? '').trim();
  if (!trimmed) {
    throw new Error('OpenAI returned an empty content response.');
  }

  try {
    return JSON.parse(trimmed);
  } catch {
    const match = trimmed.match(/\{[\s\S]*\}/);
    if (!match) {
      throw new Error('OpenAI response was not valid JSON.');
    }
    return JSON.parse(match[0]);
  }
};

const normalizeGeneratedYoutubeContent = (content) => {
  const title = String(
    content?.title ?? (Array.isArray(content?.titles) ? content.titles[0] : '')
  ).trim();
  const description = String(content?.description ?? '').trim();
  const tiktokDescription = String(content?.tiktokDescription ?? '').trim();
  const instagramDescription = String(content?.instagramDescription ?? '').trim();
  const tags = Array.isArray(content?.tags)
    ? content.tags.map((tag) => String(tag ?? '').trim()).filter(Boolean)
    : String(content?.tags ?? '')
      .split(',')
      .map((tag) => tag.trim())
      .filter(Boolean);

  if (!title || !description || !tiktokDescription || !instagramDescription || tags.length === 0) {
    throw new Error('OpenAI response missed title, descriptions, or tags.');
  }

  const youtubeHashtagCount = description.match(/#[\p{L}\p{N}_]+/gu)?.length ?? 0;
  const tiktokHashtagCount = tiktokDescription.match(/#[\p{L}\p{N}_]+/gu)?.length ?? 0;
  const instagramHashtagCount = instagramDescription.match(/#[\p{L}\p{N}_]+/gu)?.length ?? 0;

  if (youtubeHashtagCount !== 3 || tiktokHashtagCount !== 5 || instagramHashtagCount !== 5) {
    throw new Error('OpenAI response did not include the required hashtag counts.');
  }

  return {
    primaryAudience: String(content?.primaryAudience ?? '').trim(),
    storyScore: Number.isFinite(Number(content?.storyScore)) ? Number(content.storyScore) : null,
    storyAngle: String(content?.storyAngle ?? '').trim(),
    title,
    description,
    tiktokDescription,
    instagramDescription,
    tags,
  };
};

const compactEntry = (entry) => ({
  position: entry?.position ?? null,
  name: entry?.name ?? '',
  team: entry?.team || entry?.badge?.sublabel || '',
  value: entry?.value ?? entry?.stat ?? '',
  secondaryValue: entry?.secondaryValue ?? '',
});

const compactEntries = (entries, limit = 8) =>
  Array.isArray(entries) ? entries.slice(0, limit).map(compactEntry) : [];

const inferPrimaryAudienceFromJob = (job) => {
  const leaderName = job?.leader?.name;
  const leaderTeam = job?.leader?.team || job?.leader?.badge?.sublabel;
  const winner = job?.podium?.[0];
  const winnerTeam = winner?.team || winner?.badge?.sublabel;

  if (job?.template === 'driver-standings' && leaderName) {
    return `fas de ${leaderName} e publico da briga pelo campeonato`;
  }
  if (job?.template === 'constructor-standings' && leaderName) {
    return `fas da ${leaderName} e publico da disputa de construtores`;
  }
  if (job?.template === 'race-results' && winner?.name) {
    return `fas de ${winner.name}, ${winnerTeam || 'Formula 1'} e publico da briga pelo campeonato`;
  }
  if (job?.template === 'qualifying-grid' && job?.podium?.[0]?.name) {
    return `fas de ${job.podium[0].name} e publico interessado no grid de largada`;
  }
  if (job?.template === 'teammate-battle' && job?.teamName) {
    return `fas da ${job.teamName} e publico de comparacao entre companheiros`;
  }
  if (leaderTeam) {
    return `fas da ${leaderTeam} e publico casual de Formula 1`;
  }
  return 'publico casual de Formula 1 no Brasil';
};

const buildAutomaticStoryBrief = (job) => {
  const parts = [
    `Template: ${job.templateConfig?.label || job.subtitle || job.template}.`,
    `Video: ${job.title || ''} - ${job.subtitle || ''}.`,
    `Temporada: ${job.season}.`,
  ];

  if (job.raceName) {
    parts.push(`Contexto: ${job.raceName}${job.circuitName ? ` no ${job.circuitName}` : ''}.`);
  }
  if (job.voiceoverText) {
    parts.push(`Narração planejada: ${job.voiceoverText}`);
  }
  if (job.leader) {
    parts.push(`Lider/destaque: ${job.leader.name}${job.leader.team ? ` (${job.leader.team})` : ''} com ${job.leader.stat || job.leader.value || 'vantagem no material'}.`);
  }
  if (Array.isArray(job.podium) && job.podium.length > 0) {
    const podium = job.podium
      .map((entry) => `P${entry.position} ${entry.name}${entry.team ? ` (${entry.team})` : ''}${entry.stat ? ` - ${entry.stat}` : ''}`)
      .join('; ');
    parts.push(`Podio/topo: ${podium}.`);
  }
  if (Array.isArray(job.entries) && job.entries.length > 0) {
    const entries = job.entries
      .slice(0, 8)
      .map((entry) => `P${entry.position} ${entry.name}${entry.team ? ` (${entry.team})` : ''}${entry.value ? ` - ${entry.value}` : ''}${entry.secondaryValue ? ` / ${entry.secondaryValue}` : ''}`)
      .join('; ');
    parts.push(`Lista principal: ${entries}.`);
  }
  if (Array.isArray(job.stats) && job.stats.length > 0) {
    parts.push(`Stats do template: ${job.stats.map((stat) => `${stat.label || stat.name}: ${stat.value}`).join('; ')}.`);
  }
  if (Array.isArray(job.keyPoints) && job.keyPoints.length > 0) {
    parts.push(`Pontos-chave: ${job.keyPoints.join('; ')}.`);
  }
  if (Array.isArray(job.sessions) && job.sessions.length > 0) {
    parts.push(`Agenda: ${job.sessions.map((session) => `${session.label || session.name}: ${session.dateLabel || session.timeLabel || session.value || ''}`).join('; ')}.`);
  }

  return parts.filter(Boolean).join('\n');
};

const buildYoutubeJobContext = (job) => ({
  sport: job.sport,
  template: job.template,
  templateLabel: job.templateConfig?.label || job.subtitle,
  compositionId: job.compositionId,
  title: job.title,
  subtitle: job.subtitle,
  season: job.season,
  raceName: job.raceName,
  raceType: job.raceType,
  circuitName: job.circuitName,
  competitionName: job.competitionName,
  dataSource: job.dataSource,
  voiceoverText: job.voiceoverText,
  leader: job.leader ? compactEntry(job.leader) : null,
  podium: compactEntries(job.podium, 3),
  entries: compactEntries(job.entries, 10),
  stats: Array.isArray(job.stats) ? job.stats.slice(0, 8) : [],
  keyPoints: Array.isArray(job.keyPoints) ? job.keyPoints.slice(0, 8) : [],
  sessions: Array.isArray(job.sessions) ? job.sessions.slice(0, 8) : [],
});

const generateF1YoutubeContent = async (body) => {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('Configure OPENAI_API_KEY in .env to generate YouTube Shorts metadata.');
  }

  const currentJob = await loadCurrentF1Job().catch(() => null);
  if (!currentJob) {
    throw new Error('Prepare um job de video antes de gerar titulo, descricao e tags.');
  }

  const audienceHint = String(body.audienceHint ?? '').trim();
  const editorialHint = String(body.editorialHint ?? '').trim();
  const primaryAudience = audienceHint || inferPrimaryAudienceFromJob(currentJob);
  const storyBrief = buildAutomaticStoryBrief(currentJob);
  const model = process.env.OPENAI_MODEL?.trim();
  if (!model) {
    throw new Error('Configure OPENAI_MODEL in .env to choose the OpenAI model used by the dashboard.');
  }
  const input = {
    primaryAudience,
    storyBrief,
    editorialHint: editorialHint || null,
    currentJob: buildYoutubeJobContext(currentJob),
    dashboardContext: body.dashboardContext ?? {},
    outputLanguage: 'pt-BR',
    requiredJsonShape: {
      primaryAudience: 'string',
      storyScore: 'number',
      storyAngle: 'string',
      title: 'the single best YouTube Shorts title in pt-BR',
      description: 'YouTube description following the provided structure and ending with exactly 3 hashtags, each including #',
      tiktokDescription: 'TikTok description in pt-BR ending with exactly 5 hashtags, each including #',
      instagramDescription: 'Instagram Reels description in pt-BR ending with exactly 5 hashtags, each including #',
      tags: ['12 to 18 YouTube tags, no hashtag symbol'],
    },
  };

  const openAiResponse = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: {
      authorization: `Bearer ${apiKey}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model,
      instructions: `${RADIO_DO_BOX_CONTENT_SYSTEM}

Use currentJob and storyBrief as the source of truth. If editorialHint exists, use it only as a direction, never as a replacement for the job data. Infer the strongest consequence from the template and API data. Return only valid JSON with one title, one YouTube description, one TikTok description, one Instagram description, and YouTube tags. Do not wrap the JSON in markdown. The title must be the best single option: specific, consequence-led, and avoid broad category-killer wording. The YouTube description must be ready to paste and end with exactly 3 relevant hashtags, every hashtag including the # symbol. TikTok and Instagram descriptions must be ready to paste and must end with exactly 5 relevant hashtags each, every hashtag including the # symbol.`,
      input: [
        {
          role: 'user',
          content: [
            {
              type: 'input_text',
              text: JSON.stringify(input, null, 2),
            },
          ],
        },
      ],
      max_output_tokens: 1400,
    }),
  });

  const data = await openAiResponse.json().catch(() => null);
  if (!openAiResponse.ok) {
    throw new Error(data?.error?.message || 'OpenAI API request failed.');
  }

  return {
    model,
    content: normalizeGeneratedYoutubeContent(parseGeneratedContentJson(extractOpenAiText(data))),
  };
};

const runRender = async (compositionId, outputName) => {
  const outputPath = path.join('out', outputName);
  const npxCommand = process.platform === 'win32' ? 'npx.cmd' : 'npx';

  await fs.mkdir(path.join(projectRoot, 'out'), {recursive: true});

  return new Promise((resolve, reject) => {
    const child = spawn(
      npxCommand,
      ['remotion', 'render', 'src/index.ts', compositionId, outputPath],
      {
        cwd: projectRoot,
        env: process.env,
      }
    );

    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (chunk) => {
      stdout += chunk.toString();
    });

    child.stderr.on('data', (chunk) => {
      stderr += chunk.toString();
    });

    child.on('close', (code) => {
      if (code === 0) {
        resolve({
          outputPath,
          stdout,
          stderr,
        });
        return;
      }

      reject(new Error(stderr || stdout || `Render failed with exit code ${code}`));
    });
  });
};

const runStill = async (compositionId, outputName) => {
  const outputPath = path.join('out', outputName);
  const npxCommand = process.platform === 'win32' ? 'npx.cmd' : 'npx';

  await fs.mkdir(path.join(projectRoot, 'out'), {recursive: true});

  return new Promise((resolve, reject) => {
    const child = spawn(
      npxCommand,
      ['remotion', 'still', 'src/index.ts', compositionId, outputPath],
      {
        cwd: projectRoot,
        env: process.env,
      }
    );

    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (chunk) => {
      stdout += chunk.toString();
    });

    child.stderr.on('data', (chunk) => {
      stderr += chunk.toString();
    });

    child.on('close', (code) => {
      if (code === 0) {
        resolve({
          outputPath,
          stdout,
          stderr,
        });
        return;
      }

      reject(new Error(stderr || stdout || `Still render failed with exit code ${code}`));
    });
  });
};

const server = http.createServer(async (request, response) => {
  if (!request.url) {
    response.writeHead(400);
    response.end('Missing URL');
    return;
  }

  const url = new URL(request.url, `http://localhost:${port}`);


  if (request.method === 'GET' && url.pathname === '/api/f1/options') {
    await sendF1Options(response);
    return;
  }

  if (request.method === 'GET' && url.pathname === '/api/f1/races') {
    await sendF1RaceOptions(response, url);
    return;
  }

  if (request.method === 'GET' && url.pathname === '/api/f1/teams') {
    await sendF1TeamOptions(response, url);
    return;
  }

  if (request.method === 'GET' && url.pathname === '/api/f1/drivers') {
    await sendF1DriverOptions(response, url);
    return;
  }

  if (request.method === 'POST' && url.pathname === '/api/f1/youtube-content') {
    try {
      const body = await readBody(request);
      const result = await generateF1YoutubeContent(body);

      sendJson(response, 200, {
        ok: true,
        ...result,
      });
    } catch (error) {
      sendJson(response, 500, {
        ok: false,
        error: error instanceof Error ? error.message : String(error),
      });
    }
    return;
  }


  if (request.method === 'POST' && url.pathname === '/api/f1/jobs/prepare') {
    try {
      const body = await readBody(request);
      const result = await prepareFormulaOneJob(body);

      sendJson(response, 200, {
        ok: true,
        message: result.message,
        job: result.job,
        fallbackReason: result.fallbackReason,
      });
    } catch (error) {
      sendJson(response, 500, {
        ok: false,
        error: error instanceof Error ? error.message : String(error),
        errorType: error?.errorType ?? undefined,
        errorDetails: error?.details ?? undefined,
      });
    }
    return;
  }

  if (request.method === 'POST' && url.pathname === '/api/f1/jobs/render') {
    try {
      const body = await readBody(request);
      const result = await prepareFormulaOneJob(body);
      const renderResult = await runRender(result.job.compositionId, result.job.outputName);

      sendJson(response, 200, {
        ok: true,
        message: result.message,
        job: result.job,
        render: renderResult,
        fallbackReason: result.fallbackReason,
      });
    } catch (error) {
      sendJson(response, 500, {
        ok: false,
        error: error instanceof Error ? error.message : String(error),
        errorType: error?.errorType ?? undefined,
        errorDetails: error?.details ?? undefined,
      });
    }
    return;
  }

  if (request.method === 'POST' && url.pathname === '/api/f1/large-stills/render') {
    try {
      const body = await readBody(request);
      const result = await prepareFormulaOneLargeStillJob(body);
      const renderResult = await runStill('F1LargeVideos', result.job.outputName);

      sendJson(response, 200, {
        ok: true,
        message: 'Large still rendered successfully.',
        job: result.job,
        render: renderResult,
        fallbackReason: result.fallbackReason,
      });
    } catch (error) {
      sendJson(response, 500, {
        ok: false,
        error: error instanceof Error ? error.message : String(error),
        errorType: error?.errorType ?? undefined,
        errorDetails: error?.details ?? undefined,
      });
    }
    return;
  }

  if (request.method === 'GET' && url.pathname === '/api/f1/jobs/current') {
    const currentJob = await loadCurrentF1Job().catch(() => null);
    sendJson(response, 200, {
      currentJob,
    });
    return;
  }

  if (request.method === 'GET' && url.pathname.startsWith('/out/')) {
    const relativePath = decodeURIComponent(url.pathname.replace(/^\/out\//, ''));
    const filePath = path.resolve(outDir, relativePath);
    if (!filePath.startsWith(`${outDir}${path.sep}`)) {
      notFound(response);
      return;
    }
    await serveStatic(response, filePath);
    return;
  }

  let filePath = '';
  if (url.pathname === '/') {
    filePath = path.join(dashboardDir, 'index.html');
  } else if (url.pathname === '/f1' || url.pathname === '/f1/') {
    filePath = path.join(dashboardDir, 'f1', 'index.html');
  } else if (url.pathname === '/f1-large-videos' || url.pathname === '/f1-large-videos/') {
    filePath = path.join(dashboardDir, 'f1-large-videos', 'index.html');
  } else {
    filePath = path.join(dashboardDir, url.pathname);
  }

  await serveStatic(response, filePath);
});

server.listen(port, host, () => {
  console.log(`Radio do Box dashboard running at http://${host}:${port}`);
});
