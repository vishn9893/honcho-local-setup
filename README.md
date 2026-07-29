# PiRecall Honcho Local Setup

Copy-ready local Honcho configuration for agent memory experiments: Honcho in Docker, Ollama for local models, and a Raspberry Pi or other LAN machine connecting to the Honcho API.

This repository is not a Honcho fork. Use the official Honcho repository as the runtime, then copy these files into it as a small local setup layer.

## Why this exists

Coding agents often forget project context, preferences, and decisions between sessions. Honcho can act as a long-term memory service, while a local setup keeps the memory service and model calls on your own network for experiments.

This setup is inspired by:

- Honcho's Pi memory guide: https://honcho.dev/docs/v3/guides/community/pi-honcho-memory
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
- `scripts/check-connectivity.ps1`: quick Windows/PowerShell connectivity checks from the host machine.

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

On Windows, you can also run:

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

## Name

The working name for this local setup is **PiRecall**: small, direct, and tied to Raspberry Pi memory experiments.
