#!/usr/bin/env bash
set -euo pipefail

HONCHO_PORT=8000
OLLAMA_PORT=11434
HOST_LAN_IP=""

usage() {
  cat <<'USAGE'
Usage:
  ./scripts/check-connectivity.sh --host-lan-ip 192.168.1.25 [--honcho-port 8000] [--ollama-port 11434]

Checks:
  - Honcho health from localhost
  - Honcho health through the host LAN IP
  - Ollama OpenAI-compatible models endpoint from localhost

Works on macOS, Linux, WSL, and Git Bash for Windows when curl is available.
USAGE
}

require_value() {
  local option="$1"
  local value="${2:-}"

  if [[ -z "$value" || "$value" == --* ]]; then
    echo "Missing value for ${option}" >&2
    usage >&2
    exit 2
  fi
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --host-lan-ip)
      require_value "$1" "${2:-}"
      HOST_LAN_IP="${2:-}"
      shift 2
      ;;
    --honcho-port)
      require_value "$1" "${2:-}"
      HONCHO_PORT="${2:-}"
      shift 2
      ;;
    --ollama-port)
      require_value "$1" "${2:-}"
      OLLAMA_PORT="${2:-}"
      shift 2
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      echo "Unknown argument: $1" >&2
      usage >&2
      exit 2
      ;;
  esac
done

if [[ -z "$HOST_LAN_IP" ]]; then
  echo "Missing required argument: --host-lan-ip" >&2
  usage >&2
  exit 2
fi

if ! command -v curl >/dev/null 2>&1; then
  echo "curl is required but was not found on PATH." >&2
  exit 1
fi

check_url() {
  local name="$1"
  local url="$2"

  echo "Checking ${name} at ${url}"
  local status
  status="$(curl -fsS -o /dev/null -w '%{http_code}' --connect-timeout 5 --max-time 10 "$url")"
  echo "OK ${name} returned HTTP ${status}"
}

check_url "Honcho local health" "http://localhost:${HONCHO_PORT}/health"
check_url "Honcho LAN health" "http://${HOST_LAN_IP}:${HONCHO_PORT}/health"
check_url "Ollama local models" "http://localhost:${OLLAMA_PORT}/v1/models"

echo "Connectivity checks completed."
