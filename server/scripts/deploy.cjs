#!/usr/bin/env node
const { spawnSync } = require("node:child_process");
const { PrismaClient } = require("@prisma/client");
const dotenv = require("dotenv");
const fs = require("node:fs");
const path = require("node:path");

const envCandidates = [
  path.resolve(__dirname, "..", ".env"),
  path.resolve(__dirname, "..", "..", ".env")
];

for (const envPath of envCandidates) {
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
  }
}

function run(command, args) {
  const result = spawnSync(command, args, {
    cwd: process.cwd(),
    env: process.env,
    shell: true,
    stdio: "inherit"
  });

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

async function main() {
  run("prisma", ["migrate", "deploy"]);

  const prisma = new PrismaClient();
  try {
    const comicsCount = await prisma.comic.count();
    if (comicsCount === 0) {
      run("tsx", ["prisma/seed.ts"]);
    } else {
      console.log(`Database already contains ${comicsCount} comics; seed skipped.`);
    }
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
