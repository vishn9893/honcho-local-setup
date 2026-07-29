# PiRecall Honcho Setup

Config generator and copy-ready local Honcho setup for Pi memory experiments. It supports both Honcho Cloud and a local Honcho + Ollama instance reachable from a Raspberry Pi or other LAN machine.

This repository is not a Honcho fork and does not replace the Pi extension. It is a companion setup package for `agneym/pi-honcho-memory`, which reads `HONCHO_API_KEY`, `HONCHO_URL`, workspace, peer, and session settings from environment variables or `~/.honcho/config.json`.

## Why this exists

Coding agents often forget project context, preferences, and decisions between sessions. Honcho can act as a long-term memory service, while a local setup keeps the memory service and model calls on your own network for experiments.

This setup is inspired by and aligned with:

- Honcho's Pi memory guide: https://honcho.dev/docs/v3/guides/community/pi-honcho-memory
- The Pi memory extension: https://github.com/agneym/pi-honcho-memory
- A local Honcho setup pattern: https://github.com/nidhi-singh02/honcho-local-setup

## What this setup assumes

- Honcho runs on your main computer with Docker Compose.
- Ollama runs on the same computer.
- A Raspberry Pi or another client machine connects over your LAN.
- Honcho containers call Ollama through `host.docker.internal`.
- Your Pi/client calls Honcho through your computer's LAN IP.

## Files

- `.env.example`: safe example values for a local Honcho + Ollama setup.
- `docker-compose.override.yml`: exposes the Honcho API on the LAN and loads local env values into Honcho services.
- `bin/pirecall.js`: dependency-free CLI for generating cloud or local Pi/Honcho config.
- `lib/config-generator.js`: testable config generator used by the CLI.
- `scripts/check-connectivity.ps1`: quick Windows/PowerShell connectivity checks from the host machine.
- `scripts/check-connectivity.sh`: quick Bash connectivity checks for macOS, Linux, WSL, or Git Bash.

## Package usage

Install from this repo while it is in early development:

```bash
npm install -g github:vishn9893/honcho-local-setup
```

Generate local Honcho + local Pi extension config:

```bash
pirecall init --mode local --host-lan-ip 192.168.1.25 --out ./pirecall-out
```

This writes:

- `.env.local`: server-side Honcho config for Docker + Ollama.
- `docker-compose.override.yml`: exposes Honcho on `0.0.0.0:8000`.
- `pi-honcho.env`: shell env vars for `agneym/pi-honcho-memory`.
- `honcho-config.json`: content you can copy to `~/.honcho/config.json`.

Generate cloud config instead:

```bash
pirecall init --mode cloud --honcho-api-key hch-v3-your-key --out ./pirecall-out
```

Cloud mode writes only the Pi extension config files. Local mode additionally writes the Honcho Docker/Ollama files.

## Quick start

Clone Honcho first:

```bash
git clone https://github.com/plastic-labs/honcho.git
cd honcho
cp docker-compose.yml.example docker-compose.yml
```

Copy this repo's setup files into the Honcho repo:

```bash
cp /path/to/honcho-local-setup/.env.example .env.local
cp /path/to/honcho-local-setup/docker-compose.override.yml .
```

Pull local models:

```bash
ollama pull qwen3-embedding:4b
ollama pull qwen3.5:27b
```

Start Honcho:

```bash
docker compose up -d --build
```

## Configure the Pi or LAN client

Use your host computer's LAN IP, not `localhost`, not `0.0.0.0`, and not `host.docker.internal`.

Example:

```text
http://192.168.1.25:8000
```

`host.docker.internal` is only for Docker containers on the host machine calling Ollama on the host machine.

For `agneym/pi-honcho-memory`, local mode points Pi at that LAN URL with:

```bash
export HONCHO_API_KEY=local-dev
export HONCHO_URL=http://192.168.1.25:8000
export HONCHO_WORKSPACE_ID=pi
export HONCHO_PEER_NAME=user
export HONCHO_AI_PEER=pi
export HONCHO_SESSION_STRATEGY=repo
```

The dummy `local-dev` key is only for auth-disabled local demos. Hosted Honcho still needs a real API key.

## Verify

From the host machine:

```bash
curl http://localhost:8000/health
docker compose logs --tail=50 api deriver
docker compose exec api curl -sS http://host.docker.internal:11434/v1/models
```

From the Raspberry Pi or LAN client:

```bash
curl http://YOUR_HOST_LAN_IP:8000/health
```

If the LAN client cannot reach that URL, fix networking before debugging memory behavior.

On macOS, Linux, WSL, or Git Bash for Windows, you can also run:

```bash
./scripts/check-connectivity.sh --host-lan-ip 192.168.1.25
```

On Windows PowerShell, you can run:

```powershell
.\scripts\check-connectivity.ps1 -HostLanIp 192.168.1.25
```

## Security note

The example env file sets:

```text
AUTH_USE_AUTH=false
```

That is acceptable only for a trusted local-network demo. If you expose Honcho outside your machine or LAN, turn authentication on and use a real JWT setup.

Do not commit real API keys, production secrets, or private memory exports to this repository.
