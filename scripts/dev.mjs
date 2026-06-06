import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const processes = [];
let shuttingDown = false;
const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const localRemotionBin = path.join(
  projectRoot,
  'node_modules',
  '.bin',
  process.platform === 'win32' ? 'remotion.cmd' : 'remotion'
);

const startProcess = (name, command, args) => {
  const child = spawn(command, args, {
    cwd: projectRoot,
    env: process.env,
    stdio: 'inherit',
  });

  processes.push({ name, child });

  child.on('exit', (code, signal) => {
    if (shuttingDown) {
      return;
    }

    const detail = signal ? `signal ${signal}` : `code ${code}`;
    console.error(`[dev] ${name} exited with ${detail}. Shutting down remaining processes.`);
    shutdown(code ?? 1);
  });

  child.on('error', (error) => {
    if (shuttingDown) {
      return;
    }

    console.error(`[dev] Failed to start ${name}: ${error.message}`);
    shutdown(1);
  });
};

const shutdown = (exitCode = 0) => {
  if (shuttingDown) {
    return;
  }

  shuttingDown = true;

  for (const { child } of processes) {
    if (!child.killed) {
      child.kill('SIGTERM');
    }
  }

  setTimeout(() => {
    process.exit(exitCode);
  }, 300);
};

process.on('SIGINT', () => shutdown(0));
process.on('SIGTERM', () => shutdown(0));

console.log('[dev] Starting dashboard at http://127.0.0.1:4321');
console.log('[dev] Starting Remotion Studio');

if (!fs.existsSync(localRemotionBin)) {
  console.error('[dev] Remotion CLI not found in node_modules. Run npm install, then npm run dev again.');
  process.exit(1);
}

startProcess('dashboard', process.execPath, ['--env-file=.env', 'scripts/dashboard-server.mjs']);
startProcess('remotion studio', localRemotionBin, ['studio', 'src/index.ts']);
