import { spawn } from 'node:child_process';

const processes = [];
let shuttingDown = false;

const startProcess = (name, command, args) => {
  const child = spawn(command, args, {
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

startProcess('dashboard', process.execPath, ['--env-file=.env', 'scripts/dashboard-server.mjs']);
startProcess('remotion studio', 'npx', ['remotion', 'studio']);
