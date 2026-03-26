#!/bin/bash

set -euo pipefail

echo "Starting LiveGate Backend Services on Railway"
echo "=============================================="

PORT=${PORT:-3000}
SERVER_PORT=${SERVER_PORT:-8080}
PYTHON_SERVICE_PORT=${PYTHON_SERVICE_PORT:-8000}
SERVICE_TYPE=${SERVICE_TYPE:-all}

export NODE_ENV=${NODE_ENV:-production}
export PORT
export SERVER_PORT
export JAVA_FINANCE_URL=${JAVA_FINANCE_URL:-http://127.0.0.1:${SERVER_PORT}}
export PYTHON_INTELLIGENCE_URL=${PYTHON_INTELLIGENCE_URL:-http://127.0.0.1:${PYTHON_SERVICE_PORT}}
export PYTHON_DATABASE_URL=${PYTHON_DATABASE_URL:-}
export PYTHON_SOURCE_DATABASE_URL=${PYTHON_SOURCE_DATABASE_URL:-}

PIDS=()

cleanup() {
  local exit_code=${1:-0}

  trap - EXIT INT TERM

  for pid in "${PIDS[@]:-}"; do
    kill "$pid" 2>/dev/null || true
  done

  wait || true
  exit "$exit_code"
}

trap 'cleanup $?' EXIT INT TERM

wait_for_port() {
  local name="$1"
  local port="$2"
  local attempts="${3:-30}"

  while [ "$attempts" -gt 0 ]; do
    if (echo >"/dev/tcp/127.0.0.1/${port}") >/dev/null 2>&1; then
      echo "${name} is accepting connections on port ${port}"
      return 0
    fi

    attempts=$((attempts - 1))
    sleep 1
  done

  echo "${name} did not open port ${port} in time"
  return 1
}

start_java() {
  echo "Starting Java service on port ${SERVER_PORT}..."
  (
    cd /app/java-service
    exec java -Dserver.port="${SERVER_PORT}" -Dserver.address=127.0.0.1 -jar target/java-service-1.0.0.jar
  ) &
  PIDS+=($!)
}

start_python() {
  if [ -z "${PYTHON_DATABASE_URL}" ]; then
    echo "PYTHON_DATABASE_URL must be set for the Python service"
    exit 1
  fi

  if [ -z "${PYTHON_SOURCE_DATABASE_URL}" ] && [ -n "${DATABASE_URL:-}" ]; then
    PYTHON_SOURCE_DATABASE_URL=$(printf '%s' "${DATABASE_URL}" | sed 's#^mysql://#mysql+aiomysql://#')
  fi

  if [ -z "${PYTHON_SOURCE_DATABASE_URL}" ]; then
    echo "PYTHON_SOURCE_DATABASE_URL must be set for the Python service"
    exit 1
  fi

  echo "Starting Python service on port ${PYTHON_SERVICE_PORT}..."
  (
    cd /app/python-service
    export PORT="${PYTHON_SERVICE_PORT}"
    export DATABASE_URL="${PYTHON_DATABASE_URL}"
    export SOURCE_DATABASE_URL="${PYTHON_SOURCE_DATABASE_URL}"
    exec python -m uvicorn app.main:app --host 127.0.0.1 --port "${PYTHON_SERVICE_PORT}"
  ) &
  PIDS+=($!)
}

start_node() {
  echo "Starting Node.js service on port ${PORT}..."
  (
    cd /app/nodejs-service
    exec npm run start
  ) &
  PIDS+=($!)
}

case "$SERVICE_TYPE" in
  "all")
    start_java
    start_python
    wait_for_port "Java service" "${SERVER_PORT}" || true
    wait_for_port "Python service" "${PYTHON_SERVICE_PORT}" || true
    start_node
    ;;
  "java")
    start_java
    ;;
  "python")
    start_python
    ;;
  "nodejs")
    start_node
    ;;
  *)
    echo "Unknown SERVICE_TYPE: ${SERVICE_TYPE}"
    exit 1
    ;;
esac

wait -n
