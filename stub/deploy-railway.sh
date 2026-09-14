#!/bin/bash
echo "Creating Railway project..."

# Create project via API
curl -s -X POST https://backboard.railway.app/v1/projects \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $RAILWAY_TOKEN" \
  -d '{"name": "agentsocial-stub"}'

echo "Project created. Now deploying..."
railway up
