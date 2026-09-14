#!/bin/bash

# AgentSocial Development Startup Script
# Starts both frontend and backend in development mode

echo "Starting AgentSocial development environment..."

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
  echo "Error: Please run this script from the agentsocial directory"
  exit 1
fi

# Start backend in background
echo "Starting backend..."
cd packages/backend
npm run dev &
BACKEND_PID=$!
cd ../..

# Give backend a moment to start
sleep 3

# Start frontend in background
echo "Starting frontend..."
cd packages/frontend
npm run dev &
FRONTEND_PID=$!
cd ../..

echo "AgentSocial development environment started!"
echo "Backend running on http://localhost:3001"
echo "Frontend running on http://localhost:3000"
echo ""
echo "To stop both processes, run:"
echo "kill $BACKEND_PID $FRONTEND_PID"
echo "or simply close this terminal"

# Wait for both processes
wait $BACKEND_PID $FRONTEND_PID