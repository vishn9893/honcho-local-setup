const assert = require("node:assert/strict");
const test = require("node:test");

const {
  buildCloudEnv,
  buildLocalEnv,
  buildLocalComposeOverride,
  buildPiEnv,
  buildPiConfigJson,
  parseArgs,
} = require("../lib/config-generator");

test("buildLocalEnv emits local Ollama defaults and disables auth for LAN demos", () => {
  const env = buildLocalEnv({
    llmModel: "qwen3.5:27b",
    embeddingModel: "qwen3-embedding:4b",
  });

  assert.match(env, /AUTH_USE_AUTH=false/);
  assert.match(env, /OPENAI_BASE_URL=http:\/\/host\.docker\.internal:11434\/v1/);
  assert.match(env, /LLM_MODEL=qwen3\.5:27b/);
  assert.match(env, /EMBEDDING_MODEL=qwen3-embedding:4b/);
});

test("buildPiEnv emits cloud Honcho settings using pi-honcho-memory env names", () => {
  const env = buildPiEnv({
    mode: "cloud",
    honchoApiKey: "honcho_test_key",
    honchoUrl: "https://api.honcho.dev",
    workspaceId: "pi",
    peerName: "vish",
    aiPeer: "pi",
    sessionStrategy: "git-branch",
  });

  assert.match(env, /HONCHO_API_KEY=honcho_test_key/);
  assert.match(env, /HONCHO_URL=https:\/\/api\.honcho\.dev/);
  assert.match(env, /HONCHO_WORKSPACE_ID=pi/);
  assert.match(env, /HONCHO_PEER_NAME=vish/);
  assert.match(env, /HONCHO_AI_PEER=pi/);
  assert.match(env, /HONCHO_SESSION_STRATEGY=git-branch/);
});

test("buildPiEnv emits local Honcho URL with a dummy key for auth-disabled local demos", () => {
  const env = buildPiEnv({
    mode: "local",
    hostLanIp: "192.168.1.25",
  });

  assert.match(env, /HONCHO_API_KEY=local-dev/);
  assert.match(env, /HONCHO_URL=http:\/\/192\.168\.1\.25:8000/);
  assert.match(env, /HONCHO_SESSION_STRATEGY=repo/);
});

test("buildPiConfigJson emits ~/.honcho/config.json compatible with agneym/pi-honcho-memory", () => {
  const config = JSON.parse(
    buildPiConfigJson({
      mode: "local",
      hostLanIp: "192.168.1.25",
      peerName: "vish",
    }),
  );

  assert.equal(config.apiKey, "local-dev");
  assert.equal(config.peerName, "vish");
  assert.equal(config.hosts.pi.endpoint, "http://192.168.1.25:8000");
  assert.equal(config.hosts.pi.workspace, "pi");
  assert.equal(config.hosts.pi.sessionStrategy, "repo");
});

test("buildCloudEnv emits cloud Honcho API settings", () => {
  const env = buildCloudEnv({
    honchoApiKey: "honcho_test_key",
    honchoUrl: "https://api.honcho.dev",
  });

  assert.match(env, /HONCHO_API_KEY=honcho_test_key/);
  assert.match(env, /HONCHO_URL=https:\/\/api\.honcho\.dev/);
  assert.doesNotMatch(env, /AUTH_USE_AUTH=false/);
});

test("buildLocalComposeOverride exposes Honcho on the requested LAN port", () => {
  const compose = buildLocalComposeOverride({ honchoPort: "9000" });

  assert.match(compose, /"0\.0\.0\.0:9000:8000"/);
  assert.match(compose, /host\.docker\.internal:host-gateway/);
});

test("parseArgs supports local and cloud modes", () => {
  assert.deepEqual(
    parseArgs(["init", "--mode", "local", "--host-lan-ip", "192.168.1.25"]),
    {
      command: "init",
      mode: "local",
      hostLanIp: "192.168.1.25",
    },
  );

  assert.deepEqual(
    parseArgs(["init", "--mode", "cloud", "--honcho-api-key", "key"]),
    {
      command: "init",
      mode: "cloud",
      honchoApiKey: "key",
    },
  );
});
