import fs from 'node:fs/promises';
import path from 'node:path';
import {spawn} from 'node:child_process';
import {projectRoot} from './lib/video-system.mjs';

const currentJobPath = path.join(projectRoot, 'src', 'data', 'generated', 'current-job.f1.json');
const raw = await fs.readFile(currentJobPath, 'utf8');
const job = JSON.parse(raw);

await fs.mkdir(path.join(projectRoot, 'out'), {recursive: true});

const npxCommand = process.platform === 'win32' ? 'npx.cmd' : 'npx';
const outputPath = path.join('out', job.outputName);
const absoluteOutputPath = path.join(projectRoot, outputPath);

const runProcess = (command, args) =>
  new Promise((resolve, reject) => {
    const child = spawn(command, args, {cwd: projectRoot});
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
        resolve({stdout, stderr});
        return;
      }

      reject(new Error(stderr || stdout || `${command} failed with exit code ${code}`));
    });
  });

const getMp4VideoDuration = async (filePath) => {
  const {stdout} = await runProcess('ffprobe', [
    '-v',
    'error',
    '-select_streams',
    'v:0',
    '-show_entries',
    'stream=duration',
    '-of',
    'default=noprint_wrappers=1:nokey=1',
    filePath,
  ]);
  const duration = Number(stdout.trim());
  if (!Number.isFinite(duration) || duration <= 0) {
    throw new Error(`Could not read video duration for ${path.basename(filePath)}.`);
  }

  return duration;
};

const trimMp4ToVideoDuration = async (filePath) => {
  const videoDuration = await getMp4VideoDuration(filePath);
  const tempPath = `${filePath}.trimmed.mp4`;

  await runProcess('ffmpeg', [
    '-hide_banner',
    '-loglevel',
    'error',
    '-y',
    '-i',
    filePath,
    '-t',
    videoDuration.toFixed(3),
    '-map',
    '0',
    '-c',
    'copy',
    '-movflags',
    '+faststart',
    tempPath,
  ]);

  await fs.rename(tempPath, filePath);
};

const sampleMp4LastFrame = (filePath) =>
  new Promise((resolve, reject) => {
    const child = spawn(
      'ffmpeg',
      [
        '-hide_banner',
        '-loglevel',
        'error',
        '-sseof',
        '-0.25',
        '-i',
        filePath,
        '-frames:v',
        '1',
        '-vf',
        'scale=32:32,format=rgb24',
        '-f',
        'rawvideo',
        'pipe:1',
      ],
      {cwd: projectRoot}
    );

    const chunks = [];
    let stderr = '';

    child.stdout.on('data', (chunk) => chunks.push(chunk));
    child.stderr.on('data', (chunk) => {
      stderr += chunk.toString();
    });

    child.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(stderr || `Could not inspect final frame with ffmpeg (${code}).`));
        return;
      }

      const buffer = Buffer.concat(chunks);
      if (buffer.length === 0) {
        reject(new Error('Could not inspect final frame: ffmpeg returned no pixels.'));
        return;
      }

      let total = 0;
      let litChannels = 0;
      for (const value of buffer) {
        total += value;
        if (value > 12) {
          litChannels += 1;
        }
      }

      resolve({
        averageBrightness: Number((total / buffer.length).toFixed(2)),
        litPixelRatio: Number((litChannels / buffer.length).toFixed(4)),
      });
    });
  });

const validateMp4LastFrameNotBlack = async (filePath) => {
  const sample = await sampleMp4LastFrame(filePath);
  if (sample.averageBrightness <= 3 && sample.litPixelRatio <= 0.005) {
    throw new Error(`Render blocked: the last frame appears to be black (${path.basename(filePath)}).`);
  }

  console.log(
    `[render] Last frame OK: brightness=${sample.averageBrightness}, lit=${sample.litPixelRatio}`
  );
};

const child = spawn(npxCommand, ['remotion', 'render', 'src/index.ts', job.compositionId, outputPath], {
  cwd: projectRoot,
  env: process.env,
  stdio: 'inherit',
});

child.on('close', async (code) => {
  if (code !== 0) {
    process.exit(code ?? 1);
    return;
  }

  try {
    await trimMp4ToVideoDuration(absoluteOutputPath);
    await validateMp4LastFrameNotBlack(absoluteOutputPath);
    process.exit(0);
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
});
