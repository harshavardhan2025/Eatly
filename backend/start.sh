#!/bin/bash

# start.sh
# Production startup script for FastAPI using Uvicorn with multiple workers.

# Set default host and port if not provided by the environment
HOST=${HOST:-"0.0.0.0"}
PORT=${PORT:-8000}

# Usually a good rule of thumb is 2-4 workers per CPU core.
# We default to 4 for a typical small/medium instance.
WORKERS=${WORKERS:-4}

echo "Starting Uvicorn server..."
echo "Host: $HOST, Port: $PORT, Workers: $WORKERS"

# Start the application
uvicorn app.main:app --host $HOST --port $PORT --workers $WORKERS
