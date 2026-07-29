#!/usr/bin/env node
const { mkdirSync, writeFileSync } = require("node:fs");
const { join, resolve } = require("node:path");

const {
  buildLocalComposeOverride,
  buildLocalEnv,
  buildPiConfigJson,
  buildPiEnv,
  parseArgs,
} = require("../lib/config-generator");

function usage() {
  console.log(`Usage:
  pirecall init --mode local --host-lan-ip 192.168.1.25 [--out .]
  pirecall init --mode cloud --honcho-api-key hch-... [--honcho-url https://api.honcho.dev] [--out .]

Options:
  --mode local|cloud
  --out DIRECTORY
  --host-lan-ip IP_ADDRESS       Required for local mode unless --honcho-url is set
  --honcho-url URL               Honcho API URL for pi-honcho-memory
  --honcho-api-key KEY           Required for cloud mode; optional dummy override for local mode
  --workspace-id VALUE           Default: pi
  --peer-name VALUE              Default: user
  --ai-peer VALUE                Default: pi
  --session-strategy VALUE       repo, git-branch, or directory
  --honcho-port PORT             Default: 8000
  --llm-model MODEL              Default: qwen3.5:27b
  --embedding-model MODEL        Default: qwen3-embedding:4b
`);
}

function writeFile(path, contents) {
  writeFileSync(path, contents, "utf8");
  console.log(`wrote ${path}`);
}

function main() {
  const args = process.argv.slice(2);
  if (args.includes("--help") || args.includes("-h") || args.length === 0) {
    usage();
    return;
  }

  const options = parseArgs(args);
  if (options.command !== "init") {
    throw new Error(`Unknown command: ${options.command}`);
  }

  const mode = options.mode || "local";
  if (mode !== "local" && mode !== "cloud") {
    throw new Error("--mode must be local or cloud");
  }

  const outDir = resolve(options.out || ".");
  mkdirSync(outDir, { recursive: true });

  if (mode === "local") {
    writeFile(join(outDir, ".env.local"), buildLocalEnv(options));
    writeFile(
      join(outDir, "docker-compose.override.yml"),
      buildLocalComposeOverride(options),
    );
  }

  writeFile(join(outDir, "pi-honcho.env"), buildPiEnv({ ...options, mode }));
  writeFile(
    join(outDir, "honcho-config.json"),
    buildPiConfigJson({ ...options, mode }),
  );
}

try {
  main();
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
