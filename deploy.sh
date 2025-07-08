#!/usr/bin/env bash
set -euo pipefail

#############################################
# CONFIG — override with env vars if needed #
#############################################
PROJECT_ID="hyepartners-324923474516"         # gcloud config set project …
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
  --set-env-vars "NODE_ENV=production" \
  --set-env-vars "JWT_SECRET=${JWT_SECRET:-changeme}" \
  --set-env-vars "SESSION_SECRET=${SESSION_SECRET:-changeme}" \
  --set-env-vars "GOOGLE_CLIENT_ID=${GOOGLE_CLIENT_ID:-}" \
  --set-env-vars "GOOGLE_CLIENT_SECRET=${GOOGLE_CLIENT_SECRET:-}" \
  --set-env-vars "GMAIL_CLIENT_ID=${GMAIL_CLIENT_ID:-}" \
  --set-env-vars "GMAIL_CLIENT_SECRET=${GMAIL_CLIENT_SECRET:-}"

echo "✅ Deployed ${SERVICE_NAME} (${IMAGE_TAG}) to Cloud Run."
