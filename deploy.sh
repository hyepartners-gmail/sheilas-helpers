#!/usr/bin/env bash
set -euo pipefail
# load local.env if it exists 
[ -f local.env ] && { set -a; source local.env; set +a; }
[ -f .env ] && { set -a; source .env; set +a; }

# Pick any .aiff in /System/Library/Sounds  (or point to your own .wav/.mp3)
SUCCESS_SOUND="/System/Library/Sounds/Ping.aiff"
FAIL_SOUND="/System/Library/Sounds/Basso.aiff"
STARTUP_SOUND="/System/Library/Sounds/Hero.aiff"

afplay "$STARTUP_SOUND" 
trap 'afplay "$FAIL_SOUND"' ERR

#############################################
# CONFIG — override with env vars if needed #
#############################################
REGION="us-central1"
SERVICE_NAME="sheilas-helpers"
REPO="sheilas-helpers" 
PORT=3000              

# Build tag = short git SHA or 'latest' fallback
IMAGE_TAG="$(git rev-parse --short HEAD || echo latest)"

IMAGE_URI="${REGION}-docker.pkg.dev/${PROJECT_ID}/${REPO}/${SERVICE_NAME}:${IMAGE_TAG}"

#############################################
# 1) Build & push with Cloud Build (amd64)
#############################################
echo "➜ Submitting build to Cloud Build"
gcloud builds submit --tag "${IMAGE_URI}" .

#############################################
# 2) Deploy to Cloud Run
#############################################
echo "➜ Deploying to Cloud Run service '${SERVICE_NAME}'"
gcloud run deploy "${SERVICE_NAME}" \
  --image "${IMAGE_URI}" \
  --region "${REGION}" \
  --platform managed \
  --allow-unauthenticated \
  --port "${PORT}" \
  --min-instances 0 \
  --max-instances 3 \
  --set-env-vars \ "VITE_USE_MOCK_DATA=false,PROJECT_ID=${PROJECT_ID:-changeme},NODE_ENV=production,JWT_SECRET=${JWT_SECRET:-changeme},SESSION_SECRET=${SESSION_SECRET:-changeme},GOOGLE_CLIENT_ID=${GOOGLE_CLIENT_ID:-},GOOGLE_CLIENT_SECRET=${GOOGLE_CLIENT_SECRET:-},GMAIL_CLIENT_ID=${GMAIL_CLIENT_ID:-},GMAIL_CLIENT_SECRET=${GMAIL_CLIENT_SECRET:-},API_BASE_URL=${API_BASE_URL:-changeme},FRONTEND_URL=${FRONTEND_URL:-changeme},VITE_API_BASE_URL=${VITE_API_BASE_URL:-changeme}" \

echo "✅ Deployed ${SERVICE_NAME} (${IMAGE_TAG}) to Cloud Run."

afplay "$SUCCESS_SOUND" 