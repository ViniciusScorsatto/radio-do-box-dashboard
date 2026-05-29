import fs from 'node:fs/promises';
import http from 'node:http';
import path from 'node:path';
import {spawn} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {projectRoot} from './lib/video-system.mjs';
import {
  getF1Options,
  loadCurrentF1Job,
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

const prepareFormulaOneJob = async (body) =>
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
    introTitle: body.introTitle,
    introSubtitle: body.introSubtitle,
    voiceoverText: body.voiceoverText,
    voiceoverEnabled: parseBooleanField(body.voiceoverEnabled, true),
    soundtrackPath: body.soundtrackPath,
    soundtrackVolume: body.soundtrackVolume,
    outputName: normalizeVideoOutputName(body.outputName),
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
  });
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
