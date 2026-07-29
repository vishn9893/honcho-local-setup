const DEFAULTS = {
  honchoPort: "8000",
  ollamaPort: "11434",
  llmModel: "qwen3.5:27b",
  embeddingModel: "qwen3-embedding:4b",
  workspaceId: "pi",
  peerName: "user",
  aiPeer: "pi",
  sessionStrategy: "repo",
  contextTokens: "1200",
  maxMessageLength: "8000",
  searchLimit: "8",
  toolPreviewLength: "500",
  localApiKey: "local-dev",
  cloudHonchoUrl: "https://api.honcho.dev",
};

const SESSION_STRATEGIES = new Set(["repo", "git-branch", "directory"]);

function valueOf(options, key) {
  return options[key] === undefined || options[key] === ""
    ? DEFAULTS[key]
    : String(options[key]);
}

function localHonchoUrl(options) {
  if (options.honchoUrl) {
    return options.honchoUrl;
  }
  if (!options.hostLanIp) {
    throw new Error("--host-lan-ip is required for local mode");
  }
  return `http://${options.hostLanIp}:${valueOf(options, "honchoPort")}`;
}

function validateSessionStrategy(strategy) {
  if (!SESSION_STRATEGIES.has(strategy)) {
    throw new Error(
      `Invalid session strategy "${strategy}". Use repo, git-branch, or directory.`,
    );
  }
}

function buildLocalEnv(options = {}) {
  return [
    "# Copy this file to .env.local inside the official Honcho repo.",
    "# This config points Honcho containers at local Ollama.",
    "",
    "AUTH_USE_AUTH=false",
    "",
    "OPENAI_BASE_URL=http://host.docker.internal:11434/v1",
    "OPENAI_API_KEY=ollama",
    "",
    `LLM_MODEL=${valueOf(options, "llmModel")}`,
    `EMBEDDING_MODEL=${valueOf(options, "embeddingModel")}`,
    "",
    "ENVIRONMENT=local",
    "LOG_LEVEL=info",
    "",
  ].join("\n");
}

function buildLocalComposeOverride(options = {}) {
  return [
    "services:",
    "  api:",
    "    ports:",
    `      - "0.0.0.0:${valueOf(options, "honchoPort")}:8000"`,
    "    env_file:",
    "      - .env.local",
    "    extra_hosts:",
    '      - "host.docker.internal:host-gateway"',
    "",
    "  deriver:",
    "    env_file:",
    "      - .env.local",
    "    extra_hosts:",
    '      - "host.docker.internal:host-gateway"',
    "",
  ].join("\n");
}

function buildPiEnv(options = {}) {
  const mode = options.mode || "local";
  const sessionStrategy = valueOf(options, "sessionStrategy");
  validateSessionStrategy(sessionStrategy);

  const honchoUrl =
    mode === "local"
      ? localHonchoUrl(options)
      : options.honchoUrl || DEFAULTS.cloudHonchoUrl;
  const apiKey =
    mode === "local"
      ? options.honchoApiKey || DEFAULTS.localApiKey
      : options.honchoApiKey;

  if (!apiKey) {
    throw new Error("--honcho-api-key is required for cloud mode");
  }

  return [
    "# Source this file before starting pi, or copy values into your shell profile.",
    "# These names align with agneym/pi-honcho-memory.",
    "",
    `HONCHO_API_KEY=${apiKey}`,
    `HONCHO_URL=${honchoUrl}`,
    `HONCHO_WORKSPACE_ID=${valueOf(options, "workspaceId")}`,
    `HONCHO_PEER_NAME=${valueOf(options, "peerName")}`,
    `HONCHO_AI_PEER=${valueOf(options, "aiPeer")}`,
    `HONCHO_SESSION_STRATEGY=${sessionStrategy}`,
    `HONCHO_CONTEXT_TOKENS=${valueOf(options, "contextTokens")}`,
    `HONCHO_MAX_MESSAGE_LENGTH=${valueOf(options, "maxMessageLength")}`,
    `HONCHO_SEARCH_LIMIT=${valueOf(options, "searchLimit")}`,
    `HONCHO_TOOL_PREVIEW_LENGTH=${valueOf(options, "toolPreviewLength")}`,
    "",
  ].join("\n");
}

function buildPiConfigJson(options = {}) {
  const mode = options.mode || "local";
  const sessionStrategy = valueOf(options, "sessionStrategy");
  validateSessionStrategy(sessionStrategy);

  const config = {
    apiKey:
      mode === "local"
        ? options.honchoApiKey || DEFAULTS.localApiKey
        : options.honchoApiKey,
    peerName: valueOf(options, "peerName"),
    hosts: {
      pi: {
        workspace: valueOf(options, "workspaceId"),
        aiPeer: valueOf(options, "aiPeer"),
        endpoint:
          mode === "local"
            ? localHonchoUrl(options)
            : options.honchoUrl || DEFAULTS.cloudHonchoUrl,
        sessionStrategy,
        contextTokens: Number(valueOf(options, "contextTokens")),
        maxMessageLength: Number(valueOf(options, "maxMessageLength")),
        searchLimit: Number(valueOf(options, "searchLimit")),
        toolPreviewLength: Number(valueOf(options, "toolPreviewLength")),
      },
    },
  };

  if (!config.apiKey) {
    throw new Error("--honcho-api-key is required for cloud mode");
  }

  return `${JSON.stringify(config, null, 2)}\n`;
}

function buildCloudEnv(options = {}) {
  return buildPiEnv({ ...options, mode: "cloud" });
}

function parseArgs(args) {
  const parsed = {};
  const [command, ...rest] = args;
  parsed.command = command;

  for (let index = 0; index < rest.length; index += 1) {
    const arg = rest[index];
    if (!arg.startsWith("--")) {
      throw new Error(`Unexpected argument: ${arg}`);
    }

    const key = arg.slice(2).replace(/-([a-z])/g, (_, char) => char.toUpperCase());
    const value = rest[index + 1];
    if (!value || value.startsWith("--")) {
      throw new Error(`Missing value for ${arg}`);
    }
    parsed[key] = value;
    index += 1;
  }

  return parsed;
}

module.exports = {
  buildCloudEnv,
  buildLocalComposeOverride,
  buildLocalEnv,
  buildPiConfigJson,
  buildPiEnv,
  parseArgs,
};
