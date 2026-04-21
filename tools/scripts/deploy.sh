#!/usr/bin/env bash
# tools/scripts/deploy.sh
#
# Push pwa-main to GitHub AND explicitly trigger a Railway redeploy.
# Required because Railway's GitHub webhook is unreliable (see TD-008).
# Usage: ./tools/scripts/deploy.sh  or  pnpm deploy

set -euo pipefail

RAILWAY_PROJECT_ID="e6bafc72-7659-4aa4-9371-67ab6b0bef35"
RAILWAY_SERVICE_ID="065fd211-8a8e-421c-af41-556b72af4b07"
RAILWAY_ENV_ID="454461ea-46fd-47c3-af6e-0b87e702153a"
RAILWAY_API="https://backboard.railway.com/graphql/v2"
LIVE_URL="https://openpdf-studio-production-462c.up.railway.app"

# ── 1. Push to GitHub ─────────────────────────────────────────────────────────
echo "→ Pushing to origin/pwa-main..."
git push origin pwa-main
echo "✓ GitHub up to date"

# ── 2. Trigger Railway redeploy ───────────────────────────────────────────────
echo "→ Triggering Railway deploy (serviceInstanceDeploy latestCommit=true)..."

# Resolve token: env var wins, then Railway CLI config, then prompt
if [[ -z "${RAILWAY_TOKEN:-}" ]]; then
  CLI_TOKEN=$(railway whoami --json 2>/dev/null | jq -r '.token // empty' 2>/dev/null || true)
  RAILWAY_TOKEN="${CLI_TOKEN:-}"
fi

if [[ -z "${RAILWAY_TOKEN:-}" ]]; then
  echo ""
  echo "  No RAILWAY_TOKEN found. Options:"
  echo "    a) export RAILWAY_TOKEN=<token> before running this script"
  echo "    b) run 'railway login' to authenticate the CLI"
  echo ""
  echo "  Alternatively, trigger manually via Railway dashboard:"
  echo "    https://railway.com/project/${RAILWAY_PROJECT_ID}/service/${RAILWAY_SERVICE_ID}"
  exit 1
fi

RESPONSE=$(curl -sS -X POST "${RAILWAY_API}" \
  -H "Authorization: Bearer ${RAILWAY_TOKEN}" \
  -H "Content-Type: application/json" \
  -d "{
    \"query\": \"mutation { serviceInstanceDeploy(serviceId: \\\"${RAILWAY_SERVICE_ID}\\\", environmentId: \\\"${RAILWAY_ENV_ID}\\\", latestCommit: true) }\"
  }")

DEPLOY_ID=$(echo "${RESPONSE}" | jq -r '.data.serviceInstanceDeploy // empty' 2>/dev/null || true)

if [[ -z "${DEPLOY_ID}" || "${DEPLOY_ID}" == "null" ]]; then
  echo "  ✗ Deploy trigger failed. Raw response:"
  echo "  ${RESPONSE}"
  echo ""
  echo "  Trigger manually: railway.com/project/${RAILWAY_PROJECT_ID}/service/${RAILWAY_SERVICE_ID}"
  exit 1
fi

echo "✓ Deploy triggered (deployment: ${DEPLOY_ID})"
echo ""
echo "  Watch build: https://railway.com/project/${RAILWAY_PROJECT_ID}/service/${RAILWAY_SERVICE_ID}"
echo "  Live URL:    ${LIVE_URL}"
