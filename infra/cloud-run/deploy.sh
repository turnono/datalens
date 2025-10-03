#!/bin/bash

# Deploy MCP server to Cloud Run
set -e

PROJECT_ID="tjr-datalens"
SERVICE_NAME="mcp-server"
REGION="us-central1"
IMAGE_NAME="gcr.io/${PROJECT_ID}/${SERVICE_NAME}"

echo "Building and deploying MCP server to Cloud Run..."

# Build the Docker image
docker build -t ${IMAGE_NAME} .

# Push to Google Container Registry
docker push ${IMAGE_NAME}

# Deploy to Cloud Run
gcloud run deploy ${SERVICE_NAME} \
  --image ${IMAGE_NAME} \
  --platform managed \
  --region ${REGION} \
  --allow-unauthenticated \
  --port 8077 \
  --set-env-vars DC_API_KEY=${DC_API_KEY} \
  --project ${PROJECT_ID}

echo "MCP server deployed successfully!"
echo "Service URL: https://${SERVICE_NAME}-${PROJECT_ID}.${REGION}.run.app"