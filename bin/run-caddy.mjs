#!/usr/bin/env node

// Launches the custom Caddy build for this platform (see build-caddy.sh) rather
// than a stock `caddy` on PATH — stock Caddy can't parse the Caddyfile's
// `layer4` block at all, so falling back to it silently would just fail.
// A .mjs script (not a shell conditional) is what handles the platform branch,
// since `client:release` runs through whatever shell each OS's pnpm uses
// (bash vs. cmd/PowerShell) and Node is the one thing both sides share.

import { existsSync } from 'node:fs';
import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const bin_dir = path.dirname(fileURLToPath(import.meta.url));
const repo_root = path.join(bin_dir, '..');

const BINARIES = {
  darwin: 'caddy-l4-macos',
  win32: 'caddy-l4-windows.exe',
};

const binary_name = BINARIES[process.platform];
if (!binary_name) {
  console.error(
    `No custom caddy-l4 build is configured for platform "${process.platform}".\n`,
    `Add a build target in bin/build-caddy.sh and register it in BINARIES here.`,
  );
  process.exit(1);
}

const binary_path = path.join(bin_dir, binary_name);
if (!existsSync(binary_path)) {
  const target = process.platform === 'win32' ? 'windows' : 'macos';
  console.error(
    `${binary_path} not found. Build it first with:\n`,
    `bin/build-caddy.sh ${target}`,
  );
  process.exit(1);
}

const child = spawn(binary_path, ['run', '--config', 'Caddyfile'], {
  cwd: repo_root,
  stdio: 'inherit',
});

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => child.kill(signal));
}

child.on('exit', (code, signal) => {
  if (signal) process.kill(process.pid, signal);
  else process.exit(code ?? 0);
});
