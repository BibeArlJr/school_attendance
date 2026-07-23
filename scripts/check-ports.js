#!/usr/bin/env node
// Pre-flight check for `npm run dev` — fail loudly if the ports this
// project's dev servers need are already occupied, instead of letting
// Vite silently move from 5173 to 5174 (which breaks CORS, since the
// backend's allowed_origins is fixed to 5173 — see config/cors.php) or
// `php artisan serve` fail mid-startup with a confusing "address already
// in use" error.

import { execFileSync } from 'node:child_process';

const PORTS = [
  { port: 5173, label: 'web (Vite)' },
  { port: 8000, label: 'api (php artisan serve)' },
];

function findProcessOnPort(port) {
  try {
    const output = execFileSync('lsof', ['-i', `:${port}`, '-sTCP:LISTEN', '-t'], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();

    if (!output) {
      return null;
    }

    const pid = output.split('\n')[0];
    let command = '';
    try {
      command = execFileSync('ps', ['-p', pid, '-o', 'comm='], {
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'ignore'],
      }).trim();
    } catch {
      // ps lookup is best-effort — the PID alone is still actionable.
    }

    return { pid, command };
  } catch {
    // lsof exits non-zero with no output when nothing matches the port,
    // and throws ENOENT if lsof itself isn't installed — both mean "no
    // confirmed conflict," not "there is one," so this stays silent.
    return null;
  }
}

let hasConflict = false;

for (const { port, label } of PORTS) {
  const holder = findProcessOnPort(port);
  if (holder) {
    hasConflict = true;
    console.error(`\n✖ Port ${port} (${label}) is already in use.`);
    console.error(`  Held by PID ${holder.pid}${holder.command ? ` (${holder.command})` : ''}.`);
  }
}

if (hasConflict) {
  console.error(
    '\nA second `npm run dev` (or some other process) is probably already running.\n' +
      'Stop it, or kill the process(es) above, then re-run `npm run dev`.\n' +
      'Run the one root-level `npm run dev` — not a separate one inside apps/web.\n',
  );
  process.exit(1);
}

console.log('✓ Ports 5173 and 8000 are free.');
