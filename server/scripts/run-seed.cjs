#!/usr/bin/env node
const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const dotenv = require('dotenv');

const envCandidates = [
  path.resolve(__dirname, '..', '.env'),
  path.resolve(__dirname, '..', '..', '.env')
];

for (const envPath of envCandidates) {
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
  }
}

const result = spawnSync('tsx', ['prisma/seed.ts'], {
  stdio: 'inherit',
  shell: true,
  env: process.env,
  cwd: path.resolve(__dirname, '..')
});

if (typeof result.status === 'number') {
  process.exit(result.status);
}

process.exit(1);
