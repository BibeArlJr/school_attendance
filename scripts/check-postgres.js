#!/usr/bin/env node
// Pre-flight check for `npm run dev` — fail loudly and clearly if
// PostgreSQL isn't reachable, instead of letting the API silently hang or
// fail downstream with a confusing connection-refused error once it tries
// to migrate/query.

import { execFileSync } from 'node:child_process';

// Plain `pg_isready` covers anyone with the Postgres client tools already
// on PATH (Linux apt installs, most CI images). The Homebrew paths are a
// fallback for the common macOS setup this project's README documents,
// where postgresql@16 is keg-only and not linked onto the default PATH.
const CANDIDATES = [
  'pg_isready',
  '/opt/homebrew/opt/postgresql@16/bin/pg_isready',
  '/opt/homebrew/bin/pg_isready',
  '/usr/local/opt/postgresql@16/bin/pg_isready',
  '/usr/local/bin/pg_isready',
];

function tryCandidate(cmd) {
  try {
    execFileSync(cmd, ['-q'], { stdio: 'ignore' });
    return 'ready';
  } catch (err) {
    return err.code === 'ENOENT' ? 'missing' : 'not-ready';
  }
}

let foundBinary = false;

for (const cmd of CANDIDATES) {
  const result = tryCandidate(cmd);
  if (result === 'ready') {
    console.log('✓ PostgreSQL is reachable.');
    process.exit(0);
  }
  if (result === 'not-ready') {
    foundBinary = true;
  }
}

console.error('\n✖ PostgreSQL is not running (or not reachable on the default port).');
if (!foundBinary) {
  console.error('  (pg_isready was not found on PATH either — is PostgreSQL installed?)');
}
console.error('\nStart it, then re-run `npm run dev`. On macOS with Homebrew:');
console.error('  brew services start postgresql@16\n');
process.exit(1);
