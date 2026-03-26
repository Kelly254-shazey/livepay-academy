#!/bin/bash

# Backend services runner for Railway
set -e

echo "Starting LiveGate Backend Services on Railway"
echo "=============================================="

# Get the PORT from Railway environment (defaults to 3000)
PORT=${PORT:-3000}
echo "Using PORT: $PORT"

# Determine which service to run based on SERVICE_TYPE env variable
SERVICE_TYPE=${SERVICE_TYPE:-"nodejs"}

case $SERVICE_TYPE in
  "java")
    echo "Starting Java Service on port 8080..."
    cd /app/java-service
    exec java -Dserver.port=8080 -jar target/java-service-1.0.0.jar
    ;;
    
  "nodejs")
    echo "Starting Node.js Service on port $PORT..."
    cd /app/nodejs-service
    exec npm run start
    ;;
    
  "python")
    echo "Starting Python Service on port 8000..."
    cd /app/python-service
    exec uvicorn app.main:app --host 0.0.0.0 --port 8000
    ;;
    
  *)
    echo "Unknown SERVICE_TYPE: $SERVICE_TYPE"
    exit 1
    ;;
esac
